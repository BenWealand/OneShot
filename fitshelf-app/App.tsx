import "react-native-gesture-handler";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { AvatarPanel } from "./src/components/AvatarPanel";
import { AuthPanel } from "./src/components/AuthPanel";
import { LibraryPanel } from "./src/components/LibraryPanel";
import { OutfitBuilder } from "./src/components/OutfitBuilder";
import { SavedOutfits } from "./src/components/SavedOutfits";
import { TryOnPanel } from "./src/components/TryOnPanel";
import { pickImage } from "./src/lib/imagePicker";
import { ensureSupabaseProfile, handleSupabaseAuthCallback, isSupabaseConfigured, supabase, testSupabaseAssetUpload, testSupabaseConnection, testSupabaseDbWrite } from "./src/lib/supabase";
import { deleteClothingRecord, deleteMannequinRecord, loadClothing, loadMannequins, loadOutfits, saveClothing, saveMannequins, saveOutfits, uploadAsset } from "./src/lib/storage";
import type { ClothingCategory, ClothingItem, Mannequin, Outfit, OutfitLayer, UserSession } from "./src/types/models";

const categories: ClothingCategory[] = ["top", "bottom", "outerwear", "dress", "shoe", "accessory"];
const sections = ["try-on", "avatar", "closet", "manual"] as const;
type Section = (typeof sections)[number];

function id(prefix: string) {
  void prefix;
  return cryptoUuid();
}

function cryptoUuid() {
  const fallback = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
  return globalThis.crypto?.randomUUID?.() ?? fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function createBlankOutfit(mannequin?: Mannequin | null): Outfit {
  const timestamp = nowIso();
  return {
    id: id("outfit"),
    name: `Outfit ${new Date().toLocaleDateString()}`,
    mannequinId: mannequin?.id ?? null,
    mannequinUri: mannequin?.imageUri ?? null,
    layers: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [mannequins, setMannequins] = useState<Mannequin[]>([]);
  const [clothing, setClothing] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [activeOutfit, setActiveOutfit] = useState<Outfit>(() => createBlankOutfit());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("try-on");
  const [syncStatus, setSyncStatus] = useState("Not synced");

  useEffect(() => {
    void restoreSession();
    void restoreFromInitialUrl();
    if (!supabase) return;
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      void handleIncomingUrl(url);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user?.email) {
        void ensureSupabaseProfile().then((profile) => {
          if (profile.error || !profile.userId) {
            setSession(null);
            setSyncStatus(profile.error ?? "Auth changed, but profile creation failed.");
          } else {
            setSession({ id: profile.userId, email: profile.email ?? nextSession.user.email ?? "supabase-user", mode: "supabase" });
            setSyncStatus("Signed in. Profile is ready.");
          }
        });
      } else {
        setSession(null);
      }
    });
    return () => {
      data.subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (session) {
      void hydrate();
    }
  }, [session?.id]);

  const selectedMannequinId = activeOutfit.mannequinId;
  const selectedMannequin = mannequins.find((item) => item.id === selectedMannequinId) ?? mannequins[0] ?? null;
  const currentMode = session?.mode === "supabase" ? "Supabase" : "Demo";

  const wardrobeSummary = useMemo(
    () => `${mannequins.length} person images | ${clothing.length} garments | ${outfits.length} manual drafts`,
    [clothing.length, mannequins.length, outfits.length]
  );

  async function hydrate() {
    try {
      const [storedMannequins, storedClothing, storedOutfits] = await Promise.all([loadMannequins(), loadClothing(), loadOutfits()]);
      setMannequins(storedMannequins);
      setClothing(storedClothing);
      setOutfits(storedOutfits);
      setActiveOutfit(storedOutfits[0] ?? createBlankOutfit(storedMannequins[0] ?? null));
    } catch (err) {
      setSyncStatus(err instanceof Error ? `Sync reload failed: ${err.message}` : "Sync reload failed.");
    }
  }

  async function restoreSession() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user?.email) {
      const profile = await ensureSupabaseProfile();
      if (profile.error || !profile.userId) {
        setSession(null);
        setSyncStatus(profile.error ?? "Session restored, but profile creation failed.");
        return;
      }
      setSession({ id: profile.userId, email: profile.email ?? user.email, mode: "supabase" });
      setSyncStatus("Session restored. Profile is ready.");
    }
  }

  async function restoreFromInitialUrl() {
    const url = await Linking.getInitialURL();
    if (url) {
      await handleIncomingUrl(url);
    }
  }

  async function handleIncomingUrl(url: string) {
    if (!url.includes("access_token") && !url.includes("refresh_token") && !url.includes("code=") && !url.includes("error")) return;
    const status = await handleSupabaseAuthCallback(url);
    setSyncStatus(status.message);
    if (status.ok && supabase) {
      const profile = await ensureSupabaseProfile();
      if (profile.error || !profile.userId) {
        setSession(null);
        setSyncStatus(profile.error ?? "Auth callback restored session, but profile creation failed.");
        return;
      }
      setSession({ id: profile.userId, email: profile.email ?? "supabase-user", mode: "supabase" });
      await hydrate();
    }
  }

  async function runSyncCheck() {
    const status = await testSupabaseConnection();
    setSyncStatus(status.message);
    if (status.ok) {
      await hydrate();
    }
  }

  async function runDbWriteCheck() {
    const status = await testSupabaseDbWrite();
    setSyncStatus(status.message);
    if (status.ok) {
      await hydrate();
    }
  }

  async function runAssetUploadCheck() {
    const status = await testSupabaseAssetUpload();
    setSyncStatus(status.message);
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setMannequins([]);
    setClothing([]);
    setOutfits([]);
    setActiveOutfit(createBlankOutfit());
    setSelectedLayerId(null);
    setSyncStatus("Signed out. Local fallback is active until you sign in.");
  }

  async function addMannequin(existingUri?: string): Promise<string | null> {
    const imageUri = existingUri ?? (await pickImage());
    if (!imageUri) return null;
    let uploaded: Awaited<ReturnType<typeof uploadAsset>>;
    let uploadError: string | null = null;
    try {
      uploaded = await uploadAsset(imageUri, "mannequins");
      setSyncStatus(uploaded.storagePath ? "Person image uploaded to Supabase Storage." : "Person image saved locally.");
    } catch (err) {
      uploaded = { imageUri, storagePath: null };
      uploadError = err instanceof Error ? err.message : "Supabase upload failed.";
      setSyncStatus(`Person image saved locally. ${uploadError}`);
    }
    const next: Mannequin = {
      id: id("mannequin"),
      name: `Mannequin ${mannequins.length + 1}`,
      imageUri: uploaded.imageUri,
      storagePath: uploaded.storagePath,
      isDefault: mannequins.length === 0,
      createdAt: nowIso()
    };
    const nextMannequins = [next, ...mannequins];
    setMannequins(nextMannequins);
    try {
      await saveMannequins(nextMannequins);
      const message = uploadError
        ? `Person image saved locally. Supabase storage sync failed: ${uploadError}`
        : uploaded.storagePath
          ? "Person image saved to Supabase."
          : "Person image saved locally only. Sign in, run Test Asset Upload, then save again for Supabase rows.";
      setSyncStatus(message);
      setActiveOutfit((outfit) => ({ ...outfit, mannequinId: next.id, mannequinUri: next.imageUri, updatedAt: nowIso() }));
      return message;
    } catch (err) {
      const message = err instanceof Error
        ? `Person image was not saved to Supabase. Local copy kept. ${err.message}`
        : "Person image was not saved to Supabase. Local copy kept.";
      setSyncStatus(message);
      setActiveOutfit((outfit) => ({ ...outfit, mannequinId: next.id, mannequinUri: next.imageUri, updatedAt: nowIso() }));
      return message;
    }
  }

  async function addClothing(existingUri?: string, existingCategory?: ClothingCategory): Promise<string | null> {
    const imageUri = existingUri ?? (await pickImage());
    if (!imageUri) return null;
    let uploaded: Awaited<ReturnType<typeof uploadAsset>>;
    let uploadError: string | null = null;
    try {
      uploaded = await uploadAsset(imageUri, "clothing");
      setSyncStatus(uploaded.storagePath ? "Garment uploaded to Supabase Storage." : "Garment saved locally.");
    } catch (err) {
      uploaded = { imageUri, storagePath: null };
      uploadError = err instanceof Error ? err.message : "Supabase upload failed.";
      setSyncStatus(`Garment saved locally. ${uploadError}`);
    }
    const category = existingCategory ?? categories[clothing.length % categories.length];
    const next: ClothingItem = {
      id: id("clothing"),
      name: `${category[0].toUpperCase()}${category.slice(1)} ${clothing.length + 1}`,
      category,
      imageUri: uploaded.imageUri,
      storagePath: uploaded.storagePath,
      sourceUrl: null,
      brand: null,
      color: null,
      notes: null,
      favorite: false,
      createdAt: nowIso()
    };
    const nextClothing = [next, ...clothing];
    setClothing(nextClothing);
    try {
      await saveClothing(nextClothing);
      const message = uploadError
        ? `Garment saved locally. Supabase storage sync failed: ${uploadError}`
        : uploaded.storagePath
          ? "Garment saved to Supabase."
          : "Garment saved locally only. Sign in, run Test Asset Upload, then save again for Supabase rows.";
      setSyncStatus(message);
      return message;
    } catch (err) {
      const message = err instanceof Error
        ? `Garment was not saved to Supabase. Local copy kept. ${err.message}`
        : "Garment was not saved to Supabase. Local copy kept.";
      setSyncStatus(message);
      return message;
    }
  }

  async function updateMannequin(item: Mannequin) {
    const next = mannequins.map((existing) => (existing.id === item.id ? item : existing));
    setMannequins(next);
    try {
      await saveMannequins(next);
      setSyncStatus("Person image updated.");
    } catch (err) {
      setSyncStatus(err instanceof Error ? `Person image update was not saved to Supabase. Local edit kept. ${err.message}` : "Person image update was not saved to Supabase. Local edit kept.");
    }
  }

  async function deleteMannequin(idToDelete: string) {
    const next = mannequins.filter((item) => item.id !== idToDelete);
    setMannequins(next);
    try {
      await deleteMannequinRecord(idToDelete, mannequins);
      setSyncStatus("Person image deleted.");
    } catch (err) {
      setMannequins(mannequins);
      setSyncStatus(err instanceof Error ? `Person image delete was not saved to Supabase. Item restored locally. ${err.message}` : "Person image delete was not saved to Supabase. Item restored locally.");
    }
  }

  async function updateClothing(item: ClothingItem) {
    const next = clothing.map((existing) => (existing.id === item.id ? item : existing));
    setClothing(next);
    try {
      await saveClothing(next);
      setSyncStatus("Wardrobe item updated.");
    } catch (err) {
      setSyncStatus(err instanceof Error ? `Wardrobe item update was not saved to Supabase. Local edit kept. ${err.message}` : "Wardrobe item update was not saved to Supabase. Local edit kept.");
    }
  }

  async function deleteClothing(idToDelete: string) {
    const next = clothing.filter((item) => item.id !== idToDelete);
    setClothing(next);
    try {
      await deleteClothingRecord(idToDelete, clothing);
      setSyncStatus("Wardrobe item deleted.");
    } catch (err) {
      setClothing(clothing);
      setSyncStatus(err instanceof Error ? `Wardrobe item delete was not saved to Supabase. Item restored locally. ${err.message}` : "Wardrobe item delete was not saved to Supabase. Item restored locally.");
    }
  }

  function selectMannequin(mannequinId: string) {
    const mannequin = mannequins.find((item) => item.id === mannequinId);
    if (!mannequin) return;
    setActiveOutfit((outfit) => ({ ...outfit, mannequinId: mannequin.id, mannequinUri: mannequin.imageUri, updatedAt: nowIso() }));
  }

  function addLayer(item: ClothingItem) {
    const layer: OutfitLayer = {
      id: id("layer"),
      clothingItemId: item.id,
      imageUri: item.imageUri,
      name: item.name,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      zIndex: activeOutfit.layers.length + 1
    };
    setActiveOutfit((outfit) => ({ ...outfit, layers: [...outfit.layers, layer], updatedAt: nowIso() }));
    setSelectedLayerId(layer.id);
  }

  function updateLayer(layer: OutfitLayer) {
    setActiveOutfit((outfit) => ({
      ...outfit,
      layers: outfit.layers.map((existing) => (existing.id === layer.id ? layer : existing)),
      updatedAt: nowIso()
    }));
  }

  function removeLayer(layerId: string) {
    setActiveOutfit((outfit) => ({ ...outfit, layers: outfit.layers.filter((layer) => layer.id !== layerId), updatedAt: nowIso() }));
    setSelectedLayerId(null);
  }

  async function saveCurrentOutfit() {
    if (!activeOutfit.mannequinUri) {
      Alert.alert("Select a mannequin", "Choose a mannequin image before saving an outfit.");
      return;
    }
    const saved: Outfit = {
      ...activeOutfit,
      name: activeOutfit.name || `Outfit ${outfits.length + 1}`,
      updatedAt: nowIso()
    };
    const nextOutfits = [saved, ...outfits.filter((outfit) => outfit.id !== saved.id)];
    setOutfits(nextOutfits);
    try {
      await saveOutfits(nextOutfits);
    } catch (err) {
      setSyncStatus(err instanceof Error ? `Outfit saved locally. ${err.message}` : "Outfit saved locally.");
    }
    Alert.alert("Outfit saved", `${saved.name} is ready to load later.`);
  }

  function loadOutfit(outfit: Outfit) {
    setActiveOutfit(outfit);
    setSelectedLayerId(outfit.layers[0]?.id ?? null);
  }

  function startNewOutfit() {
    const mannequin = mannequins.find((item) => item.id === selectedMannequinId) ?? mannequins[0] ?? null;
    setActiveOutfit(createBlankOutfit(mannequin));
    setSelectedLayerId(null);
  }

  if (!session) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.center}>
            <AuthPanel onSession={setSession} />
          </KeyboardAvoidingView>
          <StatusBar style="dark" />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>{currentMode} workspace</Text>
              <Text style={styles.title}>FitShelf</Text>
              <Text style={styles.summary}>{wardrobeSummary}</Text>
            </View>
            <View style={styles.account}>
              <Text style={styles.email}>{session.email}</Text>
              <Text style={styles.badge}>{session.mode === "supabase" ? "Signed in" : "Local mode"}</Text>
              <Text style={styles.badge}>{isSupabaseConfigured ? "Supabase configured" : "Local fallback"}</Text>
            </View>
          </View>

          <View style={styles.syncPanel}>
            <Text style={styles.syncText}>{syncStatus}</Text>
            <View style={styles.syncActions}>
              <Pressable style={styles.syncButton} onPress={() => void runSyncCheck()}>
                <Text style={styles.syncButtonText}>Test Supabase</Text>
              </Pressable>
              <Pressable style={styles.syncButton} onPress={() => void runDbWriteCheck()}>
                <Text style={styles.syncButtonText}>Test DB Write</Text>
              </Pressable>
              <Pressable style={styles.syncButton} onPress={() => void runAssetUploadCheck()}>
                <Text style={styles.syncButtonText}>Test Asset Upload</Text>
              </Pressable>
              <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.nav}>
            {sections.map((section) => (
              <Pressable key={section} style={[styles.navButton, section === activeSection && styles.navActive]} onPress={() => setActiveSection(section)}>
                <Text style={[styles.navText, section === activeSection && styles.navTextActive]}>{section}</Text>
              </Pressable>
            ))}
          </View>

          {activeSection === "try-on" ? (
            <View style={styles.section}>
              <TryOnPanel
                mannequin={selectedMannequin}
                clothing={clothing}
                onSavePerson={(uri) => addMannequin(uri)}
                onSaveGarment={(uri, garmentCategory) => addClothing(uri, garmentCategory)}
              />
            </View>
          ) : null}

          {activeSection === "avatar" ? (
            <View style={styles.section}>
              <AvatarPanel />
            </View>
          ) : null}

          {activeSection === "closet" ? (
            <View style={styles.section}>
              <LibraryPanel
                mannequins={mannequins}
                clothing={clothing}
                selectedMannequinId={selectedMannequinId}
                onPickMannequin={() => void addMannequin()}
                onPickClothing={() => void addClothing()}
                onSelectMannequin={selectMannequin}
                onUpdateMannequin={(item) => void updateMannequin(item)}
                onDeleteMannequin={(idToDelete) => void deleteMannequin(idToDelete)}
                onAddLayer={addLayer}
                onUpdateClothing={(item) => void updateClothing(item)}
                onDeleteClothing={(idToDelete) => void deleteClothing(idToDelete)}
              />
            </View>
          ) : null}

          {activeSection === "manual" ? (
            <View style={styles.section}>
              <View style={styles.localNotice}>
                <Text style={styles.localNoticeText}>Manual builder drafts stay on this device. Use Try-On Saved Looks for Supabase-backed generated results.</Text>
              </View>
              <OutfitBuilder
                outfit={activeOutfit}
                selectedLayerId={selectedLayerId}
                onSelectLayer={setSelectedLayerId}
                onUpdateLayer={updateLayer}
                onRemoveLayer={removeLayer}
                onSave={() => void saveCurrentOutfit()}
              />
              <SavedOutfits outfits={outfits} activeOutfitId={activeOutfit.id} onLoad={loadOutfit} onNew={startNewOutfit} />
            </View>
          ) : null}
        </ScrollView>
        <StatusBar style="dark" />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#eef1f4" },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: "center" },
  content: { gap: 18, padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  kicker: { color: "#2f6f73", fontWeight: "800", textTransform: "uppercase", fontSize: 12 },
  title: { fontSize: 34, fontWeight: "900", color: "#222831" },
  summary: { color: "#69707d", marginTop: 2 },
  account: { alignItems: "flex-end", gap: 3, maxWidth: 170 },
  email: { color: "#58606d", textAlign: "right" },
  badge: { color: "#2f6f73", fontSize: 11, fontWeight: "900", textAlign: "right" },
  syncPanel: { backgroundColor: "#fff", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, gap: 8, padding: 10 },
  syncText: { color: "#58606d", fontWeight: "800" },
  syncActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  syncButton: { backgroundColor: "#2f6f73", borderRadius: 8, flexGrow: 1, flexBasis: "45%", padding: 10 },
  syncButtonText: { color: "#fff", fontWeight: "900", textAlign: "center" },
  signOutButton: { borderColor: "#b44444", borderRadius: 8, borderWidth: 1, flexGrow: 1, flexBasis: "45%", padding: 10 },
  signOutText: { color: "#b44444", fontWeight: "900", textAlign: "center" },
  nav: { backgroundColor: "#dfe6ea", borderRadius: 8, flexDirection: "row", padding: 3 },
  navButton: { alignItems: "center", borderRadius: 6, flex: 1, paddingVertical: 9 },
  navActive: { backgroundColor: "#fff" },
  navText: { color: "#58606d", fontSize: 12, fontWeight: "900", textTransform: "capitalize" },
  navTextActive: { color: "#2f6f73" },
  section: { backgroundColor: "#f7f9fa", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, padding: 12 },
  localNotice: { backgroundColor: "#fff", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, marginBottom: 10, padding: 10 },
  localNoticeText: { color: "#69707d", fontSize: 12, fontWeight: "800" }
});

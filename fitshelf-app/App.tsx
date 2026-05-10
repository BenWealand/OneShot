import "react-native-gesture-handler";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AuthPanel } from "./src/components/AuthPanel";
import { LibraryPanel } from "./src/components/LibraryPanel";
import { OutfitBuilder } from "./src/components/OutfitBuilder";
import { SavedOutfits } from "./src/components/SavedOutfits";
import { pickImage } from "./src/lib/imagePicker";
import { loadClothing, loadMannequins, loadOutfits, saveClothing, saveMannequins, saveOutfits, uploadAsset } from "./src/lib/storage";
import type { ClothingCategory, ClothingItem, Mannequin, Outfit, OutfitLayer, UserSession } from "./src/types/models";

const categories: ClothingCategory[] = ["top", "bottom", "outerwear", "dress", "shoe", "accessory"];

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
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

  useEffect(() => {
    void hydrate();
  }, []);

  const selectedMannequinId = activeOutfit.mannequinId;
  const currentMode = session?.mode === "supabase" ? "Supabase" : "Demo";

  const wardrobeSummary = useMemo(
    () => `${mannequins.length} mannequins · ${clothing.length} garments · ${outfits.length} outfits`,
    [clothing.length, mannequins.length, outfits.length]
  );

  async function hydrate() {
    const [storedMannequins, storedClothing, storedOutfits] = await Promise.all([loadMannequins(), loadClothing(), loadOutfits()]);
    setMannequins(storedMannequins);
    setClothing(storedClothing);
    setOutfits(storedOutfits);
    setActiveOutfit(storedOutfits[0] ?? createBlankOutfit(storedMannequins[0] ?? null));
  }

  async function addMannequin() {
    const imageUri = await pickImage();
    if (!imageUri) return;
    const storedUri = await uploadAsset(imageUri, "mannequins");
    const next: Mannequin = {
      id: id("mannequin"),
      name: `Mannequin ${mannequins.length + 1}`,
      imageUri: storedUri,
      createdAt: nowIso()
    };
    const nextMannequins = [next, ...mannequins];
    setMannequins(nextMannequins);
    await saveMannequins(nextMannequins);
    setActiveOutfit((outfit) => ({ ...outfit, mannequinId: next.id, mannequinUri: next.imageUri, updatedAt: nowIso() }));
  }

  async function addClothing() {
    const imageUri = await pickImage();
    if (!imageUri) return;
    const storedUri = await uploadAsset(imageUri, "clothing");
    const category = categories[clothing.length % categories.length];
    const next: ClothingItem = {
      id: id("clothing"),
      name: `${category[0].toUpperCase()}${category.slice(1)} ${clothing.length + 1}`,
      category,
      imageUri: storedUri,
      createdAt: nowIso()
    };
    const nextClothing = [next, ...clothing];
    setClothing(nextClothing);
    await saveClothing(nextClothing);
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
    await saveOutfits(nextOutfits);
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
            <Text style={styles.email}>{session.email}</Text>
          </View>

          <LibraryPanel
            mannequins={mannequins}
            clothing={clothing}
            selectedMannequinId={selectedMannequinId}
            onPickMannequin={() => void addMannequin()}
            onPickClothing={() => void addClothing()}
            onSelectMannequin={selectMannequin}
            onAddLayer={addLayer}
          />

          <OutfitBuilder
            outfit={activeOutfit}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={updateLayer}
            onRemoveLayer={removeLayer}
            onSave={() => void saveCurrentOutfit()}
          />

          <SavedOutfits outfits={outfits} activeOutfitId={activeOutfit.id} onLoad={loadOutfit} onNew={startNewOutfit} />
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
  email: { color: "#58606d", maxWidth: 150, textAlign: "right" }
});

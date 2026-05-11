import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { pickImage } from "../lib/imagePicker";
import { deleteSavedLook, loadSavedLooks, saveSavedLooks, saveSavedLooksLocally, saveTryOnJobRecord } from "../lib/storage";
import { getBackendDbHealth, getBackendSchemaHealth, getTryOnJob, refreshSupabaseSignedUrl, submitTryOn, type TryOnResponse } from "../lib/tryonApi";
import type { ClothingCategory, ClothingItem, Mannequin, RenderMode, SavedLook, TryOnCategory } from "../types/models";

const categories: TryOnCategory[] = ["upper", "lower", "dress"];
const renderModes: RenderMode[] = ["preview", "hd"];
const defaultBackendUrl = process.env.EXPO_PUBLIC_FITSHELF_BACKEND_URL || "http://127.0.0.1:8000";
type DisplayUrlSource = "supabase signed" | "refreshed signed" | "backend proxy" | "local backend" | "none";
type SchemaReady = "unknown" | "pass" | "fail";

function categoryFor(item?: ClothingItem | null): TryOnCategory {
  if (!item) return "upper";
  if (item.category === "bottom") return "lower";
  if (item.category === "dress") return "dress";
  return "upper";
}

function wardrobeCategoryFor(item: TryOnCategory): ClothingCategory {
  if (item === "lower") return "bottom";
  if (item === "dress") return "dress";
  return "top";
}

function isSupabaseUrl(url?: string | null) {
  return Boolean(url && url.includes("/storage/v1/object/sign/"));
}

function cacheBust(url: string, seed: number) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}fitshelf_image_key=${seed}`;
}

function safeUrlLabel(url?: string | null) {
  if (!url) return "none";
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url.split("?")[0].slice(0, 120);
  }
}

function pickDisplayUrl(response: TryOnResponse | null): { url: string | null; source: DisplayUrlSource } {
  if (!response) return { url: null, source: "none" };
  if (response.supabase_result_url) return { url: response.supabase_result_url, source: "supabase signed" };
  if (isSupabaseUrl(response.result_url)) return { url: response.result_url ?? null, source: "supabase signed" };
  if (response.supabase_proxy_url) return { url: response.supabase_proxy_url, source: "backend proxy" };
  if (response.local_result_url) return { url: response.local_result_url, source: "local backend" };
  if (response.result_url) return { url: response.result_url, source: "local backend" };
  return { url: null, source: "none" };
}

function withProxyUrl(response: TryOnResponse, backendUrl: string): TryOnResponse {
  if (!response.supabase_storage_path || response.supabase_proxy_url) return response;
  const proxy = `${backendUrl.replace(/\/$/, "")}/supabase/object?storage_path=${encodeURIComponent(response.supabase_storage_path)}`;
  return { ...response, supabase_proxy_url: proxy };
}

export function TryOnPanel({
  mannequin,
  clothing,
  onSavePerson,
  onSaveGarment
}: {
  mannequin: Mannequin | null;
  clothing: ClothingItem[];
  onSavePerson?: (uri: string) => Promise<string | null | void>;
  onSaveGarment?: (uri: string, category: ClothingCategory) => Promise<string | null | void>;
}) {
  const [selectedClothingId, setSelectedClothingId] = useState<string | null>(clothing[0]?.id ?? null);
  const selectedClothing = useMemo(
    () => clothing.find((item) => item.id === selectedClothingId) ?? clothing[0] ?? null,
    [clothing, selectedClothingId]
  );
  const [personUri, setPersonUri] = useState<string | null>(mannequin?.imageUri ?? null);
  const [garmentUri, setGarmentUri] = useState<string | null>(selectedClothing?.imageUri ?? null);
  const [category, setCategory] = useState<TryOnCategory>(() => categoryFor(selectedClothing));
  const [renderMode, setRenderMode] = useState<RenderMode>("preview");
  const [backendUrl, setBackendUrl] = useState(defaultBackendUrl);
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("Ready");
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [displaySource, setDisplaySource] = useState<DisplayUrlSource>("none");
  const [imageKey, setImageKey] = useState(0);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState("not loaded");
  const [signedRefreshTime, setSignedRefreshTime] = useState<string | null>(null);
  const [lastFailedSignedPath, setLastFailedSignedPath] = useState<string | null>(null);
  const [lastSavedLookJobId, setLastSavedLookJobId] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState<SchemaReady>("unknown");
  const [savingAsset, setSavingAsset] = useState<"person" | "garment" | null>(null);

  const activePersonUri = personUri ?? mannequin?.imageUri ?? null;
  const activeGarmentUri = garmentUri ?? selectedClothing?.imageUri ?? null;

  useEffect(() => {
    void loadSavedLooks()
      .then(setSavedLooks)
      .catch((err) => {
        setError(err instanceof Error ? `Saved Looks reload failed: ${err.message}` : "Saved Looks reload failed.");
      });
  }, []);

  useEffect(() => {
    setSchemaReady("unknown");
  }, [backendUrl]);

  function applyResult(response: TryOnResponse, sourceOverride?: DisplayUrlSource) {
    const next = pickDisplayUrl(response);
    setFailedImageUrl(null);
    setDisplayUrl(null);
    setDisplaySource("none");
    setImageStatus("loading");
    setResult(response);
    setLastSavedLookJobId((current) => (current === response.job_id ? current : null));
    requestAnimationFrame(() => {
      const source = sourceOverride ?? next.source;
      setDisplayUrl(next.url);
      setDisplaySource(source);
      if (source.includes("signed")) setSignedRefreshTime(new Date().toLocaleTimeString());
      setImageKey(Date.now());
    });
  }

  async function choosePerson() {
    const uri = await pickImage();
    if (uri) {
      setPersonUri(uri);
      setResult(null);
    }
  }

  async function chooseGarment() {
    const uri = await pickImage();
    if (uri) {
      setGarmentUri(uri);
      setSelectedClothingId(null);
      setResult(null);
    }
  }

  async function savePersonAsset() {
    if (!activePersonUri || !onSavePerson || schemaReady === "fail") return;
    setSavingAsset("person");
    setError(null);
    try {
      const message = await onSavePerson(activePersonUri);
      setError(message ? `Save Person finished: ${message}` : "Save Person finished. Check the sync panel for Supabase status.");
    } catch (err) {
      setError(err instanceof Error ? `Save Person failed: ${err.message}` : "Save Person failed.");
    } finally {
      setSavingAsset(null);
    }
  }

  async function saveGarmentAsset() {
    if (!activeGarmentUri || !onSaveGarment || schemaReady === "fail") return;
    setSavingAsset("garment");
    setError(null);
    try {
      const message = await onSaveGarment(activeGarmentUri, wardrobeCategoryFor(category));
      setError(message ? `Save Garment finished: ${message}` : "Save Garment finished. Check the sync panel for Supabase status.");
    } catch (err) {
      setError(err instanceof Error ? `Save Garment failed: ${err.message}` : "Save Garment failed.");
    } finally {
      setSavingAsset(null);
    }
  }

  async function checkBackendSchema() {
    setError(null);
    setProgressText("Checking backend schema.");
    try {
      const health = await getBackendSchemaHealth({ backendUrl });
      if (health.ok) {
        setSchemaReady("pass");
        setError("Backend schema check passed.");
        return;
      }
      setSchemaReady("fail");
      const missing = health.missing.length ? health.missing.join(", ") : health.error ?? "Unknown schema issue.";
      const patch = health.patch_file ?? "ai/supabase/stabilization_patch.sql";
      setError(`Backend schema missing: ${missing}. Run ${patch} in Supabase SQL editor.`);
    } catch (err) {
      setSchemaReady("fail");
      setError(err instanceof Error ? `Backend schema check failed: ${err.message}` : "Backend schema check failed.");
    } finally {
      setProgressText("Ready");
    }
  }

  async function checkBackendDb() {
    setError(null);
    setProgressText("Checking backend DB.");
    try {
      const health = await getBackendDbHealth({ backendUrl });
      if (health.priority_tables_ok) {
        setSchemaReady("pass");
        setError("Backend DB check passed: priority tables are writable.");
        return;
      }
      setSchemaReady("fail");
      const patch = health.patch_file ?? "ai/supabase/stabilization_patch.sql";
      setError(
        `Backend DB missing priority table readiness: ${health.error ?? "priority_tables_ok=false"}. Run ${patch} in Supabase SQL editor, then rerun Test Backend Schema and Test Backend DB.`
      );
    } catch (err) {
      setSchemaReady("fail");
      setError(err instanceof Error ? `Backend DB check failed: ${err.message}` : "Backend DB check failed.");
    } finally {
      setProgressText("Ready");
    }
  }

  async function persistLook(response: TryOnResponse, usedRenderMode: RenderMode, usedPersonUri: string, usedGarmentUri: string, usedCategory: TryOnCategory): Promise<boolean> {
    const picked = pickDisplayUrl(response);
    if (!picked.url) {
      setError("Save Look failed: no result image URL is available.");
      return false;
    }
    const look: SavedLook = {
      id: `look-${Date.now()}-${Math.round(Math.random() * 100000)}`,
      name: `${usedRenderMode === "hd" ? "HD" : "Preview"} look ${savedLooks.length + 1}`,
      jobId: response.job_id,
      resultUrl: picked.url,
      resultStoragePath: response.supabase_storage_path ?? null,
      localResultUrl: response.local_result_url ?? null,
      personUri: usedPersonUri,
      garmentUri: usedGarmentUri,
      category: usedCategory,
      renderMode: (response.render_mode as RenderMode | null) ?? usedRenderMode,
      width: response.width ?? null,
      height: response.height ?? null,
      steps: response.steps ?? null,
      precision: response.precision ?? null,
      backend: response.backend ?? null,
      elapsedSeconds: response.elapsed_seconds ?? null,
      createdAt: new Date().toISOString()
    };
    const next = [look, ...savedLooks.filter((item) => item.jobId !== look.jobId)].slice(0, 24);
    setSavedLooks(next);
    try {
      await saveTryOnJobRecord(response);
      await saveSavedLooks(next);
      setError(null);
      return true;
    } catch (err) {
      try {
        await saveSavedLooksLocally(next);
      } catch (localErr) {
        const remoteMessage = err instanceof Error ? err.message : "Supabase sync failed.";
        const localMessage = localErr instanceof Error ? localErr.message : "Local storage failed.";
        setError(`Look was not saved to Supabase or local storage. ${remoteMessage} ${localMessage}`);
        return false;
      }
      setError(
        err instanceof Error
          ? `Look was not saved to Supabase. Local copy kept. ${err.message}`
          : "Look was not saved to Supabase. Local copy kept."
      );
      return false;
    }
  }

  async function run(
    mode: RenderMode = renderMode,
    override?: { personUri: string; garmentUri: string; category: TryOnCategory }
  ) {
    const usedPersonUri = override?.personUri ?? activePersonUri;
    const usedGarmentUri = override?.garmentUri ?? activeGarmentUri;
    const usedCategory = override?.category ?? category;
    if (!usedPersonUri || !usedGarmentUri) return;
    setLoading(true);
    setError(null);
    setProgressText(mode === "hd" ? "Rendering HD. This can take several minutes." : "Rendering preview.");
    try {
      const response = await submitTryOn({
        backendUrl,
        personUri: usedPersonUri,
        garmentUri: usedGarmentUri,
        category: usedCategory,
        renderMode: mode
      });
      applyResult(response);
      if (response.job_id) {
        const refreshed = withProxyUrl(await getTryOnJob({ backendUrl, jobId: response.job_id }), backendUrl);
        applyResult(refreshed, refreshed.supabase_result_url ? "refreshed signed" : undefined);
        try {
          await saveTryOnJobRecord(refreshed);
        } catch (err) {
          setError(err instanceof Error ? `Try-on job sync failed: ${err.message}` : "Try-on job sync failed.");
        }
      } else {
        try {
          await saveTryOnJobRecord(response);
        } catch (err) {
          setError(err instanceof Error ? `Try-on job sync failed: ${err.message}` : "Try-on job sync failed.");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Keep the backend window open, confirm the phone can reach the hotspot URL, then retry.`
          : "Try-on request failed. Check the backend and retry."
      );
    } finally {
      setProgressText("Ready");
      setLoading(false);
    }
  }

  async function loadLook(look: SavedLook) {
    setSelectedLookId(look.id);
    setPersonUri(look.personUri);
    setGarmentUri(look.garmentUri);
    setCategory(look.category);
    setRenderMode(look.renderMode);
    const savedResponse: TryOnResponse = {
      job_id: look.jobId,
      status: "completed",
      category: look.category,
      render_mode: look.renderMode,
      width: look.width,
      height: look.height,
      steps: look.steps,
      precision: look.precision,
      backend: look.backend,
      elapsed_seconds: look.elapsedSeconds,
      result_url: look.resultUrl,
      local_result_url: look.localResultUrl,
      supabase_storage_path: look.resultStoragePath,
      supabase_result_url: isSupabaseUrl(look.resultUrl) ? look.resultUrl : null
    };
    applyResult(savedResponse);
    if (!look.resultStoragePath) return;
    try {
      const refreshed = withProxyUrl(await refreshSupabaseSignedUrl({ backendUrl, storagePath: look.resultStoragePath }), backendUrl);
      applyResult({ ...savedResponse, ...refreshed, local_result_url: look.localResultUrl }, "refreshed signed");
    } catch (err) {
      const detail = err instanceof Error ? ` ${err.message}` : "";
      if (look.resultStoragePath) {
        const proxy = `${backendUrl.replace(/\/$/, "")}/supabase/object?storage_path=${encodeURIComponent(look.resultStoragePath)}`;
        applyResult({ ...savedResponse, result_url: proxy, supabase_result_url: null, supabase_proxy_url: proxy }, "backend proxy");
        setError(`Saved look opened with backend proxy fallback.${detail}`);
      } else if (look.localResultUrl) {
        applyResult({ ...savedResponse, result_url: look.localResultUrl, supabase_result_url: null }, "local backend");
        setError(`Saved look opened with local fallback.${detail}`);
      } else {
        setError(`Saved look refresh failed.${detail}`);
      }
    }
  }

  async function renameLook(lookId: string, name: string) {
    const next = savedLooks.map((look) => (look.id === lookId ? { ...look, name } : look));
    setSavedLooks(next);
    try {
      await saveSavedLooks(next);
    } catch (err) {
      setError(err instanceof Error ? `Rename was not saved to Supabase. Local name kept. ${err.message}` : "Rename was not saved to Supabase. Local name kept.");
    }
  }

  async function removeLook(lookId: string) {
    try {
      const next = await deleteSavedLook(lookId, savedLooks);
      setSavedLooks(next);
      if (selectedLookId === lookId) setSelectedLookId(null);
    } catch (err) {
      setError(err instanceof Error ? `Delete was not saved to Supabase. Local list kept. ${err.message}` : "Delete was not saved to Supabase. Local list kept.");
    }
  }

  function savedLookThumbnailUrl(look: SavedLook) {
    if (look.localResultUrl) return look.localResultUrl;
    if (look.resultStoragePath) {
      return `${backendUrl.replace(/\/$/, "")}/supabase/object?storage_path=${encodeURIComponent(look.resultStoragePath)}`;
    }
    return look.resultUrl;
  }

  async function handleResultImageError() {
    const failedUrl = displayUrl;
    const failedStoragePath = result?.supabase_storage_path ?? null;
    setFailedImageUrl(failedUrl);
    setDisplayUrl(null);
    if (result && failedStoragePath && displaySource.includes("signed") && lastFailedSignedPath === failedStoragePath) {
      const proxy = `${backendUrl.replace(/\/$/, "")}/supabase/object?storage_path=${encodeURIComponent(failedStoragePath)}`;
      applyResult({ ...result, result_url: proxy, supabase_result_url: null, supabase_proxy_url: proxy }, "backend proxy");
      setError(`Signed image failed again at ${safeUrlLabel(failedUrl)}. Showing backend private-bucket proxy fallback.`);
      return;
    }
    if (failedStoragePath && displaySource.includes("signed")) {
      setLastFailedSignedPath(failedStoragePath);
    }
    try {
      if (result?.job_id) {
        const refreshed = withProxyUrl(await getTryOnJob({ backendUrl, jobId: result.job_id }), backendUrl);
        if (refreshed.supabase_proxy_url) {
          applyResult({ ...refreshed, result_url: refreshed.supabase_proxy_url, supabase_result_url: null }, "backend proxy");
          setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Showing backend private-bucket proxy fallback.`);
          return;
        }
        if (refreshed.local_result_url) {
          applyResult({ ...refreshed, result_url: refreshed.local_result_url, supabase_result_url: null }, "local backend");
          setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Showing backend local fallback.`);
          return;
        }
        applyResult(refreshed, refreshed.supabase_result_url ? "refreshed signed" : undefined);
        setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Refreshed the signed URL.`);
        return;
      }
      if (result?.supabase_storage_path) {
        const refreshed = withProxyUrl(await refreshSupabaseSignedUrl({ backendUrl, storagePath: result.supabase_storage_path }), backendUrl);
        if (refreshed.supabase_proxy_url) {
          applyResult({ ...result, ...refreshed, result_url: refreshed.supabase_proxy_url, supabase_result_url: null }, "backend proxy");
          setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Showing backend private-bucket proxy fallback.`);
          return;
        }
        applyResult({ ...result, ...refreshed }, "refreshed signed");
        setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Refreshed the signed URL.`);
        return;
      }
    } catch (err) {
      if (result?.supabase_storage_path) {
        const proxy = `${backendUrl.replace(/\/$/, "")}/supabase/object?storage_path=${encodeURIComponent(result.supabase_storage_path)}`;
        applyResult({ ...result, result_url: proxy, supabase_result_url: null, supabase_proxy_url: proxy }, "backend proxy");
        setError(`Signed image failed at ${safeUrlLabel(failedUrl)}. Showing backend private-bucket proxy fallback.`);
        return;
      }
      if (result?.local_result_url) {
        applyResult({ ...result, result_url: result.local_result_url, supabase_result_url: null }, "local backend");
        setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Showing backend local fallback.`);
        return;
      }
      setError(err instanceof Error ? `Result image failed at ${safeUrlLabel(failedUrl)}. ${err.message}` : `Result image failed at ${safeUrlLabel(failedUrl)}.`);
      return;
    }
    if (result?.local_result_url) {
      applyResult({ ...result, result_url: result.local_result_url, supabase_result_url: null }, "local backend");
      setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Showing backend local fallback.`);
      return;
    }
    setError(`Result image failed at ${safeUrlLabel(failedUrl)}. Rerender the look if the signed URL expired.`);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Try-On</Text>
        <Text style={styles.status}>{loading ? progressText : result?.status ?? "Ready"}</Text>
      </View>

      <TextInput
        value={backendUrl}
        onChangeText={setBackendUrl}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <View style={styles.backendChecks}>
        <Pressable style={[styles.schemaButton, schemaReady === "fail" && styles.schemaButtonFailed]} onPress={() => void checkBackendSchema()}>
          <Text style={styles.schemaButtonText}>
            {schemaReady === "pass" ? "Backend Schema Passed" : schemaReady === "fail" ? "Backend Schema Failed" : "Test Backend Schema"}
          </Text>
        </Pressable>
        <Pressable style={[styles.schemaButton, schemaReady === "fail" && styles.schemaButtonFailed]} onPress={() => void checkBackendDb()}>
          <Text style={styles.schemaButtonText}>Test Backend DB</Text>
        </Pressable>
      </View>
      {schemaReady === "fail" ? (
        <Text style={styles.schemaBlocked}>Cloud saves are blocked until the Supabase stabilization patch is applied and backend schema passes.</Text>
      ) : null}

      <View style={styles.pickGrid}>
        <View style={styles.pickColumn}>
          <ImageSlot label="Person" uri={activePersonUri} onPress={() => void choosePerson()} />
          <Pressable
            style={[styles.saveAssetButton, (!activePersonUri || loading || savingAsset !== null || schemaReady === "fail") && styles.saveAssetDisabled]}
            disabled={!activePersonUri || loading || savingAsset !== null || schemaReady === "fail"}
            onPress={() => void savePersonAsset()}
          >
            <Text style={styles.saveAssetText}>{savingAsset === "person" ? "Saving Person" : "Save Person"}</Text>
          </Pressable>
        </View>
        <View style={styles.pickColumn}>
          <ImageSlot label="Garment" uri={activeGarmentUri} onPress={() => void chooseGarment()} />
          <Pressable
            style={[styles.saveAssetButton, (!activeGarmentUri || loading || savingAsset !== null || schemaReady === "fail") && styles.saveAssetDisabled]}
            disabled={!activeGarmentUri || loading || savingAsset !== null || schemaReady === "fail"}
            onPress={() => void saveGarmentAsset()}
          >
            <Text style={styles.saveAssetText}>{savingAsset === "garment" ? "Saving Garment" : "Save Garment"}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.segment}>
        {categories.map((item) => (
          <Pressable key={item} style={[styles.segmentButton, item === category && styles.segmentActive]} onPress={() => setCategory(item)}>
            <Text style={[styles.segmentText, item === category && styles.segmentTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.segment}>
        {renderModes.map((item) => (
          <Pressable key={item} style={[styles.segmentButton, item === renderMode && styles.segmentActive]} onPress={() => setRenderMode(item)}>
            <Text style={[styles.segmentText, item === renderMode && styles.segmentTextActive]}>{item === "hd" ? "HD" : "Preview"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.garments}>
        {clothing.slice(0, 8).map((item) => (
          <Pressable key={item.id} style={[styles.garment, item.id === selectedClothing?.id && styles.garmentActive]} onPress={() => {
            setSelectedClothingId(item.id);
            setGarmentUri(item.imageUri);
            setCategory(categoryFor(item));
            setResult(null);
          }}>
            <Image source={{ uri: item.imageUri }} style={styles.garmentImage} />
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.runButton, (!activePersonUri || !activeGarmentUri || loading) && styles.runButtonDisabled]} disabled={!activePersonUri || !activeGarmentUri || loading} onPress={() => void run()}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.runText}>{renderMode === "hd" ? "Render HD" : "Render preview"}</Text>}
      </Pressable>

      {loading ? <Text style={styles.progress}>{progressText}</Text> : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result ? (
        <View style={styles.resultWrap}>
          <View style={styles.resultMeta}>
            <Text style={styles.metaText}>{result.backend ?? "backend pending"}</Text>
            <Text style={styles.metaText}>
              {result.render_mode ?? renderMode} {result.width ?? "?"}x{result.height ?? "?"} {result.steps ?? "?"} steps {result.elapsed_seconds ? `${result.elapsed_seconds}s` : ""}
            </Text>
          </View>
          {__DEV__ ? (
            <Text style={styles.debugText}>
              Image: {displaySource} | {safeUrlLabel(displayUrl)}
            </Text>
          ) : null}
          {__DEV__ ? (
            <Text style={styles.debugText}>
              Status: {imageStatus}
              {result.supabase_storage_path ? ` | path ${result.supabase_storage_path}` : ""}
              {signedRefreshTime ? ` | refreshed ${signedRefreshTime}` : ""}
            </Text>
          ) : null}
          {displayUrl ? (
            <View style={styles.compareRow}>
              <View style={styles.comparePane}>
                <Text style={styles.compareLabel}>Before</Text>
                {activePersonUri ? <Image source={{ uri: activePersonUri }} style={styles.compareImage} /> : null}
              </View>
              <View style={styles.comparePane}>
                <Text style={styles.compareLabel}>Result</Text>
                <Image
                  key={`${imageKey}-${displaySource}`}
                  source={{ uri: cacheBust(displayUrl, imageKey) }}
                  style={styles.compareImage}
                  onError={() => void handleResultImageError()}
                  onLoad={() => {
                    setImageStatus("loaded");
                    setLastFailedSignedPath(null);
                  }}
                />
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>No result image URL is available.</Text>
          )}
          {failedImageUrl ? (
            <Pressable style={styles.secondaryButton} onPress={() => void handleResultImageError()}>
              <Text style={styles.secondaryText}>Retry image refresh</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.secondaryButton, (!activePersonUri || !activeGarmentUri || lastSavedLookJobId === result.job_id || schemaReady === "fail") && styles.secondaryButtonDisabled]}
            disabled={!activePersonUri || !activeGarmentUri || lastSavedLookJobId === result.job_id || schemaReady === "fail"}
            onPress={() => {
              if (!activePersonUri || !activeGarmentUri || !result) return;
              void persistLook(result, (result.render_mode as RenderMode | null) ?? renderMode, activePersonUri, activeGarmentUri, category).then((synced) => {
                if (synced) setLastSavedLookJobId(result.job_id);
              });
            }}
          >
            <Text style={styles.secondaryText}>{lastSavedLookJobId === result.job_id ? "Look Saved" : "Save Look"}</Text>
          </Pressable>
          {result.render_mode === "preview" || (!result.render_mode && renderMode === "preview") ? (
            <Pressable style={[styles.secondaryButton, loading && styles.secondaryButtonDisabled]} disabled={loading} onPress={() => void run("hd")}>
              <Text style={styles.secondaryText}>Render again in HD</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={styles.empty}>Select a person image and garment image, then run the backend pipeline.</Text>
      )}

      <View style={styles.history}>
        <Text style={styles.historyTitle}>Saved Looks</Text>
        {savedLooks.length ? (
          savedLooks.map((look) => (
            <Pressable key={look.id} style={styles.lookRow} onPress={() => void loadLook(look)}>
              <Image
                source={{ uri: savedLookThumbnailUrl(look) }}
                style={styles.lookThumb}
                onError={() => setError(`Saved Look thumbnail failed for ${look.name}. Open the look to refresh the result image.`)}
              />
              <View style={styles.lookMeta}>
                <TextInput
                  value={look.name}
                  onChangeText={(value) => void renameLook(look.id, value)}
                  style={styles.lookNameInput}
                />
                <Text style={styles.lookDetail}>
                  {look.width ?? "?"}x{look.height ?? "?"} | {look.steps ?? "?"} steps | {look.elapsedSeconds ? `${look.elapsedSeconds}s` : "saved"}
                </Text>
                {selectedLookId === look.id ? (
                  <Text style={styles.lookDetail}>
                    {look.renderMode} | {look.backend ?? "backend"} | {new Date(look.createdAt).toLocaleString()}
                  </Text>
                ) : null}
              </View>
              {look.renderMode === "preview" ? (
                <Pressable style={styles.inlineButton} onPress={() => {
                  void loadLook(look);
                  void run("hd", { personUri: look.personUri, garmentUri: look.garmentUri, category: look.category });
                }}>
                  <Text style={styles.inlineButtonText}>HD</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.deleteButton} onPress={() => void removeLook(look.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>Generated looks will be saved here on this device.</Text>
        )}
      </View>
    </View>
  );
}

function ImageSlot({ label, uri, onPress }: { label: string; uri: string | null; onPress: () => void }) {
  return (
    <Pressable style={styles.slot} onPress={onPress}>
      {uri ? <Image source={{ uri }} style={styles.slotImage} /> : <Text style={styles.slotEmpty}>{label}</Text>}
      <Text style={styles.slotLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "900", color: "#222831" },
  status: { color: "#69707d", fontWeight: "700" },
  input: { backgroundColor: "#fff", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, color: "#222831", padding: 10 },
  backendChecks: { flexDirection: "row", gap: 8 },
  schemaButton: { alignItems: "center", backgroundColor: "#fff", borderColor: "#2f6f73", borderRadius: 8, borderWidth: 1, flex: 1, minHeight: 42, justifyContent: "center", padding: 10 },
  schemaButtonFailed: { borderColor: "#b44444" },
  schemaButtonText: { color: "#2f6f73", fontWeight: "900", textAlign: "center" },
  schemaBlocked: { color: "#9b3333", fontSize: 12, fontWeight: "800" },
  pickGrid: { flexDirection: "row", gap: 10 },
  pickColumn: { flex: 1, gap: 8 },
  slot: { flex: 1, minHeight: 180, borderRadius: 8, borderWidth: 1, borderColor: "#d9dee7", backgroundColor: "#fff", overflow: "hidden" },
  slotImage: { flex: 1, minHeight: 144, resizeMode: "contain", backgroundColor: "#f4f0eb" },
  slotEmpty: { flex: 1, minHeight: 144, textAlign: "center", textAlignVertical: "center", color: "#69707d", fontWeight: "800", paddingTop: 60 },
  slotLabel: { padding: 8, color: "#222831", fontWeight: "800", textAlign: "center" },
  segment: { flexDirection: "row", backgroundColor: "#e6ebef", borderRadius: 8, padding: 3 },
  segmentButton: { flex: 1, alignItems: "center", borderRadius: 6, padding: 9 },
  segmentActive: { backgroundColor: "#fff" },
  segmentText: { color: "#58606d", fontWeight: "800" },
  segmentTextActive: { color: "#2f6f73" },
  garments: { flexDirection: "row", gap: 8, minHeight: 58 },
  garment: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: "#d9dee7", backgroundColor: "#fff", padding: 4 },
  garmentActive: { borderColor: "#2f6f73", borderWidth: 2 },
  garmentImage: { width: "100%", height: "100%", resizeMode: "contain" },
  runButton: { alignItems: "center", backgroundColor: "#2f6f73", borderRadius: 8, minHeight: 44, justifyContent: "center", padding: 12 },
  runButtonDisabled: { backgroundColor: "#8aa7aa" },
  runText: { color: "#fff", fontWeight: "900" },
  saveAssetButton: { alignItems: "center", backgroundColor: "#e6ebef", borderColor: "#2f6f73", borderRadius: 8, borderWidth: 1, padding: 10 },
  saveAssetDisabled: { borderColor: "#b7c1c9", opacity: 0.65 },
  saveAssetText: { color: "#2f6f73", fontWeight: "900" },
  progress: { color: "#58606d", fontWeight: "700", textAlign: "center" },
  error: { color: "#b44444", fontWeight: "700" },
  empty: { color: "#69707d", textAlign: "center", paddingVertical: 12 },
  resultWrap: { gap: 8 },
  resultMeta: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  metaText: { color: "#58606d", fontSize: 12, fontWeight: "700", maxWidth: "48%" },
  debugText: { color: "#69707d", fontSize: 11, fontWeight: "800" },
  result: { width: "100%", aspectRatio: 1, backgroundColor: "#f4f0eb", borderRadius: 8, resizeMode: "contain" },
  compareRow: { flexDirection: "row", gap: 8 },
  comparePane: { flex: 1, gap: 4 },
  compareLabel: { color: "#58606d", fontSize: 11, fontWeight: "900" },
  compareImage: { width: "100%", aspectRatio: 0.75, backgroundColor: "#f4f0eb", borderRadius: 8, resizeMode: "contain" },
  secondaryButton: { alignItems: "center", borderColor: "#2f6f73", borderRadius: 8, borderWidth: 1, padding: 10 },
  secondaryButtonDisabled: { borderColor: "#8aa7aa" },
  secondaryText: { color: "#2f6f73", fontWeight: "900" },
  history: { gap: 8, marginTop: 4 },
  historyTitle: { color: "#222831", fontSize: 15, fontWeight: "900" },
  lookRow: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 10, padding: 8 },
  lookThumb: { backgroundColor: "#f4f0eb", borderRadius: 6, height: 58, resizeMode: "cover", width: 46 },
  lookMeta: { flex: 1, gap: 2 },
  lookNameInput: { color: "#222831", fontWeight: "900", padding: 0 },
  lookDetail: { color: "#69707d", fontSize: 12, fontWeight: "700" },
  inlineButton: { backgroundColor: "#e6ebef", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  inlineButtonText: { color: "#2f6f73", fontWeight: "900" },
  deleteButton: { backgroundColor: "#f7e5e5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 8 },
  deleteText: { color: "#9b3333", fontSize: 11, fontWeight: "900" }
});

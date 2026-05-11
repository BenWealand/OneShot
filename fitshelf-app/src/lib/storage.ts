import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { ensureSupabaseProfile, supabase } from "./supabase";
import type { AvatarMeasurements, ClothingItem, Mannequin, Outfit, SavedLook } from "../types/models";
import type { TryOnResponse } from "./tryonApi";

const assetBucket = "fitshelf-assets";
const stabilizationPatchFile = "ai/supabase/stabilization_patch.sql";

const keys = {
  mannequins: "fitshelf:mannequins",
  clothing: "fitshelf:clothing",
  outfits: "fitshelf:outfits",
  savedLooks: "fitshelf:savedLooks",
  avatarMeasurements: "fitshelf:avatarMeasurements"
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function dbMessage(table: string, message: string) {
  const sanitized = message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 240);
  const lower = sanitized.toLowerCase();
  const patchHint = lower.includes("schema cache") || lower.includes("could not find") || lower.includes("column")
    ? ` Run ${stabilizationPatchFile} in Supabase SQL editor, then rerun Test Backend Schema and Test DB Write.`
    : "";
  return `${table}: ${sanitized}${patchHint}`;
}

function extensionFor(uri: string) {
  const clean = uri.split("?")[0]?.split("#")[0] ?? "";
  const lastSegment = clean.split("/").pop() ?? "";
  const extension = lastSegment.includes(".") ? lastSegment.split(".").pop()?.toLowerCase() : null;
  if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "webp") return extension;
  return "jpg";
}

function contentTypeFor(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

function publicAssetUrl(storagePath?: string | null) {
  if (!supabase || !storagePath) return null;
  const { data } = supabase.storage.from(assetBucket).getPublicUrl(storagePath);
  return data.publicUrl || null;
}

function mergeLocalFallbacks<T extends { id: string; storagePath?: string | null; resultStoragePath?: string | null }>(remote: T[], local: T[]) {
  const remoteIds = new Set(remote.map((item) => item.id));
  return [...remote, ...local.filter((item) => !remoteIds.has(item.id))];
}

function isLocalNewer(localUpdatedAt?: string | null, remoteUpdatedAt?: string | null) {
  if (!localUpdatedAt) return false;
  if (!remoteUpdatedAt) return true;
  return new Date(localUpdatedAt).getTime() > new Date(remoteUpdatedAt).getTime();
}

function base64ToArrayBuffer(base64: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = base64.replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = chars.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes).buffer;
}

async function readUploadBody(uri: string): Promise<{ body: ArrayBuffer; contentType: string; extension: string }> {
  const extension = extensionFor(uri);
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`asset fetch returned ${response.status}`);
    return {
      body: await response.arrayBuffer(),
      contentType: response.headers.get("content-type") ?? contentTypeFor(extension),
      extension
    };
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return { body: base64ToArrayBuffer(base64), contentType: contentTypeFor(extension), extension };
}

async function getProfileForWrite(): Promise<string | null> {
  if (!supabase) return null;
  const profile = await ensureSupabaseProfile();
  if (profile.error) throw new Error(profile.error);
  return profile.userId;
}

export async function uploadAsset(localUri: string, folder: "mannequins" | "clothing"): Promise<{ imageUri: string; storagePath: string | null }> {
  if (!supabase) return { imageUri: localUri, storagePath: null };
  const userId = await getProfileForWrite();
  if (!userId) return { imageUri: localUri, storagePath: null };

  const uploadBody = await readUploadBody(localUri);
  const path = `${userId}/${folder}/${Date.now()}.${uploadBody.extension}`;
  const { error } = await supabase.storage.from(assetBucket).upload(path, uploadBody.body, {
    contentType: uploadBody.contentType,
    upsert: true
  });
  if (error) throw new Error(dbMessage(`storage.${assetBucket}`, error.message));
  const { data } = supabase.storage.from(assetBucket).getPublicUrl(path);
  return { imageUri: data.publicUrl, storagePath: path };
}

export async function loadMannequins(): Promise<Mannequin[]> {
  const local = await readJson<Mannequin[]>(keys.mannequins, []);
  if (!supabase) return local;
  const profile = await ensureSupabaseProfile();
  if (!profile.userId) return local;
  const { data, error } = await supabase
    .from("person_images")
    .select("*")
    .eq("user_id", profile.userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(dbMessage("person_images load", error.message));
  if (!data) return local;
  const remote = data.map((row) => ({
    id: row.id,
    name: row.label ?? "Person image",
    imageUri: row.image_url ?? publicAssetUrl(row.storage_path) ?? row.storage_path,
    storagePath: row.storage_path ?? null,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at
  }));
  return mergeLocalFallbacks(remote, local);
}

export async function saveMannequins(items: Mannequin[]): Promise<void> {
  await writeJson(keys.mannequins, items);
  if (!supabase) return;
  const userId = await getProfileForWrite();
  if (!userId) return;
  const syncable = items.filter((item) => item.storagePath);
  if (!syncable.length) return;
  const { error } = await supabase.from("person_images").upsert(
    syncable.map((item) => ({
      id: item.id,
      user_id: userId,
      label: item.name,
      storage_path: item.storagePath,
      image_url: item.imageUri,
      is_default: item.isDefault,
      created_at: item.createdAt
    }))
  );
  if (error) throw new Error(dbMessage("person_images", error.message));
}

export async function deleteMannequinRecord(id: string, current: Mannequin[]): Promise<Mannequin[]> {
  const next = current.filter((item) => item.id !== id);
  const target = current.find((item) => item.id === id);
  if (!supabase || !target?.storagePath) {
    await writeJson(keys.mannequins, next);
    return next;
  }
  const userId = await getProfileForWrite();
  if (!userId) {
    await writeJson(keys.mannequins, next);
    return next;
  }
  const { error } = await supabase.from("person_images").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(dbMessage("person_images delete", error.message));
  await writeJson(keys.mannequins, next);
  return next;
}

export async function loadClothing(): Promise<ClothingItem[]> {
  const local = await readJson<ClothingItem[]>(keys.clothing, []);
  if (!supabase) return local;
  const profile = await ensureSupabaseProfile();
  if (!profile.userId) return local;
  const { data, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("user_id", profile.userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(dbMessage("wardrobe_items load", error.message));
  if (!data) return local;
  const remote = data.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    imageUri: row.image_url ?? publicAssetUrl(row.storage_path) ?? row.storage_path,
    storagePath: row.storage_path ?? null,
    sourceUrl: row.source_url ?? null,
    brand: row.brand ?? null,
    color: row.color ?? null,
    notes: row.notes ?? null,
    favorite: Boolean(row.favorite),
    createdAt: row.created_at
  }));
  return mergeLocalFallbacks(remote, local);
}

export async function saveClothing(items: ClothingItem[]): Promise<void> {
  await writeJson(keys.clothing, items);
  if (!supabase) return;
  const userId = await getProfileForWrite();
  if (!userId) return;
  const syncable = items.filter((item) => item.storagePath);
  if (!syncable.length) return;
  const { error } = await supabase.from("wardrobe_items").upsert(
    syncable.map((item) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      storage_path: item.storagePath,
      image_url: item.imageUri,
      source_url: item.sourceUrl,
      brand: item.brand,
      color: item.color,
      notes: item.notes,
      favorite: item.favorite,
      created_at: item.createdAt
    }))
  );
  if (error) throw new Error(dbMessage("wardrobe_items", error.message));
}

export async function deleteClothingRecord(id: string, current: ClothingItem[]): Promise<ClothingItem[]> {
  const next = current.filter((item) => item.id !== id);
  const target = current.find((item) => item.id === id);
  if (!supabase || !target?.storagePath) {
    await writeJson(keys.clothing, next);
    return next;
  }
  const userId = await getProfileForWrite();
  if (!userId) {
    await writeJson(keys.clothing, next);
    return next;
  }
  const { error } = await supabase.from("wardrobe_items").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(dbMessage("wardrobe_items delete", error.message));
  await writeJson(keys.clothing, next);
  return next;
}

export async function loadOutfits(): Promise<Outfit[]> {
  const local = await readJson<Outfit[]>(keys.outfits, []);
  return local;
}

export async function saveOutfits(items: Outfit[]): Promise<void> {
  await writeJson(keys.outfits, items);
}

export async function loadSavedLooks(): Promise<SavedLook[]> {
  const local = await readJson<SavedLook[]>(keys.savedLooks, []);
  if (!supabase) return local;
  const userId = await getProfileForWrite();
  if (!userId) return local;
  const { data, error } = await supabase
    .from("saved_looks")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(dbMessage("saved_looks load", error.message));
  if (!data) return local;
  const remote = data.map((row) => ({
    id: row.id,
    name: row.name,
    jobId: row.tryon_job_id ?? row.id,
    resultUrl: row.result_url,
    resultStoragePath: row.result_storage_path ?? null,
    localResultUrl: row.local_result_url ?? null,
    personUri: row.person_uri ?? "",
    garmentUri: row.garment_uri ?? "",
    category: row.category,
    renderMode: row.render_mode,
    width: row.width,
    height: row.height,
    steps: row.steps,
    precision: row.precision,
    backend: row.backend,
    elapsedSeconds: row.elapsed_seconds,
    createdAt: row.created_at
  }));
  return mergeLocalFallbacks(remote, local);
}

export async function saveSavedLooks(items: SavedLook[]): Promise<void> {
  await writeJson(keys.savedLooks, items);
  if (!supabase) return;
  const userId = await getProfileForWrite();
  if (!userId) return;
  const { error } = await supabase.from("saved_looks").upsert(
    items.map((item) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      tryon_job_id: item.jobId || null,
      category: item.category,
      render_mode: item.renderMode,
      width: item.width,
      height: item.height,
      steps: item.steps,
      precision: item.precision,
      backend: item.backend,
      result_url: item.resultUrl,
      result_storage_path: item.resultStoragePath,
      local_result_url: item.localResultUrl,
      person_uri: item.personUri,
      garment_uri: item.garmentUri,
      elapsed_seconds: item.elapsedSeconds,
      created_at: item.createdAt,
      updated_at: new Date().toISOString()
    }))
  );
  if (error) {
    throw new Error(dbMessage("saved_looks", error.message));
  }
}

export async function saveSavedLooksLocally(items: SavedLook[]): Promise<void> {
  await writeJson(keys.savedLooks, items);
}

export async function deleteSavedLook(lookId: string, current: SavedLook[]): Promise<SavedLook[]> {
  const next = current.filter((item) => item.id !== lookId);
  if (supabase) {
    const userId = await getProfileForWrite();
    if (userId) {
      const { error } = await supabase.from("saved_looks").delete().eq("id", lookId).eq("user_id", userId);
      if (error) throw new Error(dbMessage("saved_looks delete", error.message));
    }
  }
  await writeJson(keys.savedLooks, next);
  return next;
}

export async function saveTryOnJobRecord(response: TryOnResponse): Promise<void> {
  if (!supabase || !response.job_id) return;
  const userId = await getProfileForWrite();
  if (!userId) return;
  const { error } = await supabase.from("tryon_jobs").upsert({
    id: response.job_id,
    user_id: userId,
    category: response.category ?? "upper",
    render_mode: response.render_mode ?? null,
    width: response.width ?? null,
    height: response.height ?? null,
    steps: response.steps ?? null,
    precision: response.precision ?? null,
    backend: response.backend ?? null,
    status: response.status,
    result_storage_path: response.supabase_storage_path ?? null,
    result_url: response.result_url ?? response.supabase_result_url ?? response.local_result_url ?? null,
    error: response.error ?? null,
    elapsed_seconds: response.elapsed_seconds ?? null,
    completed_at: response.status === "completed" ? new Date().toISOString() : null
  });
  if (error) throw new Error(dbMessage("tryon_jobs", error.message));
}

export async function loadAvatarMeasurements(): Promise<AvatarMeasurements> {
  const fallback = await readJson<AvatarMeasurements>(keys.avatarMeasurements, {
    avatarMode: "female",
    height: 68,
    weight: 145,
    chest: 36,
    waist: 30,
    hips: 39,
    inseam: 30,
    shoulderWidth: 16,
    updatedAt: ""
  });
  if (!supabase) return fallback;
  const userId = await getProfileForWrite();
  if (!userId) return fallback;
  const { data, error } = await supabase.from("avatar_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(dbMessage("avatar_profiles load", error.message));
  if (!data) return fallback;
  const remote = {
    avatarMode: data.avatar_mode ?? "female",
    height: Number(data.height ?? fallback.height),
    weight: Number(data.weight ?? fallback.weight),
    chest: Number(data.chest ?? fallback.chest),
    waist: Number(data.waist ?? fallback.waist),
    hips: Number(data.hips ?? fallback.hips),
    inseam: Number(data.inseam ?? fallback.inseam),
    shoulderWidth: Number(data.shoulder_width ?? fallback.shoulderWidth),
    updatedAt: data.updated_at ?? fallback.updatedAt
  };
  return isLocalNewer(fallback.updatedAt, remote.updatedAt) ? fallback : remote;
}

export async function saveAvatarMeasurements(profile: AvatarMeasurements): Promise<void> {
  await writeJson(keys.avatarMeasurements, profile);
  if (!supabase) return;
  const userId = await getProfileForWrite();
  if (!userId) return;
  const { error } = await supabase.from("avatar_profiles").upsert({
    user_id: userId,
    avatar_mode: profile.avatarMode,
    height: profile.height,
    weight: profile.weight,
    chest: profile.chest,
    waist: profile.waist,
    hips: profile.hips,
    inseam: profile.inseam,
    shoulder_width: profile.shoulderWidth,
    updated_at: profile.updatedAt || new Date().toISOString()
  });
  if (error) {
    throw new Error(dbMessage("avatar_profiles", error.message));
  }
}

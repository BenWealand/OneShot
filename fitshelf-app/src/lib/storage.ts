import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { ClothingItem, Mannequin, Outfit } from "../types/models";

const assetBucket = "fitshelf-assets";

const keys = {
  mannequins: "fitshelf:mannequins",
  clothing: "fitshelf:clothing",
  outfits: "fitshelf:outfits"
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function uploadAsset(localUri: string, folder: "mannequins" | "clothing"): Promise<string> {
  if (!supabase) return localUri;
  const userId = await getUserId();
  if (!userId) return localUri;

  const response = await fetch(localUri);
  const blob = await response.blob();
  const extension = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${userId}/${folder}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(assetBucket).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: true
  });
  if (error) return localUri;
  const { data } = supabase.storage.from(assetBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function loadMannequins(): Promise<Mannequin[]> {
  const local = await readJson<Mannequin[]>(keys.mannequins, []);
  if (!supabase) return local;
  const { data, error } = await supabase.from("mannequins").select("*").order("created_at", { ascending: false });
  if (error || !data) return local;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    imageUri: row.image_uri,
    createdAt: row.created_at
  }));
}

export async function saveMannequins(items: Mannequin[]): Promise<void> {
  await writeJson(keys.mannequins, items);
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("mannequins").upsert(
    items.map((item) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      image_uri: item.imageUri,
      created_at: item.createdAt
    }))
  );
}

export async function loadClothing(): Promise<ClothingItem[]> {
  const local = await readJson<ClothingItem[]>(keys.clothing, []);
  if (!supabase) return local;
  const { data, error } = await supabase.from("clothing_items").select("*").order("created_at", { ascending: false });
  if (error || !data) return local;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    imageUri: row.image_uri,
    createdAt: row.created_at
  }));
}

export async function saveClothing(items: ClothingItem[]): Promise<void> {
  await writeJson(keys.clothing, items);
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("clothing_items").upsert(
    items.map((item) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      image_uri: item.imageUri,
      created_at: item.createdAt
    }))
  );
}

export async function loadOutfits(): Promise<Outfit[]> {
  const local = await readJson<Outfit[]>(keys.outfits, []);
  if (!supabase) return local;
  const { data, error } = await supabase.from("outfits").select("*").order("updated_at", { ascending: false });
  if (error || !data) return local;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    mannequinId: row.mannequin_id,
    mannequinUri: row.mannequin_uri ?? local.find((outfit) => outfit.id === row.id)?.mannequinUri ?? null,
    layers: row.layers,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function saveOutfits(items: Outfit[]): Promise<void> {
  await writeJson(keys.outfits, items);
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("outfits").upsert(
    items.map((item) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      mannequin_id: item.mannequinId,
      mannequin_uri: item.mannequinUri,
      layers: item.layers,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }))
  );
}

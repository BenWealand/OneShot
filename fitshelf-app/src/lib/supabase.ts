import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;

export type SupabaseConnectionStatus = {
  configured: boolean;
  authenticated: boolean;
  ok: boolean;
  message: string;
};

export const authRedirectPath = "auth/callback";
const stabilizationPatchFile = "ai/supabase/stabilization_patch.sql";

export function getAuthRedirectUrl(): string {
  return Linking.createURL(authRedirectPath);
}

function messageFor(table: string, message: string) {
  const sanitized = message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 240);
  const lower = sanitized.toLowerCase();
  const patchHint = lower.includes("schema cache") || lower.includes("could not find") || lower.includes("column")
    ? ` Run ${stabilizationPatchFile} in Supabase SQL editor, then rerun Test Backend Schema and Test DB Write.`
    : "";
  return `${table}: ${sanitized}${patchHint}`;
}

function uuid() {
  const fallback = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
  return globalThis.crypto?.randomUUID?.() ?? fallback;
}

function textToArrayBuffer(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes.buffer;
}

function paramsFromUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const section of [url.split("?")[1], url.split("#")[1]]) {
    if (!section) continue;
    for (const pair of section.split("&")) {
      const [rawKey, rawValue = ""] = pair.split("=");
      if (!rawKey) continue;
      params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
    }
  }
  return params;
}

export async function handleSupabaseAuthCallback(url: string): Promise<SupabaseConnectionStatus> {
  if (!supabase) {
    return { configured: false, authenticated: false, ok: false, message: "Supabase env is missing; auth callback ignored." };
  }
  const params = paramsFromUrl(url);
  if (params.error || params.error_description) {
    return {
      configured: true,
      authenticated: false,
      ok: false,
      message: messageFor("auth callback", params.error_description || params.error || "Unknown auth callback error")
    };
  }
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { configured: true, authenticated: false, ok: false, message: messageFor("auth callback", error.message) };
  } else if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token
    });
    if (error) return { configured: true, authenticated: false, ok: false, message: messageFor("auth callback", error.message) };
  } else {
    return { configured: true, authenticated: false, ok: false, message: "Auth callback did not include a code or token session." };
  }
  const profile = await ensureSupabaseProfile();
  if (!profile.userId) {
    return { configured: true, authenticated: true, ok: false, message: profile.error ?? "Auth callback succeeded but profile creation failed." };
  }
  return { configured: true, authenticated: true, ok: true, message: "Email verified. Session restored and profile is ready." };
}

export async function ensureSupabaseProfile(): Promise<{ userId: string | null; email: string | null; error: string | null }> {
  if (!supabase) return { userId: null, email: null, error: "Supabase env is missing." };
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError) return { userId: null, email: null, error: messageFor("auth", userError.message) };
  const user = data.user;
  if (!user) return { userId: null, email: null, error: "No authenticated Supabase session." };
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null
  });
  if (error) return { userId: null, email: user.email ?? null, error: messageFor("profiles", error.message) };
  return { userId: user.id, email: user.email ?? null, error: null };
}

export async function testSupabaseDbWrite(): Promise<SupabaseConnectionStatus> {
  if (!supabase) {
    return { configured: false, authenticated: false, ok: false, message: "Supabase env is missing; local storage is active." };
  }
  const profile = await ensureSupabaseProfile();
  if (!profile.userId) {
    return { configured: true, authenticated: false, ok: false, message: profile.error ?? "Sign in to test Supabase writes." };
  }

  const personId = uuid();
  const wardrobeId = uuid();
  const jobId = uuid();
  const testId = `db-test-${profile.userId}`;
  let previousAvatarProfile: Record<string, unknown> | null = null;
  let checkedPreviousAvatarProfile = false;

  async function cleanupTestRows() {
    await supabase?.from("saved_looks").delete().eq("id", testId).eq("user_id", profile.userId);
    await supabase?.from("tryon_jobs").delete().eq("id", jobId).eq("user_id", profile.userId);
    await supabase?.from("wardrobe_items").delete().eq("id", wardrobeId).eq("user_id", profile.userId);
    await supabase?.from("person_images").delete().eq("id", personId).eq("user_id", profile.userId);
    if (checkedPreviousAvatarProfile && previousAvatarProfile) {
      await supabase?.from("avatar_profiles").upsert(previousAvatarProfile);
    } else if (checkedPreviousAvatarProfile) {
      await supabase?.from("avatar_profiles").delete().eq("user_id", profile.userId);
    }
  }

  async function fail(message: string): Promise<SupabaseConnectionStatus> {
    await cleanupTestRows();
    return { configured: true, authenticated: true, ok: false, message };
  }

  const { data: profileRow, error: profileReadError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profile.userId)
    .maybeSingle();
  if (profileReadError) return fail(messageFor("profiles read", profileReadError.message));
  if (!profileRow?.id) return fail("profiles read: profile row was not returned after upsert.");

  const { data: existingAvatar, error: existingAvatarError } = await supabase
    .from("avatar_profiles")
    .select("*")
    .eq("user_id", profile.userId)
    .maybeSingle();
  if (existingAvatarError) return fail(messageFor("avatar_profiles existing read", existingAvatarError.message));
  previousAvatarProfile = existingAvatar as Record<string, unknown> | null;
  checkedPreviousAvatarProfile = true;

  const avatarRow = {
    user_id: profile.userId,
    avatar_mode: "female",
    height: 68,
    weight: 145,
    chest: 36,
    waist: 30,
    hips: 39,
    inseam: 30,
    shoulder_width: 16,
    updated_at: new Date().toISOString()
  };
  const { error: avatarWriteError } = await supabase.from("avatar_profiles").upsert(avatarRow);
  if (avatarWriteError) return fail(messageFor("avatar_profiles write", avatarWriteError.message));
  const { data: avatarData, error: avatarReadError } = await supabase
    .from("avatar_profiles")
    .select("user_id")
    .eq("user_id", profile.userId)
    .maybeSingle();
  if (avatarReadError) return fail(messageFor("avatar_profiles read", avatarReadError.message));
  if (!avatarData?.user_id) return fail("avatar_profiles read: test row was not returned.");

  const { error: personWriteError } = await supabase.from("person_images").upsert({
    id: personId,
    user_id: profile.userId,
    label: "FitShelf DB write test person",
    storage_path: `_db-test/${personId}.jpg`,
    image_url: "fitshelf-db-test://person",
    is_default: false
  });
  if (personWriteError) return fail(messageFor("person_images write", personWriteError.message));
  const { data: personData, error: personReadError } = await supabase
    .from("person_images")
    .select("id")
    .eq("id", personId)
    .eq("user_id", profile.userId)
    .maybeSingle();
  if (personReadError) return fail(messageFor("person_images read", personReadError.message));
  if (!personData?.id) return fail("person_images read: test row was not returned.");

  const { error: wardrobeWriteError } = await supabase.from("wardrobe_items").upsert({
    id: wardrobeId,
    user_id: profile.userId,
    name: "FitShelf DB write test garment",
    category: "top",
    storage_path: `_db-test/${wardrobeId}.jpg`,
    image_url: "fitshelf-db-test://garment",
    favorite: false
  });
  if (wardrobeWriteError) return fail(messageFor("wardrobe_items write", wardrobeWriteError.message));
  const { data: wardrobeData, error: wardrobeReadError } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("id", wardrobeId)
    .eq("user_id", profile.userId)
    .maybeSingle();
  if (wardrobeReadError) return fail(messageFor("wardrobe_items read", wardrobeReadError.message));
  if (!wardrobeData?.id) return fail("wardrobe_items read: test row was not returned.");

  const { error: jobWriteError } = await supabase.from("tryon_jobs").upsert({
    id: jobId,
    user_id: profile.userId,
    person_image_id: personId,
    wardrobe_item_id: wardrobeId,
    category: "upper",
    render_mode: "preview",
    status: "completed",
    result_url: "fitshelf-db-test://result",
    completed_at: new Date().toISOString()
  });
  if (jobWriteError) return fail(messageFor("tryon_jobs write", jobWriteError.message));
  const { data: jobData, error: jobReadError } = await supabase
    .from("tryon_jobs")
    .select("id")
    .eq("id", jobId)
    .eq("user_id", profile.userId)
    .maybeSingle();
  if (jobReadError) return fail(messageFor("tryon_jobs read", jobReadError.message));
  if (!jobData?.id) return fail("tryon_jobs read: test row was not returned.");

  const row = {
    id: testId,
    user_id: profile.userId,
    name: "FitShelf DB write test",
    tryon_job_id: jobId,
    category: "upper",
    render_mode: "preview",
    result_url: "fitshelf-db-test://local",
    result_storage_path: null,
    local_result_url: "fitshelf-db-test://local",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { error: writeError } = await supabase.from("saved_looks").upsert(row);
  if (writeError) return fail(messageFor("saved_looks write", writeError.message));
  const { data, error: readError } = await supabase
    .from("saved_looks")
    .select("id")
    .eq("id", testId)
    .eq("user_id", profile.userId)
    .maybeSingle();
  if (readError) return fail(messageFor("saved_looks read", readError.message));
  if (!data?.id) return fail("saved_looks read: test row was not returned.");
  const { error: deleteError } = await supabase.from("saved_looks").delete().eq("id", testId).eq("user_id", profile.userId);
  if (deleteError) return fail(messageFor("saved_looks delete", deleteError.message));
  const { error: jobDeleteError } = await supabase.from("tryon_jobs").delete().eq("id", jobId).eq("user_id", profile.userId);
  if (jobDeleteError) return fail(messageFor("tryon_jobs delete", jobDeleteError.message));
  const { error: wardrobeDeleteError } = await supabase.from("wardrobe_items").delete().eq("id", wardrobeId).eq("user_id", profile.userId);
  if (wardrobeDeleteError) return fail(messageFor("wardrobe_items delete", wardrobeDeleteError.message));
  const { error: personDeleteError } = await supabase.from("person_images").delete().eq("id", personId).eq("user_id", profile.userId);
  if (personDeleteError) return fail(messageFor("person_images delete", personDeleteError.message));
  await cleanupTestRows();
  return { configured: true, authenticated: true, ok: true, message: "Supabase DB passed: profiles, person_images, wardrobe_items, tryon_jobs, saved_looks, and avatar_profiles are writable." };
}

export async function testSupabaseAssetUpload(): Promise<SupabaseConnectionStatus> {
  if (!supabase) {
    return { configured: false, authenticated: false, ok: false, message: "Supabase env is missing; asset upload test skipped." };
  }
  const profile = await ensureSupabaseProfile();
  if (!profile.userId) {
    return { configured: true, authenticated: false, ok: false, message: profile.error ?? "Sign in to test asset uploads." };
  }
  const path = `${profile.userId}/_debug/fitshelf-asset-upload-${Date.now()}.txt`;
  const body = textToArrayBuffer(`fitshelf asset upload check ${new Date().toISOString()}`);
  const { error: uploadError } = await supabase.storage.from("fitshelf-assets").upload(path, body, {
    contentType: "text/plain",
    upsert: true
  });
  if (uploadError) return { configured: true, authenticated: true, ok: false, message: messageFor("storage.fitshelf-assets upload", uploadError.message) };
  const { data } = supabase.storage.from("fitshelf-assets").getPublicUrl(path);
  if (!data.publicUrl) return { configured: true, authenticated: true, ok: false, message: "storage.fitshelf-assets public URL was not returned." };
  const { error: removeError } = await supabase.storage.from("fitshelf-assets").remove([path]);
  if (removeError) return { configured: true, authenticated: true, ok: false, message: messageFor("storage.fitshelf-assets delete", removeError.message) };
  return { configured: true, authenticated: true, ok: true, message: "Supabase asset upload passed: fitshelf-assets accepts this user's storage path." };
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!supabase) {
    return { configured: false, authenticated: false, ok: false, message: "Supabase env is missing; local storage is active." };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    return { configured: true, authenticated: false, ok: false, message: "Supabase is configured; sign in to sync." };
  }
  const profile = await ensureSupabaseProfile();
  if (!profile.userId) {
    return { configured: true, authenticated: true, ok: false, message: profile.error ?? "Profile creation failed." };
  }
  const { error } = await supabase.from("profiles").select("id").eq("id", sessionData.session.user.id).maybeSingle();
  if (error) {
    return { configured: true, authenticated: true, ok: false, message: messageFor("profiles", error.message) };
  }
  return { configured: true, authenticated: true, ok: true, message: "Supabase sync is available." };
}

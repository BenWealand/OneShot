import type { RenderMode, TryOnCategory } from "../types/models";

const defaultBackendUrl = process.env.EXPO_PUBLIC_FITSHELF_BACKEND_URL || "http://127.0.0.1:8000";

export type TryOnResponse = {
  job_id: string;
  status: string;
  category?: string;
  render_mode?: RenderMode | string | null;
  width?: number | null;
  height?: number | null;
  steps?: number | null;
  precision?: string | null;
  backend?: string | null;
  elapsed_seconds?: number | null;
  result_url?: string | null;
  local_result_url?: string | null;
  supabase_result_url?: string | null;
  supabase_proxy_url?: string | null;
  supabase_storage_path?: string | null;
  metadata_url?: string | null;
  job_url?: string | null;
  error?: string | null;
};

export type BackendSchemaHealth = {
  configured: boolean;
  ok: boolean;
  missing: string[];
  patch_file?: string;
  error: string | null;
};

export type BackendDbHealth = {
  configured: boolean;
  profile_write_ok: boolean;
  profile_read_ok: boolean;
  profile_delete_ok: boolean;
  priority_tables_ok: boolean;
  patch_file?: string;
  error: string | null;
};

const modeTimeouts: Record<RenderMode, number> = {
  preview: 240000,
  hd: 1200000
};

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

function filePart(uri: string, name: string) {
  const extension = extensionFor(uri);
  return {
    uri,
    name: `${name}.${extension}`,
    type: contentTypeFor(extension)
  } as unknown as Blob;
}

export async function submitTryOn({
  backendUrl,
  personUri,
  garmentUri,
  category,
  renderMode
}: {
  backendUrl?: string;
  personUri: string;
  garmentUri: string;
  category: TryOnCategory;
  renderMode: RenderMode;
}): Promise<TryOnResponse> {
  const form = new FormData();
  form.append("category", category);
  form.append("render_mode", renderMode);
  form.append("person", filePart(personUri, "person"));
  form.append("garment", filePart(garmentUri, "garment"));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), modeTimeouts[renderMode]);

  try {
    const response = await fetch(`${backendUrl || defaultBackendUrl}/tryon`, {
      method: "POST",
      body: form,
      signal: controller.signal
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Try-on failed with status ${response.status}`);
    }
    return (await response.json()) as TryOnResponse;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`${renderMode === "hd" ? "HD" : "Preview"} render timed out. Check the backend, then retry.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getTryOnJob({ backendUrl, jobId }: { backendUrl?: string; jobId: string }): Promise<TryOnResponse> {
  const response = await fetch(`${backendUrl || defaultBackendUrl}/jobs/${jobId}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Job status failed with status ${response.status}`);
  }
  return (await response.json()) as TryOnResponse;
}

export async function refreshSupabaseSignedUrl({
  backendUrl,
  storagePath
}: {
  backendUrl?: string;
  storagePath: string;
}): Promise<TryOnResponse> {
  const response = await fetch(
    `${backendUrl || defaultBackendUrl}/supabase/sign?storage_path=${encodeURIComponent(storagePath)}`
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Signed URL refresh failed with status ${response.status}`);
  }
  return (await response.json()) as TryOnResponse;
}

export async function getBackendSchemaHealth({ backendUrl }: { backendUrl?: string }): Promise<BackendSchemaHealth> {
  const response = await fetch(`${backendUrl || defaultBackendUrl}/supabase/schema-health`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Schema health failed with status ${response.status}`);
  }
  return (await response.json()) as BackendSchemaHealth;
}

export async function getBackendDbHealth({ backendUrl }: { backendUrl?: string }): Promise<BackendDbHealth> {
  const response = await fetch(`${backendUrl || defaultBackendUrl}/supabase/db-health`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `DB health failed with status ${response.status}`);
  }
  return (await response.json()) as BackendDbHealth;
}

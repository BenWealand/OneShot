const defaultBackendUrl = process.env.EXPO_PUBLIC_FITSHELF_BACKEND_URL || "http://127.0.0.1:8000";

export type ProductImageCandidate = {
  image_url: string;
  source: string;
};

export async function fetchProductImages({
  backendUrl,
  url
}: {
  backendUrl?: string;
  url: string;
}): Promise<ProductImageCandidate[]> {
  const response = await fetch(`${backendUrl || defaultBackendUrl}/product/images?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Product image extraction failed with status ${response.status}`);
  }
  const payload = (await response.json()) as { candidates?: ProductImageCandidate[] };
  return payload.candidates ?? [];
}

export type ClothingCategory = "top" | "bottom" | "outerwear" | "dress" | "shoe" | "accessory";

export type TryOnCategory = "upper" | "lower" | "dress";

export type RenderMode = "preview" | "hd";

export type UserSession = {
  id: string;
  email: string;
  mode: "demo" | "supabase";
};

export type Mannequin = {
  id: string;
  name: string;
  imageUri: string;
  storagePath: string | null;
  isDefault: boolean;
  createdAt: string;
};

export type ClothingItem = {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUri: string;
  storagePath: string | null;
  sourceUrl: string | null;
  brand: string | null;
  color: string | null;
  notes: string | null;
  favorite: boolean;
  createdAt: string;
};

export type OutfitLayer = {
  id: string;
  clothingItemId: string;
  imageUri: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
};

export type Outfit = {
  id: string;
  name: string;
  mannequinId: string | null;
  mannequinUri: string | null;
  layers: OutfitLayer[];
  createdAt: string;
  updatedAt: string;
};

export type SavedLook = {
  id: string;
  name: string;
  jobId: string;
  resultUrl: string;
  resultStoragePath: string | null;
  localResultUrl: string | null;
  personUri: string;
  garmentUri: string;
  category: TryOnCategory;
  renderMode: RenderMode;
  width: number | null;
  height: number | null;
  steps: number | null;
  precision: string | null;
  backend: string | null;
  elapsedSeconds: number | null;
  createdAt: string;
};

export type AvatarMeasurements = {
  avatarMode: "female" | "male";
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  shoulderWidth: number;
  updatedAt: string;
};

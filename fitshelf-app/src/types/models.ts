export type ClothingCategory = "top" | "bottom" | "outerwear" | "dress" | "shoe" | "accessory";

export type UserSession = {
  id: string;
  email: string;
  mode: "demo" | "supabase";
};

export type Mannequin = {
  id: string;
  name: string;
  imageUri: string;
  createdAt: string;
};

export type ClothingItem = {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUri: string;
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

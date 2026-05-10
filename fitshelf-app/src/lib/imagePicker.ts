import * as ImagePicker from "expo-image-picker";

export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0]?.uri ?? null;
}

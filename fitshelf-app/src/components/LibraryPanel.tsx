import { Pressable, StyleSheet, Text, View, Image, FlatList } from "react-native";
import type { ClothingItem, Mannequin } from "../types/models";

type Props = {
  mannequins: Mannequin[];
  clothing: ClothingItem[];
  selectedMannequinId: string | null;
  onPickMannequin: () => void;
  onPickClothing: () => void;
  onSelectMannequin: (id: string) => void;
  onAddLayer: (item: ClothingItem) => void;
};

export function LibraryPanel({
  mannequins,
  clothing,
  selectedMannequinId,
  onPickMannequin,
  onPickClothing,
  onSelectMannequin,
  onAddLayer
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onPickMannequin}>
          <Text style={styles.actionText}>Add mannequin</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onPickClothing}>
          <Text style={styles.actionText}>Add clothing</Text>
        </Pressable>
      </View>

      <Text style={styles.heading}>Mannequins</Text>
      <FlatList
        horizontal
        data={mannequins}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Add a mannequin image to start.</Text>}
        renderItem={({ item }) => (
          <Pressable style={[styles.thumb, item.id === selectedMannequinId && styles.selected]} onPress={() => onSelectMannequin(item.id)}>
            <Image source={{ uri: item.imageUri }} style={styles.image} />
            <Text numberOfLines={1} style={styles.caption}>{item.name}</Text>
          </Pressable>
        )}
      />

      <Text style={styles.heading}>Clothing Library</Text>
      <FlatList
        horizontal
        data={clothing}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Add clothing images to build outfits.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.thumb} onPress={() => onAddLayer(item)}>
            <Image source={{ uri: item.imageUri }} style={styles.image} />
            <Text numberOfLines={1} style={styles.caption}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1, backgroundColor: "#222831", padding: 12, borderRadius: 8, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "700" },
  heading: { fontSize: 16, fontWeight: "800", color: "#222831", marginTop: 6 },
  empty: { color: "#69707d", paddingVertical: 12 },
  thumb: { width: 104, marginRight: 10, borderWidth: 1, borderColor: "#e1e5ec", borderRadius: 8, padding: 6, backgroundColor: "#fff" },
  selected: { borderColor: "#2f6f73", borderWidth: 2 },
  image: { width: 90, height: 90, resizeMode: "contain", backgroundColor: "#f3f5f8", borderRadius: 6 },
  caption: { marginTop: 5, fontSize: 12, color: "#333b47" }
});

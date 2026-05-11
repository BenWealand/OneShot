import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ClothingCategory, ClothingItem, Mannequin } from "../types/models";

const categories: Array<"all" | ClothingCategory> = ["all", "top", "bottom", "outerwear", "dress", "shoe", "accessory"];

type Props = {
  mannequins: Mannequin[];
  clothing: ClothingItem[];
  selectedMannequinId: string | null;
  onPickMannequin: () => void;
  onPickClothing: () => void;
  onSelectMannequin: (id: string) => void;
  onUpdateMannequin: (item: Mannequin) => void;
  onDeleteMannequin: (id: string) => void;
  onAddLayer: (item: ClothingItem) => void;
  onUpdateClothing: (item: ClothingItem) => void;
  onDeleteClothing: (id: string) => void;
};

export function LibraryPanel({
  mannequins,
  clothing,
  selectedMannequinId,
  onPickMannequin,
  onPickClothing,
  onSelectMannequin,
  onUpdateMannequin,
  onDeleteMannequin,
  onAddLayer,
  onUpdateClothing,
  onDeleteClothing
}: Props) {
  const [category, setCategory] = useState<"all" | ClothingCategory>("all");
  const filtered = useMemo(() => (category === "all" ? clothing : clothing.filter((item) => item.category === category)), [category, clothing]);

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onPickMannequin}>
          <Text style={styles.actionText}>Add person</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onPickClothing}>
          <Text style={styles.actionText}>Add garment</Text>
        </Pressable>
      </View>

      <Text style={styles.heading}>Person Images</Text>
      <FlatList
        horizontal
        data={mannequins}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Add a reusable person image for try-on.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, item.id === selectedMannequinId && styles.selected]}>
            <Pressable onPress={() => onSelectMannequin(item.id)}>
              <Image source={{ uri: item.imageUri }} style={styles.image} />
            </Pressable>
            <TextInput value={item.name} onChangeText={(name) => onUpdateMannequin({ ...item, name })} style={styles.nameInput} />
            <Text style={styles.meta}>{item.isDefault ? "default" : item.storagePath ? "synced asset" : "local asset"}</Text>
            <Pressable style={styles.smallDanger} onPress={() => onDeleteMannequin(item.id)}>
              <Text style={styles.smallDangerText}>Delete</Text>
            </Pressable>
          </View>
        )}
      />

      <View style={styles.headingRow}>
        <Text style={styles.heading}>Wardrobe</Text>
        <Text style={styles.count}>{filtered.length} items</Text>
      </View>
      <View style={styles.filters}>
        {categories.map((item) => (
          <Pressable key={item} style={[styles.filter, category === item && styles.filterActive]} onPress={() => setCategory(item)}>
            <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>Add garments to build your wardrobe.</Text>}
        renderItem={({ item }) => (
          <View style={styles.garmentCard}>
            <Pressable onPress={() => onAddLayer(item)}>
              <Image source={{ uri: item.imageUri }} style={styles.garmentImage} />
            </Pressable>
            <TextInput value={item.name} onChangeText={(name) => onUpdateClothing({ ...item, name })} style={styles.nameInput} />
            <View style={styles.fieldRow}>
              <TextInput value={item.brand ?? ""} onChangeText={(brand) => onUpdateClothing({ ...item, brand })} placeholder="Brand" style={styles.miniInput} />
              <TextInput value={item.color ?? ""} onChangeText={(color) => onUpdateClothing({ ...item, color })} placeholder="Color" style={styles.miniInput} />
            </View>
            <TextInput value={item.notes ?? ""} onChangeText={(notes) => onUpdateClothing({ ...item, notes })} placeholder="Notes" style={styles.notesInput} />
            <Text style={styles.meta}>{item.category} | {item.storagePath ? "synced asset" : "local asset"}</Text>
            <View style={styles.row}>
              <Pressable style={styles.smallButton} onPress={() => onUpdateClothing({ ...item, favorite: !item.favorite })}>
                <Text style={styles.smallButtonText}>{item.favorite ? "Favorited" : "Favorite"}</Text>
              </Pressable>
              <Pressable style={styles.smallDanger} onPress={() => onDeleteClothing(item.id)}>
                <Text style={styles.smallDangerText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1, alignItems: "center", backgroundColor: "#222831", borderRadius: 8, padding: 12 },
  actionText: { color: "#fff", fontWeight: "800" },
  headingRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  heading: { color: "#222831", fontSize: 16, fontWeight: "900", marginTop: 4 },
  count: { color: "#69707d", fontSize: 12, fontWeight: "800" },
  empty: { color: "#69707d", paddingVertical: 12 },
  card: { backgroundColor: "#fff", borderColor: "#e1e5ec", borderRadius: 8, borderWidth: 1, marginRight: 10, padding: 6, width: 128 },
  selected: { borderColor: "#2f6f73", borderWidth: 2 },
  image: { backgroundColor: "#f3f5f8", borderRadius: 6, height: 112, resizeMode: "contain", width: "100%" },
  nameInput: { color: "#333b47", fontSize: 12, fontWeight: "900", paddingHorizontal: 0, paddingVertical: 4 },
  meta: { color: "#69707d", fontSize: 10, fontWeight: "700" },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  filter: { backgroundColor: "#e6ebef", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  filterActive: { backgroundColor: "#2f6f73" },
  filterText: { color: "#58606d", fontSize: 11, fontWeight: "900", textTransform: "capitalize" },
  filterTextActive: { color: "#fff" },
  garmentCard: { backgroundColor: "#fff", borderColor: "#e1e5ec", borderRadius: 8, borderWidth: 1, flex: 1, margin: 4, maxWidth: "48%", padding: 8 },
  garmentImage: { aspectRatio: 1, backgroundColor: "#f3f5f8", borderRadius: 6, resizeMode: "contain", width: "100%" },
  fieldRow: { flexDirection: "row", gap: 6 },
  miniInput: { backgroundColor: "#f7f9fa", borderColor: "#d9dee7", borderRadius: 6, borderWidth: 1, color: "#222831", flex: 1, fontSize: 11, padding: 6 },
  notesInput: { backgroundColor: "#f7f9fa", borderColor: "#d9dee7", borderRadius: 6, borderWidth: 1, color: "#222831", fontSize: 11, marginTop: 6, padding: 6 },
  row: { flexDirection: "row", gap: 6, marginTop: 6 },
  smallButton: { backgroundColor: "#e6ebef", borderRadius: 6, flex: 1, padding: 7 },
  smallButtonText: { color: "#2f6f73", fontSize: 11, fontWeight: "900", textAlign: "center" },
  smallDanger: { backgroundColor: "#f7e5e5", borderRadius: 6, padding: 7 },
  smallDangerText: { color: "#9b3333", fontSize: 11, fontWeight: "900", textAlign: "center" }
});

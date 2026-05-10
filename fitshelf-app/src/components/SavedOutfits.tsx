import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Outfit } from "../types/models";

type Props = {
  outfits: Outfit[];
  activeOutfitId: string;
  onLoad: (outfit: Outfit) => void;
  onNew: () => void;
};

export function SavedOutfits({ outfits, activeOutfitId, onLoad, onNew }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Saved Outfits</Text>
        <Pressable style={styles.newButton} onPress={onNew}>
          <Text style={styles.newText}>New</Text>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={outfits}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Saved outfits will appear here.</Text>}
        renderItem={({ item }) => (
          <Pressable style={[styles.outfit, item.id === activeOutfitId && styles.active]} onPress={() => onLoad(item)}>
            <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.layers.length} layers</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: 16, fontWeight: "800", color: "#222831" },
  newButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#2f6f73" },
  newText: { color: "#2f6f73", fontWeight: "800" },
  empty: { color: "#69707d", paddingVertical: 12 },
  outfit: { width: 130, marginRight: 10, padding: 10, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e1e5ec" },
  active: { borderColor: "#2f6f73", borderWidth: 2 },
  name: { fontWeight: "800", color: "#222831" },
  meta: { color: "#69707d", marginTop: 4 }
});

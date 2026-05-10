import Slider from "@react-native-community/slider";
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import type { Outfit, OutfitLayer } from "../types/models";

type Props = {
  outfit: Outfit;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (layer: OutfitLayer) => void;
  onRemoveLayer: (id: string) => void;
  onSave: () => void;
};

export function OutfitBuilder({ outfit, selectedLayerId, onSelectLayer, onUpdateLayer, onRemoveLayer, onSave }: Props) {
  const selectedLayer = outfit.layers.find((layer) => layer.id === selectedLayerId) ?? null;

  return (
    <View style={styles.wrap}>
      <View style={styles.canvas}>
        {outfit.mannequinUri ? <Image source={{ uri: outfit.mannequinUri }} style={styles.mannequin} /> : <Text style={styles.empty}>Select a mannequin.</Text>}
        {outfit.layers.map((layer) => (
          <LayerView
            key={layer.id}
            layer={layer}
            selected={layer.id === selectedLayerId}
            onSelect={() => onSelectLayer(layer.id)}
            onUpdateLayer={onUpdateLayer}
          />
        ))}
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveText}>Save outfit</Text>
        </Pressable>
        {selectedLayer ? (
          <Pressable style={styles.removeButton} onPress={() => onRemoveLayer(selectedLayer.id)}>
            <Text style={styles.removeText}>Remove layer</Text>
          </Pressable>
        ) : null}
      </View>

      {selectedLayer ? (
        <View style={styles.controls}>
          <Text style={styles.controlTitle}>{selectedLayer.name}</Text>
          <Control label="X" value={selectedLayer.x} min={-140} max={140} onValueChange={(x) => onUpdateLayer({ ...selectedLayer, x })} />
          <Control label="Y" value={selectedLayer.y} min={-180} max={180} onValueChange={(y) => onUpdateLayer({ ...selectedLayer, y })} />
          <Control label="Scale" value={selectedLayer.scale} min={0.3} max={2.4} onValueChange={(scale) => onUpdateLayer({ ...selectedLayer, scale })} />
          <Control label="Rotate" value={selectedLayer.rotation} min={-180} max={180} onValueChange={(rotation) => onUpdateLayer({ ...selectedLayer, rotation })} />
        </View>
      ) : (
        <Text style={styles.hint}>Tap a clothing layer to adjust it.</Text>
      )}
    </View>
  );
}

function LayerView({
  layer,
  selected,
  onSelect,
  onUpdateLayer
}: {
  layer: OutfitLayer;
  selected: boolean;
  onSelect: () => void;
  onUpdateLayer: (layer: OutfitLayer) => void;
}) {
  const dragX = useSharedValue(layer.x);
  const dragY = useSharedValue(layer.y);
  const startX = useSharedValue(layer.x);
  const startY = useSharedValue(layer.y);

  useEffect(() => {
    dragX.value = layer.x;
    dragY.value = layer.y;
  }, [dragX, dragY, layer.x, layer.y]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = dragX.value;
      startY.value = dragY.value;
    })
    .onUpdate((event) => {
      dragX.value = startX.value + event.translationX;
      dragY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      runOnJS(onUpdateLayer)({ ...layer, x: startX.value + event.translationX, y: startY.value + event.translationY });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { translateY: dragY.value },
      { scale: layer.scale },
      { rotate: `${layer.rotation}deg` }
    ]
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.layer, animatedStyle, selected && styles.layerSelected, { zIndex: layer.zIndex }]}>
        <Pressable onPress={onSelect}>
          <Image source={{ uri: layer.imageUri }} style={styles.layerImage} />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

function Control({ label, value, min, max, onValueChange }: { label: string; value: number; min: number; max: number; onValueChange: (value: number) => void }) {
  return (
    <View style={styles.controlRow}>
      <Text style={styles.controlLabel}>{label}</Text>
      <Slider style={styles.slider} minimumValue={min} maximumValue={max} value={value} onValueChange={onValueChange} minimumTrackTintColor="#2f6f73" />
      <Text style={styles.controlValue}>{Math.round(value * 10) / 10}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  canvas: { height: 420, borderRadius: 8, overflow: "hidden", backgroundColor: "#f4f0eb", alignItems: "center", justifyContent: "center" },
  mannequin: { width: "100%", height: "100%", resizeMode: "contain" },
  empty: { color: "#69707d", fontWeight: "600" },
  layer: { position: "absolute", width: 170, height: 170, alignItems: "center", justifyContent: "center" },
  layerSelected: { borderWidth: 2, borderColor: "#2f6f73", borderRadius: 8 },
  layerImage: { width: 160, height: 160, resizeMode: "contain" },
  toolbar: { flexDirection: "row", gap: 10 },
  saveButton: { flex: 1, backgroundColor: "#2f6f73", padding: 12, borderRadius: 8, alignItems: "center" },
  removeButton: { flex: 1, borderWidth: 1, borderColor: "#b44444", padding: 12, borderRadius: 8, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "800" },
  removeText: { color: "#b44444", fontWeight: "800" },
  controls: { gap: 8, padding: 12, borderWidth: 1, borderColor: "#e1e5ec", borderRadius: 8, backgroundColor: "#fff" },
  controlTitle: { fontWeight: "800", color: "#222831" },
  controlRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  controlLabel: { width: 54, color: "#333b47", fontWeight: "700" },
  slider: { flex: 1, height: 36 },
  controlValue: { width: 48, textAlign: "right", color: "#69707d" },
  hint: { color: "#69707d", textAlign: "center" }
});

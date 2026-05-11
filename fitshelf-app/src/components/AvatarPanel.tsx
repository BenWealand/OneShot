import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PanGestureHandler, PinchGestureHandler, State, type PanGestureHandlerGestureEvent, type PinchGestureHandlerGestureEvent } from "react-native-gesture-handler";
import Slider from "@react-native-community/slider";
import { Asset } from "expo-asset";
import { Canvas, useThree } from "@react-three/fiber/native";
import { useGLTF } from "@react-three/drei/native";
import * as THREE from "three";
import { loadAvatarMeasurements, saveAvatarMeasurements } from "../lib/storage";
import type { AvatarMeasurements } from "../types/models";

const defaultAvatarAsset = require("../../assets/avatar/default-mannequin.glb");
const defaultAvatarModel = defaultAvatarAsset as unknown as string;

type MeasurementKey = Exclude<keyof AvatarMeasurements, "avatarMode" | "updatedAt">;
type ModelStatus = "loading" | "loaded" | "fallback";

const fields: Array<{ key: MeasurementKey; label: string; min: number; max: number; unit: string }> = [
  { key: "height", label: "Height", min: 58, max: 78, unit: "in" },
  { key: "weight", label: "Weight", min: 90, max: 260, unit: "lb" },
  { key: "chest", label: "Chest", min: 28, max: 54, unit: "in" },
  { key: "waist", label: "Waist", min: 22, max: 50, unit: "in" },
  { key: "hips", label: "Hips", min: 30, max: 58, unit: "in" },
  { key: "inseam", label: "Inseam", min: 24, max: 38, unit: "in" },
  { key: "shoulderWidth", label: "Shoulders", min: 13, max: 24, unit: "in" }
];

const defaults: AvatarMeasurements = {
  avatarMode: "female",
  height: 68,
  weight: 145,
  chest: 36,
  waist: 30,
  hips: 39,
  inseam: 30,
  shoulderWidth: 16,
  updatedAt: ""
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clampField(key: MeasurementKey, value: number) {
  const field = fields.find((item) => item.key === key);
  return field ? clamp(value, field.min, field.max) : value;
}

function shortError(message: string) {
  return message.replace(/\s+/g, " ").slice(0, 120);
}

function finiteVector(vector: THREE.Vector3) {
  return Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z);
}

function largestFiniteDimension(size: THREE.Vector3) {
  if (!finiteVector(size)) return null;
  const largest = Math.max(size.x, size.y, size.z);
  return Number.isFinite(largest) && largest > 0 ? largest : null;
}

function avatarStatusLabel(modelStatus: ModelStatus, saved: boolean) {
  const modelLabel = modelStatus === "fallback" ? "Fallback" : modelStatus === "loaded" ? "GLB" : "Loading";
  return saved ? `Saved | ${modelLabel}` : modelLabel;
}

export function AvatarPanel() {
  const [measurements, setMeasurements] = useState<AvatarMeasurements>(defaults);
  const [saved, setSaved] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Local profile");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("loading");
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelAssetReady, setModelAssetReady] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(4.1);
  const rotationStart = useRef(0);
  const zoomStart = useRef(4.1);

  useEffect(() => {
    void loadAvatarMeasurements()
      .then(setMeasurements)
      .catch((err) => {
        setSyncMessage(err instanceof Error ? `Profile reload failed: ${err.message}` : "Profile reload failed.");
      });
  }, []);

  useEffect(() => {
    let mounted = true;
    Asset.fromModule(defaultAvatarAsset)
      .downloadAsync()
      .then((asset) => {
        if (!mounted) return;
        if (__DEV__) console.log("FitShelf avatar GLB ready", asset.localUri ?? asset.uri);
        setModelError(null);
        setModelAssetReady(true);
      })
      .catch((error: Error) => {
        if (__DEV__) console.warn("FitShelf avatar GLB asset failed", error.message);
        if (mounted) {
          setModelError(shortError(error.message));
          setModelStatus("fallback");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  function updateField(key: MeasurementKey, value: number) {
    setSaved(false);
    setMeasurements((current) => ({ ...current, [key]: clampField(key, value) }));
  }

  function updateFieldText(key: MeasurementKey, value: string) {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(numeric)) updateField(key, numeric);
  }

  function setAvatarMode(avatarMode: AvatarMeasurements["avatarMode"]) {
    setSaved(false);
    setMeasurements((current) => ({ ...current, avatarMode }));
  }

  async function saveProfile() {
    const next = { ...measurements, updatedAt: new Date().toISOString() };
    setMeasurements(next);
    try {
      await saveAvatarMeasurements(next);
      setSyncMessage("Saved");
      setSaved(true);
    } catch (err) {
      setSyncMessage(err instanceof Error ? `Avatar profile was not saved to Supabase. Local profile kept. ${err.message}` : "Avatar profile was not saved to Supabase. Local profile kept.");
      setSaved(false);
    }
  }

  function handlePan(event: PanGestureHandlerGestureEvent) {
    setRotation(rotationStart.current + event.nativeEvent.translationX / 160);
  }

  function handlePanState(event: PanGestureHandlerGestureEvent) {
    if (event.nativeEvent.state === State.BEGAN) rotationStart.current = rotation;
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED || event.nativeEvent.state === State.FAILED) {
      rotationStart.current = rotation;
    }
  }

  function handlePinch(event: PinchGestureHandlerGestureEvent) {
    setZoomLevel(clamp(zoomStart.current / Math.max(event.nativeEvent.scale, 0.2), 2.7, 6.1));
  }

  function handlePinchState(event: PinchGestureHandlerGestureEvent) {
    if (event.nativeEvent.state === State.BEGAN) zoomStart.current = zoomLevel;
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED || event.nativeEvent.state === State.FAILED) {
      zoomStart.current = zoomLevel;
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>3D Avatar</Text>
        <Text style={styles.status}>{avatarStatusLabel(modelStatus, saved)}</Text>
      </View>

      <PinchGestureHandler onGestureEvent={handlePinch} onHandlerStateChange={handlePinchState}>
        <PanGestureHandler onGestureEvent={handlePan} onHandlerStateChange={handlePanState} minDist={4}>
          <View style={styles.viewer}>
            <Canvas camera={{ position: [0, 1.35, zoomLevel], fov: 38 }}>
              <color attach="background" args={["#f2eee8"]} />
              <ambientLight intensity={1.2} />
              <hemisphereLight args={["#ffffff", "#8b8178", 1.4]} />
              <directionalLight position={[2.5, 4.5, 4]} intensity={2.1} />
              <directionalLight position={[-2, 2.2, 2.8]} intensity={0.7} />
              <CameraRig zoom={zoomLevel} />
              <AvatarBoundary
                profile={measurements}
                rotation={rotation}
                onError={(message) => {
                  setModelError(shortError(message));
                  setModelStatus("fallback");
                }}
              >
                {modelStatus === "fallback" ? (
                  <ProceduralAvatar profile={measurements} rotation={rotation} />
                ) : modelAssetReady ? (
                  <Suspense fallback={null}>
                    <GlbAvatar
                      profile={measurements}
                      rotation={rotation}
                      onLoaded={() => {
                        setModelError(null);
                        setModelStatus("loaded");
                      }}
                    />
                  </Suspense>
                ) : null}
              </AvatarBoundary>
            </Canvas>
            {modelStatus === "loading" ? (
              <View style={styles.viewerOverlay}>
                <ActivityIndicator color="#2f6f73" />
                <Text style={styles.viewerOverlayText}>Loading avatar model</Text>
              </View>
            ) : null}
            {modelStatus === "fallback" ? (
              <View style={styles.viewerBanner}>
                <Text style={styles.viewerBannerText}>Model fallback active</Text>
                {modelError ? <Text style={styles.viewerBannerDetail}>{modelError}</Text> : null}
              </View>
            ) : null}
          </View>
        </PanGestureHandler>
      </PinchGestureHandler>

      <View style={styles.segment}>
        {(["female", "male"] as const).map((mode) => (
          <Pressable key={mode} style={[styles.modeButton, measurements.avatarMode === mode && styles.modeActive]} onPress={() => setAvatarMode(mode)}>
            <Text style={[styles.modeText, measurements.avatarMode === mode && styles.modeTextActive]}>{mode}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.morphNote}>This GLB has no rigged body morphs; measurements apply approximate scale only.</Text>

      <View style={styles.measurements}>
        {fields.map((field) => (
          <View key={field.key} style={styles.field}>
            <View style={styles.fieldHeader}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                value={String(Math.round(measurements[field.key] * 10) / 10)}
                onChangeText={(value) => updateFieldText(field.key, value)}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <Slider
              value={measurements[field.key]}
              minimumValue={field.min}
              maximumValue={field.max}
              step={field.key === "weight" ? 1 : 0.5}
              minimumTrackTintColor="#2f6f73"
              maximumTrackTintColor="#d9dee7"
              thumbTintColor="#2f6f73"
              onValueChange={(value) => updateField(field.key, value)}
            />
            <Text style={styles.unit}>{field.unit}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.saveButton} onPress={() => void saveProfile()}>
        <Text style={styles.saveText}>Save avatar profile</Text>
      </Pressable>
      <Text style={styles.syncMessage}>{syncMessage}</Text>
    </View>
  );
}

function CameraRig({ zoom }: { zoom: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.35, zoom);
    camera.lookAt(0, 0.95, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);
  return null;
}

function bodyScales(profile: AvatarMeasurements) {
  const height = clamp(profile.height, 58, 78);
  const weight = clamp(profile.weight, 90, 260);
  const chest = clamp(profile.chest, 28, 54);
  const waist = clamp(profile.waist, 22, 50);
  const hips = clamp(profile.hips, 30, 58);
  const shoulders = clamp(profile.shoulderWidth, 13, 24);
  const inseam = clamp(profile.inseam, 24, 38);
  return {
    height: clamp(height / 68, 0.85, 1.15),
    mass: clamp(0.92 + (weight - 145) / 360, 0.75, 1.35),
    chest: clamp(chest / 36, 0.75, 1.5),
    waist: clamp(waist / 30, 0.75, 1.5),
    hips: clamp(hips / 39, 0.75, 1.5),
    shoulders: clamp(shoulders / 16, 0.75, 1.5),
    inseam: clamp(inseam / 30, 0.8, 1.3),
    mode: profile.avatarMode === "male" ? 1.06 : 1
  };
}

function GlbAvatar({ profile, rotation, onLoaded }: { profile: AvatarMeasurements; rotation: number; onLoaded: () => void }) {
  const gltf = useGLTF(defaultAvatarModel);
  const scales = bodyScales(profile);
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const largestDimension = largestFiniteDimension(size);
    if (!largestDimension || !finiteVector(center)) {
      throw new Error("GLB model has invalid finite bounds.");
    }
    clone.position.sub(center);
    const fit = 2.45 / largestDimension;
    if (!Number.isFinite(fit) || fit <= 0) {
      throw new Error("GLB model scale could not be computed.");
    }
    clone.scale.setScalar(fit);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return (
    <group rotation={[0, rotation, 0]} position={[0, 0.92, 0]} scale={[scales.mode * scales.mass, scales.height, scales.mode * scales.mass]}>
      <primitive object={scene} />
    </group>
  );
}

type BoundaryProps = {
  children: ReactNode;
  profile: AvatarMeasurements;
  rotation: number;
  onError: (message: string) => void;
};

class AvatarBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.warn("FitShelf avatar GLB load failed", error.message);
    this.props.onError(error.message || "GLB load failed.");
  }

  render() {
    if (this.state.failed) {
      return <ProceduralAvatar profile={this.props.profile} rotation={this.props.rotation} />;
    }
    return this.props.children;
  }
}

function ProceduralAvatar({ profile, rotation, subdued = false }: { profile: AvatarMeasurements; rotation: number; subdued?: boolean }) {
  const scales = bodyScales(profile);
  const skin = profile.avatarMode === "male" ? "#c99f83" : "#d8b39c";
  const torso = subdued ? "#a7b3b7" : "#8b9aa0";
  const lower = subdued ? "#5f666f" : "#34383f";
  return (
    <group rotation={[0, rotation, 0]} position={[0, -0.18, 0]} scale={[scales.mode, scales.height, scales.mode]}>
      <mesh position={[0, 2.08, 0]}>
        <sphereGeometry args={[0.22, 32, 24]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.81, 0]}>
        <cylinderGeometry args={[0.105, 0.13, 0.24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.48, 0]} scale={[scales.shoulders * scales.mass, 0.2, 0.24]}>
        <sphereGeometry args={[0.44, 32, 18]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.14, 0]} scale={[scales.chest * scales.mass, 0.82, 0.58]}>
        <sphereGeometry args={[0.46, 36, 24]} />
        <meshStandardMaterial color={torso} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.72, 0]} scale={[scales.waist * scales.mass, 0.34, 0.46]}>
        <sphereGeometry args={[0.34, 32, 18]} />
        <meshStandardMaterial color={torso} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.45, 0]} scale={[scales.hips * scales.mass, 0.34, 0.54]}>
        <sphereGeometry args={[0.4, 32, 18]} />
        <meshStandardMaterial color={lower} roughness={0.84} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * 0.58 * scales.shoulders, 1.04, 0]} rotation={[0, 0, side * 0.08]}>
            <cylinderGeometry args={[0.075 * scales.mass, 0.095 * scales.mass, 0.9, 18]} />
            <meshStandardMaterial color={skin} roughness={0.84} />
          </mesh>
          <mesh position={[side * 0.18 * scales.hips, -0.17, 0]} rotation={[0, 0, side * 0.025]} scale={[1, scales.inseam, 1]}>
            <cylinderGeometry args={[0.11 * scales.mass, 0.13 * scales.mass, 1.08, 20]} />
            <meshStandardMaterial color={lower} roughness={0.84} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: "#222831", fontSize: 18, fontWeight: "900" },
  status: { color: "#69707d", fontWeight: "800" },
  viewer: { aspectRatio: 0.82, backgroundColor: "#f2eee8", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, overflow: "hidden", position: "relative" },
  viewerOverlay: { alignItems: "center", backgroundColor: "rgba(242,238,232,0.82)", bottom: 0, gap: 6, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 },
  viewerOverlayText: { color: "#2f6f73", fontWeight: "900" },
  viewerBanner: { backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 6, left: 8, maxWidth: "86%", paddingHorizontal: 8, paddingVertical: 5, position: "absolute", top: 8 },
  viewerBannerText: { color: "#69707d", fontSize: 11, fontWeight: "900" },
  viewerBannerDetail: { color: "#9b3333", fontSize: 10, fontWeight: "800", marginTop: 2 },
  morphNote: { backgroundColor: "#fff", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, color: "#69707d", fontSize: 12, fontWeight: "800", padding: 9 },
  segment: { backgroundColor: "#e6ebef", borderRadius: 8, flexDirection: "row", padding: 3 },
  modeButton: { alignItems: "center", borderRadius: 6, flex: 1, padding: 9 },
  modeActive: { backgroundColor: "#fff" },
  modeText: { color: "#58606d", fontWeight: "900", textTransform: "capitalize" },
  modeTextActive: { color: "#2f6f73" },
  measurements: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { backgroundColor: "#fff", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, flexBasis: "48%", flexGrow: 1, gap: 4, minWidth: 148, padding: 8 },
  fieldHeader: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  label: { color: "#58606d", fontSize: 12, fontWeight: "800" },
  input: { backgroundColor: "#f7f9fa", borderColor: "#d9dee7", borderRadius: 8, borderWidth: 1, color: "#222831", minWidth: 72, paddingHorizontal: 8, paddingVertical: 7, textAlign: "right" },
  unit: { color: "#69707d", fontSize: 11, fontWeight: "800", textAlign: "right" },
  saveButton: { alignItems: "center", backgroundColor: "#2f6f73", borderRadius: 8, padding: 12 },
  saveText: { color: "#fff", fontWeight: "900" },
  syncMessage: { color: "#69707d", fontSize: 12, fontWeight: "800", textAlign: "center" }
});

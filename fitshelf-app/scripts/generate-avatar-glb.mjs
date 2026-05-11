import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Box3,
  BufferGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "assets/avatar/default-mannequin.glb");

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const porcelain = new MeshStandardMaterial({ color: "#d7c9bd", roughness: 0.78, metalness: 0.04 });
const softShadow = new MeshStandardMaterial({ color: "#b9aca2", roughness: 0.84, metalness: 0.02 });
const standMat = new MeshStandardMaterial({ color: "#34383f", roughness: 0.72, metalness: 0.12 });

function mesh(geometry, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], name = "mesh") {
  const item = new Mesh(geometry, material);
  item.name = name;
  item.position.set(...position);
  item.scale.set(...scale);
  item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function smoothLathe(points, segments = 96) {
  const geometry = new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments);
  geometry.computeVertexNormals();
  return geometry;
}

function taperedLimb(length, topRadius, bottomRadius, radial = 36) {
  const geometry = new CylinderGeometry(topRadius, bottomRadius, length, radial, 8, false);
  geometry.computeVertexNormals();
  return geometry;
}

function centerAndScale(group) {
  const box = new Box3().setFromObject(group);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  group.position.sub(center);
  const fit = 2.6 / Math.max(size.y || 1, size.x || 1, size.z || 1);
  group.scale.setScalar(fit);
}

const scene = new Scene();
const mannequin = new Group();
mannequin.name = "FitShelfDefaultGlbMannequin";

const torsoProfile = [
  [0.16, -0.62],
  [0.24, -0.54],
  [0.31, -0.37],
  [0.27, -0.12],
  [0.21, 0.08],
  [0.28, 0.34],
  [0.39, 0.58],
  [0.36, 0.78],
  [0.23, 0.92],
  [0.12, 1.02],
];
mannequin.add(mesh(smoothLathe(torsoProfile), porcelain, [0, 0.74, 0], [0.95, 1.05, 0.62], [0, 0, 0], "continuous_torso"));

const pelvisProfile = [
  [0.08, -0.12],
  [0.22, -0.22],
  [0.42, -0.1],
  [0.39, 0.1],
  [0.24, 0.21],
  [0.11, 0.16],
];
mannequin.add(mesh(smoothLathe(pelvisProfile), softShadow, [0, 0.28, 0], [0.94, 0.96, 0.62], [0, 0, 0], "smooth_pelvis"));

const neckProfile = [
  [0.09, -0.14],
  [0.12, -0.06],
  [0.12, 0.1],
  [0.08, 0.16],
];
mannequin.add(mesh(smoothLathe(neckProfile, 64), porcelain, [0, 1.77, 0], [1, 1, 0.88], [0, 0, 0], "neck"));

const head = mesh(new SphereGeometry(0.22, 64, 40), porcelain, [0, 2.02, 0], [0.86, 1.12, 0.78], [0, 0, 0], "featureless_head");
mannequin.add(head);

const shoulder = mesh(taperedLimb(0.82, 0.095, 0.075), porcelain, [0, 1.48, 0], [1, 1, 0.8], [0, 0, Math.PI / 2], "shoulder_bar");
mannequin.add(shoulder);

for (const side of [-1, 1]) {
  const upperArm = mesh(taperedLimb(0.62, 0.08, 0.065), porcelain, [side * 0.48, 1.13, 0], [1, 1, 0.82], [0, 0, side * 0.16], "upper_arm");
  const forearm = mesh(taperedLimb(0.56, 0.065, 0.052), porcelain, [side * 0.55, 0.66, 0.015], [1, 1, 0.82], [0, 0, side * -0.02], "forearm");
  const hand = mesh(new SphereGeometry(0.075, 32, 20), porcelain, [side * 0.56, 0.34, 0.025], [0.78, 1.0, 0.55], [0, 0, 0], "mitten_hand");
  const thigh = mesh(taperedLimb(0.82, 0.12, 0.095), softShadow, [side * 0.16, -0.28, 0], [1, 1, 0.82], [0, 0, side * -0.03], "thigh");
  const calf = mesh(taperedLimb(0.72, 0.09, 0.065), softShadow, [side * 0.18, -0.98, 0.02], [1, 1, 0.8], [0, 0, side * 0.02], "calf");
  const foot = mesh(new SphereGeometry(0.09, 32, 18), softShadow, [side * 0.18, -1.38, 0.12], [0.9, 0.36, 1.72], [0.06, 0, 0], "simple_foot");
  mannequin.add(upperArm, forearm, hand, thigh, calf, foot);
}

mannequin.add(mesh(new CylinderGeometry(0.018, 0.018, 0.42, 24), standMat, [0, -1.6, -0.02], [1, 1, 1], [0, 0, 0], "support_stem"));
mannequin.add(mesh(new CylinderGeometry(0.36, 0.36, 0.035, 64), standMat, [0, -1.83, -0.02], [1, 1, 1], [Math.PI / 2, 0, 0], "display_base"));

centerAndScale(mannequin);
scene.add(mannequin);

// Force geometry buffer creation before export in the Node runtime.
scene.traverse((child) => {
  if (child instanceof Mesh && child.geometry instanceof BufferGeometry) {
    child.geometry.computeBoundingBox();
    child.geometry.computeBoundingSphere();
  }
});

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  async (result) => {
    const buffer = Buffer.from(result);
    await writeFile(out, buffer);
    console.log(`Wrote ${out} (${buffer.byteLength} bytes)`);
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
  { binary: true }
);

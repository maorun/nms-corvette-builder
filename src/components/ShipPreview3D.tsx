"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  PlacedPart,
  PartDefinition,
  GRID_COLS,
  GRID_ROWS,
  GRID_LAYERS,
  Rotation,
  HAB_INTERIOR_SLOTS,
  PlacedInteriorPart,
} from "@/lib/corvetteData";

interface ShipPreview3DProps {
  placedParts: PlacedPart[];
  interiorParts: PlacedInteriorPart[];
  activeInteriorHabId?: string | null;
  allParts: PartDefinition[];
  currentLayer?: number;
  selectedInstanceId?: string | null;
  onSelectInstance?: (instanceId: string | null) => void;
}

const COMMUNITY_MODELS: Record<string, string> = {
  "titan-class-cockpit": "/models/community-corvette/COCKPIT_-_Titan-Class_Cockpit.glb",
  "ambassador-class-cockpit": "/models/community-corvette/COCKPIT_-_Ambassador-Class_Cockpit.glb",
  "thunderbird-class-cockpit": "/models/community-corvette/COCKPIT_-_Thunderbird-Class_Cockpit.glb",
  "titan-class-hab": "/models/community-corvette/HABITATION_-__Hab.glb",
  "ambassador-class-hab": "/models/community-corvette/HABITATION_-__Hab.glb",
  "thunderbird-class-hab": "/models/community-corvette/HABITATION_-__Hab.glb",
  "titan-class-walkway": "/models/community-corvette/HABITATION_-__Walkway.glb",
  "ambassador-class-walkway": "/models/community-corvette/HABITATION_-__Walkway.glb",
  "thunderbird-class-walkway": "/models/community-corvette/HABITATION_-__Walkway.glb",
  "panelled-window": "/models/community-corvette/ATTACHMENT_-_Panelled_Window_Front-Rear.glb",
  "rounded-window": "/models/community-corvette/ATTACHMENT_-_Rounded_Window_Front-Rear.glb",
  "seamless-window": "/models/community-corvette/ATTACHMENT_-_Seamless_Window_Front-Rear.glb",
};

const communityAsset = (filename: string) => `/models/community-corvette/${filename}`;

Object.assign(COMMUNITY_MODELS, {
  "supercruise-aerofoil": communityAsset("plating-supercruise-aerofoil-left.glb"),
  "arcadia-aerofoil": communityAsset("wing-arcadia-aerofoil-left.glb"),
  "argonaut-aerofoil": communityAsset("plating-argonaut-aerofoil-left.glb"),
  "arcadia-s-foil": communityAsset("wing-arcadia-s-foil-left.glb"),
  "arcadia-blade": communityAsset("plating-arcadia-blade-left.glb"),
  "titan-wing-module": communityAsset("wing-titan-wing-module-left.glb"),
  "ambassador-wing-module": communityAsset("wing-ambassador-wing-module-left.glb"),
  "osprey-wing-module": communityAsset("wing-osprey-wing-module-left.glb"),
  "rockhopper-wing-module": communityAsset("wing-rockhopper-wing-module-left.glb"),
  "rockhopper-propeller-module": communityAsset("wing-rockhopper-propeller-module-left.glb"),
  "rockhopper-fin-module": communityAsset("wing-rockhopper-fin-module-left.glb"),
  "supercruise-cowling": communityAsset("plating-super-cruise-cowling.glb"),
  "speedbird-cowling": communityAsset("plating-speedbird-cowling.glb"),
  "vesper-cowling": communityAsset("plating-vesper-cowling.glb"),
  "firebox-cowling": communityAsset("plating-firebox-cowling.glb"),
  "speedbird-fairing": communityAsset("plating-speedbird-fairing.glb"),
  "firebox-fairing": communityAsset("plating-firebox-fairing.glb"),
  "speedbird-diffuser": communityAsset("plating-speedbird-diffuser.glb"),
  "vesper-diffuser": communityAsset("plating-vesper-diffuser-left.glb"),
  "vesper-diffuser-rim": communityAsset("plating-vesper-diffuser-left.glb"),
  "speedbird-dome-rim": communityAsset("plating-speedbird-dome-section-left.glb"),
  "speedbird-dome-section": communityAsset("plating-speedbird-dome-section-left.glb"),
  "speedbird-nacelle": communityAsset("plating-speedbird-nacelle-left.glb"),
  "speedbird-nacelle-rim": communityAsset("plating-speedbird-nacelle-left.glb"),
  "domed-casing": communityAsset("plating-domed-casing.glb"),
  "domed-casing-cap": communityAsset("plating-domed-casing.glb"),
  "radiator-casing": communityAsset("plating-radiator-casing.glb"),
  "swept-casing": communityAsset("plating-swept-casing.glb"),
  "swept-casing-cap": communityAsset("plating-swept-casing.glb"),
  "streamlined-trim": communityAsset("plating-streamed-lined-trim.glb"),
  "streamlined-trim-cap": communityAsset("plating-streamed-lined-cap.glb"),
  "engine-cover": communityAsset("plating-engine-cover-left.glb"),
  "engine-cover-rim": communityAsset("plating-engine-cover-left.glb"),
  "albatross-sidepod": communityAsset("plating-albatross-sidepod.glb"),
  "firebox-sidepod-cap": communityAsset("plating-firebox-fairing.glb"),
  "titan-class-landing-bay": communityAsset("access-and-docking-titan-class-landing-bay.glb"),
  "ambassador-class-landing-bay": communityAsset("access-and-docking-ambassador-class-landing-bay.glb"),
  "thunderbird-class-landing-bay": communityAsset("access-and-docking-thunderbird-class-landing-bay.glb"),
  "standard-landing-gear": communityAsset("access-and-docking-landing-gear.glb"),
  "hydraulic-legs": communityAsset("plating-argonaut-hydraulics.glb"),
  "mag-field-landing-thrusters": communityAsset("access-and-docking-mag-field-landing-thrusters.glb"),
  "cyclotron-defence-cannon": communityAsset("gun-cyclotron-defense-cannon.glb"),
  "phase-beam-array": communityAsset("gun-phase-beam-array.glb"),
  "photon-cannon-array": communityAsset("gun-photon-cannon-array.glb"),
  "torpedo-launcher": communityAsset("gun-torpedo-launcher.glb"),
  "defence-field": communityAsset("shield-deflector-shield.glb"),
  "deflector-shield": communityAsset("shield-deflector-shield.glb"),
  "high-energy-shield": communityAsset("shield-high-energy-shield.glb"),
  "ion-barrier": communityAsset("shield-ion-barrier.glb"),
  "ballast-tank": communityAsset("connector-ballast-tank.glb"),
  "bolted-joint": communityAsset("connector-bolted-joint.glb"),
  "coolant-distributor": communityAsset("connector-coolant-distributor.glb"),
  "ducting-joint": communityAsset("connector-ducting-joint.glb"),
  "fuel-cell": communityAsset("connector-fuel-cell.glb"),
  "girder-array": communityAsset("connector-girder-array-left.glb"),
  "cargo-capsule": communityAsset("attachments-cargo-capsule.glb"),
  "cargo-pod": communityAsset("attachments-cargo-pod.glb"),
  "cargo-sphere": communityAsset("attachments-cargo-sphere.glb"),
  "cargo-box": communityAsset("attachments-cargo-cap.glb"),
  "hull-vents": communityAsset("attachments-radiator-vents.glb"),
  "air-purifier": communityAsset("attachments-air-purifier.glb"),
  "satellite-receiver": communityAsset("attachments-satellite-reciever.glb"),
  "mission-radar": communityAsset("attachments-radar-dome.glb"),
  "radar-dome": communityAsset("attachments-radar-dome.glb"),
  "zenith-class-reactor": communityAsset("generator-zenith-class-reactor.glb"),
  "medusa-class-reactor": communityAsset("generator-medusa-class-reactor.glb"),
  "azimuth-class-reactor": communityAsset("generator-azimuth-class-reactor.glb"),
  "ceto-class-reactor": communityAsset("generator-ceto-class-reactor.glb"),
  "titan-heavy-booster": communityAsset("thruster-titan-heavy-booster-left.glb"),
  // Das Community-Paket enthält kein Titan-Sublight-Modell; Arcadia ist die nächstpassende Sublight-Variante.
  "titan-sublight-thruster": communityAsset("thruster-arcadia-sublight-thruster-left.glb"),
  // Das Community-Paket enthält kein Ambassador-Modell; Arcadia ist die nächstpassende Heavy-Variante.
  "ambassador-heavy-booster": communityAsset("thruster-arcadia-heavy-thruster-left.glb"),
  "thunderbird-heavy-booster": communityAsset("thruster-thunderbird-heavy-booster-left.glb"),
});

const communityModelCache = new Map<string, Promise<THREE.Group>>();
const communityDracoLoader = new DRACOLoader().setDecoderPath("/models/community-corvette/draco/");
const communityGltfLoader = new GLTFLoader().setDRACOLoader(communityDracoLoader);

function loadCommunityModel(url: string): Promise<THREE.Group> {
  const cached = communityModelCache.get(url);
  if (cached) return cached;

  const model = communityGltfLoader.loadAsync(url).then((gltf) => gltf.scene);
  communityModelCache.set(url, model);
  return model;
}

function cloneAndFitCommunityModel(
  source: THREE.Group,
  def: PartDefinition,
  width: number,
  height: number,
  depth: number,
  transparent: boolean,
  opacity: number,
  isSelected: boolean
): THREE.Group {
  const model = source.clone(true);
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry = child.geometry.clone();
    const sourceMaterial = Array.isArray(child.material) ? child.material[0] : child.material;
    const material = sourceMaterial.clone() as THREE.MeshStandardMaterial;
    material.color.set(isSelected ? 0xfacc15 : def.color);
    material.roughness = 0.36;
    material.metalness = 0.72;
    material.transparent = transparent;
    material.opacity = opacity;
    child.material = material;
    child.castShadow = true;
    child.receiveShadow = true;
  });

  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  model.scale.set(width / size.x, height / size.y, depth / size.z);
  model.position.set(-center.x * model.scale.x, -center.y * model.scale.y, -center.z * model.scale.z);
  return model;
}

function rotatedDimensions(
  w: number,
  h: number,
  rotation: Rotation
): { w: number; h: number } {
  if (rotation === 90 || rotation === 270) return { w: h, h: w };
  return { w, h };
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function createPartVisual(
  def: PartDefinition,
  width: number,
  height: number,
  depth: number,
  transparent: boolean,
  opacity: number,
  isSelected: boolean
): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: isSelected ? 0xfacc15 : new THREE.Color(def.color),
    roughness: 0.36,
    metalness: 0.72,
    transparent,
    opacity,
    emissive: isSelected ? 0x713f12 : 0x000000,
    emissiveIntensity: isSelected ? 0.45 : 0,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x172033,
    roughness: 0.3,
    metalness: 0.9,
    transparent,
    opacity,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.45,
    emissive: 0x075985,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: opacity * 0.78,
  });
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: isSelected ? 0xffffff : 0x67e8f9,
    emissive: isSelected ? 0xffffff : 0x0891b2,
    emissiveIntensity: isSelected ? 1.15 : 0.9,
    transparent,
    opacity,
  });
  const add = (geometry: THREE.BufferGeometry, meshMaterial = material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (x: number, y: number, z: number, meshMaterial = material, px = 0, py = 0, pz = 0) =>
    add(new THREE.BoxGeometry(x, y, z, 2, 1, 2), meshMaterial, px, py, pz);
  const capsule = (radius: number, length: number, meshMaterial = material, px = 0, py = 0, pz = 0) => {
    const mesh = add(new THREE.CapsuleGeometry(radius, length, 6, 12), meshMaterial, px, py, pz);
    mesh.rotation.z = Math.PI / 2;
    return mesh;
  };
  const wingShape = new THREE.Shape();
  wingShape.moveTo(-width / 2, -depth / 2);
  wingShape.lineTo(width / 2, -depth * 0.22);
  wingShape.lineTo(width * 0.3, depth / 2);
  wingShape.lineTo(-width / 2, depth * 0.3);
  wingShape.closePath();
  const addWing = () => {
    const geometry = new THREE.ExtrudeGeometry(wingShape, { depth: Math.max(0.1, height * 0.32), bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.03, bevelSegments: 2 });
    geometry.rotateX(-Math.PI / 2);
    geometry.center();
    add(geometry);
    box(width * 0.62, 0.05, 0.055, glowMaterial, -width * 0.08, height * 0.2, -depth * 0.05);
  };

  switch (def.category) {
    case "Cockpit": {
      // Tapered command hull with a separate blue canopy, rather than a cube.
      const hull = new THREE.CylinderGeometry(depth * 0.48, depth * 0.34, width, 6, 1, false);
      hull.rotateZ(Math.PI / 2);
      add(hull);
      const canopy = add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMaterial, width * 0.06, height * 0.32, 0);
      canopy.scale.set(width * 0.38, height * 0.8, depth * 0.44);
      box(width * 0.1, height * 0.25, depth * 0.94, darkMaterial, -width * 0.28, 0, 0);
      break;
    }
    case "Hab":
    case "Walkway":
    case "Landing Bay":
      box(width, height * 0.72, depth);
      box(width * 0.74, 0.04, depth * 0.72, darkMaterial, 0, height * 0.38, 0);
      for (const x of [-0.28, 0.28]) box(width * 0.07, height * 0.82, depth * 0.86, darkMaterial, x * width, 0, 0);
      if (def.category === "Hab") {
        for (const x of [-0.2, 0.2]) box(width * 0.22, height * 0.28, 0.035, glassMaterial, x * width, height * 0.18, -depth * 0.51);
      }
      if (def.category === "Landing Bay") box(width * 0.7, 0.035, depth * 0.54, darkMaterial, 0, -height * 0.38, 0);
      break;
    case "Aerofoil":
    case "Wing":
    case "Trim":
    case "Fin":
      addWing();
      if (def.category === "Fin") box(width * 0.14, height * 1.35, depth * 0.38, darkMaterial, 0, height * 0.48, 0);
      break;
    case "Nacelle":
    case "Thruster":
    case "Diffuser": {
      const radius = Math.min(width, depth) * 0.27;
      capsule(radius, Math.max(0.12, width - radius * 2), material);
      const exhaust = add(new THREE.CylinderGeometry(radius * 0.74, radius * 0.92, 0.06, 16), glowMaterial, width * 0.5, 0, 0);
      exhaust.rotation.z = Math.PI / 2;
      if (def.category !== "Thruster") {
        const ring = add(new THREE.TorusGeometry(radius * 0.96, radius * 0.07, 8, 20), darkMaterial, width * 0.28, 0, 0);
        ring.rotation.y = Math.PI / 2;
      }
      break;
    }
    case "Dome":
    case "Casing":
    case "Shielding":
      box(width * 0.9, height * 0.5, depth * 0.9, darkMaterial, 0, -height * 0.12, 0);
      const dome = add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), def.category === "Shielding" ? glowMaterial : material, 0, height * 0.08, 0);
      dome.scale.set(width * 0.44, height * 0.72, depth * 0.44);
      break;
    case "Cowling":
    case "Sidepod":
      capsule(Math.min(height, depth) * 0.36, Math.max(0.12, width * 0.62), material);
      box(width * 0.35, height * 0.18, depth * 0.96, darkMaterial, 0, height * 0.23, 0);
      break;
    case "Landing Gear":
      box(width * 0.28, height * 0.9, depth * 0.28, darkMaterial, 0, -height * 0.15, 0);
      box(width * 0.6, height * 0.12, depth * 0.7, material, 0, -height * 0.53, 0);
      break;
    case "Weapon Mount":
      box(width * 0.6, height * 0.32, depth * 0.6, darkMaterial, 0, -height * 0.1, 0);
      const barrel = add(new THREE.CylinderGeometry(depth * 0.1, depth * 0.12, width * 0.78, 10), material, width * 0.22, height * 0.18, 0);
      barrel.rotation.z = Math.PI / 2;
      break;
    case "Hull Attachment":
      if (def.id.includes("sphere")) add(new THREE.SphereGeometry(Math.min(width, depth) * 0.38, 16, 12));
      else if (def.id.includes("rack")) {
        for (const x of [-0.28, 0, 0.28]) box(width * 0.14, height * 0.55, depth * 0.72, material, x * width, 0, 0);
      } else capsule(Math.min(height, depth) * 0.32, Math.max(0.1, width * 0.55));
      break;
    case "Hull Connector":
      box(width * 0.82, height * 0.42, depth * 0.82, darkMaterial);
      for (const x of [-0.3, 0.3]) box(width * 0.1, height * 0.52, depth * 0.92, material, x * width, 0, 0);
      break;
    case "Window":
      box(width * 0.94, height * 0.26, depth * 0.08, glassMaterial, 0, 0, -depth * 0.36);
      box(width * 0.94, height * 0.26, depth * 0.08, glassMaterial, 0, 0, depth * 0.36);
      break;
    case "Reactor":
      add(new THREE.CylinderGeometry(Math.min(width, depth) * 0.34, Math.min(width, depth) * 0.34, height * 0.9, 16), darkMaterial);
      add(new THREE.CylinderGeometry(Math.min(width, depth) * 0.17, Math.min(width, depth) * 0.17, height * 1.02, 16), glowMaterial);
      break;
    default:
      box(width * 0.78, height * 0.65, depth * 0.78);
      box(width * 0.5, 0.04, depth * 0.5, darkMaterial, 0, height * 0.35, 0);
  }
  return group;
}

function createInteriorFallbackVisual(
  def: PartDefinition,
  width: number,
  height: number,
  depth: number
): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.42, metalness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.36, metalness: 0.78 });
  const display = new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x0891b2, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.3 });
  const plant = new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x166534, emissiveIntensity: 0.35, roughness: 0.7 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (x: number, y: number, z: number, material = body, px = 0, py = 0, pz = 0) => add(new THREE.BoxGeometry(x, y, z), material, px, py, pz);

  switch (def.id) {
    case "bunk-beds":
      box(width * 0.9, height * 0.1, depth * 0.85, dark, 0, -height * 0.38, 0);
      for (const y of [-0.22, 0.2]) {
        box(width * 0.72, height * 0.16, depth * 0.68, body, 0, y * height, 0);
        box(width * 0.62, height * 0.06, depth * 0.48, display, 0, (y + 0.1) * height, -depth * 0.05);
      }
      for (const y of [-0.18, 0.18]) box(width * 0.07, height * 0.04, depth * 0.08, dark, width * 0.43, y * height, 0);
      break;
    case "crew-berth": {
      const pod = add(new THREE.CapsuleGeometry(Math.min(height, depth) * 0.3, width * 0.42, 6, 12), body);
      pod.rotation.z = Math.PI / 2;
      box(width * 0.24, height * 0.18, depth * 0.72, dark, width * 0.28, height * 0.12, 0);
      box(width * 0.12, height * 0.1, depth * 0.55, display, width * 0.34, height * 0.22, 0);
      break;
    }
    case "living-wall":
      box(width * 0.92, height * 0.92, depth * 0.22, dark);
      for (const x of [-0.28, 0, 0.28]) for (const y of [-0.25, 0.05, 0.28]) add(new THREE.SphereGeometry(Math.min(width, height) * 0.12, 10, 8), plant, x * width, y * height, -depth * 0.13);
      break;
    case "medi-pod": {
      box(width * 0.82, height * 0.12, depth * 0.78, dark, 0, -height * 0.38, 0);
      const chamber = add(new THREE.CapsuleGeometry(Math.min(height, depth) * 0.28, width * 0.38, 6, 14), body);
      chamber.rotation.z = Math.PI / 2;
      const readout = add(new THREE.CylinderGeometry(depth * 0.08, depth * 0.08, width * 0.42, 12), display);
      readout.rotation.z = Math.PI / 2;
      break;
    }
    case "refiner-unit":
      box(width * 0.75, height * 0.44, depth * 0.72, body, 0, -height * 0.12, 0);
      add(new THREE.CylinderGeometry(width * 0.16, width * 0.2, height * 0.48, 12), dark, -width * 0.2, height * 0.28, 0);
      add(new THREE.CylinderGeometry(width * 0.12, width * 0.16, height * 0.38, 12), body, width * 0.2, height * 0.25, 0);
      box(width * 0.36, height * 0.1, depth * 0.06, display, 0, height * 0.06, -depth * 0.39);
      break;
    case "nutrition-unit":
      box(width * 0.86, height * 0.52, depth * 0.72, body, 0, -height * 0.08, 0);
      box(width * 0.72, height * 0.06, depth * 0.62, dark, 0, height * 0.22, 0);
      for (const x of [-0.2, 0.2]) add(new THREE.CylinderGeometry(width * 0.1, width * 0.1, height * 0.08, 12), display, x * width, height * 0.3, 0);
      box(width * 0.3, height * 0.1, depth * 0.06, display, 0, 0, -depth * 0.39);
      break;
    default:
      box(width, height, depth);
  }
  return group;
}

export default function ShipPreview3D({
  placedParts,
  interiorParts,
  activeInteriorHabId,
  allParts,
  currentLayer,
  selectedInstanceId,
  onSelectInstance,
}: ShipPreview3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const partsGroupRef = useRef<THREE.Group | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);

  const [explodeGap, setExplodeGap] = useState<number>(0);
  const [onlyCurrentLayer, setOnlyCurrentLayer] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredPartInfo, setHoveredPartInfo] = useState<{
    name: string;
    category: string;
    layer: number;
    pos: string;
  } | null>(null);

  const partMapRef = useRef<Map<THREE.Object3D, PlacedPart>>(new Map());

  // Setup Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14); // Dark space gray/blue
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 14, 16);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2.5, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Limit below ground
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5ea, 1.4);
    dirLight1.position.set(20, 30, 15);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8); // Sci-fi blue rim light
    dirLight2.position.set(-20, 10, -15);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xeab308, 0.6, 30); // Yellow accent light
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);

    // Groups
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    const partsGroup = new THREE.Group();
    scene.add(partsGroup);
    partsGroupRef.current = partsGroup;

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Grid & Platform
  useEffect(() => {
    const gridGroup = gridGroupRef.current;
    if (!gridGroup) return;

    // Clear old grid objects
    while (gridGroup.children.length > 0) {
      const child = gridGroup.children[0];
      gridGroup.remove(child);
      disposeObject(child);
    }

    if (!showGrid) return;

    // Grid platform base plane
    const gridWidth = GRID_COLS;
    const gridDepth = GRID_ROWS;

    // Base slab
    const slabGeo = new THREE.BoxGeometry(gridWidth + 0.4, 0.2, gridDepth + 0.4);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      metalness: 0.2,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.set(0, -0.1, 0);
    gridGroup.add(slabMesh);

    // Grid lines on top
    const gridHelper = new THREE.GridHelper(
      Math.max(gridWidth, gridDepth),
      Math.max(gridWidth, gridDepth),
      0xfacc15, // Yellow primary grid
      0x374151  // Gray secondary
    );
    gridHelper.position.set(0, 0.01, 0);
    gridGroup.add(gridHelper);

    // Bounding wireframe volume for all 6 layers
    const layerHeight = 0.8;
    const totalHeight = GRID_LAYERS * (layerHeight + explodeGap);
    const boxGeo = new THREE.BoxGeometry(gridWidth, totalHeight, gridDepth);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xeab308,
      transparent: true,
      opacity: 0.25,
    });
    const boundingBoxLine = new THREE.LineSegments(edges, lineMat);
    boundingBoxLine.position.set(0, totalHeight / 2, 0);
    gridGroup.add(boundingBoxLine);
  }, [showGrid, explodeGap]);

  // Update Placed Parts 3D Meshes
  useEffect(() => {
    const partsGroup = partsGroupRef.current;
    if (!partsGroup) return;
    let isDisposed = false;

    partMapRef.current.clear();

    // Clear previous meshes
    while (partsGroup.children.length > 0) {
      const child = partsGroup.children[0];
      partsGroup.remove(child);
      disposeObject(child);
    }

    const layerHeight = 0.75;
    const layerSpacing = layerHeight + explodeGap;

    placedParts.forEach((placed) => {
      if (onlyCurrentLayer && currentLayer !== undefined && placed.layer !== currentLayer) {
        return;
      }

      const def = allParts.find((d) => d.id === placed.partId);
      if (!def) return;

      const { w, h } = rotatedDimensions(def.w, def.h, placed.rotation);

      // Coordinates relative to center of (GRID_COLS x GRID_ROWS) grid
      const x = placed.col + w / 2 - GRID_COLS / 2;
      const z = placed.row + h / 2 - GRID_ROWS / 2;
      const y = placed.layer * layerSpacing + layerHeight / 2;

      const isSelected = selectedInstanceId === placed.instanceId;
      const isCurrentLayer = currentLayer === undefined || placed.layer === currentLayer;
      const opacity = isCurrentLayer ? 0.95 : 0.35;
      const transparent = !isCurrentLayer;
      const isActiveInteriorHab = placed.instanceId === activeInteriorHabId;
      const visualOpacity = isActiveInteriorHab ? 0.16 : opacity;
      const visualTransparent = transparent || isActiveInteriorHab;

      // Render the part in its original orientation, then rotate the entire
      // assembly. Raster coordinates continue to use the rotated footprint.
      const moduleWidth = Math.max(0.2, def.w - 0.08);
      const moduleDepth = Math.max(0.2, def.h - 0.08);
      const moduleHeight = Math.max(0.2, layerHeight - 0.08);
      const partGroup = new THREE.Group();
      const fallbackVisual = createPartVisual(
        def,
        moduleWidth,
        moduleHeight,
        moduleDepth,
        visualTransparent,
        visualOpacity,
        isSelected
      );
      partGroup.add(fallbackVisual);
      partGroup.position.set(x, y, z);
      partGroup.rotation.y = THREE.MathUtils.degToRad(placed.rotation);
      partGroup.userData.isPartModule = true;

      const communityModelUrl = COMMUNITY_MODELS[def.id];
      if (communityModelUrl) {
        loadCommunityModel(communityModelUrl)
          .then((source) => {
            if (isDisposed || !partGroup.parent) return;
            const communityModel = cloneAndFitCommunityModel(
              source,
              def,
              moduleWidth,
              moduleHeight,
              moduleDepth,
              visualTransparent,
              visualOpacity,
              isSelected
            );
            fallbackVisual.visible = false;
            partGroup.add(communityModel);
          })
          .catch((error: unknown) => {
            console.warn(`Community-Modell für ${def.name} konnte nicht geladen werden.`, error);
          });
      }

      if (isSelected) {
        const selection = new THREE.Mesh(
          new THREE.RingGeometry(Math.max(moduleWidth, moduleDepth) * 0.42, Math.max(moduleWidth, moduleDepth) * 0.46, 32),
          new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
        );
        selection.rotation.x = -Math.PI / 2;
        selection.position.y = -moduleHeight / 2 - 0.02;
        partGroup.add(selection);
      }

      if (placed.instanceId === activeInteriorHabId) {
        partGroup.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const meshMaterial of materials) {
            meshMaterial.transparent = true;
            meshMaterial.opacity = 0.16;
            meshMaterial.needsUpdate = true;
          }
        });
        for (const interiorPart of interiorParts.filter((part) => part.parentInstanceId === placed.instanceId)) {
          const interiorDef = allParts.find((part) => part.id === interiorPart.partId);
          const slot = HAB_INTERIOR_SLOTS.find((candidate) => candidate.id === interiorPart.slotId);
          if (!interiorDef || !slot) continue;

          const furnishingGroup = new THREE.Group();
          furnishingGroup.position.set(slot.x * moduleWidth, slot.y * moduleHeight, slot.z * moduleDepth);
          const furnishingWidth = interiorPart.slotId.startsWith("wall") ? moduleWidth * 0.22 : moduleWidth * 0.3;
          const furnishingHeight = interiorPart.slotId === "ceiling" ? moduleHeight * 0.12 : moduleHeight * 0.34;
          const furnishingDepth = interiorPart.slotId.startsWith("wall") ? moduleDepth * 0.08 : moduleDepth * 0.28;
          const fallback = createInteriorFallbackVisual(
            interiorDef,
            furnishingWidth,
            furnishingHeight,
            furnishingDepth
          );
          furnishingGroup.add(fallback);
          partGroup.add(furnishingGroup);

          const interiorModelUrl = COMMUNITY_MODELS[interiorDef.id];
          if (interiorModelUrl) {
            loadCommunityModel(interiorModelUrl)
              .then((source) => {
                if (isDisposed || !furnishingGroup.parent) return;
                const communityModel = cloneAndFitCommunityModel(
                  source,
                  interiorDef,
                  furnishingWidth,
                  furnishingHeight,
                  furnishingDepth,
                  false,
                  0.95,
                  false
                );
                fallback.visible = false;
                furnishingGroup.add(communityModel);
              })
              .catch((error: unknown) => {
                console.warn(`Community-Innenraummodell für ${interiorDef.name} konnte nicht geladen werden.`, error);
              });
          }
        }
      }

      partsGroup.add(partGroup);
      partMapRef.current.set(partGroup, placed);
    });
    return () => {
      isDisposed = true;
    };
  }, [
    placedParts,
    interiorParts,
    activeInteriorHabId,
    allParts,
    currentLayer,
    selectedInstanceId,
    explodeGap,
    onlyCurrentLayer,
  ]);

  // Raycasting for hover & selection
  const handlePointerMoveOrClick = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>, isClick: boolean) => {
      const container = mountRef.current;
      const camera = cameraRef.current;
      const partsGroup = partsGroupRef.current;
      if (!container || !camera || !partsGroup) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersects = raycaster.intersectObjects(partsGroup.children, true);

      if (intersects.length > 0) {
        let object: THREE.Object3D | null = intersects[0].object;
        while (object && !partMapRef.current.has(object)) {
          object = object.parent;
        }

        if (object) {
          const placed = partMapRef.current.get(object);
          if (placed) {
            const def = allParts.find((d) => d.id === placed.partId);
            if (def) {
              setHoveredPartInfo({
                name: def.name,
                category: def.category,
                layer: placed.layer + 1,
                pos: `(${placed.col}, ${placed.row}) - ${placed.rotation}°`,
              });

              if (isClick && onSelectInstance) {
                onSelectInstance(placed.instanceId);
              }
              return;
            }
          }
        }
      }

      setHoveredPartInfo(null);
      if (isClick && onSelectInstance) {
        onSelectInstance(null);
      }
    },
    [allParts, onSelectInstance]
  );

  // Preset Camera Positions
  const setCameraView = (view: "iso" | "top" | "front" | "side") => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    switch (view) {
      case "iso":
        camera.position.set(12, 14, 16);
        break;
      case "top":
        camera.position.set(0, 22, 0.01);
        break;
      case "front":
        camera.position.set(0, 3, 18);
        break;
      case "side":
        camera.position.set(20, 3, 0);
        break;
    }
    controls.target.set(0, 2.5, 0);
    controls.update();
  };

  return (
    <div className="relative w-full h-[500px] lg:h-[600px] bg-gray-950 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing"
        onPointerMove={(e) => handlePointerMoveOrClick(e, false)}
        onClick={(e) => handlePointerMoveOrClick(e, true)}
      />

      {/* Top Bar Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* View presets */}
        <div className="flex gap-1 bg-gray-900/80 backdrop-blur border border-gray-700/80 p-1 rounded-lg pointer-events-auto shadow-lg">
          <button
            onClick={() => setCameraView("iso")}
            className="px-2 py-1 text-xs font-semibold text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded transition-colors"
          >
            Isometric
          </button>
          <button
            onClick={() => setCameraView("top")}
            className="px-2 py-1 text-xs font-semibold text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded transition-colors"
          >
            Oben
          </button>
          <button
            onClick={() => setCameraView("front")}
            className="px-2 py-1 text-xs font-semibold text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded transition-colors"
          >
            Vorne
          </button>
          <button
            onClick={() => setCameraView("side")}
            className="px-2 py-1 text-xs font-semibold text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded transition-colors"
          >
            Seite
          </button>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-gray-700/80 p-1.5 rounded-lg pointer-events-auto text-xs text-gray-300 shadow-lg">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCurrentLayer}
              onChange={(e) => setOnlyCurrentLayer(e.target.checked)}
              className="accent-yellow-500 rounded"
            />
            Nur Ebene {currentLayer !== undefined ? currentLayer + 1 : 1}
          </label>
          <span className="text-gray-600">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-yellow-500 rounded"
            />
            Gitter
          </label>
        </div>
      </div>

      {/* Exploded View Slider */}
      <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur border border-gray-700/80 p-2 rounded-lg pointer-events-auto flex items-center gap-2 text-xs text-gray-300 shadow-lg">
        <span className="text-yellow-400 font-semibold">Explosionsansicht:</span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={explodeGap}
          onChange={(e) => setExplodeGap(parseFloat(e.target.value))}
          className="w-24 accent-yellow-500 cursor-pointer"
        />
        <span className="text-gray-400 w-8">{explodeGap.toFixed(1)}x</span>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredPartInfo && (
        <div className="absolute bottom-3 right-3 bg-gray-900/90 backdrop-blur border border-yellow-500/50 p-2.5 rounded-lg pointer-events-none text-xs shadow-xl animate-fade-in">
          <p className="font-bold text-yellow-300">{hoveredPartInfo.name}</p>
          <p className="text-gray-400">
            Kategorie: <span className="text-gray-200">{hoveredPartInfo.category}</span>
          </p>
          <p className="text-gray-400">
            Ebene {hoveredPartInfo.layer} • Pos: {hoveredPartInfo.pos}
          </p>
        </div>
      )}
    </div>
  );
}

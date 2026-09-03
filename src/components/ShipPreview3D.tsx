"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  PlacedPart,
  PartDefinition,
  GRID_COLS,
  GRID_ROWS,
  GRID_LAYERS,
  Rotation,
} from "@/lib/corvetteData";

interface ShipPreview3DProps {
  placedParts: PlacedPart[];
  allParts: PartDefinition[];
  currentLayer?: number;
  selectedInstanceId?: string | null;
  onSelectInstance?: (instanceId: string | null) => void;
}

function rotatedDimensions(
  w: number,
  h: number,
  rotation: Rotation
): { w: number; h: number } {
  if (rotation === 90 || rotation === 270) return { w: h, h: w };
  return { w, h };
}

export default function ShipPreview3D({
  placedParts,
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
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
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

    partMapRef.current.clear();

    // Clear previous meshes
    while (partsGroup.children.length > 0) {
      const child = partsGroup.children[0];
      partsGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
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

      // Color from part def
      const color = new THREE.Color(def.color);

      // Material
      const isSelected = selectedInstanceId === placed.instanceId;
      const isCurrentLayer = currentLayer === undefined || placed.layer === currentLayer;

      const opacity = isCurrentLayer ? 0.95 : 0.35;
      const transparent = !isCurrentLayer;

      const geometry = new THREE.BoxGeometry(w - 0.05, layerHeight - 0.05, h - 0.05);

      const material = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xfacc15 : color,
        roughness: 0.3,
        metalness: 0.5,
        transparent,
        opacity,
        emissive: isSelected ? 0x713f12 : color,
        emissiveIntensity: isSelected ? 0.5 : 0.15,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Add edge highlight to block
      const edgesGeo = new THREE.EdgesGeometry(geometry);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xffffff : 0x000000,
        linewidth: isSelected ? 2 : 1,
        transparent: true,
        opacity: isCurrentLayer ? 0.6 : 0.2,
      });
      const wireframe = new THREE.LineSegments(edgesGeo, edgeMat);
      mesh.add(wireframe);

      partsGroup.add(mesh);
      partMapRef.current.set(mesh, placed);
    });
  }, [placedParts, allParts, currentLayer, selectedInstanceId, explodeGap, onlyCurrentLayer]);

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

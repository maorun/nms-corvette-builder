"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { validateConstruction } from "@/lib/constructionValidation";
import {
  PARTS as BASE_PARTS,
  PART_CATEGORIES,
  PART_CATEGORY_LABELS,
  getPartDisplayDescription,
  getPartDisplayName,
  GRID_COLS,
  GRID_ROWS,
  GRID_LAYERS,
  PlacedPart,
  PartDefinition,
  PartCategory,
  Rotation,
  PartRotation,
  DEFAULT_PART_ROTATION,
  getRotatedPartDimensions,
  isDefaultPartRotation,
  HAB_INTERIOR_SLOTS,
  INTERIOR_ALLOWED_SURFACES,
  InteriorSlotId,
  PlacedInteriorPart,
} from "@/lib/corvetteData";

const ShipPreview3D = dynamic(() => import("./ShipPreview3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-950 border border-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-xs">
      3D Vorschau wird geladen...
    </div>
  ),
});

const CUSTOM_PARTS_STORAGE_KEY = "nms_corvette_custom_parts";

let instanceCounter = 0;
function newInstanceId() {
  return `inst-${++instanceCounter}`;
}

function cellsOccupied(p: PlacedPart, def: PartDefinition): string[] {
  const { x, y, z } = getRotatedPartDimensions(def.w, def.h, p.rotation);
  const cells: string[] = [];
  for (let layer = p.layer; layer < p.layer + y; layer++) {
    for (let row = p.row; row < p.row + z; row++) {
      for (let col = p.col; col < p.col + x; col++) {
        cells.push(`${col},${row},${layer}`);
      }
    }
  }
  return cells;
}

function cellsOccupiedOnLayer(p: PlacedPart, def: PartDefinition, layer: number): string[] {
  return cellsOccupied(p, def)
    .filter((cell) => cell.endsWith(`,${layer}`))
    .map((cell) => cell.slice(0, cell.lastIndexOf(",")));
}

function canPlace(
  parts: PlacedPart[],
  allParts: PartDefinition[],
  partDef: PartDefinition,
  col: number,
  row: number,
  layer: number,
  rotation: PartRotation,
  excludeInstanceId?: string
): boolean {
  const dimensions = getRotatedPartDimensions(partDef.w, partDef.h, rotation);
  if (
    col + dimensions.x > GRID_COLS ||
    row + dimensions.z > GRID_ROWS ||
    layer + dimensions.y > GRID_LAYERS
  ) return false;

  const occupied = new Set<string>();
  for (const placedPart of parts) {
    if (placedPart.instanceId === excludeInstanceId) continue;
    const definition = allParts.find((candidate) => candidate.id === placedPart.partId);
    if (!definition) continue;
    for (const cell of cellsOccupied(placedPart, definition)) occupied.add(cell);
  }
  for (let occupiedLayer = layer; occupiedLayer < layer + dimensions.y; occupiedLayer++) {
    for (let occupiedRow = row; occupiedRow < row + dimensions.z; occupiedRow++) {
      for (let occupiedCol = col; occupiedCol < col + dimensions.x; occupiedCol++) {
        if (occupied.has(`${occupiedCol},${occupiedRow},${occupiedLayer}`)) return false;
      }
    }
  }
  return true;
}
function rotateAroundAxis(rotation: PartRotation, axis: keyof PartRotation): PartRotation {
  return { ...rotation, [axis]: ((rotation[axis] + 90) % 360) as Rotation };
}

const EMPTY_PART_SET = new Set<string>();

function getLayerLabel(layer: number): string {
  if (layer === 0) return "Ebene 1 (unterste)";
  if (layer === GRID_LAYERS - 1) return `Ebene ${GRID_LAYERS} (oberste)`;
  return `Ebene ${layer + 1}`;
}

export default function CorvetteBuilder() {
  const [customParts, setCustomParts] = useState<PartDefinition[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CUSTOM_PARTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Custom Part form state
  const [newPartName, setNewPartName] = useState("");
  const [newPartCategory, setNewPartCategory] = useState<PartCategory>("Aerofoil");
  const [newPartMaxCount, setNewPartMaxCount] = useState(4);
  const [newPartW, setNewPartW] = useState(2);
  const [newPartH, setNewPartH] = useState(1);
  const [newPartColor, setNewPartColor] = useState("#3b82f6");
  const [newPartDescription, setNewPartDescription] = useState("");

  const [placedParts, setPlacedParts] = useState<PlacedPart[]>([]);
  const [interiorParts, setInteriorParts] = useState<PlacedInteriorPart[]>([]);
  const [activeInteriorHabId, setActiveInteriorHabId] = useState<string | null>(null);
  const [selectedInteriorPartId, setSelectedInteriorPartId] = useState<string | null>(null);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedRotation, setSelectedRotation] = useState<PartRotation>({ ...DEFAULT_PART_ROTATION });
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  );
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "3d" | "split">("grid");

  // Save custom parts to localStorage when updated
  const saveCustomParts = useCallback((parts: PartDefinition[]) => {
    setCustomParts(parts);
    try {
      localStorage.setItem(CUSTOM_PARTS_STORAGE_KEY, JSON.stringify(parts));
    } catch {
      // ignore
    }
  }, []);

  const allParts = useMemo(() => {
    return [...BASE_PARTS, ...customParts];
  }, [customParts]);

  const groupedPartIds = useMemo(() => {
    return allParts.reduce<Record<string, Set<string>>>((acc, part) => {
      if (!part.countGroup) return acc;
      if (!acc[part.countGroup]) acc[part.countGroup] = new Set<string>();
      acc[part.countGroup].add(part.id);
      return acc;
    }, {});
  }, [allParts]);

  const handleAddCustomPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;

    const slug = `custom-${Date.now()}-${newPartName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;

    const newPart: PartDefinition = {
      id: slug,
      name: newPartName.trim(),
      category: newPartCategory,
      maxCount: Math.max(1, Number(newPartMaxCount) || 1),
      w: Math.max(1, Math.min(10, Number(newPartW) || 1)),
      h: Math.max(1, Math.min(6, Number(newPartH) || 1)),
      color: newPartColor || "#3b82f6",
      description: newPartDescription.trim() || "Eigenes Bauteil",
    };

    saveCustomParts([...customParts, newPart]);
    setSelectedPartId(newPart.id);
    setIsAddModalOpen(false);

    // Reset form
    setNewPartName("");
    setNewPartDescription("");
  };

  const handleDeleteCustomPart = (partId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove custom part and any placed instances of it
    const updatedCustomParts = customParts.filter((p) => p.id !== partId);
    saveCustomParts(updatedCustomParts);
    setPlacedParts((prev) => prev.filter((p) => p.partId !== partId));
    setInteriorParts((prev) => prev.filter((p) => p.partId !== partId));
    if (selectedPartId === partId) setSelectedPartId(null);
    if (selectedInteriorPartId === partId) setSelectedInteriorPartId(null);
  };

  const countByPartId = useCallback(
    (partId: string) =>
      placedParts.filter((p) => p.partId === partId).length +
      interiorParts.filter((p) => p.partId === partId).length,
    [placedParts, interiorParts]
  );

  const countByLimitKey = useCallback(
    (partDef: PartDefinition) => {
      if (!partDef.countGroup) return countByPartId(partDef.id);
      const partSet = groupedPartIds[partDef.countGroup] ?? EMPTY_PART_SET;
      return placedParts.filter((p) => partSet.has(p.partId)).length +
        interiorParts.filter((p) => partSet.has(p.partId)).length;
    },
    [placedParts, interiorParts, countByPartId, groupedPartIds]
  );

  const openInteriorEditor = useCallback((habInstanceId: string) => {
    setActiveInteriorHabId(habInstanceId);
    setSelectedInteriorPartId(null);
    setSelectedPartId(null);
    setSelectedInstanceId(null);
  }, []);

  const placeInteriorPart = useCallback((slotId: InteriorSlotId) => {
    if (!activeInteriorHabId || !selectedInteriorPartId) return;
    const definition = allParts.find((part) => part.id === selectedInteriorPartId);
    const slot = HAB_INTERIOR_SLOTS.find((candidate) => candidate.id === slotId);
    if (!definition || definition.category !== "Interior" || !slot) return;
    const allowedSurfaces = definition.allowedInteriorSurfaces ?? INTERIOR_ALLOWED_SURFACES[definition.id];
    if (allowedSurfaces && !allowedSurfaces.includes(slot.surface)) return;
    if (countByLimitKey(definition) >= definition.maxCount) return;
    if (interiorParts.some((part) => part.parentInstanceId === activeInteriorHabId && part.slotId === slotId)) return;

    setInteriorParts((parts) => [...parts, {
      instanceId: newInstanceId(),
      partId: selectedInteriorPartId,
      parentInstanceId: activeInteriorHabId,
      slotId,
    }]);
    setSelectedInteriorPartId(null);
  }, [activeInteriorHabId, allParts, countByLimitKey, interiorParts, selectedInteriorPartId]);

  const removeInteriorPart = useCallback((instanceId: string) => {
    setInteriorParts((parts) => parts.filter((part) => part.instanceId !== instanceId));
  }, []);

  const handleCellClick = useCallback(
    (col: number, row: number) => {
      // If an instance is selected, move it to this cell (on current layer)
      if (selectedInstanceId) {
        const inst = placedParts.find(
          (p) => p.instanceId === selectedInstanceId
        );
        if (!inst) return;
        const def = allParts.find((d) => d.id === inst.partId)!;
        if (
          canPlace(
            placedParts,
            allParts,
            def,
            col,
            row,
            currentLayer,
            inst.rotation,
            selectedInstanceId
          )
        ) {
          setPlacedParts((prev) =>
            prev.map((p) =>
              p.instanceId === selectedInstanceId
                ? { ...p, col, row, layer: currentLayer }
                : p
            )
          );
        }
        setSelectedInstanceId(null);
        return;
      }

      // Check whether the current layer intersects an existing 3D part.
      for (const p of placedParts) {
        const def = allParts.find((d) => d.id === p.partId);
        if (def) {
          const cells = cellsOccupiedOnLayer(p, def, currentLayer);
          if (cells.includes(`${col},${row}`)) {
            setSelectedInstanceId(p.instanceId);
            setSelectedPartId(null);
            return;
          }
        }
      }

      // Place new part
      if (!selectedPartId) return;
      const def = allParts.find((d) => d.id === selectedPartId)!;
      if (countByLimitKey(def) >= def.maxCount) return;
      if (
        !canPlace(
          placedParts,
          allParts,
          def,
          col,
          row,
          currentLayer,
          selectedRotation
        )
      )
        return;

      setPlacedParts((prev) => [
        ...prev,
        {
          instanceId: newInstanceId(),
          partId: selectedPartId,
          col,
          row,
          layer: currentLayer,
          rotation: selectedRotation,
        },
      ]);
    },
    [
      placedParts,
      allParts,
      selectedPartId,
      selectedRotation,
      selectedInstanceId,
      currentLayer,
      countByLimitKey,
    ]
  );

  const rotatePart = useCallback(
    (instanceId: string, axis: keyof PartRotation) => {
      setPlacedParts((prev) =>
        prev.map((part) => {
          if (part.instanceId !== instanceId) return part;
          const definition = allParts.find((candidate) => candidate.id === part.partId);
          if (!definition) return part;
          const nextRotation = rotateAroundAxis(part.rotation, axis);
          return canPlace(
            prev,
            allParts,
            definition,
            part.col,
            part.row,
            part.layer,
            nextRotation,
            instanceId
          )
            ? { ...part, rotation: nextRotation }
            : part;
        })
      );
    },
    [allParts]
  );

  const removePart = useCallback((instanceId: string) => {
    setPlacedParts((prev) => prev.filter((p) => p.instanceId !== instanceId));
    setInteriorParts((parts) => parts.filter((part) => part.parentInstanceId !== instanceId));
    if (activeInteriorHabId === instanceId) setActiveInteriorHabId(null);
    setSelectedInstanceId(null);
  }, [activeInteriorHabId]);

  const clearAll = useCallback(() => {
    setPlacedParts([]);
    setInteriorParts([]);
    setActiveInteriorHabId(null);
    setSelectedInteriorPartId(null);
    setSelectedPartId(null);
    setSelectedInstanceId(null);
  }, []);

  // Build a 2D cross-section of the complete 3D volume for the active layer.
  const cellMap: Record<string, PlacedPart> = {};
  const otherLayersCells = new Set<string>();
  for (const placedPart of placedParts) {
    const definition = allParts.find((candidate) => candidate.id === placedPart.partId);
    if (!definition) continue;
    for (const cell of cellsOccupiedOnLayer(placedPart, definition, currentLayer)) {
      cellMap[cell] = placedPart;
    }
    for (const cell of cellsOccupied(placedPart, definition)) {
      const separator = cell.lastIndexOf(",");
      const cellLayer = Number(cell.slice(separator + 1));
      if (cellLayer !== currentLayer) otherLayersCells.add(cell.slice(0, separator));
    }
  }

  const activeInteriorHab = activeInteriorHabId
    ? placedParts.find((part) => part.instanceId === activeInteriorHabId) ?? null
    : null;
  const activeInteriorParts = activeInteriorHabId
    ? interiorParts.filter((part) => part.parentInstanceId === activeInteriorHabId)
    : [];
  const selectedInteriorDefinition = selectedInteriorPartId
    ? allParts.find((part) => part.id === selectedInteriorPartId)
    : null;
  const validationIssues = useMemo(
    () => validateConstruction(placedParts, interiorParts, allParts),
    [placedParts, interiorParts, allParts]
  );

  // Interior parts are only available within the selected Hab, never on the outer grid.
  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const availableParts = activeInteriorHabId
      ? allParts.filter((part) => part.category === "Interior")
      : allParts.filter((part) => part.category !== "Interior");
    if (!q) return availableParts;
    return availableParts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [activeInteriorHabId, allParts, searchQuery]);

  const categories = useMemo(() => {
    return Array.from(new Set(filteredParts.map((p) => p.category)));
  }, [filteredParts]);

  const selectedInstance = selectedInstanceId
    ? placedParts.find((p) => p.instanceId === selectedInstanceId)
    : null;

  const partsOnLayer = (layer: number) =>
    placedParts.filter((part) => {
      const definition = allParts.find((candidate) => candidate.id === part.partId);
      if (!definition) return false;
      const dimensions = getRotatedPartDimensions(definition.w, definition.h, part.rotation);
      return part.layer <= layer && layer < part.layer + dimensions.y;
    }).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-yellow-500/30 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 text-2xl">🚀</span>
          <div>
            <h1 className="text-yellow-400 font-bold text-xl tracking-wider uppercase">
              NMS Corvette Builder
            </h1>
            <p className="text-gray-400 text-xs">
              No Man&apos;s Sky – Offline Korvetten-Werftplaner
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode buttons */}
          <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-yellow-500 text-gray-950"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              2D Gitter
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                viewMode === "3d"
                  ? "bg-yellow-500 text-gray-950"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              3D Vorschau
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                viewMode === "split"
                  ? "bg-yellow-500 text-gray-950"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Geteilt
            </button>
          </div>

          <button
            onClick={clearAll}
            className="text-xs bg-red-900/50 hover:bg-red-700/60 text-red-300 border border-red-700/50 px-3 py-1.5 rounded transition-colors"
          >
            Alles löschen
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4 overflow-auto">
        {/* Parts Panel */}
        <aside className="lg:w-64 flex-shrink-0 space-y-3">
          {/* Rotation selector */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Platzierungsrotation
            </p>
            <div className="space-y-1.5">
              {(["x", "y", "z"] as const).map((axis) => (
                <button
                  key={axis}
                  onClick={() => setSelectedRotation((rotation) => rotateAroundAxis(rotation, axis))}
                  className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded border bg-gray-800 text-gray-200 border-gray-600 hover:border-yellow-500/50 transition-colors"
                  title={`Um die ${axis.toUpperCase()}-Achse drehen`}
                >
                  <span className="font-semibold">{axis.toUpperCase()}-Achse</span>
                  <span className="text-yellow-300">↻ {selectedRotation[axis]}°</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search & Custom Part Controls */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Suche & Teile
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold px-2 py-0.5 rounded transition-colors"
              >
                + Eigenes Teil
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Bauteil suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Parts list */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 overflow-y-auto max-h-[calc(100vh-340px)]">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Bauteile ({filteredParts.length})
            </p>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                Keine Bauteile gefunden.
              </p>
            ) : (
              categories.map((cat) => (
                <div key={cat} className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {PART_CATEGORY_LABELS[cat]}
                  </p>
                  {filteredParts
                    .filter((p) => p.category === cat)
                    .map((part) => {
                      const count = countByLimitKey(part);
                      const maxReached = count >= part.maxCount;
                      const isSelected = activeInteriorHabId
                        ? selectedInteriorPartId === part.id
                        : selectedPartId === part.id;
                      const isCustom = part.id.startsWith("custom-");

                      return (
                        <div
                          key={part.id}
                          className="group relative flex items-center mb-1"
                        >
                          <button
                            disabled={maxReached}
                            onClick={() => {
                              if (activeInteriorHabId) {
                                setSelectedInteriorPartId(isSelected ? null : part.id);
                              } else {
                                setSelectedPartId(isSelected ? null : part.id);
                                setSelectedInstanceId(null);
                              }
                            }}
                            onMouseEnter={() => setTooltip(getPartDisplayDescription(part))}
                            onMouseLeave={() => setTooltip(null)}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs border transition-all flex items-center justify-between ${
                              maxReached
                                ? "opacity-40 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-500"
                                : isSelected
                                ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 font-semibold"
                                : "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500"
                            }`}
                            style={isSelected ? { borderColor: part.color } : {}}
                          >
                            <span className="flex items-center gap-1.5 truncate mr-1">
                              <span
                                className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: part.color }}
                              />
                              <span className="truncate">{getPartDisplayName(part.name)}</span>
                              {isCustom && (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1 rounded flex-shrink-0">
                                  Benutzer
                                </span>
                              )}
                            </span>
                            <span className="text-gray-500 flex-shrink-0 ml-1">
                              {count}/{part.maxCount}
                            </span>
                          </button>
                          {isCustom && (
                            <button
                              onClick={(e) => handleDeleteCustomPart(part.id, e)}
                              title="Eigenes Bauteil löschen"
                              className="ml-1 text-gray-500 hover:text-red-400 px-1 py-1 rounded text-xs opacity-70 hover:opacity-100 transition-opacity"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div className="bg-gray-800 border border-yellow-500/30 rounded p-2 text-xs text-gray-300">
              {tooltip}
            </div>
          )}
        </aside>

        {/* Grid + Context Panel */}
        <div className="flex-1 flex flex-col gap-4">
          {activeInteriorHab && (
            <div className="bg-gray-900 border border-violet-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-violet-300">Innenraum: {getPartDisplayName(allParts.find((part) => part.id === activeInteriorHab.partId)?.name ?? "Wohnmodul")}</p>
                  <p className="text-xs text-gray-400">Wähle links ein Innenraumteil und anschließend einen freien Platz. Innenraumteile belegen kein Außenraster.</p>
                </div>
                <button onClick={() => { setActiveInteriorHabId(null); setSelectedInteriorPartId(null); }} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded">Zurück zum Außenbau</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {HAB_INTERIOR_SLOTS.map((slot) => {
                  const placed = activeInteriorParts.find((part) => part.slotId === slot.id);
                  const definition = placed ? allParts.find((part) => part.id === placed.partId) : null;
                  const allowedSurfaces = selectedInteriorDefinition?.allowedInteriorSurfaces ?? (selectedInteriorDefinition ? INTERIOR_ALLOWED_SURFACES[selectedInteriorDefinition.id] : undefined);
                  const isCompatible = !allowedSurfaces || allowedSurfaces.includes(slot.surface);
                  return <button key={slot.id} disabled={!placed && !isCompatible} onClick={() => placed ? removeInteriorPart(placed.instanceId) : placeInteriorPart(slot.id)} className={`min-h-24 p-3 rounded border text-left transition-colors ${placed ? "border-violet-400 bg-violet-500/15" : !isCompatible ? "border-gray-800 bg-gray-900/40 opacity-45 cursor-not-allowed" : selectedInteriorPartId ? "border-violet-500/60 bg-violet-500/10 hover:bg-violet-500/20" : "border-gray-700 bg-gray-800/60"}`}>
                    <span className="block text-[10px] uppercase text-gray-500">{slot.surface}</span>
                    <span className="block text-xs font-semibold mt-1" style={definition ? { color: definition.color } : undefined}>{definition ? getPartDisplayName(definition.name) : slot.name}</span>
                    <span className="block text-[10px] text-gray-500 mt-1">{placed ? "Klick zum Entfernen" : !isCompatible ? "Nicht kompatibel" : selectedInteriorPartId ? "Klick zum Platzieren" : "Freier Slot"}</span>
                  </button>;
                })}
              </div>
            </div>
          )}
          <section className={`rounded-lg border p-3 ${validationIssues.some((issue) => issue.severity === "error") ? "border-red-500/50 bg-red-950/20" : validationIssues.length > 0 ? "border-amber-500/50 bg-amber-950/20" : "border-emerald-500/40 bg-emerald-950/20"}`} aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gray-100">Konstruktionsprüfung</h2>
              <span className={`text-xs font-semibold ${validationIssues.some((issue) => issue.severity === "error") ? "text-red-300" : validationIssues.length > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                {validationIssues.length === 0 ? "Entwurf plausibel" : `${validationIssues.length} Hinweis${validationIssues.length === 1 ? "" : "e"}`}
              </span>
            </div>
            {validationIssues.length === 0 ? (
              <p className="mt-1 text-xs text-emerald-200">Cockpit, Verbindung zum Rumpf und Innenraumzuordnungen sind geprüft.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {validationIssues.map((issue) => <li key={issue.id} className="text-xs text-gray-300"><span className={`font-semibold ${issue.severity === "error" ? "text-red-300" : "text-amber-300"}`}>{issue.severity === "error" ? "Fehler" : "Hinweis"}: {issue.title}.</span> {issue.message}</li>)}
              </ul>
            )}
          </section>
          {/* Context panel for selected instance */}
          {selectedInstance && (
            <div className="bg-gray-900 border border-yellow-500/40 rounded-lg p-3 flex items-center gap-4 flex-wrap">
              {(() => {
                const def = allParts.find(
                  (d) => d.id === selectedInstance.partId
                );
                if (!def) return null;
                return (
                  <>
                    <span
                      className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: def.color }}
                    />
                    <span className="font-semibold text-yellow-300 text-sm">
                      {getPartDisplayName(def.name)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Rotation: X {selectedInstance.rotation.x}° · Y {selectedInstance.rotation.y}° · Z {selectedInstance.rotation.z}°
                    </span>
                    <span className="text-xs text-gray-400">
                      Pos: ({selectedInstance.col},{selectedInstance.row})
                    </span>
                    <span className="text-xs text-blue-400">
                      Ebene: {getLayerLabel(selectedInstance.layer)}
                    </span>
                    <div className="ml-auto flex gap-2">
                      {def.category === "Hab" && (
                        <button
                          onClick={() => openInteriorEditor(selectedInstance.instanceId)}
                          className="text-xs bg-violet-900/50 hover:bg-violet-700/60 text-violet-200 border border-violet-600/50 px-3 py-1 rounded transition-colors"
                        >
                          Innenraum bearbeiten
                        </button>
                      )}
                      {(["x", "y", "z"] as const).map((axis) => (
                        <button
                          key={axis}
                          onClick={() => rotatePart(selectedInstance.instanceId, axis)}
                          className="text-xs bg-blue-900/50 hover:bg-blue-700/60 text-blue-300 border border-blue-700/50 px-3 py-1 rounded transition-colors"
                          title={`Um die ${axis.toUpperCase()}-Achse drehen`}
                        >
                          ↻ {axis.toUpperCase()} +90°
                        </button>
                      ))}
                      <button
                        onClick={() => removePart(selectedInstance.instanceId)}
                        className="text-xs bg-red-900/50 hover:bg-red-700/60 text-red-300 border border-red-700/50 px-3 py-1 rounded transition-colors"
                      >
                        🗑 Entfernen
                      </button>
                      <button
                        onClick={() => setSelectedInstanceId(null)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 px-3 py-1 rounded transition-colors"
                      >
                        ✕ Abwählen
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Instructions */}
          {!selectedInstance && (
            <div className="text-xs text-gray-500 bg-gray-900/50 border border-gray-800 rounded px-3 py-2">
              {selectedPartId
                ? `Bauteil auswählen und auf das Gitter klicken zum Platzieren. Rotation: X ${selectedRotation.x}° · Y ${selectedRotation.y}° · Z ${selectedRotation.z}°`
                : "Wähle ein Bauteil aus der Liste oder klicke ein platziertes Bauteil an."}
            </div>
          )}

          {/* Main Workspace (Grid / 3D / Split) */}
          <div
            className={
              viewMode === "split"
                ? "grid grid-cols-1 xl:grid-cols-2 gap-4"
                : "flex flex-col gap-4"
            }
          >
            {/* 2D Grid Section */}
            {(viewMode === "grid" || viewMode === "split") && (
              <div className="flex flex-col gap-2">
                {/* Layer tabs */}
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: GRID_LAYERS }).map((_, i) => {
                    const count = partsOnLayer(i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentLayer(i);
                          setSelectedInstanceId(null);
                        }}
                        className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-t text-xs font-semibold border-b-2 transition-colors ${
                          currentLayer === i
                            ? "bg-gray-800 border-yellow-400 text-yellow-300"
                            : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500"
                        }`}
                      >
                        E{i + 1}
                        {count > 0 && (
                          <span
                            className={`ml-1 text-[10px] px-1 rounded-full ${
                              currentLayer === i
                                ? "bg-yellow-500/30 text-yellow-300"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Grid */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg rounded-tl-none p-4 overflow-auto">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
                    {getLayerLabel(currentLayer)} – Bau-Gitter ({GRID_COLS}×
                    {GRID_ROWS})
                  </p>
                  <p className="text-[11px] text-gray-600 mb-3 -mt-2">
                    Strukturelle Korvetten-Baumodule
                  </p>
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${GRID_COLS}, minmax(48px, 1fr))`,
                      gridTemplateRows: `repeat(${GRID_ROWS}, 48px)`,
                    }}
                  >
                    {Array.from({ length: GRID_ROWS }).map((_, row) =>
                      Array.from({ length: GRID_COLS }).map((_, col) => {
                        const key = `${col},${row}`;
                        const placed = cellMap[key];
                        const def = placed
                          ? allParts.find((d) => d.id === placed.partId)
                          : null;
                        const isSelectedInst =
                          placed?.instanceId === selectedInstanceId;
                        const isOrigin =
                          placed?.col === col && placed?.row === row;
                        const hasOtherLayer =
                          !placed && otherLayersCells.has(key);

                        // Preview highlight
                        let previewHighlight = false;
                        if (selectedPartId && !selectedInstanceId && !placed) {
                          const pDef = allParts.find((d) => d.id === selectedPartId);
                          if (pDef) {
                            const dimensions = getRotatedPartDimensions(
                              pDef.w,
                              pDef.h,
                              selectedRotation
                            );
                            if (
                              col + dimensions.x <= GRID_COLS &&
                              row + dimensions.z <= GRID_ROWS &&
                              currentLayer + dimensions.y <= GRID_LAYERS &&
                              canPlace(
                                placedParts,
                                allParts,
                                pDef,
                                col,
                                row,
                                currentLayer,
                                selectedRotation
                              )
                            ) {
                              previewHighlight = true;
                            }
                          }
                        }

                        return (
                          <div
                            key={key}
                            onClick={() => handleCellClick(col, row)}
                            title={
                              hasOtherLayer
                                ? "Auf einer anderen Ebene belegt"
                                : undefined
                            }
                            className={`relative border rounded cursor-pointer transition-all flex items-center justify-center text-xs font-bold select-none
                              ${
                                placed
                                  ? isSelectedInst
                                    ? "border-yellow-400 ring-2 ring-yellow-400/60"
                                    : "border-transparent"
                                  : previewHighlight
                                  ? "border-yellow-500/60 bg-yellow-500/10"
                                  : hasOtherLayer
                                  ? "border-gray-600 bg-gray-800/40 border-dashed"
                                  : "border-gray-700 bg-gray-800/60 hover:bg-gray-700/60 hover:border-gray-500"
                              }
                            `}
                            style={
                              def
                                ? {
                                    backgroundColor: `${def.color}22`,
                                    borderColor: isSelectedInst
                                      ? "#facc15"
                                      : def.color,
                                  }
                                : undefined
                            }
                          >
                            {isOrigin && def && (
                              <div
                                className="flex flex-col items-center justify-center gap-0.5 pointer-events-none"
                                style={{ color: def.color }}
                              >
                                <span className="text-[10px] leading-tight text-center px-1 line-clamp-2">
                                  {getPartDisplayName(def.name)}
                                </span>
                                {!isDefaultPartRotation(placed!.rotation) && (
                                  <span className="text-[9px] opacity-70">
                                    X{placed!.rotation.x}° Y{placed!.rotation.y}° Z{placed!.rotation.z}°
                                  </span>
                                )}
                              </div>
                            )}
                            {hasOtherLayer && (
                              <span className="text-gray-600 text-[10px]">·</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3D Preview Section */}
            {(viewMode === "3d" || viewMode === "split") && (
              <div className="flex flex-col gap-2">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-yellow-400 uppercase tracking-wider font-bold">
                      Interaktive 3D Schiffs-Vorschau
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Drehen mit Linksklick • Zoom mit Mausrad
                    </p>
                  </div>
                  <ShipPreview3D
                    placedParts={placedParts}
                    interiorParts={interiorParts}
                    activeInteriorHabId={activeInteriorHabId}
                    allParts={allParts}
                    currentLayer={currentLayer}
                    selectedInstanceId={selectedInstanceId}
                    onSelectInstance={(id) => {
                      setSelectedInstanceId(id);
                      if (id) setSelectedPartId(null);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Platzierte Bauteile gesamt ({placedParts.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {placedParts.length === 0 && (
                <span className="text-xs text-gray-600">
                  Noch keine Bauteile platziert.
                </span>
              )}
              {Array.from(new Set(placedParts.map((p) => p.partId))).map(
                (pid) => {
                  const def = allParts.find((d) => d.id === pid);
                  if (!def) return null;
                  const count = countByPartId(pid);
                  return (
                    <span
                      key={pid}
                      className="text-xs px-2 py-1 rounded border"
                      style={{
                        backgroundColor: `${def.color}22`,
                        borderColor: def.color,
                        color: def.color,
                      }}
                    >
                      {getPartDisplayName(def.name)} ×{count}
                    </span>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Part Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-yellow-500/50 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <h2 className="text-yellow-400 font-bold text-lg uppercase tracking-wider">
                Eigenes Bauteil hinzufügen
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomPart} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  Name des Bauteils *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Arcadia Blade Extra"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    Kategorie
                  </label>
                  <select
                    value={newPartCategory}
                    onChange={(e) =>
                      setNewPartCategory(e.target.value as PartCategory)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500"
                  >
                    {PART_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {PART_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    Max. Anzahl
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={newPartMaxCount}
                    onChange={(e) => setNewPartMaxCount(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    Breite (Zellen)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={GRID_COLS}
                    value={newPartW}
                    onChange={(e) => setNewPartW(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    Tiefe (Zellen)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={GRID_ROWS}
                    value={newPartH}
                    onChange={(e) => setNewPartH(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    Farbe
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newPartColor}
                      onChange={(e) => setNewPartColor(e.target.value)}
                      className="w-8 h-8 rounded bg-transparent cursor-pointer border border-gray-700 p-0"
                    />
                    <span className="text-[10px] text-gray-400 uppercase">
                      {newPartColor}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  Beschreibung
                </label>
                <textarea
                  rows={2}
                  placeholder="Kurze Modulbeschreibung..."
                  value={newPartDescription}
                  onChange={(e) => setNewPartDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded transition-colors"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

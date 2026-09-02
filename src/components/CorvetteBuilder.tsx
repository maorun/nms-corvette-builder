"use client";

import { useState, useCallback, useMemo } from "react";
import {
  PARTS as BASE_PARTS,
  PART_CATEGORIES,
  GRID_COLS,
  GRID_ROWS,
  GRID_LAYERS,
  PlacedPart,
  PartDefinition,
  PartCategory,
  Rotation,
} from "@/lib/corvetteData";

const CUSTOM_PARTS_STORAGE_KEY = "nms_corvette_custom_parts";

let instanceCounter = 0;
function newInstanceId() {
  return `inst-${++instanceCounter}`;
}

function rotatedDimensions(
  w: number,
  h: number,
  rotation: Rotation
): { w: number; h: number } {
  if (rotation === 90 || rotation === 270) return { w: h, h: w };
  return { w, h };
}

function cellsOccupied(p: PlacedPart, def: PartDefinition): string[] {
  const { w, h } = rotatedDimensions(def.w, def.h, p.rotation);
  const cells: string[] = [];
  for (let r = p.row; r < p.row + h; r++) {
    for (let c = p.col; c < p.col + w; c++) {
      cells.push(`${c},${r}`);
    }
  }
  return cells;
}

function canPlace(
  parts: PlacedPart[],
  allParts: PartDefinition[],
  partDef: PartDefinition,
  col: number,
  row: number,
  layer: number,
  rotation: Rotation,
  excludeInstanceId?: string
): boolean {
  const { w, h } = rotatedDimensions(partDef.w, partDef.h, rotation);
  if (col + w > GRID_COLS || row + h > GRID_ROWS) return false;

  const occupied = new Set<string>();
  for (const p of parts) {
    if (p.instanceId === excludeInstanceId) continue;
    if (p.layer !== layer) continue;
    const def = allParts.find((d) => d.id === p.partId);
    if (!def) continue;
    for (const cell of cellsOccupied(p, def)) occupied.add(cell);
  }
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (occupied.has(`${c},${r}`)) return false;
    }
  }
  return true;
}
const EMPTY_PART_SET = new Set<string>();

const LAYER_LABELS = [
  "Ebene 1 (Unterste)",
  "Ebene 2",
  "Ebene 3",
  "Ebene 4",
  "Ebene 5",
  "Ebene 6 (Oberst)",
];

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
  const [currentLayer, setCurrentLayer] = useState(0);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedRotation, setSelectedRotation] = useState<Rotation>(0);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  );
  const [tooltip, setTooltip] = useState<string | null>(null);

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
    if (selectedPartId === partId) setSelectedPartId(null);
  };

  const countByPartId = useCallback(
    (partId: string) =>
      placedParts.filter((p) => p.partId === partId).length,
    [placedParts]
  );

  const countByLimitKey = useCallback(
    (partDef: PartDefinition) => {
      if (!partDef.countGroup) return countByPartId(partDef.id);
      const partSet = groupedPartIds[partDef.countGroup] ?? EMPTY_PART_SET;
      return placedParts.filter((p) => {
        return partSet.has(p.partId);
      }).length;
    },
    [placedParts, countByPartId, groupedPartIds]
  );

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

      // Check if clicking on an existing part on the current layer
      for (const p of placedParts) {
        if (p.layer !== currentLayer) continue;
        const def = allParts.find((d) => d.id === p.partId);
        if (def) {
          const cells = cellsOccupied(p, def);
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
    (instanceId: string) => {
      setPlacedParts((prev) =>
        prev.map((p) => {
          if (p.instanceId !== instanceId) return p;
          const def = allParts.find((d) => d.id === p.partId);
          if (!def) return p;
          const nextRotation = ((p.rotation + 90) % 360) as Rotation;
          if (
            canPlace(
              prev,
              allParts,
              def,
              p.col,
              p.row,
              p.layer,
              nextRotation,
              instanceId
            )
          ) {
            return { ...p, rotation: nextRotation };
          }
          return p;
        })
      );
    },
    [allParts]
  );

  const removePart = useCallback((instanceId: string) => {
    setPlacedParts((prev) =>
      prev.filter((p) => p.instanceId !== instanceId)
    );
    setSelectedInstanceId(null);
  }, []);

  const clearAll = useCallback(() => {
    setPlacedParts([]);
    setSelectedPartId(null);
    setSelectedInstanceId(null);
  }, []);

  // Build cell map for current layer only
  const cellMap: Record<string, PlacedPart> = {};
  for (const p of placedParts) {
    if (p.layer !== currentLayer) continue;
    const def = allParts.find((d) => d.id === p.partId);
    if (!def) continue;
    for (const cell of cellsOccupied(p, def)) {
      cellMap[cell] = p;
    }
  }

  // Cells that are occupied on OTHER layers (for visual hint)
  const otherLayersCells = new Set<string>();
  for (const p of placedParts) {
    if (p.layer === currentLayer) continue;
    const def = allParts.find((d) => d.id === p.partId);
    if (!def) continue;
    for (const cell of cellsOccupied(p, def)) {
      otherLayersCells.add(cell);
    }
  }

  // Filter parts based on search query
  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allParts;
    return allParts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [allParts, searchQuery]);

  const categories = useMemo(() => {
    return Array.from(new Set(filteredParts.map((p) => p.category)));
  }, [filteredParts]);

  const selectedInstance = selectedInstanceId
    ? placedParts.find((p) => p.instanceId === selectedInstanceId)
    : null;

  const partsOnLayer = (layer: number) =>
    placedParts.filter((p) => p.layer === layer).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-yellow-500/30 px-4 py-3 flex items-center justify-between">
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
        <button
          onClick={clearAll}
          className="text-xs bg-red-900/50 hover:bg-red-700/60 text-red-300 border border-red-700/50 px-3 py-1.5 rounded transition-colors"
        >
          Alles löschen
        </button>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4 overflow-auto">
        {/* Parts Panel */}
        <aside className="lg:w-64 flex-shrink-0 space-y-3">
          {/* Rotation selector */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Platzierungs-Rotation
            </p>
            <div className="grid grid-cols-4 gap-1">
              {([0, 90, 180, 270] as Rotation[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRotation(r)}
                  className={`text-xs py-1.5 rounded border transition-colors ${
                    selectedRotation === r
                      ? "bg-yellow-500 text-gray-900 border-yellow-400 font-bold"
                      : "bg-gray-800 text-gray-300 border-gray-600 hover:border-yellow-500/50"
                  }`}
                >
                  {r}°
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
                    {cat}
                  </p>
                  {filteredParts
                    .filter((p) => p.category === cat)
                    .map((part) => {
                      const count = countByLimitKey(part);
                      const maxReached = count >= part.maxCount;
                      const isSelected = selectedPartId === part.id;
                      const isCustom = part.id.startsWith("custom-");

                      return (
                        <div
                          key={part.id}
                          className="group relative flex items-center mb-1"
                        >
                          <button
                            disabled={maxReached}
                            onClick={() => {
                              setSelectedPartId(isSelected ? null : part.id);
                              setSelectedInstanceId(null);
                            }}
                            onMouseEnter={() => setTooltip(part.description)}
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
                              <span className="truncate">{part.name}</span>
                              {isCustom && (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1 rounded flex-shrink-0">
                                  User
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
                      {def.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      Rotation: {selectedInstance.rotation}°
                    </span>
                    <span className="text-xs text-gray-400">
                      Pos: ({selectedInstance.col},{selectedInstance.row})
                    </span>
                    <span className="text-xs text-blue-400">
                      Ebene: {LAYER_LABELS[selectedInstance.layer]}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => rotatePart(selectedInstance.instanceId)}
                        className="text-xs bg-blue-900/50 hover:bg-blue-700/60 text-blue-300 border border-blue-700/50 px-3 py-1 rounded transition-colors"
                      >
                        ↻ Drehen (+90°)
                      </button>
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
                ? `Bauteil auswählen und auf das Gitter klicken zum Platzieren. Rotation: ${selectedRotation}°`
                : "Wähle ein Bauteil aus der Liste oder klicke ein platziertes Bauteil an."}
            </div>
          )}

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
                  className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-t text-xs font-semibold border-b-2 transition-colors ${
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
          <div className="bg-gray-900 border border-gray-700 rounded-lg rounded-tl-none p-4 overflow-auto flex-1">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
              {LAYER_LABELS[currentLayer]} – Bau-Gitter ({GRID_COLS}×
              {GRID_ROWS})
            </p>
            <p className="text-[11px] text-gray-600 mb-3 -mt-2">
              Strukturelle Korvetten-Baumodule
            </p>
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(52px, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 52px)`,
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
                      const { w, h } = rotatedDimensions(
                        pDef.w,
                        pDef.h,
                        selectedRotation
                      );
                      if (
                        col + w <= GRID_COLS &&
                        row + h <= GRID_ROWS &&
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
                            {def.name}
                          </span>
                          {placed!.rotation !== 0 && (
                            <span className="text-[9px] opacity-70">
                              {placed!.rotation}°
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
                      {def.name} ×{count}
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
                        {cat}
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
                    max={10}
                    value={newPartW}
                    onChange={(e) => setNewPartW(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    Höhe (Zellen)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
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

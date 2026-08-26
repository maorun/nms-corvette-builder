"use client";

import { useState, useCallback } from "react";
import {
  PARTS,
  GRID_COLS,
  GRID_ROWS,
  PlacedPart,
  PartDefinition,
  Rotation,
} from "@/lib/corvetteData";

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
  partDef: PartDefinition,
  col: number,
  row: number,
  rotation: Rotation,
  excludeInstanceId?: string
): boolean {
  const { w, h } = rotatedDimensions(partDef.w, partDef.h, rotation);
  if (col + w > GRID_COLS || row + h > GRID_ROWS) return false;

  const occupied = new Set<string>();
  for (const p of parts) {
    if (p.instanceId === excludeInstanceId) continue;
    const def = PARTS.find((d) => d.id === p.partId)!;
    for (const cell of cellsOccupied(p, def)) occupied.add(cell);
  }
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (occupied.has(`${c},${r}`)) return false;
    }
  }
  return true;
}

export default function CorvetteBuilder() {
  const [placedParts, setPlacedParts] = useState<PlacedPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedRotation, setSelectedRotation] = useState<Rotation>(0);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  );
  const [tooltip, setTooltip] = useState<string | null>(null);

  const countByPartId = useCallback(
    (partId: string) =>
      placedParts.filter((p) => p.partId === partId).length,
    [placedParts]
  );

  const handleCellClick = useCallback(
    (col: number, row: number) => {
      // If an instance is selected, move it
      if (selectedInstanceId) {
        const inst = placedParts.find(
          (p) => p.instanceId === selectedInstanceId
        );
        if (!inst) return;
        const def = PARTS.find((d) => d.id === inst.partId)!;
        if (
          canPlace(placedParts, def, col, row, inst.rotation, selectedInstanceId)
        ) {
          setPlacedParts((prev) =>
            prev.map((p) =>
              p.instanceId === selectedInstanceId
                ? { ...p, col, row }
                : p
            )
          );
        }
        setSelectedInstanceId(null);
        return;
      }

      // Check if clicking on an existing part
      for (const p of placedParts) {
        const def = PARTS.find((d) => d.id === p.partId)!;
        const cells = cellsOccupied(p, def);
        if (cells.includes(`${col},${row}`)) {
          setSelectedInstanceId(p.instanceId);
          setSelectedPartId(null);
          return;
        }
      }

      // Place new part
      if (!selectedPartId) return;
      const def = PARTS.find((d) => d.id === selectedPartId)!;
      if (countByPartId(selectedPartId) >= def.maxCount) return;
      if (!canPlace(placedParts, def, col, row, selectedRotation)) return;

      setPlacedParts((prev) => [
        ...prev,
        {
          instanceId: newInstanceId(),
          partId: selectedPartId,
          col,
          row,
          rotation: selectedRotation,
        },
      ]);
    },
    [placedParts, selectedPartId, selectedRotation, selectedInstanceId, countByPartId]
  );

  const rotatePart = useCallback(
    (instanceId: string) => {
      setPlacedParts((prev) =>
        prev.map((p) => {
          if (p.instanceId !== instanceId) return p;
          const def = PARTS.find((d) => d.id === p.partId)!;
          const nextRotation = ((p.rotation + 90) % 360) as Rotation;
          if (canPlace(prev, def, p.col, p.row, nextRotation, instanceId)) {
            return { ...p, rotation: nextRotation };
          }
          return p;
        })
      );
    },
    []
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

  // Build cell map
  const cellMap: Record<string, PlacedPart> = {};
  for (const p of placedParts) {
    const def = PARTS.find((d) => d.id === p.partId)!;
    for (const cell of cellsOccupied(p, def)) {
      cellMap[cell] = p;
    }
  }

  // Group parts by category
  const categories = Array.from(new Set(PARTS.map((p) => p.category)));

  const selectedInstance = selectedInstanceId
    ? placedParts.find((p) => p.instanceId === selectedInstanceId)
    : null;

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
            <p className="text-gray-400 text-xs">No Man&apos;s Sky – Offline Korvetten-Baumeister</p>
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

          {/* Parts list */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Bauteile
            </p>
            {categories.map((cat) => (
              <div key={cat} className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  {cat}
                </p>
                {PARTS.filter((p) => p.category === cat).map((part) => {
                  const count = countByPartId(part.id);
                  const maxReached = count >= part.maxCount;
                  const isSelected = selectedPartId === part.id;
                  return (
                    <button
                      key={part.id}
                      disabled={maxReached}
                      onClick={() => {
                        setSelectedPartId(isSelected ? null : part.id);
                        setSelectedInstanceId(null);
                      }}
                      onMouseEnter={() => setTooltip(part.description)}
                      onMouseLeave={() => setTooltip(null)}
                      className={`w-full text-left px-2 py-1.5 rounded mb-1 text-xs border transition-all ${
                        maxReached
                          ? "opacity-40 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-500"
                          : isSelected
                          ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 font-semibold"
                          : "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500"
                      }`}
                      style={isSelected ? { borderColor: part.color } : {}}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-sm mr-1.5"
                        style={{ backgroundColor: part.color }}
                      />
                      {part.name}
                      <span className="float-right text-gray-500">
                        {count}/{part.maxCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
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
                const def = PARTS.find(
                  (d) => d.id === selectedInstance.partId
                )!;
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
                      Pos: ({selectedInstance.col}, {selectedInstance.row})
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

          {/* Grid */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-auto flex-1">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
              Technik-Gitter ({GRID_COLS}×{GRID_ROWS})
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
                    ? PARTS.find((d) => d.id === placed.partId)!
                    : null;
                  const isSelectedInst =
                    placed?.instanceId === selectedInstanceId;

                  // Is this the "origin" cell of the part?
                  const isOrigin =
                    placed?.col === col && placed?.row === row;

                  // Preview highlight
                  let previewHighlight = false;
                  if (selectedPartId && !selectedInstanceId && !placed) {
                    const pDef = PARTS.find((d) => d.id === selectedPartId)!;
                    const { w, h } = rotatedDimensions(
                      pDef.w,
                      pDef.h,
                      selectedRotation
                    );
                    // Check if this cell is within a potential placement starting
                    // at itself (simple: highlight if empty and valid origin)
                    if (
                      col + w <= GRID_COLS &&
                      row + h <= GRID_ROWS &&
                      canPlace(placedParts, pDef, col, row, selectedRotation)
                    ) {
                      previewHighlight = true;
                    }
                  }

                  return (
                    <div
                      key={key}
                      onClick={() => handleCellClick(col, row)}
                      className={`relative border rounded cursor-pointer transition-all flex items-center justify-center text-xs font-bold select-none
                        ${
                          placed
                            ? isSelectedInst
                              ? "border-yellow-400 ring-2 ring-yellow-400/60"
                              : "border-transparent"
                            : previewHighlight
                            ? "border-yellow-500/60 bg-yellow-500/10"
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
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Platzierte Bauteile ({placedParts.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {placedParts.length === 0 && (
                <span className="text-xs text-gray-600">Noch keine Bauteile platziert.</span>
              )}
              {Array.from(new Set(placedParts.map((p) => p.partId))).map(
                (pid) => {
                  const def = PARTS.find((d) => d.id === pid)!;
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
    </div>
  );
}

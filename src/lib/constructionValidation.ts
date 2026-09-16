import {
  GRID_COLS,
  GRID_LAYERS,
  GRID_ROWS,
  PartDefinition,
  PlacedInteriorPart,
  PlacedPart,
  Rotation,
} from "@/lib/corvetteData";

export type ValidationSeverity = "error" | "warning";

export interface ConstructionValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
}

function rotatedDimensions(w: number, h: number, rotation: Rotation): { w: number; h: number } {
  return rotation === 90 || rotation === 270 ? { w: h, h: w } : { w, h };
}

function cellKey(col: number, row: number, layer: number): string {
  return `${col}:${row}:${layer}`;
}

function occupiedCells(part: PlacedPart, definition: PartDefinition): string[] {
  const { w, h } = rotatedDimensions(definition.w, definition.h, part.rotation);
  const cells: string[] = [];
  for (let row = part.row; row < part.row + h; row++) {
    for (let col = part.col; col < part.col + w; col++) {
      cells.push(cellKey(col, row, part.layer));
    }
  }
  return cells;
}

/**
 * Checks basic structural plausibility only. It intentionally warns instead of
 * blocking unconventional but valid player designs.
 */
export function validateConstruction(
  placedParts: PlacedPart[],
  interiorParts: PlacedInteriorPart[],
  definitions: PartDefinition[]
): ConstructionValidationIssue[] {
  const issues: ConstructionValidationIssue[] = [];
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  const cockpitParts = placedParts.filter((part) => definitionsById.get(part.partId)?.category === "Cockpit");
  const landingGear = placedParts.filter((part) => definitionsById.get(part.partId)?.category === "Landing Gear");
  const landingBays = placedParts.filter((part) => definitionsById.get(part.partId)?.category === "Landing Bay");
  const habitationModules = placedParts.filter((part) => definitionsById.get(part.partId)?.category === "Hab");
  const propulsionParts = placedParts.filter((part) => {
    const category = definitionsById.get(part.partId)?.category;
    return category === "Nacelle" || category === "Thruster";
  });

  if (placedParts.length > 0 && cockpitParts.length === 0) {
    issues.push({
      id: "missing-cockpit",
      severity: "error",
      title: "Kein Cockpit",
      message: "Platziere mindestens ein Cockpit, damit die Korvette einen Kommandobereich besitzt.",
    });
  }

  if (placedParts.length > 0 && habitationModules.length === 0) {
    issues.push({
      id: "missing-hab",
      severity: "error",
      title: "Kein Wohnmodul",
      message: "Platziere mindestens ein Hab, damit die Korvette über einen nutzbaren Wohn- und Innenraumbereich verfügt.",
    });
  }

  if (placedParts.length > 0 && propulsionParts.length === 0) {
    issues.push({
      id: "missing-propulsion",
      severity: "error",
      title: "Kein Antrieb",
      message: "Platziere mindestens eine Gondel oder ein Triebwerk, damit die Korvette manövrierfähig ist.",
    });
  }

  if (placedParts.length > 0 && landingBays.length === 0) {
    issues.push({
      id: "missing-landing-bay",
      severity: "error",
      title: "Keine Landebucht",
      message: "Platziere mindestens eine Landebucht, damit die Korvette landen und angedockt werden kann.",
    });
  }

  if (placedParts.length > 0 && landingGear.length === 0) {
    issues.push({
      id: "missing-landing-gear",
      severity: "warning",
      title: "Kein Fahrwerk",
      message: "Ohne Fahrwerk ist die Landefähigkeit des Entwurfs nicht sichergestellt.",
    });
  }

  const hostIds = new Set(placedParts.filter((part) => definitionsById.get(part.partId)?.category === "Hab").map((part) => part.instanceId));
  const orphanedInterior = interiorParts.filter((part) => !hostIds.has(part.parentInstanceId));
  if (orphanedInterior.length > 0) {
    issues.push({
      id: "orphaned-interior",
      severity: "error",
      title: "Innenraum ohne Hab",
      message: `${orphanedInterior.length} Innenraumteil(e) sind keinem vorhandenen Hab zugeordnet.`,
    });
  }

  if (cockpitParts.length === 0 || placedParts.length === 0) return issues;

  const ownerByCell = new Map<string, string>();
  const cellsByPart = new Map<string, string[]>();
  for (const part of placedParts) {
    const definition = definitionsById.get(part.partId);
    if (!definition) continue;
    const cells = occupiedCells(part, definition);
    cellsByPart.set(part.instanceId, cells);
    for (const cell of cells) ownerByCell.set(cell, part.instanceId);
  }

  const visitedParts = new Set<string>(cockpitParts.map((part) => part.instanceId));
  const queue = [...cockpitParts.flatMap((part) => cellsByPart.get(part.instanceId) ?? [])];
  const visitedCells = new Set(queue);
  const directions = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const [col, row, layer] = current.split(":").map(Number);
    for (const [dCol, dRow, dLayer] of directions) {
      const nextCol = col + dCol;
      const nextRow = row + dRow;
      const nextLayer = layer + dLayer;
      if (nextCol < 0 || nextCol >= GRID_COLS || nextRow < 0 || nextRow >= GRID_ROWS || nextLayer < 0 || nextLayer >= GRID_LAYERS) continue;
      const nextCell = cellKey(nextCol, nextRow, nextLayer);
      const owner = ownerByCell.get(nextCell);
      if (!owner || visitedCells.has(nextCell)) continue;
      visitedCells.add(nextCell);
      visitedParts.add(owner);
      for (const ownerCell of cellsByPart.get(owner) ?? []) {
        if (!visitedCells.has(ownerCell)) {
          visitedCells.add(ownerCell);
          queue.push(ownerCell);
        }
      }
    }
  }

  const disconnected = placedParts.filter((part) => !visitedParts.has(part.instanceId));
  if (disconnected.length > 0) {
    const labels = disconnected
      .slice(0, 3)
      .map((part) => definitionsById.get(part.partId)?.name ?? part.partId)
      .join(", ");
    issues.push({
      id: "disconnected-parts",
      severity: "warning",
      title: "Nicht verbundene Bauteile",
      message: `${disconnected.length} Teil(e) sind nicht über Rasterflächen mit einem Cockpit verbunden: ${labels}${disconnected.length > 3 ? " …" : ""}.`,
    });
  }

  return issues;
}

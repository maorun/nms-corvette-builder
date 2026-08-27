export type PartCategory =
  | "Weapons"
  | "Shields"
  | "Engines"
  | "Power"
  | "Hyperdrive"
  | "Scanning"
  | "Utility";

export interface PartDefinition {
  id: string;
  name: string;
  category: PartCategory;
  /** Maximum number of times this module can be built */
  maxCount: number;
  /** Width in grid cells */
  w: number;
  /** Height in grid cells */
  h: number;
  color: string;
  description: string;
}

export const GRID_COLS = 10;
export const GRID_ROWS = 6;
export const GRID_LAYERS = 6;

export const PARTS: PartDefinition[] = [
  // Weapons
  {
    id: "photon-cannon",
    name: "Photon Cannon",
    category: "Weapons",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#a855f7",
    description: "Standard starship weapon system.",
  },
  {
    id: "infraknife-accelerator",
    name: "Infra-Knife Accelerator",
    category: "Weapons",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#eab308",
    description: "Rapid-fire projectile weapon module.",
  },
  {
    id: "positron-ejector",
    name: "Positron Ejector",
    category: "Weapons",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#ef4444",
    description: "Close-range scatter weapon.",
  },
  {
    id: "cyclotron-ballista",
    name: "Cyclotron Ballista",
    category: "Weapons",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#f97316",
    description: "Heavy projectile system for disabling targets.",
  },
  {
    id: "phase-beam",
    name: "Phase Beam",
    category: "Weapons",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#06b6d4",
    description: "Beam weapon that can siphon shield energy.",
  },
  {
    id: "rocket-launcher",
    name: "Rocket Launcher",
    category: "Weapons",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#dc2626",
    description: "High-damage burst weapon for starships.",
  },
  // Shields
  {
    id: "deflector-shield",
    name: "Deflector Shield",
    category: "Shields",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#3b82f6",
    description: "Core defensive shield technology.",
  },
  {
    id: "shield-module-s",
    name: "Shield Upgrade Module (S)",
    category: "Shields",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#2563eb",
    description: "Procedural shield enhancement module.",
  },
  // Engines
  {
    id: "pulse-engine",
    name: "Pulse Engine",
    category: "Engines",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#22c55e",
    description: "Main sub-light propulsion system.",
  },
  {
    id: "launch-thruster",
    name: "Launch Thruster",
    category: "Engines",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#16a34a",
    description: "Enables planetary launch and landing cycles.",
  },
  {
    id: "launch-system-recharger",
    name: "Launch System Recharger",
    category: "Engines",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#15803d",
    description: "Automatically recharges launch thrusters over time.",
  },
  // Power
  {
    id: "starship-shield-battery",
    name: "Starship Shield Battery",
    category: "Power",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#8b5cf6",
    description: "Emergency power reserve for shield recovery.",
  },
  {
    id: "starship-weapon-battery",
    name: "Starship Weapon Battery",
    category: "Power",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#7c3aed",
    description: "Emergency power reserve for weapon systems.",
  },
  // Hyperdrive
  {
    id: "hyperdrive",
    name: "Hyperdrive",
    category: "Hyperdrive",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#8b5cf6",
    description: "Core warp travel drive.",
  },
  {
    id: "cadmium-drive",
    name: "Cadmium Drive",
    category: "Hyperdrive",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#7c3aed",
    description: "Allows travel to red stellar systems.",
  },
  {
    id: "emeril-drive",
    name: "Emeril Drive",
    category: "Hyperdrive",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#6d28d9",
    description: "Allows travel to green stellar systems.",
  },
  {
    id: "indium-drive",
    name: "Indium Drive",
    category: "Hyperdrive",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#5b21b6",
    description: "Allows travel to blue stellar systems.",
  },
  // Scanning
  {
    id: "economy-scanner",
    name: "Economy Scanner",
    category: "Scanning",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#0d9488",
    description: "Displays economic data for nearby systems.",
  },
  {
    id: "conflict-scanner",
    name: "Conflict Scanner",
    category: "Scanning",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#0891b2",
    description: "Displays conflict level data for nearby systems.",
  },
  {
    id: "long-range-scanner",
    name: "Long Range Scanner",
    category: "Scanning",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#14b8a6",
    description: "Improves pulse scan coverage and range.",
  },
  // Utility
  {
    id: "teleport-receiver",
    name: "Teleport Receiver",
    category: "Utility",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#f97316",
    description: "Allows remote transfer of items to your starship.",
  },
  {
    id: "cargo-scan-deflector",
    name: "Cargo Scan Deflector",
    category: "Utility",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#ea580c",
    description: "Reduces chance of successful contraband scans.",
  },
  {
    id: "matter-beam",
    name: "Matter Beam",
    category: "Utility",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#fb923c",
    description: "Provides long-range cargo access from freighter systems.",
  },
];

export type Rotation = 0 | 90 | 180 | 270;

export interface PlacedPart {
  instanceId: string;
  partId: string;
  col: number;
  row: number;
  /** Vertical layer (0 = bottom, GRID_LAYERS-1 = top) */
  layer: number;
  rotation: Rotation;
}

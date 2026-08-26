export type PartCategory =
  | "Weapons"
  | "Shields"
  | "Engines"
  | "Hyperdrive"
  | "Scanning"
  | "Mining"
  | "Utility";

export interface PartDefinition {
  id: string;
  name: string;
  category: PartCategory;
  /** Maximum number of times this part can be installed */
  maxCount: number;
  /** Width in grid cells */
  w: number;
  /** Height in grid cells */
  h: number;
  color: string;
  description: string;
}

export const GRID_COLS = 8;
export const GRID_ROWS = 6;
export const GRID_LAYERS = 3;

export const PARTS: PartDefinition[] = [
  // Weapons
  {
    id: "positron-ejector",
    name: "Positron Ejector",
    category: "Weapons",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#ef4444",
    description: "Rapid-fire scatter weapon, effective at close range.",
  },
  {
    id: "cyclotron-ballista",
    name: "Cyclotron Ballista",
    category: "Weapons",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#f97316",
    description: "High-damage projectile weapon.",
  },
  {
    id: "infraknife-accelerator",
    name: "Infraknife Accelerator",
    category: "Weapons",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#eab308",
    description: "Fires a burst of high-velocity rounds.",
  },
  {
    id: "photon-cannon",
    name: "Photon Cannon",
    category: "Weapons",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#a855f7",
    description: "Standard energy cannon, reliable and accurate.",
  },
  {
    id: "phase-beam",
    name: "Phase Beam",
    category: "Weapons",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#06b6d4",
    description: "Transfers shield energy to the enemy.",
  },
  // Shields
  {
    id: "deflector-shield",
    name: "Deflector Shield",
    category: "Shields",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#3b82f6",
    description: "Increases shield strength.",
  },
  {
    id: "shield-module",
    name: "Shield Module",
    category: "Shields",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#6366f1",
    description: "Additional shield recharge module.",
  },
  // Engines
  {
    id: "pulse-engine",
    name: "Pulse Engine",
    category: "Engines",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#22c55e",
    description: "Boosts sub-light speed and maneuverability.",
  },
  {
    id: "launch-thruster",
    name: "Launch Thruster",
    category: "Engines",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#16a34a",
    description: "Reduces launch fuel consumption.",
  },
  // Hyperdrive
  {
    id: "hyperdrive",
    name: "Hyperdrive",
    category: "Hyperdrive",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#8b5cf6",
    description: "Enables faster-than-light travel between star systems.",
  },
  {
    id: "cadmium-drive",
    name: "Cadmium Drive",
    category: "Hyperdrive",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#7c3aed",
    description: "Allows travel to red-star systems.",
  },
  {
    id: "emeril-drive",
    name: "Emeril Drive",
    category: "Hyperdrive",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#6d28d9",
    description: "Allows travel to green-star systems.",
  },
  {
    id: "indium-drive",
    name: "Indium Drive",
    category: "Hyperdrive",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#5b21b6",
    description: "Allows travel to blue-star systems.",
  },
  // Scanning
  {
    id: "combat-scanner",
    name: "Combat Scanner",
    category: "Scanning",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#14b8a6",
    description: "Identifies enemy weaknesses.",
  },
  {
    id: "long-range-scanner",
    name: "Long Range Scanner",
    category: "Scanning",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#0d9488",
    description: "Extends scanner range significantly.",
  },
  // Mining
  {
    id: "mining-laser",
    name: "Mining Laser",
    category: "Mining",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#f59e0b",
    description: "Extracts resources from asteroids.",
  },
  // Utility
  {
    id: "cargo-pod",
    name: "Cargo Pod",
    category: "Utility",
    maxCount: 4,
    w: 1,
    h: 1,
    color: "#78716c",
    description: "Increases cargo capacity.",
  },
  {
    id: "economy-scanner",
    name: "Economy Scanner",
    category: "Utility",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#d97706",
    description: "Scans trade economies in nearby systems.",
  },
  {
    id: "conflict-scanner",
    name: "Conflict Scanner",
    category: "Utility",
    maxCount: 1,
    w: 1,
    h: 1,
    color: "#dc2626",
    description: "Detects conflict levels in nearby systems.",
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

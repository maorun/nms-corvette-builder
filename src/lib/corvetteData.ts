export type PartCategory =
  | "Cockpit"
  | "Hab"
  | "Walkway"
  | "Aerofoil"
  | "Wing"
  | "Thruster"
  | "Landing Bay"
  | "Reactor";

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
  // Cockpit
  {
    id: "titan-class-cockpit",
    name: "Titan-Class Cockpit",
    category: "Cockpit",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#f59e0b",
    description: "Corvette cockpit section.",
  },
  {
    id: "ambassador-class-cockpit",
    name: "Ambassador-Class Cockpit",
    category: "Cockpit",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#d97706",
    description: "Corvette cockpit section.",
  },
  {
    id: "thunderbird-class-cockpit",
    name: "Thunderbird-Class Cockpit",
    category: "Cockpit",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#b45309",
    description: "Corvette cockpit section.",
  },
  // Hab
  {
    id: "titan-class-hab",
    name: "Titan-Class Hab",
    category: "Hab",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#0ea5e9",
    description: "Habitation build element.",
  },
  {
    id: "ambassador-class-hab",
    name: "Ambassador-Class Hab",
    category: "Hab",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#0284c7",
    description: "Habitation build element.",
  },
  {
    id: "thunderbird-class-hab",
    name: "Thunderbird-Class Hab",
    category: "Hab",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#0369a1",
    description: "Habitation build element.",
  },
  // Walkway
  {
    id: "titan-class-walkway",
    name: "Titan-Class Walkway",
    category: "Walkway",
    maxCount: 4,
    w: 1,
    h: 2,
    color: "#64748b",
    description: "Walkway connector build element.",
  },
  {
    id: "ambassador-class-walkway",
    name: "Ambassador-Class Walkway",
    category: "Walkway",
    maxCount: 4,
    w: 1,
    h: 2,
    color: "#475569",
    description: "Walkway connector build element.",
  },
  {
    id: "thunderbird-class-walkway",
    name: "Thunderbird-Class Walkway",
    category: "Walkway",
    maxCount: 4,
    w: 1,
    h: 2,
    color: "#334155",
    description: "Walkway connector build element.",
  },
  // Aerofoil
  {
    id: "supercruise-aerofoil",
    name: "Supercruise Aerofoil",
    category: "Aerofoil",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#22c55e",
    description: "Aerofoil hull build element.",
  },
  {
    id: "arcadia-aerofoil",
    name: "Arcadia Aerofoil",
    category: "Aerofoil",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#16a34a",
    description: "Aerofoil hull build element.",
  },
  {
    id: "argonaut-aerofoil",
    name: "Argonaut Aerofoil",
    category: "Aerofoil",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#15803d",
    description: "Aerofoil hull build element.",
  },
  // Wing
  {
    id: "titan-wing-module",
    name: "Titan Wing Module",
    category: "Wing",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#3b82f6",
    description: "Wing build element.",
  },
  {
    id: "ambassador-wing-module",
    name: "Ambassador Wing Module",
    category: "Wing",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#2563eb",
    description: "Wing build element.",
  },
  {
    id: "osprey-wing-module",
    name: "Osprey Wing Module",
    category: "Wing",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#1d4ed8",
    description: "Wing build element.",
  },
  // Thruster
  {
    id: "titan-heavy-booster",
    name: "Titan Heavy Booster",
    category: "Thruster",
    maxCount: 2,
    w: 1,
    h: 2,
    color: "#ef4444",
    description: "Large thruster build element.",
  },
  {
    id: "titan-sublight-thruster",
    name: "Titan Sublight Thruster",
    category: "Thruster",
    maxCount: 2,
    w: 1,
    h: 2,
    color: "#dc2626",
    description: "Sublight thruster build element.",
  },
  {
    id: "ambassador-heavy-booster",
    name: "Ambassador Heavy Booster",
    category: "Thruster",
    maxCount: 2,
    w: 1,
    h: 2,
    color: "#b91c1c",
    description: "Large thruster build element.",
  },
  // Landing Bay
  {
    id: "titan-class-landing-bay",
    name: "Titan-Class Landing Bay",
    category: "Landing Bay",
    maxCount: 2,
    w: 2,
    h: 2,
    color: "#8b5cf6",
    description: "Landing bay build element.",
  },
  {
    id: "ambassador-class-landing-bay",
    name: "Ambassador-Class Landing Bay",
    category: "Landing Bay",
    maxCount: 2,
    w: 2,
    h: 2,
    color: "#7c3aed",
    description: "Landing bay build element.",
  },
  {
    id: "thunderbird-class-landing-bay",
    name: "Thunderbird-Class Landing Bay",
    category: "Landing Bay",
    maxCount: 2,
    w: 2,
    h: 2,
    color: "#6d28d9",
    description: "Landing bay build element.",
  },
  // Reactor
  {
    id: "zenith-class-reactor",
    name: "Zenith-Class Reactor",
    category: "Reactor",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#14b8a6",
    description: "Reactor build element.",
  },
  {
    id: "medusa-class-reactor",
    name: "Medusa-Class Reactor",
    category: "Reactor",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#0d9488",
    description: "Reactor build element.",
  },
  {
    id: "azimuth-class-reactor",
    name: "Azimuth-Class Reactor",
    category: "Reactor",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#0f766e",
    description: "Reactor build element.",
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

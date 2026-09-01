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
  /** Optional shared pool key for variant-exclusive part limits */
  countGroup?: string;
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
    countGroup: "cockpit",
    w: 2,
    h: 1,
    color: "#f59e0b",
    description: "Heavy Titan-series command cockpit module.",
  },
  {
    id: "ambassador-class-cockpit",
    name: "Ambassador-Class Cockpit",
    category: "Cockpit",
    maxCount: 1,
    countGroup: "cockpit",
    w: 2,
    h: 1,
    color: "#d97706",
    description: "Balanced Ambassador-series command cockpit module.",
  },
  {
    id: "thunderbird-class-cockpit",
    name: "Thunderbird-Class Cockpit",
    category: "Cockpit",
    maxCount: 1,
    countGroup: "cockpit",
    w: 2,
    h: 1,
    color: "#b45309",
    description: "Compact Thunderbird-series command cockpit module.",
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
    description: "Titan-series habitation bay segment.",
  },
  {
    id: "ambassador-class-hab",
    name: "Ambassador-Class Hab",
    category: "Hab",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#0284c7",
    description: "Ambassador-series habitation bay segment.",
  },
  {
    id: "thunderbird-class-hab",
    name: "Thunderbird-Class Hab",
    category: "Hab",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#0369a1",
    description: "Thunderbird-series habitation bay segment.",
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
    description: "Titan-series internal connector walkway.",
  },
  {
    id: "ambassador-class-walkway",
    name: "Ambassador-Class Walkway",
    category: "Walkway",
    maxCount: 4,
    w: 1,
    h: 2,
    color: "#475569",
    description: "Ambassador-series internal connector walkway.",
  },
  {
    id: "thunderbird-class-walkway",
    name: "Thunderbird-Class Walkway",
    category: "Walkway",
    maxCount: 4,
    w: 1,
    h: 2,
    color: "#334155",
    description: "Thunderbird-series internal connector walkway.",
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
    description: "Supercruise-pattern aerofoil hull panel.",
  },
  {
    id: "arcadia-aerofoil",
    name: "Arcadia Aerofoil",
    category: "Aerofoil",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#16a34a",
    description: "Arcadia-pattern aerofoil hull panel.",
  },
  {
    id: "argonaut-aerofoil",
    name: "Argonaut Aerofoil",
    category: "Aerofoil",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#15803d",
    description: "Argonaut-pattern aerofoil hull panel.",
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
    description: "Titan-series lateral wing assembly.",
  },
  {
    id: "ambassador-wing-module",
    name: "Ambassador Wing Module",
    category: "Wing",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#2563eb",
    description: "Ambassador-series lateral wing assembly.",
  },
  {
    id: "osprey-wing-module",
    name: "Osprey Wing Module",
    category: "Wing",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#1d4ed8",
    description: "Osprey-series lateral wing assembly.",
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
    description: "Titan-series heavy booster thruster housing.",
  },
  {
    id: "titan-sublight-thruster",
    name: "Titan Sublight Thruster",
    category: "Thruster",
    maxCount: 2,
    w: 1,
    h: 2,
    color: "#dc2626",
    description: "Titan-series sublight propulsion nozzle.",
  },
  {
    id: "ambassador-heavy-booster",
    name: "Ambassador Heavy Booster",
    category: "Thruster",
    maxCount: 2,
    w: 1,
    h: 2,
    color: "#b91c1c",
    description: "Ambassador-series heavy booster thruster housing.",
  },
  // Landing Bay
  {
    id: "titan-class-landing-bay",
    name: "Titan-Class Landing Bay",
    category: "Landing Bay",
    maxCount: 2,
    countGroup: "landing-bay",
    w: 2,
    h: 2,
    color: "#8b5cf6",
    description: "Titan-series landing and docking bay section.",
  },
  {
    id: "ambassador-class-landing-bay",
    name: "Ambassador-Class Landing Bay",
    category: "Landing Bay",
    maxCount: 2,
    countGroup: "landing-bay",
    w: 2,
    h: 2,
    color: "#7c3aed",
    description: "Ambassador-series landing and docking bay section.",
  },
  {
    id: "thunderbird-class-landing-bay",
    name: "Thunderbird-Class Landing Bay",
    category: "Landing Bay",
    maxCount: 2,
    countGroup: "landing-bay",
    w: 2,
    h: 2,
    color: "#6d28d9",
    description: "Thunderbird-series landing and docking bay section.",
  },
  // Reactor
  {
    id: "zenith-class-reactor",
    name: "Zenith-Class Reactor",
    category: "Reactor",
    maxCount: 1,
    countGroup: "reactor",
    w: 2,
    h: 1,
    color: "#14b8a6",
    description: "Zenith-class reactor core section.",
  },
  {
    id: "medusa-class-reactor",
    name: "Medusa-Class Reactor",
    category: "Reactor",
    maxCount: 1,
    countGroup: "reactor",
    w: 2,
    h: 1,
    color: "#0d9488",
    description: "Medusa-class reactor core section.",
  },
  {
    id: "azimuth-class-reactor",
    name: "Azimuth-Class Reactor",
    category: "Reactor",
    maxCount: 1,
    countGroup: "reactor",
    w: 2,
    h: 1,
    color: "#0f766e",
    description: "Azimuth-class reactor core section.",
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

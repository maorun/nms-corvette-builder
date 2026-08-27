export type PartCategory =
  | "Hull"
  | "Bridge"
  | "Engine"
  | "Power"
  | "Support"
  | "Defense"
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
  // Hull
  {
    id: "central-keel",
    name: "Central Keel",
    category: "Hull",
    maxCount: 1,
    w: 3,
    h: 1,
    color: "#64748b",
    description: "Main structural spine of the corvette.",
  },
  {
    id: "port-hull-segment",
    name: "Port Hull Segment",
    category: "Hull",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#475569",
    description: "Outer plating segment for the left side.",
  },
  {
    id: "starboard-hull-segment",
    name: "Starboard Hull Segment",
    category: "Hull",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#334155",
    description: "Outer plating segment for the right side.",
  },
  // Bridge
  {
    id: "command-bridge",
    name: "Command Bridge",
    category: "Bridge",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#f59e0b",
    description: "Primary command and navigation center.",
  },
  {
    id: "sensor-mast",
    name: "Sensor Mast",
    category: "Bridge",
    maxCount: 1,
    w: 1,
    h: 2,
    color: "#fbbf24",
    description: "Extended sensor stack for detection and recon.",
  },
  // Engine
  {
    id: "primary-thruster-bank",
    name: "Primary Thruster Bank",
    category: "Engine",
    maxCount: 2,
    w: 2,
    h: 1,
    color: "#22c55e",
    description: "Main propulsion array for sustained thrust.",
  },
  {
    id: "maneuvering-thruster",
    name: "Maneuvering Thruster",
    category: "Engine",
    maxCount: 4,
    w: 1,
    h: 1,
    color: "#16a34a",
    description: "Provides directional control and turning force.",
  },
  // Power
  {
    id: "reactor-core",
    name: "Reactor Core",
    category: "Power",
    maxCount: 1,
    w: 2,
    h: 1,
    color: "#8b5cf6",
    description: "Primary energy source for all ship systems.",
  },
  {
    id: "power-distributor",
    name: "Power Distributor",
    category: "Power",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#7c3aed",
    description: "Balances and routes reactor output to subsystems.",
  },
  // Support
  {
    id: "cargo-bay",
    name: "Cargo Bay",
    category: "Support",
    maxCount: 4,
    w: 2,
    h: 1,
    color: "#0ea5e9",
    description: "Modular hold for resources and mission freight.",
  },
  {
    id: "crew-quarters",
    name: "Crew Quarters",
    category: "Support",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#0284c7",
    description: "Living module for crew accommodation.",
  },
  // Defense
  {
    id: "shield-emitter",
    name: "Shield Emitter",
    category: "Defense",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#3b82f6",
    description: "Projects local defensive shielding around the hull.",
  },
  {
    id: "point-defense-turret",
    name: "Point Defense Turret",
    category: "Defense",
    maxCount: 4,
    w: 1,
    h: 1,
    color: "#1d4ed8",
    description: "Automated anti-fighter and missile interception.",
  },
  // Utility
  {
    id: "docking-clamp",
    name: "Docking Clamp",
    category: "Utility",
    maxCount: 2,
    w: 1,
    h: 2,
    color: "#f97316",
    description: "External docking latch for shuttles and drones.",
  },
  {
    id: "maintenance-access",
    name: "Maintenance Access",
    category: "Utility",
    maxCount: 2,
    w: 1,
    h: 1,
    color: "#ea580c",
    description: "Service hatch for repairs and internal routing.",
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

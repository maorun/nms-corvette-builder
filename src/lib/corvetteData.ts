export type PartCategory =
  | "Weapon"
  | "Engine"
  | "Reactor"
  | "Landing"
  | "Habitation"
  | "Cockpit"
  | "Shield";

export interface PartDefinition {
  id: string;
  name: string;
  category: PartCategory;
  maxCount: number;
  w: number;
  h: number;
  color: string;
  description: string;
}

export const GRID_COLS = 10;
export const GRID_ROWS = 6;
export const GRID_LAYERS = 6;

export const PARTS: PartDefinition[] = [
  // Weapon
  {
    id: "photon-cannon-array",
    name: "Photon Cannon array",
    category: "Weapon",
    maxCount: 2,
    w: 2,
    h: 2,
    color: "#ef4444",
    description: "Waffensystem — Kampf-Funktion.",
  },
  // Engine
  {
    id: "arcadia-heavy-booster",
    name: "Arcadia Heavy Booster",
    category: "Engine",
    maxCount: 2,
    w: 2,
    h: 1,
    color: "#22c55e",
    description: "Main engines — Arcadia Heavy Booster.",
  },
  {
    id: "ambasador-sublight-thruster",
    name: "Ambasador sublight thruster",
    category: "Engine",
    maxCount: 2,
    w: 1,
    h: 1,
    color: "#16a34a",
    description: "Main engines — Ambasador sublight thruster.",
  },
  // Reactor
  {
    id: "zenith-reactor",
    name: "Zenith reactor",
    category: "Reactor",
    maxCount: 3,
    w: 1,
    h: 1,
    color: "#fbbf24",
    description: "Reaktor — Zenith reactor.",
  },
  {
    id: "ceto-class-reactor",
    name: "Ceto-class reactor",
    category: "Reactor",
    maxCount: 3,
    w: 2,
    h: 1,
    color: "#f59e0b",
    description: "Reaktor — Ceto-class reactor.",
  },
  // Landing
  {
    id: "mag-field-landing-thrusters-launch",
    name: "Mag-field landing thrusters (Launch)",
    category: "Landing",
    maxCount: 4,
    w: 1,
    h: 1,
    color: "#9ca3af",
    description: "Landing Gear — Mag-field landing thrusters (Launch).",
  },
  // Habitation
  {
    id: "thunderbird-hab",
    name: "Thunderbird Hab",
    category: "Habitation",
    maxCount: 16,
    w: 1,
    h: 1,
    color: "#34d399",
    description: "Habitation — Thunderbird Hab (+3 cargo).",
  },
  {
    id: "thunderbird-walkway",
    name: "Thunderbird Walkway",
    category: "Habitation",
    maxCount: 12,
    w: 1,
    h: 1,
    color: "#60a5fa",
    description: "Habitation — Thunderbird Walkway (+1 cargo).",
  },
  // Cockpit
  {
    id: "ambassador-cockpit",
    name: "Ambassador Cockpit",
    category: "Cockpit",
    maxCount: 1,
    w: 1,
    h: 2,
    color: "#ed64a6",
    description: "Flight Control — Ambassador Cockpit.",
  },
  {
    id: "titan-cockpit",
    name: "Titan Cockpit",
    category: "Cockpit",
    maxCount: 1,
    w: 1,
    h: 2,
    color: "#a855f7",
    description: "Flight Control — Titan Cockpit.",
  },
  {
    id: "thunderbird-cockpit",
    name: "Thunderbird Cockpit",
    category: "Cockpit",
    maxCount: 1,
    w: 1,
    h: 2,
    color: "#ec4899",
    description: "Flight Control — Thunderbird Cockpit.",
  },
  // Shield
  {
    id: "high-energy-shield",
    name: "High energy shield",
    category: "Shield",
    maxCount: 2,
    w: 1,
    h: 1,
    color: "#3b82f6",
    description: "Shields — High energy shield.",
  },
];

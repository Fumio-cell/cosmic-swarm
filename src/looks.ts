import type { ShapeType } from './App';

// A look sets every swarm setting that App keeps in state (not the image
// voxel settings). Colour shift is a fraction of a turn, as on the slider.
export interface LookSettings {
  shape: Exclude<ShapeType, 'none'>;
  liquidFusion: boolean;
  reactiveness: number;
  zoom: number;
  hueShift: number;
  saturation: number;
  flicker: number;
  particleSize: number;
  rotationSpeed: number;
  chaos: number;
  brightness: number;
  density: number;
}

export interface Look {
  id: string;
  name: string;
  tagline: string;
  settings: LookSettings;
}

export const LOOKS: readonly Look[] = [
  {
    id: 'cell-division',
    name: 'Cell Division',
    tagline: 'Bass splits the swarm like a cell.',
    settings: {
      shape: 'amoeba', liquidFusion: true, reactiveness: 2.6, zoom: 0.1,
      hueShift: 0.0, saturation: 0.3, flicker: 0.6, particleSize: 3.0,
      rotationSpeed: 2.0, chaos: 0.15, brightness: 6.0, density: 0.9,
    },
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    tagline: 'A sphere that beats with the kick.',
    settings: {
      shape: 'sphere', liquidFusion: true, reactiveness: 3.0, zoom: 0.12,
      hueShift: 0.31, saturation: 0.9, flicker: 0.3, particleSize: 1.5,
      rotationSpeed: 0.3, chaos: 0.4, brightness: 3.0, density: 0.6,
    },
  },
  {
    id: 'bioluminescence',
    name: 'Bioluminescence',
    tagline: 'Deep-sea light that flickers with the highs.',
    settings: {
      shape: 'amoeba', liquidFusion: false, reactiveness: 1.2, zoom: 0.15,
      hueShift: 0.03, saturation: 1.0, flicker: 1.0, particleSize: 2.5,
      rotationSpeed: -0.4, chaos: 0.5, brightness: 2.5, density: 0.3,
    },
  },
  {
    id: 'murmuration',
    name: 'Murmuration',
    tagline: 'A flock turning as one.',
    settings: {
      shape: 'galaxy', liquidFusion: false, reactiveness: 1.5, zoom: 0.4,
      hueShift: 0.65, saturation: 0.45, flicker: 0.5, particleSize: 0.8,
      rotationSpeed: 4.0, chaos: 0.5, brightness: 2.0, density: 1.0,
    },
  },
  {
    id: 'ripple',
    name: 'Ripple',
    tagline: 'Rings that spread from every beat.',
    settings: {
      shape: 'torus', liquidFusion: false, reactiveness: 2.0, zoom: 0.25,
      hueShift: 0.29, saturation: 0.9, flicker: 0.4, particleSize: 2.0,
      rotationSpeed: 1.2, chaos: 0.1, brightness: 3.0, density: 0.75,
    },
  },
  {
    id: 'primordial',
    name: 'Primordial',
    tagline: 'Slow matter before the first breath.',
    settings: {
      shape: 'sphere', liquidFusion: true, reactiveness: 0.4, zoom: 0.2,
      hueShift: 0.64, saturation: 0.8, flicker: 0.2, particleSize: 3.0,
      rotationSpeed: 0.2, chaos: 0.85, brightness: 1.0, density: 0.5,
    },
  },
];

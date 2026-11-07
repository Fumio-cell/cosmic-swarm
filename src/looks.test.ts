import { describe, expect, it } from 'vitest';
import { LOOKS, type LookSettings } from './looks';
import hud from './components/ui/OverlayHUD.tsx?raw';

// Read each slider's min and max from the HUD itself, so the test follows
// the real controls rather than a copy of their limits.
const SLIDER_IDS: Record<string, string> = {
  reactiveness: 'param-reactiveness',
  zoom: 'param-zoom',
  hueShift: 'param-hue-shift',
  saturation: 'param-saturation',
  flicker: 'param-flicker',
  particleSize: 'param-particle-size',
  rotationSpeed: 'param-rotation-speed',
  chaos: 'param-chaos',
  brightness: 'param-brightness',
  density: 'param-density',
};
function sliderRange(id: string): [number, number] {
  const m = hud.match(new RegExp(`id="${id}"[\\s\\S]*?min="([-\\d.]+)" max="([-\\d.]+)"`));
  if (!m) throw new Error(`slider ${id} not found`);
  return [parseFloat(m[1]), parseFloat(m[2])];
}

describe('LOOKS', () => {
  it('has the six looks with the agreed ids, names and taglines', () => {
    expect(LOOKS.map((l) => [l.id, l.name, l.tagline])).toEqual([
      ['cell-division', 'Cell Division', 'Bass splits the swarm like a cell.'],
      ['heartbeat', 'Heartbeat', 'A sphere that beats with the kick.'],
      ['bioluminescence', 'Bioluminescence', 'Deep-sea light that flickers with the highs.'],
      ['murmuration', 'Murmuration', 'A flock turning as one.'],
      ['ripple', 'Ripple', 'Rings that spread from every beat.'],
      ['primordial', 'Primordial', 'Slow matter before the first breath.'],
    ]);
  });

  it('keeps every numeric value inside its slider range and never uses "none"', () => {
    for (const look of LOOKS) {
      expect(look.settings.shape as string).not.toBe('none');
      expect(['galaxy', 'sphere', 'torus', 'amoeba']).toContain(look.settings.shape);
      expect(typeof look.settings.liquidFusion).toBe('boolean');
      const numericKeys = Object.keys(look.settings).filter(
        (k) => typeof look.settings[k as keyof LookSettings] === 'number',
      );
      expect(numericKeys.sort()).toEqual(Object.keys(SLIDER_IDS).sort());
      for (const [key, id] of Object.entries(SLIDER_IDS)) {
        const [min, max] = sliderRange(id);
        const v = look.settings[key as keyof LookSettings] as number;
        expect(v, `${look.id}.${key}`).toBeGreaterThanOrEqual(min);
        expect(v, `${look.id}.${key}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it('makes every pair differ in at least 3 of 6 attributes', () => {
    const band = (v: number, lo: number, hi: number) => Math.min(2, Math.floor(((v - lo) / (hi - lo)) * 3));
    const hueDeg = (s: LookSettings) => s.hueShift * 360;
    const hueApart = (a: number, b: number) => {
      const d = Math.abs(a - b) % 360;
      return Math.min(d, 360 - d) >= 40;
    };
    const diff = (a: LookSettings, b: LookSettings) =>
      [
        a.shape !== b.shape,
        hueApart(hueDeg(a), hueDeg(b)),
        band(a.reactiveness, 0, 3) !== band(b.reactiveness, 0, 3),
        band(Math.abs(a.rotationSpeed), 0, 5) !== band(Math.abs(b.rotationSpeed), 0, 5),
        band(a.chaos, 0, 1) !== band(b.chaos, 0, 1),
        band(a.density, 0.01, 1) !== band(b.density, 0.01, 1),
      ].filter(Boolean).length;
    const matrix = LOOKS.map((a) => LOOKS.map((b) => (a === b ? 0 : diff(a.settings, b.settings))));
    console.log(
      ['pairwise differences', ...LOOKS.map((l, i) => `${l.id.padEnd(16)} ${matrix[i].join(' ')}`)].join('\n'),
    );
    for (let i = 0; i < LOOKS.length; i++)
      for (let j = 0; j < LOOKS.length; j++)
        if (i !== j) expect(matrix[i][j], `${LOOKS[i].id} vs ${LOOKS[j].id}`).toBeGreaterThanOrEqual(3);
  });
});

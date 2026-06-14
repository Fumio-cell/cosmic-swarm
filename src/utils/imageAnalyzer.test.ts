import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImagePixels } from './imageAnalyzer';

describe('analyzeImagePixels', () => {
  beforeEach(() => {
    // jsdom doesn't implement Image loading or canvas 2D context, so mock both.
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();

    Object.defineProperty(globalThis.Image.prototype, 'src', {
      set() {
        setTimeout(() => this.onload?.());
      },
    });
  });

  it('returns one entry per pixel with grid coords and RGBA', async () => {
    const resolution = 2;
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, // (0,0) red, opaque
      0, 255, 0, 255, // (1,0) green, opaque
      0, 0, 255, 5,   // (0,1) blue, near-transparent (below threshold)
      255, 255, 255, 255, // (1,1) white, opaque
    ]);

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data })),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    const file = new File([new Uint8Array([1, 2, 3])], 'test.png', { type: 'image/png' });
    const pixels = await analyzeImagePixels(file, resolution);

    expect(pixels).toHaveLength(3);
    expect(pixels[0]).toEqual({ x: 0, y: 0, r: 255, g: 0, b: 0, a: 255 });
    expect(pixels[1]).toEqual({ x: 1, y: 0, r: 0, g: 255, b: 0, a: 255 });
    expect(pixels[2]).toEqual({ x: 1, y: 1, r: 255, g: 255, b: 255, a: 255 });
  });

  it('excludes pixels below the custom alpha threshold', async () => {
    const resolution = 1;
    const data = new Uint8ClampedArray([10, 20, 30, 50]);

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data })),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    const file = new File([new Uint8Array([1])], 'test.png', { type: 'image/png' });

    expect(await analyzeImagePixels(file, resolution, 100)).toHaveLength(0);
    expect(await analyzeImagePixels(file, resolution, 10)).toHaveLength(1);
  });

  it('throws if 2D context is unavailable', async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    const file = new File([new Uint8Array([1])], 'test.png', { type: 'image/png' });
    await expect(analyzeImagePixels(file, 1)).rejects.toThrow('Failed to get 2D canvas context');
  });
});

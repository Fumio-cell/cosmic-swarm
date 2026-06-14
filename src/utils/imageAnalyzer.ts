export interface VoxelPixel {
  x: number; // grid x (0..resolution-1)
  y: number; // grid y (0..resolution-1)
  r: number; // 0..255
  g: number;
  b: number;
  a: number;
}

/**
 * Loads an image file, downsamples it to `resolution`x`resolution` on a
 * hidden canvas, and returns the opaque-enough pixels with grid coords + RGBA.
 */
export async function analyzeImagePixels(
  file: File,
  resolution: number,
  alphaThreshold = 10
): Promise<VoxelPixel[]> {
  const imageBitmap = await loadImage(file);

  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  ctx.drawImage(imageBitmap, 0, 0, resolution, resolution);
  const { data } = ctx.getImageData(0, 0, resolution, resolution);

  const pixels: VoxelPixel[] = [];
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const i = (y * resolution + x) * 4;
      const a = data[i + 3];
      if (a < alphaThreshold) continue;
      pixels.push({ x, y, r: data[i], g: data[i + 1], b: data[i + 2], a });
    }
  }

  return pixels;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

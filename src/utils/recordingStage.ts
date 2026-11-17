import { useSyncExternalStore } from 'react';

/** The size of every recording, whatever the window and the device pixel ratio are. */
export const FRAME_WIDTH = 1920;
export const FRAME_HEIGHT = 1080;

/**
 * True from just before a recording starts until it has ended or been cancelled. While it is true the Scene draws
 * the stage with exactly FRAME_WIDTH x FRAME_HEIGHT pixels (by raising or lowering the pixel ratio of the frame
 * that is on screen), so canvas.captureStream() delivers that size. The Scene reads it with useRecordingFrame().
 */
let active = false;
const listeners = new Set<() => void>();

function setActive(value: boolean) {
  if (active === value) return;
  active = value;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useRecordingFrame(): boolean {
  return useSyncExternalStore(subscribe, () => active);
}

/**
 * Switches the stage to the recording size and resolves once the canvas has it. The stream must not be captured
 * before that: a canvas that changes size in the middle of a capture gives a file whose frames change size.
 */
export async function acquireRecordingFrame(canvas: HTMLCanvasElement, timeoutMs = 3000): Promise<void> {
  setActive(true);
  const started = performance.now();
  let settled = 0;
  while (settled < 3) {
    // Three frames in a row at the right size: the post-processing buffers have followed the canvas by then.
    settled = canvas.width === FRAME_WIDTH && canvas.height === FRAME_HEIGHT ? settled + 1 : 0;
    if (performance.now() - started > timeoutMs) {
      setActive(false);
      throw new Error(`The canvas did not reach ${FRAME_WIDTH}x${FRAME_HEIGHT} (it is ${canvas.width}x${canvas.height}).`);
    }
    await new Promise((r) => setTimeout(r, 20));
  }
}

/** Returns the stage to the size of the window. Safe to call when nothing was acquired. */
export function releaseRecordingFrame(): void {
  setActive(false);
}

import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ParticleSwarm } from './ParticleSwarm';
import { ImageVoxelSwarm } from './ImageVoxelSwarm';
import { GooEffect } from './GooEffect';
import type { ShapeType } from '../../App';
import { FRAME_WIDTH, useRecordingFrame } from '../../utils/recordingStage';

interface SceneProps {
  reactiveness: number;
  zoom: number;
  hueShift: number;
  rotationSpeed: number;
  chaos: number;
  shape: ShapeType;
  brightness: number;
  density: number;
  saturation: number;
  flicker: number;
  particleSize: number;
  liquidFusion: boolean;
  imageFile: File | null;
  voxelResolution: number;
  voxelSpacing: number;
  windStrength: number;
  gatherStrength: number;
}

interface FrameBox { width: number; height: number; left: number; top: number }

/**
 * The largest 16:9 frame that fits in `width` x `height`. Its sides are whole multiples of 16 and 9 so that
 * FRAME_WIDTH / frame.width scales it to the recording size without a rounding error.
 */
function fitFrame(width: number, height: number): FrameBox {
  const k = Math.max(1, Math.floor(Math.min(width / 16, height / 9)));
  const w = 16 * k;
  const h = 9 * k;
  return { width: w, height: h, left: Math.floor((width - w) / 2), top: Math.floor((height - h) / 2) };
}

/**
 * Gives the post-processing composer the new size when only the pixel ratio changed. It resizes its buffers
 * when `size` changes, not when the pixel ratio does, and a recording changes only the pixel ratio.
 */
function PixelRatioSync() {
  const dpr = useThree((s) => s.viewport.dpr);
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { size, setSize } = get();
    setSize(size.width, size.height, size.top, size.left);
  }, [dpr, get]);
  return null;
}

export function Scene({ reactiveness, zoom, hueShift, rotationSpeed, chaos, shape, brightness, density, saturation, flicker, particleSize, liquidFusion, imageFile, voxelResolution, voxelSpacing, windStrength, gatherStrength }: SceneProps) {
  // The stage is always the 16:9 frame that the file will have, centred in the space that is left, so that what
  // is composed on screen is what is recorded. While a recording runs the frame keeps its size, and the canvas gets
  // exactly FRAME_WIDTH x FRAME_HEIGHT pixels from the pixel ratio.
  const holder = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<FrameBox | null>(null);
  const latest = useRef<FrameBox | null>(null);
  const recording = useRecordingFrame();
  const recordingNow = useRef(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      latest.current = fitFrame(el.clientWidth, el.clientHeight);
      if (!recordingNow.current) setFrame(latest.current);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    recordingNow.current = recording;
    if (!recording && latest.current) setFrame(latest.current);
  }, [recording]);

  const recordingDpr = frame ? (FRAME_WIDTH / frame.width) * (1 + 1e-9) : 1;

  return (
    <div className="canvas-container" ref={holder}>
      {frame && (
      <div className="stage-frame" style={{ width: frame.width, height: frame.height, left: frame.left, top: frame.top }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }} dpr={recording ? recordingDpr : [1, 2]}>
        <PixelRatioSync />
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        
        {imageFile ? (
          <ImageVoxelSwarm
            key={imageFile.name + imageFile.lastModified}
            imageFile={imageFile}
            shape={shape}
            zoom={zoom}
            voxelResolution={voxelResolution}
            voxelSpacing={voxelSpacing}
            windStrength={windStrength}
            gatherStrength={gatherStrength}
            reactiveness={reactiveness} hueShift={hueShift} chaos={chaos}
            brightness={brightness} density={density} saturation={saturation}
            flicker={flicker} particleSize={particleSize} liquidFusion={liquidFusion}
          />
        ) : (
          // Using key={shape} forces the particle component to completely remount when shape changes, ensuring clean geometry updates
          <ParticleSwarm
            key={shape}
            reactiveness={reactiveness} zoom={zoom}
            hueShift={hueShift} chaos={chaos} shape={shape}
            brightness={brightness} density={density} saturation={saturation}
            flicker={flicker} particleSize={particleSize}
            liquidFusion={liquidFusion}
          />
        )}

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          autoRotate 
          autoRotateSpeed={rotationSpeed}
          enableZoom={false}
        />
        
        {liquidFusion ? (
          <EffectComposer>
            {/* Bloom runs FIRST to create massive overlapping auras/blurs between particles */}
            <Bloom luminanceThreshold={0.05} luminanceSmoothing={0.9} height={300} intensity={2.0} />
            {/* GooEffect runs AFTER Bloom, thresholding the soft blurred light into solid liquid bridges */}
            <GooEffect />
          </EffectComposer>
        ) : (
          <EffectComposer>
            <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.7} height={480} intensity={1.5} />
          </EffectComposer>
        )}
      </Canvas>
      </div>
      )}
    </div>
  );
}

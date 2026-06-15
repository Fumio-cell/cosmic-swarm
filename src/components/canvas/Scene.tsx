import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ParticleSwarm } from './ParticleSwarm';
import { ImageVoxelSwarm } from './ImageVoxelSwarm';
import { GooEffect } from './GooEffect';
import type { ShapeType } from '../../App';

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

export function Scene({ reactiveness, zoom, hueShift, rotationSpeed, chaos, shape, brightness, density, saturation, flicker, particleSize, liquidFusion, imageFile, voxelResolution, voxelSpacing, windStrength, gatherStrength }: SceneProps) {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
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
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.2} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}

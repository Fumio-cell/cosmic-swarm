import { useState } from 'react';
import { Scene } from './components/canvas/Scene';
import { OverlayHUD } from './components/ui/OverlayHUD';
import { Header } from './components/ui/Header';

export type ShapeType = 'none' | 'galaxy' | 'sphere' | 'torus' | 'amoeba';

function App() {
  const [reactiveness, setReactiveness] = useState(1.0);
  const [zoom, setZoom] = useState(0.5);
  const [hueShift, setHueShift] = useState(0.0);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [chaos, setChaos] = useState(0.0);
  const [shape, setShape] = useState<ShapeType>('galaxy');
  const [brightness, setBrightness] = useState(1.0);
  const [density, setDensity] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  const [flicker, setFlicker] = useState(1.0);
  const [particleSize, setParticleSize] = useState(1.0);
  const [liquidFusion, setLiquidFusion] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [voxelResolution, setVoxelResolution] = useState(64);
  const [voxelSpacing, setVoxelSpacing] = useState(1.5);
  const [windStrength, setWindStrength] = useState(0.4);
  const [gatherStrength, setGatherStrength] = useState(1.0);

  // When an image is loaded, snap all parameters to the voxel preset so the
  // viewer immediately gets the "molecules about to break apart" look.
  function handleImageLoad(file: File | null) {
    setImageFile(file);
    if (!file) return;
    setVoxelResolution(160);
    setVoxelSpacing(0.5);
    setWindStrength(0.0);
    setGatherStrength(1.0);
    setZoom(0.32);
    setShape('none');
    setLiquidFusion(true);
  }

  return (
    <div className="toolkit-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />
      <div className="app-container" style={{ flex: 1, position: 'relative' }}>
        <Scene 
        reactiveness={reactiveness} zoom={zoom} hueShift={hueShift} 
        rotationSpeed={rotationSpeed} chaos={chaos} shape={shape} 
        brightness={brightness} density={density} saturation={saturation}
        flicker={flicker} particleSize={particleSize} liquidFusion={liquidFusion}
        imageFile={imageFile} voxelResolution={voxelResolution} voxelSpacing={voxelSpacing}
        windStrength={windStrength} gatherStrength={gatherStrength}
      />
      <OverlayHUD
        reactiveness={reactiveness} setReactiveness={setReactiveness}
        zoom={zoom} setZoom={setZoom}
        hueShift={hueShift} setHueShift={setHueShift}
        rotationSpeed={rotationSpeed} setRotationSpeed={setRotationSpeed}
        chaos={chaos} setChaos={setChaos}
        shape={shape} setShape={setShape}
        brightness={brightness} setBrightness={setBrightness}
        density={density} setDensity={setDensity}
        saturation={saturation} setSaturation={setSaturation}
        flicker={flicker} setFlicker={setFlicker}
        particleSize={particleSize} setParticleSize={setParticleSize}
        liquidFusion={liquidFusion} setLiquidFusion={setLiquidFusion}
        imageFile={imageFile} setImageFile={handleImageLoad}
        voxelResolution={voxelResolution} setVoxelResolution={setVoxelResolution}
        voxelSpacing={voxelSpacing} setVoxelSpacing={setVoxelSpacing}
        windStrength={windStrength} setWindStrength={setWindStrength}
        gatherStrength={gatherStrength} setGatherStrength={setGatherStrength}
      />
      </div>
    </div>
  );
}

export default App;

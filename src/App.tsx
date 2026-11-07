import { useState } from 'react';
import { Scene } from './components/canvas/Scene';
import { OverlayHUD } from './components/ui/OverlayHUD';
import { Header } from './components/ui/Header';
import { LOOKS, type Look } from './looks';

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
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);

  // Set every value of a look in one handler, like handleImageLoad, so React
  // renders the look in a single pass with no half-applied state.
  function applyLook(look: Look) {
    const s = look.settings;
    setShape(s.shape);
    setLiquidFusion(s.liquidFusion);
    setReactiveness(s.reactiveness);
    setZoom(s.zoom);
    setHueShift(s.hueShift);
    setSaturation(s.saturation);
    setFlicker(s.flicker);
    setParticleSize(s.particleSize);
    setRotationSpeed(s.rotationSpeed);
    setChaos(s.chaos);
    setBrightness(s.brightness);
    setDensity(s.density);
    setSelectedLookId(look.id);
  }

  // Another look than the current one, then a random whole-degree colour shift.
  function applyRandomLook() {
    const others = LOOKS.filter((l) => l.id !== selectedLookId);
    applyLook(others[Math.floor(Math.random() * others.length)]);
    setHueShift(Math.floor(Math.random() * 360) / 360);
  }

  // A manual change to any control means the values no longer match a look.
  const manual = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setSelectedLookId(null);
  };

  // When an image is loaded, snap all parameters to the voxel preset so the
  // viewer immediately gets the "molecules about to break apart" look.
  function handleImageLoad(file: File | null) {
    setImageFile(file);
    if (!file) return;
    setSelectedLookId(null);
    setVoxelResolution(160);
    setVoxelSpacing(1.0);
    setWindStrength(0.0);
    setGatherStrength(1.0);
    setZoom(0.35);
    setShape('none');
    setLiquidFusion(false);
    setReactiveness(2.0);
    setBrightness(1.8);
    setParticleSize(4.0);
    setRotationSpeed(0.0);
  }

  return (
    <div className="toolkit-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />
      <main className="app-container" style={{ flex: 1, position: 'relative' }}>
        <Scene 
        reactiveness={reactiveness} zoom={zoom} hueShift={hueShift} 
        rotationSpeed={rotationSpeed} chaos={chaos} shape={shape} 
        brightness={brightness} density={density} saturation={saturation}
        flicker={flicker} particleSize={particleSize} liquidFusion={liquidFusion}
        imageFile={imageFile} voxelResolution={voxelResolution} voxelSpacing={voxelSpacing}
        windStrength={windStrength} gatherStrength={gatherStrength}
      />
      <OverlayHUD
        reactiveness={reactiveness} setReactiveness={manual(setReactiveness)}
        zoom={zoom} setZoom={manual(setZoom)}
        hueShift={hueShift} setHueShift={manual(setHueShift)}
        rotationSpeed={rotationSpeed} setRotationSpeed={manual(setRotationSpeed)}
        chaos={chaos} setChaos={manual(setChaos)}
        shape={shape} setShape={manual(setShape)}
        brightness={brightness} setBrightness={manual(setBrightness)}
        density={density} setDensity={manual(setDensity)}
        saturation={saturation} setSaturation={manual(setSaturation)}
        flicker={flicker} setFlicker={manual(setFlicker)}
        particleSize={particleSize} setParticleSize={manual(setParticleSize)}
        liquidFusion={liquidFusion} setLiquidFusion={manual(setLiquidFusion)}
        imageFile={imageFile} setImageFile={handleImageLoad}
        voxelResolution={voxelResolution} setVoxelResolution={manual(setVoxelResolution)}
        voxelSpacing={voxelSpacing} setVoxelSpacing={manual(setVoxelSpacing)}
        windStrength={windStrength} setWindStrength={manual(setWindStrength)}
        gatherStrength={gatherStrength} setGatherStrength={manual(setGatherStrength)}
        selectedLookId={selectedLookId} onApplyLook={applyLook} onRandomLook={applyRandomLook}
      />
      </main>
    </div>
  );
}

export default App;

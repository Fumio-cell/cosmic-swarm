import { useState } from 'react';
import { Scene } from './components/canvas/Scene';
import { OverlayHUD } from './components/ui/OverlayHUD';
import { Header } from './components/ui/Header';

export type ShapeType = 'galaxy' | 'sphere' | 'helix' | 'torus' | 'amoeba';

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

  return (
    <div className="toolkit-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />
      <div className="app-container" style={{ flex: 1, position: 'relative' }}>
        <Scene 
        reactiveness={reactiveness} zoom={zoom} hueShift={hueShift} 
        rotationSpeed={rotationSpeed} chaos={chaos} shape={shape} 
        brightness={brightness} density={density} saturation={saturation}
        flicker={flicker} particleSize={particleSize} liquidFusion={liquidFusion}
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
      />
      </div>
    </div>
  );
}

export default App;

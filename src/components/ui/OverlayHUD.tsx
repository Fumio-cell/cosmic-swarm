import React, { useCallback, useState, useEffect, useRef } from 'react';
import { audioAnalyzer } from '../../audio/AudioAnalyzer';
import { videoRecorder } from '../../utils/VideoRecorder';
import { Play, Pause, Upload, Settings, Video, Aperture, Circle, Dna, LifeBuoy, Droplets } from 'lucide-react';
import type { ShapeType } from '../../App';

interface OverlayHUDProps {
  reactiveness: number;
  setReactiveness: (val: number) => void;
  zoom: number;
  setZoom: (val: number) => void;
  hueShift: number;
  setHueShift: (val: number) => void;
  rotationSpeed: number;
  setRotationSpeed: (val: number) => void;
  chaos: number;
  setChaos: (val: number) => void;
  shape: ShapeType;
  setShape: (val: ShapeType) => void;
  brightness: number;
  setBrightness: (val: number) => void;
  density: number;
  setDensity: (val: number) => void;
  saturation: number;
  setSaturation: (val: number) => void;
  flicker: number;
  setFlicker: (val: number) => void;
  particleSize: number;
  setParticleSize: (val: number) => void;
  liquidFusion: boolean;
  setLiquidFusion: (val: boolean) => void;
}

export function OverlayHUD({ 
  reactiveness, setReactiveness, 
  zoom, setZoom, 
  hueShift, setHueShift,
  rotationSpeed, setRotationSpeed,
  chaos, setChaos,
  shape, setShape,
  brightness, setBrightness,
  density, setDensity,
  saturation, setSaturation,
  flicker, setFlicker,
  particleSize, setParticleSize,
  liquidFusion, setLiquidFusion
}: OverlayHUDProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
      if (isRecording) {
        videoRecorder.stopRecording();
        setIsRecording(false);
      }
    };
    audioAnalyzer.audio.addEventListener('ended', handleEnded);
    return () => audioAnalyzer.audio.removeEventListener('ended', handleEnded);
  }, [isRecording]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setFileName(file.name);
      await audioAnalyzer.loadAudio(file);
      setIsPlaying(false);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setFileName(file.name);
      await audioAnalyzer.loadAudio(file);
      setIsPlaying(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const togglePlay = () => {
    if (isRecording) return; // Prevent pausing during render
    audioAnalyzer.togglePlay();
    setIsPlaying(audioAnalyzer.isPlaying());
  };

  const startRender = async () => {
    const canvas = document.querySelector('canvas');
    
    if (!canvas) return;
    
    audioAnalyzer.audio.currentTime = 0;
    await audioAnalyzer.audio.play();
    setIsPlaying(true);
    setIsRecording(true);
    
    videoRecorder.startRecording(canvas);
  };

  return (
    <div className="overlay-hud" onDrop={handleDrop} onDragOver={handleDragOver}>
      {/* Main Dropzone / Controls */}
      <div className="hud-controls">
        {!fileName ? (
          <div 
            className="dropzone" 
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            <input 
              type="file" 
              accept="audio/*" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              style={{ display: 'none' }} 
            />
            <Upload size={32} />
            <p>DRAG & DROP OR CLICK TO BROWSE</p>
            <span className="sub-text">MP3, WAV, FLAC</span>
          </div>
        ) : (
          <div className="player-panel">
            <div className="track-info">
              <span className="track-name">{fileName}</span>
            </div>
            
            <button className={`render-btn ${isRecording ? 'recording' : ''}`} onClick={startRender} disabled={isRecording}>
              <Video size={20} />
              {isRecording ? 'RECORDING...' : 'RENDER VIDEO'}
            </button>

            <button className="play-btn" onClick={togglePlay} disabled={isRecording}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </div>
        )}

        <div className="parameter-panel">
          <div className="param-header">
            <Settings size={16} />
            <span>PARAMETERS</span>
          </div>

          <div className="shape-selector">
            <label>FORMATION</label>
            <div className="shape-buttons">
              {(['galaxy', 'sphere', 'helix', 'torus', 'amoeba'] as ShapeType[]).map((s) => {
                const getIcon = () => {
                  switch(s) {
                    case 'galaxy': return <Aperture size={18} />;
                    case 'sphere': return <Circle size={18} />;
                    case 'helix': return <Dna size={18} />;
                    case 'torus': return <LifeBuoy size={18} />;
                    case 'amoeba': return <Droplets size={18} />;
                  }
                };
                return (
                  <button 
                    key={s} 
                    className={`shape-btn ${shape === s ? 'active' : ''}`}
                    onClick={() => setShape(s)}
                    title={s.toUpperCase()}
                  >
                    {getIcon()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="slider-group" style={{ padding: '0.8rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', margin: 0 }} onClick={() => setLiquidFusion(!liquidFusion)}>
              <span>LIQUID FUSION (METABALL)</span>
              <span style={{ color: liquidFusion ? 'var(--neon-green)' : '#666', fontWeight: 'bold' }}>{liquidFusion ? 'ON' : 'OFF'}</span>
            </label>
          </div>

          <div className="slider-group">
            <label>REACTIVENESS</label>
            <input 
              type="range" 
              min="0" max="3" step="0.1" 
              value={reactiveness}
              onChange={(e) => setReactiveness(parseFloat(e.target.value))}
            />
            <span className="slider-value">{reactiveness.toFixed(1)}</span>
          </div>
          <div className="slider-group">
            <label>SMOOTH ZOOM</label>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(zoom * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label>COLOR SHIFT</label>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={hueShift}
              onChange={(e) => setHueShift(parseFloat(e.target.value))}
            />
            <span className="slider-value">{Math.round(hueShift * 360)}°</span>
          </div>
          <div className="slider-group">
            <label>COLOR SATURATION (WHITE LIGHT)</label>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={saturation}
              onChange={(e) => setSaturation(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(saturation * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label>LIGHT FLICKER (TWINKLE)</label>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={flicker}
              onChange={(e) => setFlicker(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(flicker * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label>PARTICLE SIZE</label>
            <input 
              type="range" 
              min="0.5" max="30.0" step="0.1" 
              value={particleSize}
              onChange={(e) => setParticleSize(parseFloat(e.target.value))}
            />
            <span className="slider-value">{particleSize.toFixed(1)}x</span>
          </div>
          <div className="slider-group">
            <label>ROTATION SPEED</label>
            <input 
              type="range" 
              min="-5" max="5" step="0.1" 
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
            />
            <span className="slider-value">{rotationSpeed > 0 ? '+' : ''}{rotationSpeed.toFixed(1)}x</span>
          </div>
          <div className="slider-group">
            <label>CHAOS / TURBULENCE</label>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={chaos}
              onChange={(e) => setChaos(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(chaos * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label>BRIGHTNESS</label>
            <input 
              type="range" 
              min="0.1" max="20.0" step="0.1" 
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
            />
            <span className="slider-value">{brightness.toFixed(1)}x</span>
          </div>
          <div className="slider-group">
            <label>PARTICLE DENSITY</label>
            <input 
              type="range" 
              min="0.01" max="1.0" step="0.01" 
              value={density}
              onChange={(e) => setDensity(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(density * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="interaction-hint" style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        letterSpacing: '0.2em',
        color: 'rgba(255, 255, 255, 0.4)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        CLICK & DRAG TO ROTATE 360°
      </div>
    </div>
  );
}

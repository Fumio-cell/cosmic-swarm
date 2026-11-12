import React, { useCallback, useState, useEffect, useRef } from 'react';
import { audioAnalyzer } from '../../audio/AudioAnalyzer';
import { videoRecorder } from '../../utils/VideoRecorder';
import { DEMO_MODE, DEMO_MAX_SECONDS, BUY_URL } from '../../config';
import { Play, Pause, Upload, Settings, Video, Aperture, Circle, LifeBuoy, Droplets, X, Ban, XCircle, Music, Shuffle } from 'lucide-react';
import type { ShapeType } from '../../App';
import { LOOKS, type Look } from '../../looks';

// Browsers don't always report a MIME type for AIFF, so fall back to the extension.
const isAudioFile = (file: File) => {
  const name = file.name.toLowerCase();
  return file.type.startsWith('audio/') || name.endsWith('.aif') || name.endsWith('.aiff') || name.endsWith('.aifc');
};

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
  imageFile: File | null;
  setImageFile: (val: File | null) => void;
  voxelResolution: number;
  setVoxelResolution: (val: number) => void;
  voxelSpacing: number;
  setVoxelSpacing: (val: number) => void;
  windStrength: number;
  setWindStrength: (val: number) => void;
  gatherStrength: number;
  setGatherStrength: (val: number) => void;
  selectedLookId: string | null;
  onApplyLook: (look: Look) => void;
  onRandomLook: () => void;
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
  liquidFusion, setLiquidFusion,
  imageFile, setImageFile,
  voxelResolution, setVoxelResolution,
  voxelSpacing, setVoxelSpacing,
  windStrength, setWindStrength,
  gatherStrength, setGatherStrength,
  selectedLookId, onApplyLook, onRandomLook
}: OverlayHUDProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The accent marks the one thing to do next: load something, then render it,
  // and once the file is written, the full version. Exactly one filled button.
  const hasMedia = Boolean(fileName || imageFile);

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

  // A failed load returns the player to its no-track state.
  const handleLoadFailure = useCallback((e: unknown) => {
    alert(`Failed to decode audio file (${e instanceof Error ? e.message : String(e)})`);
    audioAnalyzer.audio.pause();
    setFileName(null);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const handleError = () => {
      const error = audioAnalyzer.audio.error;
      handleLoadFailure(new Error(error?.message || `MediaError code ${error?.code}`));
    };
    audioAnalyzer.audio.addEventListener('error', handleError);
    return () => audioAnalyzer.audio.removeEventListener('error', handleError);
  }, [handleLoadFailure]);

  // Every way in (drop, file chooser, sample) goes through here.
  // Resolves true when an audio track was loaded.
  const loadFile = useCallback(async (file: File): Promise<boolean> => {
    if (isAudioFile(file)) {
      setExportDone(false);
      setFileName(file.name);
      try {
        await audioAnalyzer.loadAudio(file);
      } catch (err) {
        handleLoadFailure(err);
        return false;
      }
      setIsPlaying(false);
      return true;
    }
    if (file.type.startsWith('image/')) {
      setImageFile(file);
    }
    return false;
  }, [setImageFile, handleLoadFailure]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await loadFile(file);
  }, [loadFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadFile(file);
  };

  // Fetch the bundled excerpt, load it like a dropped file, then start playing.
  const loadSample = async () => {
    setSampleLoading(true);
    try {
      let blob: Blob;
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}samples/keeper-excerpt.mp3`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
      } catch {
        alert('Could not load the sample. Please check your connection and try again.');
        return;
      }
      if (!(await loadFile(new File([blob], 'Keeper (sample).mp3', { type: 'audio/mpeg' })))) return;
      try {
        await audioAnalyzer.audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } finally {
      setSampleLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const togglePlay = () => {
    if (isRecording) return; // Prevent pausing during render
    audioAnalyzer.togglePlay().catch(() => setIsPlaying(false));
    setIsPlaying(audioAnalyzer.isPlaying());
  };

  const cancelRender = () => {
    videoRecorder.cancelRecording();
    audioAnalyzer.audio.pause();
    audioAnalyzer.audio.currentTime = 0;
    setIsRecording(false);
    setIsPlaying(false);
    setExportDone(false);
  };

  // Called right after the recorder starts the download.
  const handleExportComplete = () => {
    setExportDone(true);
  };

  const startRender = async () => {
    const canvas = document.querySelector('canvas');

    if (!canvas) return;

    audioAnalyzer.audio.currentTime = 0;
    await audioAnalyzer.audio.play();
    setIsPlaying(true);
    setIsRecording(true);
    setExportDone(false);

    if (DEMO_MODE) {
      videoRecorder.startRecording(
        canvas,
        audioAnalyzer.getAudioStream(),
        DEMO_MAX_SECONDS * 1000,
        () => {
          audioAnalyzer.audio.pause();
          setIsRecording(false);
          setIsPlaying(false);
        },
        handleExportComplete
      );
    } else {
      videoRecorder.startRecording(
        canvas,
        audioAnalyzer.getAudioStream(),
        undefined,
        undefined,
        handleExportComplete
      );
    }
  };

  return (
    <div className="overlay-hud" onDrop={handleDrop} onDragOver={handleDragOver}>
      {/* Concept line: only on the first screen, before any file is loaded */}
      {!fileName && !imageFile && (
        <div className="concept">
          <p className="concept-text">A 3D swarm of light that moves to your music. Render it to video in your browser.</p>
          <p className="concept-statement">NOTHING LEAVES THIS MACHINE</p>
          <p className="concept-note">No upload. No account. The file is made here.</p>
        </div>
      )}

      {/* Main Dropzone / Controls */}
      <div className="hud-controls">
        <div
          className="dropzone"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            type="file"
            accept="audio/*,image/*,audio/aiff,audio/x-aiff,.aif,.aiff,.aifc"
            ref={fileInputRef}
            onChange={handleFileSelect}
            aria-hidden="true"
            tabIndex={-1}
            style={{ display: 'none' }}
          />
          <Upload size={32} />
          <p>DRAG & DROP OR CLICK TO BROWSE</p>
          <span className="sub-text">MP3, WAV, AIFF, FLAC / IMAGE</span>
        </div>

        <button type="button" className={`sample-btn ${hasMedia ? 'is-secondary' : 'is-primary'}`} onClick={loadSample} disabled={sampleLoading || isRecording}>
          <Music size={16} />
          {sampleLoading ? 'LOADING...' : 'TRY A SAMPLE'}
        </button>

        {fileName && (
          <div className="player-panel">
            <div className="track-row">
              <span className="track-name" title={fileName}>{fileName}</span>
              <button
                className="play-btn"
                onClick={togglePlay}
                disabled={isRecording}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>

            <button className={`render-btn ${isRecording ? 'recording' : exportDone ? 'is-secondary' : 'is-primary'}`} onClick={startRender} disabled={isRecording}>
              <Video size={18} />
              <span>
                {isRecording
                  ? 'WRITING VIDEO'
                  : DEMO_MODE
                    ? <>RENDER VIDEO <span className="nowrap">({DEMO_MAX_SECONDS}S PREVIEW)</span></>
                    : 'RENDER VIDEO'}
              </span>
            </button>

            {isRecording && (
              <button className="cancel-btn" onClick={cancelRender}>
                <XCircle size={16} />
                CANCEL
              </button>
            )}

            {exportDone && (
              <div className="export-complete" role="status" aria-live="polite">
                <p>Video exported. Check your downloads.</p>
                {DEMO_MODE && (
                  <>
                    <p>
                      Preview export is limited to {DEMO_MAX_SECONDS} seconds. The full version
                      exports the whole track.
                    </p>
                    <a className="buy-btn is-primary" href={BUY_URL} target="_blank" rel="noopener noreferrer">
                      GET THE FULL VERSION
                    </a>
                    <p className="buy-note">One-time purchase. No subscription.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Parameter Panel — right side */}
      <div className="parameter-panel">
          <div className="param-header">
            <Settings size={16} />
            <span>PARAMETERS</span>
          </div>

          {imageFile && (
            <div className="slider-group param-group-bottom">
              <label className="param-group-head">
                <span>IMAGE VOXEL MODE</span>
                <button
                  className="shape-btn clear-image-btn"
                  title="CLEAR IMAGE (RETURN TO SWARM)"
                  aria-label="Clear image and return to swarm"
                  onClick={() => setImageFile(null)}
                >
                  <X size={14} /> CLEAR
                </button>
              </label>

              <div className="slider-group">
                <label htmlFor="voxel-resolution">VOXEL RESOLUTION</label>
                <input id="voxel-resolution"
                  type="range"
                  min="8" max="160" step="1"
                  value={voxelResolution}
                  onChange={(e) => setVoxelResolution(parseInt(e.target.value, 10))}
                />
                <span className="slider-value">{voxelResolution}px</span>
              </div>
              <div className="slider-group">
                <label htmlFor="voxel-spacing">VOXEL SPACING</label>
                <input id="voxel-spacing"
                  type="range"
                  min="0.5" max="4" step="0.1"
                  value={voxelSpacing}
                  onChange={(e) => setVoxelSpacing(parseFloat(e.target.value))}
                />
                <span className="slider-value">{voxelSpacing.toFixed(1)}</span>
              </div>
              <div className="slider-group">
                <label htmlFor="wind-strength">WIND STRENGTH</label>
                <input id="wind-strength"
                  type="range"
                  min="0" max="2" step="0.01"
                  value={windStrength}
                  onChange={(e) => setWindStrength(parseFloat(e.target.value))}
                />
                <span className="slider-value">{(windStrength * 100).toFixed(0)}%</span>
              </div>
              <div className="slider-group">
                <label htmlFor="gather-strength">GATHER (SWARM ⇄ IMAGE)</label>
                <input id="gather-strength"
                  type="range"
                  min="0" max="1" step="0.01"
                  value={gatherStrength}
                  onChange={(e) => setGatherStrength(parseFloat(e.target.value))}
                />
                <span className="slider-value">{(gatherStrength * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}

          {!imageFile && (
            <div className="looks" role="group" aria-labelledby="looks-label">
              <span id="looks-label" className="looks-label">LOOKS</span>
              <div className="looks-grid">
                {LOOKS.map((look) => (
                  <button
                    key={look.id}
                    type="button"
                    className={`look-btn ${selectedLookId === look.id ? 'active' : ''}`}
                    aria-pressed={selectedLookId === look.id}
                    title={look.tagline}
                    onClick={() => onApplyLook(look)}
                  >
                    <img src={`${import.meta.env.BASE_URL}looks/${look.id}.webp`} alt="" width={320} height={180} />
                    <span>{look.name}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="random-btn" onClick={onRandomLook}>
                <Shuffle size={14} />
                RANDOM
              </button>
            </div>
          )}

          <div className="shape-selector">
            <label>FORMATION</label>
            <div className="shape-buttons">
              {(['none', 'galaxy', 'sphere', 'torus', 'amoeba'] as ShapeType[]).map((s) => {
                const getIcon = () => {
                  switch(s) {
                    case 'none':   return <Ban size={18} />;
                    case 'galaxy': return <Aperture size={18} />;
                    case 'sphere': return <Circle size={18} />;
                    case 'torus':  return <LifeBuoy size={18} />;
                    case 'amoeba': return <Droplets size={18} />;
                  }
                };
                const getTitle = () => {
                  switch(s) {
                    case 'none':   return 'None';
                    case 'galaxy': return 'Galaxy';
                    case 'sphere': return 'Sphere';
                    case 'torus':  return 'Torus';
                    case 'amoeba': return 'Droplets';
                  }
                };
                return (
                  <button
                    key={s}
                    className={`shape-btn ${shape === s ? 'active' : ''}`}
                    onClick={() => setShape(s)}
                    title={getTitle()}
                    aria-label={getTitle()}
                    aria-pressed={shape === s}
                  >
                    {getIcon()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="slider-group param-group-band">
            <button
              type="button"
              role="switch"
              aria-checked={liquidFusion}
              aria-labelledby="liquid-fusion-label"
              className="switch-row"
              onClick={() => setLiquidFusion(!liquidFusion)}
            >
              <span id="liquid-fusion-label">LIQUID FUSION (METABALL)</span>
              <span className={`switch-value ${liquidFusion ? 'on' : ''}`}>{liquidFusion ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="slider-group">
            <label htmlFor="param-reactiveness">REACTIVENESS</label>
            <input id="param-reactiveness" 
              type="range" 
              min="0" max="3" step="0.1" 
              value={reactiveness}
              onChange={(e) => setReactiveness(parseFloat(e.target.value))}
            />
            <span className="slider-value">{reactiveness.toFixed(1)}</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-zoom">SMOOTH ZOOM</label>
            <input id="param-zoom" 
              type="range" 
              min="0" max="1" step="0.01" 
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(zoom * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-hue-shift">COLOR SHIFT</label>
            <input id="param-hue-shift" 
              type="range" 
              min="0" max="1" step="0.01" 
              value={hueShift}
              onChange={(e) => setHueShift(parseFloat(e.target.value))}
            />
            <span className="slider-value">{Math.round(hueShift * 360)}°</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-saturation">COLOR SATURATION (WHITE LIGHT)</label>
            <input id="param-saturation" 
              type="range" 
              min="0" max="1" step="0.01" 
              value={saturation}
              onChange={(e) => setSaturation(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(saturation * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-flicker">LIGHT FLICKER (TWINKLE)</label>
            <input id="param-flicker" 
              type="range" 
              min="0" max="1" step="0.01" 
              value={flicker}
              onChange={(e) => setFlicker(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(flicker * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-particle-size">PARTICLE SIZE</label>
            <input id="param-particle-size" 
              type="range" 
              min="0.1" max="10.0" step="0.1"
              value={particleSize}
              onChange={(e) => setParticleSize(parseFloat(e.target.value))}
            />
            <span className="slider-value">{particleSize.toFixed(1)}x</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-rotation-speed">ROTATION SPEED</label>
            <input id="param-rotation-speed" 
              type="range" 
              min="-5" max="5" step="0.1" 
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
            />
            <span className="slider-value">{rotationSpeed > 0 ? '+' : ''}{rotationSpeed.toFixed(1)}x</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-chaos">CHAOS / TURBULENCE</label>
            <input id="param-chaos" 
              type="range" 
              min="0" max="1" step="0.01" 
              value={chaos}
              onChange={(e) => setChaos(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(chaos * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-brightness">BRIGHTNESS</label>
            <input id="param-brightness" 
              type="range" 
              min="0.1" max="20.0" step="0.1" 
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
            />
            <span className="slider-value">{brightness.toFixed(1)}x</span>
          </div>
          <div className="slider-group">
            <label htmlFor="param-density">PARTICLE DENSITY</label>
            <input id="param-density" 
              type="range" 
              min="0.01" max="1.0" step="0.01" 
              value={density}
              onChange={(e) => setDensity(parseFloat(e.target.value))}
            />
            <span className="slider-value">{(density * 100).toFixed(0)}%</span>
          </div>
        </div>

      {/* Interaction Hint */}
      <div className="interaction-hint">
        CLICK &amp; DRAG TO ROTATE 360°
      </div>
    </div>
  );
}

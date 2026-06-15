import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioAnalyzer } from '../../audio/AudioAnalyzer';
import { analyzeImagePixels } from '../../utils/imageAnalyzer';
import type { ShapeType } from '../../App';
import vertShader from '../../glsl/image_voxel.vert?raw';
import fragShader from '../../glsl/image_voxel.frag?raw';

const MAX_INSTANCES = 30000;

// Scatter layouts mirroring ParticleSwarm's FORMATION shapes.
function scatterPosition(shape: ShapeType, i: number, total: number): [number, number, number] {
  switch (shape) {
    case 'galaxy': {
      const radius = Math.random() * 15;
      const spinAngle = radius * 1.5;
      const branchAngle = (i % 5) * ((Math.PI * 2) / 5);
      const x = Math.cos(spinAngle + branchAngle) * radius;
      const z = Math.sin(spinAngle + branchAngle) * radius;
      const y = (Math.random() - 0.5) * 2.0 * (15.0 - radius) * 0.15;
      return [x, y, z];
    }
    case 'helix': {
      const t = (i / total) * 100;
      const branch = (i % 2) * Math.PI;
      const r = 4;
      const x = Math.cos(t + branch) * r + (Math.random() - 0.5) * 1.0;
      const z = Math.sin(t + branch) * r + (Math.random() - 0.5) * 1.0;
      const y = (t - 50) * 0.25 + (Math.random() - 0.5) * 1.0;
      return [x, y, z];
    }
    case 'torus': {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const R = 6;
      const r = 2 * Math.random();
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = r * Math.sin(v) * 1.5;
      const z = (R + r * Math.cos(v)) * Math.sin(u);
      return [x, y, z];
    }
    case 'amoeba': {
      const clusterId = i % 30;
      const cx = (Math.sin(clusterId * 12.9898) * 43758.5453 % 1 - 0.5) * 30;
      const cy = (Math.sin(clusterId * 78.233) * 43758.5453 % 1 - 0.5) * 30;
      const cz = (Math.sin(clusterId * 39.346) * 43758.5453 % 1 - 0.5) * 30;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 4 * Math.pow(Math.random(), 0.3);
      return [cx + r * Math.sin(phi) * Math.cos(theta), cy + r * Math.sin(phi) * Math.sin(theta), cz + r * Math.cos(phi)];
    }
    case 'sphere':
    default: {
      const r = 8 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      return [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)];
    }
  }
}

interface ImageVoxelSwarmProps {
  imageFile: File;
  shape: ShapeType;
  zoom: number;
  voxelResolution: number;
  voxelSpacing: number;
  windStrength: number;
  gatherStrength: number;
  reactiveness: number;
  hueShift: number;
  chaos: number;
  brightness: number;
  density: number;
  saturation: number;
  flicker: number;
  particleSize: number;
  liquidFusion: boolean;
}

export function ImageVoxelSwarm({
  imageFile,
  shape,
  zoom,
  voxelResolution,
  voxelSpacing,
  windStrength,
  gatherStrength,
  reactiveness,
  hueShift,
  chaos,
  brightness,
  density,
  saturation,
  flicker,
  particleSize,
  liquidFusion,
}: ImageVoxelSwarmProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const color = useMemo(() => new THREE.Color(), []);
  // On import, show the photo fully formed first, then let it break apart
  // over a few seconds, settling onto the GATHER slider's target.
  const currentGather = useRef(1.0);
  const breakupStart = useRef<number | null>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3));
    geo.setAttribute('aHome', new THREE.BufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(MAX_INSTANCES), 1));
    geo.setAttribute('aAudioIndex', new THREE.BufferAttribute(new Float32Array(MAX_INSTANCES), 1));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudioData: { value: audioAnalyzer.audioTexture },
    uAudioReactiveness: { value: reactiveness },
    uHueShift: { value: hueShift },
    uChaos: { value: chaos },
    uBrightness: { value: brightness },
    uDensity: { value: density },
    uSaturation: { value: saturation },
    uFlicker: { value: flicker },
    uParticleSize: { value: particleSize },
    uLiquidFusion: { value: liquidFusion ? 1.0 : 0.0 },
    uBass: { value: 0.0 },
    uTreble: { value: 0.0 },
    uGather: { value: gatherStrength },
    uWind: { value: windStrength },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;

    // Clamp resolution so the point count never exceeds MAX_INSTANCES
    const maxRes = Math.floor(Math.sqrt(MAX_INSTANCES));
    const clampedResolution = Math.min(voxelResolution, maxRes);

    analyzeImagePixels(imageFile, clampedResolution).then((pixels) => {
      if (cancelled) return;

      const limited = pixels.slice(0, MAX_INSTANCES);

      const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const homeAttr = geometry.getAttribute('aHome') as THREE.BufferAttribute;
      const colorAttr = geometry.getAttribute('aColor') as THREE.BufferAttribute;
      const sizeAttr = geometry.getAttribute('aSize') as THREE.BufferAttribute;
      const audioIndexAttr = geometry.getAttribute('aAudioIndex') as THREE.BufferAttribute;

      const half = clampedResolution / 2;
      // Keep the overall image size roughly constant regardless of resolution,
      // so higher resolutions add detail instead of expanding off-screen.
      const cellSize = voxelSpacing * (16 / clampedResolution);

      for (let i = 0; i < limited.length; i++) {
        const p = limited[i];

        // Home position: image grid centered at origin, Y flipped (image Y grows downward)
        homeAttr.setXYZ(i, (p.x - half) * cellSize, (half - p.y) * cellSize, 0);

        // Scatter position: follow the selected FORMATION shape
        const [sx, sy, sz] = scatterPosition(shape, i, limited.length);
        positionAttr.setXYZ(i, sx, sy, sz);

        color.setRGB(p.r / 255, p.g / 255, p.b / 255);
        colorAttr.setXYZ(i, color.r, color.g, color.b);

        // Scale particle size with cell size so higher resolutions show crisper,
        // less-overlapping detail instead of washing out into a blurred mass.
        sizeAttr.setX(i, (Math.random() * 0.4 + 1.2) * cellSize * 2.0);
        audioIndexAttr.setX(i, Math.random());
      }

      positionAttr.needsUpdate = true;
      homeAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      audioIndexAttr.needsUpdate = true;
      geometry.setDrawRange(0, limited.length);
      geometry.computeBoundingSphere();

      // Reset to a fully-formed photo on import; it will automatically
      // break apart over the next few seconds in the animation loop below.
      currentGather.current = 1.0;
      breakupStart.current = null;
    });

    return () => {
      cancelled = true;
    };
  }, [imageFile, voxelResolution, voxelSpacing, shape, geometry, color]);

  useFrame((state) => {
    const u = shaderRef.current?.uniforms;
    if (!u) return;
    u.uTime.value = state.clock.elapsedTime;
    u.uAudioReactiveness.value = reactiveness;
    u.uHueShift.value = hueShift;
    u.uChaos.value = chaos;
    u.uBrightness.value = brightness;
    u.uDensity.value = density;
    u.uSaturation.value = saturation;
    u.uFlicker.value = flicker;
    u.uParticleSize.value = particleSize;
    u.uLiquidFusion.value = liquidFusion ? 1.0 : 0.0;
    u.uBass.value = audioAnalyzer.bass;
    u.uTreble.value = audioAnalyzer.treble;
    // Hold the fully-formed photo for a beat, then break it apart down to
    // the GATHER slider's target, independent of the slider's value.
    if (breakupStart.current === null) {
      breakupStart.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - breakupStart.current;
    const holdTime = 1.5;
    const breakupDuration = 3.0;
    const breakupProgress = THREE.MathUtils.clamp((elapsed - holdTime) / breakupDuration, 0, 1);
    // GATHER fully controls the rest state: 100% reassembles the original photo.
    const restGather = THREE.MathUtils.clamp(gatherStrength, 0, 1);
    const targetGather = THREE.MathUtils.lerp(1.0, restGather, breakupProgress);
    currentGather.current = THREE.MathUtils.lerp(currentGather.current, targetGather, 0.03);
    u.uGather.value = currentGather.current;
    u.uWind.value = windStrength;

    if (audioAnalyzer.isPlaying()) {
      audioAnalyzer.updateTexture();
    }

    if (pointsRef.current) {
      const targetScale = 0.15 + (zoom * 4.85);
      pointsRef.current.scale.setScalar(THREE.MathUtils.lerp(pointsRef.current.scale.x, targetScale, 0.05));
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={uniforms}
      />
    </points>
  );
}

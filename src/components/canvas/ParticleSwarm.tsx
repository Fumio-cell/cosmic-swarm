import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioAnalyzer } from '../../audio/AudioAnalyzer';
import type { ShapeType } from '../../App';
import vertShader from '../../glsl/particle.vert?raw';
import fragShader from '../../glsl/particle.frag?raw';

const PARTICLE_COUNT = 30000;

export function ParticleSwarm({ reactiveness = 1.0, hueShift = 0.0, chaos = 0.0, shape = 'galaxy' as ShapeType, zoom = 0.5, brightness = 1.0, density = 1.0, saturation = 1.0, flicker = 1.0, particleSize = 1.0, liquidFusion = false }) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const audioIndices = new Float32Array(PARTICLE_COUNT);

    const baseColor = new THREE.Color('#00ff88'); // Neon green
    const accentColor = new THREE.Color('#00ccff'); // Cyan
    const mixedColor = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = 0, y = 0, z = 0;
      
      if (shape === 'galaxy') {
        const radius = Math.random() * 15;
        const spinAngle = radius * 1.5; 
        const branchAngle = (i % 5) * ((Math.PI * 2) / 5); 
        x = Math.cos(spinAngle + branchAngle) * radius;
        z = Math.sin(spinAngle + branchAngle) * radius;
        y = (Math.random() - 0.5) * 2.0 * (15.0 - radius) * 0.15;
      } else if (shape === 'sphere') {
        const r = 8 * Math.cbrt(Math.random()); // Reduced from 15 to 8
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else if (shape === 'helix') {
        const t = (i / PARTICLE_COUNT) * 100;
        const branch = (i % 2) * Math.PI;
        const r = 4;
        x = Math.cos(t + branch) * r + (Math.random() - 0.5) * 1.0;
        z = Math.sin(t + branch) * r + (Math.random() - 0.5) * 1.0;
        y = (t - 50) * 0.25 + (Math.random() - 0.5) * 1.0; // Reduced height spread
      } else if (shape === 'torus') {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const R = 6; // Reduced from 10
        const r = 2 * Math.random(); // Reduced from 4
        x = (R + r * Math.cos(v)) * Math.cos(u);
        y = r * Math.sin(v) * 1.5;
        z = (R + r * Math.cos(v)) * Math.sin(u);
      } else if (shape === 'amoeba') {
        // Amoeba: multiple dense clusters (nodes) that will merge and separate like cells
        // Create 30 distinct center points based on a seeded random
        const clusterId = i % 30;
        // Pseudo-random position for the cluster center
        const cx = (Math.sin(clusterId * 12.9898) * 43758.5453 % 1 - 0.5) * 30;
        const cy = (Math.sin(clusterId * 78.233) * 43758.5453 % 1 - 0.5) * 30;
        const cz = (Math.sin(clusterId * 39.346) * 43758.5453 % 1 - 0.5) * 30;
        
        // Distribute particles densely around their cluster center
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 4 * Math.pow(Math.random(), 0.3); // Tight cluster radius
        
        x = cx + r * Math.sin(phi) * Math.cos(theta);
        y = cy + r * Math.sin(phi) * Math.sin(theta);
        z = cz + r * Math.cos(phi);
      }
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random color blend
      mixedColor.copy(baseColor).lerp(accentColor, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      sizes[i] = Math.random() * 0.2 + 0.05;
      audioIndices[i] = Math.random(); 
    }

    return { positions, colors, sizes, audioIndices };
  }, [shape]);

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
  }), [reactiveness, hueShift, chaos, brightness, density, saturation, flicker, particleSize, liquidFusion]);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.uAudioReactiveness.value = reactiveness;
      shaderRef.current.uniforms.uHueShift.value = hueShift;
      shaderRef.current.uniforms.uChaos.value = chaos;
      shaderRef.current.uniforms.uBrightness.value = brightness;
      shaderRef.current.uniforms.uDensity.value = density;
      shaderRef.current.uniforms.uSaturation.value = saturation;
      shaderRef.current.uniforms.uFlicker.value = flicker;
      shaderRef.current.uniforms.uParticleSize.value = particleSize;
      shaderRef.current.uniforms.uLiquidFusion.value = liquidFusion ? 1.0 : 0.0;
      shaderRef.current.uniforms.uBass.value = audioAnalyzer.bass;
      shaderRef.current.uniforms.uTreble.value = audioAnalyzer.treble;
      
      // Update audio texture every frame if playing
      if (audioAnalyzer.isPlaying()) {
        audioAnalyzer.updateTexture();
      }
    }
    
    // Smoothly scale the entire geometry based on the zoom slider
    // This perfectly mimics a camera zoom without fighting OrbitControls
    if (pointsRef.current) {
      // Map zoom (0-1) to scale (0.15 to 5.0)
      const targetScale = 0.15 + (zoom * 4.85);
      pointsRef.current.scale.setScalar(THREE.MathUtils.lerp(pointsRef.current.scale.x, targetScale, 0.05));
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[particles.sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aAudioIndex"
          args={[particles.audioIndices, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

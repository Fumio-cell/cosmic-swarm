import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { analyzeImagePixels } from '../../utils/imageAnalyzer';

const MAX_INSTANCES = 30000;

interface ImageVoxelSwarmProps {
  imageFile: File;
  voxelResolution: number;
  voxelSpacing: number;
  windStrength: number;
  gatherStrength: number;
}

// GLSL injected into the vertex shader via onBeforeCompile.
// Computes per-instance "free swarm" position (aScatter + wind noise) and
// mixes it with the "home" (image) position using uGather, on the GPU.
const VOXEL_VERTEX_UNIFORMS_GLSL = `
in vec3 aHome;
in vec3 aScatter;
in vec3 aColor;
out vec3 vIVSColor;
uniform float uTime;
uniform float uGather;
uniform float uWind;

float voxelHash(vec3 p, float seed) {
  float s = sin(dot(p, vec3(127.1, 311.7, 74.7)) + seed * 43.123) * 43758.5453;
  return fract(s);
}
`;

const VOXEL_BEGIN_VERTEX_GLSL = `
vIVSColor = aColor;

vec3 windNoise = vec3(
  voxelHash(aHome, 0.0),
  voxelHash(aHome, 1.0),
  voxelHash(aHome, 2.0)
) * 2.0 - 1.0;

vec3 freePos = aScatter;
freePos.x += sin(uTime * 0.5 + windNoise.x * 6.28318) * uWind * 2.0;
freePos.y += cos(uTime * 0.4 + windNoise.y * 6.28318) * uWind * 2.0;
freePos.z += sin(uTime * 0.6 + windNoise.z * 6.28318) * uWind * 2.0;

vec3 transformed = position + mix(freePos, aHome, uGather);
`;

const VOXEL_FRAGMENT_VARYING_GLSL = `
in vec3 vIVSColor;
`;

export function ImageVoxelSwarm({ imageFile, voxelResolution, voxelSpacing, windStrength, gatherStrength }: ImageVoxelSwarmProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const color = useMemo(() => new THREE.Color(), []);
  const uniformsRef = useRef<{ uTime: { value: number }; uGather: { value: number }; uWind: { value: number } } | null>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3));
    geo.setAttribute('aScatter', new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3));
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uGather = { value: gatherStrength };
      shader.uniforms.uWind = { value: windStrength };
      uniformsRef.current = shader.uniforms as typeof uniformsRef.current & object;

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${VOXEL_VERTEX_UNIFORMS_GLSL}`)
        .replace('#include <begin_vertex>', VOXEL_BEGIN_VERTEX_GLSL);

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${VOXEL_FRAGMENT_VARYING_GLSL}`)
        .replace('#include <dithering_fragment>', `gl_FragColor.rgb *= vIVSColor;\n#include <dithering_fragment>`);
    };
    return mat;
  }, []);

  useEffect(() => {
    if (meshRef.current) meshRef.current.count = 0;
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Clamp resolution so instance count never exceeds MAX_INSTANCES
    const maxRes = Math.floor(Math.sqrt(MAX_INSTANCES));
    const clampedResolution = Math.min(voxelResolution, maxRes);

    analyzeImagePixels(imageFile, clampedResolution).then((pixels) => {
      if (cancelled) return;

      const limited = pixels.slice(0, MAX_INSTANCES);
      const mesh = meshRef.current;
      if (!mesh) return;

      const homeAttr = geometry.getAttribute('aHome') as THREE.InstancedBufferAttribute;
      const scatterAttr = geometry.getAttribute('aScatter') as THREE.InstancedBufferAttribute;
      const colorAttr = geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute;
      const half = clampedResolution / 2;
      // Keep the overall image size roughly constant regardless of resolution,
      // so higher resolutions add detail instead of expanding off-screen.
      const cellSize = voxelSpacing * (16 / clampedResolution);
      const scaleMatrix = new THREE.Matrix4().makeScale(cellSize, cellSize, cellSize);

      for (let i = 0; i < limited.length; i++) {
        const p = limited[i];

        // Home position: image grid centered at origin, Y flipped (image Y grows downward)
        homeAttr.setXYZ(i, (p.x - half) * cellSize, (half - p.y) * cellSize, 0);

        // Scatter position: random point on a sphere around the origin
        const r = 8 + Math.random() * 6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        scatterAttr.setXYZ(i, r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));

        color.setRGB(p.r / 255, p.g / 255, p.b / 255);
        colorAttr.setXYZ(i, color.r, color.g, color.b);
        mesh.setMatrixAt(i, scaleMatrix);
      }

      homeAttr.needsUpdate = true;
      scatterAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.count = limited.length;
    });

    return () => {
      cancelled = true;
    };
  }, [imageFile, voxelResolution, voxelSpacing, geometry, color]);

  useFrame((state) => {
    const u = uniformsRef.current;
    if (!u) return;
    u.uTime.value = state.clock.elapsedTime;
    u.uGather.value = THREE.MathUtils.clamp(gatherStrength, 0, 1);
    u.uWind.value = windStrength;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_INSTANCES]} frustumCulled={false} />
  );
}

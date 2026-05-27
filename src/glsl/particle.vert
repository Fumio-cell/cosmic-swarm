uniform float uTime;
uniform sampler2D uAudioData;
uniform float uAudioReactiveness;
uniform float uChaos;
uniform float uDensity;
uniform float uFlicker;
uniform float uParticleSize;
uniform float uLiquidFusion;
uniform float uBass;
uniform float uTreble;

attribute float aSize;
attribute vec3 aColor;
attribute float aAudioIndex;

varying vec3 vColor;
varying float vAudioValue;
varying float vDepth;

void main() {
  if (aAudioIndex > uDensity) {
    gl_Position = vec4(9999.0, 9999.0, 9999.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  vColor = aColor;

  // Sample audio texture (1D data packed into 2D texture, so y=0.5)
  // uAudioData has the frequency data in the red channel (0.0 to 1.0)
  vec4 audioSample = texture2D(uAudioData, vec2(aAudioIndex, 0.5));
  float audioValue = audioSample.r;
  vAudioValue = audioValue;

  vec3 pos = position;
  

  
  // Apply advanced audio reaction mechanics
  float dist = length(pos);
  vDepth = dist; // Pass to fragment shader for structural color
  
  // 1. Treble: High-frequency surface ripples
  float highRipple = sin(dist * 10.0 - uTime * 15.0) * uTreble;
  
  // Expand outwards in 3D
  float posLen = length(pos);
  vec3 dir = posLen > 0.001 ? pos / posLen : vec3(0.0, 1.0, 0.0);
  
  // 2. Bass: Massive expansion and slow oozing
  float oozeNoise = sin(pos.x * 0.2 + uTime * 0.2) * cos(pos.y * 0.2 - uTime * 0.1) * sin(pos.z * 0.2 + uTime * 0.3);
  pos += dir * (highRipple + oozeNoise * audioValue) * uAudioReactiveness * 1.5;
  pos += dir * uBass * uAudioReactiveness * 2.0; // Global expansion on kick
  
  // Baseline gentle heartbeat expansion
  pos += dir * audioValue * uAudioReactiveness * 0.5 * (1.0 + aAudioIndex * 0.2);

  // Apply Chaos / Turbulence (smooth, gentle fluid dynamics)
  vec3 noiseOffset = vec3(
    sin(pos.y * 0.4 + uTime * 0.6) + sin(pos.z * 0.2 + uTime * 0.3),
    cos(pos.z * 0.4 + uTime * 0.5) + cos(pos.x * 0.2 + uTime * 0.4),
    sin(pos.x * 0.4 - uTime * 0.6) + sin(pos.y * 0.2 - uTime * 0.5)
  );
  pos += noiseOffset * uChaos * 3.0;
  
  // 3. Droplet Separation: High turbulence + Bass kick separates particles completely
  // Create a blocky pseudo-noise mask
  float separationMask = sin(pos.x * 0.5) * cos(pos.y * 0.5) * sin(pos.z * 0.5);
  // Only affect particles in the "peaks" of the noise
  float dropletMask = smoothstep(0.6, 0.9, abs(separationMask));
  pos += dir * dropletMask * uChaos * uBass * 15.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Exaggerate size perspective for stronger 3D feel
  float pSize = aSize * (50.0 / max(-mvPosition.z, 0.1)) * (1.0 + audioValue * 2.0 * uFlicker) * uParticleSize;
  
  // Clamp minimum size to 1.5 to prevent extreme sub-pixel aliasing (twinkling) when moving
  float distToCamera = length(mvPosition.xyz);
  float fusionScale = mix(1.0, 2.5, uLiquidFusion); // Moderated scale so it doesn't become one giant blob
  gl_PointSize = clamp(pSize * fusionScale, 1.5, 800.0);
  gl_Position = projectionMatrix * mvPosition;
}

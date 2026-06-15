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
uniform float uGather;
uniform float uWind;

attribute vec3 aHome;
attribute vec3 aColor;
attribute float aSize;
attribute float aAudioIndex;

varying vec3 vColor;
varying float vAudioValue;
varying float vDepth;

float voxelHash(vec3 p, float seed) {
  float s = sin(dot(p, vec3(127.1, 311.7, 74.7)) + seed * 43.123) * 43758.5453;
  return fract(s);
}

void main() {
  if (aAudioIndex > uDensity) {
    gl_Position = vec4(9999.0, 9999.0, 9999.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  vColor = aColor;

  vec4 audioSample = texture2D(uAudioData, vec2(aAudioIndex, 0.5));
  float audioValue = audioSample.r;
  vAudioValue = audioValue;

  // Free-swarm position: scattered start point drifting on wind noise
  vec3 windNoise = vec3(
    voxelHash(aHome, 0.0),
    voxelHash(aHome, 1.0),
    voxelHash(aHome, 2.0)
  ) * 2.0 - 1.0;

  vec3 scatterPos = position;
  scatterPos.x += sin(uTime * 0.5 + windNoise.x * 6.28318) * uWind * 2.0;
  scatterPos.y += cos(uTime * 0.4 + windNoise.y * 6.28318) * uWind * 2.0;
  scatterPos.z += sin(uTime * 0.6 + windNoise.z * 6.28318) * uWind * 2.0;

  // Gather between the free swarm and the image layout
  vec3 pos = mix(scatterPos, aHome, uGather);

  // --- Same audio reaction mechanics as the main particle swarm ---
  float dist = length(pos);
  vDepth = dist;

  float highRipple = sin(dist * 10.0 - uTime * 15.0) * uTreble;

  float posLen = length(pos);
  vec3 dir = posLen > 0.001 ? pos / posLen : vec3(0.0, 1.0, 0.0);

  float oozeNoise = sin(pos.x * 0.2 + uTime * 0.2) * cos(pos.y * 0.2 - uTime * 0.1) * sin(pos.z * 0.2 + uTime * 0.3);
  pos += dir * (highRipple + oozeNoise * audioValue) * uAudioReactiveness * 1.5;
  pos += dir * uBass * uAudioReactiveness * 2.0;
  pos += dir * audioValue * uAudioReactiveness * 0.5 * (1.0 + aAudioIndex * 0.2);

  vec3 noiseOffset = vec3(
    sin(pos.y * 0.4 + uTime * 0.6) + sin(pos.z * 0.2 + uTime * 0.3),
    cos(pos.z * 0.4 + uTime * 0.5) + cos(pos.x * 0.2 + uTime * 0.4),
    sin(pos.x * 0.4 - uTime * 0.6) + sin(pos.y * 0.2 - uTime * 0.5)
  );
  pos += noiseOffset * uChaos * 3.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  float pSize = aSize * (50.0 / max(-mvPosition.z, 0.1)) * (1.0 + audioValue * 2.0 * uFlicker) * uParticleSize;
  float fusionScale = mix(1.0, 2.5, uLiquidFusion);
  gl_PointSize = clamp(pSize * fusionScale, 3.0, 800.0);
  gl_Position = projectionMatrix * mvPosition;
}

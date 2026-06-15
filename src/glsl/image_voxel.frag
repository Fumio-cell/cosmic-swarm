varying vec3 vColor;
varying float vAudioValue;
varying float vDepth;
uniform float uBrightness;
uniform float uFlicker;
uniform float uLiquidFusion;
uniform float uHueShift;
uniform float uSaturation;

vec3 shiftHue(vec3 color, float hue) {
  const vec3 k = vec3(0.57735, 0.57735, 0.57735);
  float cosAngle = cos(hue);
  return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

void main() {
  // Flat square pixel block, no glow - the raw image color itself,
  // shifted/desaturated by the same controls as the main swarm and
  // modulated by audio so it can still react to sound.
  vec3 shifted = shiftHue(vColor, uHueShift * 6.2831853);
  float luma = dot(shifted, vec3(0.299, 0.587, 0.114));
  vec3 desaturated = mix(vec3(luma), shifted, uSaturation);
  vec3 finalColor = desaturated * (1.0 + vAudioValue * 0.5 * uFlicker) * uBrightness;
  gl_FragColor = vec4(finalColor, 1.0);
}

varying vec3 vColor;
varying float vAudioValue;
varying float vDepth;
uniform float uBrightness;
uniform float uFlicker;
uniform float uLiquidFusion;

void main() {
  // Flat square pixel block, no glow - the raw image color itself,
  // just slightly modulated by audio so it can still react to sound.
  vec3 finalColor = vColor * (1.0 + vAudioValue * 0.5 * uFlicker) * uBrightness;
  gl_FragColor = vec4(finalColor, 1.0);
}

varying vec3 vColor;
varying float vAudioValue;
varying float vDepth;
uniform float uBrightness;
uniform float uFlicker;
uniform float uLiquidFusion;

void main() {
  // Circular soft particle
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist > 0.5) discard;

  // Audio increases brightness and intensity, image colors stay true to source
  vec3 finalColor = vColor * (1.0 + vAudioValue * 1.5 * uFlicker) * uBrightness;

  float baseAlpha = (0.5 - dist) * 2.0;
  float fusionAlpha = exp(-dist * dist * 12.0);
  float alpha = mix(baseAlpha, fusionAlpha, uLiquidFusion);

  gl_FragColor = vec4(finalColor, alpha);
}

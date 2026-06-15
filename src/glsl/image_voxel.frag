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

  // Boost saturation/vibrancy directly from the source RGB so colors pop
  // against the black background instead of looking washed out.
  float luma = dot(vColor, vec3(0.299, 0.587, 0.114));
  vec3 vivid = clamp(luma + (vColor - luma) * 1.8, 0.0, 1.0);

  // Audio increases brightness and intensity, image colors stay true to source
  vec3 finalColor = vivid * (1.0 + vAudioValue * 1.5 * uFlicker) * uBrightness * 1.4;

  float baseAlpha = (0.5 - dist) * 2.0;
  float fusionAlpha = exp(-dist * dist * 12.0);
  float alpha = mix(baseAlpha, fusionAlpha, uLiquidFusion);

  gl_FragColor = vec4(finalColor, alpha);
}

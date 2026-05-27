varying vec3 vColor;
varying float vAudioValue;
uniform float uHueShift;
uniform float uBrightness;
uniform float uSaturation;
uniform float uFlicker;
uniform float uLiquidFusion;
varying float vDepth;

vec3 shiftHue(vec3 color, float hue) {
  const vec3 k = vec3(0.57735, 0.57735, 0.57735);
  float cosAngle = cos(hue);
  return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

void main() {
  // Circular soft particle
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist > 0.5) discard;
  
  // Apply hue shift and structural color (iridescence) based on depth/distance from center
  // If Liquid Fusion is ON, enhance the iridescent effect, giving it a soap-bubble or oil-slick look
  float structuralShift = vDepth * 0.2 * uLiquidFusion;
  vec3 shiftedColor = shiftHue(vColor, uHueShift * 6.2831853 + structuralShift);
  
  // Apply saturation (mix towards pure white when saturation is 0)
  vec3 desaturatedColor = mix(vec3(1.0), shiftedColor, uSaturation);
  
  // Audio increases brightness and intensity
  vec3 finalColor = desaturatedColor * (1.0 + vAudioValue * 1.5 * uFlicker) * uBrightness;
  
  float baseAlpha = (0.5 - dist) * 2.0;
  // A wide, massive, soft bell-curve that bleeds out to the edge for maximum overlap
  float fusionAlpha = exp(-dist * dist * 12.0);
  float alpha = mix(baseAlpha, fusionAlpha, uLiquidFusion);
  
  gl_FragColor = vec4(finalColor, alpha);
}

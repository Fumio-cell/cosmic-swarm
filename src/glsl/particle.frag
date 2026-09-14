varying vec3 vColor;
varying float vOpacity;
varying float vAudioValue;
uniform float uHueShift;
uniform float uBrightness;
uniform float uSaturation;
uniform float uFlicker;
uniform float uLiquidFusion;
uniform float uTrailOpacity;
uniform float uFogDensity;
varying float vDepth;
varying float vCameraDist;

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

  // 疑似的な球のシェーディング：点を半球として扱い、片側を明るく片側を暗くする
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  float sphereZ = sqrt(max(1.0 - dot(p, p), 0.0));
  vec3 sphereNormal = normalize(vec3(p.x, p.y, sphereZ));
  vec3 lightDir = normalize(vec3(-0.4, 0.6, 0.7));
  float diffuse = max(dot(sphereNormal, lightDir), 0.0);
  float shading = mix(0.45, 1.15, diffuse);
  finalColor *= shading;

  // 奥行きフォグ：カメラから遠い粒ほど暗くする
  float fogFactor = exp(-uFogDensity * uFogDensity * vCameraDist * vCameraDist);
  finalColor *= fogFactor;
  
  float baseAlpha = 1.0 - smoothstep(0.0, 0.5, dist);
  // A wide, massive, soft bell-curve that bleeds out to the edge for maximum overlap
  float fusionAlpha = exp(-dist * dist * 12.0);
  float alpha = mix(baseAlpha, fusionAlpha, uLiquidFusion);
  alpha *= vOpacity;
  alpha *= uTrailOpacity;
  
  gl_FragColor = vec4(finalColor, alpha);
}

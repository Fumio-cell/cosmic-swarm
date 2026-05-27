import { forwardRef, useMemo } from 'react';
import { Effect } from 'postprocessing';

const fragmentShader = `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Calculate relative luminance of the accumulated particle buffer
  float luma = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  
  // Thresholding for Goo / Metaball effect
  float mask = smoothstep(0.12, 0.25, luma);
  
  // Anti-Halation (白飛び防止): Additive blending causes RGB to exceed 1.0 (pure white).
  // By normalizing the vector, we perfectly preserve the original neon hue (Cyan/Green),
  // and use a logarithmic curve to compress the extreme brightness.
  vec3 color = inputColor.rgb;
  float len = length(color);
  if (len > 0.001) {
    vec3 dir = color / len;
    // log curve compresses 10.0 -> 2.3, preventing pure white blowout while keeping it bright
    float compressedLen = log(1.0 + len) * 1.5; 
    color = dir * compressedLen;
  }
  
  vec3 finalColor = color * mask;
  
  outputColor = vec4(finalColor, inputColor.a * mask);
}
`;

class GooEffectImpl extends Effect {
  constructor() {
    super('GooEffect', fragmentShader, {
      uniforms: new Map()
    });
  }
}

export const GooEffect = forwardRef((_props: any, ref) => {
  const effect = useMemo(() => new GooEffectImpl(), []);
  // @ts-ignore - R3F primitive ref
  return <primitive ref={ref} object={effect} dispose={null} />;
});

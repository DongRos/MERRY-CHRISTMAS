import React from 'react';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';

interface PostEffectsProps {
  blurLevel: number;
}

/**
 * Optimized for stability to prevent flickering (flash).
 * Higher luminanceThreshold ensures only genuine highlights bloom.
 */
export default function PostEffects({ blurLevel }: PostEffectsProps) {
  return (
    <EffectComposer 
      disableNormalPass 
      multisampling={0} // [修改] 关闭多重采样以修复手机端崩溃问题
    >
      <DepthOfField
        target={[0, 0, 100]} 
        focalLength={0.1} 
        bokehScale={blurLevel * 8} 
        height={720} // Higher resolution DoF buffer for stability
      />
      <Bloom 
        luminanceThreshold={1.4} // Increased to prevent flickering from medium-bright pixels
        intensity={1.2} 
        radius={0.7} 
        mipmapBlur 
      />
      <Vignette eskil={false} offset={0.1} darkness={1.0} />
      {/* Noise removed as it is the primary cause of high-frequency flickering */}
    </EffectComposer>
  );
}

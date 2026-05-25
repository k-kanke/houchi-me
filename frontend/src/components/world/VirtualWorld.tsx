'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import WorldScene from './WorldScene';

export default function VirtualWorld() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [6, 4, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{
          background:
            'radial-gradient(900px 600px at 50% 20%, rgba(163,120,255,0.16), transparent 60%), linear-gradient(180deg,#06060c,#0a0820 60%, #07061a 100%)',
        }}
      >
        <fog attach="fog" args={['#0a0820', 12, 32]} />
        <Suspense fallback={null}>
          <WorldScene />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

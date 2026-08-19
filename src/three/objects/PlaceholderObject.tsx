'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

type PlaceholderObjectProps = {
  animate: boolean;
};

/**
 * Stand-in until the Claude Design scene is ported. Exists to prove the loader,
 * disposal and reduced-motion paths end to end — not to be kept.
 */
export function PlaceholderObject({ animate }: PlaceholderObjectProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!animate || !meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.35;
    meshRef.current.rotation.x += delta * 0.12;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 0]} />
      <meshStandardMaterial color="#6366f1" flatShading roughness={0.35} metalness={0.1} />
    </mesh>
  );
}

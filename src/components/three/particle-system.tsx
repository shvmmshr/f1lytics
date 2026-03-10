"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleSystemProps {
  active: boolean;
  count?: number;
}

export function ParticleSystem({ active, count = 200 }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const frameCount = useRef(0);
  const wasActive = useRef(false);

  // Base positions in a cone shape behind the rear of the car (positive X)
  const basePositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const spread = Math.random();
      // Cone expanding in +X direction (behind the car which faces -X)
      positions[i * 3] = 1.8 + spread * 0.5; // x: behind rear
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4 * spread; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6 * spread; // z
    }
    return positions;
  }, [count]);

  // Velocity vectors for each particle
  const velocities = useMemo(() => {
    const vels = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      vels[i * 3] = 0.02 + Math.random() * 0.04; // spread in +X
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // slight y drift
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // slight z drift
    }
    return vels;
  }, [count]);

  // Reset particles when active becomes true
  useEffect(() => {
    if (active && !wasActive.current) {
      frameCount.current = 0;
      const geom = pointsRef.current?.geometry;
      if (geom) {
        const pos = geom.attributes.position as THREE.BufferAttribute;
        pos.array.set(basePositions);
        pos.needsUpdate = true;
      }
    }
    wasActive.current = active;
  }, [active, basePositions]);

  useFrame(() => {
    if (!pointsRef.current || !materialRef.current) return;

    if (active || frameCount.current > 0) {
      if (active) {
        frameCount.current = Math.min(frameCount.current + 1, 60);
      }

      const progress = frameCount.current / 60;
      materialRef.current.opacity = Math.max(0, 1 - progress);

      // Spread particles outward
      const geom = pointsRef.current.geometry;
      const pos = geom.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      for (let i = 0; i < count; i++) {
        arr[i * 3] += velocities[i * 3];
        arr[i * 3 + 1] += velocities[i * 3 + 1];
        arr[i * 3 + 2] += velocities[i * 3 + 2];
      }
      pos.needsUpdate = true;

      // Once fully faded and no longer active, reset
      if (!active && progress >= 1) {
        frameCount.current = 0;
        materialRef.current.opacity = 0;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[basePositions.slice(), 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.03}
        color="#AAAAAA"
        transparent
        depthWrite={false}
        opacity={0}
      />
    </points>
  );
}

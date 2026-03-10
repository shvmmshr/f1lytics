"use client";

import { forwardRef } from "react";
import { Group } from "three";
import { RoundedBox, Cylinder, Torus } from "@react-three/drei";

interface F1CarProps {
  color?: string;
}

export const F1Car = forwardRef<Group, F1CarProps>(function F1Car(
  { color = "#E8002D" },
  ref
) {
  const accentDark = "#1A1A1A";
  const wingSupport = "#2A2A2A";

  return (
    <group ref={ref}>
      {/* ── Main Body ── */}
      <RoundedBox
        args={[3.5, 0.15, 0.8]}
        radius={0.04}
        smoothness={4}
        position={[0, 0.2, 0]}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      </RoundedBox>

      {/* ── Nose Cone ── tapered box extending forward (negative X) */}
      <mesh position={[-2.1, 0.2, 0]} scale={[1, 1, 0.5]}>
        <boxGeometry args={[0.8, 0.1, 0.4]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* ── Front Wing ── wide thin plane at the front */}
      <mesh position={[-2.55, 0.08, 0]}>
        <boxGeometry args={[0.35, 0.025, 1.1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Front wing endplates */}
      <mesh position={[-2.55, 0.12, 0.55]}>
        <boxGeometry args={[0.35, 0.12, 0.02]} />
        <meshStandardMaterial color={accentDark} />
      </mesh>
      <mesh position={[-2.55, 0.12, -0.55]}>
        <boxGeometry args={[0.35, 0.12, 0.02]} />
        <meshStandardMaterial color={accentDark} />
      </mesh>

      {/* ── Rear Wing ── main plane */}
      <mesh position={[1.7, 0.65, 0]}>
        <boxGeometry args={[0.3, 0.025, 0.85]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Rear wing DRS flap */}
      <mesh position={[1.7, 0.72, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Rear wing supports (vertical pillars) */}
      <mesh position={[1.55, 0.42, 0.25]}>
        <boxGeometry args={[0.04, 0.45, 0.04]} />
        <meshStandardMaterial color={wingSupport} />
      </mesh>
      <mesh position={[1.55, 0.42, -0.25]}>
        <boxGeometry args={[0.04, 0.45, 0.04]} />
        <meshStandardMaterial color={wingSupport} />
      </mesh>

      {/* ── Sidepods ── */}
      <RoundedBox
        args={[1.4, 0.2, 0.25]}
        radius={0.05}
        smoothness={4}
        position={[-0.1, 0.3, 0.45]}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      </RoundedBox>
      <RoundedBox
        args={[1.4, 0.2, 0.25]}
        radius={0.05}
        smoothness={4}
        position={[-0.1, 0.3, -0.45]}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      </RoundedBox>

      {/* ── Halo ── partial torus arc above cockpit */}
      <Torus
        args={[0.2, 0.025, 8, 24, Math.PI]}
        position={[-0.6, 0.38, 0]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color={accentDark} metalness={0.7} roughness={0.2} />
      </Torus>

      {/* ── Wheels ── */}
      {/* Front left */}
      <Cylinder
        args={[0.17, 0.17, 0.14, 16]}
        position={[-1.4, 0.05, 0.55]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={accentDark} roughness={0.9} />
      </Cylinder>
      {/* Front right */}
      <Cylinder
        args={[0.17, 0.17, 0.14, 16]}
        position={[-1.4, 0.05, -0.55]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={accentDark} roughness={0.9} />
      </Cylinder>
      {/* Rear left */}
      <Cylinder
        args={[0.2, 0.2, 0.16, 16]}
        position={[1.2, 0.05, 0.55]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={accentDark} roughness={0.9} />
      </Cylinder>
      {/* Rear right */}
      <Cylinder
        args={[0.2, 0.2, 0.16, 16]}
        position={[1.2, 0.05, -0.55]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={accentDark} roughness={0.9} />
      </Cylinder>

      {/* ── Floor / Diffuser ── */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[3.6, 0.03, 0.85]} />
        <meshStandardMaterial color={accentDark} />
      </mesh>
    </group>
  );
});

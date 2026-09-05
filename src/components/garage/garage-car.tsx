"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import type { Livery } from "@/lib/garage/liveries";

/**
 * A stylised open-wheel car built entirely from primitives: no downloaded
 * model, nothing anyone else owns. Proportions follow the 2026 regulations
 * loosely (shorter wheelbase, narrower floor) without copying any team's car.
 * Units are metres-ish; the car is about 5 long and 1.9 wide.
 */

const TYRE = "#111114";
const CARBON = "#1A1A1F";

function Wheel({ position, rim }: { position: [number, number, number]; rim: string }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.34, 32]} />
        <meshStandardMaterial color={TYRE} roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.35, 24]} />
        <meshStandardMaterial color={rim} roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  );
}

function Arm({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dy, dz);
  // Rotate a Y-aligned cylinder onto the segment direction.
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.acos(dy / len);
  return (
    <mesh position={mid} rotation={[pitch, yaw, 0]}>
      <cylinderGeometry args={[0.02, 0.02, len, 8]} />
      <meshStandardMaterial color={CARBON} roughness={0.6} />
    </mesh>
  );
}

function Car({ livery, spinning }: { livery: Livery; spinning: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (spinning && group.current) group.current.rotation.y += delta * 0.25;
  });
  const body = useMemo(() => ({ color: livery.primary, roughness: 0.35, metalness: 0.25 }), [livery.primary]);
  const second = useMemo(() => ({ color: livery.secondary, roughness: 0.4, metalness: 0.2 }), [livery.secondary]);
  const accent = useMemo(() => ({ color: livery.accent, roughness: 0.4, metalness: 0.2 }), [livery.accent]);

  return (
    <group ref={group} position={[0, 0.36, 0]}>
      {/* Floor and plank */}
      <mesh position={[0, -0.05, 0.1]} receiveShadow>
        <boxGeometry args={[1.5, 0.05, 3.4]} />
        <meshStandardMaterial color={CARBON} roughness={0.8} />
      </mesh>
      {/* Monocoque */}
      <mesh position={[0, 0.25, 0.3]} castShadow>
        <boxGeometry args={[0.62, 0.42, 2.6]} />
        <meshStandardMaterial {...body} />
      </mesh>
      {/* Nose: tapered towards the front (negative z) */}
      <mesh position={[0, 0.16, -1.85]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.3, 1.5, 12, 1]} />
        <meshStandardMaterial {...body} />
      </mesh>
      {/* Sidepods, undercut at the front */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.62, 0.16, 0.55]} castShadow>
            <boxGeometry args={[0.55, 0.34, 1.7]} />
            <meshStandardMaterial {...second} />
          </mesh>
          <mesh position={[side * 0.55, 0.36, 0.25]}>
            <boxGeometry args={[0.32, 0.12, 1.2]} />
            <meshStandardMaterial {...body} />
          </mesh>
        </group>
      ))}
      {/* Airbox and engine cover */}
      <mesh position={[0, 0.66, 0.35]} castShadow>
        <boxGeometry args={[0.34, 0.34, 0.5]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[0, 0.5, 1.15]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.3, 0.32, 1.5]} />
        <meshStandardMaterial {...body} />
      </mesh>
      {/* Shark fin */}
      <mesh position={[0, 0.78, 1.5]}>
        <boxGeometry args={[0.02, 0.28, 0.9]} />
        <meshStandardMaterial {...second} />
      </mesh>
      {/* Halo */}
      <mesh position={[0, 0.72, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.36, 0.035, 12, 32, Math.PI]} />
        <meshStandardMaterial color={CARBON} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, -0.6]} rotation={[0.55, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.32, 8]} />
        <meshStandardMaterial color={CARBON} roughness={0.5} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 0.62, -0.2]} castShadow>
        <sphereGeometry args={[0.16, 24, 16]} />
        <meshStandardMaterial {...accent} />
      </mesh>
      {/* Front wing */}
      <mesh position={[0, -0.02, -2.45]} castShadow>
        <boxGeometry args={[1.9, 0.03, 0.42]} />
        <meshStandardMaterial {...second} />
      </mesh>
      <mesh position={[0, 0.06, -2.3]}>
        <boxGeometry args={[1.7, 0.03, 0.22]} />
        <meshStandardMaterial {...accent} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.95, 0.08, -2.4]}>
          <boxGeometry args={[0.03, 0.22, 0.5]} />
          <meshStandardMaterial {...second} />
        </mesh>
      ))}
      {/* Rear wing */}
      <mesh position={[0, 0.78, 2.0]} castShadow>
        <boxGeometry args={[1.05, 0.04, 0.34]} />
        <meshStandardMaterial {...second} />
      </mesh>
      <mesh position={[0, 0.64, 2.06]}>
        <boxGeometry args={[1.0, 0.03, 0.22]} />
        <meshStandardMaterial {...accent} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.53, 0.62, 2.0]}>
          <boxGeometry args={[0.03, 0.4, 0.5]} />
          <meshStandardMaterial {...second} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.2, 0.42, 2.05]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.04, 0.4, 0.05]} />
          <meshStandardMaterial color={CARBON} />
        </mesh>
      ))}
      {/* Suspension */}
      <Arm from={[0.3, 0.3, -1.4]} to={[0.75, 0.32, -1.5]} />
      <Arm from={[-0.3, 0.3, -1.4]} to={[-0.75, 0.32, -1.5]} />
      <Arm from={[0.3, 0.05, -1.3]} to={[0.75, 0.05, -1.5]} />
      <Arm from={[-0.3, 0.05, -1.3]} to={[-0.75, 0.05, -1.5]} />
      <Arm from={[0.3, 0.3, 1.5]} to={[0.75, 0.32, 1.6]} />
      <Arm from={[-0.3, 0.3, 1.5]} to={[-0.75, 0.32, 1.6]} />
      <Arm from={[0.3, 0.05, 1.4]} to={[0.75, 0.05, 1.6]} />
      <Arm from={[-0.3, 0.05, 1.4]} to={[-0.75, 0.05, 1.6]} />
      {/* Wheels */}
      <Wheel position={[0.95, 0, -1.5]} rim={livery.rim} />
      <Wheel position={[-0.95, 0, -1.5]} rim={livery.rim} />
      <Wheel position={[0.95, 0, 1.6]} rim={livery.rim} />
      <Wheel position={[-0.95, 0, 1.6]} rim={livery.rim} />
    </group>
  );
}

export function GarageCar({ livery, spinning }: { livery: Livery; spinning: boolean }) {
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [5.4, 2.4, 6.0], fov: 36 }} style={{ touchAction: "none" }}>
      <color attach="background" args={["#0C0C0E"]} />
      <hemisphereLight args={["#F4F4F5", "#26262E", 0.55]} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -4]} intensity={0.8} color="#FF1801" />
      <Car livery={livery} spinning={spinning} />
      <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={12} blur={2.4} far={2} />
      <gridHelper args={[14, 28, "#27272A", "#1C1C22"]} position={[0, -0.001, 0]} />
      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={11} maxPolarAngle={Math.PI / 2.05} makeDefault />
    </Canvas>
  );
}

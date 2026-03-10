"use client";

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, Line } from "@react-three/drei";
import * as THREE from "three";

interface GlobeCircuit {
  id: string;
  lat: number;
  lng: number;
  name: string;
  isSprint: boolean;
}

interface CircuitGlobeProps {
  circuits: GlobeCircuit[];
}

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/** Loads /land.json (simplified Natural Earth land polygons) and renders as 3D lines */
function ContinentOutlines({ radius }: { radius: number }) {
  const [polygons, setPolygons] = useState<[number, number][][]>([]);

  useEffect(() => {
    fetch("/land.json")
      .then((res) => res.json())
      .then((data: [number, number][][]) => setPolygons(data))
      .catch(() => {});
  }, []);

  const lines = useMemo(() => {
    return polygons.map((ring) =>
      ring.map(([lat, lng]) => {
        const v = latLngToVector3(lat, lng, radius);
        return [v.x, v.y, v.z] as [number, number, number];
      })
    );
  }, [polygons, radius]);

  return (
    <>
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#52525B"
          lineWidth={1.2}
          transparent
          opacity={0.5}
        />
      ))}
    </>
  );
}

function CircuitMarker({
  circuit,
  radius,
}: {
  circuit: GlobeCircuit;
  radius: number;
}) {
  const [hovered, setHovered] = useState(false);
  const position = latLngToVector3(circuit.lat, circuit.lng, radius);
  const color = circuit.isSprint ? "#EAB308" : "#3B82F6";
  const markerRadius = circuit.isSprint ? 0.03 : 0.02;

  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut = useCallback(() => setHovered(false), []);

  return (
    <group position={position}>
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[markerRadius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2 : 0.8}
        />
      </mesh>
      {/* Glow ring around marker */}
      <mesh>
        <sphereGeometry args={[markerRadius * 2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.3 : 0.15}
        />
      </mesh>
      {hovered && (
        <Html
          distanceFactor={4}
          style={{
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div className="rounded-md border border-white/10 bg-[#0C0C0E]/90 px-3 py-1.5 text-xs text-[#F4F4F5] shadow-lg backdrop-blur-sm">
            {circuit.name}
            {circuit.isSprint && (
              <span className="ml-1.5 text-[10px] font-semibold uppercase text-yellow-400">
                Sprint
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function GlobeAtmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.08, 64, 64]} />
      <meshBasicMaterial
        color="#EF4444"
        transparent
        opacity={0.04}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function Globe({ circuits }: { circuits: GlobeCircuit[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const globeRadius = 1;

  return (
    <group ref={groupRef}>
      {/* Main globe sphere */}
      <Sphere args={[globeRadius, 64, 64]}>
        <meshStandardMaterial color="#1C1C22" roughness={0.8} metalness={0.2} />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[globeRadius + 0.002, 64, 64]}>
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.06}
        />
      </Sphere>

      {/* Continent outlines */}
      <ContinentOutlines radius={globeRadius + 0.003} />

      {/* Atmosphere glow */}
      <GlobeAtmosphere />

      {/* Circuit markers */}
      {circuits.map((circuit) => (
        <CircuitMarker
          key={circuit.id}
          circuit={circuit}
          radius={globeRadius + 0.01}
        />
      ))}
    </group>
  );
}

function SceneContent({ circuits }: { circuits: GlobeCircuit[] }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 2]} intensity={0.8} />
      <pointLight position={[-2, 1, -1]} color="#EF4444" intensity={0.3} />

      <Globe circuits={circuits} />

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={1.8}
        maxDistance={4}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-xs uppercase tracking-widest text-text-muted">
        Loading globe...
      </div>
    </div>
  );
}

export function CircuitGlobe({ circuits }: CircuitGlobeProps) {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary p-4">
      <p className="mb-3 text-xs uppercase tracking-widest text-text-muted">
        World Map
      </p>
      <div className="h-[450px] w-full overflow-hidden rounded-xl border border-border-subtle bg-bg-primary">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0.5, 2.8], fov: 45 }}
            style={{ background: "transparent" }}
            gl={{ alpha: true, antialias: true }}
          >
            <Suspense fallback={null}>
              <SceneContent circuits={circuits} />
            </Suspense>
          </Canvas>
        </Suspense>
      </div>
    </section>
  );
}

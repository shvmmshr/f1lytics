"use client";

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, Line } from "@react-three/drei";
import * as THREE from "three";

export interface GlobeCircuit {
  id: string;
  lat: number;
  lng: number;
  name: string;
  fullName: string;
  country: string;
  round: number;
  raceDate: string;
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

/* ── Continent outlines from /land.json ── */
function ContinentOutlines({ radius }: { radius: number }) {
  const [polygons, setPolygons] = useState<[number, number][][]>([]);

  useEffect(() => {
    fetch("/land.json")
      .then((res) => res.json())
      .then((data: [number, number][][]) => setPolygons(data))
      .catch((err) => { console.error("[f1lytics] land.json failed to load:", err); });
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
          color="#3f3f46"
          lineWidth={1}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  );
}

/* ── Circuit marker with rich tooltip ── */
function CircuitMarker({
  circuit,
  radius,
}: {
  circuit: GlobeCircuit;
  radius: number;
}) {
  const [hovered, setHovered] = useState(false);
  const position = latLngToVector3(circuit.lat, circuit.lng, radius);
  // All circuits have a race; sprint weekends get an accent ring
  const color = "#3B82F6";

  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut = useCallback(() => setHovered(false), []);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${circuit.raceDate}T00:00:00Z`));

  return (
    <group position={position}>
      {/* Clickable / hoverable sphere */}
      <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2.5 : 1}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.35 : 0.12}
        />
      </mesh>

      {/* Sprint accent ring */}
      {circuit.isSprint && (
        <mesh>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial
            color="#EAB308"
            transparent
            opacity={hovered ? 0.25 : 0.1}
          />
        </mesh>
      )}

      {/* Tooltip */}
      {hovered && (
        <Html
          distanceFactor={3.5}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <div
            className="rounded-lg border border-white/10 bg-[#0C0C0E]/95 px-4 py-3 shadow-xl backdrop-blur-md"
            style={{ minWidth: 180 }}
          >
            {/* Round badge + name */}
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                R{circuit.round}
              </span>
              <span className="text-sm font-semibold text-white">
                {circuit.fullName}
              </span>
            </div>

            {/* Details row */}
            <div className="mt-2 flex items-center gap-3 text-[11px] text-[#a1a1aa]">
              <span>{circuit.country}</span>
              <span className="opacity-30">|</span>
              <span>{formattedDate}</span>
              {circuit.isSprint && (
                <>
                  <span className="opacity-30">|</span>
                  <span className="font-semibold text-yellow-400">Sprint Weekend</span>
                </>
              )}
            </div>

            {/* Circuit name */}
            <div className="mt-1 text-[11px] text-[#71717a]">
              {circuit.name}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function GlobeAtmosphere() {
  return (
    <mesh>
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
  const R = 1;

  return (
    <group ref={groupRef}>
      {/* Dark globe surface */}
      <Sphere args={[R, 64, 64]}>
        <meshStandardMaterial color="#18181b" roughness={0.9} metalness={0.1} />
      </Sphere>

      {/* Subtle wireframe grid */}
      <Sphere args={[R + 0.001, 48, 48]}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.03} />
      </Sphere>

      {/* Continent outlines */}
      <ContinentOutlines radius={R + 0.002} />

      {/* Atmosphere glow */}
      <GlobeAtmosphere />

      {/* Circuit markers */}
      {circuits.map((circuit) => (
        <CircuitMarker key={circuit.id} circuit={circuit} radius={R + 0.008} />
      ))}
    </group>
  );
}

function SceneContent({ circuits }: { circuits: GlobeCircuit[] }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 2]} intensity={0.6} />
      <pointLight position={[-2, 1, -1]} color="#EF4444" intensity={0.2} />

      <Globe circuits={circuits} />

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
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
    <section
      style={{
        background: "#141418",
        borderTop: "1px solid #27272A",
        borderBottom: "1px solid #27272A",
        padding: "32px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400 }}>
        <div className="flex items-center gap-3.5 mb-4">
          <span
            className="font-mono"
            style={{
              color: "#FF1801",
              fontSize: 11,
              letterSpacing: "0.24em",
              fontWeight: 700,
            }}
          >
            WORLD MAP
          </span>
          <span style={{ width: 40, height: 1, background: "#27272A" }} />
          <span
            className="font-mono"
            style={{ color: "#A1A1AA", fontSize: 11, letterSpacing: "0.18em" }}
          >
            {circuits.length} STOPS · LIVE GLOBE
          </span>
        </div>
        <div
          className="h-[450px] w-full overflow-hidden"
          style={{ background: "#0C0C0E", border: "1px solid #27272A" }}
        >
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
      </div>
    </section>
  );
}

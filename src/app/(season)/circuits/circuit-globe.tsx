"use client";

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
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

/* ── Circuit marker — hovering reports the circuit upward so the info card can
   be rendered as a pinned DOM panel (never overflows the canvas). ── */
function CircuitMarker({
  circuit,
  radius,
  onHover,
}: {
  circuit: GlobeCircuit;
  radius: number;
  onHover: (c: GlobeCircuit | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const position = latLngToVector3(circuit.lat, circuit.lng, radius);
  const color = "#3B82F6";

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    onHover(circuit);
  }, [circuit, onHover]);
  const handlePointerOut = useCallback(() => {
    setHovered(false);
    onHover(null);
  }, [onHover]);

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
    </group>
  );
}

/* ── Info card (plain DOM) — pinned inside the globe box so it can't overflow.
   Broadcast design language: sharp edges, mono, accent top-rule. ── */
function CircuitInfoCard({ circuit }: { circuit: GlobeCircuit }) {
  // Brand red, amber on sprint weekends.
  const accent = circuit.isSprint ? "#EAB308" : "#FF1801";
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${circuit.raceDate}T00:00:00Z`));

  return (
    <div
      className="font-mono"
      style={{
        background: "rgba(8,8,10,0.97)",
        border: "1px solid #27272A",
        borderTop: `2px solid ${accent}`,
        padding: "10px 13px 11px",
        width: 240,
        maxWidth: "100%",
        boxShadow: "0 10px 30px rgba(0,0,0,0.65)",
      }}
    >
      {/* Round badge + GP name */}
      <div className="flex items-center gap-2.5">
        <span
          style={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#FFFFFF",
            background: "#18181b",
            border: "1px solid #27272A",
            padding: "2px 7px",
          }}
        >
          R{String(circuit.round).padStart(2, "0")}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#FFFFFF",
          }}
        >
          {circuit.fullName.replace(" Grand Prix", " GP")}
        </span>
      </div>

      {/* Country · date (· sprint) */}
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "#A1A1AA",
        }}
      >
        {circuit.country.toUpperCase()}
        <span style={{ opacity: 0.35, margin: "0 7px" }}>·</span>
        {formattedDate.toUpperCase()}
        {circuit.isSprint && (
          <>
            <span style={{ opacity: 0.35, margin: "0 7px" }}>·</span>
            <span style={{ color: "#EAB308", fontWeight: 700 }}>SPRINT</span>
          </>
        )}
      </div>

      {/* Circuit name */}
      <div
        style={{
          marginTop: 5,
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "#71717a",
        }}
      >
        {circuit.name.toUpperCase()}
      </div>
    </div>
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

/* Projects the hovered marker's 3D position to screen pixels each frame and
   positions the DOM info card imperatively, clamped inside the container so it
   tracks the marker but never overflows. */
function HoverCardPositioner({
  groupRef,
  hovered,
  containerRef,
  cardRef,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  hovered: GlobeCircuit | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { camera } = useThree();
  const localPos = useMemo(
    () => (hovered ? latLngToVector3(hovered.lat, hovered.lng, 1.008) : null),
    [hovered]
  );

  useFrame(() => {
    const card = cardRef.current;
    const container = containerRef.current;
    const group = groupRef.current;
    if (!card || !container || !group || !localPos) return;

    const world = localPos.clone().applyMatrix4(group.matrixWorld);

    // Hide when the marker is on the far hemisphere (facing away from camera).
    const facing = world.clone().normalize().dot(camera.position.clone().normalize());
    if (facing <= 0.02) {
      card.style.visibility = "hidden";
      return;
    }
    card.style.visibility = "visible";

    const ndc = world.clone().project(camera);
    const w = container.clientWidth;
    const h = container.clientHeight;
    const x = (ndc.x * 0.5 + 0.5) * w;
    const y = (-ndc.y * 0.5 + 0.5) * h;

    const cardW = card.offsetWidth || 240;
    const cardH = card.offsetHeight || 80;
    const pad = 10;
    let left = x - cardW / 2;
    let top = y - cardH - 16; // prefer above the marker
    if (top < pad) top = y + 16; // no room above → below
    left = Math.max(pad, Math.min(left, w - cardW - pad));
    top = Math.max(pad, Math.min(top, h - cardH - pad));
    card.style.transform = `translate(${left}px, ${top}px)`;
  });

  return null;
}

function Globe({
  circuits,
  onHover,
  groupRef,
}: {
  circuits: GlobeCircuit[];
  onHover: (c: GlobeCircuit | null) => void;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
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
        <CircuitMarker
          key={circuit.id}
          circuit={circuit}
          radius={R + 0.008}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

function SceneContent({
  circuits,
  onHover,
  hovered,
  containerRef,
  cardRef,
}: {
  circuits: GlobeCircuit[];
  onHover: (c: GlobeCircuit | null) => void;
  hovered: GlobeCircuit | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 2]} intensity={0.6} />
      <pointLight position={[-2, 1, -1]} color="#EF4444" intensity={0.2} />

      <Globe circuits={circuits} onHover={onHover} groupRef={groupRef} />
      <HoverCardPositioner
        groupRef={groupRef}
        hovered={hovered}
        containerRef={containerRef}
        cardRef={cardRef}
      />

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        minDistance={1.8}
        maxDistance={4}
      />
      <AllowPageScroll />
    </>
  );
}

/**
 * OrbitControls sets `touch-action: none` on the canvas, which swallows
 * single-finger vertical swipes — on a phone the page can't be scrolled past
 * the 450px globe. Restore `pan-y` so vertical swipes scroll the page while
 * horizontal drags still rotate the globe. Runs on a rAF because the controls
 * apply their style in their own mount effect.
 */
function AllowPageScroll() {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const el = gl.domElement;
    const id = requestAnimationFrame(() => {
      el.style.touchAction = "pan-y";
    });
    return () => cancelAnimationFrame(id);
  }, [gl]);
  return null;
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
  const [hovered, setHovered] = useState<GlobeCircuit | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  return (
    <section
      style={{
        background: "#141418",
        borderTop: "1px solid #27272A",
        borderBottom: "1px solid #27272A",
        padding: "clamp(16px, 4vw, 32px)",
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
          ref={containerRef}
          className="relative h-[450px] w-full overflow-hidden"
          style={{ background: "#0C0C0E", border: "1px solid #27272A" }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              camera={{ position: [0, 0.5, 2.8], fov: 45 }}
              style={{ background: "transparent" }}
              gl={{ alpha: true, antialias: true }}
            >
              <Suspense fallback={null}>
                <SceneContent
                  circuits={circuits}
                  onHover={setHovered}
                  hovered={hovered}
                  containerRef={containerRef}
                  cardRef={cardRef}
                />
              </Suspense>
            </Canvas>
          </Suspense>

          {/* Hover info card — follows the marker (positioned imperatively by
              HoverCardPositioner) and is clamped inside the box, so it appears
              next to the hovered point without ever overflowing. Starts off-
              screen so it never flashes at the origin before the first frame. */}
          {hovered && (
            <div
              ref={cardRef}
              className="pointer-events-none absolute"
              style={{
                top: 0,
                left: 0,
                zIndex: 10,
                transform: "translate(-1000px, -1000px)",
                willChange: "transform",
              }}
            >
              <CircuitInfoCard circuit={hovered} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

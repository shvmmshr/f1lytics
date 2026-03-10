"use client";

import { Suspense, useRef, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Group } from "three";
import { F1Car } from "./f1-car";
import { ParticleSystem } from "./particle-system";

interface F1CarSceneProps {
  particlesActive?: boolean;
}

export interface F1CarSceneHandle {
  carGroup: Group | null;
}

function SceneContent({
  carRef,
  particlesActive,
}: {
  carRef: React.RefObject<Group | null>;
  particlesActive: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight
        position={[5, 5, 5]}
        intensity={1}
        angle={0.3}
        penumbra={0.5}
      />
      <pointLight position={[0, 1, 0]} color="#EF4444" intensity={0.5} />

      <Environment preset="night" />

      <F1Car ref={carRef} />
      <ParticleSystem active={particlesActive} />
    </>
  );
}

export const F1CarScene = forwardRef<F1CarSceneHandle, F1CarSceneProps>(
  function F1CarScene({ particlesActive = false }, ref) {
    const carRef = useRef<Group>(null);

    useImperativeHandle(ref, () => ({
      get carGroup() {
        return carRef.current;
      },
    }));

    return (
      <Canvas
        camera={{ position: [0, 2, 8], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneContent carRef={carRef} particlesActive={particlesActive} />
        </Suspense>
      </Canvas>
    );
  }
);

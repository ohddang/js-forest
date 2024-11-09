import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

interface VertexVisualizationProps {
  vertexCount: number;
}

function PointCloud({ vertexCount }: VertexVisualizationProps) {
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef<number>(0);

  const [initialPositions] = useState(() => {
    const vertices = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      // WebGPU와 동일한 방식으로 난수 생성
      vertices[i * 3] = (Math.random() * 2 - 1) * 1000;
      vertices[i * 3 + 1] = (Math.random() * 2 - 1) * 1000;
      vertices[i * 3 + 2] = (Math.random() * 2 - 1) * 1000;
    }
    return vertices;
  });

  useFrame(() => {
    if (!meshRef.current) return;

    timeRef.current = performance.now() / 1000;
    const time = timeRef.current;

    const cTime = time * 10;

    const positions = meshRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const positionArray = positions.array as Float32Array;

    // WebGPU의 워크그룹 크기와 동일하게 처리
    const workgroupSize = 256;
    const numWorkgroups = Math.ceil(vertexCount / workgroupSize);

    // WebGPU의 워크그룹 처리 방식을 모방
    for (let workgroup = 0; workgroup < numWorkgroups; workgroup++) {
      for (let localId = 0; localId < workgroupSize; localId++) {
        const globalId = workgroup * workgroupSize + localId;

        // WebGPU의 인덱스 체크와 동일
        if (globalId >= vertexCount) {
          continue;
        }

        const i3 = globalId * 3;

        const position = {
          x: positionArray[i3],
          y: positionArray[i3 + 1],
          z: positionArray[i3 + 2],
        };

        const distance = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
        const theta = Math.atan2(position.y, position.x) + cTime * (0.1 + distance * 0.0001);
        const phi = Math.atan2(Math.sqrt(position.x * position.x + position.y * position.y), position.z);

        const scale = 1.0 + Math.sin(distance * 0.01 + cTime) * 0.1;

        // 새 위치 계산
        let newX = distance * scale * Math.sin(phi) * Math.cos(theta);
        let newY = distance * scale * Math.sin(phi) * Math.sin(theta);
        let newZ = distance * scale * Math.cos(phi);

        const wave = Math.sin(distance * 0.02 - cTime * 2.0) * 200.0;
        const waveScale = wave / distance;
        newX = newX + newX * waveScale;
        newY = newY + newY * waveScale;
        newZ = newZ + newZ * waveScale;

        positionArray[i3] = Math.max(-1000, Math.min(1000, newX));
        positionArray[i3 + 1] = Math.max(-1000, Math.min(1000, newY));
        positionArray[i3 + 2] = Math.max(-1000, Math.min(1000, newZ));
      }
    }

    positions.needsUpdate = true;
  });

  const pointSize = Math.max(0.1, 5 - Math.log10(vertexCount));

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={vertexCount} array={initialPositions} itemSize={3} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <pointsMaterial size={pointSize} sizeAttenuation={true} color="#ffffff" transparent={true} opacity={0.8} />
    </points>
  );
}

export function VertexVisualization({ vertexCount = 100000 }: VertexVisualizationProps) {
  const cameraDistance = 2000 + Math.log10(vertexCount) * 500;

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
  }, []);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [cameraDistance, cameraDistance, cameraDistance],
          fov: 60,
          near: 1,
          far: cameraDistance * 3,
        }}>
        {/* <color attach="background" args={["#000000"]} /> */}
        <PointCloud vertexCount={vertexCount} />
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  );
}

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { generateVertices } from "../utils/generateVertices";

interface PointCloudProps {
  vertexCount: number;
}

function PointCloud({ vertexCount }: PointCloudProps) {
  const meshRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (meshRef.current) {
      const vertices = generateVertices(vertexCount);
      meshRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry />
      <pointsMaterial size={2} sizeAttenuation color="#ffffff" />
    </points>
  );
}

interface VertexVisualizationProps {
  vertexCount: number;
}

export function VertexVisualization({ vertexCount = 100000 }: VertexVisualizationProps) {
  return (
    <Canvas camera={{ position: [0, 0, 1000], fov: 75, near: 1, far: 5000 }}>
      <PointCloud vertexCount={vertexCount} />
    </Canvas>
  );
}

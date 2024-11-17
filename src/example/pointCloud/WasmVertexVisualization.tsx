import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

interface WasmModule {
  generateVertices: (count: number) => Float32Array;
}

declare global {
  interface Window {
    wasmModule: WasmModule;
  }
}

interface PointCloudProps {
  vertexCount: number;
}

function PointCloud({ vertexCount }: PointCloudProps) {
  const meshRef = useRef<THREE.Points>(null);
  const [vertices, setVertices] = useState<Float32Array | null>(null);

  useEffect(() => {
    if (window.wasmModule) {
      const newVertices = window.wasmModule.generateVertices(vertexCount);
      setVertices(newVertices);
    }
  }, [vertexCount]);

  useEffect(() => {
    if (meshRef.current && vertices) {
      meshRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    }
  }, [vertices]);

  useFrame(() => {
    if (meshRef.current) {
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

interface WasmVertexVisualizationProps {
  vertexCount: number;
}

export function WasmVertexVisualization({ vertexCount = 100000 }: WasmVertexVisualizationProps) {
  return (
    <Canvas camera={{ position: [0, 0, 1000], fov: 75, near: 1, far: 5000 }}>
      <PointCloud vertexCount={vertexCount} />
    </Canvas>
  );
}

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { generateVertices } from "../utils/generateVertices";
import { PerformanceMonitor } from "./PerformanceMonitor";

interface PointCloudProps {
  vertexCount: number;
}

function PointCloud({ vertexCount }: PointCloudProps) {
  const meshRef = useRef<THREE.Points | null>(null);
  const vertices = generateVertices(vertexCount);
  const { scene, gl } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
  });

  useEffect(() => {
    if (!meshRef.current) return;

    return () => {
      scene.clear();
      gl.dispose();
    };
  }, [scene, gl]);

  const pointSize = Math.max(0.1, 5 - Math.log10(vertexCount));

  return (
    <points ref={meshRef}>
      <bufferGeometry />
      <pointsMaterial size={pointSize} sizeAttenuation color="#ffffff" />
    </points>
  );
}

interface VertexVisualizationProps {
  vertexCount: number;
}

export function VertexVisualization({ vertexCount = 100000 }: VertexVisualizationProps) {
  const cameraDistance = 1000 + Math.log10(vertexCount) * 500;

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
  }, []);

  return (
    <div className="h-screen">
      <Canvas camera={{ position: [0, 0, cameraDistance], fov: 75, near: 1, far: cameraDistance * 2 }}>
        <PointCloud vertexCount={vertexCount} />
      </Canvas>
      <PerformanceMonitor />
    </div>
  );
}

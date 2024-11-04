import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "./PerformanceMonitor";

interface WebGPUVertexVisualizationProps {
  vertexCount: number;
}

function PointCloud({ vertexCount }: WebGPUVertexVisualizationProps) {
  const meshRef = useRef<THREE.Points>(null);
  const { scene, gl } = useThree();

  useEffect(() => {
    return () => {
      scene.clear();
      gl.dispose();
    };
  }, [scene, gl]);

  useEffect(() => {
    async function initWebGPU() {
      if (!navigator.gpu) {
        console.error("WebGPU is not supported on this browser.");
        return;
      }

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error("No appropriate GPUAdapter found.");
        return;
      }

      const device = await adapter.requestDevice();
      console.log("device", device);

      const vertexBuffer = device.createBuffer({
        size: vertexCount * 3 * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });

      const computeShaderModule = device.createShaderModule({
        code: `
          @group(0) @binding(0) var<storage, read_write> vertices: array<vec3<f32>>;

          @compute @workgroup_size(256)
          fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            let index = global_id.x;
            if (index >= ${vertexCount}u) {
              return;
            }
            vertices[index] = vec3<f32>(
              sin(random(f32(index) + 0.0)) * 2000.0 - 1000.0,
              sin(random(f32(index) + 1000.0)) * 2000.0 - 1000.0,
              sin(random(f32(index) + 2000.0)) * 2000.0 - 1000.0
            );
          }

          fn random(seed: f32) -> f32 {
            return fract(sin(seed) * 43758.5453);
          }
        `,
      });

      const computePipeline = device.createComputePipeline({
        layout: "auto",
        compute: {
          module: computeShaderModule,
          entryPoint: "main",
        },
      });

      const bindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: vertexBuffer,
            },
          },
        ],
      });

      // 초기 정점 생성
      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(Math.ceil(vertexCount / 256));
      passEncoder.end();

      const gpuReadBuffer = device.createBuffer({
        size: vertexCount * 3 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      commandEncoder.copyBufferToBuffer(vertexBuffer, 0, gpuReadBuffer, 0, vertexCount * 3 * 4);

      device.queue.submit([commandEncoder.finish()]);

      await gpuReadBuffer.mapAsync(GPUMapMode.READ);
      const arrayBuffer = gpuReadBuffer.getMappedRange();
      const vertices = new Float32Array(arrayBuffer.slice(0));
      gpuReadBuffer.unmap();

      if (meshRef.current) {
        meshRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        meshRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    initWebGPU();
  }, [vertexCount]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
  });

  const pointSize = Math.max(0.1, 5 - Math.log10(vertexCount));
  console.log("pointSize", pointSize);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={vertexCount} array={new Float32Array(vertexCount * 3)} itemSize={3} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <pointsMaterial size={pointSize} sizeAttenuation color="#ffffff" />
    </points>
  );
}

export function WebGPUVertexVisualization({ vertexCount = 100000 }: WebGPUVertexVisualizationProps) {
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

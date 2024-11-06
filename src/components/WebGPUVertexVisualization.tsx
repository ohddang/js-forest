import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { calculateOptimalChunkSize } from "../utils/gpuDataChunking";

interface WebGPUVertexVisualizationProps {
  vertexCount: number;
}

function PointCloud({ vertexCount }: WebGPUVertexVisualizationProps) {
  const meshRef = useRef<THREE.Points>(null);
  const { scene, gl } = useThree();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      scene.clear();
      gl.dispose();
    };
  }, [scene, gl]);

  useEffect(() => {
    async function initWebGPU() {
      try {
        if (!navigator.gpu) {
          throw new Error("WebGPU is not supported");
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          throw new Error("No appropriate GPUAdapter found");
        }

        const device = await adapter.requestDevice();

        // GPU 메모리 제한 계산
        const maxBufferSize = adapter.limits.maxStorageBufferBindingSize;
        const vertexSize = 3 * 4; // vec3<f32> = 12 bytes
        const chunkSize = calculateOptimalChunkSize(vertexCount, vertexSize, maxBufferSize);
        const chunks = Array.from({ length: Math.ceil(vertexCount / chunkSize) }, (_, i) => i * chunkSize).map((start) => Math.min(chunkSize, vertexCount - start));

        let allVertices = new Float32Array(vertexCount * 3);
        let processedCount = 0;

        // 청크별로 처리
        for (const currentChunkSize of chunks) {
          const vertexBuffer = device.createBuffer({
            size: currentChunkSize * vertexSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
          });

          const computeShaderModule = device.createShaderModule({
            code: `
              @group(0) @binding(0) var<storage, read_write> vertices: array<vec3<f32>>;

              @compute @workgroup_size(256)
              fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
                let index = global_id.x;
                if (index >= ${currentChunkSize}u) {
                  return;
                }
                let globalIndex = ${processedCount}u + index;
                vertices[index] = vec3<f32>(
                  sin(random(f32(globalIndex) + 0.0)) * 2000.0 - 1000.0,
                  sin(random(f32(globalIndex) + 1000.0)) * 2000.0 - 1000.0,
                  sin(random(f32(globalIndex) + 2000.0)) * 2000.0 - 1000.0
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

          const commandEncoder = device.createCommandEncoder();
          const passEncoder = commandEncoder.beginComputePass();
          passEncoder.setPipeline(computePipeline);
          passEncoder.setBindGroup(0, bindGroup);
          passEncoder.dispatchWorkgroups(Math.ceil(currentChunkSize / 256));
          passEncoder.end();

          const gpuReadBuffer = device.createBuffer({
            size: currentChunkSize * vertexSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
          });

          commandEncoder.copyBufferToBuffer(vertexBuffer, 0, gpuReadBuffer, 0, currentChunkSize * vertexSize);

          device.queue.submit([commandEncoder.finish()]);

          await gpuReadBuffer.mapAsync(GPUMapMode.READ);
          const arrayBuffer = gpuReadBuffer.getMappedRange();
          const chunkVertices = new Float32Array(arrayBuffer);
          allVertices.set(chunkVertices, processedCount * 3);

          gpuReadBuffer.unmap();
          vertexBuffer.destroy();
          gpuReadBuffer.destroy();

          processedCount += currentChunkSize;
        }

        if (meshRef.current) {
          meshRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(allVertices, 3));
          meshRef.current.geometry.attributes.position.needsUpdate = true;
        }
      } catch (err) {
        console.error("GPU 처리 중 오류:", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
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

  if (error) {
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white bg-red-500/50">
        <p>{error}</p>
      </div>
    );
  }

  const pointSize = Math.max(0.1, 5 - Math.log10(vertexCount));

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
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, cameraDistance], fov: 75, near: 1, far: cameraDistance * 2 }}>
        <PointCloud vertexCount={vertexCount} />
      </Canvas>
    </div>
  );
}

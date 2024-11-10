import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

interface WebGPUVertexVisualizationProps {
  vertexCount: number;
}

function PointCloud({ vertexCount }: WebGPUVertexVisualizationProps) {
  // Refs
  const meshRef = useRef<THREE.Points>(null);
  const deviceRef = useRef<GPUDevice | null>(null);
  const computePipelineRef = useRef<GPUComputePipeline | null>(null);
  const bindGroupRef = useRef<GPUBindGroup | null>(null);
  const vertexBufferRef = useRef<GPUBuffer | null>(null);
  const uniformBufferRef = useRef<GPUBuffer | null>(null);
  const gpuReadBufferRef = useRef<GPUBuffer | null>(null);
  const isAnimatingRef = useRef(true);

  // State & Context
  const { scene, gl } = useThree();
  const [error, setError] = useState<string | null>(null);

  const checkDeviceLimits = async () => {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error("No appropriate GPUAdapter found");

      // 디바이스 제한사항 확인
      const limits = adapter.limits;
      console.log("Maximum Compute Invocations Per Workgroup:", limits.maxComputeInvocationsPerWorkgroup);
      console.log("Maximum Compute Workgroup Size X:", limits.maxComputeWorkgroupSizeX);
      console.log("Maximum Compute Workgroup Storage Size:", limits.maxComputeWorkgroupStorageSize);

      return limits;
    } catch (err) {
      console.error("GPU 제한사항 확인 중 오류:", err);
      return null;
    }
  };

  // GPU 리소스 정리
  const cleanupResources = () => {
    [vertexBufferRef, uniformBufferRef, gpuReadBufferRef].forEach((ref) => {
      if (ref.current) {
        ref.current.destroy();
        ref.current = null;
      }
    });
    bindGroupRef.current = null;
    computePipelineRef.current = null;
  };

  // 애니메이션 프레임 처리
  const animate = async () => {
    try {
      if (
        !isAnimatingRef.current ||
        !deviceRef.current ||
        !vertexBufferRef.current ||
        !computePipelineRef.current ||
        !bindGroupRef.current ||
        !uniformBufferRef.current ||
        !meshRef.current
      ) {
        console.error("GPU is not ready");
        return;
      } else {
        console.log("GPU is ready");
      }

      const timeData = new Float32Array([performance.now() / 1000]);
      deviceRef.current.queue.writeBuffer(uniformBufferRef.current, 0, timeData);

      const commandEncoder = deviceRef.current.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();

      passEncoder.setPipeline(computePipelineRef.current);
      passEncoder.setBindGroup(0, bindGroupRef.current);
      passEncoder.dispatchWorkgroups(Math.ceil(vertexCount / 64));
      passEncoder.end();

      const gpuReadBuffer = deviceRef.current.createBuffer({
        size: vertexCount * 12,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      commandEncoder.copyBufferToBuffer(vertexBufferRef.current, 0, gpuReadBuffer, 0, vertexCount * 12);
      deviceRef.current.queue.submit([commandEncoder.finish()]);

      await gpuReadBuffer.mapAsync(GPUMapMode.READ);
      const vertices = new Float32Array(gpuReadBuffer.getMappedRange());

      const positionAttribute = meshRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      positionAttribute.array.set(vertices);
      positionAttribute.needsUpdate = true;

      gpuReadBuffer.unmap();
      gpuReadBuffer.destroy();
    } catch (error) {
      console.error("애니메이션 프레임 처리 중 오류:", error);
      isAnimatingRef.current = false;
    }
  };

  // init WebGPU
  const initWebGPU = async () => {
    try {
      if (!deviceRef.current) return;

      const limits = await checkDeviceLimits();
      console.log("limits", limits);

      const vertexSize = 4 * 3;
      const totalBufferSize = vertexCount * vertexSize;

      // 버퍼 생성
      vertexBufferRef.current = deviceRef.current.createBuffer({
        size: totalBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      });
      console.log("vertexBufferRef.current", vertexBufferRef.current);

      uniformBufferRef.current = deviceRef.current.createBuffer({
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      console.log("uniformBufferRef.current", uniformBufferRef.current);

      // 수정된 컴퓨트 셰이더 코드 수정
      const shaderCode = `
                  struct Uniforms {
                      time: f32,
                    };
                    @binding(0) @group(0) var<uniform> uniforms: Uniforms;
                    @binding(1) @group(0) var<storage, read_write> vertices: array<vec3<f32>>;
      
                    const PI: f32 = 3.14159265359;
      
                    @compute @workgroup_size(64)
                    fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
                      let index = global_id.x;
                      if (index >= ${vertexCount}u) {
                        return;
                      }
      
                      var position = vertices[index];
                      let time = uniforms.time;
                      
                      // 기존 위치를 기반으로 한 회전 및 스케일 애니메이션
                      let distance = sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
                      let theta = atan2(position.y, position.x) + time * (0.1 + distance * 0.0001);
                      let phi = atan2(sqrt(position.x * position.x + position.y * position.y), position.z);
                      
                      // 회전하는 구면 좌표계 적용
                      let scale = 1.0 + sin(distance * 0.01 + time) * 0.3;
                      position.x = distance * scale * sin(phi) * cos(theta);
                      position.y = distance * scale * sin(phi) * sin(theta);
                      position.z = distance * scale * cos(phi);
      
                      // 추가적인 파동 효과
                      let wave = sin(distance * 0.02 - time * 2.0) * 20.0;
                      position = position + position * wave / distance;
      
                      // 경계 제한
                      position = clamp(position, vec3<f32>(-1000.0), vec3<f32>(1000.0));
                      
                      vertices[index] = position;
                    }
      
                    fn random(seed: f32) -> f32 {
                      return fract(sin(seed) * 43758.5453);
                    }
            `;

      // 수정된 컴퓨트 셰이더
      const computeShaderModule = deviceRef.current.createShaderModule({
        code: shaderCode,
      });

      computePipelineRef.current = deviceRef.current.createComputePipeline({
        layout: "auto",
        compute: {
          module: computeShaderModule,
          entryPoint: "main",
        },
      });
      console.log("computePipelineRef.current", computePipelineRef.current);

      // 초기 데이터 설정
      const initialVertices = new Float32Array(vertexCount * 3);
      for (let i = 0; i < vertexCount; i++) {
        initialVertices[i * 3] = (Math.random() * 2 - 1) * 1000;
        initialVertices[i * 3 + 1] = (Math.random() * 2 - 1) * 1000;
        initialVertices[i * 3 + 2] = (Math.random() * 2 - 1) * 1000;
      }
      deviceRef.current.queue.writeBuffer(vertexBufferRef.current, 0, initialVertices);
      console.log("deviceRef.current.queue.writeBuffer");

      // 바인드 그룹 설정
      bindGroupRef.current = deviceRef.current.createBindGroup({
        layout: computePipelineRef.current.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBufferRef.current } },
          { binding: 1, resource: { buffer: vertexBufferRef.current } },
        ],
      });
      console.log("bindGroupRef.current", bindGroupRef.current);

      isAnimatingRef.current = true;
    } catch (err) {
      console.error("GPU 처리 중 오류:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
    }
  };

  useEffect(() => {
    const initGPU = async () => {
      try {
        if (!navigator.gpu) throw new Error("WebGPU is not supported");

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("No appropriate GPUAdapter found");

        deviceRef.current = await adapter.requestDevice();
        await initWebGPU();
      } catch (err) {
        console.error("GPU 초기화 중 오류:", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      }
    };

    initGPU();
  }, []);

  // Effects
  useEffect(() => {
    if (deviceRef.current) {
      isAnimatingRef.current = false;
      initWebGPU();
    }

    return () => {
      cleanupResources();
    };
  }, [vertexCount]);

  useEffect(() => {
    return () => {
      scene.clear();
      gl.dispose();
    };
  }, [scene, gl]);

  useFrame(() => {
    if (isAnimatingRef.current) {
      animate();
    }
  });

  if (error) {
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white bg-red-500/50">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={vertexCount} array={new Float32Array(vertexCount * 3)} itemSize={3} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <pointsMaterial size={Math.max(0.1, 5 - Math.log10(vertexCount))} sizeAttenuation={true} color="#ffffff" transparent={true} opacity={0.8} />
    </points>
  );
}

export function WebGPUVertexVisualization({ vertexCount = 100000 }: WebGPUVertexVisualizationProps) {
  const cameraDistance = 2000 + Math.log10(vertexCount) * 500;

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [cameraDistance, cameraDistance, cameraDistance],
          fov: 60,
          near: 1,
          far: cameraDistance * 3,
        }}>
        <PointCloud vertexCount={vertexCount} />
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  );
}

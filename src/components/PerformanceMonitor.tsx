import { useState, useEffect } from "react";

interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
  };
}

export function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);
  const [gpuMemoryUsage, setGpuMemoryUsage] = useState<number>(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    function measure() {
      const now = performance.now();
      frameCount++;

      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        setMemory(Math.round(((performance as ExtendedPerformance).memory?.usedJSHeapSize || 0) / (1024 * 1024)));
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(measure);
    }

    measure();

    const checkGPUMemory = async () => {
      try {
        const adapter = await navigator.gpu?.requestAdapter();
        if (adapter) {
          // GPU 정보 가져오기
          const limits = adapter.limits;

          setGpuMemoryUsage(limits.maxStorageBufferBindingSize / (1024 * 1024)); // MB 단위로 변환
          requestAnimationFrame(checkGPUMemory);
        }
      } catch (error) {
        console.error("GPU 메모리 확인 중 오류:", error);
      }
    };

    checkGPUMemory();
  }, []);

  return (
    <div className="absolute top-5 right-5 bg-black/50 text-white p-2 rounded">
      <p>FPS: {fps}</p>
      <p>Memory: {memory} MB</p>
      <p>GPU Memory: {gpuMemoryUsage.toFixed(2)} MB</p>
    </div>
  );
}

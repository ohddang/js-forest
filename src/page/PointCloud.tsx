import { useState, useEffect } from "react";
import { VertexVisualization } from "../components/VertexVisualization";
import { WebGPUVertexVisualization } from "../components/WebGPUVertexVisualization";
import { PerformanceMonitor } from "../components/PerformanceMonitor";

export default function PointCloud() {
  const [vertexCount, setVertexCount] = useState<number>(10000);
  const [mode, setMode] = useState<"none" | "normal" | "webgpu">("none");
  const [isWebGPUSupported, setIsWebGPUSupported] = useState(false);

  useEffect(() => {
    async function checkWebGPUSupport() {
      if (!navigator.gpu) {
        setIsWebGPUSupported(false);
        return;
      }
      const adapter = await navigator.gpu.requestAdapter();
      setIsWebGPUSupported(!!adapter);
    }
    checkWebGPUSupport();
  }, []);

  return (
    <div className="relative w-full h-full">
      {mode === "normal" && <VertexVisualization vertexCount={vertexCount} />}
      {mode === "webgpu" && isWebGPUSupported && <WebGPUVertexVisualization vertexCount={vertexCount} />}
      <div className="absolute top-0 left-0 w-full h-auto flex flex-col gap-3 p-5">
        <div className="flex flex-row gap-3">
          <label>
            Point Count&nbsp;
            <input
              className="text-center"
              type="number"
              value={vertexCount}
              onChange={(e) => {
                setVertexCount(Number(e.target.value));
                setMode("none");
              }}
              min="1000"
              max="1000000"
              step="1000"
            />
          </label>
          {mode === "none" && <p>정점 수를 입력하고 모드를 선택해주세요</p>}
        </div>
        <div className="flex flex-row gap-3">
          <button onClick={() => setMode("normal")}>일반 모드</button>
          <button onClick={() => setMode("webgpu")} disabled={!isWebGPUSupported}>
            WebGPU 모드 {!isWebGPUSupported && "(지원되지 않음)"}
          </button>
        </div>
      </div>
      <PerformanceMonitor />
    </div>
  );
}

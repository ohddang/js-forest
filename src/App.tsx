import { useState, useEffect } from "react";
import { VertexVisualization } from "./components/VertexVisualization";
// import { WasmVertexVisualization } from "./components/WasmVertexVisualization";
import { WebGPUVertexVisualization } from "./components/WebGPUVertexVisualization";
import Sidebar from "./components/ui/Sidebar";

function App() {
  const [vertexCount, setVertexCount] = useState(100000);
  const [mode, setMode] = useState<"normal" | "wasm" | "webgpu">("normal");
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
    <div className="flex flex-row">
      <Sidebar />
      <div className="block">
        <h1>정점 데이터 시각화</h1>
        <div>
          <label>
            정점 수:
            <input type="number" value={vertexCount} onChange={(e) => setVertexCount(Number(e.target.value))} min="1000" max="1000000" step="1000" />
          </label>
        </div>
        <div>
          <button onClick={() => setMode("normal")}>일반 모드</button>
          <button onClick={() => setMode("webgpu")} disabled={!isWebGPUSupported}>
            WebGPU 모드 {!isWebGPUSupported && "(지원되지 않음)"}
          </button>
        </div>
        {mode === "normal" && <VertexVisualization vertexCount={vertexCount} />}
        {/* {mode === "wasm" && <WasmVertexVisualization vertexCount={vertexCount} />} */}
        {mode === "webgpu" && isWebGPUSupported && <WebGPUVertexVisualization vertexCount={vertexCount} />}
      </div>
    </div>
  );
}

export default App;

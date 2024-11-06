import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/ui/Sidebar";
import PointCloud from "./page/PointCloud";
import { ErrorBoundary } from "./utils/errorBoundary";

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-sky-700 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">오류가 발생했습니다</h1>
            <p>잠시 후 다시 시도해주세요</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-sky-600 rounded hover:bg-sky-500">
              새로고침
            </button>
          </div>
        </div>
      }
    >
      <div className="w-screen h-screen flex flex-row bg-sky-700">
        <Sidebar />
        <div className="w-full h-screen">
          <Routes>
            <Route path="/pointcloud" element={<PointCloud />} />
          </Routes>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

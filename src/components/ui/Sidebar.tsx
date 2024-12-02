import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-fit h-screen flex flex-col justify-start items-start gap-5 bg-sky-950 text-white p-5">
      <div>
        <p className="mb-2 text-xl font-bold">Subject</p>
        <div className="ml-2 flex flex-col gap-1">
          <NavLink to="/pointcloud" className={({ isActive }) => `${isActive ? "font-bold text-sky-300" : " hover:text-gray-300"}`}>
            Point Cloud
          </NavLink>
          <NavLink to="/svgconverter" className={({ isActive }) => `${isActive ? "font-bold text-sky-300" : " hover:text-gray-300"}`}>
            SVG Converter
          </NavLink>
          <NavLink to="/svgconverter-worker" className={({ isActive }) => `${isActive ? "font-bold text-sky-300" : " hover:text-gray-300"}`}>
            SVG Converter(W)
          </NavLink>
          <p>...</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xl font-bold">WebAssembly</p>
        <div className="ml-2 flex flex-col gap-1">
          <p>Emotion Analysis</p>
          <p>...</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xl font-bold">Etc</p>
        <div className="ml-2 flex flex-col gap-1">
          <p className="whitespace-nowrap">WebGPU vs WASM</p>
          <p>...</p>
        </div>
      </div>
    </div>
  );
}

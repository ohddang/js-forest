import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-fit h-screen flex flex-col justify-start items-start gap-5 bg-sky-950 text-white p-5">
      <div>
        <p className="mb-2 text-xl font-bold">WebGPU</p>
        <div className="ml-2 flex flex-col gap-1">
          <NavLink to="/pointcloud" className={({ isActive }) => `${isActive ? "font-bold text-sky-300" : " hover:text-gray-300"}`}>
            Point Cloud
          </NavLink>
          <p>etc..</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xl font-bold">WebAssembly</p>
        <div className="ml-2 flex flex-col gap-1">
          <p>etc..</p>
          <p>etc..</p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    function measure() {
      const now = performance.now();
      frameCount++;

      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        setMemory(Math.round((performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0));
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(measure);
    }

    measure();
  }, []);

  return (
    <div>
      <p>FPS: {fps}</p>
      <p>Memory: {memory} MB</p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import * as ASSETS from "../../assets";

export default function SVGConverter() {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [imageData, setImageData] = useState<Uint8ClampedArray | null>(null);
  const [svgData, setSvgData] = useState<string | null>(null);
  // const [isConverting, setIsConverting] = useState<boolean>(false);
  const previewRef = useRef<HTMLImageElement>(null);
  const isConvertRef = useRef<boolean>(false);

  const handleClick = () => {
    if (!svgData) return;

    const svgAll = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svgData}</svg>`;

    const blob = new Blob([svgAll], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "converted.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (!imageData) return;

    isConvertRef.current = true;
    const visited = new Uint8Array(Math.ceil((width * height) / 8)); // 비트 배열로 변경
    const paths: string[] = [];

    console.time("generate svg");

    const isVisited = (index: number) => (visited[Math.floor(index / 8)] & (1 << index % 8)) !== 0;
    const setVisited = (index: number) => (visited[Math.floor(index / 8)] |= 1 << index % 8);

    const floodFill = async (x: number, y: number, color: number[], path: string[]) => {
      const stack = [[x, y]];
      while (stack.length > 0) {
        const [currentX, currentY] = stack.pop()!;
        const index = currentY * width + currentX;
        if (isVisited(index)) continue;

        const pixelIndex = index * 4;
        const currentColor = [imageData[pixelIndex], imageData[pixelIndex + 1], imageData[pixelIndex + 2]];
        const alpha = imageData[pixelIndex + 3];

        if (alpha === 0 || isVisited(index)) {
          setVisited(index);
          continue;
        }

        if (Math.abs(currentColor[0] - color[0]) + Math.abs(currentColor[1] - color[1]) + Math.abs(currentColor[2] - color[2]) < 1) {
          setVisited(index);
          path.push(`L ${currentX} ${currentY}`);

          // Add neighboring pixels to the stack
          // if (currentX > 0) stack.push([currentX - 1, currentY]);
          // if (currentX < width - 1) stack.push([currentX + 1, currentY]);
          // if (currentY > 0) stack.push([currentX, currentY - 1]);
          // if (currentY < height - 1) stack.push([currentX, currentY + 1]);

          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (i === 0 && j === 0) continue;
              const nextX = currentX + i;
              const nextY = currentY + j;
              if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
                stack.push([nextX, nextY]);
              }
            }
          }
        }
        // 비동기 작업을 수행하여 UI가 멈추지 않도록 함
        if (stack.length % 30 === 0) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      }
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (isVisited(index)) continue;

        const pixelIndex = index * 4;
        const color = [imageData[pixelIndex], imageData[pixelIndex + 1], imageData[pixelIndex + 2]];
        const alpha = imageData[pixelIndex + 3];

        if (alpha === 0) {
          setVisited(index);
          continue;
        }

        const path = [`M ${x} ${y}`];
        floodFill(x, y, color, path);
        path.push("Z");
        paths.push(`<path d="${path.join(" ")}" fill="rgb(${color.join(",")})" stroke="rgb(${color.join(",")})" stroke-width="2" stroke-linecap="round"  />`);
      }
    }

    setSvgData(paths.join("\n"));
    isConvertRef.current = false;
    console.timeEnd("generate svg");
    console.log("svgData", paths.length);
  };

  useEffect(() => {
    const sampleImage = new Image();
    sampleImage.src = ASSETS.SAMPLE;
    sampleImage.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = sampleImage.width;
      canvas.height = sampleImage.height;
      context.drawImage(sampleImage, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;

      setWidth(canvas.width);
      setHeight(canvas.height);
      setImageData(data);
    };

    if (previewRef.current) previewRef.current.style.filter = "blur(3px)";

    return () => {
      sampleImage.onload = null;
    };
  }, []);

  return (
    <article className="relative w-full h-full">
      <div className="w-full h-full flex flex-col justify-center items-center">
        <title>SVG Converter</title>
        <div className="flex flex-row justify-center items-start gap-20">
          <div className="flex flex-col justify-start items-center gap-5">
            <img src={ASSETS.SAMPLE} alt="origin" />
            <button className={`${imageData ? "pointer-events-auto" : "pointer-events-none opacity-50"}`} onClick={handleConvert}>
              Convert
            </button>
          </div>
          <div className="flex flex-col justify-start items-center gap-5">
            {svgData ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} dangerouslySetInnerHTML={{ __html: svgData }} />
            ) : (
              <div className="relative">
                <img src={ASSETS.SAMPLE} alt="preview" ref={previewRef} />
                {isConvertRef.current && <b className="absolute top-1/2 left-1/2 text-xl transform: -translate-x-1/2">Coverting...</b>}
              </div>
            )}
            <button onClick={handleClick}>Download</button>
          </div>
        </div>
      </div>
    </article>
  );
}

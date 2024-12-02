import { useEffect, useRef, useState } from "react";
import * as ASSETS from "../../assets";

export default function SVGConverterWorker() {
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

    const worker = new Worker(new URL("./floodFillWorker.js", import.meta.url));
    console.time("generate svg");
    worker.postMessage({ width, height, imageData, color: [0, 0, 0] });

    worker.onmessage = (e) => {
      setSvgData(e.data);
      isConvertRef.current = false;
      console.timeEnd("generate svg");
      worker.terminate();
    };
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

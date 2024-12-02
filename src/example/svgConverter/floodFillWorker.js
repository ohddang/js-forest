// floodFillWorker.js
self.onmessage = async function (e) {
  const { x, y, width, height, imageData, color } = e.data;
  const visited = new Uint8Array(Math.ceil((width * height) / 8));
  const paths = [];

  const isVisited = (index) => (visited[Math.floor(index / 8)] & (1 << index % 8)) !== 0;
  const setVisited = (index) => (visited[Math.floor(index / 8)] |= 1 << index % 8);

  const floodFill = async (x, y, color, path) => {
    const stack = [[x, y]];
    while (stack.length > 0) {
      const [currentX, currentY] = stack.pop();
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
      await floodFill(x, y, color, path);
      path.push("Z");
      paths.push(`<path d="${path.join(" ")}" fill="rgb(${color.join(",")})" stroke="rgb(${color.join(",")})" stroke-width="2" stroke-linecap="round"  />`);
    }
  }

  self.postMessage(paths.join("\n"));
};

export function chunkData<T>(data: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

export function calculateOptimalChunkSize(totalDataSize: number, itemSize: number, maxGPUMemory: number): number {
  // GPU 메모리의 80%만 사용하도록 설정
  const safeMemoryLimit = maxGPUMemory * 0.8;
  const itemsPerChunk = Math.floor(safeMemoryLimit / itemSize);
  return Math.min(totalDataSize, itemsPerChunk);
}

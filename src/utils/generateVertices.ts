export function generateVertices(count: number): Float32Array {
  const vertices = new Float32Array(count * 3);

  function random(seed: number): number {
    return Math.abs((Math.sin(seed) * 43758.5453) % 1);
  }

  for (let i = 0; i < count; i++) {
    vertices[i * 3] = Math.sin(random(i + 0.0)) * 2000.0 - 1000.0;
    vertices[i * 3 + 1] = Math.sin(random(i + 1.0)) * 2000.0 - 1000.0;
    vertices[i * 3 + 2] = Math.sin(random(i + 2.0)) * 2000.0 - 1000.0;
  }

  return vertices;
}

export function generateVertices(count: number): Float32Array {
  const vertices = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const index = i * 3;
    vertices[index] = Math.random() * 2000 - 1000; // x
    vertices[index + 1] = Math.random() * 2000 - 1000; // y
    vertices[index + 2] = Math.random() * 2000 - 1000; // z
  }
  return vertices;
}

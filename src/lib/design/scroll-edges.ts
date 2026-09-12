export function scrollEdges(left: number, width: number, scrollWidth: number) {
  const maximum = Math.max(0, scrollWidth - width);
  const position = Math.max(0, Math.min(left, maximum));
  return { left: position > 1, right: position < maximum - 1 };
}

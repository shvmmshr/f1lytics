/** Brand paint is for bars and liveries. Text needs contrast on raised panels. */
export function getTeamTextColor(color: string): string {
  if (!/^#[\da-f]{6}$/i.test(color)) return "#B4B4BD";
  const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
  // #26262E is the lightest shared dark surface, including hover states.
  const minimumLuminance = 0.337;
  for (let step = 0; step <= 20; step++) {
    const channels = rgb.map((value) => Math.round(value + (255 - value) * step / 20));
    const linear = channels.map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    if (linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722 >= minimumLuminance) {
      return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    }
  }
  return "#FFFFFF";
}

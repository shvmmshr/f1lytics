import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** One disk read per asset per warm process, shared by every social image route. */
const assets = Promise.all([
  readFile(join(process.cwd(), "src/app/_fonts/Antonio-Bold.ttf")),
  readFile(join(process.cwd(), "src/app/_fonts/JetBrainsMono-Medium.ttf")),
  readFile(join(process.cwd(), "public/brand/f1lytics-wordmark-dark.png")),
]).then(([antonio, mono, wordmark]) => ({
  antonio, mono, wordmark: `data:image/png;base64,${wordmark.toString("base64")}`,
}));

export function loadSocialAssets() { return assets; }

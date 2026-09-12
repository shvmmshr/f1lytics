import { ImageResponse } from "next/og";
import { F1 } from "@/components/shared/broadcast";
import { loadSocialAssets } from "./social-assets";
import { socialCardModel, type SocialCardInput } from "./social-card";

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };

export async function renderSocialImage(input: SocialCardInput = {}) {
  const card = socialCardModel(input);
  const { antonio, mono, wordmark } = await loadSocialAssets();
  const titleSize = card.title.length > 70 ? 52 : card.title.length > 45 ? 62 : 78;
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "40px 56px 28px", background: F1.ink, borderTop: `8px solid ${card.accent}`, color: F1.fg, fontFamily: "Mono" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wordmark} alt="" width={325} height={32} />
        <div style={{ display: "flex", color: F1.fg2, fontSize: 16, letterSpacing: "0.16em" }}>F1LYTICS.COM</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 30, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 36, height: 4, background: card.accent }} />
          <div style={{ display: "flex", fontSize: 17, color: F1.fg2, letterSpacing: "0.15em" }}>{card.eyebrow.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Antonio", fontWeight: 700, fontSize: titleSize, lineHeight: 1.04, letterSpacing: "-0.025em", marginTop: 14, textTransform: "uppercase", wordBreak: /\S{36}/.test(card.title) ? "break-all" : "normal" }}>{card.title}</div>
        <div style={{ display: "flex", fontSize: 20, lineHeight: 1.35, color: F1.fg2, marginTop: 16, wordBreak: /\S{60}/.test(card.description) ? "break-all" : "normal" }}>{card.description}</div>
      </div>
      <div style={{ display: "flex", border: `1px solid ${F1.line}`, background: F1.bg2 }}>
        {card.stats.map((stat, i) => <div key={stat.label} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, borderLeft: i ? `1px solid ${F1.line}` : "0px solid transparent", padding: "14px 20px" }}>
          <div style={{ display: "flex", fontSize: 13, letterSpacing: "0.15em", color: F1.fg2 }}>{stat.label.toUpperCase()}</div>
          <div style={{ display: "flex", marginTop: 7, fontFamily: "Antonio", fontWeight: 700, fontSize: stat.value.length > 14 ? 28 : 34, lineHeight: 1.1 }}>{stat.value.toUpperCase()}</div>
        </div>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontSize: 12, letterSpacing: "0.12em", color: F1.fg3 }}><div style={{ display: "flex" }}>UNOFFICIAL FAN PROJECT</div><div style={{ display: "flex" }}>{card.path === "/" ? "FORMULA 1 · THE 2026 SEASON" : card.path.toUpperCase()}</div></div>
    </div>,
    { ...SOCIAL_IMAGE_SIZE, fonts: [{ name: "Antonio", data: antonio, weight: 700, style: "normal" }, { name: "Mono", data: mono, weight: 500, style: "normal" }], headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60" } },
  );
}

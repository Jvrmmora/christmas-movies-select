import { ImageResponse } from "next/og";

export const alt = "Navidad en casa — nuestras películas de Navidad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BERRY = "#c8102e";
const GOLD = "#f2c14e";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 90px",
          background: `linear-gradient(135deg, ${BERRY} 0%, #8f0b21 100%)`,
          color: "#fff",
        }}
      >
        <svg width="260" height="260" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
          <rect width="64" height="64" rx="16" fill="#fff" fillOpacity="0.14" />
          <path d="M32 10l2.3 4.6 5.1.7-3.7 3.6.9 5-4.6-2.4-4.6 2.4.9-5-3.7-3.6 5.1-.7z" fill={GOLD} />
          <path d="M32 21l9 11h-5l8 10h-6l9 11H17l9-11h-6l8-10h-5z" fill="#fff" />
          <rect x="29" y="52" width="6" height="6" rx="1" fill="#fff" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70 }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>Navidad en casa</div>
          <div style={{ fontSize: 40, marginTop: 24, color: GOLD }}>Nuestras películas de Navidad</div>
          <div style={{ fontSize: 30, marginTop: 14, opacity: 0.85 }}>
            Lista · dónde verlas · calendario de adviento
          </div>
        </div>
      </div>
    ),
    size,
  );
}

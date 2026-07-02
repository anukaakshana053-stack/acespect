import { Building2 } from "lucide-react";

/**
 * Brand mark. `md`/`lg` are used on the dark login hero (white wordmark);
 * `sm` is used on the white sidebar (navy wordmark).
 */
export function AcespectLogo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const dims = {
    sm: { box: 30, radius: 8, icon: 17, font: 16, gap: 9 },
    md: { box: 46, radius: 12, icon: 26, font: 24, gap: 12 },
    lg: { box: 58, radius: 14, icon: 33, font: 30, gap: 14 },
  }[size];

  const onDark = size !== "sm";
  const wordColor = onDark ? "#ffffff" : "#1a2a4a";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: dims.gap }}>
      <div
        style={{
          width: dims.box,
          height: dims.box,
          borderRadius: dims.radius,
          background: "linear-gradient(135deg, #e63329, #b91c1c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(230,51,41,0.35)",
          flexShrink: 0,
        }}
      >
        <Building2 size={dims.icon} color="#fff" strokeWidth={2.2} />
      </div>
      <span
        style={{
          fontSize: dims.font,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          color: wordColor,
          lineHeight: 1,
        }}
      >
        ACE<span style={{ color: "#e63329" }}>SPECT</span>
      </span>
    </div>
  );
}

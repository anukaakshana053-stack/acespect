import type { ExtBlock } from "../reportExternal";

/** Inline fill-in field (the pink blanks in the Word template). */
function Blank() {
  return (
    <span
      style={{
        display: "inline-block",
        minWidth: "34px",
        borderBottom: "1px solid #e05a72",
        margin: "0 3px",
        verticalAlign: "baseline",
      }}
    >
      &nbsp;
    </span>
  );
}

/** Render template text, turning each "{}" token into a Blank. */
function Templated({ text }: { text: string }) {
  const parts = text.split("{}");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <Blank />}
        </span>
      ))}
    </>
  );
}

function Block({ block }: { block: ExtBlock }) {
  switch (block.kind) {
    case "banner":
      return (
        <div
          style={{
            background: "#f8d2b0",
            color: "#1a2a4a",
            fontWeight: 700,
            padding: "5px 10px",
            margin: "24px 0 12px",
            letterSpacing: "0.04em",
          }}
        >
          {block.title}
        </div>
      );
    case "floor":
      return (
        <div
          style={{
            background: "#d6d98c",
            color: "#3f3f16",
            fontWeight: 700,
            padding: "4px 10px",
            margin: "18px 0 10px",
            letterSpacing: "0.03em",
          }}
        >
          {block.title}
        </div>
      );
    case "heading":
      return (
        <p style={{ fontWeight: 700, margin: "16px 0 6px" }}>
          {block.title}
          {block.admin && (
            <span
              style={{
                background: "#fff2a8",
                color: "#7a5b00",
                fontWeight: 600,
                fontSize: "0.85em",
                padding: "1px 6px",
                marginLeft: "8px",
                borderRadius: "3px",
              }}
            >
              {block.admin}
            </span>
          )}
        </p>
      );
    case "subheading":
      return <p style={{ fontWeight: 700, textDecoration: "underline", margin: "12px 0 6px" }}>{block.title}</p>;
    case "para":
      return (
        <p style={{ margin: "0 0 10px", textAlign: "justify", lineHeight: 1.6 }}>
          <Templated text={block.text} />
        </p>
      );
    case "fill":
      return (
        <p style={{ background: "#fff2a8", padding: "4px 6px", margin: "0 0 10px", lineHeight: 1.6 }}>
          {block.text}
        </p>
      );
    case "italic":
      return (
        <p style={{ fontStyle: "italic", color: "#444", margin: "0 0 10px", textAlign: "justify", lineHeight: 1.6 }}>
          {block.text}
        </p>
      );
  }
}

/** Renders a list of template blocks (shared by EXTERNAL and INTERNAL). */
export function ReportBlocks({ blocks, compact = false }: { blocks: ExtBlock[]; compact?: boolean }) {
  return (
    <div
      style={{
        fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
        color: "#111",
        fontSize: compact ? "11.5px" : "14px",
        lineHeight: 1.5,
      }}
    >
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}

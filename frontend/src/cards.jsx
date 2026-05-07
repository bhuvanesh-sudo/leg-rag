// cards.js — Composite card components
import { useState } from "react";
import { FONT, severityColor, severityBg, severityLabel } from "./theme.jsx";
import { Tag } from "./components.jsx";

export function RiskCard({ flag, T, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const color = severityColor(flag.severity, T);

  return (
    <div
      className="card-hover fade-up"
      style={{
        border: `1px solid ${color}28`,
        borderLeft: `3px solid ${color}`,
        marginBottom: 10,
        background: severityBg(flag.severity),
        borderRadius: "0 4px 4px 0",
        overflow: "hidden",
        animationDelay: `${delay}ms`,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "13px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: T.text,
          textAlign: "left",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: FONT.serif,
              fontSize: 14,
              fontWeight: 600,
              color: T.text,
              transition: "color 0.3s",
            }}>
              {flag.clause_type}
            </span>
            <Tag color={color}>{severityLabel(flag.severity)}</Tag>
          </div>
          <span style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: T.textMuted,
            letterSpacing: "0.05em",
          }}>
            {flag.citation}
          </span>
        </div>
        <span style={{
          color: T.textMuted,
          fontSize: 10,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
          display: "inline-block",
          flexShrink: 0,
        }}>▼</span>
      </button>

      <div style={{
        maxHeight: open ? 400 : 0,
        overflow: "hidden",
        transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{
          padding: "4px 16px 16px",
          borderTop: `1px solid ${color}18`,
        }}>
          <p style={{
            fontSize: 13,
            color: T.textSub,
            lineHeight: 1.85,
            marginBottom: flag.excerpt ? 12 : 0,
            fontFamily: FONT.sans,
            transition: "color 0.3s",
          }}>
            {flag.explanation}
          </p>
          {flag.excerpt && (
            <div style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              color: T.textMuted,
              background: T.surface,
              padding: "10px 14px",
              borderLeft: `2px solid ${color}50`,
              lineHeight: 1.75,
              fontStyle: "italic",
              border: `1px solid ${T.borderFaint}`,
              borderLeft: `2px solid ${color}60`,
              transition: "background 0.3s, color 0.3s",
            }}>
              {flag.excerpt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModeItem({ mode, active, onClick, T }) {
  return (
    <button
      onClick={onClick}
      className="btn-hover"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: active ? T.accentBg : "none",
        border: "none",
        borderLeft: `2px solid ${active ? T.accent : "transparent"}`,
        cursor: "pointer",
        color: active ? T.text : T.textMuted,
        fontFamily: FONT.sans,
        fontSize: 13,
        fontWeight: active ? 500 : 300,
        textAlign: "left",
        marginBottom: 2,
        transition: "all 0.18s",
        letterSpacing: "0.01em",
      }}
    >
      <span>{mode.label}</span>
      <span style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        color: active ? T.accent : T.textDim,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        transition: "color 0.18s",
      }}>
        {mode.sub}
      </span>
    </button>
  );
}

export function SuggestionChips({ chips, onSelect, T }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {chips.map(q => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="card-hover"
          style={{
            background: "none",
            border: `1px solid ${T.borderFaint}`,
            color: T.textMuted,
            fontFamily: FONT.mono,
            fontSize: 10,
            padding: "5px 11px",
            cursor: "pointer",
            letterSpacing: "0.04em",
            borderRadius: 2,
            transition: "all 0.18s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = T.borderFaint;
            e.currentTarget.style.color = T.textMuted;
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}

export function SeveritySummary({ risks, T }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      {["HIGH", "MEDIUM", "LOW"].map(s => {
        const count = risks.filter(r => r.severity === s).length;
        if (!count) return null;
        const color = severityColor(s, T);
        return (
          <div key={s} className="fade-up" style={{
            padding: "10px 18px",
            background: severityBg(s),
            border: `1px solid ${color}28`,
            fontFamily: FONT.mono,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 2,
          }}>
            <span style={{ color, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{count}</span>
            <span style={{ color: T.textMuted, letterSpacing: "0.08em" }}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}

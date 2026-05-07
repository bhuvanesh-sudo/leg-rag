// components.jsx — Atomic UI primitives
import { useState } from "react";
import { FONT } from "./theme";

export function Spinner({ color = "#8B0000", size = 5 }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: size, height: size,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          animation: `pulse 1.1s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </span>
  );
}

export function Tag({ children, color, borderColor }) {
  return (
    <span style={{
      fontFamily: FONT.mono,
      fontSize: 10,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      border: `1px solid ${borderColor || color + "50"}`,
      padding: "2px 8px",
      borderRadius: 2,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export function Divider({ T, style }) {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(to right, transparent, ${T.border}80, transparent)`,
      ...style,
    }} />
  );
}

export function Avatar({ letter, T }) {
  return (
    <div style={{
      width: 30, height: 30,
      borderRadius: "50%",
      background: T.accent,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT.serif,
      fontSize: 13,
      fontWeight: 700,
      color: "#F5F0E8",
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

//  SourcePill — expandable citation inside a chat bubble 
function SourcePill({ source, T, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${T.borderFaint}`,
      borderLeft: `2px solid ${T.accent}`,
      marginBottom: 5,
      borderRadius: "0 4px 4px 0",
      overflow: "hidden",
      background: T.surface,
      transition: "all 0.2s",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: T.textMuted,
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.06em",
          transition: "color 0.15s",
        }}
      >
        <span style={{ color: T.text, fontWeight: 400 }}>
          {source.citation || `Source ${index + 1}`}
        </span>
        <span style={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
          display: "inline-block",
          fontSize: 9,
        }}>▼</span>
      </button>
      {open && (
        <div className="slide-in" style={{
          padding: "8px 12px 12px",
          borderTop: `1px solid ${T.borderFaint}`,
        }}>
          {source.section && (
            <div style={{
              color: T.textMuted,
              fontFamily: FONT.mono,
              fontSize: 10,
              marginBottom: 6,
              letterSpacing: "0.06em",
            }}>
              {source.section}
            </div>
          )}
          <div style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: T.textSub,
            lineHeight: 1.75,
            borderLeft: `1px solid ${T.border}`,
            paddingLeft: 10,
            fontStyle: "italic",
          }}>
            {source.excerpt}
          </div>
        </div>
      )}
    </div>
  );
}

//  Bubble — a single chat message 
export function Bubble({ msg, T }) {
  const isUser = msg.role === "user";
  const sources = Array.isArray(msg.sources) ? msg.sources : [];
  return (
    <div className="fade-up" style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 18,
      gap: 10,
      alignItems: "flex-start",
    }}>
      {!isUser && <Avatar letter="L" T={T} />}
      <div style={{ maxWidth: "76%", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          background: isUser ? T.accent : T.panel,
          color: isUser ? "#F5F0E8" : T.text,
          padding: "12px 16px",
          borderRadius: isUser ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
          fontSize: 13.5,
          lineHeight: 1.85,
          fontFamily: FONT.sans,
          whiteSpace: "pre-wrap",
          border: isUser ? "none" : `1px solid ${T.borderFaint}`,
          boxShadow: isUser
            ? "0 2px 12px rgba(139,0,0,0.18)"
            : `0 1px 6px ${T.bg}80`,
          transition: "background 0.3s, color 0.3s, border-color 0.3s",
        }}>
          {msg.content}
        </div>
        {sources.length > 0 && (
          <div style={{ paddingLeft: 4 }}>
            {sources.map((s, i) => (
              <SourcePill key={i} source={s} T={T} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

//  PanelHeader 
export function PanelHeader({ title, subtitle, action, T }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
      }}>
        <div>
          <h2 style={{
            fontFamily: FONT.serif,
            fontSize: 26,
            fontWeight: 600,
            color: T.text,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            transition: "color 0.3s",
          }}>
            {title}
          </h2>
          <p style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: T.textDim,
            marginTop: 5,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "color 0.3s",
          }}>
            {subtitle}
          </p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.loading}
            className="btn-hover"
            style={{
              background: action.loading ? T.panel : T.accent,
              border: "none",
              color: "#F5F0E8",
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "10px 22px",
              cursor: action.loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: action.loading ? 0.7 : 1,
              transition: "background 0.2s, opacity 0.2s",
            }}
          >
            {action.loading
              ? <><Spinner color="#F5F0E8" size={4} /> RUNNING…</>
              : action.label}
          </button>
        )}
      </div>
      <Divider T={T} />
    </div>
  );
}

//  EmptyState 
export function EmptyState({ icon, title, body, T }) {
  return (
    <div className="fade-in" style={{
      textAlign: "center",
      padding: "48px 24px",
      border: `1px dashed ${T.border}`,
      color: T.textMuted,
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: FONT.serif,
        fontSize: 16,
        color: T.text,
        marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: FONT.sans,
        fontSize: 13,
        lineHeight: 1.7,
      }}>
        {body}
      </div>
    </div>
  );
}
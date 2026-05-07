// App.jsx — Root layout, state management, header, sidebar
import { useState, useCallback, Component } from "react";
import { getTheme, GLOBAL_CSS, FONT } from "./theme";
import { Spinner } from "./components";
import { ModeItem } from "./cards";
import { UploadZone, SmallUpload } from "./upload";
import { ChatPanel, RiskPanel, WorryPanel, ComparePanel } from "./panels";

const MODES = [
  { id: "chat",    label: "Q & A",       sub: "Ask anything"  },
  { id: "risks",   label: "Risk Scan",   sub: "Auto-detect"   },
  { id: "worry",   label: "Worry List",  sub: "Top concerns"  },
  { id: "compare", label: "Compare",     sub: "Two versions"  },
];

const SESSION_ID = Math.random().toString(36).slice(2);

export default function App() {
  const [dark, setDark] = useState(true);
  const [doc, setDoc]   = useState(null);
  const [mode, setMode] = useState("chat");
  const T = getTheme(dark);

  const handleIngested = useCallback((data) => {
    setDoc(data);
    setMode("chat");
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: T.bg,
        color: T.text,
        fontFamily: FONT.sans,
        transition: "background 0.35s cubic-bezier(0.22,1,0.36,1), color 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}>

        {/* ── Header ── */}
        <Header dark={dark} setDark={setDark} doc={doc} T={T} />

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Sidebar ── */}
          <Sidebar
            doc={doc}
            mode={mode}
            setMode={setMode}
            onIngested={handleIngested}
            T={T}
          />

          {/* ── Main ── */}
          <main style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: T.bg,
            transition: "background 0.35s cubic-bezier(0.22,1,0.36,1)",
          }}>
            {!doc ? (
              <Landing onIngested={handleIngested} T={T} />
            ) : (
              <ErrorBoundary T={T}>
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}>
                  {mode === "chat"    && <ChatPanel    key={doc.doc_id} doc={doc} sessionId={SESSION_ID} T={T} />}
                  {mode === "risks"   && <RiskPanel    key={doc.doc_id} doc={doc} T={T} />}
                  {mode === "worry"   && <WorryPanel   key={doc.doc_id} doc={doc} T={T} />}
                  {mode === "compare" && <ComparePanel key={doc.doc_id} doc={doc} T={T} />}
                </div>
              </ErrorBoundary>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ dark, setDark, doc, T }) {
  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      height: 58,
      background: T.surface,
      borderBottom: `1px solid ${T.borderFaint}`,
      flexShrink: 0,
      transition: "background 0.35s, border-color 0.35s",
    }}>
      {/* Wordmark */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{
          fontFamily: FONT.serif,
          fontSize: 21,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-0.01em",
          transition: "color 0.3s",
        }}>
          LegalRAG
        </span>
        <span style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          color: T.accent,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}>
          Contract Intelligence
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Active doc pill */}
        {doc && (
          <div className="fade-in" style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: FONT.mono,
            fontSize: 11,
            color: T.textMuted,
            background: T.panel,
            padding: "5px 12px",
            border: `1px solid ${T.borderFaint}`,
            transition: "background 0.3s",
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: "50%",
              background: "#4A8C4A",
              animation: "pulse 2.5s ease-in-out infinite",
              display: "inline-block",
            }} />
            <span style={{ color: T.text, transition: "color 0.3s" }}>
              {doc.filename.length > 28 ? doc.filename.slice(0, 26) + "…" : doc.filename}
            </span>
            <span style={{ color: T.textDim }}>·</span>
            <span>{doc.num_chunks} clauses</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setDark(d => !d)}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            color: T.textMuted,
            width: 36,
            height: 36,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
            borderRadius: 4,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = T.accentBg;
            e.currentTarget.style.borderColor = T.accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = T.panel;
            e.currentTarget.style.borderColor = T.border;
          }}
        >
          {dark ? "☀" : "◑"}
        </button>
      </div>
    </header>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ doc, mode, setMode, onIngested, T }) {
  return (
    <aside style={{
      width: 240,
      background: T.surface,
      borderRight: `1px solid ${T.borderFaint}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      overflow: "hidden",
      transition: "background 0.35s, border-color 0.35s",
    }}>

      {/* Upload */}
      <section style={{ padding: "18px 16px", borderBottom: `1px solid ${T.borderFaint}` }}>
        <SidebarLabel T={T}>Document</SidebarLabel>
        <SmallUpload onIngested={onIngested} label={doc?.filename} T={T} />
      </section>

      {/* Mode picker */}
      {doc && (
        <section style={{ padding: "18px 0 0", borderBottom: `1px solid ${T.borderFaint}` }}>
          <div style={{ padding: "0 16px" }}>
            <SidebarLabel T={T}>Analysis Mode</SidebarLabel>
          </div>
          <div style={{ marginBottom: 8 }}>
            {MODES.map(m => (
              <ModeItem key={m.id} mode={m} active={mode === m.id} onClick={() => setMode(m.id)} T={T} />
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: "auto", padding: "16px", borderTop: `1px solid ${T.borderFaint}` }}>
        <p style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          color: T.textDim,
          lineHeight: 1.75,
          letterSpacing: "0.04em",
          transition: "color 0.3s",
        }}>
          ⚠ Educational only.<br />
          Not a substitute for legal advice.<br />
          Consult a qualified attorney.
        </p>
      </div>
    </aside>
  );
}

// ── Landing ───────────────────────────────────────────────────────────────────
function Landing({ onIngested, T }) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 40px 60px",
      transition: "background 0.35s",
    }}>

      {/* Hero */}
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          fontFamily: FONT.serif,
          fontSize: 52,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          marginBottom: 10,
          transition: "color 0.3s",
        }}>
          Read the fine print.
        </div>
        <div style={{
          fontFamily: FONT.serif,
          fontSize: 52,
          fontWeight: 400,
          fontStyle: "italic",
          color: T.accent,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          marginBottom: 28,
        }}>
          Before it reads you.
        </div>
        <p style={{
          fontFamily: FONT.sans,
          fontSize: 15,
          color: T.textMuted,
          maxWidth: 400,
          lineHeight: 1.85,
          margin: "0 auto",
          fontWeight: 300,
          transition: "color 0.3s",
        }}>
          Upload any contract, lease, employment offer, or NDA.
          Get clause-level explanations, automatic risk detection,
          and plain-English answers.
        </p>
      </div>

      {/* Upload */}
      <div className="fade-up" style={{ width: "100%", animationDelay: "80ms" }}>
        <UploadZone onIngested={onIngested} T={T} />
      </div>

      {/* Feature row */}
      <div className="fade-up" style={{
        display: "flex",
        gap: 36,
        marginTop: 48,
        fontFamily: FONT.mono,
        fontSize: 10,
        color: T.textDim,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        animationDelay: "160ms",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        {["Plain English Q&A", "Risk Detection", "Worry List", "Compare Versions"].map((f, i) => (
          <span key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: T.accent }}>—</span> {f}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Small helper ─────────────────────────────────────────────────────────────
function SidebarLabel({ children, T }) {
  return (
    <div style={{
      fontFamily: FONT.mono,
      fontSize: 9,
      letterSpacing: "0.14em",
      color: T.textDim,
      textTransform: "uppercase",
      marginBottom: 10,
      transition: "color 0.3s",
    }}>
      {children}
    </div>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────
// Catches render errors so a bad API response never blanks the whole screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[LegalRAG] Render error:", error, info);
  }
  render() {
    const { T, children } = this.props;
    if (this.state.error) {
      return (
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: 40,
          color: T?.textMuted || "#8A8A84",
          fontFamily: "'DM Mono', monospace",
        }}>
          <div style={{ fontSize: 28, color: T?.accent || "#8B0000" }}>⚠</div>
          <div style={{ fontSize: 13, letterSpacing: "0.06em" }}>Something went wrong rendering this panel.</div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: T?.accent || "#8B0000",
              border: "none",
              color: "#F5F0E8",
              padding: "8px 20px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
            }}
          >
            RETRY
          </button>
          <div style={{ fontSize: 10, color: T?.textDim || "#4A4A44", maxWidth: 360, textAlign: "center", lineHeight: 1.7 }}>
            {this.state.error?.message}
          </div>
        </div>
      );
    }
    return children;
  }
}
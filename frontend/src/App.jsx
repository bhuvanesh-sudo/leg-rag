import { useState, useRef, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  ivory:     "#F5F0E8",
  ivoryDark: "#EDE7D9",
  cream:     "#FAF7F2",
  charcoal:  "#1A1A18",
  carbon:    "#111110",
  slate:     "#2C2C28",
  ash:       "#4A4A44",
  fog:       "#9A9A92",
  blood:     "#8B0000",
  bloodBright:"#B50000",
  bloodLight: "#D4000020",
  gold:      "#C9A84C",
  goldLight:  "#C9A84C18",
};

// ── Fonts ────────────────────────────────────────────────────────────────────
const FONT_SERIF  = "'Playfair Display', 'Georgia', serif";
const FONT_MONO   = "'DM Mono', 'Courier New', monospace";
const FONT_SANS   = "'DM Sans', 'Helvetica Neue', sans-serif";

// ── Global styles injected once ──────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  background: ${C.charcoal};
  color: ${C.ivory};
  font-family: ${FONT_SANS};
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: ${C.slate}; }
::-webkit-scrollbar-thumb { background: ${C.ash}; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: ${C.fog}; }

::selection { background: ${C.blood}; color: ${C.ivory}; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@keyframes scan {
  from { transform: translateY(-100%); }
  to   { transform: translateY(100vh); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
`;

// ── Severity colors ──────────────────────────────────────────────────────────
function severityColor(s) {
  if (s === "HIGH")   return C.blood;
  if (s === "MEDIUM") return C.gold;
  return "#4A7C4A";
}
function severityBg(s) {
  if (s === "HIGH")   return "#8B000012";
  if (s === "MEDIUM") return "#C9A84C12";
  return "#4A7C4A12";
}
function severityLabel(s) {
  if (s === "HIGH")   return "🔴 HIGH";
  if (s === "MEDIUM") return "🟡 MEDIUM";
  return "🟢 LOW";
}

// ── Utility components ───────────────────────────────────────────────────────
function Divider({ style }) {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(to right, transparent, ${C.ash}60, transparent)`,
      margin: "0",
      ...style,
    }} />
  );
}

function Tag({ children, color = C.fog }) {
  return (
    <span style={{
      fontFamily: FONT_MONO,
      fontSize: 10,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      border: `1px solid ${color}40`,
      padding: "2px 8px",
      borderRadius: 2,
    }}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 5, height: 5,
          borderRadius: "50%",
          background: C.blood,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState("");
  const ref = useRef(0);
  useEffect(() => {
    setDisplayed("");
    ref.current = 0;
    const interval = setInterval(() => {
      if (ref.current < text.length) {
        setDisplayed(text.slice(0, ref.current + 1));
        ref.current++;
      } else {
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayed}<span style={{ animation: "blink 1s step-end infinite" }}>|</span></span>;
}

// ── Source drawer ────────────────────────────────────────────────────────────
function SourceCard({ source, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${C.ash}50`,
      borderLeft: `2px solid ${C.blood}`,
      marginBottom: 6,
      overflow: "hidden",
      background: C.slate,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.fog,
          fontFamily: FONT_MONO,
          fontSize: 11,
        }}
      >
        <span style={{ color: C.ivory }}>{source.citation || `Source ${index + 1}`}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "8px 12px 12px", borderTop: `1px solid ${C.ash}40` }}>
          {source.section && (
            <div style={{ color: C.fog, fontFamily: FONT_MONO, fontSize: 10, marginBottom: 6 }}>
              {source.section}
            </div>
          )}
          <div style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: C.ivory,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            borderLeft: `1px solid ${C.ash}`,
            paddingLeft: 10,
          }}>
            {source.excerpt}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Risk flag card ───────────────────────────────────────────────────────────
function RiskCard({ flag }) {
  const [open, setOpen] = useState(false);
  const color = severityColor(flag.severity);
  return (
    <div style={{
      border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`,
      marginBottom: 10,
      background: severityBg(flag.severity),
      animation: "slideIn 0.3s ease both",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.ivory,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: 14, fontWeight: 600 }}>
              {flag.clause_type}
            </span>
            <Tag color={color}>{severityLabel(flag.severity)}</Tag>
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.fog }}>
            {flag.citation}
          </span>
        </div>
        <span style={{ color: C.fog, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${color}20` }}>
          <p style={{ fontSize: 13, color: C.ivoryDark, lineHeight: 1.8, marginBottom: 10, marginTop: 10 }}>
            {flag.explanation}
          </p>
          {flag.excerpt && (
            <div style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: C.fog,
              background: C.slate,
              padding: "10px 12px",
              borderLeft: `2px solid ${color}50`,
              lineHeight: 1.7,
              fontStyle: "italic",
            }}>
              {flag.excerpt}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 16,
      animation: "fadeUp 0.25s ease both",
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: C.blood,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT_SERIF, fontSize: 12, fontWeight: 700,
          color: C.ivory, flexShrink: 0, marginRight: 10, marginTop: 2,
        }}>
          L
        </div>
      )}
      <div style={{ maxWidth: "78%" }}>
        <div style={{
          background: isUser ? C.blood : C.slate,
          color: C.ivory,
          padding: "12px 16px",
          borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
          fontSize: 13,
          lineHeight: 1.8,
          fontFamily: FONT_SANS,
          whiteSpace: "pre-wrap",
        }}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {msg.sources.map((s, i) => <SourceCard key={i} source={s} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upload zone ──────────────────────────────────────────────────────────────
function UploadZone({ onIngested, loading }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith(".pdf")) {
      setStatus({ type: "error", text: "Only PDF files are accepted." });
      return;
    }
    setStatus({ type: "loading", text: `Ingesting ${file.name}…` });
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/ingest`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Ingestion failed");
      setStatus({ type: "success", text: `Indexed ${data.num_chunks} clauses across ${file.name}` });
      onIngested({ ...data, filename: file.name });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    }
  }, [onIngested]);

  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `1px solid ${dragging ? C.blood : C.ash}`,
          borderStyle: "dashed",
          padding: "56px 40px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          background: dragging ? C.bloodLight : "transparent",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{
          fontFamily: FONT_SERIF,
          fontSize: 38,
          fontWeight: 400,
          color: dragging ? C.bloodBright : C.ash,
          marginBottom: 16,
          transition: "color 0.2s",
        }}>
          +
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 16, color: C.fog, marginBottom: 8 }}>
          Drop a contract PDF
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.ash, letterSpacing: "0.08em" }}>
          OR CLICK TO SELECT
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {status && (
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          fontFamily: FONT_MONO,
          fontSize: 12,
          color: status.type === "error" ? C.bloodBright :
                 status.type === "success" ? "#6BAA6B" : C.fog,
          background: C.slate,
          borderLeft: `2px solid ${
            status.type === "error" ? C.blood :
            status.type === "success" ? "#3D7A3D" : C.ash
          }`,
          animation: "fadeUp 0.2s ease",
        }}>
          {status.type === "loading" ? <><Spinner /> {status.text}</> : status.text}
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ────────────────────────────────────────────────────────────────
const MODES = [
  { id: "chat",   label: "Q&A",          sub: "Ask anything" },
  { id: "risks",  label: "Risk Scan",    sub: "Auto-detect" },
  { id: "worry",  label: "Worry List",   sub: "Top concerns" },
  { id: "compare",label: "Compare",      sub: "Two versions" },
];

function ModeTab({ mode, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        borderBottom: `2px solid ${active ? C.blood : "transparent"}`,
        cursor: "pointer",
        padding: "14px 20px",
        color: active ? C.ivory : C.fog,
        fontFamily: FONT_SANS,
        fontSize: 13,
        fontWeight: active ? 500 : 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        transition: "all 0.15s",
        minWidth: 90,
      }}
    >
      <span>{mode.label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.08em", color: active ? C.blood : C.ash }}>
        {mode.sub.toUpperCase()}
      </span>
    </button>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [doc, setDoc] = useState(null);
  const [mode, setMode] = useState("chat");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const chatEndRef = useRef();

  // Risk/worry/compare state
  const [risks, setRisks]         = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [worryResult, setWorryResult]   = useState(null);
  const [compareDoc, setCompareDoc]     = useState(null);
  const [compareResult, setCompareResult] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Handlers ──
  const handleIngested = useCallback((data) => {
    setDoc(data);
    setMessages([{
      role: "assistant",
      content: `Document loaded: "${data.filename}"\n${data.num_chunks} clauses indexed.\n\nI'm ready to help you understand this contract. Ask me anything — or switch to Risk Scan or Worry List to get an automatic analysis.`,
    }]);
    setRisks(null);
    setRiskAnalysis(null);
    setWorryResult(null);
    setCompareResult(null);
  }, []);

  const sendChat = useCallback(async () => {
    if (!input.trim() || loading || !doc) return;
    const q = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: doc.doc_id, question: q, session_id: sessionId }),
      });
      const data = await res.json();
      setMessages(m => [...m, {
        role: "assistant",
        content: data.answer || data.detail || "No response.",
        sources: data.sources,
      }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, doc, sessionId]);

  const fetchRisks = useCallback(async () => {
    if (!doc || loading) return;
    setLoading(true);
    setRisks(null); setRiskAnalysis(null);
    try {
      const res = await fetch(`${API}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: doc.doc_id }),
      });
      const data = await res.json();
      setRisks(data.flags || []);
      setRiskAnalysis(data.analysis);
    } catch (e) {
      setRiskAnalysis(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [doc, loading]);

  const fetchWorry = useCallback(async () => {
    if (!doc || loading) return;
    setLoading(true);
    setWorryResult(null);
    try {
      const res = await fetch(`${API}/worry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: doc.doc_id }),
      });
      const data = await res.json();
      setWorryResult(data.summary);
    } catch (e) {
      setWorryResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [doc, loading]);

  const runCompare = useCallback(async () => {
    if (!doc || !compareDoc || loading) return;
    setLoading(true);
    setCompareResult(null);
    try {
      const res = await fetch(`${API}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id_a: doc.doc_id, doc_id_b: compareDoc.doc_id }),
      });
      const data = await res.json();
      setCompareResult(data.comparison);
    } catch (e) {
      setCompareResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [doc, compareDoc, loading]);

  // ── Layout ──
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.carbon }}>

        {/* ── Header ── */}
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: 60,
          background: C.charcoal,
          borderBottom: `1px solid ${C.slate}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{
              fontFamily: FONT_SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: C.ivory,
              letterSpacing: "-0.01em",
            }}>
              LegalRAG
            </span>
            <span style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.blood,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}>
              Contract Intelligence
            </span>
          </div>
          {doc && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: C.fog,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#4A9A4A",
                animation: "pulse 2s ease-in-out infinite",
                display: "inline-block",
              }} />
              {doc.filename}
              <span style={{ color: C.ash }}>·</span>
              <span style={{ color: C.ash }}>{doc.num_chunks} clauses</span>
            </div>
          )}
        </header>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Left panel: upload + mode ── */}
          <aside style={{
            width: 260,
            background: C.charcoal,
            borderRight: `1px solid ${C.slate}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}>
            {/* Upload */}
            <div style={{ padding: "20px 16px", borderBottom: `1px solid ${C.slate}` }}>
              <div style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                letterSpacing: "0.14em",
                color: C.ash,
                textTransform: "uppercase",
                marginBottom: 12,
              }}>
                Document
              </div>
              <SmallUpload onIngested={handleIngested} label={doc?.filename} />
            </div>

            {/* Mode selector */}
            {doc && (
              <div style={{ padding: "20px 16px", borderBottom: `1px solid ${C.slate}` }}>
                <div style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  color: C.ash,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}>
                  Analysis Mode
                </div>
                {MODES.map(m => (
                  <SidebarMode
                    key={m.id}
                    mode={m}
                    active={mode === m.id}
                    onClick={() => setMode(m.id)}
                  />
                ))}
              </div>
            )}

            {/* Compare: second doc upload */}
            {doc && mode === "compare" && (
              <div style={{ padding: "16px", borderBottom: `1px solid ${C.slate}` }}>
                <div style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  color: C.blood,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}>
                  Version B
                </div>
                <SmallUpload onIngested={setCompareDoc} label={compareDoc?.filename} />
              </div>
            )}

            {/* Disclaimer */}
            <div style={{ marginTop: "auto", padding: "16px", borderTop: `1px solid ${C.slate}` }}>
              <p style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: C.ash,
                lineHeight: 1.7,
                letterSpacing: "0.04em",
              }}>
                ⚠ Educational only. Not legal advice. Consult a qualified attorney.
              </p>
            </div>
          </aside>

          {/* ── Main content area ── */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.carbon }}>

            {!doc ? (
              /* Landing */
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
              }}>
                <div style={{ marginBottom: 40, textAlign: "center" }}>
                  <div style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 48,
                    fontWeight: 700,
                    color: C.ivory,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: 12,
                  }}>
                    Read the fine print.
                  </div>
                  <div style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 48,
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: C.blood,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: 24,
                  }}>
                    Before it reads you.
                  </div>
                  <p style={{
                    fontFamily: FONT_SANS,
                    fontSize: 14,
                    color: C.fog,
                    maxWidth: 420,
                    lineHeight: 1.8,
                    margin: "0 auto",
                  }}>
                    Upload any contract, lease, employment offer, or NDA.
                    Get plain-English explanations, automatic risk detection,
                    and clause-level citations.
                  </p>
                </div>
                <UploadZone onIngested={handleIngested} loading={loading} />
                <div style={{
                  display: "flex",
                  gap: 32,
                  marginTop: 48,
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: C.ash,
                  letterSpacing: "0.06em",
                }}>
                  {["Plain English Q&A", "Risk Detection", "Worry List", "Compare Versions"].map(f => (
                    <span key={f}>— {f}</span>
                  ))}
                </div>
              </div>

            ) : mode === "chat" ? (
              /* Chat mode */
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
                  {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                  {loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: C.blood,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: FONT_SERIF, fontSize: 12, color: C.ivory,
                      }}>L</div>
                      <Spinner />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <Divider />
                <div style={{ padding: "16px 32px", background: C.charcoal, flexShrink: 0 }}>
                  <div style={{
                    display: "flex",
                    gap: 12,
                    border: `1px solid ${C.slate}`,
                    background: C.slate,
                    padding: "4px 4px 4px 16px",
                  }}>
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                      placeholder="Ask about this contract…"
                      disabled={loading}
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: C.ivory,
                        fontFamily: FONT_SANS,
                        fontSize: 14,
                        padding: "10px 0",
                      }}
                    />
                    <button
                      onClick={sendChat}
                      disabled={loading || !input.trim()}
                      style={{
                        background: input.trim() ? C.blood : C.slate,
                        border: "none",
                        cursor: input.trim() ? "pointer" : "default",
                        color: C.ivory,
                        padding: "10px 20px",
                        fontFamily: FONT_MONO,
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        transition: "background 0.15s",
                      }}
                    >
                      SEND
                    </button>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      "What are my obligations?",
                      "Can they terminate me without cause?",
                      "What happens if I break this agreement?",
                      "Are there any auto-renewal clauses?",
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        style={{
                          background: "none",
                          border: `1px solid ${C.slate}`,
                          color: C.fog,
                          fontFamily: FONT_MONO,
                          fontSize: 10,
                          padding: "4px 10px",
                          cursor: "pointer",
                          letterSpacing: "0.04em",
                          transition: "all 0.15s",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </>

            ) : mode === "risks" ? (
              /* Risk scan mode */
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                <PanelHeader
                  title="Risk Scan"
                  subtitle="Automated detection of potentially harmful clauses"
                  action={!risks ? { label: "Run Scan", onClick: fetchRisks, loading } : null}
                />
                {loading && !risks && (
                  <div style={{ textAlign: "center", padding: 40, color: C.fog, fontFamily: FONT_MONO, fontSize: 13 }}>
                    <Spinner /> <span style={{ marginLeft: 12 }}>Scanning clauses…</span>
                  </div>
                )}
                {risks && (
                  <>
                    <div style={{ display: "flex", gap: 16, marginBottom: 24, marginTop: 4 }}>
                      {["HIGH","MEDIUM","LOW"].map(s => {
                        const count = risks.filter(r => r.severity === s).length;
                        return count > 0 && (
                          <div key={s} style={{
                            padding: "10px 18px",
                            background: severityBg(s),
                            border: `1px solid ${severityColor(s)}30`,
                            fontFamily: FONT_MONO,
                            fontSize: 12,
                          }}>
                            <span style={{ color: severityColor(s), fontWeight: 500 }}>{count}</span>
                            <span style={{ color: C.fog, marginLeft: 6 }}>{s}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginBottom: 28 }}>
                      {risks.map((f, i) => <RiskCard key={i} flag={f} />)}
                    </div>
                    {riskAnalysis && (
                      <>
                        <Divider style={{ marginBottom: 20 }} />
                        <div style={{
                          fontFamily: FONT_MONO,
                          fontSize: 9,
                          letterSpacing: "0.14em",
                          color: C.ash,
                          textTransform: "uppercase",
                          marginBottom: 14,
                        }}>
                          Detailed Analysis
                        </div>
                        <div style={{
                          fontFamily: FONT_SANS,
                          fontSize: 13,
                          lineHeight: 1.9,
                          color: C.ivoryDark,
                          whiteSpace: "pre-wrap",
                        }}>
                          {riskAnalysis}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

            ) : mode === "worry" ? (
              /* Worry list mode */
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                <PanelHeader
                  title="What Should I Worry About?"
                  subtitle="Prioritized list of concerns and negotiation points"
                  action={!worryResult ? { label: "Generate", onClick: fetchWorry, loading } : null}
                />
                {loading && !worryResult && (
                  <div style={{ textAlign: "center", padding: 40, color: C.fog, fontFamily: FONT_MONO, fontSize: 13 }}>
                    <Spinner /> <span style={{ marginLeft: 12 }}>Analyzing…</span>
                  </div>
                )}
                {worryResult && (
                  <div style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    lineHeight: 1.9,
                    color: C.ivoryDark,
                    whiteSpace: "pre-wrap",
                  }}>
                    {worryResult}
                  </div>
                )}
              </div>

            ) : mode === "compare" ? (
              /* Compare mode */
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                <PanelHeader
                  title="Contract Comparison"
                  subtitle="Detect meaningful changes between two versions"
                  action={doc && compareDoc && !compareResult
                    ? { label: "Compare", onClick: runCompare, loading }
                    : null}
                />
                {!compareDoc && (
                  <div style={{
                    padding: "24px",
                    border: `1px dashed ${C.ash}`,
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    color: C.fog,
                    textAlign: "center",
                    marginTop: 16,
                  }}>
                    Upload Version B in the sidebar to compare.
                  </div>
                )}
                {compareDoc && !compareResult && !loading && (
                  <div style={{
                    padding: "24px",
                    background: C.slate,
                    border: `1px solid ${C.ash}40`,
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    color: C.fog,
                    marginTop: 16,
                  }}>
                    <div>Version A: <span style={{ color: C.ivory }}>{doc.filename}</span></div>
                    <div style={{ marginTop: 6 }}>Version B: <span style={{ color: C.ivory }}>{compareDoc.filename}</span></div>
                  </div>
                )}
                {loading && !compareResult && (
                  <div style={{ textAlign: "center", padding: 40, color: C.fog, fontFamily: FONT_MONO, fontSize: 13 }}>
                    <Spinner /> <span style={{ marginLeft: 12 }}>Comparing documents…</span>
                  </div>
                )}
                {compareResult && (
                  <div style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    lineHeight: 1.9,
                    color: C.ivoryDark,
                    whiteSpace: "pre-wrap",
                    marginTop: 16,
                  }}>
                    {compareResult}
                  </div>
                )}
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}

// ── Small sidebar upload ─────────────────────────────────────────────────────
function SmallUpload({ onIngested, label }) {
  const [status, setStatus] = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith(".pdf")) return;
    setStatus("loading");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/ingest`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setStatus("done");
      onIngested({ ...data, filename: file.name });
    } catch {
      setStatus("error");
    }
  }, [onIngested]);

  return (
    <div>
      <button
        onClick={() => inputRef.current.click()}
        style={{
          width: "100%",
          background: label ? C.slate : "none",
          border: `1px solid ${label ? C.ash : C.ash}`,
          borderStyle: label ? "solid" : "dashed",
          padding: "10px 12px",
          color: label ? C.ivory : C.fog,
          fontFamily: FONT_MONO,
          fontSize: 11,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 8,
          letterSpacing: "0.04em",
          overflow: "hidden",
        }}
      >
        <span style={{ color: C.blood }}>PDF</span>
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}>
          {label ? label : "Upload PDF"}
        </span>
        {status === "loading" && <Spinner />}
        {status === "done" && <span style={{ color: "#4A9A4A" }}>✓</span>}
        {status === "error" && <span style={{ color: C.blood }}>✗</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}

// ── Panel header ─────────────────────────────────────────────────────────────
function PanelHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{
            fontFamily: FONT_SERIF,
            fontSize: 26,
            fontWeight: 600,
            color: C.ivory,
            letterSpacing: "-0.01em",
          }}>
            {title}
          </h2>
          <p style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: C.ash,
            marginTop: 4,
            letterSpacing: "0.06em",
          }}>
            {subtitle.toUpperCase()}
          </p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.loading}
            style={{
              background: action.loading ? C.slate : C.blood,
              border: "none",
              color: C.ivory,
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "10px 20px",
              cursor: action.loading ? "default" : "pointer",
              transition: "background 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {action.loading ? <><Spinner /> Running…</> : action.label}
          </button>
        )}
      </div>
      <Divider style={{ marginTop: 16 }} />
    </div>
  );
}

// ── Sidebar mode item ────────────────────────────────────────────────────────
function SidebarMode({ mode, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 12px",
        background: active ? `${C.blood}18` : "none",
        border: "none",
        borderLeft: `2px solid ${active ? C.blood : "transparent"}`,
        cursor: "pointer",
        color: active ? C.ivory : C.fog,
        fontFamily: FONT_SANS,
        fontSize: 13,
        fontWeight: active ? 500 : 300,
        textAlign: "left",
        marginBottom: 2,
        transition: "all 0.15s",
      }}
    >
      <span>{mode.label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: active ? C.blood : C.ash, letterSpacing: "0.08em" }}>
        {mode.sub.toUpperCase()}
      </span>
    </button>
  );
}

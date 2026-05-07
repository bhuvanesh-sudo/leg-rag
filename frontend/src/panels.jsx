// panels.js — ChatPanel, RiskPanel, WorryPanel, ComparePanel
import { useState, useRef, useEffect, useCallback } from "react";
import { FONT } from "./theme.jsx";
import { Spinner, Bubble, PanelHeader, EmptyState } from "./components";
import { RiskCard, SuggestionChips, SeveritySummary } from "./cards";
import { SmallUpload } from "./upload";

const API = "http://localhost:8000";

const SUGGESTIONS = [
  "What are my obligations?",
  "Can they terminate me without cause?",
  "What happens if I break this?",
  "Are there auto-renewal clauses?",
  "Summarize the payment terms.",
];

//  Chat 
export function ChatPanel({ doc, sessionId, T }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `"${doc.filename}" indexed — ${doc.num_chunks} clauses ready.\n\nAsk me anything about this contract in plain English.`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (q) => {
    // chips pass a string; keyboard/button call with no arg uses input state
    const question = (typeof q === "string" ? q : input).trim();
    if (!question || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: doc.doc_id, question, session_id: sessionId }),
      });
      const data = await res.json();
      // Always coerce sources to array — undefined/null would crash .map()
      // Deduplicate sources by citation key — retriever should handle this
      // but we guard on the frontend too so the UI never shows repeated pills
      const rawSources = Array.isArray(data.sources) ? data.sources : [];
      const seen = new Set();
      const sources = rawSources.filter(s => {
        const key = s.citation || s.excerpt?.slice(0, 60) || Math.random();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setMessages(m => [...m, {
        role: "assistant",
        content: data.answer || data.detail || "No response.",
        sources,
      }]);
    } catch (e) {
      setMessages(m => [...m, {
        role: "assistant",
        content: `Connection error: ${e.message}`,
        sources: [],
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, doc, sessionId]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        {messages.map((msg, i) => <Bubble key={i} msg={msg} T={T} />)}
        {loading && (
          <div className="fade-in" style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "4px 0 0 40px",
          }}>
            <Spinner color={T.accent} />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: T.borderFaint, transition: "background 0.3s" }} />

      {/* Input area */}
      <div style={{
        padding: "14px 24px 18px",
        background: T.surface,
        flexShrink: 0,
        transition: "background 0.3s",
      }}>
        <div style={{
          display: "flex",
          gap: 10,
          border: `1px solid ${T.border}`,
          background: T.panel,
          padding: "4px 4px 4px 16px",
          marginBottom: 10,
          transition: "all 0.25s",
        }}
          onFocus={() => {}}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about this contract…"
            disabled={loading}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: T.text,
              fontFamily: FONT.sans,
              fontSize: 14,
              padding: "10px 0",
              transition: "color 0.3s",
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="btn-hover"
            style={{
              background: input.trim() && !loading ? T.accent : T.border,
              border: "none",
              cursor: input.trim() && !loading ? "pointer" : "default",
              color: "#F5F0E8",
              padding: "10px 20px",
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: "0.1em",
              transition: "background 0.2s",
            }}
          >
            {loading ? <Spinner color="#F5F0E8" size={4} /> : "SEND"}
          </button>
        </div>
        <SuggestionChips chips={SUGGESTIONS} onSelect={send} T={T} />
      </div>
    </div>
  );
}

//  Risk Scan 
export function RiskPanel({ doc, T }) {
  const [loading, setLoading] = useState(false);
  const [risks, setRisks] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setRisks(null); setAnalysis(null);
    try {
      const res = await fetch(`${API}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: doc.doc_id }),
      });
      const data = await res.json();
      setRisks(data.flags || []);
      setAnalysis(data.analysis);
    } catch (e) {
      setAnalysis(`Error: ${e.message}`);
      setRisks([]);
    } finally {
      setLoading(false);
    }
  }, [doc]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      <PanelHeader
        title="Risk Scan"
        subtitle="Automated detection of potentially harmful clauses"
        action={!risks ? { label: "RUN SCAN", onClick: run, loading } : null}
        T={T}
      />

      {!risks && !loading && (
        <EmptyState
          icon="⚖"
          title="Run the risk scanner"
          body="Detect non-competes, arbitration clauses, auto-renewals, liability waivers, and more."
          T={T}
        />
      )}

      {loading && (
        <div className="fade-in" style={{
          textAlign: "center",
          padding: "56px 0",
          color: T.textMuted,
          fontFamily: FONT.mono,
          fontSize: 13,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}>
          <Spinner color={T.accent} size={6} />
          <span style={{ letterSpacing: "0.08em" }}>SCANNING CLAUSES…</span>
        </div>
      )}

      {risks && (
        <>
          <SeveritySummary risks={risks} T={T} />
          <div style={{ marginBottom: 28 }}>
            {risks.map((f, i) => (
              <RiskCard key={i} flag={f} T={T} delay={i * 50} />
            ))}
            {risks.length === 0 && (
              <EmptyState
                icon="✓"
                title="No major risks detected"
                body="No high-risk clause patterns were found. Review the full document to verify."
                T={T}
              />
            )}
          </div>
          {analysis && (
            <>
              <div style={{ height: 1, background: T.borderFaint, margin: "20px 0" }} />
              <div style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                color: T.textDim,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}>
                Detailed Analysis
              </div>
              <div style={{
                fontFamily: FONT.sans,
                fontSize: 13.5,
                lineHeight: 1.95,
                color: T.textSub,
                whiteSpace: "pre-wrap",
                transition: "color 0.3s",
              }}>
                {analysis}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

//  Worry List 
export function WorryPanel({ doc, T }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/worry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: doc.doc_id }),
      });
      const data = await res.json();
      setResult(data.summary);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [doc]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      <PanelHeader
        title="What Should I Worry About?"
        subtitle="Prioritized concerns and negotiation points"
        action={!result ? { label: "GENERATE", onClick: run, loading } : null}
        T={T}
      />

      {!result && !loading && (
        <EmptyState
          icon="◎"
          title="Get your worry list"
          body="A prioritized plain-English summary of the most important issues in this contract."
          T={T}
        />
      )}

      {loading && (
        <div className="fade-in" style={{
          textAlign: "center",
          padding: "56px 0",
          color: T.textMuted,
          fontFamily: FONT.mono,
          fontSize: 13,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}>
          <Spinner color={T.accent} size={6} />
          <span style={{ letterSpacing: "0.08em" }}>ANALYZING…</span>
        </div>
      )}

      {result && (
        <div className="fade-up" style={{
          fontFamily: FONT.sans,
          fontSize: 13.5,
          lineHeight: 1.95,
          color: T.textSub,
          whiteSpace: "pre-wrap",
          transition: "color 0.3s",
        }}>
          {result}
        </div>
      )}
    </div>
  );
}

//  Compare 
export function ComparePanel({ doc, T }) {
  const [docB, setDocB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = useCallback(async () => {
    if (!docB) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id_a: doc.doc_id, doc_id_b: docB.doc_id }),
      });
      const data = await res.json();
      setResult(data.comparison);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [doc, docB]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      <PanelHeader
        title="Contract Comparison"
        subtitle="Detect meaningful changes between two versions"
        action={docB && !result ? { label: "COMPARE", onClick: run, loading } : null}
        T={T}
      />

      {/* Version labels */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 24,
      }}>
        <VersionBox label="Version A" filename={doc.filename} filled T={T} />
        {docB
          ? <VersionBox label="Version B" filename={docB.filename} filled T={T} />
          : (
            <div style={{
              border: `1px dashed ${T.border}`,
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Version B
              </div>
              <SmallUpload onIngested={setDocB} T={T} />
            </div>
          )
        }
      </div>

      {!docB && (
        <EmptyState
          icon="⬌"
          title="Upload Version B"
          body="Upload a second contract to compare. Differences in obligations, compensation, and liability will be explained."
          T={T}
        />
      )}

      {loading && (
        <div className="fade-in" style={{
          textAlign: "center",
          padding: "40px 0",
          color: T.textMuted,
          fontFamily: FONT.mono,
          fontSize: 13,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}>
          <Spinner color={T.accent} size={6} />
          <span style={{ letterSpacing: "0.08em" }}>COMPARING DOCUMENTS…</span>
        </div>
      )}

      {result && (
        <div className="fade-up" style={{
          fontFamily: FONT.sans,
          fontSize: 13.5,
          lineHeight: 1.95,
          color: T.textSub,
          whiteSpace: "pre-wrap",
          transition: "color 0.3s",
        }}>
          {result}
        </div>
      )}
    </div>
  );
}

function VersionBox({ label, filename, T }) {
  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      padding: "12px 16px",
      transition: "background 0.3s, border-color 0.3s",
    }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 11, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {filename}
      </div>
    </div>
  );
}
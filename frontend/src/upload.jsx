// upload.js — Upload zone + small sidebar uploader
import { useState, useRef, useCallback } from "react";
import { FONT } from "./theme.js";
import { Spinner } from "./components.jsx";

const API = "http://localhost:8000";

async function ingestFile(file, onSuccess, setStatus) {
  if (!file?.name.endsWith(".pdf")) {
    setStatus({ type: "error", text: "Only PDF files are accepted." });
    return;
  }
  setStatus({ type: "loading", text: `Indexing ${file.name}…` });
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`${API}/ingest`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Ingestion failed");
    setStatus({ type: "success", text: `${data.num_chunks} clauses indexed` });
    onSuccess({ ...data, filename: file.name });
  } catch (e) {
    setStatus({ type: "error", text: e.message });
  }
}

//  Large landing drop zone 
export function UploadZone({ onIngested, T }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback(f => ingestFile(f, onIngested, setStatus), [onIngested]);

  const statusColor = status?.type === "error"   ? T.accent
                    : status?.type === "success" ? "#4A8C4A"
                    : T.textMuted;

  return (
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `1px solid ${dragging ? T.accent : T.border}`,
          borderStyle: "dashed",
          padding: "52px 40px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
          background: dragging ? T.accentBg : "transparent",
          position: "relative",
        }}
      >
        {/* Animated corner accents */}
        {[
          { top: -1, left: -1, borderTop: `2px solid ${T.accent}`, borderLeft: `2px solid ${T.accent}` },
          { top: -1, right: -1, borderTop: `2px solid ${T.accent}`, borderRight: `2px solid ${T.accent}` },
          { bottom: -1, left: -1, borderBottom: `2px solid ${T.accent}`, borderLeft: `2px solid ${T.accent}` },
          { bottom: -1, right: -1, borderBottom: `2px solid ${T.accent}`, borderRight: `2px solid ${T.accent}` },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 16, height: 16,
            transition: "opacity 0.25s",
            opacity: dragging ? 1 : 0,
            ...s,
          }} />
        ))}

        <div style={{
          fontFamily: FONT.serif,
          fontSize: 44,
          color: dragging ? T.accent : T.border,
          marginBottom: 14,
          transition: "color 0.25s",
          lineHeight: 1,
        }}>
          +
        </div>
        <div style={{
          fontFamily: FONT.serif,
          fontSize: 16,
          color: dragging ? T.text : T.textMuted,
          marginBottom: 8,
          transition: "color 0.25s",
        }}>
          Drop a contract PDF
        </div>
        <div style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          color: T.textDim,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          or click to select
        </div>
        <input ref={inputRef} type="file" accept=".pdf"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {status && (
        <div className="fade-up" style={{
          marginTop: 10,
          padding: "10px 14px",
          fontFamily: FONT.mono,
          fontSize: 11,
          color: statusColor,
          background: T.surface,
          border: `1px solid ${T.borderFaint}`,
          borderLeft: `2px solid ${statusColor}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "background 0.3s, border-color 0.3s",
        }}>
          {status.type === "loading" && <Spinner color={T.accent} size={4} />}
          {status.text}
        </div>
      )}
    </div>
  );
}

//  Compact sidebar uploader 
export function SmallUpload({ onIngested, label, T }) {
  const [status, setStatus] = useState(null);
  const inputRef = useRef();
  const handleFile = useCallback(f => ingestFile(f, onIngested, setStatus), [onIngested]);

  return (
    <div>
      <button
        onClick={() => inputRef.current.click()}
        style={{
          width: "100%",
          background: label ? T.panel : "none",
          border: `1px solid ${label ? T.border : T.border}`,
          borderStyle: label ? "solid" : "dashed",
          padding: "9px 12px",
          color: label ? T.text : T.textMuted,
          fontFamily: FONT.mono,
          fontSize: 11,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 8,
          letterSpacing: "0.04em",
          overflow: "hidden",
          transition: "all 0.2s",
        }}
      >
        <span style={{ color: T.accent, flexShrink: 0, letterSpacing: 0 }}>PDF</span>
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}>
          {label || "Upload PDF"}
        </span>
        {status === "loading" && <Spinner color={T.accent} size={4} />}
        {status === "done"    && <span style={{ color: "#4A8C4A" }}>✓</span>}
        {status === "error"   && <span style={{ color: T.accent }}>✗</span>}
      </button>
      <input ref={inputRef} type="file" accept=".pdf"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

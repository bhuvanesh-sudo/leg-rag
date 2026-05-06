"""
risk.py — Rule-based + LLM-assisted risk classifier.

Scans all chunks for known high-risk clause patterns using regex first
(fast, zero-cost), then optionally passes flagged chunks to the LLM
for nuanced risk explanation.
"""

from __future__ import annotations
import re
from dataclasses import dataclass
from langchain_core.documents import Document


@dataclass
class RiskFlag:
    clause_type: str
    severity: str          # "HIGH", "MEDIUM", "LOW"
    citation: str
    excerpt: str
    explanation: str


# ── Pattern registry ─────────────────────────────────────────────────────────
# Each entry: (clause_type, severity, regex_patterns, short_explanation)
RISK_PATTERNS: list[tuple[str, str, list[re.Pattern], str]] = [
    (
        "Non-Compete",
        "HIGH",
        [re.compile(r"\bnon.?compete\b", re.I),
         re.compile(r"\bcompet(e|ition|itor)\b.{0,60}\b(restrict|prohibit|not.{0,10}engag)", re.I)],
        "Restricts your ability to work in the same industry after leaving.",
    ),
    (
        "Mandatory Arbitration",
        "HIGH",
        [re.compile(r"\barbitrat(ion|e|or)\b", re.I),
         re.compile(r"\bwaive.{0,30}\bjury\b", re.I)],
        "Removes your right to sue in court; disputes go to a private arbitrator.",
    ),
    (
        "Auto-Renewal",
        "MEDIUM",
        [re.compile(r"\bauto.?renew", re.I),
         re.compile(r"\bautomatically.{0,40}\brenew", re.I)],
        "Contract renews automatically unless you cancel within a notice window.",
    ),
    (
        "Termination Without Cause",
        "HIGH",
        [re.compile(r"\bterminat.{0,30}\bwithout cause\b", re.I),
         re.compile(r"\bat.?will\b", re.I)],
        "Either party can end the agreement at any time without giving a reason.",
    ),
    (
        "Liability Waiver",
        "HIGH",
        [re.compile(r"\bwaive.{0,40}\bliabilit", re.I),
         re.compile(r"\blimitation of liability\b", re.I),
         re.compile(r"\bindemnif", re.I)],
        "Limits or eliminates your ability to recover damages.",
    ),
    (
        "Exclusivity",
        "MEDIUM",
        [re.compile(r"\bexclusiv(e|ity|ely)\b", re.I)],
        "May prevent you from working with other parties or clients.",
    ),
    (
        "Intellectual Property Assignment",
        "HIGH",
        [re.compile(r"\b(assign|transfer).{0,40}\b(intellectual property|IP|invention|work product)\b", re.I),
         re.compile(r"\bwork.?for.?hire\b", re.I)],
        "You may give up ownership of work you create, even on personal time.",
    ),
    (
        "Unilateral Amendment",
        "HIGH",
        [re.compile(r"\b(may|can|right to).{0,40}\bamend\b.{0,30}\bat.{0,10}(its|their|our)\b.{0,20}(discretion|option|will)\b", re.I),
         re.compile(r"\bmodif.{0,30}\bwithout.{0,30}\bconsent\b", re.I)],
        "The other party can change the terms without your agreement.",
    ),
    (
        "Broad Confidentiality",
        "MEDIUM",
        [re.compile(r"\bconfidentialit", re.I),
         re.compile(r"\bnon.?disclosure\b", re.I)],
        "May restrict what you can say about your work or experience.",
    ),
    (
        "Liquidated Damages / Penalty",
        "HIGH",
        [re.compile(r"\bliquidated damages\b", re.I),
         re.compile(r"\bpenalty.{0,40}\bbreach\b", re.I)],
        "Sets a fixed financial penalty if you break the agreement.",
    ),
    (
        "Governing Law / Jurisdiction",
        "LOW",
        [re.compile(r"\bgoverning law\b", re.I),
         re.compile(r"\bjurisdiction.{0,30}\b(shall be|is)\b", re.I)],
        "Disputes may need to be resolved in a distant jurisdiction.",
    ),
]


def scan_chunks(chunks: list[Document]) -> list[RiskFlag]:
    """
    Scan all chunks with regex patterns. Returns a deduplicated list of RiskFlags.
    """
    seen_types: set[str] = set()
    flags: list[RiskFlag] = []

    for chunk in chunks:
        text = chunk.page_content
        citation = chunk.metadata.get("citation", f"p.{chunk.metadata.get('page', '?')}")

        for clause_type, severity, patterns, explanation in RISK_PATTERNS:
            if clause_type in seen_types:
                continue
            for pat in patterns:
                m = pat.search(text)
                if m:
                    # Extract a short excerpt around the match
                    start = max(0, m.start() - 80)
                    end   = min(len(text), m.end() + 160)
                    excerpt = "..." + text[start:end].strip() + "..."
                    flags.append(RiskFlag(
                        clause_type=clause_type,
                        severity=severity,
                        citation=citation,
                        excerpt=excerpt,
                        explanation=explanation,
                    ))
                    seen_types.add(clause_type)
                    break

    # Sort: HIGH first, then MEDIUM, then LOW
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    flags.sort(key=lambda f: order.get(f.severity, 3))
    return flags


def flags_to_dict(flags: list[RiskFlag]) -> list[dict]:
    return [
        {
            "clause_type": f.clause_type,
            "severity": f.severity,
            "citation": f.citation,
            "excerpt": f.excerpt,
            "explanation": f.explanation,
        }
        for f in flags
    ]

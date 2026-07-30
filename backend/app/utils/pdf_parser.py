"""PDF parsing utilities for SmartHire AI ATS pipeline.

Provides dual-engine text extraction (PyMuPDF + pdfplumber) that
automatically selects the richer output, plus text cleaning and
resume section detection used by the ATS scoring service.
"""

from __future__ import annotations

import re
from typing import Any

import fitz  # PyMuPDF
import pdfplumber


# ---------------------------------------------------------------------------
# Section header → canonical key mapping
# ---------------------------------------------------------------------------

HEADER_MAP: dict[str, str] = {
    # Summary variants
    "SUMMARY": "summary",
    "PROFILE": "summary",
    "CAREER SUMMARY": "summary",
    "PROFESSIONAL SUMMARY": "summary",
    "OBJECTIVE": "summary",
    "CAREER OBJECTIVE": "summary",
    # Education
    "EDUCATION": "education",
    "ACADEMICS": "education",
    "ACADEMIC BACKGROUND": "education",
    "EDUCATIONAL BACKGROUND": "education",
    "QUALIFICATIONS": "education",
    # Skills
    "SKILLS": "skills",
    "SKILLS & COMPETENCIES": "skills",
    "TECHNICAL SKILLS": "skills",
    "CORE SKILLS": "skills",
    "KEY SKILLS": "skills",
    "COMPETENCIES": "skills",
    "TECHNOLOGIES": "skills",
    "TOOLS & TECHNOLOGIES": "skills",
    # Experience
    "EXPERIENCE": "experience",
    "WORK EXPERIENCE": "experience",
    "PROFESSIONAL EXPERIENCE": "experience",
    "EMPLOYMENT HISTORY": "experience",
    "WORK HISTORY": "experience",
    "CAREER HISTORY": "experience",
    # Projects
    "PROJECTS": "projects",
    "PERSONAL PROJECTS": "projects",
    "PROJECT EXPERIENCE": "projects",
    "KEY PROJECTS": "projects",
    "NOTABLE PROJECTS": "projects",
    # Extras
    "CERTIFICATIONS": "certifications",
    "CERTIFICATES": "certifications",
    "ACHIEVEMENTS": "achievements",
    "AWARDS": "achievements",
    "HONORS": "achievements",
    "PUBLICATIONS": "publications",
    "LANGUAGES": "languages",
    "INTERESTS": "interests",
    "HOBBIES": "interests",
    "VOLUNTEER": "volunteer",
    "VOLUNTEERING": "volunteer",
    "EXTRA-CURRICULAR": "extracurricular",
    "EXTRACURRICULAR ACTIVITIES": "extracurricular",
}


# ---------------------------------------------------------------------------
# Low-level extraction helpers
# ---------------------------------------------------------------------------


def extract_text_pymupdf(pdf_path: str) -> str:
    """Extract raw text from a PDF file using PyMuPDF.

    Args:
        pdf_path: Absolute path to the PDF file on disk.

    Returns:
        Raw concatenated text from all pages.

    Raises:
        ValueError: If the file cannot be opened or is not a valid PDF.
    """
    try:
        doc = fitz.open(pdf_path)
        pages_text: list[str] = []
        for page in doc:
            page_text = page.get_text("text")
            if page_text:
                pages_text.append(page_text)
        doc.close()
        return "\n".join(pages_text)
    except Exception as exc:
        raise ValueError(f"PyMuPDF failed to parse '{pdf_path}': {exc}") from exc


def extract_text_pdfplumber(pdf_path: str) -> str:
    """Extract raw text from a PDF file using pdfplumber.

    pdfplumber excels at tables and structured layouts that PyMuPDF may
    reorder. Used as a fallback or quality comparison.

    Args:
        pdf_path: Absolute path to the PDF file on disk.

    Returns:
        Raw concatenated text from all pages.

    Raises:
        ValueError: If the file cannot be opened or is not a valid PDF.
    """
    try:
        pages_text: list[str] = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text)
        return "\n".join(pages_text)
    except Exception as exc:
        raise ValueError(f"pdfplumber failed to parse '{pdf_path}': {exc}") from exc


# ---------------------------------------------------------------------------
# Dual-engine parser
# ---------------------------------------------------------------------------


def parse_pdf(pdf_path: str) -> str:
    """Extract the richest text from a PDF using both engines.

    Runs both PyMuPDF and pdfplumber and returns whichever produces the
    longer (more complete) text.  Falls back gracefully if one engine
    raises an error.

    Args:
        pdf_path: Absolute path to the PDF file on disk.

    Returns:
        Best-quality raw extracted text.

    Raises:
        ValueError: If both engines fail to extract any text.
    """
    text_pymupdf: str = ""
    text_pdfplumber: str = ""

    try:
        text_pymupdf = extract_text_pymupdf(pdf_path)
    except ValueError:
        pass

    try:
        text_pdfplumber = extract_text_pdfplumber(pdf_path)
    except ValueError:
        pass

    if not text_pymupdf and not text_pdfplumber:
        raise ValueError(
            f"Both PDF parsers failed to extract text from '{pdf_path}'. "
            "The file may be image-only or corrupted."
        )

    return text_pymupdf if len(text_pymupdf) >= len(text_pdfplumber) else text_pdfplumber


# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------


def clean_text(text: str) -> str:
    """Normalize extracted PDF text for downstream processing.

    Improvements over the notebook version:
    - Collapse 3+ consecutive blank lines → single blank line (preserves
      paragraph structure needed by the LLM).
    - Strip non-printable / zero-width characters introduced by PDF fonts.
    - Normalise Unicode dashes and bullets to ASCII equivalents.

    Args:
        text: Raw extracted text string.

    Returns:
        Cleaned, normalised text.
    """
    # Remove zero-width and non-printable characters (keep newlines/tabs)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Normalise Unicode bullets and dashes to ASCII
    text = re.sub(r"[•·▪▸►●◆▶\-–—]", "-", text)

    # Collapse multiple horizontal whitespace to a single space
    text = re.sub(r"[ \t]+", " ", text)

    # Collapse 3+ consecutive newlines to 2 (preserves section breaks)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse lines that are entirely whitespace
    text = re.sub(r"\n[ \t]+\n", "\n\n", text)

    return text.strip()


# ---------------------------------------------------------------------------
# Section detector
# ---------------------------------------------------------------------------


def detect_sections(text: str) -> dict[str, str]:
    """Parse resume text into labelled sections using HEADER_MAP.

    Lines that exactly match a known header (case-insensitive) start a new
    section.  Everything before the first recognised header is placed in
    the ``contact`` bucket.

    Args:
        text: Cleaned resume text.

    Returns:
        Dictionary mapping section keys to section body text.
        Always contains at least ``{"contact": "..."}``.
    """
    sections: dict[str, list[str]] = {"contact": []}
    current_section = "contact"

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        upper = stripped.upper()
        if upper in HEADER_MAP:
            current_section = HEADER_MAP[upper]
            if current_section not in sections:
                sections[current_section] = []
        else:
            sections[current_section].append(stripped)

    # Join each section's lines into a single string
    return {key: "\n".join(lines).strip() for key, lines in sections.items()}


# ---------------------------------------------------------------------------
# High-level entry point
# ---------------------------------------------------------------------------


def parse_resume(pdf_path: str) -> dict[str, Any]:
    """Full pipeline: extract → clean → section-detect.

    Args:
        pdf_path: Absolute path to the PDF file on disk.

    Returns:
        Dictionary with keys:
        - ``text``: Full cleaned resume text.
        - ``sections``: Section-keyed dictionary of text fragments.
        - ``length``: Character count of the cleaned text.
        - ``pages``: Number of pages in the PDF.

    Raises:
        ValueError: If the PDF cannot be parsed.
    """
    raw_text = parse_pdf(pdf_path)
    cleaned = clean_text(raw_text)
    sections = detect_sections(cleaned)

    # Count pages with PyMuPDF (it's faster for metadata)
    page_count = 0
    try:
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        doc.close()
    except Exception:
        pass

    return {
        "text": cleaned,
        "sections": sections,
        "length": len(cleaned),
        "pages": page_count,
    }


# ---------------------------------------------------------------------------
# In-memory entry point (production / no-disk path)
# ---------------------------------------------------------------------------


def parse_pdf_from_bytes(pdf_bytes: bytes) -> str:
    """Extract the richest text from a PDF supplied as raw bytes.

    Mirrors ``parse_pdf`` but accepts a ``bytes`` object instead of a file path.
    Uses both PyMuPDF (via ``fitz.open(stream=…)``) and pdfplumber (via
    ``io.BytesIO``) and returns whichever engine produces the longer output.

    Args:
        pdf_bytes: Raw binary content of a PDF file.

    Returns:
        Best-quality raw extracted text.

    Raises:
        ValueError: If both engines fail to extract any text.
    """
    import io as _io

    text_pymupdf: str = ""
    text_pdfplumber: str = ""

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages: list[str] = []
        for page in doc:
            t = page.get_text("text")
            if t:
                pages.append(t)
        doc.close()
        text_pymupdf = "\n".join(pages)
    except Exception:
        pass

    try:
        with pdfplumber.open(_io.BytesIO(pdf_bytes)) as pdf:
            pages = []
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    pages.append(t)
            text_pdfplumber = "\n".join(pages)
    except Exception:
        pass

    if not text_pymupdf and not text_pdfplumber:
        raise ValueError(
            "Both PDF parsers failed to extract text from the provided bytes. "
            "The file may be image-only or corrupted."
        )

    return text_pymupdf if len(text_pymupdf) >= len(text_pdfplumber) else text_pdfplumber


def parse_resume_from_bytes(pdf_bytes: bytes) -> dict[str, Any]:
    """Full pipeline from raw bytes: extract → clean → section-detect.

    Drop-in replacement for ``parse_resume`` that accepts bytes instead of a
    file path.  Used by the production storage path so no temp file is created.

    Args:
        pdf_bytes: Raw binary content of a PDF file.

    Returns:
        Dictionary with keys:
        - ``text``: Full cleaned resume text.
        - ``sections``: Section-keyed dictionary of text fragments.
        - ``length``: Character count of the cleaned text.
        - ``pages``: Number of pages in the PDF.

    Raises:
        ValueError: If the PDF cannot be parsed.
    """
    raw_text = parse_pdf_from_bytes(pdf_bytes)
    cleaned = clean_text(raw_text)
    sections = detect_sections(cleaned)

    page_count = 0
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)
        doc.close()
    except Exception:
        pass

    return {
        "text": cleaned,
        "sections": sections,
        "length": len(cleaned),
        "pages": page_count,
    }


"""Shared helpers for the Word builders: loading YAML/JSON and font styling."""

import json
import sys
from pathlib import Path

from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor


def load_data(path):
    """Load a .yaml/.yml or .json file into a dict. Exits with a clear message on error."""
    p = Path(path)
    if not p.exists():
        sys.exit(f"File not found: {p}")
    text = p.read_text(encoding="utf-8")
    if p.suffix.lower() == ".json":
        return json.loads(text)
    try:
        import yaml
    except ImportError:
        sys.exit("PyYAML is missing. Run: pip install -r workflow/scripts/requirements.txt")
    data = yaml.safe_load(text)
    if not isinstance(data, dict):
        sys.exit(f"{p} must contain a mapping (key: value pairs) at the top level.")
    return data


def style_run(run, size, bold=False, color="000000", font="Calibri"):
    run.font.name = font
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:ascii"), font)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), font)
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)


def style_style(style, size, bold=False, color="000000", font="Calibri"):
    style.font.name = font
    style.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:ascii"), font)
    style.element.rPr.rFonts.set(qn("w:hAnsi"), font)
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor.from_string(color)

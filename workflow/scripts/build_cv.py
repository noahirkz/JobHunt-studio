#!/usr/bin/env python3
"""Build a one-page Word CV from a profile file.

Usage:
    python workflow/scripts/build_cv.py workflow/profile.yaml
    python workflow/scripts/build_cv.py workflow/examples/profile.example.yaml -o output/cv.docx

The profile uses the same shape as the tailored CV in the web app:
    name, headline, contact, summary,
    sections: [{title, rows: [{label, text}]} or {title, entries: [{role, org, place, dates, bullets}]}]
"""

import argparse
import re
from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

from _common import load_data, style_run, style_style

ACCENT = "1F4E79"
DARK = "163A5F"
GREY = "404040"


def add_rule(paragraph, color=ACCENT):
    """Thin line under a paragraph (used under the contact line)."""
    p_pr = paragraph._p.get_or_add_pPr()
    borders = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    for k, v in {"w:val": "single", "w:sz": "8", "w:space": "4", "w:color": color}.items():
        bottom.set(qn(k), v)
    borders.append(bottom)
    p_pr.append(borders)


def setup_styles(doc):
    sec = doc.sections[0]
    sec.top_margin = sec.bottom_margin = Inches(0.62)
    sec.left_margin = sec.right_margin = Inches(0.70)

    normal = doc.styles["Normal"]
    style_style(normal, 10.2)
    normal.paragraph_format.space_after = Pt(2)
    normal.paragraph_format.line_spacing = 1.04

    body = doc.styles.add_style("Resume Body", WD_STYLE_TYPE.PARAGRAPH)
    style_style(body, 10.2)
    body.paragraph_format.space_after = Pt(2)
    body.paragraph_format.line_spacing = 1.04

    section = doc.styles.add_style("Resume Section", WD_STYLE_TYPE.PARAGRAPH)
    style_style(section, 10.1, bold=True, color=ACCENT)
    section.paragraph_format.space_before = Pt(6)
    section.paragraph_format.space_after = Pt(3)
    section.paragraph_format.keep_with_next = True

    role = doc.styles.add_style("Resume Role", WD_STYLE_TYPE.PARAGRAPH)
    style_style(role, 10.2, bold=True)
    role.paragraph_format.space_before = Pt(3)
    role.paragraph_format.space_after = Pt(1)
    role.paragraph_format.keep_with_next = True


def add_header(doc, data):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    style_run(p.add_run(str(data.get("name", "")).upper()), 20, bold=True, color=DARK)

    if data.get("headline"):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(1)
        style_run(p.add_run(str(data["headline"]).upper()), 10.6, bold=True, color=ACCENT)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(5)
    style_run(p.add_run(str(data.get("contact", ""))), 9.4, color=GREY)
    add_rule(p)

    if data.get("summary"):
        doc.add_paragraph("PROFILE", style="Resume Section")
        doc.add_paragraph(str(data["summary"]).strip(), style="Resume Body")


def add_entry(doc, e):
    p = doc.add_paragraph(style="Resume Role")
    p.add_run(str(e.get("role", "")))
    if e.get("org"):
        p.add_run(" | ").italic = True
        p.add_run(str(e["org"])).italic = True
    meta_bits = [str(e[k]) for k in ("place", "dates") if e.get(k)]
    if meta_bits:
        meta = doc.add_paragraph(style="Resume Body")
        meta.paragraph_format.space_after = Pt(1)
        if e.get("place"):
            r = meta.add_run(str(e["place"]))
            r.italic = True
            r.font.color.rgb = RGBColor(89, 89, 89)
        if e.get("place") and e.get("dates"):
            meta.add_run(" | ")
        if e.get("dates"):
            meta.add_run(str(e["dates"])).bold = True
    for item in e.get("bullets") or []:
        if not item:
            continue
        b = doc.add_paragraph(style="List Bullet")
        b.paragraph_format.left_indent = Inches(0.22)
        b.paragraph_format.first_line_indent = Inches(-0.16)
        b.paragraph_format.space_after = Pt(1.5)
        b.add_run(str(item))


def add_row(doc, r):
    p = doc.add_paragraph(style="Resume Body")
    if r.get("label"):
        p.add_run(f"{r['label']}: ").bold = True
    p.add_run(str(r.get("text", "")))


def build(data, out):
    doc = Document()
    setup_styles(doc)
    add_header(doc, data)
    for s in data.get("sections") or []:
        doc.add_paragraph(str(s.get("title", "")).upper(), style="Resume Section")
        for e in s.get("entries") or []:
            add_entry(doc, e)
        for r in s.get("rows") or []:
            add_row(doc, r)
    doc.core_properties.author = str(data.get("name", ""))
    doc.core_properties.title = f"{data.get('name', '')} - CV"
    out.parent.mkdir(parents=True, exist_ok=True)
    doc.save(out)
    return out


def default_out(data):
    name = re.sub(r"[^\w]+", "_", str(data.get("name", "CV")).title()).strip("_") or "CV"
    return Path("output") / f"{name}_CV.docx"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("profile", help="profile .yaml or .json")
    ap.add_argument("-o", "--out", help="output .docx (default: output/<Name>_CV.docx)")
    args = ap.parse_args()
    data = load_data(args.profile)
    print(build(data, Path(args.out) if args.out else default_out(data)))


if __name__ == "__main__":
    main()

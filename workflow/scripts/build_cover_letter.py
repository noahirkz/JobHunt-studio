#!/usr/bin/env python3
"""Build a Word cover letter from your profile (name + contact line) and a letter file.

Usage:
    python workflow/scripts/build_cover_letter.py workflow/profile.yaml workflow/letter.yaml
    python workflow/scripts/build_cover_letter.py workflow/examples/profile.example.yaml \
        workflow/examples/letter.example.yaml -o output/letter.docx

Letter file keys: subject, greeting, paragraphs (list), closing,
and optionally date (YYYY-MM-DD), recipient (multi-line) and signature.
"""

import argparse
import datetime as dt
import re
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt

from _common import load_data, style_run, style_style


def nice_date(value):
    if not value:
        d = dt.date.today()
    elif isinstance(value, dt.date):
        d = value
    else:
        d = dt.date.fromisoformat(str(value))
    return f"{d.day} {d.strftime('%B %Y')}"


def para(doc, text, after=6, bold=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.10
    r = p.add_run(str(text).strip())
    r.bold = bold
    return p


def build(profile, letter, out):
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = sec.bottom_margin = sec.left_margin = sec.right_margin = Inches(1)
    normal = doc.styles["Normal"]
    style_style(normal, 11)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.10

    name = str(profile.get("name", "")).title() if str(profile.get("name", "")).isupper() else str(profile.get("name", ""))

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    style_run(p.add_run(name), 15, bold=True, color="1F4D78")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(10)
    style_run(p.add_run(str(profile.get("contact", ""))), 10, color="404040")

    para(doc, nice_date(letter.get("date")), after=12)
    if letter.get("recipient"):
        para(doc, letter["recipient"], after=12)
    if letter.get("subject"):
        para(doc, letter["subject"], after=12, bold=True)
    if letter.get("greeting"):
        para(doc, letter["greeting"])
    for text in letter.get("paragraphs") or []:
        para(doc, text)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.add_run(f"{letter.get('closing', 'Best regards,')}\n{letter.get('signature') or name}")

    doc.core_properties.author = name
    doc.core_properties.title = str(letter.get("subject") or f"{name} - Cover letter")
    out.parent.mkdir(parents=True, exist_ok=True)
    doc.save(out)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("profile", help="profile .yaml or .json (for name and contact line)")
    ap.add_argument("letter", help="letter .yaml or .json")
    ap.add_argument("-o", "--out", help="output .docx (default: output/<Name>_CoverLetter.docx)")
    args = ap.parse_args()
    profile, letter = load_data(args.profile), load_data(args.letter)
    stem = re.sub(r"[^\w]+", "_", str(profile.get("name", "Letter")).title()).strip("_") or "Letter"
    out = Path(args.out) if args.out else Path("output") / f"{stem}_CoverLetter.docx"
    print(build(profile, letter, out))


if __name__ == "__main__":
    main()

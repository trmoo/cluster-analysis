#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""교사용 답안지 .md → .docx  — © 2026 티쳐무 · 모든 권리 보유

    python tools/make_docx.py                 # 교사용-답안지.md → 교사용-답안지.docx
    python tools/make_docx.py 다른파일.md      # 아무 마크다운이나

선생님이 워드로 열어 인쇄하거나 고쳐 쓰실 수 있게 하려고 둔 것이다.
표·굵게·머리글·인용·목록·구분선을 옮긴다.

⚠ 파이썬 `python-docx` 가 있어야 한다 (이 PC 에는 전역에 깔려 있다).
  **앱 폴더에 npm 의존성으로 넣지 말 것** — 답안지 만들기는 앱 빌드와 따로다.
⚠ 한글은 `rFonts` 의 `eastAsia` 를 따로 지정해야 글꼴이 먹는다. `_font()` 가 그 일을 한다.
⚠ 표 칸에 빈 문단이 남으면 줄 높이가 두 배가 된다. `_cell()` 이 첫 문단을 다시 쓴다.
⚠ 윈도우 콘솔이 CP949 라 `PYTHONUTF8=1` 없이 돌리면 이모지에서 죽는다.
"""
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm

BODY = '맑은 고딕'
MONO = 'D2Coding'          # 없으면 워드가 알아서 비슷한 글꼴로 바꾼다
RED = RGBColor(0xC0, 0x1C, 0x28)
GREY = RGBColor(0x60, 0x66, 0x70)
BRAND = RGBColor(0x1F, 0x6F, 0xB2)


def _font(run, name=BODY, size=10.5, bold=False, color=None, italic=False):
    """한글이 제대로 나오게 글꼴을 입힌다 — eastAsia 를 꼭 함께 지정한다."""
    run.font.name = name
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color is not None:
        run.font.color.rgb = color
    run._element.rPr.rFonts.set(qn('w:eastAsia'), name)


# 굵게(**…**) · 기울임(*…*) · 인라인 코드(`…`) 를 한 줄에서 갈라낸다
# ⚠ **굵게** 를 *기울임* 보다 **먼저** 찾아야 한다 — 차례가 바뀌면 ** 가 * 둘로 쪼개진다.
_PIECE = re.compile(r'(\*\*.+?\*\*|\*[^*\n]+?\*|`[^`]+`)')


def _write(par, text, size=10.5, color=None):
    """**굵게** · *기울임* · `코드` 를 살려 문단에 글을 넣는다."""
    for piece in _PIECE.split(text):
        if not piece:
            continue
        if piece.startswith('**') and piece.endswith('**'):
            _font(par.add_run(piece[2:-2]), size=size, bold=True, color=color)
        elif piece.startswith('*') and piece.endswith('*'):
            _font(par.add_run(piece[1:-1]), size=size, italic=True, color=color or GREY)
        elif piece.startswith('`') and piece.endswith('`'):
            _font(par.add_run(piece[1:-1]), name=MONO, size=size - 0.5, color=color)
        else:
            _font(par.add_run(piece), size=size, color=color)


def _cell(cell, text, size=9.5, bold=False, color=None):
    """표 한 칸. ⚠ 빈 문단을 남기면 줄 높이가 두 배가 된다 — 첫 문단을 다시 쓴다."""
    par = cell.paragraphs[0]
    par.paragraph_format.space_before = Pt(1)
    par.paragraph_format.space_after = Pt(1)
    for piece in _PIECE.split(text):
        if not piece:
            continue
        if piece.startswith('**') and piece.endswith('**'):
            _font(par.add_run(piece[2:-2]), size=size, bold=True, color=color)
        elif piece.startswith('`') and piece.endswith('`'):
            _font(par.add_run(piece[1:-1]), name=MONO, size=size - 0.5, color=color)
        else:
            _font(par.add_run(piece), size=size, bold=bold, color=color)


def _split_row(line):
    cells = line.strip().strip('|').split('|')
    return [c.strip() for c in cells]


def _is_sep(line):
    return bool(re.fullmatch(r'\|[\s:|-]+\|', line.strip()))


def add_table(doc, rows):
    head, body = rows[0], rows[1:]
    t = doc.add_table(rows=len(rows), cols=len(head))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    # ⚠ 그냥 두면 칸이 똑같은 너비로 나뉘어, 「상·중·하」 같은 짧은 칸이 쓸데없이 넓어진다.
    #   칸마다 가장 긴 글의 길이에 맞춰 나눈다(한 칸이 전체의 15% 아래로는 가지 않게).
    t.autofit = False
    usable = doc.sections[0].page_width - doc.sections[0].left_margin - doc.sections[0].right_margin
    span = [max(len(r[j]) if j < len(r) else 0 for r in rows) for j in range(len(head))]
    total = sum(span) or 1
    share = [max(0.15 / len(head) + 0.85 * s / total, 0.10) for s in span]
    scale = sum(share)
    for j, frac in enumerate(share):
        w = int(usable * frac / scale)
        for row in t.rows:
            row.cells[j].width = w
    for j, h in enumerate(head):
        _cell(t.rows[0].cells[j], h, bold=True)
    for i, r in enumerate(body, start=1):
        for j in range(len(head)):
            _cell(t.rows[i].cells[j], r[j] if j < len(r) else '')
    doc.add_paragraph()
    return t


def convert(src: Path, dst: Path):
    lines = src.read_text(encoding='utf-8').split('\n')
    doc = Document()
    sec = doc.sections[0]
    sec.left_margin = sec.right_margin = Cm(2.0)
    sec.top_margin = sec.bottom_margin = Cm(1.8)

    # 머리글에 배부 금지를 붉게 — 선생님이 실수로 나눠 주지 않게
    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    _font(hp.add_run('교사용 — 정답이 들어 있습니다. 학생 배부 금지'), size=9, bold=True, color=RED)

    i = 0
    while i < len(lines):
        line = lines[i].rstrip()

        # 표
        if line.startswith('|') and i + 1 < len(lines) and _is_sep(lines[i + 1]):
            rows = [_split_row(line)]
            i += 2
            while i < len(lines) and lines[i].strip().startswith('|'):
                rows.append(_split_row(lines[i]))
                i += 1
            add_table(doc, rows)
            continue

        if not line.strip():
            i += 1
            continue

        # 구분선
        if re.fullmatch(r'-{3,}', line.strip()):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            _font(p.add_run('─' * 46), size=9, color=GREY)
            i += 1
            continue

        # 머리글
        m = re.match(r'^(#{1,4})\s+(.*)$', line)
        if m:
            lv, text = len(m.group(1)), m.group(2)
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16 if lv <= 2 else 10)
            p.paragraph_format.space_after = Pt(5)
            p.paragraph_format.keep_with_next = True       # 제목만 쪽 끝에 남지 않게
            size = {1: 17, 2: 13.5, 3: 11.5, 4: 10.5}[lv]
            _write(p, text, size=size, color=BRAND if lv <= 2 else None)
            for r in p.runs:
                r.bold = True
            i += 1
            continue

        # 인용 (>)
        if line.lstrip().startswith('>'):
            buf = []
            while i < len(lines) and lines[i].lstrip().startswith('>'):
                buf.append(lines[i].lstrip()[1:].strip())
                i += 1
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.6)
            p.paragraph_format.space_after = Pt(6)
            _write(p, ' '.join(x for x in buf if x), color=GREY)
            continue

        # 번호 목록 (1. …) — 줄마다 따로 문단으로 둔다
        m = re.match(r'^(\d+)\.\s+(.*)$', line)
        if m:
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.5)
            p.paragraph_format.space_after = Pt(2)
            _font(p.add_run(m.group(1) + '. '), size=10.5, bold=True)
            _write(p, m.group(2))
            i += 1
            continue

        # 목록
        m = re.match(r'^(\s*)[-*]\s+(.*)$', line)
        if m:
            depth = len(m.group(1)) // 2
            # 이어지는 줄(다음 항목도 머리글도 아닌 줄)은 같은 항목에 붙인다 —
            # 안 붙이면 줄바꿈 자리마다 들여쓰기가 끊겨 글이 들쭉날쭉해진다.
            buf = [m.group(2)]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(
                    r'^(#{1,4}\s|\||\s*[-*]\s|\d+\.\s|>|-{3,}$)', lines[i].rstrip()):
                buf.append(lines[i].strip())
                i += 1
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.5 + depth * 0.5)
            p.paragraph_format.space_after = Pt(2)
            _font(p.add_run('· '), size=10.5)
            _write(p, ' '.join(buf))
            continue

        # 보통 문단 — 이어지는 줄을 하나로 합친다
        buf = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
                r'^(#{1,4}\s|\||\s*[-*]\s|\d+\.\s|>|-{3,}$)', lines[i].rstrip()):
            buf.append(lines[i].strip())
            i += 1
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        _write(p, ' '.join(buf))

    # ⚠ 선생님이 결과물을 워드로 열어 둔 채 다시 만드는 일이 흔하다.
    #   그때 PermissionError 로 죽으면 아무것도 안 남으니 알아보기 쉽게 알린다.
    try:
        doc.save(str(dst))
    except PermissionError:
        print('✗ ' + dst.name + ' 이 열려 있어 저장하지 못했습니다. 워드를 닫고 다시 돌려 주세요.')
        return False
    print('만들었습니다 → ' + dst.name + '  (' + str(round(dst.stat().st_size / 1024, 1)) + 'KB)')
    return True


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else root / '교사용-답안지.md'
    if not src.is_absolute():
        src = root / src
    if not src.exists():
        print('✗ 파일이 없습니다: ' + str(src))
        sys.exit(1)
    sys.exit(0 if convert(src, src.with_suffix('.docx')) else 1)

"""Build a business's static website from its content file.

    python3 template/build.py content/guppi.json .

Pages come from template/render.py. While the site is still published as static files, the
portal's own marker blocks (portal-seo in the head, portal-reviews on the reviews and item
pages) are carried over from the files already in the output folder, so the portal keeps
managing them. When the portal serves the site itself, it renders those parts directly.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from render import render_site  # noqa: E402

SEO = re.compile(r'<!-- portal-seo:(\w+):[^>]*-->.*?<!-- /portal-seo -->', re.S)
REVIEWS = re.compile(r'<!-- portal-reviews:(\w+) -->.*?<!-- /portal-reviews -->', re.S)


def carry_portal_blocks(new: str, old: str) -> str:
    seo = {m.group(1): m.group(0) for m in SEO.finditer(old)}
    if 'title' in seo:
        new = re.sub(r'<title>.*?</title>', lambda m: seo['title'], new, count=1, flags=re.S)
    if 'description' in seo:
        new = re.sub(r'<meta name="description" content="[^"]*">', lambda m: seo['description'], new, count=1)
    if 'facts' in seo:
        new = re.sub(r'(<link rel="stylesheet" href="[^"]*assets/site\.css">)', lambda m: m.group(1) + seo['facts'], new, count=1)
    reviews = {m.group(1): m.group(0) for m in REVIEWS.finditer(old)}
    return re.sub(r'<!--slot:portal-reviews:(\w+)-->', lambda m: reviews.get(m.group(1), ''), new)


def build(content_path: str, out_dir: str) -> list[str]:
    content = json.loads(Path(content_path).read_text(encoding='utf8'))
    out = Path(out_dir)
    written = []
    for rel, html in render_site(content).items():
        target = out / rel
        old = target.read_text(encoding='utf8') if target.exists() else ''
        html = carry_portal_blocks(html, old)
        if html != old:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(html, encoding='utf8')
            written.append(rel)
    return written


if __name__ == '__main__':
    changed = build(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else '.')
    print(f'{len(changed)} pages written')

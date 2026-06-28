from pathlib import Path
import re
import shutil
from html import escape

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"

OUT_DIRS = [
    PUBLIC / "logos" / "indian-providers",
    PUBLIC / "provider-logos" / "indian",
    PUBLIC / "providers" / "indian",
]

PROVIDERS = [
    {"key": "netflix", "label": "Netflix", "aliases": ["netflix"]},
    {"key": "prime_video", "label": "Prime Video", "aliases": ["prime", "prime-video", "amazon-prime", "amazon-prime-video"]},
    {"key": "jiohotstar", "label": "JioHotstar", "aliases": ["jiohotstar", "hotstar", "jio-hotstar", "disney-hotstar"]},
    {"key": "zee5", "label": "ZEE5", "aliases": ["zee5", "zee-5"]},
    {"key": "sonyliv", "label": "SonyLIV", "aliases": ["sonyliv", "sony-liv"]},
    {"key": "aha", "label": "Aha", "aliases": ["aha"]},
    {"key": "sun_nxt", "label": "Sun NXT", "aliases": ["sun-nxt", "sunnxt", "sun_nxt"]},
    {"key": "etv_win", "label": "ETV Win", "aliases": ["etv-win", "etv_win"]},
    {"key": "youtube", "label": "YouTube", "aliases": ["youtube", "you-tube"]},
]

IMAGE_EXTS = {".svg", ".png", ".jpg", ".jpeg", ".webp", ".avif"}

def slugify(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

def find_existing_logo(provider):
    if not PUBLIC.exists():
        return None

    aliases = {provider["key"], slugify(provider["label"])}
    aliases.update(provider["aliases"])

    candidates = []
    for path in PUBLIC.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in IMAGE_EXTS:
            continue

        name = slugify(path.stem)
        full = slugify(str(path.relative_to(PUBLIC)))

        for alias in aliases:
            alias_slug = slugify(alias)
            if alias_slug and (alias_slug == name or alias_slug in full):
                candidates.append(path)

    if not candidates:
        return None

    candidates.sort(key=lambda p: (len(str(p)), str(p).lower()))
    return candidates[0]

def badge_svg(label):
    safe = escape(label)
    font_size = 26 if len(label) <= 8 else 22 if len(label) <= 12 else 18

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="96" viewBox="0 0 240 96" role="img" aria-label="{safe}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0B1020"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="240" height="96" rx="24" fill="url(#g)"/>
  <rect x="3" y="3" width="234" height="90" rx="21" fill="none" stroke="#22D3EE" stroke-width="3"/>
  <text x="120" y="57" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="{font_size}" font-weight="800" fill="#FFFFFF">{safe}</text>
</svg>
'''

def main():
    for d in OUT_DIRS:
        d.mkdir(parents=True, exist_ok=True)

    report = []

    for provider in PROVIDERS:
        existing = find_existing_logo(provider)

        for out_dir in OUT_DIRS:
            svg_out = out_dir / f'{provider["key"]}.svg'

            if existing:
                out = out_dir / f'{provider["key"]}{existing.suffix.lower()}'
                if not out.exists():
                    shutil.copy2(existing, out)
                status = "copied_existing"
                output = out
            else:
                if not svg_out.exists():
                    svg_out.write_text(badge_svg(provider["label"]), encoding="utf-8")
                status = "created_svg_badge"
                output = svg_out

            report.append({
                "provider": provider["key"],
                "label": provider["label"],
                "status": status,
                "source": str(existing) if existing else None,
                "output": str(output),
            })

    print("=" * 100)
    print("INDIAN PROVIDER LOGOS V1")
    print("=" * 100)
    for row in report:
        print(f'{row["provider"]:15} {row["status"]:20} {row["output"]}')
    print("=" * 100)
    print("INDIAN_PROVIDER_LOGOS_V1_PASS")

if __name__ == "__main__":
    main()

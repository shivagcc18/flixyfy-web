from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parent

SOURCE_DIR = ROOT / "public" / "ott"
TARGET_DIR = ROOT / "public" / "provider-logos" / "indian"
MANIFEST = TARGET_DIR / "_indian_provider_logos_v1.json"

PROVIDERS = {
    "netflix": "netflix.png",
    "prime-video": "prime-video.png",
    "amazon-prime-video": "prime-video.png",
    "jiohotstar": "jiohotstar.png",
    "hotstar": "jiohotstar.png",
    "zee5": "zee5.png",
    "sonyliv": "sonyliv.png",
    "sony-liv": "sonyliv.png",
    "sun-nxt": "sun-nxt.png",
    "sunnxt": "sun-nxt.png",
    "aha": "aha.png",
    "etv-win": "etv-win.png",
    "vi-movies-and-tv": "VI_movies.png",
    "google-play-movies": "Google.png",
    "apple-tv-store": "AppleTV.png",
    "youtube": "youtube.png",
}

def main():
    print("=" * 100)
    print("COPY INDIAN PROVIDER LOGOS TO PUBLIC V1")
    print("=" * 100)
    print("Source:", SOURCE_DIR)
    print("Target:", TARGET_DIR)
    print("-" * 100)

    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    rows = []
    copied = 0
    existing = 0
    missing = 0

    for provider_key, source_file in PROVIDERS.items():
        src = SOURCE_DIR / source_file

        # Normalize target filenames.
        target_name = source_file
        if source_file == "VI_movies.png":
            target_name = "vi-movies-and-tv.png"
        if source_file == "Google.png":
            target_name = "google-play-movies.png"
        if source_file == "AppleTV.png":
            target_name = "apple-tv-store.png"

        dst = TARGET_DIR / target_name
        public_path = f"/provider-logos/indian/{target_name}"

        if not src.exists():
            print("MISSING:", provider_key, "=>", src)
            missing += 1
            rows.append({
                "provider_key": provider_key,
                "source_file": str(src),
                "public_path": public_path,
                "status": "missing",
            })
            continue

        if dst.exists() and dst.stat().st_size > 0:
            print("EXISTS :", provider_key, "=>", public_path)
            existing += 1
            status = "exists"
        else:
            shutil.copy2(src, dst)
            print("COPIED :", provider_key, "=>", public_path)
            copied += 1
            status = "copied"

        rows.append({
            "provider_key": provider_key,
            "source_file": str(src),
            "target_file": str(dst),
            "public_path": public_path,
            "status": status,
        })

    MANIFEST.write_text(
        json.dumps(
            {
                "source_dir": str(SOURCE_DIR),
                "target_dir": str(TARGET_DIR),
                "copied": copied,
                "existing": existing,
                "missing": missing,
                "logos": rows,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print("-" * 100)
    print("copied :", copied)
    print("existing:", existing)
    print("missing:", missing)
    print("manifest:", MANIFEST)
    print("=" * 100)

if __name__ == "__main__":
    main()
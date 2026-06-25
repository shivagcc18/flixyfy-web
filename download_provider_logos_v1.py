import json
import sqlite3
import urllib.request
from pathlib import Path

FRONTEND_ROOT = Path.cwd()
DB_PATH = Path(r"C:\Users\USER\Desktop\ott_project\data_factory\db\flixyfy.db")
OUT_DIR = FRONTEND_ROOT / "public" / "provider-logos"

TMDB_LOGO_BASE = "https://image.tmdb.org/t/p/w92"

TABLES = [
    "hollywood_availability_v2",
    "historical_availability_v2",
    "ott_availability_normalized_v1",
]

def table_exists(cur, table):
    return cur.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1",
        (table,),
    ).fetchone() is not None

def columns(cur, table):
    return [row[1] for row in cur.execute(f'PRAGMA table_info("{table}")').fetchall()]

def safe_filename(logo_path):
    value = str(logo_path or "").strip()

    if not value:
        return None

    if value.startswith("http"):
        value = value.split("?", 1)[0].rstrip("/").split("/")[-1]
    else:
        value = value.lstrip("/").replace("/", "_")

    value = value.replace("\\", "_").replace(":", "_").replace("?", "_")

    return value or None

def logo_url(logo_path):
    value = str(logo_path or "").strip()

    if not value:
        return None

    if value.startswith("http"):
        return value

    if value.startswith("/"):
        return TMDB_LOGO_BASE + value

    return TMDB_LOGO_BASE + "/" + value

def collect_logo_paths():
    if not DB_PATH.exists():
        raise SystemExit(f"DB not found: {DB_PATH}")

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    logo_paths = set()

    for table in TABLES:
        if not table_exists(cur, table):
            print(f"SKIP missing table: {table}")
            continue

        cols = columns(cur, table)
        print(f"Scanning: {table}")

        if "provider_links_json" in cols:
            rows = cur.execute(
                f'''
                SELECT provider_links_json
                FROM "{table}"
                WHERE provider_links_json IS NOT NULL
                  AND TRIM(CAST(provider_links_json AS TEXT)) <> ''
                '''
            ).fetchall()

            for (raw,) in rows:
                try:
                    data = json.loads(raw)
                except Exception:
                    continue

                if not isinstance(data, list):
                    continue

                for item in data:
                    if not isinstance(item, dict):
                        continue

                    logo_path = item.get("logo_path") or item.get("provider_logo_path")
                    if logo_path:
                        logo_paths.add(str(logo_path).strip())

        for col in ["logo_path", "provider_logo_path", "provider_logo", "logo"]:
            if col not in cols:
                continue

            rows = cur.execute(
                f'''
                SELECT DISTINCT "{col}"
                FROM "{table}"
                WHERE "{col}" IS NOT NULL
                  AND TRIM(CAST("{col}" AS TEXT)) <> ''
                '''
            ).fetchall()

            for (logo_path,) in rows:
                if logo_path:
                    logo_paths.add(str(logo_path).strip())

    con.close()

    return sorted(logo_paths)

def download_one(logo_path):
    filename = safe_filename(logo_path)

    if not filename:
        return "bad_filename"

    target = OUT_DIR / filename

    if target.exists() and target.stat().st_size > 100:
        return "exists"

    url = logo_url(logo_path)

    if not url:
        return "bad_url"

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 FlixyfyProviderLogoCache/1.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()

        if len(data) <= 100:
            return "too_small"

        target.write_bytes(data)
        return "downloaded"

    except Exception as e:
        return f"failed: {e}"

def main():
    print("=" * 100)
    print("DOWNLOAD PROVIDER LOGOS V1")
    print("=" * 100)
    print(f"Frontend : {FRONTEND_ROOT}")
    print(f"DB       : {DB_PATH}")
    print(f"Output   : {OUT_DIR}")
    print("=" * 100)

    if FRONTEND_ROOT.name != "flixyfy-web":
        raise SystemExit("Run this from C:\\Users\\USER\\Desktop\\flixyfy-deploy\\flixyfy-web")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    logo_paths = collect_logo_paths()

    print("-" * 100)
    print(f"Unique logo paths found: {len(logo_paths)}")
    print("-" * 100)

    downloaded = 0
    exists = 0
    failed = 0

    for i, logo_path in enumerate(logo_paths, start=1):
        status = download_one(logo_path)

        if status == "downloaded":
            downloaded += 1
        elif status == "exists":
            exists += 1
        else:
            failed += 1

        print(f"{i:04d}/{len(logo_paths):04d} {status:<35} {logo_path}")

    print("=" * 100)
    print("DONE")
    print("=" * 100)
    print(f"Found      : {len(logo_paths)}")
    print(f"Downloaded : {downloaded}")
    print(f"Existing   : {exists}")
    print(f"Failed     : {failed}")
    print(f"Output     : {OUT_DIR}")
    print("=" * 100)

if __name__ == "__main__":
    main()
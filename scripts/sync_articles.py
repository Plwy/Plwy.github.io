from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


def ensure_exists(path: Path, label: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}")


def load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def replace_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def sync_content(source_root: Path, dest_root: Path) -> None:
    categories_src = source_root / "categories.json"
    posts_src = source_root / "posts.json"
    articles_src = source_root / "articles"

    ensure_exists(categories_src, "categories.json")
    ensure_exists(posts_src, "posts.json")
    ensure_exists(articles_src, "articles directory")

    # Validate JSON before overwriting destination files.
    load_json(categories_src)
    load_json(posts_src)

    copy_file(categories_src, dest_root / "categories.json")
    copy_file(posts_src, dest_root / "posts.json")
    replace_tree(articles_src, dest_root / "articles")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync article content from an external repo into this site repo.")
    parser.add_argument("--source", required=True, help="Path to external article repository root")
    parser.add_argument("--dest", required=True, help="Path to destination content directory")
    args = parser.parse_args()

    source_root = Path(args.source).resolve()
    dest_root = Path(args.dest).resolve()

    ensure_exists(source_root, "source root")
    dest_root.mkdir(parents=True, exist_ok=True)
    sync_content(source_root, dest_root)
    print(f"Synced article content from {source_root} to {dest_root}")


if __name__ == "__main__":
    main()

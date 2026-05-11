from __future__ import annotations

import argparse
import json
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


def extract_product_images(url: str, limit: int = 8) -> dict[str, object]:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http and https product URLs are supported.")

    response = requests.get(url, timeout=20, headers={"User-Agent": "FitShelf/0.1"})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    candidates: list[dict[str, str]] = []

    def add(value: str | None, source: str) -> None:
        if not value:
            return
        image_url = urljoin(url, value)
        if any(item["image_url"] == image_url for item in candidates):
            return
        candidates.append({"image_url": image_url, "source": source})

    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        add(og["content"], "og:image")

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "{}")
        except json.JSONDecodeError:
            continue
        candidates = data if isinstance(data, list) else [data]
        for item in candidates:
            image = item.get("image") if isinstance(item, dict) else None
            if isinstance(image, str):
                add(image, "json-ld")
            if isinstance(image, list):
                for value in image:
                    if isinstance(value, str):
                        add(value, "json-ld")

    for img in soup.find_all("img"):
        add(img.get("src") or img.get("data-src"), "img")
        if len(candidates) >= limit:
            break
    return {"source_url": url, "candidates": candidates[:limit]}


def extract_product_image(url: str) -> dict[str, str | None]:
    result = extract_product_images(url, limit=1)
    candidates = result["candidates"]
    if isinstance(candidates, list) and candidates:
        return candidates[0]
    return {"image_url": None, "source": None}


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract a likely product image URL from a product page.")
    parser.add_argument("url")
    args = parser.parse_args()
    print(json.dumps(extract_product_images(args.url), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

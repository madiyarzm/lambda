#!/usr/bin/env python3
"""Remove cream/warm-gray background from mascot PNGs using flood-fill BFS from corners."""

import sys
from pathlib import Path
from collections import deque
from PIL import Image

TOLERANCE = 38  # color distance threshold for background detection


def color_dist(c1, c2):
    return max(abs(int(c1[i]) - int(c2[i])) for i in range(3))


def flood_fill_alpha(img: Image.Image, tol: int) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # Sample background from all four corners (average)
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    bg_samples = [pixels[x, y][:3] for x, y in corners]
    # Pick the most-cream-like corner (highest R+G+B)
    bg_color = max(bg_samples, key=lambda c: c[0] + c[1] + c[2])

    visited = [[False] * h for _ in range(w)]
    queue = deque()

    # Seed from all four corners
    for cx, cy in corners:
        if color_dist(pixels[cx, cy][:3], bg_color) <= tol:
            queue.append((cx, cy))
            visited[cx][cy] = True

    # Also seed from all four edges to catch open backgrounds
    for x in range(w):
        for y in [0, h - 1]:
            if not visited[x][y] and color_dist(pixels[x, y][:3], bg_color) <= tol:
                queue.append((x, y))
                visited[x][y] = True
    for y in range(h):
        for x in [0, w - 1]:
            if not visited[x][y] and color_dist(pixels[x, y][:3], bg_color) <= tol:
                queue.append((x, y))
                visited[x][y] = True

    # BFS flood fill
    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (pixels[x, y][0], pixels[x, y][1], pixels[x, y][2], 0)
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                if color_dist(pixels[nx, ny][:3], bg_color) <= tol:
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    return img


def auto_crop(img: Image.Image) -> Image.Image:
    """Crop to bounding box of non-transparent pixels."""
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img


def process(src: Path, dst: Path):
    img = Image.open(src)
    result = flood_fill_alpha(img, TOLERANCE)
    result = auto_crop(result)
    dst.parent.mkdir(parents=True, exist_ok=True)
    result.save(dst, "PNG")
    print(f"  {src.name} → {result.size[0]}×{result.size[1]}")


if __name__ == "__main__":
    mascot_dir = Path("/Users/madiyarzhunussov/Desktop/lambda/frontend-vite/src/assets/mascots")
    out_dir = mascot_dir / "transparent"

    files = sorted(mascot_dir.glob("*.png"))
    print(f"Processing {len(files)} files → {out_dir}/")
    for f in files:
        try:
            process(f, out_dir / f.name)
        except Exception as e:
            print(f"  ERROR {f.name}: {e}", file=sys.stderr)

    print("Done.")

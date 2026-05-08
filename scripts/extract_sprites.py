"""Slice image.png sprite sheet into individual mascot PNGs.

Source: lambda/image.png (1706 x 718, four labeled regions:
  - top-left:  STRAWIE sprite sheet (2 rows x 4 cols of strawberry teacher poses)
  - top-right: BERRIES sprite sheet (3 rows x 4 cols of strawberry student poses)
  - bottom-left:  Lesson 1 explain card + Course progress card
  - bottom-right: Agent task console + Syntax error illustration + Level / progress

We extract a hand-tuned subset that the landing page actually uses, plus a few
spares so we don't need to re-run for the next iteration.

Output: lambda/frontend-vite/src/assets/mascots/<name>.png
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "image.png"
OUT = ROOT / "frontend-vite" / "src" / "assets" / "mascots"
OUT.mkdir(parents=True, exist_ok=True)

# Hand-tuned crops (left, top, right, bottom) in source pixels.
#
# Layout (source 1706 x 718, observed):
#   Strawie section: x ~ 0..820  (header strip y=0..30, then 2x4 sprite grid)
#   Berries + assets section: x ~ 820..1706
#   Bottom section: y ~ 370..718 (explain card scenes)
#
# Each Strawie sprite cell is ~205 wide × ~165 tall (sprite) + ~25 caption.
# Berry sprite cells in their row 1 are ~110 wide × ~145 tall.
CROPS: dict[str, tuple[int, int, int, int]] = {
    # ── Strawie (teacher) — top-left, 2 rows × 4 cols, x: 0..820, y: 30..360
    "strawie-idle":       (10,   38,  210, 195),
    "strawie-walk":       (210,  38,  410, 195),
    "strawie-teaching":   (410,  38,  610, 195),
    "strawie-coding":     (610,  38,  815, 195),
    "strawie-think":      (10,   210, 210, 360),
    "strawie-surfing":    (210,  210, 410, 360),
    "strawie-cheering":   (410,  210, 610, 360),
    "strawie-confused":   (610,  210, 815, 360),

    # ── Berry students — top-right, row 1, y: 30..195 ─────────────────────
    # 9 small cells starting just after Strawie section.
    "berry-learning":      (835,  38,  945,  195),
    "berry-puzzled":       (945,  38,  1055, 195),
    "berry-build-success": (1055, 38,  1175, 195),
    "berry-excited":       (1175, 38,  1280, 195),
    "berry-focused":       (1280, 38,  1390, 195),
    "berry-bug-encounter": (1390, 38,  1500, 195),
    "berry-asking":        (1500, 38,  1600, 195),
    "berry-building":      (1600, 38,  1706, 195),

    # ── Bottom region — explain-card illustrations ─────────────────────────
    # y: ~380..718 contains "Lesson 1 / Tip of the Day / Student progress /
    # Course progress / Agent interface / Debugging help / Level completion /
    # User profile" cards.
    "scene-lesson-intro":  (10,   400, 240, 715),
    "scene-tip-of-day":    (240,  400, 455, 715),
    "scene-student-prog":  (455,  400, 670, 715),
    "scene-agent":         (920,  400, 1130, 715),
    "scene-debugging":     (1130, 400, 1340, 715),
    "scene-level-up":      (1340, 400, 1530, 715),
    "scene-user-profile":  (1530, 400, 1706, 715),
}


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source not found: {SRC}")
    img = Image.open(SRC).convert("RGBA")
    print(f"loaded {SRC.name}  size={img.size}")

    for name, box in CROPS.items():
        crop = img.crop(box)
        out_path = OUT / f"{name}.png"
        crop.save(out_path, optimize=True)
        print(f"  → {out_path.relative_to(ROOT)}  size={crop.size}")

    print(f"\ndone. {len(CROPS)} sprites written to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

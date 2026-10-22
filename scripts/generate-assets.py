#!/usr/bin/env python3
"""Generate the Life.exe app icon family from code.

The mark is a HUD hexagon with an inner ring, orbital arcs, and a spark core.
Everything is drawn at 2x and downsampled for clean edges.

Usage: python3 scripts/generate-assets.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

BG_TOP = (10, 21, 35)
BG_BOTTOM = (4, 8, 15)
MINT = (92, 242, 198)
ION = (122, 162, 255)
PALE = (223, 255, 246)
DARK = (6, 12, 20)

SS = 2  # supersampling factor


def diagonal_gradient(
    size: int,
    start: tuple[int, int, int],
    end: tuple[int, int, int],
    angle: int,
) -> Image.Image:
    """Smooth linear gradient along `angle` degrees (0 = left to right)."""
    theta = math.radians(angle)
    dx, dy = math.cos(theta), math.sin(theta)
    # Project the square corners onto the direction axis to find the span.
    projections = [x * dx + y * dy for x in (0, size) for y in (0, size)]
    low, high = min(projections), max(projections)
    span = max(1.0, high - low)
    image = Image.new("RGB", (size, size))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            t = ((x + 0.5) * dx + (y + 0.5) * dy - low) / span
            pixels[x, y] = (
                round(start[0] + (end[0] - start[0]) * t),
                round(start[1] + (end[1] - start[1]) * t),
                round(start[2] + (end[2] - start[2]) * t),
            )
    return image.convert("RGBA")


def radial(size: int, inner: int, outer: int) -> Image.Image:
    mask = Image.radial_gradient("L").resize((size, size), Image.Resampling.BICUBIC)
    return ImageOps.colorize(mask, black=inner, white=outer).convert("RGBA")


def hexagon(cx: float, cy: float, radius: float, pointy: bool = True) -> list[tuple[float, float]]:
    offset = -90 if pointy else 0
    return [
        (
            cx + radius * math.cos(math.radians(offset + 60 * index)),
            cy + radius * math.sin(math.radians(offset + 60 * index)),
        )
        for index in range(6)
    ]


def star(cx: float, cy: float, outer: float, inner: float) -> list[tuple[float, float]]:
    points = []
    for index in range(8):
        radius = outer if index % 2 == 0 else inner
        angle = math.radians(-90 + 45 * index)
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def draw_mark(canvas: int, scale: float, with_background: bool, simplify: bool = False) -> Image.Image:
    size = canvas * SS
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    if with_background:
        background = diagonal_gradient(size, BG_TOP, BG_BOTTOM, 20)
        image.alpha_composite(background)
        glow_mask = Image.radial_gradient("L").resize((size, size), Image.Resampling.BICUBIC)
        glow_mask = glow_mask.point(lambda value: int(value * 0.34))
        halo = Image.new("RGBA", (size, size), MINT + (54,))
        image.alpha_composite(Image.composite(halo, Image.new("RGBA", (size, size), (0, 0, 0, 0)), glow_mask))
        # faint engineering grid
        grid = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        grid_draw = ImageDraw.Draw(grid)
        step = max(24, size // 16)
        for offset in range(0, size, step):
            grid_draw.line((offset, 0, offset, size), fill=(120, 160, 205, 12), width=max(1, SS // 2))
            grid_draw.line((0, offset, size, offset), fill=(120, 160, 205, 12), width=max(1, SS // 2))
        image.alpha_composite(grid)

    cx = cy = size / 2
    unit = size * scale
    stroke = max(2, int(unit * 0.04))
    gradient = diagonal_gradient(size, MINT, ION, -35)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.line(hexagon(cx, cy, unit * 0.31) + [hexagon(cx, cy, unit * 0.31)[0]], fill=MINT + (58,), width=stroke * 2, joint="curve")
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.022))
    image.alpha_composite(glow)

    # orbital ticks
    arc_box = (cx - unit * 0.42, cy - unit * 0.42, cx + unit * 0.42, cy + unit * 0.42)
    ticks = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tick_draw = ImageDraw.Draw(ticks)
    tick_draw.arc(arc_box, start=210, end=246, fill=MINT + (170,), width=max(2, stroke // 4))
    tick_draw.arc(arc_box, start=30, end=66, fill=ION + (170,), width=max(2, stroke // 4))
    image.alpha_composite(ticks)

    # main hexagon: gradient stroke through a mask
    hex_points = hexagon(cx, cy, unit * 0.31)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.line(hex_points + [hex_points[0]], fill=255, width=stroke, joint="curve")
    image.paste(gradient, (0, 0), mask)

    # inner ring
    if not simplify:
        ring_radius = unit * 0.19
        inner_hex = hexagon(cx, cy, ring_radius)
        ring_mask = Image.new("L", (size, size), 0)
        ring_draw = ImageDraw.Draw(ring_mask)
        ring_draw.line(inner_hex + [inner_hex[0]], fill=255, width=max(1, stroke // 4), joint="curve")
        ring_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ring_layer.paste(gradient, (0, 0), ring_mask)
        ring_layer.putalpha(ring_layer.split()[3].point(lambda value: int(value * 0.55)))
        image.alpha_composite(ring_layer)

    # spark core
    spark = star(cx, cy, unit * 0.1, unit * 0.03)
    spark_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    spark_draw = ImageDraw.Draw(spark_layer)
    spark_draw.polygon(spark, fill=PALE + (255,))
    image.alpha_composite(spark_layer)

    core = unit * 0.021
    core_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    core_draw = ImageDraw.Draw(core_layer)
    core_draw.ellipse((cx - core, cy - core, cx + core, cy + core), fill=DARK + (255,))
    image.alpha_composite(core_layer)

    if not simplify:
        # vertex nodes
        for index, point in enumerate(hex_points):
            dot = unit * (0.019 if index % 2 == 0 else 0.012)
            color = MINT if index % 2 == 0 else ION
            node = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            node_draw = ImageDraw.Draw(node)
            node_draw.ellipse((point[0] - dot, point[1] - dot, point[0] + dot, point[1] + dot), fill=color + (255,))
            image.alpha_composite(node)

        # corner brackets
        bracket = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        bracket_draw = ImageDraw.Draw(bracket)
        margin = size * 0.075
        length = size * 0.055
        width = max(2, int(size * 0.003))
        for x_sign, y_sign in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
            x = margin if x_sign > 0 else size - margin
            y = margin if y_sign > 0 else size - margin
            bracket_draw.line((x, y, x + length * x_sign, y), fill=PALE + (70,), width=width)
            bracket_draw.line((x, y, x, y + length * y_sign), fill=PALE + (70,), width=width)
        image.alpha_composite(bracket)

    return image.resize((canvas, canvas), Image.Resampling.LANCZOS)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)

    icon = draw_mark(1024, 1.04, with_background=True)
    icon.save(ASSETS / "icon.png")

    # Adaptive icon: transparent, content inside the 66% safe zone.
    adaptive = draw_mark(1024, 0.94, with_background=False)
    adaptive.save(ASSETS / "adaptive-icon.png")

    splash = draw_mark(512, 1.0, with_background=False)
    splash.save(ASSETS / "splash-icon.png")

    favicon = draw_mark(64, 1.12, with_background=True, simplify=True)
    favicon.save(ASSETS / "favicon.png")

    print("Wrote icon.png, adaptive-icon.png, splash-icon.png, favicon.png")


if __name__ == "__main__":
    main()

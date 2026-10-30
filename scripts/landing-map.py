#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["numpy", "scipy", "netCDF4", "scikit-image", "shapely"]
# ///
"""The landing page's map: Southeast Asia from the Meghna to Borneo, drawn from ETOPO 2022, and
the rivers the acts happen on, traced so the page can light them up.

    scripts/landing-map.py      # writes static/map/sea.svg and src/lib/comic/map.json

Adapted from riverbanks-generator/scripts/sunda-maps.py (the exhibition's Sunda maps), with the
same palette and the same method: the last glacial lowstand coast is the −120 m contour, and the
rivers come out of flow routing on the lowstand landscape, so a river runs on across what is now
sea floor. Each act's river is traced downstream from a point near its source to the lowstand sea.
Downloads and the routing are cached in ~/.cache/riverbanks-landing-map; the first run takes a
while (the priority flood is plain Python).
"""
import heapq, json, pathlib, subprocess

import netCDF4
import numpy as np
from scipy import ndimage
from shapely.geometry import LineString, Polygon
from skimage import measure

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = pathlib.Path.home() / ".cache/riverbanks-landing-map"
# The grid reaches past the map, so rivers rising off the map still route.
GRID = dict(west=66, south=-14, east=134, north=34)
URL = (
    "https://www.ngdc.noaa.gov/thredds/wcs/global/ETOPO2022/60s/60s_surface_elev_netcdf/"
    "ETOPO_2022_v1_60s_N90W180_surface.nc?service=WCS&version=1.0.0&request=GetCoverage"
    f"&coverage=z&bbox={GRID['west']},{GRID['south']},{GRID['east']},{GRID['north']}&format=NetCDF3"
)
LOWSTAND = -120
# The map: much wider than the acts need, from India to the Philippines, so that at the scale the
# markers set it still fills a wide screen, and its sides end in open sea rather than cut land.
# Room above Myitsone for the header.
WEST, EAST, SOUTH, NORTH = 68.0, 132.0, -12.0, 32.0
# Units across the map: on a laptop it is drawn about twice this wide, so the coast needs them.
W = 2000
THRESHOLD = 12000  # cells of accumulation before a river is drawn
DETAIL = 0.9

# Each river: a point near where the act's stretch starts (lon, lat), traced downstream.
RIVERS = {
    "meghna": (91.9, 24.9),  # the Surma at Sylhet, into the Meghna
    "ayeyarwady": (97.65, 25.7),  # Myitsone, where the Ayeyarwady begins
    "chao-phraya": (98.95, 19.3),  # the Ping above Chiang Mai
    "muar": (102.3, 2.75),  # the upper Muar
    "north-sunda": (111.5, 0.2),  # the Kapuas, then the drowned North Sunda River past Natuna
}

PALETTE = {
    "deep": "#A9CAC4",
    "sea": "#C9DDD6",
    "shelf": "#F3ECDC",
    "land": "#DCC79B",
    "river": "#2E6B67",
    "ink": "#111111",
}


def load():
    CACHE.mkdir(parents=True, exist_ok=True)
    nc = CACHE / "etopo.nc"
    if not nc.exists():
        subprocess.run(["curl", "-sSf", "-o", nc, URL], check=True)
    ds = netCDF4.Dataset(nc)
    names = list(ds.variables)
    lat = ds.variables[next(n for n in names if n.startswith("lat"))][:].astype(float)
    lon = ds.variables[next(n for n in names if n.startswith("lon"))][:].astype(float)
    z = np.ma.filled(ds.variables["z"][:], -1e4).astype(float)
    if lat[0] < lat[-1]:
        lat, z = lat[::-1], z[::-1]
    return lon, lat, z


def ocean(z):
    labels, _ = ndimage.label(z <= LOWSTAND)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    return labels == sizes.argmax()


def route(z):
    """Priority-flood fill, D8 directions and accumulation, as in sunda-maps.py."""
    cached = CACHE / "routing.npz"
    if cached.exists():
        d = np.load(cached)
        return d["down"], d["acc"], d["depth"]
    rows, cols = z.shape
    sea = ocean(z)
    z = np.where(sea, z, ndimage.gaussian_filter(z, 1.2))
    filled = z.copy()
    done = sea.copy()
    heap = []
    edge = np.zeros_like(sea)
    edge[0, :] = edge[-1, :] = edge[:, 0] = edge[:, -1] = True
    seeds = ~sea & (edge | ndimage.binary_dilation(sea, np.ones((3, 3))))
    for r, c in zip(*np.nonzero(seeds)):
        heapq.heappush(heap, (filled[r, c], r, c))
        done[r, c] = True
    nbrs = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    while heap:
        e, r, c = heapq.heappop(heap)
        for dr, dc in nbrs:
            rr, cc = r + dr, c + dc
            if 0 <= rr < rows and 0 <= cc < cols and not done[rr, cc]:
                done[rr, cc] = True
                filled[rr, cc] = max(filled[rr, cc], e + 1e-3)
                heapq.heappush(heap, (filled[rr, cc], rr, cc))
    idx = np.arange(rows * cols).reshape(rows, cols)
    pad = np.pad(filled, 1, constant_values=np.inf)
    best = np.zeros_like(filled)
    down = np.full(filled.shape, -1, int)
    for dr, dc in nbrs:
        nb = pad[1 + dr : rows + 1 + dr, 1 + dc : cols + 1 + dc]
        drop = (filled - nb) / np.hypot(dr, dc)
        better = drop > best
        best = np.where(better, drop, best)
        target = np.roll(np.roll(idx, -dr, 0), -dc, 1)
        down = np.where(better, target, down)
    down[sea] = -1
    down = down.ravel()
    acc = np.where(sea.ravel(), 0, 1).astype(np.int64)
    for i in np.argsort(-filled.ravel(), kind="stable"):
        j = down[i]
        if j >= 0:
            acc[j] += acc[i]
    depth = (filled - z).astype(np.float32)
    np.savez_compressed(cached, down=down, acc=acc, depth=depth)
    return down, acc, depth


def lakes(z, depth):
    lake = ndimage.binary_opening((depth > 3) & (z < 0), np.ones((3, 3)))
    labels, _ = ndimage.label(lake)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    return sizes[labels] >= 400


class Frame:
    """Equirectangular, x squeezed by cos(centre latitude), as in sunda-maps.py."""

    def __init__(self, lon, lat):
        self.lon, self.lat = lon, lat
        k = np.cos(np.radians((NORTH + SOUTH) / 2))
        self.sx = W / (EAST - WEST)
        self.sy = self.sx / k
        self.h = round((NORTH - SOUTH) * self.sy)
        self.dlon = lon[1] - lon[0]
        self.dlat = lat[0] - lat[1]

    def xy(self, lo, la):
        return (lo - WEST) * self.sx, (NORTH - la) * self.sy

    def cell(self, r, c):
        return self.xy(self.lon[0] + c * self.dlon, self.lat[0] - r * self.dlat)

    def rc(self, lo, la):
        return round((self.lat[0] - la) / self.dlat), round((lo - self.lon[0]) / self.dlon)


def num(v):
    return str(v)


def pair(x, y):
    a, b = num(x), num(y)
    return a + ("" if b.startswith("-") else " ") + b


def path(pts, close=False):
    q = [(round(x), round(y)) for x, y in pts]
    q = [p for i, p in enumerate(q) if i == 0 or p != q[i - 1]]
    if len(q) < 2:
        return ""
    d = "M" + pair(*q[0]) + "l" + "".join(
        (" " if i and not num(x1 - x0).startswith("-") else "") + pair(x1 - x0, y1 - y0)
        for i, ((x0, y0), (x1, y1)) in enumerate(zip(q, q[1:]))
    )
    return d + ("z" if close else "")


def rings(z, level, f, min_area=10.0, tol=0.8):
    sub = ndimage.gaussian_filter(np.pad(z, 1, constant_values=-1e4), 1.0)
    parts = []
    for ring in measure.find_contours(sub, level):
        pts = [f.cell(r - 1, c - 1) for r, c in ring]
        if Polygon(pts).area < min_area / DETAIL**2:
            continue
        coords = LineString(pts).simplify(tol / DETAIL).coords
        if len(coords) >= 4:
            parts.append(path(coords, close=True))
    return "".join(parts)


def chaikin(pts, n=2):
    p = np.asarray(pts, float)
    for _ in range(n):
        if len(p) < 3:
            break
        q = 0.75 * p[:-1] + 0.25 * p[1:]
        r = 0.25 * p[:-1] + 0.75 * p[1:]
        p = np.vstack([p[:1], np.column_stack([q, r]).reshape(-1, 2), p[-1:]])
    return p


def network(down, acc, lake, shape, f):
    """Every river past THRESHOLD, grouped by stroke width (log of accumulation)."""
    rows, cols = shape
    stream = (acc >= THRESHOLD) & ~lake.ravel()
    ups = np.zeros(acc.shape, int)
    s_idx = np.nonzero(stream)[0]
    targets = down[s_idx]
    np.add.at(ups, targets[targets >= 0], 1)
    widths = {}
    for i in (i for i in s_idx if ups[i] != 1):
        seg = [i]
        j = down[i]
        while j >= 0 and stream[j]:
            seg.append(j)
            if ups[j] != 1:
                break
            j = down[j]
        if len(seg) < 2:
            continue
        pts = [f.cell(k // cols, k % cols) for k in seg]
        w = min(0.5 + 0.45 * np.log2(acc[seg[-1]] / THRESHOLD), 4.0)
        w = round(max(w, 0.5) * 4) / 4
        widths.setdefault(w, []).append(path(LineString(chaikin(pts)).simplify(0.6).coords))
    return widths


def trace(start, down, acc, z, f):
    """One river from near `start` down to the lowstand sea, as two paths: today's course on land,
    and the drowned course across what is now sea floor."""
    rows, cols = z.shape
    r, c = f.rc(*start)
    # Snap to the strongest channel within ~6 km, so the trace starts on the river, not beside it.
    win = acc.reshape(rows, cols)[r - 3 : r + 4, c - 3 : c + 4]
    dr, dc = np.unravel_index(np.argmax(win), win.shape)
    i = (r - 3 + dr) * cols + (c - 3 + dc)
    cells = []
    while i >= 0 and len(cells) < 20000:
        cells.append(i)
        i = down[i]
    pts = chaikin([f.cell(k // cols, k % cols) for k in cells])
    wet = [z.ravel()[k] < 0 for k in cells]
    # Split where the river crosses today's coast (the first cell below sea level stays wet).
    cut = next((n for n, w in enumerate(wet) if w), len(cells))
    split = round(cut / max(len(cells) - 1, 1) * (len(pts) - 1))
    land = LineString(pts[: split + 1]).simplify(0.5).coords if split >= 1 else []
    sea = LineString(pts[split:]).simplify(0.5).coords if len(pts) - split >= 2 else []
    return {"land": path(land), "drowned": path(sea), "acc": int(acc[cells[-1]])}


def main():
    lon, lat, z = load()
    down, acc, depth = route(z)
    lake = lakes(z, depth)
    f = Frame(lon, lat)
    H = f.h
    dry = np.where(ocean(z), z, np.maximum(z, LOWSTAND + 1))
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="{PALETTE["deep"]}"/>',
        f'<path d="{rings(z, -1000, f, min_area=20)}" fill="{PALETTE["sea"]}" fill-rule="evenodd"/>',
        f'<path d="{rings(dry, LOWSTAND, f)}" fill="{PALETTE["shelf"]}" fill-rule="evenodd" '
        f'stroke="{PALETTE["ink"]}" stroke-width="1.4" stroke-linejoin="round"/>',
        f'<path d="{rings(z, 0, f, min_area=6)}" fill="{PALETTE["land"]}" fill-rule="evenodd" '
        f'stroke="{PALETTE["ink"]}" stroke-width="0.6" stroke-linejoin="round"/>',
        f'<path d="{rings(np.where(lake, 1.0, -1.0), 0, f, min_area=10)}" fill="{PALETTE["sea"]}" '
        f'fill-rule="evenodd" stroke="{PALETTE["river"]}" stroke-width="0.7"/>',
    ]
    for w, ds in sorted(network(down, acc, lake, z.shape, f).items()):
        svg.append(
            f'<path d="{"".join(ds)}" fill="none" stroke="{PALETTE["river"]}" stroke-width="{w}" '
            'stroke-linecap="round" stroke-linejoin="round"/>'
        )
    svg.append("</svg>")
    out = ROOT / "static/map/sea.svg"
    out.write_text("\n".join(svg))

    rivers = {name: trace(start, down, acc, z, f) for name, start in RIVERS.items()}
    meta = {
        "source": "scripts/landing-map.py (ETOPO 2022, 60 arc-second)",
        "west": WEST,
        "east": EAST,
        "north": NORTH,
        "south": SOUTH,
        "w": W,
        "h": H,
        "rivers": {k: {"land": v["land"], "drowned": v["drowned"]} for k, v in rivers.items()},
    }
    (ROOT / "src/lib/comic/map.json").write_text(json.dumps(meta, indent="\t") + "\n")
    print(f"static/map/sea.svg  {out.stat().st_size / 1000:.0f} KB  {W}×{H}")
    for k, v in rivers.items():
        print(f"  {k:12} {len(v['land']):5} + {len(v['drowned']):5} chars, {v['acc']} cells at the mouth")


if __name__ == "__main__":
    main()

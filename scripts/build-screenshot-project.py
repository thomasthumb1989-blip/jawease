"""
Build ScreenshotWhale project JSON from JawEase screenshots.
Outputs screenshot-project.json in the project root.

Usage: py scripts/build-screenshot-project.py
"""

import json
import base64
import os
import math

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOT_DIR = os.path.join(PROJECT_DIR, "screenshots")
OUTPUT_FILE = os.path.join(PROJECT_DIR, "screenshot-project.json")

PHONE_ASPECT_RATIO = 19.5 / 9  # All phone mockups use this

# ─── Slides (order = conversion priority) ───────────────────────────
SLIDES = [
    {
        "key": "exercise-flow",
        "file": "exercise-flow.png",
        "headline": "Relief in 5 Minutes a Day",
        "subtitle": "Guided exercises for TMJ pain relief",
        "layout": "A",
        "gradientAngle": 180,
        "gradientStops": [
            {"color": "#4A9D8E", "position": 0},
            {"color": "#2d5a4e", "position": 100},
        ],
    },
    {
        "key": "pain-orb",
        "file": "pain-orb.png",
        "headline": "Track Pain in One Tap",
        "subtitle": "Visual pain logging with smart insights",
        "layout": "B",
        "gradientAngle": 135,
        "gradientStops": [
            {"color": "#E4A36A", "position": 0},
            {"color": "#b07840", "position": 100},
        ],
    },
    {
        "key": "today",
        "file": "today.png",
        "headline": "Your Daily Jaw Health Plan",
        "subtitle": "Personalised routines and smart insights",
        "layout": "C",
        "gradientAngle": 225,
        "gradientStops": [
            {"color": "#3A7D6E", "position": 0},
            {"color": "#D4935A", "position": 100},
        ],
    },
    {
        "key": "progress",
        "file": "progress.png",
        "headline": "See Your Progress",
        "subtitle": "Pain trends, streaks, and exercise stats",
        "layout": "D",
        "gradientAngle": 160,
        "gradientStops": [
            {"color": "#5AAD9E", "position": 0},
            {"color": "#2d6858", "position": 100},
        ],
    },
    {
        "key": "exercises",
        "file": "exercises.png",
        "headline": "8 Expert-Backed Exercises",
        "subtitle": "Mobility, strengthening, and relaxation",
        "layout": "B",
        "gradientAngle": 200,
        "gradientStops": [
            {"color": "#D4935A", "position": 0},
            {"color": "#4A9D8E", "position": 100},
        ],
    },
    {
        "key": "paywall",
        "file": "paywall.png",
        "headline": "Start Your Free Trial",
        "subtitle": "3 days free, cancel anytime",
        "layout": "A",
        "gradientAngle": 180,
        "gradientStops": [
            {"color": "#3A7D6E", "position": 0},
            {"color": "#1a4a3e", "position": 100},
        ],
    },
]

# ─── All 18 required devices ────────────────────────────────────────
DEVICES = [
    # iOS phones (7)
    {"deviceName": 'iPhone 6.9" (1320 x 2868)', "W": 1320, "H": 2868, "mockupType": "iphone-17-pro-max", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": 'iPhone 6.9" (1290 x 2796)', "W": 1290, "H": 2796, "mockupType": "iphone-17-pro-max", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": 'iPhone 6.9" (1260 x 2736)', "W": 1260, "H": 2736, "mockupType": "iphone-17-pro-max", "headlineFontSize": 20, "subtitleFontSize": 14},
    {"deviceName": 'iPhone 6.5" (1284 x 2778)', "W": 1284, "H": 2778, "mockupType": "iphone-16-pro", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": 'iPhone 6.5" (1242 x 2688)', "W": 1242, "H": 2688, "mockupType": "iphone-16-pro", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": 'iPhone 6.3" (1206 x 2622)', "W": 1206, "H": 2622, "mockupType": "iphone-17-pro", "headlineFontSize": 20, "subtitleFontSize": 14},
    {"deviceName": 'iPhone 6.3" (1179 x 2556)', "W": 1179, "H": 2556, "mockupType": "iphone-17-pro", "headlineFontSize": 21, "subtitleFontSize": 15},
    # iPads (7)
    {"deviceName": 'iPad 13" (2064 x 2752)', "W": 2064, "H": 2752, "mockupType": "iphone-17-pro", "headlineFontSize": 23, "subtitleFontSize": 16},
    {"deviceName": 'iPad 13" (2048 x 2732)', "W": 2048, "H": 2732, "mockupType": "iphone-17-pro", "headlineFontSize": 23, "subtitleFontSize": 16},
    {"deviceName": 'iPad 12.9" (2048 x 2732)', "W": 2048, "H": 2732, "mockupType": "iphone-17-pro", "headlineFontSize": 23, "subtitleFontSize": 16},
    {"deviceName": 'iPad 11" (1668 x 2420)', "W": 1668, "H": 2420, "mockupType": "iphone-17-pro", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": 'iPad 11" (1668 x 2388)', "W": 1668, "H": 2388, "mockupType": "iphone-17-pro", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": 'iPad 11" (1640 x 2360)', "W": 1640, "H": 2360, "mockupType": "iphone-17-pro", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": 'iPad 11" (1488 x 2266)', "W": 1488, "H": 2266, "mockupType": "iphone-17-pro", "headlineFontSize": 20, "subtitleFontSize": 14},
    # Android phones (4)
    {"deviceName": "Pixel 10 Pro XL", "W": 1344, "H": 2992, "mockupType": "pixel-10-pro-xl", "headlineFontSize": 20, "subtitleFontSize": 14},
    {"deviceName": "Pixel 10 Pro", "W": 1280, "H": 2856, "mockupType": "pixel-10-pro", "headlineFontSize": 21, "subtitleFontSize": 15},
    {"deviceName": "Pixel 10", "W": 1080, "H": 2424, "mockupType": "pixel-10", "headlineFontSize": 20, "subtitleFontSize": 14},
    {"deviceName": "Samsung Galaxy S25", "W": 1080, "H": 2340, "mockupType": "samsung-s25", "headlineFontSize": 21, "subtitleFontSize": 14},
]

assert len(DEVICES) >= 18, f"Need 18 devices, got {len(DEVICES)}"


# ─── Layout builders ────────────────────────────────────────────────
def build_layers(slide, device, device_idx, slide_idx):
    """Build layers for a single slide on a single device."""
    W = device["W"]
    H = device["H"]
    di = device_idx
    si = slide_idx
    layout = slide["layout"]

    layers = []

    # Background gradient
    layers.append({
        "id": f"layer-bg-{di}-{si}",
        "type": "shape",
        "name": "Background",
        "visible": True,
        "locked": False,
        "x": 0,
        "y": 0,
        "width": W,
        "height": H,
        "rotation": 0,
        "opacity": 1,
        "isBackground": True,
        "fillType": "Gradient",
        "gradientType": "linear",
        "gradientAngle": slide["gradientAngle"],
        "gradientStops": slide["gradientStops"],
    })

    # Layout-specific positioning
    if layout == "A":
        # Text top, device bottom-center (hero shot)
        hl_x, hl_y, hl_w, hl_h = round(W*0.06), round(H*0.04), round(W*0.88), round(H*0.06)
        st_x, st_y, st_w, st_h = round(W*0.1), round(H*0.13), round(W*0.8), round(H*0.06)
        mk_h = round(H * 0.74)
        mk_w = round(mk_h / PHONE_ASPECT_RATIO)
        mk_x = round((W - mk_w) / 2)
        mk_y = round(H * 0.24)
        hl_align = "center"
        st_align = "center"
    elif layout == "B":
        # Text top-left, device below centered
        hl_x, hl_y, hl_w, hl_h = round(W*0.06), round(H*0.04), round(W*0.88), round(H*0.06)
        st_x, st_y, st_w, st_h = round(W*0.06), round(H*0.13), round(W*0.8), round(H*0.06)
        mk_h = round(H * 0.74)
        mk_w = round(mk_h / PHONE_ASPECT_RATIO)
        mk_x = round((W - mk_w) / 2)
        mk_y = round(H * 0.24)
        hl_align = "left"
        st_align = "left"
    elif layout == "C":
        # Device top, text bottom
        mk_h = round(H * 0.65)
        mk_w = round(mk_h / PHONE_ASPECT_RATIO)
        mk_x = round((W - mk_w) / 2)
        mk_y = round(H * 0.03)
        hl_x, hl_y, hl_w, hl_h = round(W*0.06), round(H*0.72), round(W*0.88), round(H*0.06)
        st_x, st_y, st_w, st_h = round(W*0.1), round(H*0.81), round(W*0.8), round(H*0.06)
        hl_align = "center"
        st_align = "center"
    elif layout == "D":
        # Text top, large device below
        hl_x, hl_y, hl_w, hl_h = round(W*0.06), round(H*0.04), round(W*0.88), round(H*0.06)
        st_x, st_y, st_w, st_h = round(W*0.1), round(H*0.13), round(W*0.8), round(H*0.06)
        mk_h = round(H * 0.78)
        mk_w = round(mk_h / PHONE_ASPECT_RATIO)
        mk_x = round((W - mk_w) / 2)
        mk_y = round(H * 0.22)
        hl_align = "center"
        st_align = "center"

    # Headline
    layers.append({
        "id": f"layer-title-{di}-{si}",
        "type": "text",
        "name": "Headline",
        "visible": True,
        "locked": False,
        "x": hl_x,
        "y": hl_y,
        "width": hl_w,
        "height": hl_h,
        "rotation": 0,
        "opacity": 1,
        "content": slide["headline"],
        "color": "#ffffff",
        "fontFamily": "SF Pro Rounded",
        "fontSize": device["headlineFontSize"],
        "fontWeight": "700",
        "textAlign": hl_align,
    })

    # Subtitle
    layers.append({
        "id": f"layer-subtitle-{di}-{si}",
        "type": "text",
        "name": "Subtitle",
        "visible": True,
        "locked": False,
        "x": st_x,
        "y": st_y,
        "width": st_w,
        "height": st_h,
        "rotation": 0,
        "opacity": 0.75,
        "content": slide["subtitle"],
        "color": "#ffffff",
        "fontFamily": "SF Pro Rounded",
        "fontSize": device["subtitleFontSize"],
        "fontWeight": "400",
        "textAlign": st_align,
    })

    # Mockup
    layers.append({
        "id": f"layer-mockup-{di}-{si}",
        "type": "mockup",
        "name": "Device",
        "visible": True,
        "locked": False,
        "x": mk_x,
        "y": mk_y,
        "width": mk_w,
        "height": mk_h,
        "rotation": 0,
        "opacity": 1,
        "src": f"img:{slide['key']}",
        "mockupType": device["mockupType"],
        "mockupColor": "black",
    })

    return layers


# ─── Main ───────────────────────────────────────────────────────────
def main():
    print("Resizing and encoding screenshots...")

    # Base64 encode all screenshots
    images = {}
    for slide in SLIDES:
        filepath = os.path.join(SCREENSHOT_DIR, slide["file"])
        if not os.path.exists(filepath):
            print(f"  WARNING: {slide['file']} not found, skipping")
            continue
        with open(filepath, "rb") as f:
            data = f.read()
        b64 = base64.b64encode(data).decode("ascii")
        images[slide["key"]] = b64
        size_kb = len(data) / 1024
        print(f"  {slide['file']}: {size_kb:.0f} KB")

    print(f"\nBuilding project JSON for {len(DEVICES)} devices...")

    devices_array = []
    for i, device in enumerate(DEVICES):
        screenshots = []
        for j, slide in enumerate(SLIDES):
            layers = build_layers(slide, device, i, j)
            screenshots.append({
                "id": f"screenshot-{i}-{j}",
                "name": slide["key"],
                "active": True,
                "device": device["deviceName"],
                "orientation": "portrait",
                "layers": layers,
            })
        devices_array.append({
            "id": f"device-{i}",
            "deviceName": device["deviceName"],
            "screenshots": screenshots,
        })

    project = {
        "name": "JawEase Screenshots",
        "version": "1.0.0",
        "metadata": {
            "totalDevices": len(DEVICES),
            "totalScreenshots": len(SLIDES),
            "supportedDevices": [d["deviceName"] for d in DEVICES],
        },
        "settings": {"collapsedGroups": []},
        "languages": ["en"],
        "images": images,
        "devices": devices_array,
    }

    # Verify
    total_layers = sum(
        len(s["layers"])
        for d in devices_array
        for s in d["screenshots"]
    )
    print(f"  {len(devices_array)} devices × {len(SLIDES)} slides = {len(devices_array) * len(SLIDES)} screenshots")
    print(f"  {total_layers} total layers")

    print(f"\nWriting {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w") as f:
        json.dump(project, f)

    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"  Size: {size_mb:.1f} MB")

    if size_mb > 50:
        print("  WARNING: File exceeds 50MB API limit!")
    else:
        print("  OK — within 50MB limit")

    print("\nDone! Now upload with:")
    print(f'  curl -s -X POST https://storeshots-backend.onrender.com/api/projects/create-from-skill -H "Content-Type: application/json" --data @screenshot-project.json')


if __name__ == "__main__":
    main()

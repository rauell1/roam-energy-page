import os
from PIL import Image

def check_transparency(file_path):
    if not os.path.exists(file_path):
        print(f"{file_path} does not exist.")
        return
    img = Image.open(file_path)
    print(f"=== {file_path} ===")
    print(f"Size: {img.size}, Mode: {img.mode}")
    if img.mode == "RGBA":
        data = img.getdata()
        transparent = sum(1 for p in data if p[3] == 0)
        opaque = sum(1 for p in data if p[3] == 255)
        print(f"Pixels: transparent={transparent}, opaque={opaque}, semi={len(data)-transparent-opaque}")
    else:
        print("Not RGBA")

files = [
    "Energy V1/products/dyness_10kwh_battery.png",
    "Energy V1/products/dyness_5kwh_battery.png",
    "Energy V1/products/dyness_stack100.webp",
    "Energy V1/products/jinko_585w_panel.png",
    "Energy V1/products/jinko_620w_panel.png",
    "Energy V1/products/solis_12kw_inverter.png",
    "Energy V1/products/solis_18kw_inverter.png",
    "Energy V1/products/solis_50kw_inverter.png",
    "Energy V1/products/solis_6kw_inverter.png"
]

for f in files:
    check_transparency(f)

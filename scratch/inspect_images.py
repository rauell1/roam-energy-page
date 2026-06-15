import os
from PIL import Image

def inspect(file_path):
    print(f"=== Inspecting {file_path} ===")
    if not os.path.exists(file_path):
        print("File does not exist.")
        return
    img = Image.open(file_path)
    print(f"Format: {img.format}, Mode: {img.mode}, Size: {img.size}")
    if img.mode == "RGBA":
        # Count transparent vs opaque pixels
        data = img.getdata()
        transparent = 0
        opaque = 0
        semi = 0
        color_counts = {}
        for r, g, b, a in data:
            if a == 0:
                transparent += 1
            elif a == 255:
                opaque += 1
                color = (r, g, b)
                color_counts[color] = color_counts.get(color, 0) + 1
            else:
                semi += 1
        print(f"Pixels: transparent={transparent}, opaque={opaque}, semi-transparent={semi}")
        # Show top 5 opaque colors
        sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
        print("Top 5 opaque colors:")
        for color, count in sorted_colors[:5]:
            print(f"  {color}: {count} pixels")
    else:
        print("Not RGBA mode.")

inspect("Energy V1/products/deye_inverter.png")
inspect("Energy V1/products/dyness_battery_new.png")
inspect("Energy V1/products/dyness_stack_new.png")
inspect("Energy V1/products/solis_inverter_new.png")
inspect("Energy V1/products/jinko_panel_new.png")

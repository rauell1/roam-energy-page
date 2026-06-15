from PIL import Image

def check_edges():
    img = Image.open("Energy V1/products/deye_inverter.png")
    bbox = img.getbbox()
    print(f"Bounding box: {bbox}")
    
    # Let's inspect the pixels near the bottom of the bounding box (y from bbox[3] - 200 to bbox[3])
    # to see what colors and alphas they have.
    ymin = bbox[3] - 200
    ymax = bbox[3]
    xmin = bbox[0]
    xmax = bbox[2]
    
    opaque_pixels = 0
    dark_pixels = 0
    colors = {}
    
    for y in range(ymin, ymax):
        for x in range(xmin, xmax):
            r, g, b, a = img.getpixel((x, y))
            if a > 0:
                opaque_pixels += 1
                color = (r, g, b)
                colors[color] = colors.get(color, 0) + 1
                if r < 80 and g < 80 and b < 80:
                    dark_pixels += 1
                    
    print(f"Region checked: y in [{ymin}, {ymax}], x in [{xmin}, {xmax}]")
    print(f"Total opaque pixels: {opaque_pixels}")
    print(f"Total dark pixels (R,G,B < 80): {dark_pixels}")
    
    # Let's print the top 15 colors in this bottom edge region
    sorted_colors = sorted(colors.items(), key=lambda x: x[1], reverse=True)
    print("Top colors at the bottom edge:")
    for color, count in sorted_colors[:15]:
        print(f"  {color}: {count} pixels")

check_edges()

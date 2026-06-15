from PIL import Image

def analyze_deye():
    img = Image.open("Energy V1/products/deye_inverter.png")
    w, h = img.size
    print(f"Size: {w}x{h}")
    # Let's find the bounding box of non-transparent pixels
    bbox = img.getbbox()
    print(f"Bounding box: {bbox}")
    
    # Let's check the bottom of the image, e.g., the last 10% of the height
    # and print some pixel colors and alpha values
    bottom_start = int(h * 0.9)
    opaque_in_bottom = 0
    opaque_colors = {}
    for y in range(bottom_start, h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > 0:
                opaque_in_bottom += 1
                color = (r, g, b)
                opaque_colors[color] = opaque_colors.get(color, 0) + 1
                
    print(f"Opaque pixels in bottom 10%: {opaque_in_bottom}")
    sorted_colors = sorted(opaque_colors.items(), key=lambda x: x[1], reverse=True)
    print("Top colors in bottom 10%:")
    for color, count in sorted_colors[:10]:
        print(f"  Color: {color}, Count: {count}")

analyze_deye()

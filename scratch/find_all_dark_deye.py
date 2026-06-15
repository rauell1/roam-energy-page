from PIL import Image

def find_all_dark_pixels():
    img = Image.open("Energy V1/products/deye_inverter.png")
    w, h = img.size
    print(f"Size: {w}x{h}")
    
    dark_pixels = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > 0:
                # Calculate simple brightness or check if RGB < 80
                if r < 80 and g < 80 and b < 80:
                    dark_pixels.append((x, y, (r, g, b, a)))
                    
    print(f"Total opaque dark pixels: {len(dark_pixels)}")
    if dark_pixels:
        xs = [p[0] for p in dark_pixels]
        ys = [p[1] for p in dark_pixels]
        print(f"Dark pixels bounding box: x in [{min(xs)}, {max(xs)}], y in [{min(ys)}, {max(ys)}]")
        # Print a few examples
        print("Examples of dark pixels:")
        for p in dark_pixels[:20]:
            print(f"  x={p[0]}, y={p[1]}: {p[2]}")
            
find_all_dark_pixels()

from PIL import Image

def analyze_quadrants():
    img = Image.open("Energy V1/products/Deye A.jpg")
    w, h = img.size
    print(f"Original Deye A.jpg size: {w}x{h}")
    
    # Divide into 4 quadrants: Top-Left, Top-Right, Bottom-Left, Bottom-Right
    # Top-Left: x in [0, w/2], y in [0, h/2]
    # Top-Right: x in [w/2, w], y in [0, h/2]
    # Bottom-Left: x in [0, w/2], y in [h/2, h]
    # Bottom-Right: x in [w/2, w], y in [h/2, h]
    
    quads = {
        "Top-Left": (0, 0, w//2, h//2),
        "Top-Right": (w//2, 0, w, h//2),
        "Bottom-Left": (0, h//2, w//2, h),
        "Bottom-Right": (w//2, h//2, w, h)
    }
    
    for name, box in quads.items():
        x0, y0, x1, y1 = box
        r_sum = g_sum = b_sum = count = 0
        for y in range(y0, y1, 10):
            for x in range(x0, x1, 10):
                r, g, b = img.getpixel((x, y))
                r_sum += r
                g_sum += g
                b_sum += b
                count += 1
        avg_r = r_sum / count
        avg_g = g_sum / count
        avg_b = b_sum / count
        brightness = (avg_r + avg_g + avg_b) / 3
        print(f"Quadrant {name}: Avg Color = ({avg_r:.1f}, {avg_g:.1f}, {avg_b:.1f}), Brightness = {brightness:.1f}")

analyze_quadrants()

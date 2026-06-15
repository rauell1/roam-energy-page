from PIL import Image

def find_bottom():
    img = Image.open("Energy V1/products/Deye A.jpg")
    w, h = img.size
    print(f"Original Deye A.jpg size: {w}x{h}")
    
    # We inspect rows from y = 1800 to 2600.
    # We average the pixels in the middle section of the inverter: x in [1800, 2400]
    print("Row y: Average RGB, Brightness")
    for y in range(1800, 2600, 10):
        r_sum = g_sum = b_sum = count = 0
        for x in range(1800, 2400):
            r, g, b = img.getpixel((x, y))
            r_sum += r
            g_sum += g
            b_sum += b
            count += 1
        avg_r = r_sum / count
        avg_g = g_sum / count
        avg_b = b_sum / count
        brightness = (avg_r + avg_g + avg_b) / 3
        print(f"  y={y}: Avg RGB = ({avg_r:.1f}, {avg_g:.1f}, {avg_b:.1f}), Brightness = {brightness:.1f}")

find_bottom()

from PIL import Image

def find_top():
    img = Image.open("Energy V1/products/Deye A.jpg")
    w, h = img.size
    print("Row y: Average RGB, Brightness")
    for y in range(0, 1800, 100):
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

find_top()

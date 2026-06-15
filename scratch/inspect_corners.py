from PIL import Image

def inspect_corners(file_path):
    print(f"Corners for {file_path}:")
    try:
        img = Image.open(file_path)
        w, h = img.size
        corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
        for xy in corners:
            print(f"  {xy}: {img.getpixel(xy)}")
    except Exception as e:
        print(f"  Error: {e}")

inspect_corners(r"C:\Users\royok\.gemini\antigravity\brain\e2788d19-a15f-455d-bdfa-1ffae49ce490\solis_inverter_gen_1781540485464.png")
inspect_corners(r"C:\Users\royok\.gemini\antigravity\brain\e2788d19-a15f-455d-bdfa-1ffae49ce490\dyness_battery_gen_1781540522199.png")
inspect_corners(r"C:\Users\royok\.gemini\antigravity\brain\e2788d19-a15f-455d-bdfa-1ffae49ce490\dyness_stack_gen_1781540540684.png")
inspect_corners("Energy V1/products/Deye A.png")
inspect_corners("Energy V1/products/Deye A.jpg")

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
        data = img.getdata()
        transparent = sum(1 for p in data if p[3] == 0)
        opaque = sum(1 for p in data if p[3] == 255)
        semi = len(data) - transparent - opaque
        print(f"Pixels: transparent={transparent}, opaque={opaque}, semi-transparent={semi}")
    else:
        print("Not RGBA mode.")

inspect("Energy V1/products/Deye A.png")
inspect("Energy V1/products/Deye A.jpg")
inspect("Energy V1/Deye A.jpg")

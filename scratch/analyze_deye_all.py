from PIL import Image
import os

def analyze(name, path):
    if not os.path.exists(path):
        print(f"{name}: does not exist")
        return
    img = Image.open(path)
    print(f"=== {name} ({path}) ===")
    print(f"Size: {img.size}, Mode: {img.mode}")
    print(f"Bounding box: {img.getbbox()}")

analyze("Deye A.jpg", "Energy V1/products/Deye A.jpg")
analyze("Deye A.png", "Energy V1/products/Deye A.png")
analyze("deye_inverter.png", "Energy V1/products/deye_inverter.png")

from PIL import Image

def crop_deye():
    # Load HEAD version of deye_inverter.png
    # Wait, we already restored it, so we can just open it from "Energy V1/products/deye_inverter.png"
    img = Image.open("Energy V1/products/deye_inverter.png")
    print(f"Original size: {img.size}")
    
    # Crop to the inverter body: x in [1457, 2783], y in [282, 1750]
    cropped = img.crop((1457, 282, 2783, 1750))
    print(f"Cropped size: {cropped.size}")
    
    # Save it to a test path first
    cropped.save("scratch/deye_cropped.png", "PNG")
    print("Saved to scratch/deye_cropped.png")

crop_deye()

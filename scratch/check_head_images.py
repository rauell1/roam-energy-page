import subprocess
from PIL import Image
import os

def check_head_image(path):
    temp_path = "scratch/temp_img.png"
    try:
        cmd = ["git", "show", f"HEAD:{path}"]
        result = subprocess.run(cmd, capture_output=True, check=True)
        with open(temp_path, "wb") as f:
            f.write(result.stdout)
            
        img = Image.open(temp_path)
        print(f"=== HEAD {path} ===")
        print(f"Size: {img.size}, Mode: {img.mode}")
        bbox = img.getbbox()
        print(f"Bounding Box: {bbox}")
        
        if img.mode == "RGBA":
            data = img.getdata()
            transparent = sum(1 for p in data if p[3] == 0)
            opaque = sum(1 for p in data if p[3] == 255)
            print(f"Pixels: transparent={transparent}, opaque={opaque}, semi={len(data)-transparent-opaque}")
        else:
            print("Not RGBA")
            
    except Exception as e:
        print(f"Error for {path}: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

check_head_image("Energy V1/products/dyness_battery_new.png")
check_head_image("Energy V1/products/dyness_stack_new.png")
check_head_image("Energy V1/products/solis_inverter_new.png")
check_head_image("Energy V1/products/jinko_panel_new.png")
check_head_image("Energy V1/products/deye_inverter.png")

import subprocess
from PIL import Image
import os

def analyze_git_rows():
    temp_path = "scratch/temp_deye_rows.png"
    try:
        # Extract deye_inverter.png from HEAD
        cmd = ["git", "show", "HEAD:Energy V1/products/deye_inverter.png"]
        result = subprocess.run(cmd, capture_output=True, check=True)
        with open(temp_path, "wb") as f:
            f.write(result.stdout)
            
        img = Image.open(temp_path)
        w, h = img.size
        bbox = img.getbbox()
        print(f"HEAD Size: {w}x{h}, Bounding Box: {bbox}")
        
        # We check rows y from bbox[1] (282) to bbox[3] (2541)
        # and print the average color and brightness of each row in the center of the inverter (x in [1800, 2400])
        # We can do this in steps of 50 to see the profile.
        print("Row y: Average RGB, Brightness, Alpha info")
        for y in range(bbox[1], bbox[3], 50):
            r_sum = g_sum = b_sum = a_sum = count = 0
            for x in range(1800, 2400):
                r, g, b, a = img.getpixel((x, y))
                r_sum += r
                g_sum += g
                b_sum += b
                a_sum += a
                count += 1
            avg_r = r_sum / count
            avg_g = g_sum / count
            avg_b = b_sum / count
            avg_a = a_sum / count
            brightness = (avg_r + avg_g + avg_b) / 3
            print(f"  y={y}: Avg RGB = ({avg_r:.1f}, {avg_g:.1f}, {avg_b:.1f}), Brightness = {brightness:.1f}, Alpha = {avg_a:.1f}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

analyze_git_rows()

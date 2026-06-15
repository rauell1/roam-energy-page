import subprocess
from PIL import Image
import os

def visualize_git_version():
    temp_path = "scratch/temp_deye.png"
    # Extract deye_inverter.png from HEAD
    try:
        # Use git show to get the file content
        cmd = ["git", "show", "HEAD:Energy V1/products/deye_inverter.png"]
        result = subprocess.run(cmd, capture_output=True, check=True)
        with open(temp_path, "wb") as f:
            f.write(result.stdout)
            
        print(f"Extracted deye_inverter.png from HEAD to {temp_path}")
        img = Image.open(temp_path)
        print(f"Size: {img.size}, Mode: {img.mode}")
        bbox = img.getbbox()
        print(f"Bounding Box: {bbox}")
        
        # Visualize it
        w, h = img.size
        bx0, by0, bx1, by1 = bbox
        bw = bx1 - bx0
        bh = by1 - by0
        
        grid_size = 30
        cell_w = bw / grid_size
        cell_h = bh / grid_size
        
        for row in range(grid_size):
            row_str = ""
            for col in range(grid_size):
                cx0 = int(bx0 + col * cell_w)
                cy0 = int(by0 + row * cell_h)
                cx1 = int(bx0 + (col + 1) * cell_w)
                cy1 = int(by0 + (row + 1) * cell_h)
                
                r_sum = g_sum = b_sum = a_sum = count = 0
                for y in range(cy0, cy1, max(1, (cy1 - cy0) // 5)):
                    for x in range(cx0, cx1, max(1, (cx1 - cx0) // 5)):
                        r, g, b, a = img.getpixel((x, y))
                        r_sum += r
                        g_sum += g
                        b_sum += b
                        a_sum += a
                        count += 1
                avg_a = a_sum / count
                avg_r = r_sum / count
                avg_g = g_sum / count
                avg_b = b_sum / count
                
                if avg_a < 50:
                    row_str += " "
                else:
                    brightness = (avg_r + avg_g + avg_b) / 3
                    if brightness < 60:
                        row_str += "#"
                    elif brightness < 120:
                        row_str += "*"
                    elif brightness < 200:
                        row_str += "."
                    else:
                        row_str += "o"
            print(row_str)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

visualize_git_version()

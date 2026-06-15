from PIL import Image

def visualize(file_path):
    print(f"\nVisualizing {file_path}...")
    img = Image.open(file_path)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
        
    bbox = img.getbbox()
    if not bbox:
        print("Empty image")
        return
        
    x0, y0, x1, y1 = bbox
    w = x1 - x0
    h = y1 - y0
    print(f"Bounding box: {bbox} (width={w}, height={h})")
    
    grid_size = 30
    cell_w = w / grid_size
    cell_h = h / grid_size
    
    for row in range(grid_size):
        row_str = ""
        for col in range(grid_size):
            cx0 = int(x0 + col * cell_w)
            cy0 = int(y0 + row * cell_h)
            cx1 = int(x0 + (col + 1) * cell_w)
            cy1 = int(y0 + (row + 1) * cell_h)
            
            # Compute average color and alpha in this cell
            r_sum = g_sum = b_sum = a_sum = count = 0
            # Sample a few pixels in the cell to be fast
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
                # Transparent
                row_str += " "
            else:
                # Opaque
                # Let's show brightness or color
                brightness = (avg_r + avg_g + avg_b) / 3
                if brightness < 60:
                    row_str += "#"  # very dark / black
                elif brightness < 120:
                    row_str += "*"  # dark grey
                elif brightness < 200:
                    row_str += "."  # light grey
                else:
                    row_str += "o"  # very light/white
        print(row_str)

visualize("Energy V1/products/deye_inverter.png")
visualize("Energy V1/products/dyness_battery_new.png")
visualize("Energy V1/products/solis_inverter_new.png")

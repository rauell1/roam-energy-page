from PIL import Image

def visualize(file_path):
    print(f"\nVisualizing {file_path}...")
    img = Image.open(file_path)
    w, h = img.size
    print(f"Size: {w}x{h}")
    
    grid_size = 30
    cell_w = w / grid_size
    cell_h = h / grid_size
    
    for row in range(grid_size):
        row_str = ""
        for col in range(grid_size):
            cx0 = int(col * cell_w)
            cy0 = int(row * cell_h)
            cx1 = int((col + 1) * cell_w)
            cy1 = int((row + 1) * cell_h)
            
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

visualize("scratch/deye_cropped.png")

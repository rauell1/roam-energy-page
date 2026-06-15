from PIL import Image

def find_non_white():
    img = Image.open("Energy V1/products/Deye A.jpg")
    w, h = img.size
    
    non_white_pixels = []
    for y in range(h):
        for x in range(w):
            r, g, b = img.getpixel((x, y))
            brightness = (r + g + b) / 3
            if brightness < 220:
                non_white_pixels.append((x, y, (r, g, b)))
                
    print(f"Total non-white pixels (brightness < 220): {len(non_white_pixels)}")
    if non_white_pixels:
        xs = [p[0] for p in non_white_pixels]
        ys = [p[1] for p in non_white_pixels]
        print(f"Non-white bounding box: x in [{min(xs)}, {max(xs)}], y in [{min(ys)}, {max(ys)}]")
        # Divide the non-white pixels into a 5x5 grid and print the count of non-white pixels in each grid cell
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)
        w_nw = x_max - x_min
        h_nw = y_max - y_min
        print(f"Non-white dimensions: width={w_nw}, height={h_nw}")
        
        # Let's count them
        grid = [[0 for _ in range(5)] for _ in range(5)]
        for x, y, _ in non_white_pixels:
            col = min(4, int((x - x_min) / w_nw * 5))
            row = min(4, int((y - y_min) / h_nw * 5))
            grid[row][col] += 1
            
        print("Non-white pixel counts in 5x5 grid of the product region:")
        for r in grid:
            print("  " + "  ".join(f"{c:6d}" for c in r))

find_non_white()

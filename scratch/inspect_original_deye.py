from PIL import Image
import os

def inspect_original():
    path = "Energy V1/products/Deye A.jpg"
    if not os.path.exists(path):
        print("Deye A.jpg does not exist")
        return
    img = Image.open(path)
    w, h = img.size
    print(f"Original Deye A.jpg size: {w}x{h}")
    
    # Check the corners
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for xy in corners:
        print(f"Corner {xy}: {img.getpixel(xy)}")
        
    # Check a few coordinates along the right edge (x close to 4239)
    # and bottom edge (y close to 2831)
    print("Right edge colors (x=4200, y step 200):")
    for y in range(0, h, 200):
        print(f"  y={y}: {img.getpixel((4200, y))}")
        
    print("Bottom edge colors (y=2800, x step 300):")
    for x in range(0, w, 300):
        print(f"  x={x}: {img.getpixel((x, 2800))}")

inspect_original()

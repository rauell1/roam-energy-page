from PIL import Image

def inspect_deye_pixels():
    img_jpg = Image.open("Energy V1/products/Deye A.jpg")
    img_png = Image.open("Energy V1/products/Deye A.png")
    
    w, h = img_png.size
    print(f"PNG Size: {w}x{h}")
    
    # Bounding box of PNG is (1457, 291, 2783, 2550)
    # Let's check the bottom-most part of the bounding box, say y from 2200 to 2550
    # and x from 1457 to 2783.
    # We want to see what colors are present in both the JPG and the PNG in this region.
    dark_pixels_png = 0
    total_non_transparent = 0
    
    for y in range(2200, 2550):
        for x in range(1457, 2783):
            r, g, b, a = img_png.getpixel((x, y))
            if a > 0:
                total_non_transparent += 1
                if r < 50 and g < 50 and b < 50:
                    dark_pixels_png += 1
                    
    print(f"Total non-transparent pixels in bottom region: {total_non_transparent}")
    print(f"Dark pixels (R,G,B < 50) in PNG bottom region: {dark_pixels_png}")
    
    # Let's inspect a few pixels around the bottom edge in Deye A.jpg
    # to see if the original image has a black background or shadow there,
    # or if the product itself has a black area at the bottom.
    # For example, let's print the colors of some pixels in Deye A.jpg at the bottom of the product
    print("JPG colors at bottom center of product (x=2120, y=2200 to 2540 with step 50):")
    for y in range(2200, 2550, 50):
        print(f"  y={y}: JPG={img_jpg.getpixel((2120, y))}, PNG={img_png.getpixel((2120, y))}")

inspect_deye_pixels()

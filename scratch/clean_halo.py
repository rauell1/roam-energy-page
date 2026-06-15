from PIL import Image
import os

def remove_halo(image_path, output_path, brightness_threshold=220, max_distance=2):
    print(f"\nProcessing {image_path}...")
    if not os.path.exists(image_path):
        print("File not found")
        return
        
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    
    # Create mask of transparent pixels
    transparent_mask = [[False for _ in range(w)] for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] == 0:
                transparent_mask[y][x] = True
                
    to_remove = set()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 0:
                is_near = False
                # Search in a square neighborhood of size max_distance
                for dy in range(-max_distance, max_distance + 1):
                    for dx in range(-max_distance, max_distance + 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w:
                            if transparent_mask[ny][nx]:
                                is_near = True
                                break
                    if is_near:
                        break
                        
                if is_near:
                    # Check if it is close to white
                    if r >= brightness_threshold and g >= brightness_threshold and b >= brightness_threshold:
                        to_remove.add((x, y))
                        
    # Apply changes
    for x, y in to_remove:
        pixels[x, y] = (0, 0, 0, 0)
        
    # Crop the image to its new bounding box to remove empty space
    bbox = img.getbbox()
    if bbox:
        cropped = img.crop(bbox)
        cropped.save(output_path, "PNG")
        print(f"Saved to {output_path} (cropped to {cropped.size})")
    else:
        img.save(output_path, "PNG")
        print(f"Saved to {output_path} (no bounding box, size {img.size})")
        
    print(f"Removed halo: set {len(to_remove)} pixels to transparent.")

# Test on Dyness Battery
remove_halo("Energy V1/products/dyness_battery_new.png", "scratch/dyness_battery_test.png", brightness_threshold=210, max_distance=3)

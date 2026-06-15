import os
from PIL import Image

def remove_halo_and_crop(src_path, dest_path, brightness_threshold=220, max_distance=3, deye_crop_box=None):
    print(f"\nProcessing {src_path} -> {dest_path}...")
    if not os.path.exists(src_path):
        print(f"Error: Source file {src_path} not found.")
        return
        
    img = Image.open(src_path).convert("RGBA")
    
    # Special step for Deye: crop the black rocks and empty space at the bottom first
    if deye_crop_box:
        img = img.crop(deye_crop_box)
        print(f"  Cropped Deye inverter body to {img.size}")
        
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
        
    # Crop to final bounding box to remove empty padding
    bbox = img.getbbox()
    if bbox:
        cropped = img.crop(bbox)
        cropped.save(dest_path, "PNG")
        print(f"  Saved transparent cropped image to {dest_path} (size {cropped.size})")
    else:
        img.save(dest_path, "PNG")
        print(f"  Saved transparent image to {dest_path} (size {img.size})")
        
    print(f"  Removed {len(to_remove)} halo border pixels.")

# Let's define the file operations
# We load them from their restored HEAD versions under Energy V1/products/
# and save them directly back to the same paths!
remove_halo_and_crop(
    "Energy V1/products/deye_inverter.png", 
    "Energy V1/products/deye_inverter.png", 
    brightness_threshold=210, 
    max_distance=3,
    deye_crop_box=(1457, 282, 2783, 1750) # Crop Deye to remove rocks and vertical padding
)

remove_halo_and_crop(
    "Energy V1/products/dyness_battery_new.png", 
    "Energy V1/products/dyness_battery_new.png", 
    brightness_threshold=210, 
    max_distance=3
)

remove_halo_and_crop(
    "Energy V1/products/dyness_stack_new.png", 
    "Energy V1/products/dyness_stack_new.png", 
    brightness_threshold=210, 
    max_distance=3
)

remove_halo_and_crop(
    "Energy V1/products/solis_inverter_new.png", 
    "Energy V1/products/solis_inverter_new.png", 
    brightness_threshold=210, 
    max_distance=3
)

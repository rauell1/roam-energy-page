from PIL import Image, ImageDraw
import os

def test_thresholds(name, src_path):
    print(f"\n=== Testing thresholds for {name} ({src_path}) ===")
    if not os.path.exists(src_path):
        print("Source file not found")
        return
        
    for thresh in [30, 45, 60, 75, 90]:
        img = Image.open(src_path).convert("RGBA")
        w, h = img.size
        corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
        
        # We floodfill from corners
        for xy in corners:
            # We target the actual color at xy
            ImageDraw.floodfill(img, xy, (0, 0, 0, 0), thresh=thresh)
            
        # Count transparent pixels
        data = img.getdata()
        transparent = sum(1 for p in data if p[3] == 0)
        percent = (transparent / len(data)) * 100
        print(f"  Thresh={thresh}: transparent={transparent} ({percent:.1f}%)")

solis = r"C:\Users\royok\.gemini\antigravity\brain\e2788d19-a15f-455d-bdfa-1ffae49ce490\solis_inverter_gen_1781540485464.png"
dyness = r"C:\Users\royok\.gemini\antigravity\brain\e2788d19-a15f-455d-bdfa-1ffae49ce490\dyness_battery_gen_1781540522199.png"
stack = r"C:\Users\royok\.gemini\antigravity\brain\e2788d19-a15f-455d-bdfa-1ffae49ce490\dyness_stack_gen_1781540540684.png"

test_thresholds("Solis", solis)
test_thresholds("Dyness Battery", dyness)
test_thresholds("Dyness Stack", stack)

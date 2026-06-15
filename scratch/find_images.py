import os

def find_images():
    extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')
    for root, dirs, files in os.walk('.'):
        # Skip .git, node_modules, and similar directories
        if any(p in root for p in ('.git', 'node_modules')):
            continue
        for file in files:
            if file.lower().endswith(extensions) or 'A1BEEFE4' in file:
                full_path = os.path.join(root, file)
                size = os.path.getsize(full_path)
                print(f"{full_path} - {size} bytes")

find_images()

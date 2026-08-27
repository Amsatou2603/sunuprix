import subprocess
import os
from PIL import Image

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE_DIR = r"C:\Users\ndiay\Desktop\sunuprix"
DESIGN_DIR = os.path.join(BASE_DIR, "frontend", "public", "design")
ICONS_DIR = os.path.join(BASE_DIR, "frontend", "public", "icons")
APP_DIR = os.path.join(BASE_DIR, "frontend", "src", "app")
PUBLIC_DIR = os.path.join(BASE_DIR, "frontend", "public")

def render_svg_to_png(svg_file_path, output_png_path, width, height):
    clean_path = svg_file_path.replace("\\", "/")
    html_content = """<!DOCTYPE html>
<html>
<head>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; background: transparent; }
    img { width: """ + str(width) + """px; height: """ + str(height) + """px; display: block; }
  </style>
</head>
<body>
  <img src="file:///""" + clean_path + """" width="""" + str(width) + """" height="""" + str(height) + """" />
</body>
</html>"""
    
    temp_html = output_png_path + ".html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    clean_temp_html = temp_html.replace("\\", "/")
    cmd = [
        EDGE_PATH,
        "--headless",
        "--disable-gpu",
        f"--window-size={width},{height}",
        f"--screenshot={output_png_path}",
        f"file:///{clean_temp_html}"
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(temp_html):
        os.remove(temp_html)
    print(f"Generated: {output_png_path} ({width}x{height})")


def main():
    icon_svg = os.path.abspath(os.path.join(DESIGN_DIR, "icon.svg"))
    icon_app_svg = os.path.abspath(os.path.join(DESIGN_DIR, "icon-app.svg"))
    icon_maskable_svg = os.path.abspath(os.path.join(DESIGN_DIR, "icon-maskable.svg"))

    # Render PNGs
    fav16 = os.path.join(ICONS_DIR, "favicon-16.png")
    fav32 = os.path.join(ICONS_DIR, "favicon-32.png")
    apple180 = os.path.join(ICONS_DIR, "apple-touch-icon.png")
    icon192 = os.path.join(ICONS_DIR, "icon-192.png")
    icon512 = os.path.join(ICONS_DIR, "icon-512.png")
    mask512 = os.path.join(ICONS_DIR, "icon-maskable-512.png")
    logo_prev = os.path.join(DESIGN_DIR, "logo-preview.png")

    render_svg_to_png(icon_svg, fav16, 16, 16)
    render_svg_to_png(icon_svg, fav32, 32, 32)
    render_svg_to_png(icon_app_svg, apple180, 180, 180)
    render_svg_to_png(icon_app_svg, icon192, 192, 192)
    render_svg_to_png(icon_app_svg, icon512, 512, 512)
    render_svg_to_png(icon_maskable_svg, mask512, 512, 512)
    render_svg_to_png(icon_app_svg, logo_prev, 512, 512)

    # Generate ICO format for favicon.ico (containing 16x16, 32x32, 48x48)
    img32 = Image.open(fav32)
    img16 = Image.open(fav16)
    
    fav_ico_public = os.path.join(PUBLIC_DIR, "favicon.ico")
    fav_ico_app = os.path.join(APP_DIR, "favicon.ico")

    img32.save(fav_ico_public, format="ICO", sizes=[(16,16), (32,32), (48,48)], append_images=[img16])
    img32.save(fav_ico_app, format="ICO", sizes=[(16,16), (32,32), (48,48)], append_images=[img16])
    print(f"Generated ICO files: {fav_ico_public} & {fav_ico_app}")

if __name__ == "__main__":
    main()

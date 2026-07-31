#!/usr/bin/env python3
"""Generate demo media files from CC0 Unsplash images."""
from PIL import Image
from pillow_heif import from_pillow as to_heif
import subprocess, os

SRC = '/tmp/demo-media'
imgs = [Image.open(f'{SRC}/source_{i}.jpg') for i in range(4)]

# JPEG
imgs[0].save(f'{SRC}/photo_jpeg.jpg', 'JPEG', quality=85)
imgs[3].resize((120, 90)).save(f'{SRC}/thumb_jpeg.jpg', 'JPEG', quality=75)
imgs[3].resize((180, 135)).save(f'{SRC}/photo_small.jpg', 'JPEG', quality=80)

# PNG
imgs[1].resize((120, 90)).save(f'{SRC}/thumb_png.png', 'PNG')
imgs[2].save(f'{SRC}/photo_png.png', 'PNG')
imgs[2].resize((120, 90)).save(f'{SRC}/thumb2_png.png', 'PNG')

# GIF
imgs[1].resize((200, 150)).convert('P', palette=Image.ADAPTIVE, colors=128).save(f'{SRC}/photo_gif.gif', 'GIF')

# Animated GIF
frames = [imgs[1].resize((150, 112)).convert('P', palette=Image.ADAPTIVE, colors=64),
          imgs[0].resize((150, 112)).convert('P', palette=Image.ADAPTIVE, colors=64)]
frames[0].save(f'{SRC}/anim_gif.gif', 'GIF', save_all=True, append_images=[frames[1]], duration=500, loop=0)

# WEBP
imgs[0].resize((300, 225)).save(f'{SRC}/photo_webp.webp', 'WEBP', quality=80)

# HEIC (unsupported in Firefox/Chrome - tests fallback)
heif_img = to_heif(imgs[2].resize((250, 188)))
heif_img.save(f'{SRC}/photo_heic.heic')

print("Image variants created")
for f in sorted(os.listdir(SRC)):
    if any(f.endswith(x) for x in ('.jpg','.png','.gif','.webp','.heic')):
        sz = os.path.getsize(os.path.join(SRC, f))
        print(f"  {f}: {sz} bytes")

"""
Utility to overlay a handwritten-style name on opener images.
Creates a temporary copy with the name written on it.
"""

import os
import tempfile
import logging
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# Font paths to try in order (handwriting-style first)
FONT_CANDIDATES = [
    'C:/Windows/Fonts/Inkfree.ttf',     # Windows Ink Free (handwriting)
    'C:/Windows/Fonts/segoesc.ttf',      # Segoe Script
    'C:/Windows/Fonts/comic.ttf',        # Comic Sans (fallback)
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',  # Linux fallback
]


def _get_handwriting_font(size):
    """Find the best available handwriting-style font."""
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    # Ultimate fallback
    return ImageFont.load_default()


def overlay_name_on_image(image_path, name, output_dir=None):
    """
    Overlay a handwritten-style name on the opener image.
    Returns the path to the new image with the name overlay.
    
    Args:
        image_path: Path to the original opener image
        name: The recipient's name or username to write on the image
        output_dir: Directory for temp output (defaults to system temp)
    
    Returns:
        Path to the modified image, or original path if overlay fails
    """
    if not name or not name.strip():
        return image_path
        
    if not os.path.exists(image_path):
        logger.warning(f"Image not found for overlay: {image_path}")
        return image_path
    
    try:
        img = Image.open(image_path).convert('RGBA')
        w, h = img.size
        
        # Create a transparent overlay for the text
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Scale font size based on image dimensions (roughly 5-8% of image width)
        font_size = max(24, min(int(w * 0.07), 80))
        font = _get_handwriting_font(font_size)
        
        # Clean up the name
        display_name = name.strip()
        if display_name.startswith('@'):
            display_name = display_name[1:]
        
        # Measure text
        bbox = draw.textbbox((0, 0), display_name, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        
        # Position: bottom-center area with some padding
        x = (w - text_w) // 2
        y = h - text_h - int(h * 0.08)  # 8% from bottom
        
        # Draw a subtle shadow/outline for visibility
        shadow_color = (0, 0, 0, 120)
        for dx in [-2, -1, 0, 1, 2]:
            for dy in [-2, -1, 0, 1, 2]:
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), display_name, font=font, fill=shadow_color)
        
        # Draw the main text in white with slight transparency
        draw.text((x, y), display_name, font=font, fill=(255, 255, 255, 230))
        
        # Composite
        result = Image.alpha_composite(img, overlay)
        result = result.convert('RGB')
        
        # Save to temp file
        if not output_dir:
            output_dir = tempfile.gettempdir()
        
        # Create unique filename
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        output_path = os.path.join(output_dir, f"opener_{base_name}_{hash(name) % 10000}.jpg")
        result.save(output_path, 'JPEG', quality=92)
        
        logger.info(f"Name overlay created: '{display_name}' -> {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Failed to overlay name on image: {e}")
        return image_path

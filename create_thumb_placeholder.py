
from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder():
    # Create a dark energetic gradient-like background
    img = Image.new('RGB', (400, 600), color=(30, 30, 30))
    d = ImageDraw.Draw(img)
    
    # Add some visual interest
    d.rectangle([20, 20, 380, 580], outline=(100, 100, 100), width=5)
    d.text((50, 250), "TEASE PIC", fill=(255, 255, 255))
    d.text((50, 300), "PLACEHOLDER", fill=(200, 200, 200))
    
    # Save to public folder
    save_path = r'e:\Projects\Webapp_OF management\telegram-integration\public\tease_thumb.jpg'
    img.save(save_path)
    print(f"Placeholder saved to {save_path}")

if __name__ == "__main__":
    create_placeholder()

#!/usr/bin/env python3
"""
Betopia Email Signature Generator - CLI & Batch Utility
Generates pixel-perfect email signatures matching sample signature.png.
Supports high-quality dimensions: 800x140 and 600x130.
"""

import os
import sys
import argparse
import json
import csv
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ORANGE_COLOR = (253, 120, 20)  # Betopia Orange #FD7814
TEXT_COLOR = (17, 24, 39)      # Charcoal #111827
WHITE_COLOR = (255, 255, 255)

DEFAULT_ADDRESS = "Kaderia Tower, Level-1, Mohakhali C/A, Dhaka-1212, Bangladesh."

PROFILES = {
    "800x100": {
        "width": 800,
        "height": 100,
        "pad_left": 20,
        "logo_w": 154,
        "logo_h": 56,
        "gap_logo_div": 30,
        "div_w": 4,
        "div_top": 10,
        "div_bot": 90,
        "gap_div_text": 30,
        "pad_right": 20,
        "font_sizes": {"name": 22, "role": 14.85, "phone_lbl": 12.15, "phone_val": 12.15, "addr": 10.8},
        "text_y": {"name": 9, "role": 36, "phone": 60, "addr": 79}
    }
}


def get_font_paths():
    """Locates Segoe UI or equivalent clean sans fonts across operating systems."""
    possible_bold = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "/System/Library/Fonts/SFPro-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    ]
    possible_reg = [
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/SFPro-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    ]
    
    bold_path = next((p for p in possible_bold if os.path.exists(p)), None)
    reg_path = next((p for p in possible_reg if os.path.exists(p)), None)
    return bold_path, reg_path


def load_fonts(profile, scale=1):
    """Loads fonts sized precisely for the requested signature dimension and supersampling scale."""
    bold_path, reg_path = get_font_paths()
    sizes = profile["font_sizes"]
    if bold_path and reg_path:
        font_name = ImageFont.truetype(bold_path, int(sizes["name"] * scale))
        font_role = ImageFont.truetype(reg_path, sizes["role"] * scale)
        font_phone_lbl = ImageFont.truetype(bold_path, sizes["phone_lbl"] * scale)
        font_phone_val = ImageFont.truetype(reg_path, sizes["phone_val"] * scale)
        font_addr = ImageFont.truetype(reg_path, sizes["addr"] * scale)
    else:
        font_name = ImageFont.load_default()
        font_role = font_name
        font_phone_lbl = font_name
        font_phone_val = font_name
        font_addr = font_name

    return {
        "name": font_name,
        "role": font_role,
        "phone_lbl": font_phone_lbl,
        "phone_val": font_phone_val,
        "addr": font_addr
    }


def format_phone_number(raw_phone):
    """
    Automatically formats phone numbers.
    e.g. '+8801700000000' or '01700000000' -> '+880 1700 000000'
    """
    if not raw_phone:
        return ""
    text = str(raw_phone).strip()
    digits = "".join(c for c in text if c.isdigit())

    # 1. 880 followed by 10 digits (+8801700000000 or 8801700000000 -> 13 digits)
    if digits.startswith("880") and len(digits) == 13:
        return f"+880 {digits[3:7]} {digits[7:]}"

    # 2. 01 followed by 9 digits (01700000000 -> 11 digits)
    if digits.startswith("01") and len(digits) == 11:
        return f"+880 {digits[1:5]} {digits[5:]}"

    # 3. 10 digits starting with 1 (1700000000)
    if digits.startswith("1") and len(digits) == 10:
        return f"+880 {digits[:4]} {digits[4:]}"

    # 4. Starts with +880 or 880 and has 10 subsequent digits
    if text.startswith("+880") or text.startswith("880"):
        rest = "".join(c for c in text.split("880", 1)[1] if c.isdigit())
        if len(rest) == 10:
            return f"+880 {rest[:4]} {rest[4:]}"

    return text


def generate_signature(
    name="John Doe",
    role="AI Engineer",
    phone="+880 1700 000000",
    address=DEFAULT_ADDRESS,
    dimension="800x100",
    logo_path=None,
    transparent=False,
    supersample=2
):
    """
    Renders an email-optimized signature image at specified dimension ("800x100").
    Uses 2x supersampling anti-aliasing (SSAA) with Lanczos downsampling for crisp curves and maximum typographic sharpness.
    Returns a PIL.Image instance of exact dimensions (800x100).
    """
    profile = PROFILES.get(dimension, PROFILES["800x100"])
    scale = max(1, int(supersample))
    fonts = load_fonts(profile, scale=scale)
    phone = format_phone_number(phone)

    width = profile["width"]
    height = profile["height"]

    s_width = width * scale
    s_height = height * scale

    mode = "RGBA" if transparent else "RGB"
    bg = (255, 255, 255, 0) if transparent else WHITE_COLOR
    img_hi = Image.new(mode, (s_width, s_height), bg)
    draw = ImageDraw.Draw(img_hi)

    # 1. Logo Placement
    logo_x = profile["pad_left"] * scale
    logo_w = profile["logo_w"] * scale
    logo_h = profile["logo_h"] * scale
    logo_y = ((height - profile["logo_h"]) // 2) * scale

    if not logo_path:
        script_dir = Path(__file__).resolve().parent
        logo_path = script_dir / "assets" / "logo_clean.png"
        if not logo_path.exists():
            logo_path = script_dir / "assets" / "betopia_limited_logo.png"
            if not logo_path.exists():
                logo_path = script_dir / "betopia_limited_logo.png"

    if Path(logo_path).exists():
        logo = Image.open(logo_path).convert("RGBA")
        logo_resized = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        img_hi.paste(logo_resized, (logo_x, logo_y), logo_resized)
    else:
        print(f"Warning: Logo not found at {logo_path}")

    # 2. Orange Divider Line
    div_x = logo_x + logo_w + (profile["gap_logo_div"] * scale)
    div_w = profile["div_w"] * scale
    div_top = profile["div_top"] * scale
    div_bot = profile["div_bot"] * scale
    draw.rectangle([div_x, div_top, div_x + div_w, div_bot], fill=ORANGE_COLOR)

    # 3. Typography & Icons
    text_x = div_x + div_w + (profile["gap_div_text"] * scale)
    ty = profile["text_y"]

    draw.text((text_x, ty["name"] * scale), name, font=fonts["name"], fill=TEXT_COLOR)
    draw.text((text_x, ty["role"] * scale), role, font=fonts["role"], fill=TEXT_COLOR)

    # Icon & Content column layout
    icon_col_w = int(14 * scale)
    icon_gap = int(6 * scale)
    content_x = text_x + icon_col_w + icon_gap

    script_dir = Path(__file__).resolve().parent

    # 3.1 Phone Icon & Text
    phone_icon_path = script_dir / "assets" / "icon_phone.png"
    if phone_icon_path.exists():
        phone_icon = Image.open(phone_icon_path).convert("RGBA")
        phone_w = int(12.5 * scale)
        phone_h = int(12.5 * scale)
        phone_resized = phone_icon.resize((phone_w, phone_h), Image.Resampling.LANCZOS)
        phone_x = text_x + int((icon_col_w - phone_w) / 2)
        phone_y = int(59.5 * scale)
        img_hi.paste(phone_resized, (phone_x, phone_y), phone_resized)

    draw.text((content_x, ty["phone"] * scale), phone, font=fonts["phone_val"], fill=TEXT_COLOR)

    # 3.2 Location Icon & Address Text
    loc_icon_path = script_dir / "assets" / "icon_location.png"
    if loc_icon_path.exists():
        loc_icon = Image.open(loc_icon_path).convert("RGBA")
        loc_h = int(12.0 * scale)
        loc_w = int(loc_h * (loc_icon.width / loc_icon.height))
        loc_resized = loc_icon.resize((loc_w, loc_h), Image.Resampling.LANCZOS)
        loc_x = text_x + int((icon_col_w - loc_w) / 2)
        loc_y = int(78.5 * scale)
        img_hi.paste(loc_resized, (loc_x, loc_y), loc_resized)

    draw.text((content_x, ty["addr"] * scale), address, font=fonts["addr"], fill=TEXT_COLOR)

    if scale > 1:
        img_final = img_hi.resize((width, height), Image.Resampling.LANCZOS)
    else:
        img_final = img_hi

    return img_final


def save_signature(img, output_path, fmt="png", quality=95):
    """Saves the signature to file with optimal formatting."""
    fmt = fmt.lower()
    if fmt in ["jpg", "jpeg"]:
        if img.mode == "RGBA":
            background = Image.new("RGB", img.size, WHITE_COLOR)
            background.paste(img, mask=img.split()[3])
            img = background
        img.save(output_path, "JPEG", quality=quality, optimize=True)
    else:
        img.save(output_path, "PNG", optimize=True)
    try:
        print(f"[SUCCESS] Generated signature: {output_path}")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="Betopia Email Signature Generator")
    parser.add_argument("--name", default="John Doe", help="Full name")
    parser.add_argument("--role", default="AI Engineer", help="Job title or role")
    parser.add_argument("--phone", default="+880 1700 000000", help="Phone number")
    parser.add_argument("--address", default=DEFAULT_ADDRESS, help="Company address")
    parser.add_argument("--dimension", "-d", choices=["800x100"], default="800x100", help="Target signature dimension (800x100)")
    parser.add_argument("--format", choices=["png", "jpg", "jpeg"], default="png", help="Output format")
    parser.add_argument("--output", "-o", default=None, help="Output file path")
    parser.add_argument("--transparent", action="store_true", help="Transparent background (PNG only)")
    parser.add_argument("--batch", "-b", help="Path to CSV or JSON file for batch generation")
    parser.add_argument("--outdir", default="generated_signatures", help="Output folder for batch generation")

    args = parser.parse_args()

    # Batch mode
    if args.batch:
        batch_path = Path(args.batch)
        if not batch_path.exists():
            print(f"Error: Batch file not found: {batch_path}")
            sys.exit(1)

        out_dir = Path(args.outdir)
        out_dir.mkdir(parents=True, exist_ok=True)

        items = []
        if batch_path.suffix.lower() == ".json":
            with open(batch_path, "r", encoding="utf-8") as f:
                items = json.load(f)
        else:
            with open(batch_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                items = list(reader)

        print(f"Processing {len(items)} signatures in batch for dimension {args.dimension}...")
        for i, item in enumerate(items, 1):
            name = item.get("name") or item.get("Name", "Employee")
            role = item.get("role") or item.get("Role", "Team Member")
            phone = item.get("phone") or item.get("Phone", "")
            address = item.get("address") or item.get("Address", DEFAULT_ADDRESS)
            
            safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name.lower())
            filename = f"signature_{safe_name}_{args.dimension}.{args.format}"
            out_file = out_dir / filename

            sig = generate_signature(name, role, phone, address, dimension=args.dimension, transparent=args.transparent)
            save_signature(sig, str(out_file), fmt=args.format)

        print(f"[COMPLETED] Batch generation completed! All files saved in: {out_dir.resolve()}")
        return

    # Single mode
    out_file = args.output
    if not out_file:
        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in args.name.lower())
        out_file = f"signature_{safe_name}_{args.dimension}.{args.format}"

    sig = generate_signature(
        name=args.name,
        role=args.role,
        phone=args.phone,
        address=args.address,
        dimension=args.dimension,
        transparent=args.transparent
    )
    save_signature(sig, out_file, fmt=args.format)


if __name__ == "__main__":
    main()

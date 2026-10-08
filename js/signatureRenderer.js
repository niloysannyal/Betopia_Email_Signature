/**
 * Betopia Email Signature Renderer
 * Pixel-perfect canvas rendering based on sample signature reverse-engineering.
 * Supports tuned high-quality dimensions: 800x140 and 600x130.
 */

class SignatureRenderer {
  static PROFILES = {
    '800x100': {
      id: '800x100',
      name: '800 × 100 px',
      width: 800,
      height: 100,
      padLeft: 20,
      logoWidth: 154,
      logoHeight: 56,
      gapLogoDivider: 30,
      dividerWidth: 4,
      dividerTop: 10,
      dividerHeight: 80,
      gapDividerText: 30,
      padRight: 20,
      fonts: {
        name: '700 22px',
        role: '400 14.85px',
        phoneBold: '700 12.15px',
        phoneReg: '400 12.15px',
        phone: '400 12.15px',
        address: '400 10.8px'
      },
      baselines: {
        name: 26,
        role: 46,
        phone: 70,
        address: 89
      }
    }
  };

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Default profile
    this.currentPreset = '800x100';

    // Brand specifications
    this.brandOrange = '#FD7814';
    this.textColor = '#111827';
    this.fontFamily = '"Segoe UI", -apple-system, BlinkMacSystemFont, "Inter", Roboto, sans-serif';

    // Image element cache
    this.logoImg = null;
    this.logoLoaded = false;
    this.phoneImg = null;
    this.locImg = null;
    this.iconsLoaded = false;
  }

  /**
   * Set resolution preset
   */
  setPreset(preset = '800x100') {
    if (SignatureRenderer.PROFILES[preset]) {
      this.currentPreset = preset;
    } else {
      this.currentPreset = '800x100';
    }
  }

  getPreset() {
    return this.currentPreset;
  }

  getDimensions() {
    const profile = SignatureRenderer.PROFILES[this.currentPreset] || SignatureRenderer.PROFILES['800x100'];
    return { width: profile.width, height: profile.height };
  }

  /**
   * Preload Phone and Location icons
   */
  async loadIcons() {
    if (this.iconsLoaded && this.phoneImg && this.locImg) {
      return { phone: this.phoneImg, loc: this.locImg };
    }

    const phoneSrc = (typeof PHONE_ICON_DATA_URI !== 'undefined' && PHONE_ICON_DATA_URI)
      ? PHONE_ICON_DATA_URI
      : 'assets/icon_phone.png';

    const locSrc = (typeof LOCATION_ICON_DATA_URI !== 'undefined' && LOCATION_ICON_DATA_URI)
      ? LOCATION_ICON_DATA_URI
      : 'assets/icon_location.png';

    const loadImg = (src) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    const [phone, loc] = await Promise.all([loadImg(phoneSrc), loadImg(locSrc)]);
    this.phoneImg = phone;
    this.locImg = loc;
    this.iconsLoaded = true;
    return { phone, loc };
  }

  /**
   * Preload the logo image (uses in-memory Data URI to prevent canvas tainting)
   */
  async loadLogo() {
    if (this.logoLoaded && this.logoImg) {
      return this.logoImg;
    }

    const src = (typeof BETOPIA_LOGO_DATA_URI !== 'undefined' && BETOPIA_LOGO_DATA_URI)
      ? BETOPIA_LOGO_DATA_URI
      : 'assets/logo_clean.png';

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.logoImg = img;
        this.logoLoaded = true;
        resolve(img);
      };
      img.onerror = (err) => {
        console.error('Failed to load logo image:', err);
        // Fallback to local asset if data URI fails
        if (src !== 'assets/logo_clean.png') {
          const fallback = new Image();
          fallback.crossOrigin = 'anonymous';
          fallback.onload = () => {
            this.logoImg = fallback;
            this.logoLoaded = true;
            resolve(fallback);
          };
          fallback.onerror = reject;
          fallback.src = 'assets/logo_clean.png';
        } else {
          reject(err);
        }
      };
      img.src = src;
    });
  }

  /**
   * Render the signature onto the canvas with maximum quality via 2x Supersampling (SSAA)
   */
  async render({
    name = 'John Doe',
    role = 'AI Engineer',
    phone = '+880 1700 000000',
    address = 'Kaderia Tower, Level-1, Mohakhali C/A, Dhaka-1212, Bangladesh.',
    transparentBg = false,
    preset = this.currentPreset
  } = {}) {
    if (preset) {
      this.setPreset(preset);
    }
    const profile = SignatureRenderer.PROFILES[this.currentPreset] || SignatureRenderer.PROFILES['800x100'];
    const { width, height, padLeft, logoWidth, logoHeight, gapLogoDivider, dividerWidth, dividerTop, dividerHeight, gapDividerText, padRight, fonts, baselines } = profile;
    const { ctx, brandOrange, textColor, fontFamily } = this;

    // Strict output dimensions (800x100)
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    // 2x Supersampling Anti-Aliasing (SSAA): Render offscreen at 2x resolution
    // for ultra-smooth curves, vector-crisp typography, and zero pixelation
    const scale = 2;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width * scale;
    offCanvas.height = height * scale;
    const offCtx = offCanvas.getContext('2d');

    // Clear offscreen canvas
    offCtx.clearRect(0, 0, width * scale, height * scale);

    // Background fill
    if (!transparentBg) {
      offCtx.fillStyle = '#FFFFFF';
      offCtx.fillRect(0, 0, width * scale, height * scale);
    }

    // Scaled layout coordinates
    const sLogoX = padLeft * scale;
    const sLogoW = logoWidth * scale;
    const sLogoH = logoHeight * scale;
    const sLogoY = Math.round(((height - logoHeight) / 2) * scale);
    const sDivX = sLogoX + sLogoW + (gapLogoDivider * scale);
    const sDivW = dividerWidth * scale;
    const sDivTop = dividerTop * scale;
    const sDivH = dividerHeight * scale;
    const sTextStartX = sDivX + sDivW + (gapDividerText * scale);

    // 1. Draw Orange Divider Line
    offCtx.fillStyle = brandOrange;
    offCtx.fillRect(sDivX, sDivTop, sDivW, sDivH);

    // 2. Draw Logo with highest smoothing
    try {
      const logo = await this.loadLogo();
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';
      offCtx.drawImage(logo, sLogoX, sLogoY, sLogoW, sLogoH);
    } catch (e) {
      console.warn('Could not draw logo:', e);
    }

    // 3. Load Icons
    try {
      await this.loadIcons();
    } catch (e) {
      console.warn('Could not load icons:', e);
    }

    // 4. Typography & Icon Rendering Setup
    offCtx.fillStyle = textColor;
    offCtx.textBaseline = 'alphabetic';
    offCtx.textAlign = 'left';

    const parseScaledFont = (fontStr) => {
      const match = (fontStr || '').match(/^(\d+)\s+([\d.]+)px$/);
      if (match) {
        return `${match[1]} ${parseFloat(match[2]) * scale}px`;
      }
      return fontStr || `400 ${12 * scale}px`;
    };

    // 4.1 Name: Bold
    offCtx.font = `${parseScaledFont(fonts.name)} ${fontFamily}`;
    offCtx.fillText(name || 'Full Name', sTextStartX, baselines.name * scale);

    // 4.2 Role: Regular
    offCtx.font = `${parseScaledFont(fonts.role)} ${fontFamily}`;
    offCtx.fillText(role || 'Job Role', sTextStartX, baselines.role * scale);

    // Icon & Content column layout
    const iconColW = 14 * scale;
    const iconGap = 6 * scale;
    const contentStartX = sTextStartX + iconColW + iconGap;

    // Vector fallback path definitions
    const PHONE_SVG_PATH = "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";
    const LOCATION_SVG_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

    // 4.3 Phone: Bold Phone Icon + Regular digits
    const phoneW = Math.round(12.5 * scale);
    const phoneH = Math.round(12.5 * scale);
    const phoneX = sTextStartX + Math.round((iconColW - phoneW) / 2);
    const phoneY = Math.round(59.5 * scale);

    if (this.phoneImg) {
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';
      offCtx.drawImage(this.phoneImg, phoneX, phoneY, phoneW, phoneH);
    } else if (typeof Path2D !== 'undefined') {
      offCtx.save();
      offCtx.translate(phoneX, phoneY);
      offCtx.scale(phoneW / 24, phoneH / 24);
      offCtx.fillStyle = textColor;
      offCtx.fill(new Path2D(PHONE_SVG_PATH));
      offCtx.restore();
    }

    const phoneFont = fonts.phoneReg || fonts.phone || '400 12.15px';
    offCtx.font = `${parseScaledFont(phoneFont)} ${fontFamily}`;
    offCtx.fillText(phone || '', contentStartX, baselines.phone * scale);

    // 4.4 Address: Location Icon + Regular address text
    const locH = Math.round(12.0 * scale);
    const locW = this.locImg ? Math.round(locH * (this.locImg.width / this.locImg.height)) : Math.round(locH * (14 / 20));
    const locX = sTextStartX + Math.round((iconColW - locW) / 2);
    const locY = Math.round(78.5 * scale);

    if (this.locImg) {
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';
      offCtx.drawImage(this.locImg, locX, locY, locW, locH);
    } else if (typeof Path2D !== 'undefined') {
      offCtx.save();
      offCtx.translate(locX, locY);
      offCtx.scale(locH / 24, locH / 24);
      offCtx.fillStyle = textColor;
      offCtx.fill(new Path2D(LOCATION_SVG_PATH));
      offCtx.restore();
    }

    offCtx.font = `${parseScaledFont(fonts.address)} ${fontFamily}`;
    const maxAvailableTextWidth = (width * scale) - contentStartX - (padRight * scale);
    let addrWidth = offCtx.measureText(address || '').width;
    if (addrWidth > maxAvailableTextWidth && maxAvailableTextWidth > 100 * scale) {
      const scaleFactor = maxAvailableTextWidth / addrWidth;
      const baseSize = parseFloat(fonts.address.replace(/[^\d.]/g, '')) * scale;
      const adjustedSize = Math.max(9 * scale, Math.floor(baseSize * scaleFactor * 10) / 10);
      offCtx.font = `400 ${adjustedSize}px ${fontFamily}`;
    }
    offCtx.fillText(address || '', contentStartX, baselines.address * scale);

    // 5. Downsample high-res buffer to main target canvas using high-quality bicubic smoothing
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offCanvas, 0, 0, width, height);
  }

  /**
   * Export canvas to specific format
   */
  async exportBlob(format = 'png', quality = 1.0) {
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg'
    };
    const mime = mimeMap[format.toLowerCase()] || 'image/png';

    return new Promise((resolve, reject) => {
      try {
        this.canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob returned null'));
          }
        }, mime, quality);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Trigger download of the image
   */
  async download(filename, format = 'png', quality = 1.0) {
    const fmt = format.toLowerCase();
    const ext = fmt === 'jpeg' ? 'jpeg' : (fmt === 'jpg' ? 'jpg' : 'png');
    const safeFilename = (filename || 'betopia-signature').replace(/[^a-z0-9_-]/gi, '_') + '.' + ext;
    const mime = (fmt === 'jpg' || fmt === 'jpeg') ? 'image/jpeg' : 'image/png';

    let url = null;
    let isBlob = false;

    try {
      const blob = await this.exportBlob(fmt, quality);
      if (blob) {
        url = URL.createObjectURL(blob);
        isBlob = true;
      }
    } catch (err) {
      console.warn('exportBlob failed, attempting toDataURL fallback:', err);
    }

    if (!url) {
      url = this.canvas.toDataURL(mime, quality);
      isBlob = false;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (isBlob && url) {
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  }

  /**
   * Copy PNG image directly to clipboard
   */
  async copyToClipboard() {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API with ClipboardItem is not supported in this browser.');
    }
    const blob = await this.exportBlob('png', 1.0);
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignatureRenderer;
}

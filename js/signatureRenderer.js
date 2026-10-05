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

    // Logo element cache
    this.logoImg = null;
    this.logoLoaded = false;
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
    phone = '+8801712345678',
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

    // 3. Typography Rendering Setup (scaled vector fonts)
    offCtx.fillStyle = textColor;
    offCtx.textBaseline = 'alphabetic';
    offCtx.textAlign = 'left';

    const parseScaledFont = (fontStr) => {
      const match = fontStr.match(/^(\d+)\s+([\d.]+)px$/);
      if (match) {
        return `${match[1]} ${parseFloat(match[2]) * scale}px`;
      }
      return fontStr;
    };

    // 3.1 Name: Bold
    offCtx.font = `${parseScaledFont(fonts.name)} ${fontFamily}`;
    offCtx.fillText(name || 'Full Name', sTextStartX, baselines.name * scale);

    // 3.2 Role: Regular (10% reduced)
    offCtx.font = `${parseScaledFont(fonts.role)} ${fontFamily}`;
    offCtx.fillText(role || 'Job Role', sTextStartX, baselines.role * scale);

    // 3.3 Phone: Bold "Phone: " + Regular digits (10% reduced, moved down)
    const phoneLabel = 'Phone: ';
    offCtx.font = `${parseScaledFont(fonts.phoneBold)} ${fontFamily}`;
    offCtx.fillText(phoneLabel, sTextStartX, baselines.phone * scale);

    const phoneLabelW = offCtx.measureText(phoneLabel).width;
    offCtx.font = `${parseScaledFont(fonts.phoneReg)} ${fontFamily}`;
    offCtx.fillText(phone || '', sTextStartX + phoneLabelW, baselines.phone * scale);

    // 3.4 Address: Regular (10% reduced, moved down)
    offCtx.font = `${parseScaledFont(fonts.address)} ${fontFamily}`;
    const maxAvailableTextWidth = (width - (sTextStartX / scale) - padRight) * scale;
    let addrWidth = offCtx.measureText(address || '').width;
    if (addrWidth > maxAvailableTextWidth && maxAvailableTextWidth > 100 * scale) {
      const scaleFactor = maxAvailableTextWidth / addrWidth;
      const baseSize = parseFloat(fonts.address.replace(/[^\d.]/g, '')) * scale;
      const adjustedSize = Math.max(9 * scale, Math.floor(baseSize * scaleFactor * 10) / 10);
      offCtx.font = `400 ${adjustedSize}px ${fontFamily}`;
    }
    offCtx.fillText(address || '', sTextStartX, baselines.address * scale);

    // 4. Downsample high-res buffer to main target canvas using high-quality bicubic smoothing
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

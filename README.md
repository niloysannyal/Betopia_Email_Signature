# Betopia Limited — Email Signature Generator

<div align="center">
  <img src="assets/signature_preview.png" alt="Betopia Email Signature Preview" width="800">
  <p><em>Official pixel-perfect email signature standard (800 × 100 px) for Betopia Limited.</em></p>
</div>

---

Official email signature generation studio and automation utility for **Betopia Limited**. Designed to produce pixel-perfect, high-resolution signatures matching the company's brand identity.

- **Standard Resolution**: `800 × 100 px` banner format.
- **Rendering Quality**: 2× Supersampling Anti-Aliasing (SSAA) for razor-sharp typography and smooth logo curves.
- **Brand Colors**: Betopia Orange (`#FD7814`), Charcoal (`#111827`), Clean White (`#FFFFFF`).

---

## 🚀 Features

- **Pixel-Accurate Master Template**: Exact typography hierarchy (Segoe UI Bold / Regular), Betopia brand orange divider, clean logo alignment, and company address.
- **Dynamic User Inputs**:
  - Full Name (Default: `John Doe`)
  - Role / Title (Default: `AI Engineer`)
  - Phone Number (Default: `+880 1700 000000`)
  - Transparent Background toggle (PNG)
- **Interactive Web Studio**:
  - **Live Canvas Preview**: Real-time canvas rendering as you type at 1:1 pixel scale (800 × 100 px).
  - **One-Click Lossless PNG Download**: Instant export in high-definition PNG format.
  - **One-Click Copy to Clipboard**: Copy the signature image directly to clipboard for instant pasting into Gmail or Outlook.
  - **Email Client Mockup**: Preview how the signature appears in a realistic email conversation inbox.
- **Python Automation & Batch Utility**: Standalone `generate_signature.py` script for command-line generation and bulk CSV/JSON batch processing.
- **Deployment Ready**: Zero dependencies for static hosting; preconfigured for Vercel, Netlify, or GitHub Pages.

---

## 💻 Quick Start: Web Studio

### Option 1: Direct File Open (Zero Install)
Simply double-click `index.html` or open it in any modern browser:
```
index.html
```
*(No server or dependencies needed! The app is 100% self-contained).*

### Option 2: Local HTTP Server (Optional)
```bash
# Using Python
python -m http.server 3000

# Or using Node.js / npx
npx serve .
```
Then navigate to `http://localhost:3000` in your web browser.

---

## 🐍 Command-Line & Batch Generator (`generate_signature.py`)

A Python CLI script is also provided for automated generation or team-wide onboarding.

### 1. Prerequisites
```bash
pip install pillow
```

### 2. Single Signature Generation
```bash
# Generate 800x100 (default)
python generate_signature.py --name "John Doe" --role "AI Engineer" --phone "+880 1700 000000"
```

### 3. Batch Generation from CSV or JSON
To generate signatures for your entire team at once:

Create a `team.csv` file:
```csv
Name,Role,Phone
John Doe,AI Engineer,+880 1700 000000
Sarah Jenkins,Lead Product Designer,+8801712345679
Michael Vance,VP of Engineering,+8801798765432
```

Run:
```bash
python generate_signature.py --batch team.csv --format png --outdir signatures/
```
All generated signatures will be automatically saved into the `signatures/` folder!

---

## 📬 Adding Your Signature to Email Clients

### Gmail
1. In the Web Studio, click **Copy Image to Clipboard** (or download the PNG).
2. In Gmail, click the **Settings gear ⚙️ &rarr; See all settings**.
3. Under the **General** tab, scroll down to **Signature** and click **Create new**.
4. In the signature box, press **Ctrl + V** (or click the *Insert Image* icon and upload your PNG).
5. Set the image size to **Original size**.
6. Scroll down and click **Save Changes**.

### Outlook (Desktop & Web)
1. In the Web Studio, click **Copy Image to Clipboard** (or download the PNG).
2. In Outlook, go to **Settings &rarr; Options &rarr; Mail &rarr; Layout &rarr; Email signature**.
3. Create a new signature and press **Ctrl + V** to paste the image.
4. Save your signature.

---

## 🌐 Deploying to Vercel

This repository includes a preconfigured `vercel.json` and `package.json` for instant zero-configuration deployment.

### Method 1: Automatic Deployment via GitHub (Recommended)
1. Push this project to GitHub (see [Pushing to GitHub](#-pushing-to-github)).
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New &rarr; Project**.
4. Select your GitHub repository (`Betopia_Email_Signature`).
5. Click **Deploy**. Vercel will build and assign a live production URL (e.g., `https://betopia-email-signature.vercel.app`) in seconds!

### Method 2: Vercel CLI
```bash
npx vercel
```
Follow the interactive prompts to deploy directly from your local terminal.

---

## 🐙 Pushing to GitHub

Run the following commands in your terminal to push this project to a new GitHub repository:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage all clean project files
git add .

# 3. Create the initial commit
git commit -m "Initial commit: Betopia Limited Email Signature Generator"

# 4. Set main branch
git branch -M main

# 5. Link to your remote GitHub repository
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git

# 6. Push to GitHub
git push -u origin main
```

---

## 📁 Project Structure

```
Betopia_Email_Signature/
├── index.html                   # Interactive Web Studio UI
├── vercel.json                  # Vercel deployment configuration
├── package.json                 # Project metadata & scripts
├── .gitignore                   # Git ignore patterns
├── README.md                    # Documentation & guide
├── generate_signature.py        # Python CLI & bulk generator
├── assets/
│   ├── logo_clean.png           # Clean transparent Betopia logo
│   ├── betopia_limited_logo.png # High-res company logo source
│   └── signature_preview.png    # Preview banner image
├── css/
│   └── style.css                # Premium styling (Betopia theme & responsive layout)
└── js/
    ├── app.js                   # Application state, events, downloads, clipboard
    ├── logo_data.js             # Base64 logo data for offline canvas compatibility
    └── signatureRenderer.js     # 2x SSAA Canvas 2D rendering engine
```

---

## 📄 License

Internal tool developed for **Betopia Limited**. All rights reserved.

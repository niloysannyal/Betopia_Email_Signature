/**
 * Betopia Email Signature Generator — Main Application Controller
 * Optimized for official 800x100 px Betopia Limited email signature.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Brand Default Constants
  const COMPANY_ADDRESS = 'Kaderia Tower, Level-1, Mohakhali C/A, Dhaka-1212, Bangladesh.';
  const DEFAULT_PRESET = '800x100';

  // DOM Elements
  const canvas = document.getElementById('signatureCanvas');
  const inputName = document.getElementById('input-name');
  const inputRole = document.getElementById('input-role');
  const inputPhone = document.getElementById('input-phone');
  const inputTransparent = document.getElementById('input-transparent');

  const btnDownload = document.getElementById('btn-download');
  const btnCopyClipboard = document.getElementById('btn-copy-clipboard');
  const btnReset = document.getElementById('btn-reset');

  const resolutionPill = document.querySelector('.resolution-pill');
  const tabButtons = document.querySelectorAll('.tab-btn');

  const viewportPreview = document.getElementById('viewport-preview');
  const viewportMockup = document.getElementById('viewport-mockup');

  const mockupSignatureImg = document.getElementById('mockup-signature-img');
  const mockupSenderName = document.getElementById('mockup-sender-name');
  const toastContainer = document.getElementById('toastContainer');

  // Application State
  const selectedPreset = DEFAULT_PRESET;
  const selectedFormat = 'png';
  let activeTab = 'preview';

  // Initialize Canvas Renderer
  const renderer = new SignatureRenderer(canvas);
  renderer.setPreset(selectedPreset);

  // Debounced Render helper
  let renderTimeout = null;
  function scheduleRender(delay = 50) {
    if (renderTimeout) clearTimeout(renderTimeout);
    renderTimeout = setTimeout(performRender, delay);
  }

  async function performRender() {
    const rawPhone = (inputPhone && inputPhone.value.trim()) || '+880 1700 000000';
    const data = {
      name: (inputName && inputName.value.trim()) || 'John Doe',
      role: (inputRole && inputRole.value.trim()) || 'AI Engineer',
      phone: SignatureRenderer.formatPhone(rawPhone),
      address: COMPANY_ADDRESS,
      transparentBg: inputTransparent ? inputTransparent.checked : false,
      preset: selectedPreset
    };

    try {
      await renderer.render(data);

      // Update resolution badge in preview toolbar
      if (resolutionPill && canvas) {
        resolutionPill.textContent = `${canvas.width} × ${canvas.height} px`;
      }

      // Sync mockup view if active
      if (activeTab === 'mockup') {
        updateMockupView();
      }
    } catch (err) {
      console.error('Error rendering signature:', err);
    }
  }

  // Update Email Mockup
  function updateMockupView() {
    if (!mockupSignatureImg) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      mockupSignatureImg.src = dataUrl;
      if (mockupSenderName && inputName) {
        mockupSenderName.textContent = inputName.value.trim() || 'John Doe';
      }
    } catch (e) {
      console.warn('Canvas export for mockup failed:', e);
    }
  }

  // Download Trigger
  btnDownload.addEventListener('click', async () => {
    const rawName = (inputName && inputName.value.trim()) || 'John Doe';
    const safeName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const filename = `betopia_signature_${safeName}`;

    btnDownload.style.opacity = '0.7';
    btnDownload.style.pointerEvents = 'none';

    try {
      await renderer.download(filename, selectedFormat, 1.0);
      showToast(`Downloaded ${filename}.${selectedFormat}`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Download failed. Please try again.', 'info');
    } finally {
      btnDownload.style.opacity = '1';
      btnDownload.style.pointerEvents = 'auto';
    }
  });

  // Copy to Clipboard Trigger
  btnCopyClipboard.addEventListener('click', async () => {
    btnCopyClipboard.style.opacity = '0.7';
    btnCopyClipboard.style.pointerEvents = 'none';

    try {
      await renderer.copyToClipboard();
      showToast('Copied signature to clipboard! Paste directly into Gmail or Outlook.', 'success');
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      // Fallback: auto download PNG and inform user
      try {
        const rawName = (inputName && inputName.value.trim()) || 'John Doe';
        const safeName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        await renderer.download(`betopia_signature_${safeName}`, 'png');
        showToast('Clipboard access restricted in browser. Downloaded PNG instead!', 'info');
      } catch (fallbackErr) {
        showToast('Could not copy image. Please use Download button.', 'info');
      }
    } finally {
      btnCopyClipboard.style.opacity = '1';
      btnCopyClipboard.style.pointerEvents = 'auto';
    }
  });

  // Reset to Sample
  btnReset.addEventListener('click', () => {
    if (inputName) inputName.value = 'John Doe';
    if (inputRole) inputRole.value = 'AI Engineer';
    if (inputPhone) inputPhone.value = '+880 1700 000000';
    if (inputTransparent) inputTransparent.checked = false;

    scheduleRender(10);
    showToast('Reset to default specifications', 'info');
  });

  // Tab Navigation Handling (Preview vs Email Mockup)
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      tabButtons.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;

      if (viewportPreview) viewportPreview.style.display = 'none';
      if (viewportMockup) viewportMockup.style.display = 'none';

      if (activeTab === 'preview') {
        if (viewportPreview) viewportPreview.style.display = 'flex';
      } else if (activeTab === 'mockup') {
        if (viewportMockup) {
          viewportMockup.style.display = 'flex';
          updateMockupView();
        }
      }
    });
  });

  // Real-time Input Listeners
  [inputName, inputRole].forEach(input => {
    if (input) {
      input.addEventListener('input', () => scheduleRender(30));
    }
  });

  // Phone input automatic formatting and real-time updates
  if (inputPhone) {
    const formatPhoneField = () => {
      const raw = inputPhone.value;
      const formatted = SignatureRenderer.formatPhone(raw);
      if (formatted && formatted !== raw) {
        inputPhone.value = formatted;
        scheduleRender(10);
      }
    };

    // Auto-format field on blur / focus change
    inputPhone.addEventListener('blur', formatPhoneField);
    inputPhone.addEventListener('change', formatPhoneField);

    // Auto-format field immediately on paste
    inputPhone.addEventListener('paste', () => {
      setTimeout(formatPhoneField, 10);
    });

    // Auto-format field as soon as a complete 11 or 13 digit number is reached
    inputPhone.addEventListener('input', () => {
      const digits = inputPhone.value.replace(/\D/g, '');
      if ((digits.startsWith('880') && digits.length === 13) ||
          (digits.startsWith('01') && digits.length === 11)) {
        formatPhoneField();
      }
      scheduleRender(30);
    });
  }

  if (inputTransparent) {
    inputTransparent.addEventListener('change', () => scheduleRender(0));
  }

  // Toast Notification System
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Initial High-Fidelity Render
  try {
    await performRender();
    console.log('Betopia Signature Studio initialized successfully.');
  } catch (err) {
    console.error('Initial signature render failed:', err);
  }
});

document.addEventListener('DOMContentLoaded', () => {

    // ── Selectors ──────────────────────────────────────────────
    const itemForm          = document.getElementById('item-form');
    const itemsGrid         = document.getElementById('itemsGrid');
    const itemImageInput    = document.getElementById('itemImage');
    const imagePreview      = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    const uploadModeBtn    = document.getElementById('btn-upload-mode');
    const cameraModeBtn    = document.getElementById('btn-camera-mode');
    const uploadLabel      = document.getElementById('upload-label');
    const cameraUI         = document.getElementById('camera-ui');
    const cameraVideo      = document.getElementById('camera-preview');
    const cameraCanvas     = document.getElementById('camera-canvas');
    const capturedPreview  = document.getElementById('captured-preview');
    const captureBtn       = document.getElementById('btn-capture');
    const retakeBtn        = document.getElementById('btn-retake');
    let cameraStream = null;
    let capturedImageBlob = null;

    const profileBtn      = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const btnMyLost        = document.getElementById('btn-my-lost');
    const btnMyFound       = document.getElementById('btn-my-found');
    const reportModal      = document.getElementById('report-modal');
    const modalBox         = document.getElementById('modal-box');
    const modalTitle       = document.getElementById('modal-title');
    const modalGrid        = document.getElementById('modal-grid');
    const modalClose       = document.getElementById('modal-close');

    const navToggle = document.getElementById('nav-toggle');
    const navLinks  = document.getElementById('nav-links');

    const themeToggle = document.getElementById('theme-toggle');
    const rootEl = document.documentElement;

    const reportsFab   = document.getElementById('reports-fab');
    const reportsPanel = document.getElementById('reports-panel');
    const panelClose   = document.getElementById('panel-close');

    const aboutSection = document.getElementById('about');
    const funGuide      = document.getElementById('fun-guide');

    const submitBtn     = document.getElementById('submit-btn');
    const submitBtnText = document.getElementById('submit-btn-text');

    const authModal   = document.getElementById('auth-modal');
    const authBox     = document.getElementById('auth-box');
    const authClose   = document.getElementById('auth-close');
    const authError   = document.getElementById('auth-error');
    const btnLogin    = document.getElementById('btn-login');
    const btnLogout   = document.getElementById('btn-logout');
    const profileStatus = document.querySelector('.profile-status');

    const tabLogin    = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm   = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotRequestForm = document.getElementById('forgot-request-form');
    const forgotResetForm   = document.getElementById('forgot-reset-form');

    const AUTH_API = 'https://mits-lost-found.onrender.com/auth';

    let allItems = [];
    let isSubmitting = false; // prevents duplicate-post spam from repeated taps

    const API_URL = 'https://mits-lost-found.onrender.com/api/items';

    const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 380">
            <rect width="100%" height="100%" rx="20" fill="#1e293b"/>
            <circle cx="340" cy="180" r="90" fill="#293548"/>
            <text x="340" y="188" font-family="sans-serif" font-size="26" font-weight="700" fill="#64748b" text-anchor="middle">NO IMAGE</text>
        </svg>
    `)}`;

    // ── Theme Toggle ─────────────────────────────────────────────
    const applyThemeIcon = () => {
        themeToggle.textContent = rootEl.getAttribute('data-theme') === 'light' ? '☀️' : '🌙';
    };
    applyThemeIcon();

    themeToggle.addEventListener('click', () => {
        const next = rootEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        rootEl.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        applyThemeIcon();
    });

    // ── Image helpers ────────────────────────────────────────────
    // Lower quality + smaller size = much faster load/upload, especially on mobile
    const getOptimizedUrl = (url, width) => {
        if (!url || !url.includes('/upload/')) return url;
        return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto:low,f_auto/`);
    };

    const renderImageBlock = (imageUrl) => {
        const hasImage = imageUrl && !imageUrl.includes('placehold.co');
        if (hasImage) {
            return `<div class="item-image-wrap" style="background-image:url('${getOptimizedUrl(imageUrl, 24)}')">
                        <img src="${getOptimizedUrl(imageUrl, 480)}" class="item-image" loading="lazy" alt="Item photo" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
                    </div>`;
        }
        return `<div class="item-image-wrap no-image">
                    <img src="${FALLBACK_IMAGE}" class="item-image" loading="lazy" alt="No image uploaded">
                </div>`;
    };

    // ── 1. Scroll Reveal ───────────────────────────────────────
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.05 });

    revealEls.forEach(el => revealObserver.observe(el));

    // ── 2. About guide toggle (click to open, mouse-leave to close) ──
    const navAbout = document.getElementById('nav-about');
    if (navAbout) {
        navAbout.addEventListener('click', (e) => {
            e.preventDefault();
            funGuide.classList.toggle('show');
        });
    }

    if (aboutSection) {
        aboutSection.addEventListener('mouseleave', () => {
            funGuide.classList.remove('show');
        });
    }

    // ── 3. Load Items & Stats ──────────────────────────────────
    const loadItems = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            allItems = data.items || [];
            itemsGrid.innerHTML = '';

            if (allItems.length === 0) {
                itemsGrid.innerHTML = `
                    <p style="color:var(--text-muted);font-size:.9rem;grid-column:1/-1;padding:20px 0;text-align:center;">
                        No items yet — be the first to post!
                    </p>`;
            }

            allItems.forEach(item => {
                const card = document.createElement('div');
                card.className = `item-card ${item.itemType}`;

                card.innerHTML = `
                    ${renderImageBlock(item.imageUrl)}
                    <h4>${item.itemName}</h4>
                    <p>📍 ${item.location || 'Location not specified'}</p>
                    <p class="card-desc">${item.description || 'No description provided.'}</p>
                    <p style="font-size:.85rem;color:var(--cyan-accent);">📞 ${item.contactInfo}</p>
                    <button class="resolve-btn" data-id="${item._id}">✅ Mark Resolved</button>
                `;
                itemsGrid.appendChild(card);
            });

            document.getElementById('total-lost').innerText = allItems.filter(i => i.itemType === 'lost').length;
            document.getElementById('total-found').innerText = allItems.filter(i => i.itemType === 'found').length;
            document.getElementById('total-recovered').innerText = data.resolvedCount || 0;

        } catch (err) {
            console.error("Load error:", err);
            itemsGrid.innerHTML = `
                <p style="color:var(--lost-color);font-size:.9rem;grid-column:1/-1;padding:20px 0;text-align:center;">
                    ⚠️ Could not connect to server.
                </p>`;
        }
    };

    // ── 3.5 Profile Dropdown & My Reports Modal ────────────────
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
            profileDropdown.classList.add('hidden');
        }
    });

    const renderModalItems = (type) => {
        const filtered = allItems.filter(i => i.itemType === type);
        modalTitle.textContent = type === 'lost' ? '🔴 My Lost Reports' : '🟢 My Found Reports';

        modalGrid.innerHTML = filtered.length === 0
            ? `<p style="color:var(--text-muted);grid-column:1/-1;padding:20px 0;text-align:center;">No ${type} reports found.</p>`
            : filtered.map(item => `
                <div class="item-card ${item.itemType}">
                    ${renderImageBlock(item.imageUrl)}
                    <h4>${item.itemName}</h4>
                    <p>📍 ${item.location || 'Location not specified'}</p>
                    <p class="card-desc">${item.description || 'No description provided.'}</p>
                </div>
            `).join('');

        reportModal.classList.remove('hidden');
    };

    btnMyLost.addEventListener('click', () => renderModalItems('lost'));
    btnMyFound.addEventListener('click', () => renderModalItems('found'));
    modalClose.addEventListener('click', () => reportModal.classList.add('hidden'));

    reportModal.addEventListener('click', (e) => {
        if (e.target === reportModal) reportModal.classList.add('hidden');
    });

    // close the modal automatically when the cursor leaves the popup box
    if (modalBox) {
        modalBox.addEventListener('mouseleave', () => {
            reportModal.classList.add('hidden');
        });
    }

    // ── 3.6 Floating Reports Panel ──────────────────────────────
    reportsFab.addEventListener('click', () => {
        reportsPanel.classList.toggle('hidden');
    });

    panelClose?.addEventListener('click', () => {
        reportsPanel.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!reportsPanel.contains(e.target) && e.target !== reportsFab) {
            reportsPanel.classList.add('hidden');
        }
    });

    // close the panel automatically when the cursor leaves it
    reportsPanel.addEventListener('mouseleave', () => {
        reportsPanel.classList.add('hidden');
    });

    // ── 3.7 Mobile Nav Toggle ────────────────────────────────────
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // ── 4. Camera Mode ─────────────────────────────────────────
    const startCamera = async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            cameraVideo.srcObject = cameraStream;
            cameraVideo.style.display = 'block';
            capturedPreview.style.display = 'none';
            captureBtn.style.display = 'inline-block';
            retakeBtn.style.display = 'none';
        } catch (err) {
            alert('Camera access unavailable: ' + err.message);
            uploadModeBtn.click();
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    };

    uploadModeBtn.addEventListener('click', () => {
        uploadModeBtn.classList.add('active');
        cameraModeBtn.classList.remove('active');
        uploadLabel.style.display = 'flex';
        cameraUI.style.display = 'none';
        capturedImageBlob = null;
        stopCamera();
    });

    cameraModeBtn.addEventListener('click', async () => {
        cameraModeBtn.classList.add('active');
        uploadModeBtn.classList.remove('active');
        uploadLabel.style.display = 'none';
        cameraUI.style.display = 'flex';
        await startCamera();
    });

    // Captures at a smaller max dimension + lower JPEG quality so uploads
    // and page renders stay fast on mobile connections.
    captureBtn.addEventListener('click', () => {
        const maxDim = 1000;
        let vw = cameraVideo.videoWidth;
        let vh = cameraVideo.videoHeight;
        const scale = Math.min(1, maxDim / Math.max(vw, vh));
        cameraCanvas.width = vw * scale;
        cameraCanvas.height = vh * scale;
        cameraCanvas.getContext('2d').drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

        cameraCanvas.toBlob((blob) => {
            capturedImageBlob = blob;
            capturedPreview.src = URL.createObjectURL(blob);
            capturedPreview.style.display = 'block';
            cameraVideo.style.display = 'none';
            captureBtn.style.display = 'none';
            retakeBtn.style.display = 'inline-block';
            stopCamera();
        }, 'image/jpeg', 0.7);
    });

    retakeBtn.addEventListener('click', async () => {
        capturedImageBlob = null;
        capturedPreview.style.display = 'none';
        await startCamera();
    });

    // ── 5. Post New Item ───────────────────────────────────────
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Block duplicate submissions from repeated taps while a post is in flight
        if (isSubmitting) return;
        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtnText.innerHTML = `<span class="spinner"></span> Posting...`;

        const formData = new FormData();
        formData.append('itemName',    document.getElementById('itemName').value);
        formData.append('itemType',    document.getElementById('itemType').value);
        formData.append('contactInfo', document.getElementById('contactInfo').value);
        formData.append('location',    document.getElementById('itemLocation').value);
        formData.append('description', document.getElementById('itemDescription').value);

        if (capturedImageBlob) {
            formData.append('itemImage', capturedImageBlob, 'capture.jpg');
        } else if (itemImageInput.files[0]) {
            formData.append('itemImage', itemImageInput.files[0]);
        }

        try {
            const res = await fetch(API_URL, { method: 'POST', body: formData });
            if (res.ok) {
                itemForm.reset();
                imagePreview.classList.add('hidden');
                uploadPlaceholder.classList.remove('hidden');
                capturedImageBlob = null;
                capturedPreview.style.display = 'none';
                uploadModeBtn.click();
                await loadItems();
            } else {
                alert("Could not post item. Check fields and try again.");
            }
        } catch (err) {
            console.error("Post error:", err);
            alert("Could not connect to server. If this is your first visit today, the server may still be waking up — please wait a few seconds and try again.");
        } finally {
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtnText.textContent = 'Post to Feed';
        }
    });

    // ── 6. Image Preview ───────────────────────────────────────
    itemImageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    });

    // ── 7. Resolve Item Action ─────────────────────────────────
    itemsGrid.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('resolve-btn')) return;

        const id = e.target.dataset.id;
        if (confirm("Mark this item as resolved?")) {
            try {
                const res = await fetch(`${API_URL}/resolve/${id}`, { method: 'PUT' });
                if (res.ok) loadItems();
            } catch (err) {
                console.error("Resolve error:", err);
            }
        }
    });


//~ ── AUTH SYSTEM ──────────────────────────────────────────────
    const showAuthView = (viewToShow) => {
        [loginForm, registerForm, forgotRequestForm, forgotResetForm].forEach(f => f.classList.add('hidden'));
        viewToShow.classList.remove('hidden');
        authError.classList.add('hidden');
    };

    const showAuthError = (msg) => {
        authError.textContent = msg;
        authError.classList.remove('hidden');
    };

    const openAuthModal = () => {
        authModal.classList.remove('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        showAuthView(loginForm);
    };

    btnLogin.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        openAuthModal();
    });

    authClose.addEventListener('click', () => authModal.classList.add('hidden'));
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.add('hidden');
    });
    // authBox.addEventListener('mouseleave', () => authModal.classList.add('hidden'));

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        showAuthView(loginForm);
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        showAuthView(registerForm);
    });

    document.getElementById('show-forgot').addEventListener('click', () => showAuthView(forgotRequestForm));
    document.getElementById('back-to-login-1').addEventListener('click', () => showAuthView(loginForm));
    document.getElementById('back-to-login-2').addEventListener('click', () => showAuthView(loginForm));

    // show/hide password toggles
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            input.type = input.type === 'password' ? 'text' : 'password';
            btn.textContent = input.type === 'password' ? '👁️' : '🙈';
        });
    });

    const saveSession = (token, user) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(user));
        applySessionUI();
    };

    const applySessionUI = () => {
        const user = JSON.parse(localStorage.getItem('authUser') || 'null');
        if (user) {
            profileStatus.textContent = user.name;
            btnLogin.classList.add('hidden');
            btnLogout.classList.remove('hidden');
        } else {
            profileStatus.textContent = 'Guest';
            btnLogin.classList.remove('hidden');
            btnLogout.classList.add('hidden');
        }
    };
    applySessionUI();

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        applySessionUI();
        profileDropdown.classList.add('hidden');
    });

    // LOGIN submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${AUTH_API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value,
                }),
            });
            const data = await res.json();
            if (!res.ok) return showAuthError(data.error || 'Login failed.');
            saveSession(data.token, data.user);
            authModal.classList.add('hidden');
            loginForm.reset();
        } catch (err) {
            showAuthError('Could not connect to server. It may still be waking up — try again in a few seconds.');
        }
    });

    // REGISTER submit
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${AUTH_API}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('register-name').value,
                    email: document.getElementById('register-email').value,
                    password: document.getElementById('register-password').value,
                }),
            });
            const data = await res.json();
            if (!res.ok) return showAuthError(data.error || 'Registration failed.');
            saveSession(data.token, data.user);
            authModal.classList.add('hidden');
            registerForm.reset();
        } catch (err) {
            showAuthError('Could not connect to server. It may still be waking up — try again in a few seconds.');
        }
    });

    // FORGOT PASSWORD step 1: request OTP
    const forgotSubmitBtn = forgotRequestForm.querySelector('.auth-submit');

    forgotRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        forgotSubmitBtn.disabled = true;
        forgotSubmitBtn.textContent = 'Sending...';

        try {
            const res = await fetch(`${AUTH_API}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: document.getElementById('forgot-email').value }),
            });
            const data = await res.json();

            if (!res.ok) {
                showAuthError(data.error || 'Could not send reset code. Please try again.');
                return;
            }

            document.getElementById('forgot-otp').dataset.email = document.getElementById('forgot-email').value;
            showAuthView(forgotResetForm);
        } catch (err) {
            showAuthError('Could not connect to server. It may still be waking up — wait a few seconds and try again.');
        } finally {
            forgotSubmitBtn.disabled = false;
            forgotSubmitBtn.textContent = 'Send Reset Code';
        }
    });

    // FORGOT PASSWORD step 2: verify OTP + set new password
    forgotResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${AUTH_API}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('forgot-otp').dataset.email,
                    otp: document.getElementById('forgot-otp').value,
                    newPassword: document.getElementById('forgot-new-password').value,
                }),
            });
            const data = await res.json();
            if (!res.ok) return showAuthError(data.error || 'Reset failed.');
            showAuthView(loginForm);
            forgotResetForm.reset();
        } catch (err) {
            showAuthError('Could not connect to server.');
        }
    });

    // GOOGLE LOGIN
    window.handleGoogleLogin = async (response) => {
        try {
            const res = await fetch(`${AUTH_API}/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential }),
            });
            const data = await res.json();
            if (!res.ok) return showAuthError(data.error || 'Google sign-in failed.');
            saveSession(data.token, data.user);
            authModal.classList.add('hidden');
        } catch (err) {
            showAuthError('Could not connect to server.');
        }
    };

    if (window.google) {
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID_HERE',
            callback: window.handleGoogleLogin,
        });
        google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'outline', size: 'large', width: 300 }
        );
    }

    // Init
    loadItems();
});
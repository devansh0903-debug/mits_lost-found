document.addEventListener('DOMContentLoaded', () => {

    // ── Selectors ──────────────────────────────────────────────
    const itemForm        = document.getElementById('item-form');
    const itemsGrid       = document.getElementById('itemsGrid');
    const itemImageInput  = document.getElementById('itemImage');
    const imagePreview    = document.getElementById('image-preview');
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
    const modalTitle       = document.getElementById('modal-title');
    const modalGrid        = document.getElementById('modal-grid');
    const modalClose       = document.getElementById('modal-close');

    const navToggle = document.getElementById('nav-toggle');
    const navLinks  = document.getElementById('nav-links');

    const reportsFab   = document.getElementById('reports-fab');
    const reportsPanel = document.getElementById('reports-panel');
    const panelClose   = document.getElementById('panel-close');

    let allItems = []; // holds the last loaded items so modals can reuse them

    const API_URL = 'https://mits-lost-found.onrender.com/api/items';
    const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 520">
            <circle cx="340" cy="270" r="215" fill="#ffffff"/>
            <circle cx="340" cy="270" r="215" fill="none" stroke="#f0ded0" stroke-width="3" stroke-dasharray="14 10"/>
            <circle cx="340" cy="270" r="192" fill="#f6e6cf"/>
            <path id="arcpath" d="M 220 190 A 130 130 0 0 1 460 190" fill="none"/>
            <text font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#e0453c" stroke="#ffffff" stroke-width="6" paint-order="stroke" text-anchor="middle">
                <textPath href="#arcpath" startOffset="50%">OOPS!</textPath>
            </text>
            <g fill="#e0453c">
                <path d="M198 205 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 z"/>
                <path d="M482 205 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 z"/>
            </g>
            <rect x="425" y="258" width="26" height="18" rx="4" fill="#c96f45"/>
            <rect x="310" y="232" width="64" height="26" rx="8" fill="#c96f45"/>
            <rect x="240" y="252" width="200" height="128" rx="20" fill="#e8875f"/>
            <path d="M240 272 a20 20 0 0 1 20 -20 h160 a20 20 0 0 1 20 20 v10 h-200 z" fill="#c96f45"/>
            <circle cx="340" cy="330" r="48" fill="#8a4a2f"/>
            <circle cx="340" cy="330" r="37" fill="#f6e6cf"/>
            <circle cx="340" cy="330" r="42" fill="#e0453c" opacity="0.92"/>
            <circle cx="340" cy="330" r="42" fill="none" stroke="#ffffff" stroke-width="4"/>
            <g stroke="#ffffff" stroke-width="6" stroke-linecap="round">
                <line x1="322" y1="312" x2="358" y2="348"/>
                <line x1="358" y1="312" x2="322" y2="348"/>
            </g>
            <text x="340" y="430" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#2c2c2c" text-anchor="middle">NO IMAGE</text>
            <text x="340" y="466" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#2c2c2c" text-anchor="middle">UPLOADED</text>
        </svg>
    `)}`;
    const getOptimizedUrl = (url, width) => {
        if (!url || !url.includes('/upload/')) return url;
        return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
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

    // ── 2. About guide toggle ──────────────────────────────────
    const navAbout = document.getElementById('nav-about');
    if (navAbout) {
        navAbout.addEventListener('click', () => {
            document.getElementById('fun-guide').classList.toggle('show');
        });
    }

    // ── 3. Load Items & Stats ──────────────────────────────────
    const loadItems = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            allItems = data.items; // store for My Reports modals
            itemsGrid.innerHTML = '';

            if (data.items.length === 0) {
                itemsGrid.innerHTML = `
                    <p style="color:var(--ink-muted);font-size:.9rem;grid-column:1/-1;padding:20px 0;">
                        No items yet — be the first to post!
                    </p>`;
            }

            data.items.forEach(item => {
                const card = document.createElement('div');
                card.className = `item-card ${item.itemType}`;
                card.innerHTML = `
                    <div class="item-image-wrap" style="background-image:url('${getOptimizedUrl(item.imageUrl, 30)}')">
                        <img src="${item.imageUrl ? getOptimizedUrl(item.imageUrl, 500) : FALLBACK_IMAGE}" class="item-image" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
                    </div>
                    <h4>${item.itemName}</h4>
                    <p>📍 ${item.location || 'Location not specified'}</p>
                    <p class="card-desc">${item.description || 'No description provided.'}</p>
                    <p style="font-size:.8rem;color:var(--blue);">📞 ${item.contactInfo}</p>
                    <button class="resolve-btn" data-id="${item._id}">✅ Resolved</button>
                `;
                itemsGrid.appendChild(card);
            });

            document.getElementById('total-lost').innerText =
                data.items.filter(i => i.itemType === 'lost').length;
            document.getElementById('total-found').innerText =
                data.items.filter(i => i.itemType === 'found').length;
            document.getElementById('total-recovered').innerText =
                data.resolvedCount;

        } catch (err) {
            console.error("Load error:", err);
            itemsGrid.innerHTML = `
                <p style="color:#EF4444;font-size:.9rem;grid-column:1/-1;padding:20px 0;">
                    ⚠️ Could not connect to server. Make sure the backend is running.
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
        // NOTE: currently shows all items of this type. Once login is wired in,
        // filter allItems here by the logged-in user's email/id before rendering.
        const filtered = allItems.filter(i => i.itemType === type);
        modalTitle.textContent = type === 'lost' ? '🔴 My Lost Reports' : '🟢 My Found Reports';

        modalGrid.innerHTML = filtered.length === 0
            ? `<p style="color:var(--ink-muted);grid-column:1/-1;padding:20px 0;">No ${type} reports yet.</p>`
            : filtered.map(item => `
                <div class="item-card ${item.itemType}">
                    <div class="item-image-wrap" style="background-image:url('${getOptimizedUrl(item.imageUrl, 30)}')">
                        <img src="${getOptimizedUrl(item.imageUrl, 500)}" class="item-image" loading="lazy" onerror="this.src='https://placehold.co/400x200?text=MITS+Item'">
                    </div>
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

    reportsFab.addEventListener('click', () => {
        reportsPanel.classList.toggle('hidden');
        reportsFab.classList.toggle('active');
    });

    panelClose.addEventListener('click', () => {
        reportsPanel.classList.add('hidden');
        reportsFab.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (!reportsPanel.contains(e.target) && e.target !== reportsFab) {
            reportsPanel.classList.add('hidden');
            reportsFab.classList.remove('active');
        }
    });
    document.getElementById('dropdown-my-reports').addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        reportsPanel.classList.remove('hidden');
        reportsFab.classList.add('active');
    });
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
            alert('Camera access denied or unavailable: ' + err.message);
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

     captureBtn.addEventListener('click', () => {
        const maxDim = 1280;
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
        }, 'image/jpeg', 0.9);
    });

    retakeBtn.addEventListener('click', async () => {
        capturedImageBlob = null;
        capturedPreview.style.display = 'none';
        await startCamera();
    });

    // ── 5. Post New Item ───────────────────────────────────────
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('itemName',    document.getElementById('itemName').value);
        formData.append('itemType',    document.getElementById('itemType').value);
        formData.append('contactInfo', document.getElementById('contactInfo').value);
        formData.append('location',    document.getElementById('itemLocation').value);
        formData.append('description', document.getElementById('itemDescription').value);

        // Prefer the camera capture if one exists, otherwise fall back to file upload
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
                loadItems();
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Server rejected item:", errData);
                alert("Server error: " + (errData.error || res.status));
            }
        } catch (err) {
            console.error("Post error:", err);
            alert("Could not post item. Is the server running?");
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
        if (confirm("Mark this item as found / returned?")) {
            try {
                const res = await fetch(`${API_URL}/resolve/${id}`, { method: 'PUT' });
                if (res.ok) loadItems();
            } catch (err) {
                console.error("Resolve error:", err);
            }
        }
    });

    // ── Init ───────────────────────────────────────────────────
    loadItems();
});
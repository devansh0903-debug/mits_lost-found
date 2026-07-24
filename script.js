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

    const API_URL = 'https://mits-lost-found.onrender.com/api/items';

    const getSmartThumbnail = (url) => {
        if (!url || !url.includes('/upload/')) return url;
        return url.replace(
            '/upload/',
            '/upload/w_400,h_220,c_fill,e_blur:2000/w_400,h_220,c_fit,fl_layer_apply,g_center/'
        );
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
                    <div class="item-image-wrap" style="background-image:url('${item.imageUrl}')">
                        <img src="${item.imageUrl}" class="item-image" onerror="this.src='https://placehold.co/400x200?text=MITS+Item'">
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
        cameraCanvas.width = cameraVideo.videoWidth;
        cameraCanvas.height = cameraVideo.videoHeight;
        cameraCanvas.getContext('2d').drawImage(cameraVideo, 0, 0);

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
        if (res.ok)  {
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


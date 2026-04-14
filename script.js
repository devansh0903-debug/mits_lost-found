// <<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {

    // ── Selectors ──────────────────────────────────────────────
    const itemForm        = document.getElementById('item-form');
    const itemsGrid       = document.getElementById('itemsGrid');
    const itemImageInput  = document.getElementById('itemImage');
    const imagePreview    = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    const API_URL = 'http://localhost:5000/api/items';

    // ── 1. Scroll Reveal ───────────────────────────────────────
    // Immediately make all .reveal elements visible on load too,
    // in case they're already in the viewport.
    const revealEls = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.05 }); // 0.05 = fires as soon as 5% is visible

    revealEls.forEach(el => revealObserver.observe(el));

    // ── 2. About guide toggle (nav "About" click) ──────────────
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
                    <img src="${item.imageUrl}" class="item-image" onerror="this.src='https://placehold.co/400x200?text=MITS+Item'">
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

    // ── 4. Resolve Item ────────────────────────────────────────
    window.resolveItem = async (id) => {
        if (confirm("Mark this item as found / returned?")) {
            try {
                const res = await fetch(`${API_URL}/resolve/${id}`, { method: 'PUT' });
                if (res.ok) loadItems();
            } catch (err) {
                console.error("Resolve error:", err);
            }
        }
    };

    // ── 5. Post New Item ───────────────────────────────────────
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('itemName',    document.getElementById('itemName').value);
        formData.append('itemType',    document.getElementById('itemType').value);
        formData.append('contactInfo', document.getElementById('contactInfo').value);
        formData.append('location',    document.getElementById('itemLocation').value);
        formData.append('description', document.getElementById('itemDescription').value);
        if (itemImageInput.files[0]) formData.append('itemImage', itemImageInput.files[0]);

        try {
            const res = await fetch(API_URL, { method: 'POST', body: formData });
            if (res.ok) {
                itemForm.reset();
                imagePreview.classList.add('hidden');
                uploadPlaceholder.classList.remove('hidden');
                loadItems();
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
document.addEventListener('DOMContentLoaded', () => {

    // ── Selectors ──────────────────────────────────────────────
    const itemForm        = document.getElementById('item-form');
    const itemsGrid       = document.getElementById('itemsGrid');
    const itemImageInput  = document.getElementById('itemImage');
    const imagePreview    = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    const API_URL = 'https://mits-lost-found.onrender.com/api/items';

    // ── 1. Scroll Reveal ───────────────────────────────────────
    // Immediately make all .reveal elements visible on load too,
    // in case they're already in the viewport.
    const revealEls = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.05 }); // 0.05 = fires as soon as 5% is visible

    revealEls.forEach(el => revealObserver.observe(el));

    // ── 2. About guide toggle (nav "About" click) ──────────────
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
                    <img src="${item.imageUrl}" class="item-image" onerror="this.src='https://placehold.co/400x200?text=MITS+Item'">
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

    // ── 4. Resolve Item ────────────────────────────────────────
    window.resolveItem = async (id) => {
        if (confirm("Mark this item as found / returned?")) {
            try {
                const res = await fetch(`${API_URL}/resolve/${id}`, { method: 'PUT' });
                if (res.ok) loadItems();
            } catch (err) {
                console.error("Resolve error:", err);
            }
        }
    };

    // ── 5. Post New Item ───────────────────────────────────────
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('itemName',    document.getElementById('itemName').value);
        formData.append('itemType',    document.getElementById('itemType').value);
        formData.append('contactInfo', document.getElementById('contactInfo').value);
        formData.append('location',    document.getElementById('itemLocation').value);
        formData.append('description', document.getElementById('itemDescription').value);
        if (itemImageInput.files[0]) formData.append('itemImage', itemImageInput.files[0]);

        try {
            const res = await fetch(API_URL, { method: 'POST', body: formData });
            if (res.ok) {
                itemForm.reset();
                imagePreview.classList.add('hidden');
                uploadPlaceholder.classList.remove('hidden');
                loadItems();
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
// 262e65181a8413894136d444d764d5a56fb8ee9a

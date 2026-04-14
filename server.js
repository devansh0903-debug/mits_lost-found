const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const Item = require('./models/Item');
const app = express();

// --- 1. MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());

// --- 2. CLOUDINARY CONFIG ---
cloudinary.config({
  cloud_name: process.env.CLD_NAME,
  api_key: process.env.CLD_API_KEY,
  api_secret: process.env.CLD_API_SECRET
});

// --- 3. CLOUD STORAGE SETUP ---
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mits_lost_found',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});

const upload = multer({ storage: cloudStorage });

// --- 4. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MITS Database Connected!"))
  .catch(err => console.log("❌ DB Connection Error:", err.message));

// --- 5. ROUTES ---

// Health Check
app.get('/', (req, res) => res.send('🚀 MITS Server is Flying!'));

// POST: Upload item
app.post('/api/items', upload.single('itemImage'), async (req, res) => {
    try {
        const newItem = new Item({
            ...req.body,
            imageUrl: req.file ? req.file.path : "https://placehold.co/400x200?text=MITS+Item"
        });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// GET: Fetch items
app.get('/api/items', async (req, res) => {
    try {
        const activeItems = await Item.find({ status: 'active' }).sort({ createdAt: -1 });
        const resolvedCount = await Item.countDocuments({ status: 'resolved' });
        res.json({ items: activeItems, resolvedCount });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// PUT: Resolve item
app.put('/api/items/resolve/:id', async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, { status: 'resolved' });
        res.json({ message: "Item marked as resolved!" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- 6. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on Port ${PORT}`));
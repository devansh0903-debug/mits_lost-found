const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const Item = require('./models/Item');
const app = express();

app.use(cors({ origin: 'http://127.0.0.1:5500' }));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true); 
        } else {
            cb(new Error('Error: Only Images (JPG, PNG, etc.) are allowed!')); // ❌ Reject
        }
    }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MITS Database Connected!"))
  .catch(err => console.log("❌ Still failing:", err.message));

app.post('/api/items', upload.single('itemImage'), async (req, res) => {
    try {
        const newItem = new Item({
            ...req.body,
            imageUrl: req.file
                ? `${process.env.BASE_URL}/uploads/${req.file.filename}`
                : "https://placehold.co/400x200?text=MITS+Item"
        });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/items', async (req, res) => {
    try {
        const activeItems = await Item.find({ status: 'active' }).sort({ createdAt: -1 });
        const resolvedCount = await Item.countDocuments({ status: 'resolved' });
        res.json({ items: activeItems, resolvedCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/items/resolve/:id', async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, { status: 'resolved' });
        res.json({ message: "Item marked as resolved!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(5000, () => console.log("🚀 Server running on Port 5000"));

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    itemType: { type: String, enum: ['lost', 'found'], required: true },
    location: { type: String, required: true },
    description: { type: String },
    contactInfo: { type: String, required: true },
    imageUrl: { type: String, default: 'https://placehold.co/400x200?text=MITS+Item' },
    status: { type: String, default: 'active' }, // 'active' or 'resolved'
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
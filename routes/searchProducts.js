const express = require('express');
const router = express.Router();
const Product = require('../models/products'); 
const auth = require('../middlewares/auth');

router.get('/api/products/search', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');  // Prevent caching
    const query = req.query.query;
    try {
        const products = await Product.find({ name: { $regex: query, $options: 'i' } });
        res.json(products || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});



module.exports = router;

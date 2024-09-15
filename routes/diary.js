const express = require('express');
const router = express.Router();
const Diary = require('../models/diary');
const Product = require('../models/products');
const auth = require('../middlewares/auth');  
const { startOfDay, endOfDay } = require('date-fns');

router.post('/consumed', auth, async (req, res) => {
    try {
        const { productId, product_weight } = req.body;
        const userId = req.user._id;

        if (!productId || !product_weight) {
            return res.status(400).json({ message: "Product ID and weight are required" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const product_Calories = (product.calories * product_weight) / 100;
        let diaryEntry = await Diary.findOne({ userId });

        if (!diaryEntry) {
            diaryEntry = new Diary({ userId, entries: [] });
        }
        const today = new Date().toDateString();
        const entryIndex = diaryEntry.entries.findIndex(entry => 
            entry.productId.toString() === productId.toString() &&
            new Date(entry.date).toDateString() === today
        );

        if (entryIndex > -1) {
            diaryEntry.entries[entryIndex] = {
                productId,
                product_weight,
                product_Calories,
                date: new Date()
            };
        } else {
            diaryEntry.entries.push({
                productId,
                product_weight,
                product_Calories,
                date: new Date()
            });
        }
        await diaryEntry.save();

        return res.status(201).json({
            message: "Consumed product added/updated successfully",
            diaryEntry
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error adding/updating consumed product" });
    }
});

router.delete('/remove/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const diaryEntry = await Diary.findOne({ userId });

        if (!diaryEntry) {
            return res.status(404).json({ message: "Diary not found!" });
        }

        const entryIndex = diaryEntry.entries.findIndex(entry => 
            entry.productId.toString() === productId.toString() &&
            new Date(entry.date).toDateString() === new Date().toDateString()
        );

        if (entryIndex === -1) {
            const product = await Product.findById(productId);
            const productTitle = product ? product.title : 'unknown product';
            
            return res.status(404).json({ message: `Product ${productTitle} not found in diary!` });
        }

        diaryEntry.entries.splice(entryIndex, 1);
        await diaryEntry.save();

        return res.status(200).json({ message: "Consumed product removed successfully!" });

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ error: 'Failed to delete product!' });
    }
});

router.get('/consumed/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user._id;

        const startDate = startOfDay(new Date(date));
        const endDate = endOfDay(new Date(date));

        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);

        const diaryEntries = await Diary.findOne({
            userId,
            'entries.date': {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('entries.productId');

        if (!diaryEntries) {
            return res.status(404).json({ message: "No diary entry found for this date." });
        }

        return res.status(200).json({
            date,
            consumedProducts: diaryEntries.entries
        });
    } catch (error) {
        console.error("Error fetching consumed products:", error);
        return res.status(500).json({ message: "Error fetching consumed products" });
    }
});


module.exports = router;
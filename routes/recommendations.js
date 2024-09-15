const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const Calculator = require('../models/calculator');
const color = require('colors');
const auth = require('../middlewares/auth');

function getBloodTypeIndex(bloodType) {
    const bloodTypes = ['0(I)', 'A(II)', 'B(III)', 'AB(IV)'];
    return bloodTypes.indexOf(bloodType);
};

router.post('/public-recommendations', async (req, res, next) => {
    try {
        const { height, age, current_weight, desired_weight, blood_type } = req.body;

        if (!height || !age || !current_weight || !desired_weight || !blood_type) {
            return res.status(400).json({ message: "All fields are required!".red });
        }

        const bloodTypeIndex = getBloodTypeIndex(blood_type);
        if (bloodTypeIndex === -1) {
            return res.status(400).json({ message: "Invalid blood type!".red });
        }

        const products = await Product.find({});

        let forbiddenProducts = products.filter(product => product.groupBloodNotAllowed[bloodTypeIndex] === true);
        forbiddenProducts = forbiddenProducts.slice(0, 4);
        forbiddenProducts.sort((a, b) => a.title.localeCompare(b.title));

        const length = forbiddenProducts.length
        
        const dailyCalories = 2800;

        return res.status(200).json({
            dailyCalories,
            forbiddenProducts,
            length
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while fetching recommendations.".red });
    }
});

router.post('/private-recommendations', auth, async (req, res) => {
    try {
        const { height, age, current_weight, desired_weight, blood_type } = req.body;
        const userId = req.user._id;

        if (!height || !age || !current_weight || !desired_weight || !blood_type) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const bloodTypeIndex = getBloodTypeIndex(blood_type);
        if (bloodTypeIndex === -1) {
            return res.status(400).json({ message: "Invalid blood type!" });
        }

        const existingData = await Calculator.findOne({ userId });

        if (existingData) {
            existingData.data = [{
                height,
                age,
                current_weight,
                desired_weight,
                blood_type
            }];
            await existingData.save();
        } else {
            const newCalculatorData = new Calculator({
                userId,
                data: [{
                    height,
                    age,
                    current_weight,
                    desired_weight,
                    blood_type
                }]
            });
            await newCalculatorData.save();
        }

        const products = await Product.find({});
        let forbiddenProducts = products.filter(product => product.groupBloodNotAllowed[bloodTypeIndex] === true);
        forbiddenProducts = forbiddenProducts.slice(0, 4);
        forbiddenProducts.sort((a, b) => a.title.localeCompare(b.title));

        const length = forbiddenProducts.length
        const dailyCalories = 2800; 

        return res.status(200).json({
            dailyCalories,
            forbiddenProducts,
            length
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while processing your request." });
    }
});


module.exports = router;

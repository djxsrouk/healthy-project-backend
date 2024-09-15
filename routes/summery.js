const express = require('express');
const router = express.Router();
const Diary = require('../models/diary');
const Summary = require('../models/summery');
const auth = require('../middlewares/auth');  
const { startOfDay, endOfDay } = require('date-fns');

router.get('/summary/:date', auth, async (req, res, next) => {
    try {
        const { date } = req.params;
        const userId = req.user._id;

        const startDate = startOfDay(new Date(date));
        const endDate = endOfDay(new Date(date));

        console.log("Start date:", startDate);
        console.log("End date:", endDate);

        const diaryEntry = await Diary.findOne({
            userId,
            'entries.date': {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('entries.productId');

        console.log(diaryEntry);

        if (!diaryEntry) {
            return res.status(404).json({ message: "No diary entry found for this date." });
        }

        const totalConsumed = diaryEntry.entries.reduce((accumulator, product) => accumulator + product.product_Calories, 0);
        const dailyRate = 2800;
        const dailyLeft = dailyRate - totalConsumed;
        const dailyPercentage = ((totalConsumed / dailyRate) * 100).toFixed(2);

        let summary = await Summary.findOne({ userId }).populate('summaryInfo.diaryId');

        if (!summary) {
            summary = new Summary({ userId, summaryInfo: [] });
        };
        
        const existingSummaryIndex = summary.summaryInfo.findIndex(index => index.diaryId.entries.some(entry =>
            new Date(entry.date).toDateString() === new Date(date).toDateString()
        )
        );

        if (existingSummaryIndex > -1) {
            summary.summaryInfo[existingSummaryIndex] = {
                diaryId: diaryEntry._id,
                daily_left: dailyLeft,
                daily_consumed: totalConsumed,
                daily_rate: dailyRate,
                percentage: dailyPercentage
            };
        } else {
            summary.summaryInfo.push({
                diaryId: diaryEntry._id,
                daily_left: dailyLeft,
                daily_consumed: totalConsumed,
                daily_rate: dailyRate,
                percentage: dailyPercentage
            });
        }

        await summary.save();

        return res.status(200).json({
            date,
            daily_left: dailyLeft,
            daily_consumed: totalConsumed,
            daily_rate: dailyRate,
            percentage: dailyPercentage
        });
    } catch (error) {
        console.error("Error calculating summary:", error);
        return res.status(500).json({ message: "Error calculating summary" });
    }
});

module.exports = router;
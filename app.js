const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const mongoose = require("mongoose");
require('./config/passport')(passport);


const app = express();
const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';
app.use(cors());
app.use(express.json());
app.use(morgan(formatsLogger));
app.use(passport.initialize());

const mongoDB = process.env.MONGO_URI;
mongoose.connect(mongoDB)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const authRouter = require('./routes/auth');
const recommendationRouter = require('./routes/recommendations');
const searchProductsRouter = require('./routes/searchProducts');
const diaryRouter = require('./routes/diary');
const summaryRouter = require('./routes/summery');


app.use('/api/auth', authRouter);
app.use('/api/products/recommendations', recommendationRouter);
app.use('/api/products/search', searchProductsRouter);
app.use('/api/products/diary', diaryRouter);
app.use('/api/products/summary', summaryRouter);

app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message });
});

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

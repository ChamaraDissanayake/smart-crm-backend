require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db.config');
const routes = require('./routes/index.route');
const errorHandler = require('./middleware/error');
const path = require('path');

const app = express();

app.set('trust proxy', 1);

app.get("/test", (req, res) => {
    res.send("Chamara CRM API working");
});

// Initialize database
initDB().then(() => {
    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Routes
    app.use('/api', routes);

    // Error handling
    app.use(errorHandler);

    // View images
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // const {
    //     getWhatsAppBusinessAccounts,
    //     getWhatsAppAccountNumber
    // } = require('./services/integration.service');

    // Hardcoded test call
    // (async () => {
    //     try {
    //         const testToken = 'EAAHwWOrf1fMBOyXZBD20dQ2W9KU1NRuMAumXJvG0efccwzc7Tp8OHo5i4JYjkK1lfH6pjjNayIFTboS3VSgZCGdbRFkgZAxpgoDlLRYLpxugrLxQhWioZAUHRIt8wZBoacihpQfA7RFn3HdwZAmF0QbI1FdsJLkIpTaT1p6X1XoUEoZCmyYj3hwnCG2AT78MnsiPw2Q0I7kXU9LNcK9SdDOQFQekDyHONZBrSdEkEpT6hra3Oqsi'; // Replace with actual token
    //         const testWabaId = '272322805975497'
    //         console.log('Testing getWhatsAppAccountNumber function...');
    //         const wa = await getWhatsAppAccountNumber(testWabaId, testToken);
    //         console.log('WhatsApp Business Accounts:', wa);
    //     } catch (error) {
    //         console.error('Test failed:', error);
    //     }
    // })();
    // (async () => {
    //     try {
    //         const testToken = 'EAAHwWOrf1fMBOyXZBD20dQ2W9KU1NRuMAumXJvG0efccwzc7Tp8OHo5i4JYjkK1lfH6pjjNayIFTboS3VSgZCGdbRFkgZAxpgoDlLRYLpxugrLxQhWioZAUHRIt8wZBoacihpQfA7RFn3HdwZAmF0QbI1FdsJLkIpTaT1p6X1XoUEoZCmyYj3hwnCG2AT78MnsiPw2Q0I7kXU9LNcK9SdDOQFQekDyHONZBrSdEkEpT6hra3Oqsi'; // Replace with actual token
    //         console.log('Testing WhatsApp Business Accounts function...');
    //         const wa = await getWhatsAppBusinessAccounts(testToken);
    //         console.log('WhatsApp Business Accounts:', wa);
    //     } catch (error) {
    //         console.error('Test failed:', error);
    //     }
    // })();

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
    console.error("❌ Database connection failed:", err);
});

module.exports = app;
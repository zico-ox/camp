// server.js
const express = require('express');
const fetch = require('node-fetch'); // Required for making HTTP requests
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port, default to 3000

// --- Configuration ---
// Make sure these match the tokens Hiqmobi actually sends AND your URL parameter names
const CLICK_ID_TOKEN_NAME = 'click_id';
const USER_UPI_TOKEN_NAME = 'user_upi';
const OFFER_SUB_ID_TOKEN_NAME = 'offer_sub_id';
const CAMPAIGN_ID_TOKEN_NAME = 'camp_id';
const SECRET_KEY = 'YOUR_SUPER_SECRET_KEY'; // REPLACE THIS WITH A REAL, STRONG KEY

// Your Firebase Realtime Database endpoint
const FIREBASE_URL = "https://camp-02-default-rtdb.firebaseio.com/conversions";

// Middleware to parse URL-encoded bodies (for GET parameters)
app.use(express.urlencoded({ extended: true }));

// Define the postback endpoint
app.get('/postback.php', async (req, res) => {
    // --- Get values from query parameters ---
    const clickId = req.query[CLICK_ID_TOKEN_NAME] || null;
    const userUpi = req.query[USER_UPI_TOKEN_NAME] || null;
    const offerSubId = req.query[OFFER_SUB_ID_TOKEN_NAME] || null;
    const campaignId = req.query[CAMPAIGN_ID_TOKEN_NAME] || null;
    const receivedSecret = req.query.secret || null;

    // --- Validation ---
    if (!clickId) {
        console.log('❌ Missing click ID');
        return res.status(400).send('❌ Missing click ID');
    }

    // Basic security check: Validate the secret key
    if (receivedSecret !== SECRET_KEY) {
        console.log(`Security Alert: Invalid secret key received for click ID: ${clickId}`);
        return res.status(403).send('❌ Invalid secret key');
    }

    // Prepare data to send to Firebase
    const conversionData = {
        clickId: clickId,
        userUpi: userUpi,
        offerSubId: offerSubId,
        campaignId: campaignId,
        timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        raw_query: req.originalUrl // Good for debugging what Hiqmobi sent
    };

    // Construct the Firebase URL for the specific clickId
    // This will create a node like /conversions/YOUR_CLICK_ID
    const fullFirebaseUrl = `${FIREBASE_URL}/${encodeURIComponent(clickId)}.json`;

    try {
        // Send to Firebase using fetch (PUT request)
        const firebaseResponse = await fetch(fullFirebaseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conversionData)
        });

        // Check Firebase's response
        if (firebaseResponse.ok) { // Check if HTTP status is 2xx
            console.log(`✅ Postback saved for click ID: ${clickId}`);
            res.status(200).send(`✅ Postback saved for click ID: ${clickId}`);
        } else {
            const errorText = await firebaseResponse.text();
            console.error(`Firebase Error: Postback failed for click ID: ${clickId}. ` +
                          `Firebase HTTP status: ${firebaseResponse.status}. Response: ${errorText}`);
            res.status(500).send(`❌ Failed to send postback to Firebase. Firebase responded with HTTP status ${firebaseResponse.status}.`);
        }

    } catch (error) {
        console.error(`Network Error: Failed to send postback to Firebase for click ID: ${clickId}. Error:`, error);
        res.status(500).send('❌ Failed to send postback to Firebase (Network/Connection issue)');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Node.js Postback server listening at http://localhost:${port}`);
    console.log(`Waiting for postbacks on /postback.php`);
});

// server.js
const express = require('express');
const fetch = require('node-fetch'); // Make sure to install: npm install node-fetch
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port, default to 3000 for local testing

// --- Configuration ---
// IMPORTANT: Replace 'YOUR_SUPER_SECRET_KEY' with a strong, unique secret key.
// This key MUST match the 'secret' parameter in your Hiqmobi postback URL and your test HTML form.
const SECRET_KEY = 'YOUR_SUPER_SECRET_KEY_CHOOSE_ONE_NOW';

// Your Firebase Realtime Database endpoint. Ensure this is correct for your project.
// The data will be stored under /conversions/YOUR_CLICK_ID
const FIREBASE_BASE_URL = "https://camp-02-default-rtdb.firebaseio.com/conversions";

// --- Middleware ---
// Parse URL-encoded bodies (for GET parameters, as Hiqmobi often sends data this way in postbacks)
app.use(express.urlencoded({ extended: true }));

// --- Postback Endpoint ---
// We're using a GET route because Hiqmobi typically sends data as GET parameters in a POST request,
// and your PHP example was set up to read $_GET. Node.js with Express can read query params from any method.
// Using '/postback.php' route to match your previous setup for consistency.
app.get('/postback.php', async (req, res) => {
    // Log the full incoming request URL for debugging
    console.log(`[${new Date().toISOString()}] Incoming Postback URL: ${req.originalUrl}`);

    // --- Get values from query parameters ---
    // These names (e.g., 'click_id', 'user_upi') MUST match what you send in the URL from Hiqmobi/Test Form.
    const clickId = req.query.click_id || null;
    const userUpi = req.query.user_upi || null;
    const offerSubId = req.query.offer_sub_id || null;
    const campaignId = req.query.camp_id || null; // Using 'camp_id' to align with common Hiqmobi token name
    const receivedSecret = req.query.secret || null;

    // --- Validation ---
    if (!clickId) {
        console.error(`[${new Date().toISOString()}] ❌ Error: Missing click ID in postback. Query: ${req.originalUrl}`);
        return res.status(400).send('❌ Missing click ID');
    }

    // Basic security check: Validate the secret key
    if (receivedSecret !== SECRET_KEY) {
        console.error(`[${new Date().toISOString()}] Security Alert: Invalid secret key received for click ID: ${clickId}. ` +
                      `Received: "${receivedSecret}", Expected: "${SECRET_KEY}". Full query: ${req.originalUrl}`);
        return res.status(403).send('❌ Invalid secret key');
    }

    // Prepare data to send to Firebase
    const conversionData = {
        clickId: clickId,
        userUpi: userUpi,
        offerSubId: offerSubId,
        campaignId: campaignId,
        timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        receivedAt: new Date().toISOString(), // ISO 8601 string for human readability
        rawQuery: req.originalUrl // Good for debugging the exact query Hiqmobi sent
    };

    // Construct the full Firebase Realtime Database URL for this specific conversion
    // e.g., https://camp-02-default-rtdb.firebaseio.com/conversions/YOUR_CLICK_ID.json
    const fullFirebaseUrl = `${FIREBASE_BASE_URL}/${encodeURIComponent(clickId)}.json`;

    try {
        // Send data to Firebase using fetch (HTTP PUT request)
        const firebaseResponse = await fetch(fullFirebaseUrl, {
            method: 'PUT', // PUT method creates or overwrites data at the specified path
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conversionData) // Convert JavaScript object to JSON string
        });

        // Check Firebase's response status
        if (firebaseResponse.ok) { // firebaseResponse.ok checks if HTTP status is 2xx (e.g., 200 OK)
            console.log(`[${new Date().toISOString()}] ✅ Postback saved for click ID: ${clickId}`);
            res.status(200).send(`✅ Postback saved for click ID: ${clickId}`);
        } else {
            const errorText = await firebaseResponse.text(); // Get the error message from Firebase
            console.error(`[${new Date().toISOString()}] Firebase Error for click ID: ${clickId}. ` +
                          `Firebase HTTP status: ${firebaseResponse.status}. Response: ${errorText}`);
            res.status(500).send(`❌ Failed to send postback to Firebase. Firebase responded with HTTP status ${firebaseResponse.status}.`);
        }

    } catch (error) {
        // Catch network errors or other exceptions during the fetch operation
        console.error(`[${new Date().toISOString()}] Network/Fetch Error for click ID: ${clickId}. Error:`, error);
        res.status(500).send('❌ Failed to send postback to Firebase (Network/Connection issue)');
    }
});

// Basic route for health checks or welcome message (optional)
app.get('/', (req, res) => {
    res.status(200).send('Node.js Postback Server is running. Awaiting postbacks on /postback.php');
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Node.js Postback server listening at http://localhost:${port}`);
    console.log(`Running in current environment: ${process.env.NODE_ENV || 'development'}`);
});

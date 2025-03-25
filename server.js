// Import necessary packages
require('dotenv').config(); // Load .env variables
const express = require('express');
const { Resend } = require('resend');
const admin = require('firebase-admin');

// Initialize Express app
const app = express();

// Set up port binding, use the environment variable 'PORT' or default to 3000
const PORT = process.env.PORT || 3000;

// Firebase service account credentials (use the code you've already implemented)

// Construct the service account JSON object from environment variables
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Correctly format the private key
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com",
};



// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

// Initialize Resend service with API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

// Firestore reference
const db = admin.firestore();

// Listen for new documents in the 'bookings' collection with error handling
db.collection('bookings').onSnapshot(
    async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const newBooking = change.doc.data();
                const userEmail = newBooking.userEmail; // Assuming userEmail is a field in the document

                try {
                    // Send email to the user
                    const { data, error } = await resend.emails.send({
                        from: 'Acme <onboarding@resend.dev>',
                        to: [userEmail],
                        subject: 'Booking Confirmation',
                        html: `<strong>Your booking has been confirmed!</strong><br/>Details: ${JSON.stringify(newBooking)}`,
                    });

                    if (error) {
                        console.error('Error sending email:', error);
                    } else {
                        console.log('Email sent:', data);
                    }
                } catch (error) {
                    console.error('Error sending email:', error);
                }
            }
        });
    },
    (error) => {
        // Log any errors in the snapshot listener
        console.error('Error in Firestore snapshot listener:', error);
        // You might want to add retry logic or exponential backoff here
    }
);


// A simple route for the API
app.get('/', (req, res) => {
    res.send('Welcome to Fusshn Server');
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

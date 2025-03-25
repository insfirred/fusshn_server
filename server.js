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
                const userEmail = newBooking.userEmail;
                const userName = newBooking.userName;
                const eventName = newBooking.userEmail;
                const eventDate = newBooking.createdAt;
                const eventVenue = newBooking.userEmail;
                const bookingId = newBooking.id;

                const totalUserAllowed = newBooking.totalUserAllowed;
                const amountPerTicket = newBooking.ticketType.price;
                const totalAmount = amountPerTicket * totalUserAllowed;


                try {
                    // Send email to the user
                    const { data, error } = await resend.emails.send({
                        from: 'Fusshn <tickets@fusshn.in>',
                        to: [userEmail],
                        subject: 'Booking Confirmation',
                        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <!-- Importing Poppins font from Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #333;
            color: #fff;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #444;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #555;
        }
        .email-header h1 {
            color: rgb(48, 185, 77); /* Fusshn primary color */
            margin: 0;
            font-size: 24px; /* Reduced font size for the heading */
        }
        .email-header p {
            font-size: 14px;
            color: #bbb;
        }
        .email-body {
            padding: 20px;
        }
        .email-body h2 {
            color: #fff;
        }
        .event-details {
            margin: 20px 0;
        }
        .event-details p {
            font-size: 16px;
            color: #ccc;
        }
        .confirmation-code {
            font-size: 18px;
            font-weight: bold;
            color: rgb(48, 185, 77); /* Fusshn primary color */
        }
        .email-body p {
            color: #ddd; /* Light grey for the general text */
        }
        .cta-button {
            display: inline-block;
            background-color: rgb(48, 185, 77); /* Fusshn primary color */
            color: white;
            padding: 10px 20px;
            font-size: 16px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
        }
        .cta-button:hover {
            background-color: #3b9e63; /* Slightly darker shade for hover effect */
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #bbb;
        }
        .footer .company-name {
            font-weight: bold;
            color: rgb(48, 185, 77); /* Fusshn primary color */
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Hey ${userName}, Your Booking is Confirmed!</h1>
            <p>Thank you for booking with Fusshn!</p>
        </div>
        <div class="email-body">
            <h2>Booking Details</h2>
            <div class="event-details">
                <p><strong>Event:</strong> <event name here></p>
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Venue:</strong> <event address here></p>
            </div>

            <p><strong>Your Confirmation Code:</strong> <span class="confirmation-code">${bookingId}}</span></p>
            <p><strong>Total Amount Paid:</strong> ₹${totalAmount}</p>

            <p>If you have any questions, feel free to reach out to our support team.</p>

            <a href="[Event URL]" class="cta-button">View Event Details</a>
        </div>
        <div class="footer">
            <p>For more information, visit our website: <a href="https://fusshn.in" class="company-name">http://fusshn.in</a></p>
            <p>You're receiving this email because you booked a ticket with <span class="company-name">Fusshn</span>.</p>
        </div>
    </div>
</body>
</html>

                        `,
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

// ─────────────────────────────────────────────
// PRICE TRACKER WITH EMAIL ALERTS (GitHub Actions-ready)
// ─────────────────────────────────────────────

// Load environment variables from a .env file locally.
// GitHub Actions will also provide these variables securely from repository secrets.
// This ensures sensitive data like email credentials are NOT committed to GitHub.
import dotenv from "dotenv";
dotenv.config();

import { chromium } from "playwright"; // Playwright library for automating browser actions
import { products } from "./src/products"; // Your list of products to track
import fs from "fs"; // Node.js module for reading/writing files
import path from "path"; // Node.js module for handling file paths
import nodemailer from "nodemailer"; // Node.js library to send emails via SMTP

// ─────────────────────────────────────────────
// PRICE HISTORY SETUP
// ─────────────────────────────────────────────

// Define the file where we will store historical price data
const historyFile = path.resolve("./logs/price-history.json");

// Function to load existing price history from file
function loadPriceHistory() {
  // If the file doesn't exist yet, create an empty JSON object
  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, JSON.stringify({}, null, 2));
  }
  // Read the file contents as a string
  const fileData = fs.readFileSync(historyFile, "utf8");
  // Parse the JSON string into a JavaScript object
  return JSON.parse(fileData);
}

// Function to save updated price history to file
function savePriceHistory(history: any) {
  // Convert the object to a formatted JSON string and write it to the file
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Function to log a single price entry for a specific product
function logPrice(productName: string, price: string) {
  // Load the current history
  const history = loadPriceHistory();

  // If this is the first time we log this product, initialize an array
  if (!history[productName]) {
    history[productName] = [];
  }

  // Add a new entry with timestamp and price
  history[productName].push({
    timestamp: new Date().toISOString(), // Current date and time in ISO format
    price: price, // Price as a string (e.g., "499.99")
  });

  // Save the updated history back to file
  savePriceHistory(history);
}

// ─────────────────────────────────────────────
// EMAIL ALERT SETUP
// ─────────────────────────────────────────────

// Configure Nodemailer to send emails via Gmail using environment variables
// This keeps your email credentials safe and out of the code.
const transporter = nodemailer.createTransport({
  service: "gmail", // Gmail SMTP service
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address (from .env or GitHub secrets)
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// Function to send an email alert when a price drops below the target
async function sendPriceAlert(
  productName: string, // Name of the product
  price: number,       // Current price of the product
  targetPrice: number  // Target price for alert
) {
  // Define email contents
  const mailOptions = {
    from: process.env.EMAIL_USER,  // Sender email
    to: process.env.EMAIL_TO,      // Recipient email (can be the same as sender)
    subject: `🔥 Price Alert: ${productName}`, // Email subject line
    text: `${productName} is now £${price}, which is BELOW your target price of £${targetPrice}!`, // Email body
  };

  try {
    // Send the email using Nodemailer
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent for ${productName}`);
  } catch (error) {
    // If sending fails, log an error to the console
    console.log(`❌ Failed to send email for ${productName}: ${error}`);
  }
}

// ─────────────────────────────────────────────
// MAIN PRICE CHECKER
// ─────────────────────────────────────────────

async function checkPrices() {
  // Launch a headless browser (doesn't open a visible window)
  const browser = await chromium.launch({ headless: true });

  // Create a new page (tab) in the browser
  const page = await browser.newPage();

  // Loop through every product in your products list
  for (const product of products) {
    console.log(`Checking price for: ${product.name}`);

    try {
      // Navigate to the product's Amazon URL
      // waitUntil: "domcontentloaded" waits until the HTML is loaded (ignores images/scripts)
      await page.goto(product.url, { waitUntil: "domcontentloaded" });

      // Wait for the price element to appear (max 10 seconds)
      await page.waitForSelector(product.selector, { timeout: 10000 });

      // Grab the "whole" and "fraction" parts of the price
      const whole = await page.textContent(".a-price-whole");   // e.g., "499"
      const fraction = await page.textContent(".a-price-fraction"); // e.g., "99"

      // Clean up the text: remove thousands separator dots and ensure fraction exists
      const wholeClean = (whole || "0").replace(/\./g, "");
      const fractionClean = fraction || "0";

      // Combine into a full decimal string (e.g., "499.99")
      const priceString: string = `${wholeClean}.${fractionClean}`;

      // Convert string to a number for comparison
      const priceNumber: number = parseFloat(priceString.replace(/,/g, ""));

      // Log the current price to the console
      console.log(` → Price: £${priceString}`);

      // Save this price in the history file
      logPrice(product.name, priceString);

      // Check if the price is below the target price
      if (product.targetPrice !== undefined && priceNumber <= product.targetPrice) {
        console.log(`🔥 ${product.name} dropped below target (£${product.targetPrice})!`);

        // Send email alert if below target
        await sendPriceAlert(product.name, priceNumber, product.targetPrice);
      }

    } catch (err) {
      // If anything fails (page not loading, selector not found, etc.)
      console.log(
        ` → Failed to read price for ${product.name} (selector may have changed).`
      );
    }
  }

  // Close the browser after all products are processed
  await browser.close();
}

// Run the price checker
checkPrices();

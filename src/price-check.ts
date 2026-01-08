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
 const browser = await chromium.launch({
  headless: true, // keep headless on GitHub
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1920,1080"
  ]
});


  // Create a new page (tab) in the browser
  const page = await browser.newPage();

  // Loop through every product in your products list
for (const product of products) {
  console.log(`Checking price for: ${product.name}`);

  try {
    // Load the product page
    await page.goto(product.url, { waitUntil: "domcontentloaded" });

    // ────────────── STEP 1: Save HTML & Screenshot ──────────────
    // Make sure the logs folder exists
    if (!fs.existsSync("logs")) fs.mkdirSync("logs");

    // Create a safe filename for the product
    const safeName = product.name.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

    // Save full HTML of the page
    const html = await page.content();
    fs.writeFileSync(path.join("logs", `${safeName}.html`), html);

    // Save a screenshot of the full page
    await page.screenshot({ path: path.join("logs", `${safeName}.png`), fullPage: true });
    // ─────────────────────────────────────────────────────────────

    // Wait for the price element to appear
    await page.waitForSelector(product.selector, { timeout: 10000 });

    // Extract Amazon "whole" and "fraction" parts
    const whole = await page.textContent(".a-price-whole");
    const fraction = await page.textContent(".a-price-fraction");

    // Clean up price text
    const wholeClean = (whole || "0").replace(/\./g, "");
    const fractionClean = fraction || "0";

    const priceString: string = `${wholeClean}.${fractionClean}`;
    const priceNumber: number = parseFloat(priceString.replace(/,/g, ""));

    console.log(` → Price: £${priceString}`);

    // Save to price history file
    logPrice(product.name, priceString);

    // Check against target price
    if (product.targetPrice !== undefined && priceNumber <= product.targetPrice) {
      console.log(`🔥 ${product.name} dropped below target (£${product.targetPrice})!`);
      await sendPriceAlert(product.name, priceNumber, product.targetPrice);
    }

  } catch (err) {
    console.log(` → Failed to read price for ${product.name} (selector may have changed).`);
  }
}



  // Close the browser after all products are processed
  await browser.close();
}

// Run the price checker
checkPrices();

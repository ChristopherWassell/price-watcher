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
  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, JSON.stringify({}, null, 2));
  }
  const fileData = fs.readFileSync(historyFile, "utf8");
  return JSON.parse(fileData);
}

// Function to save updated price history to file
function savePriceHistory(history: any) {
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Function to log a single price entry for a specific product
function logPrice(productName: string, price: string) {
  const history = loadPriceHistory();
  if (!history[productName]) {
    history[productName] = [];
  }
  history[productName].push({
    timestamp: new Date().toISOString(), // Current date and time in ISO format
    price: price, // Price as a string (e.g., "499.99")
  });
  savePriceHistory(history);
}

// ─────────────────────────────────────────────
// EMAIL ALERT SETUP
// ─────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: "gmail", // Gmail SMTP service
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// Function to send an email alert when a price drops below the target
async function sendPriceAlert(
  productName: string,
  price: number,
  targetPrice: number
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: `🔥 Price Alert: ${productName}`,
    text: `${productName} is now £${price}, which is BELOW your target price of £${targetPrice}!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent for ${productName}`);
  } catch (error) {
    console.log(`❌ Failed to send email for ${productName}: ${error}`);
  }
}

// ─────────────────────────────────────────────
// MAIN PRICE CHECKER
// ─────────────────────────────────────────────

async function checkPrices() {

  // ────────────── OPTION A: Human-like browser launch ──────────────
  // Launch the browser in headful mode to reduce bot detection
  // Headless: false for GitHub Actions is ok because it will run in cloud; Amazon sees it more like a real user
  const browser = await chromium.launch({
    headless: false, // Set to false for more human-like behavior
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,800", // realistic screen size
    ],
  });

  // Create a new browser context with realistic options (This is neccessary as Amazon will block the connection when using github to run the job)
  const context = await browser.newContext({
    // Mimic a real browser user agent to avoid detection
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-GB", // UK locale
    viewport: { width: 1280, height: 800 }, // realistic window size
  });

  // Create a new page in this human-like context
  const page = await context.newPage();

  // Loop through all products
  for (const product of products) {
    console.log(`Checking price for: ${product.name}`);

    try {
      // ────────────── LOAD PRODUCT PAGE ──────────────
      await page.goto(product.url, { waitUntil: "domcontentloaded" });

      // ────────────── STEP 1: Save HTML & Screenshot ──────────────
      if (!fs.existsSync("logs")) fs.mkdirSync("logs");
      const safeName = product.name.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      const html = await page.content();
      fs.writeFileSync(path.join("logs", `${safeName}.html`), html);
      await page.screenshot({ path: path.join("logs", `${safeName}.png`), fullPage: true });

      // ────────────── WAIT FOR PRICE ELEMENT ──────────────
      await page.waitForSelector(product.selector, { timeout: 10000 });

      // ────────────── EXTRACT PRICE ──────────────
      const whole = await page.textContent(".a-price-whole");
      const fraction = await page.textContent(".a-price-fraction");
      const wholeClean = (whole || "0").replace(/\./g, "");
      const fractionClean = fraction || "0";
      const priceString: string = `${wholeClean}.${fractionClean}`;
      const priceNumber: number = parseFloat(priceString.replace(/,/g, ""));
      console.log(` → Price: £${priceString}`);

      // ────────────── SAVE PRICE HISTORY ──────────────
      logPrice(product.name, priceString);

      // ────────────── CHECK TARGET PRICE & SEND EMAIL ──────────────
      if (product.targetPrice !== undefined && priceNumber <= product.targetPrice) {
        console.log(`🔥 ${product.name} dropped below target (£${product.targetPrice})!`);
        await sendPriceAlert(product.name, priceNumber, product.targetPrice);
      }

    } catch (err) {
      console.log(` → Failed to read price for ${product.name} (selector may have changed).`);
    }
  }

  // Close the browser after processing all products
  await browser.close();
}

// Run the price checker
checkPrices();


// Loads a list of products to track (from products.ts).

// Opens a browser in the background and navigates to each product page.

// Extracts the whole and fractional parts of the price from Amazon.

// Cleans and converts the price to a number.

// Saves the price and timestamp in a local JSON file (price-history.json).

// If the price is below a target, it logs a warning and sends an email alert.

// Runs asynchronously — browser operations and email sending do not block the program.

// `chromium` is imported from the Playwright library.
// Playwright allows us to automate a browser (like Chrome) to visit web pages, click buttons, and read content.
import { chromium } from "playwright";

// `products` is imported from a local file.
// It contains the list of products we want to track, along with URLs, selectors, and optional target prices.
import { products } from "./src/products";

// `fs` is the Node.js File System module.
// It allows us to read from and write to files on the computer, which we use to save price history.
import fs from "fs";

// `path` is the Node.js Path module.
// It helps create file paths that work across all operating systems.
import path from "path";

// `nodemailer` is a library to send emails from Node.js.
// We use it to send price alert notifications when a product drops below the target price.
import nodemailer from "nodemailer";

// `dotenv` is a library to load environment variables from a `.env` file.
// Environment variables are secret values like email addresses or passwords that we don't want to put directly in the code.
import dotenv from "dotenv";

// Load the environment variables from the `.env` file into process.env
// This makes them accessible in our code as process.env.VARIABLE_NAME
dotenv.config();




// ─────────────────────────────────────────────
// PRICE HISTORY SETUP
// ─────────────────────────────────────────────

// Define the file path where the price history JSON will be saved.
// `path.resolve` ensures the path works on all operating systems.
const historyFile = path.resolve("./logs/price-history.json");

// Function to load the existing price history from the JSON file
function loadPriceHistory() {
  // Check if the file exists
  if (!fs.existsSync(historyFile)) {
    // If it does not exist, create an empty JSON file with `{}` as content
    fs.writeFileSync(historyFile, JSON.stringify({}, null, 2));
  }

  // Read the contents of the JSON file as a string
  const fileData = fs.readFileSync(historyFile, "utf8");

  // Convert the JSON string into a JavaScript object and return it
  return JSON.parse(fileData);
}

// Function to save updated price history back to the JSON file
function savePriceHistory(history: any) {
  // Convert the JavaScript object into a JSON string and write it to the file
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Function to record a single product's price at a given time
function logPrice(productName: string, price: string) {
  // Load existing price history
  const history = loadPriceHistory();

  // If this is the first time this product appears, initialize an empty array for it
  if (!history[productName]) {
    history[productName] = [];
  }

  // Add a new entry for this product with the current timestamp and price
  history[productName].push({
    timestamp: new Date().toISOString(), // ISO formatted date-time string
    price: price // The price as a string, e.g., "499.99"
  });

  // Save the updated history back to the file
  savePriceHistory(history);
}




// ─────────────────────────────────────────────
// EMAIL ALERT SETUP
// ─────────────────────────────────────────────

// Create a transporter object for sending emails using Nodemailer
// This object knows which email service to use (Gmail in this case) and what credentials to authenticate with
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail's SMTP service
  auth: {
    user: process.env.EMAIL_USER, // Sender email, loaded from .env
    pass: process.env.EMAIL_PASS  // App password, loaded from .env
  }
});

// Function to send a price alert email
async function sendPriceAlert(productName: string, price: number, targetPrice: number) {
  // Define the email content
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender email address
    to: process.env.EMAIL_TO,     // Recipient email address
    subject: `🔥 Price Alert: ${productName}`, // Email subject line
    text: `${productName} is now £${price}, which is BELOW your target price of £${targetPrice}!` // Email body
  };

  // Try to send the email
  try {
    await transporter.sendMail(mailOptions); // Send the email asynchronously
    console.log(`✅ Email sent for ${productName}`); // Log success
  } catch (error) {
    console.log(`❌ Failed to send email for ${productName}: ${error}`); // Log failure
  }
}




// ─────────────────────────────────────────────
// MAIN PRICE CHECK FUNCTION
// ─────────────────────────────────────────────

// This function will go through each product, check its price, save history, and send alerts if needed
async function checkPrices() {
  // Launch a new browser instance in headless mode (no visible window)
  const browser = await chromium.launch({ headless: true });

  // Open a new tab/page in the browser
  const page = await browser.newPage();

  // Loop through each product in our `products` list
  for (const product of products) {
    console.log(`Checking price for: ${product.name}`);

    try {
      // Go to the product's URL
      await page.goto(product.url, { waitUntil: "domcontentloaded" });

      // Wait for the price element to appear in the page (timeout after 10 seconds)
      await page.waitForSelector(product.selector, { timeout: 10000 });

      // Read the "whole" part of the price (e.g., "499" in £499.99)
      const whole = await page.textContent(".a-price-whole");

      // Read the "fraction" part of the price (e.g., "99" in £499.99)
      const fraction = await page.textContent(".a-price-fraction");

      // Clean the "whole" part by removing any periods (thousands separator)
      const wholeClean = (whole || "0").replace(/\./g, "");

      // If fraction is missing, default to "0"
      const fractionClean = fraction || "0";

      // Combine whole and fraction parts into a single string representation of the price
      const priceString: string = `${wholeClean}.${fractionClean}`;

      // Convert the price string into a number for comparison
      const priceNumber: number = parseFloat(priceString.replace(/,/g, ""));

      console.log(` → Price: £${priceString}`);

      // Record this price in the history JSON
      logPrice(product.name, priceString);

      // If a target price is defined and the current price is lower than or equal to it
      if (
        product.targetPrice !== undefined &&
        priceNumber <= product.targetPrice
      ) {
        console.log(`🔥 ${product.name} dropped below target (£${product.targetPrice})!`);

        // Send an email alert
        await sendPriceAlert(product.name, priceNumber, product.targetPrice);
      }

    } catch (err) {
      // If anything goes wrong (page doesn't load, selector not found, etc.), log the failure
      console.log(` → Failed to read price for ${product.name} (selector may have changed).`);
    }
  }

  // Close the browser when all products are checked
  await browser.close();
}




// ─────────────────────────────────────────────
// START THE SCRIPT
// ─────────────────────────────────────────────

// Call the function to start checking prices
checkPrices();






import { chromium } from "playwright";
import { products } from "./src/products";

async function checkPrices() {
  // Launch the browser (set headless: false to see the browser for debugging)
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const product of products) {
    console.log(`Checking price for: ${product.name}`);

    try {
      // Go to product page
      await page.goto(product.url, { waitUntil: "domcontentloaded" });

      // Wait for the main price element to appear (10 seconds timeout)
      await page.waitForSelector(product.selector, { timeout: 10000 });

      // Grab the whole and fraction parts of the price
      const whole = await page.textContent(".a-price-whole");
      const fraction = await page.textContent(".a-price-fraction");

      // Clean the values
      const wholeClean = (whole || "0").replace(/\./g, ""); // remove any stray dots
      const fractionClean = fraction || "0";

      // Combine into full decimal price string
      const priceStr = `${wholeClean}.${fractionClean}`;

      // Convert to number once for comparison
      const numericPrice = parseFloat(priceStr.replace(/,/g, ""));

      // Log the price
      console.log(` → Price: £${numericPrice}`);

      // Optional: check against product-specific target price
      if (product.targetPrice !== undefined) {
        if (numericPrice <= product.targetPrice) {
          console.log(`🔥 ${product.name} is below your target price of £${product.targetPrice}!`);
        } else {
          console.log(`⚠️ ${product.name} is above your target price of £${product.targetPrice}.`);
        }
      }
    } catch (err) {
      console.log(` → Failed to read price (selector may have changed or page did not load).`);
    }
  }

  await browser.close();
}

// Run the price check
checkPrices();



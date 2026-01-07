import { chromium } from "playwright";
import { products } from "./src/products";

async function checkPrices() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

for (const product of products) {
  console.log(`Checking price for: ${product.name}`);

  await page.goto(product.url, { waitUntil: "domcontentloaded" });

  try {
    // Wait for the element to appear (timeout after 10 seconds)
    await page.waitForSelector(product.selector, { timeout: 10000 });

    const price = await page.textContent(product.selector);
    console.log(` → Price: ${price}`);
  } catch (err) {
    console.log(` → Failed to read price (selector may have changed).`);
  }
}


  await browser.close();
}

checkPrices();


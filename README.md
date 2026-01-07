# Price Watcher

A simple **price monitoring tool** built with **TypeScript** and **Playwright** that checks product prices on Amazon and logs them. This is great for practice with browser automation and automation scripting.

---

## Features

- Monitor multiple products at once
- Fetch prices from Amazon (or other websites with custom selectors)
- Waits for price elements to load dynamically
- Handles whole and fraction parts of prices (for full decimal value)
- Easy to extend for notifications, databases, or dashboards

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ChristopherWassell/price-watcher.git
cd price-watcher


Script to run: npx ts-node src/price-check.ts

Notes

Amazon sometimes splits prices into whole and fraction parts. You may need to adjust the selector or combine .a-price-whole + .a-price-fraction to get the full price.

For debugging, you can make the browser visible:

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

Notes for setting up email if it does not work and you get the error: Failed to send email for "Product" : Error: Invalid login: 534-5.7.9 Application-specific password required.


How to fix it

Enable 2-Step Verification on your Gmail account if you haven’t already.

Go to https://myaccount.google.com/security

Turn on 2FA (Google will guide you through it).

Create an App Password

Go to https://myaccount.google.com/apppasswords

Select Mail as the app, and Other or Custom name for device (e.g., Price Tracker)

Google will generate a 16-character password

Update your .env file
Replace your EMAIL_PASS with the App Password, not your normal Gmail password:

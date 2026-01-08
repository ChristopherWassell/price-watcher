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


Running the Workflow Manually on GitHub

Even though our workflow is scheduled to run automatically every hour, you can also trigger it manually at any time using the GitHub UI.

Steps to Run the Workflow

Open the Actions Tab

Go to your repository on GitHub.

Click Actions at the top of the page (next to Pull requests and Projects).

Select the Workflow

In the left sidebar, find and click the workflow named Price Tracker.

This corresponds to the .github/workflows/price-check.yml file.

Run the Workflow

On the workflow page, look for the green “Run workflow” button on the right-hand side.

Click it.

If prompted, select the branch (usually main).

Click the green Run workflow button to start it immediately.

View the Logs

After triggering, you’ll be taken to the workflow run page.

You can expand each step (Checkout, Setup Node, Install Dependencies, Run Price Checker) to see detailed logs.

The console will show current prices and any alerts if a product is below its target price.

✅ Tip: This is useful for testing or checking prices immediately without waiting for the scheduled run.
# Manual Fulfillment Guide & Configuration

This document outlines how to configure, manage, and scale the built-in Manual Fulfillment workflow in Medusa.js for internal fleets or manual courier drop-offs.

---

## 📋 1. Medusa Configuration

No external npm packages are needed. Ensure the built-in module is registered in your `medusa-config.js` or `medusa-config.ts` file:

```javascript
const plugins = [
  // ... other core plugins
  {
    resolve: `@medusajs/fulfillment-manual`,
    options: {},
  },
];
```

---

## ⚙️ 2. Admin Setup Dashboard

Follow these steps to activate the fulfillment method inside your store admin area:

1. Log into your **Medusa Admin**.
2. Go to **Settings** > **Regions**.
3. Select the target region (e.g., **India**).
4. Scroll to **Shipping Options** and click **Add Option**.
5. Set the **Provider** dropdown menu field to `manual`.
6. Fill in the storefront display details:
   * **Name:** e.g., *Local Delivery (Chennai)* or *Standard Shipping*.
   * **Price Type:** Choose *Flat Rate* or *Free*.
   * **Amount:** Define the fixed customer delivery fee.

---

## 🚚 3. Order Processing Workflow

When an order is placed, follow this manual pipeline to process packages and update tracking info.

### Step 1: Create Fulfillment
* Open the specific order in **Medusa Admin**.
* Scroll to the fulfillment window and click **Create Fulfillment**.
* Print the auto-generated packaging slip for your warehouse team.

### Step 2: Book Logistic Carrier
* Physically hand over the package to your local driver, or manually drop it at a local courier franchise (e.g., Delhivery, Blue Dart, India Post).
* Obtain the physical or digital **Air Waybill (AWB)** receipt and the tracking URL.

### Step 3: Dispatch & Input Tracking Data
* Return to the Medusa Admin order view page.
* Locate the active fulfillment card and click **Mark as Shipped**.
* In the open modal popup window, click **Add Tracking**.
* Fill out the target tracking parameters exactly:
  * **Tracking Number:** Paste the **AWB Number** (e.g., `DEL123456789`).
  * **Tracking URL:** Paste the web link (e.g., `https://delhivery.com`).

---

## 🌐 4. Headless Storefront Integration

Your frontend (Next.js, Remix, Vue) reads these parameters from the Medusa Storefront API. Below is an example payload representation of how tracking link properties are exposed:

```json
"fulfillments": [
  {
    "id": "ful_01H8X...",
    "shipped_at": "2026-07-14T12:00:00.000Z",
    "tracking_links": [
      {
        "id": "tln_01H8X...",
        "tracking_number": "DEL123456789",
        "url": "https://delhivery.com"
      }
    ]
  }
]
```

Use `tracking_links[0].url` directly inside your frontend UI anchor tags (`<a href="...">Track Package</a>`) to let customers track orders straight from their profile dashboards.


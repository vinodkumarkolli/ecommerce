---
name: normalized-email-templating
description: "Guidelines and design system for creating and modifying email templates in the backend (src/email-templates)."
---

# Normalized Email Templating

When creating or modifying HTML email templates in the backend (`src/email-templates`), you MUST adhere to the following normalized design system. This ensures all transactional emails look professional, consistent, and display correctly across various email clients.

## Design System Principles

### 1. Structure
Always use a full HTML document structure (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`) with an explicit `<style>` block in the head. Avoid wrapping content directly in floating `<div>` elements without the root HTML setup.

### 2. Container
Use a centered container with a maximum width to ensure readability on large screens, and a subtle border-radius and shadow to look like a modern card.
- **Background (Body):** `#f3f4f6` (light neutral gray)
- **Container Max-Width:** `600px`
- **Container Background:** `#ffffff`
- **Border Radius:** `12px`

### 3. Header
Use a dark, solid header for a premium and prominent brand presence. Avoid washed out or "ghosty" colors.
- **Header Background:** `#0f172a` (Deep Slate)
- **Header Text:** `#ffffff`
- **Padding:** `32px`

### 4. Typography
Rely on standard system fonts. Do not use external web fonts (like Google Fonts) as they are blocked by many email clients.
- **Font Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Body Text Color:** `#4b5563`
- **Headings Color:** `#0f172a` or `#1f2937`
- **Line Height:** `1.6`

### 5. Action Buttons (Primary CTAs)
Make sure the button is extremely visible. No "ghosty" buttons.
- **Background Color:** `#2563eb` (Vibrant Blue)
- **Text Color:** `#ffffff`
- **Padding:** `14px 28px`
- **Border Radius:** `8px`
- **Font Weight:** `600`
- **Text Decoration:** `none`

### 6. Highlight Boxes / Alerts
Use highlight boxes to bring attention to specific actions, notes, or refund information.
- **Info (Blue):** Background `#f0f9ff`, Border `#3b82f6`, Text `#1e40af`
- **Success (Green/Teal):** Background `#f0fdfa`, Border `#0d9488`, Text `#115e59`
- **Warning/Danger (Red):** Background `#fef2f2`, Border `#ef4444`, Text `#991b1b`

### 7. Tables (Order Details)
Tables should look clean with minimalistic borders.
- **Table Headers:** `border-bottom: 2px solid #e2e8f0; color: #64748b;`
- **Table Rows:** `border-bottom: 1px solid #e2e8f0; padding: 12px 0;`
- **Totals:** Bold, `18px`, `color: #0f172a`

### 8. Footer
Always include a subtle footer.
- **Background:** `#f8fafc`
- **Text Color:** `#94a3b8`
- **Font Size:** `13px`

## Boilerplate Template

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Subject</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; color: #1f2937; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background-color: #0f172a; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .content p { font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px; color: #4b5563; }
        .btn-container { text-align: center; margin: 32px 0 16px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 0; font-size: 13px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sravi Enterprises</h1>
        </div>
        <div class="content">
            <p>Hi {{customer_name}},</p>
            <p>Your message goes here.</p>
            
            <div class="btn-container">
                <a href="{{action_url}}" class="btn">Primary Action</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{year}} Sravi Enterprises. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

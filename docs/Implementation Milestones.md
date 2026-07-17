Implementation Milestones
Infrastructure Scaffolding: Spin up the minimal PostgreSQL and Redis Docker services.

Backend Engine Core: Run npx create-medusa-app@latest, selecting the database strings and pulling down the Next.js Storefront Starter.

Module Wiring: Install Razorpay and Manual Fulfillment extensions; bind them to medusa-config.ts.

Catalog & Store Setup: Inject the 4 core products via the admin dashboard, 
	- Products
	==========
		1. SASTRY BALM 12.6 ML Pack of 8 (Shipping Charges from Shipping Aggregator)
		2. SASTRY BALM 12.6 ML Pack of 10 (Shipping Charges from Shipping Aggregator)
		3. SASTRY BALM 12.6 ML Pack of 12 (Shipping Charges from Shipping Aggregator)
		4. SASTRY BALM 12.6 ML Pack of 20 (Free Shipping)
	- GST for above products is 5% (CGST - 2.5%, SGST - 2.5%, IGST - 5%)
	- All the products have image - (https://zap.sravie.in/file/9fb799789d/SB.jpeg)
	- Need to define weights and dimensions of each Product to handle with the Shipping Fulfillment provider
	set up Indian region tax/currency settings (INR, 0 decimal places), and set up the shipping options linked to the Manual fulfillment options.

Theme & Branding Tuning: Modify Tailwind templates on the Next.js front-end layer to align with company branding and logo assets
	- Company Name: Sravi Enterprises (https://zap.sravie.in/file/fe187c9f1e/		web_home_mono.png)
	- Brand: Sastry Balm (https://sastrybalm.in/wp-content/uploads/2020/08/slogo.png)


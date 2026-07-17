# Project Requirements: Headless Micro-Store that is optimised for less number of products - 10

## 1. Executive Summary
Development of an ultra-lean, highly optimized headless e-commerce store designed specifically to host and sell a micro-catalog of nearly 5-10 products. The stack must optimize for minimal resource consumption, fast API delivery, and seamless integration with localized Indian payment and logistics services.

---

## 2. Technical Stack Architecture

### Backend Engine
- **Platform:** MedusaJS (Version 2.x)
- **Runtime:** Node.js / TypeScript
- **Database:** PostgreSQL (v17-alpine) configured for low memory footprint.
- **Cache / Workflow Broker:** Redis (v7-alpine)

### Infrastructure (Self-Hosted / Lean Docker Stack)
- Shared resource limits to prevent background hoarding of memory on host.
- Single-instance PostgreSQL limits: `max_connections=20`, `shared_buffers=32MB`, memory hard-capped at `256MB`.

### Frontend Storefront
- **Framework:** Next.js (Official Medusa Storefront Starter Kit)
- **Styling:** Tailwind CSS
- **Features:** Responsive product display, shopping cart drawer, multi-step localized customer checkout, and customer account dashboard.
---

## 3. Product Catalog Specifications
- **Catalog Size:** Less than 10 unique products.
- **Complexity:** Low. No heavy product information management (PIM) system, multi-level category trees, or enterprise elastic search clusters required.
- **Admin Management:** Configuration and image assets managed natively via the built-in Medusa Admin Dashboard.
---

## 4. Localized Indian Integrations

### A. Payment Gateway (Paytm)
- **Provider:** Paytm via active community integration
- **Core Requirement:** Support for localized Indian payment instruments at checkout, specifically:
  - **UPI** (Google Pay, PhonePe, Paytm App deep-linking).
  - **Paytm Wallet** ecosystem.
  - Indian Debit/Credit Cards and NetBanking.
- **Fallback Rule:** If community plugins fail compliance checks during initialization, implement a custom payment processor extending Medusa's `AbstractPaymentProvider` hitting the Paytm API directly.

### B. Logistics & Fulfillment (Manual Fulfillment)
 - Follow steps in Fulfillment.md
 
### C. Promotional Engine (Coupons & Offers)
- **Engine:** Medusa v2 Native Promotion Module.
- **Core Requirement:** Full support for checkout-level coupon code application:
  - **Code Input UI:** A coupon entry box integrated directly into the Next.js checkout drawer and order summary section.
  - **Discount Archetypes:** Support for fixed INR price discounts (e.g., ₹100 off) and percentage-based discounts (e.g., 10% off).
  - **Validation & Real-time Recalculation:** Instant Cart API updates when a coupon is applied, modifying the line-item totals, tax, and final Paytm checkout payload amount asynchronously.
  - **Management:** Coupon rules, usage limits, expiration dates, and target products configured natively through the Medusa Admin Dashboard.
---

## 5. Minimum Environment Configurations

### Docker Compose Database Infrastructure
```yaml
version: "3.8"
services:
  postgres:
    image: postgres:17-alpine
    container_name: medusa-db
    environment:
      POSTGRES_USER: medusa_user
      POSTGRES_PASSWORD: $MEDUSA_DB_PASSWORD
      POSTGRES_DB: medusa_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    command: >
      postgres 
      -c max_connections=20
      -c shared_buffers=32MB
      -c work_mem=2MB
      -c min_wal_size=32MB
      -c max_wal_size=128MB
      -c logging_collector=off
    deploy:
      resources:
        limits:
          memory: 256M

  redis:
    image: redis:7-alpine
    container_name: medusa-redis
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          memory: 128M

volumes:
  pgdata:

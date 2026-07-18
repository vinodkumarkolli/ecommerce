---
name: testing-scripts
description: Useful testing scripts and commands for querying data directly via the graph or Medusa modules.
---

# Testing Scripts and Database Queries

When building with Medusa, it's often necessary to write quick scripts to verify that database records, relations, and the GraphQL-like query system are working correctly.

## 1. Using Medusa Exec Executable Scripts

Medusa allows running scripts with an initialized container using the `npx medusa exec` command. This is very useful for checking data using the query graph.

### Query Graph Examples

#### Testing Order Totals
You can retrieve an order and verify its calculated totals like so:
```typescript
import { MedusaContainer } from "@medusajs/framework/types"

export default async function myScript({ container }: { container: MedusaContainer }) {
    const query = container.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "total",
        "subtotal",
        "original_total",
        "item_total",
        "summary.*",
        "items.*"
      ],
      filters: { id: "order_01KXRCRJK2S7DEG6MECZ8VQX1A" } // Replace with your ID
    })
    console.log("ORDER FIELDS:", orders[0])
}
```

#### Comparing Module Service vs Query Graph
You can also use the service modules directly and compare them to the query graph:
```typescript
import { MedusaContainer } from "@medusajs/framework/types"

export default async function myScript({ container }: { container: MedusaContainer }) {
    const orderModuleService = container.resolve("order")
    const order = await orderModuleService.retrieveOrder("order_01KXRCRJK2S7DEG6MECZ8VQX1A", {
      relations: ["shipping_address", "items"]
    })
    console.log("ORDER TOTAL FROM SERVICE:", order.total)
    
    const query = container.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["total", "items.unit_price"],
      filters: { id: "order_01KXRCRJK2S7DEG6MECZ8VQX1A" }
    })
    console.log("ORDER TOTAL FROM QUERY GRAPH:", orders[0].total)
}
```

#### Querying Payments and Relations
```typescript
import { MedusaContainer } from "@medusajs/framework/types"

export default async function myScript({ container }: { container: MedusaContainer }) {
    const query = container.resolve("query")
    const { data: payments } = await query.graph({
      entity: "payment",
      fields: [
        "id", 
        "amount",
        "refunds.*", 
        "payment_collection.order.id",
        "payment_collection.order.display_id",
        "payment_collection.order.email",
        "payment_collection.order.total",
        "payment_collection.order.shipping_address.*",
        "payment_collection.order.items.*"
      ],
      filters: { id: "pay_01KXRCRJNS969P41KQQ4VTZ2KB" }
    })
    console.log("PAYMENTS:")
    console.dir(payments, { depth: null })
}
```

## 2. Testing Outside Medusa CLI (Direct PG)
Sometimes you might want to query PostgreSQL directly to verify the raw state, for example customer tables.
```javascript
const { Pool } = require('pg')
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/medusa' })
pool.query("SELECT id, email, phone FROM customer WHERE phone = '9701881033'")
  .then(res => { console.log(res.rows); pool.end() })
  .catch(err => { console.error(err); pool.end() })
```

## Running these scripts
Save any of the `export default async function myScript({ container })` scripts in a file (e.g., `test.ts`) and run:
`npx medusa exec test.ts`

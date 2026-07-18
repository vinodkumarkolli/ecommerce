import { MedusaContainer } from "@medusajs/framework/types"

export default async function myScript({ container }: { container: MedusaContainer }) {
    const query = container.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "*", 
        "shipping_address.*", 
        "items.*",
        "original_total",
        "total"
      ],
      // Find latest order
    })
    
    const order = orders[orders.length - 1];
    console.log("ORDER original_total object:", order.original_total)
    console.log("ORDER total object:", order.total)
}

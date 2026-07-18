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
      filters: { id: "order_01KXRCRJK2S7DEG6MECZ8VQX1A" }
    })
    console.log("ORDER FIELDS:", orders[0])
}

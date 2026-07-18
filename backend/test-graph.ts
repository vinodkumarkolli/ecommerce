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

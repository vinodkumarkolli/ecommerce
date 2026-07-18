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

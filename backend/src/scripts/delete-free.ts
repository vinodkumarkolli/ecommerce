import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function myScript({ container }: { container: MedusaContainer }) {
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const options = await fulfillmentModuleService.listShippingOptions({
    name: "Free"
  })
  if (options.length > 0) {
    await fulfillmentModuleService.deleteShippingOptions(options.map((o: any) => o.id))
    console.log("Deleted Free options", options.length)
  }
}

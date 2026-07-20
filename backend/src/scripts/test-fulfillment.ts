import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function myScript({ container }: ExecArgs) {
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  
  const options = await fulfillmentService.listShippingOptions()
  
  if (options.length === 0) return;
  
  const calculatedOption = options.find((o: any) => o.price_type === "calculated")
  if (!calculatedOption) {
    return;
  }
  
  const calculateData = [{
    id: calculatedOption.id,
    provider_id: calculatedOption.provider_id,
    optionData: calculatedOption.data || {},
    data: {},
    context: {
      items: [{ variant: { weight: 1100 }, quantity: 2 }]
    }
  }]
  
  const prices = await fulfillmentService.calculateShippingOptionsPrices(calculateData)
  console.log("Calculated Prices Result for 2200g:", prices)
}

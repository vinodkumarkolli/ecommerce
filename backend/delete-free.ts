import { initialize } from "@medusajs/modules-sdk"
import { Modules } from "@medusajs/framework/utils"

async function run() {
  const { fulfillmentService } = await initialize({
    modules: [
      {
        resolve: "@medusajs/medusa/fulfillment",
        options: {
          providers: []
        }
      }
    ]
  })
}
run()

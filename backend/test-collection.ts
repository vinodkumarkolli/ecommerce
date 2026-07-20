import { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function seed({ container }: { container: MedusaContainer }) {
  const productService = container.resolve(Modules.PRODUCT)
  console.log(Object.keys(productService).filter(k => k.toLowerCase().includes('collection')))
}

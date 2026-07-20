import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function myScript({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)
  const variants = await productService.listProductVariants({}, { skip: 0, take: 100 })
  for (const variant of variants) {
    if (variant.sku === "SASB-12ML-PK10") await productService.updateProductVariants(variant.id, { weight: 600 })
    if (variant.sku === "SASB-12ML-PK12") await productService.updateProductVariants(variant.id, { weight: 700 })
    if (variant.sku === "SASB-12ML-PK20") await productService.updateProductVariants(variant.id, { weight: 1100 })
    if (variant.sku === "SASB-5INR-PK5") await productService.updateProductVariants(variant.id, { weight: 100 })
    if (variant.sku === "SASB-5INR-PK100") await productService.updateProductVariants(variant.id, { weight: 500 })
  }
  console.log("Weights updated successfully!")
}

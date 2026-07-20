import { MedusaContainer } from "@medusajs/framework"
import * as coreFlows from "@medusajs/medusa/core-flows"

export default async function seed({ container }: { container: MedusaContainer }) {
  console.log(Object.keys(coreFlows).filter(k => k.toLowerCase().includes('collection')))
}

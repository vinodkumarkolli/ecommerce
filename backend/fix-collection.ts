import { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { createCollectionsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seed({ container }: { container: MedusaContainer }) {
  const productService = container.resolve(Modules.PRODUCT)
  
  const existingCollections = await productService.listProductCollections({ title: "Sastry Balm" })
  let collectionId = undefined;
  
  if (existingCollections.length > 0) {
    collectionId = existingCollections[0].id
    console.log("Collection already exists")
  } else {
    const { result } = await createCollectionsWorkflow(container).run({
      input: {
        collections: [
          {
            title: "Sastry Balm",
            metadata: {
              "Description": "<p>Sri Kodandarama Ayurveda Nilayam is an Ayurvedic Pharmacy operated from 7 generations of Ayurvedic Specialists. The organisation started gaining popularity under the aegis of Sri. Vukkadapu Ram Mohan Rao. Sastry Balm was started manufacturing from 1993 and since then, it has been a household name in Andhra Pradesh.</p>\n<p>The Balm is thoroughly formulated using natural and tested ingredients that ensure to its optimum effectiveness. Sri Kodandarama Ayurveda Nilayam is a GMP certified Organisation by Dept. of Ayush, Govt of India. Owing to this, it is a reliable name in the market for the best herbal formulation in terms of Pain Balm</p>",
              "Used For": "<ul><li>Fast Relief from Headache</li>\n<li>Cold</li>\n<li>Back Pain</li>\n<li>Knee Joint Pain</li>\n<li>Neck Pain</li>\n<li>Sprains</li>\n<li>Joint Pains</li>\n<li>Muscle Spasm</li>\n<li>Frozen Shoulder and</li>\n<li>Rheumatic Pain</li></ul>"
            }
          }
        ]
      }
    })
    collectionId = result[0].id
    console.log("Collection created")
  }

  const products = await productService.listProducts({ handle: "sastry-balm-12-ml" })
  if (products.length > 0) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: products[0].id },
        update: { collection_id: collectionId }
      }
    })
    console.log("Product updated with collection ID")
  }
}

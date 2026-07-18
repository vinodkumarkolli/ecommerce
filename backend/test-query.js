const { initialize } = require("@medusajs/framework")
async function run() {
  const app = await initialize({ directory: process.cwd() })
  const query = app.container.resolve("query")
  
  const { data } = await query.graph({
    entity: "payment",
    fields: ["id", "payment_collection.payment_collection_id"],
    filters: {}
  })
  console.log(data)
  process.exit(0)
}
run()

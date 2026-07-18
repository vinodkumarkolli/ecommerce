import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")
  const orderId = req.params.id

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "payment_reimbursements.*"],
    filters: { id: orderId }
  })

  res.json({ reimbursements: data[0]?.payment_reimbursements || [] })
}

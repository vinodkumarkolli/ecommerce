const { Medusa } = require("@medusajs/medusa-js");
const medusa = new Medusa({ baseUrl: "http://localhost:9000", maxRetries: 3 });

async function getOrder() {
  // Let's get the latest order
  const { orders } = await medusa.admin.orders.list({ limit: 1 }, {
    headers: {
      Authorization: "Bearer admin_api_token_or_we_can_use_db"
    }
  });
  console.log(orders);
}
// Actually, it's easier to curl the storefront API to see what we get for the order

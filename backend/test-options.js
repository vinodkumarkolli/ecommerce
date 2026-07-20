const { initialize } = require("@medusajs/modules-sdk");
async function run() {
  const res = await fetch("http://localhost:9000/store/shipping-options");
  const data = await res.json();
  console.log(JSON.stringify(data.shipping_options, null, 2));
}
run();

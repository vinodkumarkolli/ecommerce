const { initialize } = require("@medusajs/modules-sdk");

async function run() {
  try {
    const res = await fetch("http://localhost:9000/store/carts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": "pk_a5a73e1afb5d4a7f05f152d128df05072049d10e5272a806253c30a9e70195ee" },
      body: JSON.stringify({
        currency_code: "inr",
        email: "test@example.com",
        shipping_address: {
          first_name: "Test",
          last_name: "Test",
          address_1: "123 Test St",
          city: "Test",
          country_code: "in",
          postal_code: "12345"
        }
      })
    });
    const cartData = await res.json();
    if (!cartData.cart) throw new Error(JSON.stringify(cartData));
    const cartId = cartData.cart.id;
    console.log("Cart created:", cartId);

    const shipRes = await fetch("http://localhost:9000/store/shipping-options?cart_id=" + cartId, {
      headers: { "x-publishable-api-key": "pk_a5a73e1afb5d4a7f05f152d128df05072049d10e5272a806253c30a9e70195ee" }
    });
    const shipData = await shipRes.json();
    if (!shipData.shipping_options || shipData.shipping_options.length === 0) throw new Error("No shipping options");
    const optionId = shipData.shipping_options[0].id;
    console.log("Found option:", optionId);

    const addShipRes = await fetch(`http://localhost:9000/store/carts/${cartId}/shipping-methods`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": "pk_a5a73e1afb5d4a7f05f152d128df05072049d10e5272a806253c30a9e70195ee" },
      body: JSON.stringify({ option_id: optionId })
    });
    console.log("Add shipping method response:", addShipRes.status);
    console.log(await addShipRes.text());

  } catch (e) {
    console.error(e);
  }
}
run();

async function run() {
  const res = await fetch("http://localhost:9000/store/carts/cart_01KXZZMPHR7Z6N92M0Z6X82FCC", {
    headers: { "x-publishable-api-key": "pk_3ea1b8d118376ada4e748487728c1e51daf20884bf68783be1fb88d3553a4960" }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.cart.shipping_methods, null, 2));
}
run();

async function run() {
  const res = await fetch("http://localhost:9000/store/carts/cart_01KXZYPX3X8H5J1A843PQ403F2", {
    headers: { "x-publishable-api-key": "pk_a5a73e1afb5d4a7f05f152d128df05072049d10e5272a806253c30a9e70195ee" }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.cart.shipping_methods, null, 2));
}
run();

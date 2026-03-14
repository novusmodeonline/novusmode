export function pickProductsForInvoice(amount, products) {
  let selected = [];
  let sum = 0;
  const MAX_DISCOUNT = 1000;

  // Shuffle to avoid deterministic picks
  const shuffled = [...products].sort(() => 0.5 - Math.random());

  for (const product of shuffled) {
    // If already perfect or acceptable, stop
    if (sum >= amount) break;

    const nextSum = sum + product.price;
    const overshoot = nextSum - amount;

    // Case 1: Safe add (still under target)
    if (nextSum <= amount) {
      selected.push({ ...product, qty: 1 });
      sum = nextSum;
      continue;
    }

    // Case 2: Slight overshoot (acceptable → discount)
    if (overshoot > 0 && overshoot <= MAX_DISCOUNT) {
      selected.push({ ...product, qty: 1 });
      sum = nextSum;
      break; // we are done
    }

    // Case 3: Overshoot too big → skip product
    // DO NOTHING, just continue loop
  }

  const discount = sum > amount ? sum - amount : 0;

  return {
    products: selected,
    total: sum,
    discount,
    finalPayable: sum - discount,
  };
}

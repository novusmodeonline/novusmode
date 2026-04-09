export function pickProductsForInvoice(amount, products, options = {}) {
  const targetAmount = Math.max(0, Math.round(Number(amount || 0)));
  const maxDiscount = Math.max(
    0,
    Math.round(Number(options.maxDiscount ?? 1000)),
  );

  const shuffled = [...(products || [])]
    .map((product) => ({
      ...product,
      price: Math.round(Number(product.price || 0)),
    }))
    .filter((product) => product.price > 0)
    .sort(() => 0.5 - Math.random());

  let selected = [];
  let sum = 0;

  for (const product of shuffled) {
    if (sum >= targetAmount) break;

    const nextSum = sum + product.price;
    const overshoot = nextSum - targetAmount;

    if (nextSum <= targetAmount) {
      selected.push({ ...product, qty: 1 });
      sum = nextSum;
      continue;
    }

    if (overshoot > 0 && overshoot <= maxDiscount) {
      selected.push({ ...product, qty: 1 });
      sum = nextSum;
      break;
    }
  }

  if (sum < targetAmount) {
    const selectedKeys = new Set(
      selected.map((product) => product.id || product.slug || product.title),
    );

    const fallbackProduct = shuffled
      .filter(
        (product) =>
          !selectedKeys.has(product.id || product.slug || product.title),
      )
      .map((product) => ({
        product,
        overshoot: sum + product.price - targetAmount,
      }))
      .filter((entry) => entry.overshoot >= 0 && entry.overshoot <= maxDiscount)
      .sort((a, b) => a.overshoot - b.overshoot)[0];

    if (fallbackProduct) {
      selected.push({ ...fallbackProduct.product, qty: 1 });
      sum += fallbackProduct.product.price;
    }
  }

  const discount = sum > targetAmount ? sum - targetAmount : 0;

  return {
    products: selected,
    total: sum,
    discount,
    finalPayable: Math.max(0, sum - discount),
  };
}

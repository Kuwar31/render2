// @ts-nocheck

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const discounts = [];

  for (const line of input.cart.lines) {
    const bundleIdProp = line.merchandise?.product?.bundleId;
    if (!bundleIdProp) continue;

    // Bundle discount logic will be applied based on quantity
    // The actual discount config comes from metafields set by the app
    const qty = line.quantity;
    const tiers = line.merchandise?.product?.bundleTiers?.value
      ? JSON.parse(line.merchandise.product.bundleTiers.value)
      : [];

    if (!tiers.length) continue;

    // Find applicable tier
    const applicableTier = tiers
      .filter(t => t.quantity <= qty)
      .sort((a, b) => b.quantity - a.quantity)[0];

    if (!applicableTier || applicableTier.discountValue === 0) continue;

    if (applicableTier.discountType === "percentage") {
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: { percentage: { value: applicableTier.discountValue } },
        message: `Bundle: ${applicableTier.discountValue}% off`,
      });
    } else if (applicableTier.discountType === "fixed_amount") {
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: {
          fixedAmount: {
            amount: applicableTier.discountValue,
            appliesToEachItem: true,
          },
        },
        message: `Bundle: $${applicableTier.discountValue} off`,
      });
    }
  }

  if (discounts.length === 0) {
    return { discounts: [], discountApplicationStrategy: "FIRST" };
  }

  return {
    discounts,
    discountApplicationStrategy: "FIRST",
  };
}
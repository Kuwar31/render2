// @ts-nocheck
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // Get bundle tiers config from metafield
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  const tiers = configuration.tiers ?? [];

  if (!tiers.length) return EMPTY_DISCOUNT;

  const discounts = [];

  for (const line of input.cart.lines) {
    const qty = line.quantity;

    // Find the best applicable tier for this quantity
    const applicableTier = tiers
      .filter(t => t.quantity <= qty)
      .sort((a, b) => b.quantity - a.quantity)[0];

    if (!applicableTier || applicableTier.discountValue === 0) continue;

    const variantId = line.merchandise?.id;
    if (!variantId) continue;

    if (applicableTier.discountType === "percentage") {
      discounts.push({
        targets: [{ productVariant: { id: variantId } }],
        value: {
          percentage: { value: String(applicableTier.discountValue) },
        },
        message: `Bundle: ${applicableTier.discountValue}% off`,
      });
    } else if (applicableTier.discountType === "fixed_amount") {
      discounts.push({
        targets: [{ productVariant: { id: variantId } }],
        value: {
          fixedAmount: {
            amount: String(applicableTier.discountValue),
            appliesToEachItem: true,
          },
        },
        message: `Bundle: $${applicableTier.discountValue} off`,
      });
    }
  }

  if (!discounts.length) return EMPTY_DISCOUNT;

  return {
    discountApplicationStrategy: DiscountApplicationStrategy.First,
    discounts,
  };
}
/**
 * Platform fee calculation matching Gumroad's model:
 * 10% flat fee on each transaction.
 */

const PLATFORM_FEE_PERCENTAGE = 10; // 10%

export interface FeeBreakdown {
  subtotalCents: number;
  platformFeeCents: number;
  creatorEarningsCents: number;
  taxCents: number;
  totalCents: number;
}

export const calculateFees = (
  priceCents: number,
  taxCents: number = 0,
  discountCents: number = 0
): FeeBreakdown => {
  const subtotalCents = Math.max(0, priceCents - discountCents);
  const platformFeeCents = Math.round(subtotalCents * (PLATFORM_FEE_PERCENTAGE / 100));
  const creatorEarningsCents = subtotalCents - platformFeeCents;
  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    platformFeeCents,
    creatorEarningsCents,
    taxCents,
    totalCents,
  };
};

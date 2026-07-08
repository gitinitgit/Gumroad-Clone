/**
 * Tax calculation placeholder.
 * In production, integrate with a tax API (TaxJar, Avalara, etc.)
 */
export const calculateTax = (amountCents: number, _countryCode?: string): number => {
  // Placeholder: no tax calculation for v1
  // Future: lookup tax rate by country/state and return tax in cents
  return 0;
};

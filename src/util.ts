// Get an error string from GraphQLError and Errors.
// This function is mostly because calling `error.message` on a GraphQLError object

import { CaasCurrency } from "./__generated__/graphql";

// returns a user-unfriendly string instead of just its first error message.
export function formatError(e: unknown): string {
  if (!e) return "Unknown error";
  if (
    // Check for GraphQLError
    typeof e === "object" &&
    "response" in e &&
    typeof (e as { response: unknown }).response === "object" &&
    (e as { response: { errors: { message: string }[] } }).response.errors?.[0]
      ?.message
  ) {
    return (e as { response: { errors: { message: string }[] } }).response
      .errors[0].message;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

// This is for use in currency amount input boxes.
// We want to truncate the user input into the max precision allowed by the currency.
// Returns null on bad numbers.
// It's also lenient to let the user type 'numbers in progress' like '1.' into the input box.
//
// Usage:
//
//   const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const truncated = truncateToDisplayScale(e.target.value, selectedCurrency);
//     if (truncated !== null) {
//       setAmountString(truncated);
//     }
//   }
//
// f('1.234', { displayUnitScale: 100 }) == '1.23'
// f('-1', ...) == null
// f('1.', ...) == '1.'
export function truncateToDisplayScale(
  value: string,
  currency: Pick<CaasCurrency, "displayUnitScale">
): string | null {
  if (!/^\d*\.?\d*$/.test(value)) return null;
  if (!value || value === ".") return value;

  const decimals = Math.log10(currency.displayUnitScale);
  const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);

  // If already valid, return as-is
  if (regex.test(value)) {
    return value;
  }

  // Try to truncate
  const parts = value.split(".");
  if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
    return `${parts[0]}.${parts[1].slice(0, decimals)}`;
  }

  return null;
}

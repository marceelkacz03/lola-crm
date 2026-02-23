export const currency = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0
  }).format(value);

export const percent = (value: number) => `${value.toFixed(1)}%`;

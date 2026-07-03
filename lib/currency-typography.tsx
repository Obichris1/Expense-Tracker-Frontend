import Typography, { TypographyProps } from "@mui/material/Typography";

interface CurrencyTypographyProps extends TypographyProps {
  amount: number | string;
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export default function CurrencyTypography({
  amount,
  currency = "NGN",
  locale = "en-NG",
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  ...props
}: CurrencyTypographyProps) {
  const value =
    typeof amount === "string" ? Number(amount) : amount;

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(isNaN(value) ? 0 : value);

  return <Typography {...props}>{formatted}</Typography>;
}
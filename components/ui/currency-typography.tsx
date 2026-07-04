// components/ui/currency-text.tsx
"use client";

type CurrencySize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
type CurrencyColor = 'default' | 'green' | 'red' | 'muted';

interface CurrencyTextProps {
  amount: number;
  currency?: string;
  size?: CurrencySize;
  color?: CurrencyColor;
  sign?: '+' | '−' | 'auto' | 'none';
  className?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€',
};

const SIZE_MAP: Record<CurrencySize, string> = {
  xs:   'text-xs',
  sm:   'text-sm',
  base: 'text-base',
  lg:   'text-lg',
  xl:   'text-xl',
  '2xl':'text-2xl',
  '3xl':'text-3xl',
};

const COLOR_MAP: Record<CurrencyColor, string> = {
  default: 'text-gray-900',
  green:   'text-teal-600',
  red:     'text-red-500',
  muted:   'text-gray-500',
};

export function CurrencyText({
  amount,
  currency = 'NGN',
  size = 'base',
  color = 'default',
  sign = 'none',
  className = '',
}: CurrencyTextProps) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const sizeClass = SIZE_MAP[size];
  const colorClass = COLOR_MAP[color];

  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  let signChar = '';
  if (sign === 'auto') signChar = amount >= 0 ? '+' : '−';
  else if (sign === '+') signChar = '+';
  else if (sign === '−') signChar = '−';

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${sizeClass} ${colorClass} ${className}`}
    >
      {signChar && <span>{signChar}</span>}
      <span>{symbol}</span>
      <span>{formatted}</span>
    </span>
  );
}
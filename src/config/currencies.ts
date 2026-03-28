export type CurrencyCode = 'EUR' | 'USD' | 'GBP';
export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';
export const formatMoney = (amount: number, currency: CurrencyCode = DEFAULT_CURRENCY, locale = navigator.language) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

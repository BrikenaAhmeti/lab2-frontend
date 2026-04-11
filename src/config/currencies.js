export const DEFAULT_CURRENCY = 'EUR';
export const formatMoney = (amount, currency = DEFAULT_CURRENCY, locale = navigator.language) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

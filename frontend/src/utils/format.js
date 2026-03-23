/**
 * Formats a number as Mexican Peso currency.
 * e.g. 1000 → "$1,000.00"
 */
export const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return num.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/**
 * Returns a prefixed transaction ID.
 * type: 'GASTO' → GA-X  |  'ANTICIPO'/'Adelanto' → AN-X  |  'REEMBOLSO'/'Reembolso' → RE-X
 */
export const txId = (id, type) => {
    const t = (type || '').toUpperCase();
    if (t === 'GASTO') return `GA-${id}`;
    if (t === 'ANTICIPO' || t === 'ADELANTO') return `AN-${id}`;
    if (t === 'REEMBOLSO') return `RE-${id}`;
    return `TX-${id}`;
};

/**
 * Formats a date+time string as "26 feb 2026, 18:30"
 * Uses created_at for expenses, request_date for advances.
 */
export const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }) + ', ' + d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};


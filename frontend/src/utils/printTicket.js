
/**
 * Generates a printable ticket for an Expense or Advance.
 * Formats for 80mm thermal printers.
 * @param {Object} data - The expense or advance object.
 * @param {string} type - 'GASTO' or 'ANTICIPO'.
 */
export const printTicket = (item, type = 'GASTO', cashierName = 'Caja') => {
    const dateFormatted = new Date(item.date || item.request_date || new Date()).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    const amount = Number(item.amount_approved || item.amount_requested || item.amount || 0).toFixed(2);
    const typeLabel = type.toUpperCase();
    const prefixMap = { 'GASTO': 'GA', 'ANTICIPO': 'AN', 'REEMBOLSO': 'RE' };
    const prefix = prefixMap[typeLabel] || 'TX';
    const transactionId = `${prefix}-${item.id}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ticket ${transactionId}</title>
        <style>
            @page { margin: 0; }
            body { 
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                width: 80mm; 
                margin: 0;
                padding: 15px;
                color: #000;
                box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.2em; }
            .text-xl { font-size: 18px; line-height: 1.2; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .text-2xl { font-size: 24px; line-height: 1; }
            .text-gray { color: #6b7280; }
            
            .border-b-thick { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .border-dashed { border-top: 1px dashed #9ca3af; padding-top: 15px; margin-top: 15px; }
            .border-solid { border-top: 1px solid #000; padding-top: 10px; margin-top: 40px; }
            
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mb-6 { margin-bottom: 24px; }
            
            .flex-between { display: flex; justify-content: space-between; }
            .truncate-name { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right; }
            
            .section-item { margin-bottom: 16px; }
            .label { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 3px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .value { font-weight: 600; font-size: 15px; display: block; word-break: break-word; }
        </style>
    </head>
    <body>
        <div class="text-center mb-6">
            <div class="text-xl font-bold uppercase tracking-widest border-b-thick">Grupo Induwell</div>
            <div class="text-sm font-semibold uppercase mt-2">Comprobante de Pago</div>
            <div class="text-xs mt-1 text-gray" style="font-family: -apple-system, sans-serif;">${dateFormatted}</div>
        </div>

        <div class="section-item" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span class="label">Tipo de Movimiento</span>
                <span class="value">${typeLabel}</span>
            </div>
            <div style="text-align:right;">
                <span class="label">Folio</span>
                <span class="value" style="font-size:18px; font-family:monospace;">${transactionId}</span>
            </div>
        </div>

        <div class="section-item">
            <span class="label">Beneficiario / Solicitante</span>
            <span class="value">${item.employee_name || item.user_name || 'Empleado'}</span>
        </div>

        <div class="section-item">
            <span class="label">Concepto</span>
            <span class="value">${item.notes || item.description || item.project || 'Sin detalles'}</span>
        </div>

        <div class="border-dashed">
            <span class="label">Monto Pagado</span>
            <span class="text-2xl font-bold">$${amount}</span>
        </div>

        <div class="border-dashed text-xs" style="font-family: -apple-system, sans-serif;">
            <div class="flex-between mt-2">
                <span class="font-semibold text-gray uppercase">Autorizado Por:</span>
                <span class="truncate-name">${item.approver_name || 'Admin User'}</span>
            </div>
            <div class="flex-between mt-2">
                <span class="font-semibold text-gray uppercase">Pagado Por (Caja):</span>
                <span class="truncate-name">${cashierName}</span>
            </div>
        </div>

        <div class="border-solid text-center">
            <div class="font-bold uppercase text-xs" style="font-family: -apple-system, sans-serif;">Firma de Recibido</div>
            <div class="text-xs text-gray mt-1" style="font-family: -apple-system, sans-serif;">${item.employee_name || item.user_name || 'Empleado'}</div>
        </div>

        <div class="border-solid text-center">
            <div class="font-bold uppercase text-xs" style="font-family: -apple-system, sans-serif;">Firma de Caja</div>
            <div class="text-xs text-gray mt-1" style="font-family: -apple-system, sans-serif;">${cashierName}</div>
        </div>

        <div class="text-center text-gray" style="margin-top: 40px; font-size: 10px; font-family: -apple-system, sans-serif;">
            Induwell Cloud-Cash System
        </div>

        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;

    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(html);
    win.document.close();
};

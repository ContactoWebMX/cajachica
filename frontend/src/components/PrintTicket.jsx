import React, { useEffect } from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';
import { printTicket } from '../utils/printTicket';

const PrintTicket = ({ item, isExpense, cashierName, onClose }) => {

    useEffect(() => {
        // Opcional: Auto-imprimir al abrir aunque le daremos un botón
    }, []);

    const handlePrint = () => {
        // Use the reliable external print utility to generate the thermal ticket
        printTicket(item, isExpense ? 'GASTO' : (item.type ? item.type.toUpperCase() : 'ANTICIPO'), cashierName);
    };

    const typeLabel = isExpense ? 'GASTO' : (item.type ? item.type.toUpperCase() : 'ANTICIPO');
    const amount = Number(item.amount_approved || item.amount_requested || item.amount || 0).toFixed(2);
    const dateFormatted = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">

            {/* Contenedor del Modal No-Imprimible */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-sm w-full relative print:shadow-none print:w-full print:max-w-none print:rounded-none">

                {/* Cabecera del Modal (Oculta al imprimir) */}
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center print:hidden">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Printer size={18} /> Ticket Generado
                    </h3>
                    <button onClick={onClose} className="text-slate-300 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Área de Impresión del Ticket */}
                <div id="print-area" className="p-6 bg-white text-black font-mono text-sm print:p-0 print:m-0">

                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold uppercase tracking-widest border-b-2 border-black pb-2 mb-2">Grupo Induwell</h1>
                        <h2 className="text-sm font-semibold uppercase">Comprobante de Pago</h2>
                        <p className="text-xs mt-1 text-gray-600 font-sans">{dateFormatted}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <span className="font-bold text-xs text-gray-500 uppercase block">Tipo de Movimiento</span>
                            <span className="font-semibold text-base">{typeLabel}</span>
                        </div>

                        <div>
                            <span className="font-bold text-xs text-gray-500 uppercase block">Beneficiario / Solicitante</span>
                            <span className="font-semibold truncate">{item.employee_name || item.user_name || 'Empleado'}</span>
                        </div>

                        <div>
                            <span className="font-bold text-xs text-gray-500 uppercase block">Concepto</span>
                            <span className="break-words">{item.notes || item.description || item.project || 'Sin detalles'}</span>
                        </div>

                        <div className="border-t border-dashed border-gray-400 pt-4 mt-4">
                            <span className="font-bold text-xs text-gray-500 uppercase block">Monto Pagado</span>
                            <span className="text-2xl font-bold">${amount}</span>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-dashed border-gray-400 text-xs">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-500 uppercase">Autorizado Por:</span>
                            <span className="text-right truncate max-w-[150px]">{item.approver_name || 'Director / Administración'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-500 uppercase">Pagado Por (Caja):</span>
                            <span className="text-right truncate max-w-[150px]">{cashierName || 'Cajero'}</span>
                        </div>
                    </div>

                    {/* Espacios para firmas */}
                    <div className="mt-16 pt-8 border-t border-black text-center">
                        <p className="font-bold uppercase text-xs">Firma de Recibido</p>
                        <p className="text-[10px] text-gray-500 mt-1">{item.employee_name || item.user_name || 'Empleado'}</p>
                    </div>

                    <div className="mt-16 pt-8 border-t border-black text-center">
                        <p className="font-bold uppercase text-xs">Firma de Caja</p>
                        <p className="text-[10px] text-gray-500 mt-1">{cashierName}</p>
                    </div>

                    <div className="text-center mt-8 text-[10px] text-gray-400 print:mb-4">
                        Induwell Cloud-Cash System
                    </div>
                </div>

                {/* Botón de Imprimir (Oculto al imprimir) */}
                <div className="p-4 bg-gray-50 border-t print:hidden">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-md"
                    >
                        <Printer size={20} />
                        IMPRIMIR TICKET
                    </button>
                </div>
            </div>

            {/* CSS Removed because we now use the external utility for printing */}
        </div>
    );
};

export default PrintTicket;

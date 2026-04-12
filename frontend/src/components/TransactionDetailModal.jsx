import React from 'react';
import { X, FileText, Calendar, DollarSign, User, Tag, MapPin, Hash, Building, Edit2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDateTime, txId } from '../utils/format';
import { BASE_URL } from '../services/api';

const TransactionDetailModal = ({ isOpen, onClose, item, type, onApprove, onReject }) => {
    const navigate = useNavigate();
    const [approvedAmount, setApprovedAmount] = React.useState('');

    React.useEffect(() => {
        if (item) {
            setApprovedAmount(item.amount || item.amount_requested || 0);
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const isExpense = type === 'GASTO';
    const canEdit = isExpense && item.status === 'Pendiente';
    const showApprovalActions = !!onApprove;

    const handleEdit = () => {
        onClose();
        navigate(`/expenses/edit/${item.id}`);
    };

    const handleApproveClick = () => {
        if (onApprove) {
            onApprove(item, approvedAmount);
            onClose();
        }
    };

    const statusBadge = (status) => {
        const base = 'px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border';
        if (['Aprobado Jefe', 'Aprobado Director'].includes(status))
            return `${base} bg-blue-100 text-blue-700 border-blue-200`;
        if (['Pagado', 'Comprobado'].includes(status))
            return `${base} bg-emerald-100 text-emerald-700 border-emerald-200`;
        if (status === 'Rechazado') return `${base} bg-red-100 text-red-700 border-red-200`;
        return `${base} bg-amber-100 text-amber-700 border-amber-200`;
    };

    const handleRejectClick = () => {
        if (onReject) {
            onReject(item);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-300">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isExpense ? 'max-w-5xl' : 'max-w-xl'} flex flex-col max-h-[92vh] overflow-hidden transform transition-all`}>

                {/* Header (Sticky-like) */}
                <div className="bg-white px-4 py-3 md:p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                        <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${isExpense ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isExpense ? <FileText size={18} /> : <DollarSign size={18} />}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 overflow-hidden">
                            <h3 className="text-base md:text-xl font-black text-slate-800 truncate">
                                {isExpense ? 'Detalle Gasto' : 'Detalle Anticipo'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                                    {txId(item.id, isExpense ? 'GASTO' : (item.type === 'Reembolso' ? 'REEMBOLSO' : 'ANTICIPO'))}
                                </span>
                                <span className={statusBadge(item.status)}>{item.status}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Single Scrollable Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
                    <div className="flex flex-col md:flex-row">

                        {/* Data Column */}
                        <div className={`w-full ${isExpense ? 'md:w-1/2 md:border-r border-slate-100' : 'w-full'} p-4 md:p-6 space-y-4 md:space-y-6`}>

                            {/* KPI - Amount */}
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    {isExpense ? 'Monto Total' : (item.amount_approved ? 'Monto Aprobado' : 'Monto Solicitado')}
                                </p>
                                <p className="text-3xl md:text-4xl font-black text-slate-900">
                                    {formatCurrency(isExpense ? item.amount : (item.amount_approved || item.amount_requested))}
                                </p>

                                {!isExpense && item.status !== 'Rechazado' && (
                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                        {(() => {
                                            if (!['Pagado', 'Comprobado'].includes(item.status)) {
                                                return <p className="text-xs font-bold text-slate-400 italic">Esperando pago...</p>;
                                            }
                                            const total = parseFloat(item.amount_approved || item.amount_requested || 0);
                                            const used = parseFloat(item.used_amount || 0);
                                            const balance = total - used;
                                            const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className={`text-lg md:text-xl font-bold ${balance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                                            {formatCurrency(balance)} por comprobar
                                                        </span>
                                                        <span className="text-[10px] font-black text-blue-500 uppercase">{Math.round(percent)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Approval Input if needed */}
                            {showApprovalActions && (
                                <div className="bg-blue-600 p-4 md:p-5 rounded-2xl shadow-lg shadow-blue-600/20">
                                    <label className="block text-xs font-black text-white/70 uppercase tracking-widest mb-2">
                                        Monto a Autorizar
                                    </label>
                                    <input
                                        type="number"
                                        value={approvedAmount}
                                        onChange={(e) => setApprovedAmount(e.target.value)}
                                        className="w-full bg-blue-700/30 border-transparent focus:bg-white focus:text-slate-900 rounded-xl px-4 py-3 text-xl font-black text-white transition-all placeholder:text-white/30"
                                        placeholder="0.00"
                                    />
                                </div>
                            )}

                            {/* Info Grid */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Concepto / Notas</p>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">
                                        {item.description || item.notes || '---'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100">
                                    <div className="p-3 md:p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Solicitante</p>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">{item.employee_name || item.user_name || 'Humberto Glez.'}</p>
                                    </div>
                                    <div className="p-3 md:p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Fecha Reg.</p>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">{formatDateTime(item.created_at || item.request_date)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                    <div className="p-3 md:p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Categoría</p>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">{item.category_name || item.category || 'Varios'}</p>
                                    </div>
                                    <div className="p-3 md:p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Empresa</p>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">{item.company_name || 'GRUPO INDUWELL'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Badges Row */}
                            <div className="flex flex-wrap gap-2">
                                {item.project && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black border border-blue-100">PROYECTO: {item.project}</span>}
                                {(item.cost_center_name || item.cost_center) && <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black border border-emerald-100">C.COSTOS: {item.cost_center_name || item.cost_center}</span>}
                            </div>

                            {item.status === 'Rechazado' && item.rejection_reason && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl">
                                    <p className="text-[10px] font-black text-red-400 uppercase mb-1">Motivo del Rechazo</p>
                                    <p className="text-sm font-bold text-red-800">{item.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        {/* Receipt Column (Mobile friendly) */}
                        {isExpense && item.file_path && (
                            <div className="w-full md:w-1/2 p-4 md:p-6 bg-slate-100/30 flex flex-col">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Comprobante Digital</h4>
                                    <a href={`${BASE_URL}/${item.file_path}`} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 hover:underline">ABRIR ORIGINAL ↗</a>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-inner overflow-hidden">
                                    <img
                                        src={`${BASE_URL}/${item.file_path}`}
                                        alt="Ticket"
                                        className="w-full h-auto max-h-[500px] object-contain rounded-xl"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer (Actions) */}
                <div className="bg-white p-4 md:p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                    {showApprovalActions ? (
                        <>
                            <button onClick={handleRejectClick} className="w-full sm:w-auto px-6 py-3 border-2 border-red-100 text-red-600 rounded-xl font-black text-xs hover:bg-red-50 transition-colors">RECHAZAR</button>
                            <button onClick={handleApproveClick} className="w-full sm:w-auto px-10 py-3 bg-green-600 text-white rounded-xl font-black text-xs shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all">
                                {item.status === 'Aprobado Director' ? `CONFIRMAR PAGO` : `AUTORIZAR GASTO`}
                            </button>
                        </>
                    ) : (
                        <div className="flex w-full sm:w-auto gap-2">
                            {canEdit && (
                                <button onClick={handleEdit} className="flex-1 sm:flex-none px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-xs border border-blue-100">EDITAR</button>
                            )}
                            <button onClick={onClose} className="flex-1 sm:flex-none px-10 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-colors">CERRAR</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;

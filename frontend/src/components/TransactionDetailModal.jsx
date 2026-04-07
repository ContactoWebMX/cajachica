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

    const handleRejectClick = () => {
        if (onReject) {
            onReject(item);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isExpense ? 'max-w-5xl' : 'max-w-3xl'} overflow-hidden transform transition-all scale-100 flex flex-col max-h-[95vh]`}>

                {/* Header */}
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isExpense ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isExpense ? <FileText size={20} /> : <DollarSign size={20} />}
                        </div>
                        Detalle de {isExpense ? 'Gasto' : 'Anticipo'}
                        <span className="text-sm font-mono bg-white text-slate-600 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                            {txId(item.id, isExpense ? 'GASTO' : (item.type === 'Reembolso' ? 'REEMBOLSO' : 'ANTICIPO'))}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                            ${['Aprobado Jefe', 'Aprobado Director', 'Pagado'].includes(item.status) ? 'bg-green-100 text-green-700 border border-green-200' :
                                item.status === 'Rechazado' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                            {item.status}
                        </span>
                    </h3>
                    <div className="flex gap-2">
                        {canEdit && (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-blue-600 text-sm font-semibold transition-all shadow-sm"
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Split Body */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-white">

                    {/* Left Column: Data & KPIs */}
                    <div className={`w-full ${isExpense ? 'md:w-1/2 border-r border-slate-100' : ''} p-6 overflow-y-auto space-y-6`}>

                        {/* KPI Cards Strip */}
                        <div className="flex gap-4">
                            <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    {isExpense ? 'Monto del Gasto' : (item.amount_approved ? 'Monto Aprobado' : 'Monto Solicitado')}
                                </p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {formatCurrency(isExpense ? item.amount : (item.amount_approved || item.amount_requested))}
                                </p>
                            </div>

                            {!isExpense && item.status !== 'Rechazado' && (
                                <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100/60 shadow-sm">
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Por Comprobar</p>
                                    <div className="flex flex-col gap-1.5">
                                        {(() => {
                                            if (!['Pagado', 'Comprobado'].includes(item.status)) {
                                                return <p className="text-lg font-bold text-slate-400 italic">Esperando pago</p>;
                                            }
                                            const total = parseFloat(item.amount_approved || item.amount_requested || 0);
                                            const used = parseFloat(item.used_amount || 0);
                                            const balance = total - used;
                                            const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                                            return (
                                                <>
                                                    <div className="flex justify-between items-end">
                                                        <span className={`text-2xl font-bold ${balance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                                            {formatCurrency(balance)}
                                                        </span>
                                                        <span className="text-sm font-medium text-blue-500">{Math.round(percent)}% listos</span>
                                                    </div>
                                                    <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden shadow-inner">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Approval Amount Input */}
                        {showApprovalActions && (
                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200">
                                <label className="block text-sm font-semibold text-blue-800 mb-2">
                                    Monto a Aprobar / Autorizar
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                                    <input
                                        type="number"
                                        value={approvedAmount}
                                        onChange={(e) => setApprovedAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-lg font-semibold text-slate-800 transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Core Details Grid */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex flex-col gap-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={16} /> Descripción / Notas
                                </p>
                                <p className="text-base text-slate-800 leading-relaxed">
                                    {item.description || item.notes || 'Sin descripción proporcionada.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100">
                                <div className="p-4 flex flex-col gap-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Calendar size={14} /> Fecha Solicitud</p>
                                    <p className="font-semibold text-slate-800">{new Date(item.date || item.request_date).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 flex flex-col gap-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><User size={14} /> Solicitante</p>
                                    <p className="font-semibold text-slate-800">{item.employee_name || item.user_name || 'Mi Usuario'}</p>
                                </div>
                                <div className="p-4 flex flex-col gap-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Tag size={14} /> Categoría / Origen</p>
                                    <p className="font-semibold text-slate-800">{item.category_name || item.category || (item.type || 'N/A')}</p>
                                </div>
                                <div className="p-4 flex flex-col gap-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Clock size={14} /> Registrado en Sist.</p>
                                    <p className="font-semibold text-slate-800 text-sm">{formatDateTime(item.created_at || item.request_date)}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 flex flex-wrap gap-2">
                                {item.project && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100/50 text-blue-700 border border-blue-200">
                                        <MapPin size={14} /> Proyecto: {item.project}
                                    </span>
                                )}
                                {(item.cost_center_name || item.cost_center) && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100/50 text-emerald-700 border border-emerald-200">
                                        <Hash size={14} /> C.C: {item.cost_center_name || item.cost_center}
                                    </span>
                                )}
                                {item.company_name && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-100/50 text-indigo-700 border border-indigo-200">
                                        <Building size={14} /> Empresa: {item.company_name}
                                    </span>
                                )}
                                {item.advance_id && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100/50 text-purple-700 border border-purple-200">
                                        Gastado de {txId(item.advance_id, 'ANTICIPO')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {item.status === 'Rechazado' && item.rejection_reason && (
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm flex gap-3 items-start">
                                <div className="p-2 bg-red-100 rounded-full text-red-600"><X size={16} /></div>
                                <div>
                                    <p className="text-red-700 text-sm font-bold uppercase tracking-wider mb-0.5">Motivo del Rechazo</p>
                                    <p className="text-red-900 font-medium">{item.rejection_reason}</p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Receipt Image */}
                    {isExpense && (
                        <div className="w-full md:w-1/2 bg-slate-100/50 p-6 overflow-y-auto flex flex-col items-center justify-center relative inner-shadow">
                            {item.file_path ? (
                                <div className="w-full flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-700 text-lg flex items-center gap-2"><FileText size={20} /> Comprobante Escaneado</h4>
                                        <a
                                            href={`${BASE_URL}/${item.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 border border-slate-200 shadow-sm text-sm font-semibold transition-all"
                                        >
                                            Abrir Original
                                        </a>
                                    </div>
                                    <div className="bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex-1 flex items-center justify-center min-h-[400px]">
                                        <img
                                            src={`${BASE_URL}/${item.file_path}`}
                                            alt="Comprobante"
                                            className="max-w-full max-h-full object-contain rounded-xl"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-10 opacity-50">
                                    <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                                        <FileText size={40} className="text-slate-400" />
                                    </div>
                                    <h4 className="text-slate-500 font-semibold text-lg">Gasto sin comprobante</h4>
                                    <p className="text-slate-400 text-sm mt-2 max-w-sm">
                                        No se subió ningún archivo digital para este gasto.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all shadow-sm"
                    >
                        {showApprovalActions ? 'Cancelar' : 'Cerrar Panel'}
                    </button>

                    {showApprovalActions && (
                        <>
                            <button
                                onClick={handleRejectClick}
                                className="px-6 py-2.5 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 font-bold transition-all shadow-sm"
                            >
                                Rechazar Solicitud
                            </button>
                            <button
                                onClick={handleApproveClick}
                                className="px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                            >
                                {item.status === 'Aprobado Director' ? `Pagar Ticket` : `Aprobar Formalmente`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;

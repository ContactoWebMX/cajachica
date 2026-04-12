import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { Printer, Eye, Filter, Wallet, X, FileText, DollarSign } from 'lucide-react';
import { printTicket } from '../utils/printTicket';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { formatCurrency, formatDateTime, txId } from '../utils/format';

const Transactions = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('expenses');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalType, setModalType] = useState(null);
    const { setPageTitle } = useOutletContext();
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'all'
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        setPageTitle('Transacciones');
    }, [setPageTitle]);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'All',
        search: ''
    });

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [expenseToPay, setExpenseToPay] = useState(null);

    const openModal = (item, type) => {
        setSelectedItem(item);
        setModalType(type);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setModalType(null);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', status: 'All', search: '' });
    };

    useEffect(() => {
        const fetchAll = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;
            setCurrentUser(user);

            setLoading(true);
            try {
                const params = new URLSearchParams();
                const isAdmin = ['admin', 'cajero', 'director'].includes(user.role?.toLowerCase());
                const isManager = ['manager', 'gerente'].includes(user.role?.toLowerCase());
                if (!isAdmin) {
                    params.append('user_id', user.id);
                    if (isManager) params.append('include_reports', 'true');
                }

                if (filters.startDate) params.append('start_date', filters.startDate);
                if (filters.endDate) params.append('end_date', filters.endDate);

                // If viewMode is 'pending', we override the status filter unless a specific non-final status is selected
                if (viewMode === 'pending' && filters.status === 'All') {
                    params.append('exclude_final', 'true'); // Custom backend param or we filter client-side
                } else if (filters.status && filters.status !== 'All') {
                    params.append('status', filters.status);
                }

                if (filters.search) params.append('search', filters.search);

                const queryString = params.toString();
                const [expensesRes, advancesRes] = await Promise.all([
                    api.get(`/expenses?${queryString}`),
                    api.get(`/advances?${queryString}`)
                ]);

                // Client-side filtering for 'pending' if backend doesn't support 'exclude_final'
                const filterPending = (list) => {
                    if (viewMode !== 'pending' || filters.status !== 'All') return list;
                    return list.filter(item => !['Pagado', 'Rechazado', 'Comprobado'].includes(item.status));
                };

                setExpenses(filterPending(expensesRes.data));
                setAdvances(filterPending(advancesRes.data));
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchAll, 300);
        return () => clearTimeout(timeoutId);
    }, [filters, viewMode]);

    const statusBadge = (status) => {
        const base = 'px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider';
        if (['Aprobado Jefe', 'Aprobado Director'].includes(status))
            return `${base} bg-blue-100 text-blue-700 border border-blue-200`;
        if (['Pagado', 'Comprobado'].includes(status))
            return `${base} bg-emerald-100 text-emerald-700 border border-emerald-200`;
        if (status === 'Rechazado') return `${base} bg-red-100 text-red-700 border border-red-200`;
        return `${base} bg-amber-100 text-amber-700 border border-amber-200`;
    };

    const TransactionCard = ({ item, type }) => {
        const isExpense = type === 'GASTO';
        const id = isExpense ? txId(item.id, 'GASTO') : txId(item.id, item.type === 'Reembolso' ? 'REEMBOLSO' : 'ANTICIPO');
        const amount = isExpense ? item.amount : item.amount_requested;
        const description = isExpense ? item.description : item.notes;
        const date = isExpense ? item.created_at : item.request_date;

        return (
            <div
                onClick={() => isExpense ? openModal(item, 'GASTO') : (item.type === 'Reembolso' ? navigate(`/reimbursements/${item.id}`) : openModal(item, 'ANTICIPO'))}
                className="bg-white p-4 border-b border-gray-100 active:bg-gray-50 transition-colors"
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-gray-400">{id}</span>
                        <span className={statusBadge(item.status)}>{item.status}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-black text-gray-900 leading-none">{formatCurrency(amount)}</span>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{formatDateTime(date)}</p>
                    </div>
                </div>

                <div className="text-sm font-bold text-gray-800 mb-2 leading-snug">
                    {description}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.company_name && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-100">E: {item.company_name}</span>}
                    {item.project && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded border border-blue-100">P: {item.project}</span>}
                    {item.category_name && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded whitespace-nowrap">{item.category_name}</span>}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">
                            {item.user_name?.charAt(0)}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{item.user_name}</span>
                    </div>

                    <div className="flex gap-2">
                        {item.status === 'Aprobado Director' && (currentUser?.role === 'Admin' || currentUser?.role === 'Cajero') && isExpense && (
                            <button onClick={(e) => { e.stopPropagation(); setExpenseToPay(item); setPaymentModalOpen(true); }}
                                className={`text-white p-2 rounded-lg shadow-sm ${item.advance_id ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                                <Wallet size={16} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); isExpense ? printTicket(item, 'GASTO') : printTicket({ ...item, amount: item.amount_approved || item.amount_requested, description: item.notes, date: item.request_date }, 'ANTICIPO'); }}
                            className="text-gray-400 p-2"><Printer size={16} /></button>
                    </div>
                </div>
            </div>
        );
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        if (!expenseToPay) return;
        try {
            await api.post(`/expenses/${expenseToPay.id}/pay`);
            alert('Procesado exitosamente.');
            setPaymentModalOpen(false);
            setExpenseToPay(null);
            setFilters(prev => ({ ...prev })); // re-fetch
        } catch (error) {
            alert('Error al procesar.');
        }
    };

    const unprovenBadge = (adv) => {
        if (!['Pagado', 'Comprobado'].includes(adv.status)) {
            return <span className="text-gray-400 font-medium text-[10px] italic">Esperando pago</span>;
        }
        const total = parseFloat(adv.amount_approved || adv.amount_requested || 0);
        const used = parseFloat(adv.used_amount || 0);
        const balance = total - used;
        const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;

        return (
            <div className="flex flex-col gap-1 w-full md:w-32">
                <div className="flex justify-between text-[10px] font-bold">
                    <span className={balance <= 0 ? "text-green-600" : "text-gray-500"}>{formatCurrency(balance)} rest.</span>
                    <span className="text-gray-400">{Math.round(percent)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div className={`h-1 rounded-full bg-primary`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando transacciones...</div>;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* View Mode & Filter Toggle Container */}
            <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-3">
                {/* Mode Selector */}
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setViewMode('pending')}
                        className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'pending' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Tareas Pendientes
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'all' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Historial Completo
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                {/* Quick Search */}
                <div className="relative w-full md:flex-1">
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Buscar ID, usuario o descripción..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-primary rounded-lg text-sm transition-all"
                    />
                    <Filter size={16} className="absolute left-3 top-2.5 text-gray-400" />
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${showFilters ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Filtros Avanzados
                </button>
            </div>

            {/* Mobile Filter Chips (Visible when 'all' is selected) */}
            {viewMode === 'all' && (
                <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar px-1">
                    {['All', 'Pendiente', 'Aprobado Jefe', 'Aprobado Director', 'Pagado', 'Rechazado'].map(s => (
                        <button
                            key={s}
                            onClick={() => handleFilterChange({ target: { name: 'status', value: s } })}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${filters.status === s ? 'bg-secondary border-secondary text-white' : 'bg-white border-gray-200 text-gray-500 italic'}`}
                        >
                            {s === 'All' ? 'Todos' : s}
                        </button>
                    ))}
                </div>
            )}

            {/* Advanced Filters Drawer */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Desde</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Hasta</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex items-end">
                        <button onClick={clearFilters} className="w-full text-sm font-bold py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-dashed border-red-200">Limpiar Todo</button>
                    </div>
                </div>
            )}

            {/* Content Tabs con Badges (UI/UX Mejorada) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                <div className="flex border-b border-gray-100">
                    <button
                        className={`flex-1 p-3 md:p-4 flex items-center justify-center gap-2 font-medium transition-all ${activeTab === 'expenses' ? 'text-primary border-b-2 border-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('expenses')}
                    >
                        <FileText size={18} className={activeTab === 'expenses' ? 'text-primary' : 'text-gray-400'} />
                        <span className="hidden sm:inline">Gastos</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm ${expenses.length > 0 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {expenses.length}
                        </span>
                    </button>
                    <button
                        className={`flex-1 p-3 md:p-4 flex items-center justify-center gap-2 font-medium transition-all ${activeTab === 'advances' ? 'text-primary border-b-2 border-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('advances')}
                    >
                        <DollarSign size={18} className={activeTab === 'advances' ? 'text-primary' : 'text-gray-400'} />
                        <span className="hidden sm:inline">Anticipos</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm ${advances.filter(a => a.type !== 'Reembolso').length > 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {advances.filter(a => a.type !== 'Reembolso').length}
                        </span>
                    </button>
                    <button
                        className={`flex-1 p-3 md:p-4 flex items-center justify-center gap-2 font-medium transition-all ${activeTab === 'reimbursements' ? 'text-primary border-b-2 border-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('reimbursements')}
                    >
                        <DollarSign size={18} className={activeTab === 'reimbursements' ? 'text-primary' : 'text-gray-400'} />
                        <span className="hidden sm:inline">Reembolsos</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm ${advances.filter(a => a.type === 'Reembolso').length > 0 ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {advances.filter(a => a.type === 'Reembolso').length}
                        </span>
                    </button>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden divide-y divide-gray-100">
                    {activeTab === 'expenses' && (
                        expenses.length === 0
                            ? <p className="p-10 text-center text-gray-400 text-sm">No hay pendientes.</p>
                            : expenses.map(exp => <TransactionCard key={exp.id} item={exp} type="GASTO" />)
                    )}
                    {activeTab === 'advances' && (
                        advances.filter(a => a.type !== 'Reembolso').length === 0
                            ? <p className="p-10 text-center text-gray-400 text-sm">No hay pendientes.</p>
                            : advances.filter(a => a.type !== 'Reembolso').map(adv => <TransactionCard key={adv.id} item={adv} type="ANTICIPO" />)
                    )}
                    {activeTab === 'reimbursements' && (
                        advances.filter(a => a.type === 'Reembolso').length === 0
                            ? <p className="p-10 text-center text-gray-400 text-sm">No hay pendientes.</p>
                            : advances.filter(a => a.type === 'Reembolso').map(reim => <TransactionCard key={reim.id} item={reim} type="REEMBOLSO" />)
                    )}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    {activeTab === 'expenses' && expenses.length > 0 && (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Registrado</th>
                                    <th className="px-6 py-3">Usuario</th>
                                    <th className="px-6 py-3">Descripción</th>
                                    <th className="px-6 py-3">Monto</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openModal(exp, 'GASTO')}>
                                        <td className="px-6 py-4 text-[10px] font-mono font-bold text-gray-500">{txId(exp.id, 'GASTO')}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(exp.created_at)}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-700">{exp.user_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 mb-1">{exp.description}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {exp.company_name && <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">E: {exp.company_name}</span>}
                                                {exp.project && <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">P: {exp.project}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">{formatCurrency(exp.amount)}</td>
                                        <td className="px-6 py-4"><span className={statusBadge(exp.status)}>{exp.status}</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                {exp.status === 'Aprobado Director' && (currentUser?.role === 'Admin' || currentUser?.role === 'Cajero') && (
                                                    <button onClick={(e) => { e.stopPropagation(); setExpenseToPay(exp); setPaymentModalOpen(true); }}
                                                        className={`text-white p-2 rounded-lg shadow-sm ${exp.advance_id ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                                                        <Wallet size={16} />
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); printTicket(exp, 'GASTO'); }} className="text-gray-400 hover:text-primary p-2 transition-colors"><Printer size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal(exp, 'GASTO'); }} className="text-gray-400 hover:text-blue-600 p-2 transition-colors"><Eye size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {activeTab === 'advances' && advances.filter(a => a.type !== 'Reembolso').length > 0 && (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Registrado</th>
                                    <th className="px-6 py-3">Motivo</th>
                                    <th className="px-6 py-3">Aprobado</th>
                                    <th className="px-6 py-3">Comprobación</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {advances.filter(a => a.type !== 'Reembolso').map(adv => (
                                    <tr key={adv.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openModal(adv, 'ANTICIPO')}>
                                        <td className="px-6 py-4 text-[10px] font-mono font-bold text-gray-500">{txId(adv.id, 'ANTICIPO')}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(adv.request_date)}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 mb-1">{adv.notes}</div>
                                            <span className="text-[10px] text-gray-400 italic">Solicitado por: {adv.user_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">{formatCurrency(adv.amount_approved || adv.amount_requested)}</td>
                                        <td className="px-6 py-4">{unprovenBadge(adv)}</td>
                                        <td className="px-6 py-4"><span className={statusBadge(adv.status)}>{adv.status}</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={(e) => { e.stopPropagation(); printTicket({ ...adv, amount: adv.amount_approved || adv.amount_requested, description: adv.notes, date: adv.request_date }, 'ANTICIPO'); }} className="text-gray-400 hover:text-primary p-2 transition-colors"><Printer size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Reconciliation Modal */}
            {paymentModalOpen && expenseToPay && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-secondary leading-tight">
                                {expenseToPay.advance_id ? 'Validar Comprobante' : 'Entregar Efectivo'}
                            </h3>
                            <button onClick={() => setPaymentModalOpen(false)} className="bg-gray-100 p-1.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 mb-6 relative overflow-hidden">
                            <div className="relative z-10 text-right">
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-1">Monto a Operar</p>
                                <p className={`text-4xl font-black ${expenseToPay.advance_id ? 'text-indigo-600' : 'text-purple-600'}`}>
                                    {formatCurrency(expenseToPay.amount)}
                                </p>
                            </div>
                            <div className="absolute top-1 left-2 opacity-10">
                                <Wallet size={80} className="text-gray-400" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Beneficiario</p>
                                <p className="font-bold text-gray-800">{expenseToPay.user_name}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleProcessPayment}
                            className={`w-full text-white py-4 rounded-xl font-black shadow-lg transition-transform active:scale-[0.98] ${expenseToPay.advance_id ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            CONFIRMAR OPERACIÓN
                        </button>
                    </div>
                </div>
            )}

            <TransactionDetailModal
                isOpen={!!selectedItem}
                onClose={closeModal}
                item={selectedItem}
                type={modalType}
            />
        </div>
    );
};

export default Transactions;

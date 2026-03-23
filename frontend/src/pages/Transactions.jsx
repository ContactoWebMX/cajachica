import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { Printer, Eye, Filter, Wallet, X } from 'lucide-react';
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
                // Permission logic: same as Dashboard
                const isAdmin = ['admin', 'cajero', 'director'].includes(user.role?.toLowerCase());
                const isManager = ['manager', 'gerente'].includes(user.role?.toLowerCase());
                if (!isAdmin) {
                    params.append('user_id', user.id);
                    if (isManager) {
                        params.append('include_reports', 'true');
                    }
                }

                if (filters.startDate) params.append('start_date', filters.startDate);
                if (filters.endDate) params.append('end_date', filters.endDate);
                if (filters.status && filters.status !== 'All') params.append('status', filters.status);
                if (filters.search) params.append('search', filters.search);

                const queryString = params.toString();
                const [expensesRes, advancesRes] = await Promise.all([
                    api.get(`/expenses?${queryString}`),
                    api.get(`/advances?${queryString}`)
                ]);

                setExpenses(expensesRes.data);
                setAdvances(advancesRes.data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchAll, 300);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    const statusBadge = (status) => {
        const base = 'px-2 py-1 rounded-full text-xs font-semibold';
        if (['Aprobado Jefe', 'Aprobado Director', 'Pagado'].includes(status))
            return `${base} bg-green-100 text-green-700`;
        if (status === 'Rechazado') return `${base} bg-red-100 text-red-700`;
        return `${base} bg-yellow-100 text-yellow-700`;
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        if (!expenseToPay) return;

        try {
            await api.post(`/expenses/${expenseToPay.id}/pay`);
            alert('Gasto reembolsado y registrado en caja exitosamente.');
            setPaymentModalOpen(false);
            setExpenseToPay(null);
            // Trigger a re-fetch of the tables
            const syntheticEvent = { target: { name: 'status', value: filters.status } };
            handleFilterChange(syntheticEvent);
        } catch (error) {
            alert('Error al procesar el pago del gasto.');
            console.error(error);
        }
    };

    const unprovenBadge = (adv) => {
        if (!['Pagado', 'Comprobado'].includes(adv.status)) {
            return <span className="text-gray-400 font-medium text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-100 italic">Esperando pago</span>;
        }
        const total = parseFloat(adv.amount_approved || adv.amount_requested || 0);
        const used = parseFloat(adv.used_amount || 0);
        const balance = total - used;
        const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;

        return (
            <div className="flex flex-col gap-1 w-32">
                <div className="flex justify-between text-xs font-medium">
                    <span className={balance <= 0 ? "text-green-600" : "text-gray-600"}>
                        {formatCurrency(balance)} rest.
                    </span>
                    <span className="text-gray-400">{Math.round(percent)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 dark:bg-gray-200 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${percent === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando transacciones...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                >
                    {showFilters ? <X size={16} /> : <Filter size={16} />}
                    Filtros
                </button>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 flex w-full flex-col sm:flex-row gap-3">
                        <input type="date" name="startDate" value={filters.startDate}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border rounded-lg text-sm flex-1" title="Fecha Inicio" />
                        <input type="date" name="endDate" value={filters.endDate}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border rounded-lg text-sm flex-1" title="Fecha Fin" />
                        <select name="status" value={filters.status} onChange={handleFilterChange}
                            className="px-3 py-2 border rounded-lg text-sm bg-white flex-1">
                            <option value="All">Todos los Estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Aprobado Jefe">Aprobado Jefe</option>
                            <option value="Aprobado Director">Aprobado Director</option>
                            <option value="Rechazado">Rechazado</option>
                            <option value="Pagado">Pagado</option>
                        </select>
                        <input type="text" name="search" value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Buscar..."
                            className="px-3 py-2 border rounded-lg text-sm flex-1" />
                    </div>
                    {(filters.startDate || filters.endDate || filters.status !== 'All' || filters.search) && (
                        <div className="flex items-end sm:items-center justify-end">
                            <button onClick={clearFilters}
                                className="text-sm px-4 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap">
                                Limpiar Filtros
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Transaction Tables */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b">
                    {['expenses', 'advances', 'reimbursements'].map((tab, i) => (
                        <button key={tab}
                            className={`flex-1 p-4 text-center font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab(tab)}>
                            {['Gastos', 'Anticipos', 'Reembolsos'][i]}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    {/* ── GASTOS ── */}
                    {activeTab === 'expenses' && (
                        expenses.length === 0
                            ? <p className="p-6 text-center text-gray-500">No hay gastos registrados que coincidan con los filtros.</p>
                            : <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-700">ID</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Registrado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Usuario</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Descripción</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Monto</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Estado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expenses.map(exp => (
                                        <tr key={exp.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => openModal(exp, 'GASTO')}>
                                            <td className="px-6 py-3 text-xs font-mono font-bold text-gray-500 whitespace-nowrap">{txId(exp.id, 'GASTO')}</td>
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-600">{formatDateTime(exp.created_at)}</td>
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-700 font-medium">{exp.user_name}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-bold text-gray-900 mb-1 leading-tight">{exp.description}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {exp.advance_id && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                            {txId(exp.advance_id, 'ANTICIPO')}
                                                        </span>
                                                    )}
                                                    {exp.category_name && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                                            {exp.category_name}
                                                        </span>
                                                    )}
                                                    {exp.company_name && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            E: {exp.company_name}
                                                        </span>
                                                    )}
                                                    {exp.project && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                            P: {exp.project}
                                                        </span>
                                                    )}
                                                    {exp.cost_center_name && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            CC: {exp.cost_center_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={statusBadge(exp.status)}>{exp.status}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {/* Botones de Cajero: Pagar Efectivo o Registrar Comprobante */}
                                                {exp.status === 'Aprobado Director' && (currentUser?.role === 'Admin' || currentUser?.role === 'Cajero') && (
                                                    <button onClick={(e) => { e.stopPropagation(); setExpenseToPay(exp); setPaymentModalOpen(true); }}
                                                        className={`text-white font-medium px-3 py-1.5 rounded-lg shadow-sm mr-2 transition-colors inline-flex items-center gap-1 text-xs ${exp.advance_id ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                                        title={exp.advance_id ? "Registrar Comprobante" : "Pagar Efectivo"}>
                                                        <Wallet size={14} /> {exp.advance_id ? "Comprobar" : "Pagar"}
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); printTicket(exp, 'GASTO'); }}
                                                    className="text-gray-400 hover:text-primary p-2 rounded-full hover:bg-blue-50 transition-colors"
                                                    title="Imprimir Ticket"><Printer size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal(exp, 'GASTO'); }}
                                                    className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                                    title="Ver Comprobante"><Eye size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    )}

                    {/* ── ANTICIPOS ── */}
                    {activeTab === 'advances' && (
                        advances.filter(a => a.type !== 'Reembolso').length === 0
                            ? <p className="p-6 text-center text-gray-500">No hay anticipos registrados que coincidan con los filtros.</p>
                            : <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-700">ID</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Registrado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Usuario</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Motivo</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Solicitado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Aprobado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Por Comprobar</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Estado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {advances.filter(a => a.type !== 'Reembolso').map(adv => (
                                        <tr key={adv.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => openModal(adv, 'ANTICIPO')}>
                                            <td className="px-6 py-3 text-xs font-mono font-bold text-gray-500 whitespace-nowrap">{txId(adv.id, 'ANTICIPO')}</td>
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-600">{formatDateTime(adv.request_date)}</td>
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-700 font-medium">{adv.user_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="font-medium text-gray-900 mb-1 leading-tight truncate max-w-xs" title={adv.notes}>{adv.notes}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {adv.company_name && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            E: {adv.company_name}
                                                        </span>
                                                    )}
                                                    {adv.project && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                            P: {adv.project}
                                                        </span>
                                                    )}
                                                    {adv.cost_center_name && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            CC: {adv.cost_center_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium whitespace-nowrap">{formatCurrency(adv.amount_requested)}</td>
                                            <td className="px-6 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                                                {adv.amount_approved ? formatCurrency(adv.amount_approved) : '-'}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                {unprovenBadge(adv)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={statusBadge(adv.status)}>{adv.status}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    printTicket({ ...adv, amount: adv.amount_approved || adv.amount_requested, description: adv.notes, date: adv.request_date }, 'ANTICIPO');
                                                }}
                                                    className="text-gray-400 hover:text-primary p-2 rounded-full hover:bg-blue-50 transition-colors"
                                                    title="Imprimir Ticket"><Printer size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    )}

                    {/* ── REEMBOLSOS ── */}
                    {activeTab === 'reimbursements' && (
                        advances.filter(a => a.type === 'Reembolso').length === 0
                            ? <p className="p-6 text-center text-gray-500">No hay solicitudes de reembolso registradas.</p>
                            : <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-700">ID</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Registrado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Usuario</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Concepto</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Monto</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Estado</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {advances.filter(a => a.type === 'Reembolso').map(reim => (
                                        <tr key={reim.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => navigate(`/reimbursements/${reim.id}`)}>
                                            <td className="px-6 py-3 text-xs font-mono font-bold text-gray-500 whitespace-nowrap">{txId(reim.id, 'REEMBOLSO')}</td>
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-600">{formatDateTime(reim.request_date)}</td>
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-700 font-medium">{reim.user_name}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-xs">{reim.notes}</td>
                                            <td className="px-6 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(reim.amount_requested)}</td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={statusBadge(reim.status)}>{reim.status}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    printTicket({ ...reim, amount: reim.amount_requested, description: reim.notes, date: reim.request_date, type: 'Reembolso' }, 'ANTICIPO');
                                                }}
                                                    className="text-gray-400 hover:text-primary p-2 rounded-full hover:bg-blue-50 transition-colors"
                                                    title="Imprimir Solicitud"><Printer size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    )}
                </div>
            </div>

            {/* Payment / Reconciliation Modal */}
            {paymentModalOpen && expenseToPay && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {expenseToPay.advance_id ? 'Registrar Comprobante' : 'Reembolsar Gasto'}
                            </h3>
                            <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">
                            {expenseToPay.advance_id
                                ? 'Estás a punto de dar por comprobado este ticket válido. Esto no generará salida de efectivo en caja ya que ampara un anticipo entregado previamente.'
                                : 'Estás a punto de registrar la entrega física de efectivo para reembolsar este gasto de bolsillo al empleado.'}
                        </p>
                        <form onSubmit={handleProcessPayment} className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Beneficiario</p>
                                <p className="font-bold text-gray-800 text-lg">{expenseToPay.user_name}</p>
                                <div className="mt-2 text-right">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
                                        {expenseToPay.advance_id ? 'Monto a Comprobar' : 'Monto a Entregar'}
                                    </p>
                                    <p className={`text-2xl font-black ${expenseToPay.advance_id ? 'text-indigo-600' : 'text-purple-600'}`}>
                                        {formatCurrency(expenseToPay.amount)}
                                    </p>
                                </div>
                            </div>
                            <button type="submit" className={`w-full text-white py-3 rounded-lg font-bold shadow-md transition-colors mt-2 text-sm ${expenseToPay.advance_id ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                {expenseToPay.advance_id ? 'Confirmar Comprobación' : 'Confirmar Entrega de Efectivo'}
                            </button>
                        </form>
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

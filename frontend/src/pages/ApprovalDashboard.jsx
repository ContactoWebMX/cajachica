import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle, Clock, Printer, DollarSign, FileText, Search, Tag, Building, Filter, X } from 'lucide-react';
import { printTicket } from '../utils/printTicket';
import RejectionReasonModal from '../components/RejectionReasonModal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import PrintTicket from '../components/PrintTicket';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

const ApprovalDashboard = () => {
    const { setPageTitle } = useOutletContext();
    const [expenses, setExpenses] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const MANAGER_ID = user.id || 1;
    const roleName = user.role?.toLowerCase() || '';

    const [isAdmin, setIsAdmin] = useState(['admin', 'gerente', 'director'].includes(roleName));
    const [isCashier, setIsCashier] = useState(roleName === 'cajero');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [itemToReject, setItemToReject] = useState(null);
    const [rejectType, setRejectType] = useState(null);
    const [paidTicket, setPaidTicket] = useState(null);
    const [showPayConfirm, setShowPayConfirm] = useState(false);
    const [paymentItemToConfirm, setPaymentItemToConfirm] = useState(null);
    const [paymentItemType, setPaymentItemType] = useState(null); // 'GASTO' | 'ANTICIPO'
    const [activeTab, setActiveTab] = useState('expenses');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const filterItem = (item) => {
        const term = searchTerm.toLowerCase();
        const amount = item.amount || item.amount_requested || 0;
        return (
            (item.employee_name && item.employee_name.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term)) ||
            (item.notes && item.notes.toLowerCase().includes(term)) ||
            (item.project && item.project.toLowerCase().includes(term)) ||
            (item.category && typeof item.category === 'string' && item.category.toLowerCase().includes(term)) ||
            (item.cost_center && typeof item.cost_center === 'string' && item.cost_center.toLowerCase().includes(term)) ||
            amount.toString().includes(term)
        );
    };

    const filteredExpenses = Array.isArray(expenses) ? expenses.filter(filterItem) : [];
    const filteredAdvances = Array.isArray(advances) ? advances.filter(filterItem) : [];

    const openModal = (item, type) => {
        setSelectedItem(item);
        setModalType(type);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setModalType(null);
    };

    const openRejectionModal = (item, type) => {
        setItemToReject(item);
        setRejectType(type);
        setRejectionModalOpen(true);
    };

    const closeRejectionModal = () => {
        setRejectionModalOpen(false);
        setItemToReject(null);
        setRejectType(null);
    };

    const confirmRejection = (reason) => {
        if (rejectType === 'GASTO') {
            handleAction(itemToReject.id, 'reject', null, reason);
        } else {
            processAdvance(itemToReject, 'reject', null, reason);
        }
    };

    useEffect(() => {
        setPageTitle('Aprobaciones Pendientes');
        // Check if user is admin/director (Simulated)
        // setIsAdmin(user.role === 'Admin'); // Removed auto-set to allow manual toggle testing
        fetchPending();
    }, [isAdmin, setPageTitle]);

    const fetchPending = async () => {
        try {
            let status = 'Pendiente';
            if (isCashier) {
                status = 'Aprobado Director';
            } else if (isAdmin) {
                status = (roleName === 'admin') ? 'AdminPending' : 'Aprobado Jefe';
            }
            const [expRes, advRes] = await Promise.all([
                api.get(`/approvals/pending?manager_id=${MANAGER_ID}&status=${status}`),
                api.get(`/approvals/pending-advances?manager_id=${MANAGER_ID}&status=${status}`)
            ]);
            setExpenses(expRes.data);
            setAdvances(advRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, amount = null, reason = null) => {
        if (action === 'reject' && !reason) {
            // New flow: open modal instead of prompt
            const item = expenses.find(e => e.id === id);
            openRejectionModal(item, 'GASTO');
            return;
        }

        try {
            const item = expenses.find(e => e.id === id);
            const actionToSend = action === 'approve' ? (item?.status === 'Aprobado Director' ? 'Pagar' : 'Aprobado') : 'Rechazado';
            await api.post(`/approvals/${id}/action`, {
                action: actionToSend,
                manager_id: MANAGER_ID,
                amount_approved: amount,
                rejection_reason: reason
            });
            fetchPending();
            if (actionToSend === 'Pagar') {
                setPaidTicket({ item, isExpense: true });
            }
        } catch (error) {
            alert('Error procesando la solicitud');
        }
    };

    // Better handleAdvanceAction
    const processAdvance = async (advance, action, amount = null, reason = null) => {
        if (action === 'reject' && !reason) {
            // New flow: open modal instead of prompt
            openRejectionModal(advance, 'ANTICIPO');
            return;
        }

        try {
            const actionToSend = action === 'approve' ? (advance.status === 'Aprobado Director' ? 'Pagado' : 'Aprobado') : 'Rechazado';
            await api.put(`/advances/${advance.id}/approve`, {
                status: actionToSend,
                amount_approved: action === 'approve' ? (amount || advance.amount_requested) : 0,
                notes: action === 'approve' ? 'Aprobado/Pagado desde Dashboard' : 'Rechazado',
                rejection_reason: reason,
                manager_id: MANAGER_ID
            });
            fetchPending();
            if (actionToSend === 'Pagado') {
                setPaidTicket({ item: advance, isExpense: false });
            }
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || 'Desconocido'));
        }
    };

    const handleModalApprove = (item, amount) => {
        closeModal();
        if (item.status === 'Aprobado Director') {
            setPaymentItemToConfirm(item);
            setPaymentItemType(modalType);
            setShowPayConfirm(true);
        } else {
            if (modalType === 'GASTO') {
                handleAction(item.id, 'approve', amount);
            } else {
                processAdvance(item, 'approve', amount);
            }
        }
    };

    const handleDashboardApprove = (item, type) => {
        if (item.status === 'Aprobado Director') {
            setPaymentItemToConfirm(item);
            setPaymentItemType(type);
            setShowPayConfirm(true);
        } else {
            if (type === 'GASTO') {
                handleAction(item.id, 'approve');
            } else {
                processAdvance(item, 'approve');
            }
        }
    };

    const confirmPayment = () => {
        if (!paymentItemToConfirm) return;
        if (paymentItemType === 'GASTO') {
            handleAction(paymentItemToConfirm.id, 'approve');
        } else {
            processAdvance(paymentItemToConfirm, 'approve');
        }
        setShowPayConfirm(false);
        setPaymentItemToConfirm(null);
        setPaymentItemType(null);
    };

    const handleModalReject = (item) => {
        // Close detail modal and open rejection modal
        closeModal();
        if (modalType === 'GASTO') {
            openRejectionModal(item, 'GASTO');
        } else {
            openRejectionModal(item, 'ANTICIPO');
        }
    };

    if (loading) return <div>Cargando solicitudes...</div>;

    return (
        <div className="w-full space-y-8">
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-secondary">
                    Panel de Aprobaciones
                </h2>
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
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 mb-6 transition-all duration-300 transform origin-top w-full">
                    <div className="flex-1 flex w-full flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por empleado, monto, concepto..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={isAdmin}
                                onChange={e => { setIsAdmin(e.target.checked); setIsCashier(false); }}
                                className="form-checkbox text-blue-600 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700 select-none whitespace-nowrap">Vista Director</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={isCashier}
                                onChange={e => { setIsCashier(e.target.checked); setIsAdmin(false); }}
                                className="form-checkbox text-green-600 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700 select-none whitespace-nowrap">Vista Cajero</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="flex border-b border-gray-100">
                    <button
                        className={`flex-1 p-4 text-center font-medium transition-colors ${activeTab === 'expenses' ? 'text-primary border-b-2 border-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('expenses')}
                    >
                        Gastos ({filteredExpenses.length})
                    </button>
                    <button
                        className={`flex-1 p-4 text-center font-medium transition-colors ${activeTab === 'advances' ? 'text-primary border-b-2 border-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('advances')}
                    >
                        Anticipos ({filteredAdvances.filter(a => a.type !== 'Reembolso').length})
                    </button>
                    <button
                        className={`flex-1 p-4 text-center font-medium transition-colors ${activeTab === 'reimbursements' ? 'text-primary border-b-2 border-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('reimbursements')}
                    >
                        Reembolsos ({filteredAdvances.filter(a => a.type === 'Reembolso').length})
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'expenses' && (
                <section>
                    <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                        <FileText className="text-orange-600" /> Gastos Pendientes
                    </h2>
                    {filteredExpenses.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-8">No se encontraron gastos que coincidan con tu búsqueda.</p>
                    ) : (
                        <div className="grid gap-4">
                            {filteredExpenses.map(expense => (
                                <div key={expense.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center transition-colors hover:shadow-md">
                                    <div className="flex-1 cursor-pointer" onClick={() => openModal(expense, 'GASTO')}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-lg text-gray-800">{expense.employee_name}</span>
                                            <span className="text-sm text-gray-500">• {new Date(expense.date).toLocaleDateString()}</span>
                                            {expense.project && (
                                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Tag size={12} /> {expense.project}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <p className="text-2xl font-bold text-primary">{formatCurrency(expense.amount)}</p>
                                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Monto a Aprobar</span>
                                        </div>
                                        <p className="text-gray-600 mb-3">{expense.description}</p>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                                <Tag size={12} /> {expense.category || 'Sin Categoría'}
                                            </span>
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                                                <Building size={12} /> {expense.cost_center || 'Sin CC'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-0 flex gap-3 ml-4">
                                        <button
                                            onClick={() => printTicket(expense, 'GASTO')}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleAction(expense.id, 'reject')}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <XCircle size={18} /> Rechazar
                                        </button>
                                        <button
                                            onClick={() => handleDashboardApprove(expense, 'GASTO')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        >
                                            <CheckCircle size={18} /> {expense.status === 'Aprobado Director' ? 'Pagar' : 'Aprobar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'advances' && (
                <section>
                    <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                        <DollarSign className="text-blue-600" /> Anticipos Pendientes
                    </h2>
                    {filteredAdvances.filter(a => a.type !== 'Reembolso').length === 0 ? (
                        <p className="text-gray-500 italic text-center py-8">No se encontraron anticipos que coincidan.</p>
                    ) : (
                        <div className="grid gap-4">
                            {filteredAdvances.filter(a => a.type !== 'Reembolso').map(adv => (
                                <div key={adv.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center transition-colors hover:shadow-md">
                                    <div className="flex-1 cursor-pointer" onClick={() => openModal(adv, 'ANTICIPO')}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-lg text-gray-800">{adv.employee_name}</span>
                                            <span className="text-sm text-gray-500">• {new Date(adv.request_date).toLocaleDateString()}</span>
                                            {adv.project && (
                                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Tag size={12} /> {adv.project}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <p className="text-2xl font-bold text-primary">{formatCurrency(adv.amount_requested)}</p>
                                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Monto a Aprobar</span>
                                        </div>
                                        <p className="text-gray-600">{adv.notes}</p>
                                    </div>
                                    <div className="flex gap-3 mt-4 md:mt-0 ml-4">
                                        <button
                                            onClick={() => printTicket({ ...adv, amount: adv.amount_requested, description: adv.notes, date: adv.request_date }, 'ANTICIPO')}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            onClick={() => processAdvance(adv, 'reject')}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            onClick={() => handleDashboardApprove(adv, 'ANTICIPO')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            {adv.status === 'Aprobado Director' ? 'Pagar' : 'Aprobar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'reimbursements' && (
                <section>
                    <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                        <DollarSign className="text-purple-600" /> Reembolsos Pendientes
                    </h2>
                    {filteredAdvances.filter(a => a.type === 'Reembolso').length === 0 ? (
                        <p className="text-gray-500 italic text-center py-8">No se encontraron reembolsos que coincidan.</p>
                    ) : (
                        <div className="grid gap-4">
                            {filteredAdvances.filter(a => a.type === 'Reembolso').map(reim => (
                                <div key={reim.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center transition-colors hover:shadow-md">
                                    <div className="flex-1 cursor-pointer" onClick={() => window.location.href = `/reimbursements/${reim.id}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-lg text-gray-800">{reim.employee_name}</span>
                                            <span className="text-sm text-gray-500">• {new Date(reim.request_date).toLocaleDateString()}</span>
                                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Reembolso</span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <p className="text-2xl font-bold text-primary">{formatCurrency(reim.amount_requested)}</p>
                                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Monto a Aprobar</span>
                                        </div>
                                        <p className="text-gray-600">{reim.notes}</p>
                                    </div>
                                    <div className="flex gap-3 mt-4 md:mt-0 ml-4">
                                        <button
                                            onClick={() => printTicket({ ...reim, amount: reim.amount_requested, description: reim.notes, date: reim.request_date, type: 'Reembolso' }, 'ANTICIPO')}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            onClick={() => processAdvance(reim, 'reject')}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            onClick={() => handleDashboardApprove(reim, 'ANTICIPO')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            {reim.status === 'Aprobado Director' ? 'Pagar' : 'Aprobar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <TransactionDetailModal
                isOpen={!!selectedItem}
                onClose={closeModal}
                item={selectedItem}
                type={modalType}
                onApprove={handleModalApprove}
                onReject={handleModalReject}
            />

            <RejectionReasonModal
                isOpen={rejectionModalOpen}
                onClose={closeRejectionModal}
                onConfirm={confirmRejection}
            />

            {showPayConfirm && paymentItemToConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Confirmar Pago</h3>
                        <p className="text-gray-600 mt-4 mb-6 text-sm">
                            ¿Está totalmente seguro de registrar el pago de este {paymentItemType === 'GASTO' ? 'Gasto' : 'Anticipo/Reembolso'} por <b className="text-lg text-black">{formatCurrency(paymentItemToConfirm.amount_approved || paymentItemToConfirm.amount_requested || paymentItemToConfirm.amount || 0)}</b>?
                            <br /><br />
                            Esta acción descontará los fondos y emitirá el comprobante.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowPayConfirm(false);
                                    setPaymentItemToConfirm(null);
                                    setPaymentItemType(null);
                                }}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmPayment}
                                className="px-4 py-2 bg-green-600 font-bold text-white rounded-lg hover:bg-green-700 shadow-md transition"
                            >
                                Sí, Pagar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paidTicket && (
                <PrintTicket
                    item={paidTicket.item}
                    isExpense={paidTicket.isExpense}
                    cashierName={user.name}
                    onClose={() => setPaidTicket(null)}
                />
            )}
        </div >
    );
};

export default ApprovalDashboard;

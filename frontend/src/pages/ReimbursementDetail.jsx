import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Printer, CheckCircle, XCircle, DollarSign, Clock } from 'lucide-react';
import { printTicket } from '../utils/printTicket';
import PrintTicket from '../components/PrintTicket';
import { formatCurrency } from '../utils/format';

const ReimbursementDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();
    const [reimbursement, setReimbursement] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setPageTitle(`Solicitud de Reembolso #${id}`);
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);

        const fetchDetails = async () => {
            try {
                const res = await api.get(`/advances/detail/${id}`);
                setReimbursement(res.data);
            } catch (error) {
                console.error('Error fetching reimbursement:', error);
                // If 404 or error, reimbursement stays null which shows "Not found"
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const handleApprove = async () => {
        try {
            await api.put(`/advances/${id}/approve`, {
                status: 'Aprobado',
                amount_approved: reimbursement.amount_requested,
                notes: reimbursement.notes
            });
            alert('Reembolso aprobado.');
            window.location.reload();
        } catch (error) {
            console.error('Error approving:', error);
            alert('Error al aprobar.');
        }
    };

    const handleReject = async () => {
        try {
            await api.put(`/advances/${id}/approve`, {
                status: 'Rechazado',
                amount_approved: 0,
                notes: 'Rechazado por directiva'
            });
            alert('Reembolso rechazado.');
            navigate('/');
        } catch (error) {
            console.error('Error rejecting:', error);
        }
    };

    const [showPayConfirm, setShowPayConfirm] = useState(false);
    const [paidTicket, setPaidTicket] = useState(null);

    const handlePayClick = () => {
        setShowPayConfirm(true);
    };

    const confirmPay = async () => {
        try {
            await api.put(`/advances/${id}/approve`, {
                status: 'Pagado',
                amount_approved: reimbursement.amount_approved,
                notes: reimbursement.notes
            });
            setShowPayConfirm(false);
            setPaidTicket({ item: reimbursement, isExpense: false });
        } catch (error) {
            console.error('Error paying:', error);
            alert('Error al procesar pago.');
        } finally {
            setShowPayConfirm(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;
    if (!reimbursement) return <div className="p-10 text-center text-red-500">Solicitud no encontrada.</div>;

    const steps = [
        { label: 'Solicitado', active: true, date: reimbursement.request_date },
        { label: 'Aprobado Director', active: ['Aprobado Director', 'Pagado', 'Comprobado'].includes(reimbursement.status) },
        // Logic: Approval creates the balance offset.
        { label: 'Pagado', active: ['Pagado', 'Comprobado'].includes(reimbursement.status) }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-accent font-medium transition-colors flex items-center gap-2">
                        <ArrowLeft size={20} /> Volver
                    </button>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => printTicket({ ...reimbursement, type: 'Reembolso' }, 'ANTICIPO')}
                        className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                        <Printer size={18} />
                        <span>Imprimir</span>
                    </button>

                    {/* Pay Button for Finance/Admin/Cajero if Approved Director */}
                    {reimbursement.status === 'Aprobado Director' && ['Admin', 'Finance', 'Cajero'].includes(currentUser?.role) && (
                        <button onClick={handlePayClick} className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                            <DollarSign size={18} />
                            <span>Pagar Reembolso</span>
                        </button>
                    )}

                    {/* Actions for Manager */}
                    {['Pendiente', 'Aprobado Jefe'].includes(reimbursement.status) && ['Admin', 'Manager', 'Gerente', 'Director'].includes(currentUser?.role) && (
                        <>
                            <button onClick={handleReject} className="flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200">
                                <XCircle size={18} />
                                <span>Rechazar</span>
                            </button>
                            <button onClick={handleApprove} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                <CheckCircle size={18} />
                                <span>Aprobar</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 w-full">
                {/* Status Bar */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                    <div className="flex justify-between relative">
                        {/* Progress Bar Background */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 -translate-y-1/2 rounded"></div>
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-green-500 -z-0 -translate-y-1/2 rounded transition-all duration-500"
                            style={{ width: `${(steps.filter(s => s.active).length - 1) / (steps.length - 1) * 100}%` }}
                        ></div>

                        {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                                    ${step.active ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                    {step.active ? <CheckCircle size={16} /> : <span>{index + 1}</span>}
                                </div>
                                <span className={`mt-2 text-sm font-medium ${step.active ? 'text-green-700' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Detalles de la Solicitud</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Solicitante</label>
                                    <div className="text-lg text-gray-900">{reimbursement.user_name}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Monto Solicitado</label>
                                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(reimbursement.amount_requested)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Proyecto</label>
                                        <div className="text-lg text-gray-900">{reimbursement.project || 'N/A'}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Concepto / Notas</label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 mt-1">
                                        {reimbursement.notes}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Status & Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Estado Actual</h2>
                            <div className={`p-4 rounded-lg text-center font-bold text-lg
                                ${['Aprobado Jefe', 'Aprobado Director', 'Pagado'].includes(reimbursement.status) ? 'bg-green-100 text-green-700' :
                                    ['Pendiente'].includes(reimbursement.status) ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {reimbursement.status.toUpperCase()}
                            </div>
                            {reimbursement.amount_approved > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Monto Aprobado</span>
                                        <span className="font-bold text-green-700">{formatCurrency(reimbursement.amount_approved)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pay Confirmation Modal */}
            {showPayConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar Pago</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            ¿Desea registrar el pago de este reembolso por <b>{formatCurrency(reimbursement.amount_approved)}</b>?
                            <br /><br />
                            Esta acción afectará el saldo y la caja.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowPayConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmPay}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Confirmar Pago
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paidTicket && (
                <PrintTicket
                    item={paidTicket.item}
                    isExpense={paidTicket.isExpense}
                    cashierName={currentUser?.name}
                    onClose={() => {
                        setPaidTicket(null);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

export default ReimbursementDetail;

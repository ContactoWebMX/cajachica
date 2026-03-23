import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, Save } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useOutletContext } from 'react-router-dom';

const CashReplenishment = () => {
    const { setPageTitle } = useOutletContext();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false); // Modal State

    // Admin features
    const [users, setUsers] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [selectedUserId, setSelectedUserId] = useState(currentUser.id !== undefined ? currentUser.id : '');
    // Flexible check for admin role
    const isAdmin = currentUser.role && ['admin', 'administrador', 'manager'].includes(currentUser.role.toLowerCase());

    const fetchHistory = async () => {
        try {
            const res = await api.get('/finance/replenishments');
            setHistory(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchUsers = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/users');
            setUsers(res.data);

            // Robust Default Selection:
            // 1. Try to keep current selection if valid
            // 2. Default to current user if in list
            // 3. Fallback to first user in list
            if (res.data.length > 0) {
                if (!selectedUserId) {
                    setSelectedUserId(res.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        setPageTitle('Ingreso de Fondos');
        fetchHistory();
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, setPageTitle]);

    // Ensure a default user is selected when users are loaded
    useEffect(() => {
        if (isAdmin && users.length > 0) {
            // If no selection, or selection is invalid (not in list), set to first
            const isValid = users.find(u => u.id === selectedUserId);
            if (!selectedUserId || !isValid) {
                setSelectedUserId(users[0].id);
            }
        }
    }, [users, isAdmin, selectedUserId]);

    const handlePreSubmit = (e) => {
        e.preventDefault();

        if (selectedUserId === '' || selectedUserId === undefined || selectedUserId === null) {
            console.warn('Validation failed: Missing User ID');
            alert('Error: No se ha identificado el usuario. Por favor inicie sesión nuevamente.');
            return;
        }

        // Show Custom Modal
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        setLoading(true);
        setShowConfirmModal(false); // Close modal

        try {
            await api.post('/finance/replenish', {
                amount,
                description,
                user_id: selectedUserId
            });
            setAmount('');
            setDescription('');
            fetchHistory(); // Refresh history
        } catch (error) {
            console.error(error);
            alert('Error al ingresar fondo: ' + (error.response?.data?.error || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full mx-auto space-y-8 relative">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
                {/* Admin User Selector */}
                {isAdmin && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <label className="block text-sm font-bold text-yellow-800 mb-1">
                            Registrar a nombre de:
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(Number(e.target.value))}
                            className="w-full border-yellow-300 rounded p-2 text-sm bg-white text-gray-800"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.role || 'Sin Rol'})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <form onSubmit={handlePreSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Ingresar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Fuente</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ej. Reposición Semanal, Inyección de Capital"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        <Save size={18} /> {loading ? 'Procesando...' : 'Registrar Ingreso'}
                    </button>
                </form>
            </div>

            {/* Custom Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Confirmar Ingreso"
                message={`¿Está seguro que desea ingresar este monto a la caja?\n\nMonto: $${Number(amount || 0).toFixed(2)}\nDescripción: ${description}\n\n⚠️ Esta acción aumentará el saldo disponible inmediatamente.`}
                confirmText="Confirmar Ingreso"
                confirmColor="green"
            />

            {/* History Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial Reciente</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center">No hay ingresos recientes</td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="bg-white border-b">
                                        <td className="px-6 py-4">{new Date(item.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                                        <td className="px-6 py-4">{item.user_name || 'Desconocido'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">
                                            +${Number(item.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashReplenishment;

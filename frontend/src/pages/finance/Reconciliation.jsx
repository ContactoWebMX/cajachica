import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useOutletContext } from 'react-router-dom';
import { Filter, X, Search, Calendar } from 'lucide-react';

const Reconciliation = () => {
    const { setPageTitle } = useOutletContext();
    const [denominations, setDenominations] = useState({
        '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, 'coins': 0
    });
    const [stats, setStats] = useState({ balance: 0 });
    const [notes, setNotes] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Get user from storage
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        setPageTitle('Arqueo de Caja');
        if (user) {
            fetchStats();
            fetchHistory();
        }
    }, [setPageTitle]);

    const fetchStats = async () => {
        try {
            const res = await api.get(`/finance/stats?user_id=${user.id}`);
            setStats(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/finance/history?user_id=${user.id}`);
            setHistory(res.data);
        } catch (error) { console.error(error); }
    };

    const handleCountChange = (denom, value) => {
        setDenominations({ ...denominations, [denom]: parseInt(value) || 0 });
    };

    // Correct calculation 
    const totalPhysical = (denominations['500'] * 500) +
        (denominations['200'] * 200) +
        (denominations['100'] * 100) +
        (denominations['50'] * 50) +
        (denominations['20'] * 20) +
        denominations['coins'];

    const difference = totalPhysical - (stats.global_balance || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsConfirmOpen(true);
    };

    const confirmSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/finance/reconciliate', {
                user_id: user.id,
                total_physical: totalPhysical,
                denominations,
                notes
            });
            fetchStats();
            fetchHistory();
            setDenominations({ '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, 'coins': 0 });
            setNotes('');
        } catch (error) {
            console.error(error);
            alert('Error al guardar: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
            setIsConfirmOpen(false);
        }
    };

    const filteredHistory = history.filter(item => {
        const matchesDate = !filterDate || new Date(item.date).toLocaleDateString() === new Date(filterDate).toLocaleDateString();
        const matchesSearch = !searchTerm ||
            item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.status?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDate && matchesSearch;
    });

    return (
        <div className="w-full mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Input Form */}
                <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-4">Conteo Físico</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[500, 200, 100, 50, 20].map(denom => (
                                    <div key={denom}>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">${denom}.00</label>
                                        <input
                                            type="number" min="0"
                                            value={denominations[denom]}
                                            onChange={e => handleCountChange(denom, e.target.value)}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-white"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Monedas ($)</label>
                                    <input
                                        type="number" min="0" step="0.50"
                                        value={denominations.coins}
                                        onChange={e => handleCountChange('coins', e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notas / Observaciones</label>
                            <textarea
                                placeholder="Ingrese cualquier observación relevante..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                                rows="3"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-secondary text-white hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? 'Procesando...' : 'Finalizar Arqueo'}
                        </button>
                    </form>
                </div>

                {/* Right: Summary Cards */}
                <div className="w-full md:w-1/3 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Saldo en Sistema</h3>
                        <div className="text-4xl font-extrabold text-blue-600 mb-1">
                            ${stats.global_balance?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-gray-400">
                            (Ingresos Totales - Anticipos Entregados)
                        </p>
                    </div>

                    <div className={`rounded-xl shadow-sm border p-6 transition-colors ${difference === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                        <h3 className={`text-sm font-medium uppercase tracking-wider mb-2 ${difference === 0 ? 'text-green-600' : 'text-red-600'
                            }`}>Diferencia</h3>
                        <div className={`text-4xl font-extrabold mb-2 ${difference === 0 ? 'text-green-700' : 'text-red-700'
                            }`}>
                            ${difference.toFixed(2)}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                            <span className="text-sm text-gray-600">Total Físico:</span>
                            <span className="text-lg font-bold text-gray-800">${totalPhysical.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-lg text-gray-800">Historial de Arqueos</h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                    >
                        {showFilters ? <X size={16} /> : <Filter size={16} />}
                        Filtros
                    </button>
                </div>

                {/* Collapsible Filters UI */}
                {showFilters && (
                    <div className="p-6 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700 text-sm outline-none"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Buscar en observaciones...</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Palabra clave o estado..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700 text-sm outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                                <th className="px-6 py-4 font-medium">Total Sistema</th>
                                <th className="px-6 py-4 font-medium">Total Físico</th>
                                <th className="px-6 py-4 font-medium">Diferencia</th>
                                <th className="px-6 py-4 font-medium">Observaciones</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredHistory.length > 0 ? (
                                filteredHistory.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(item.date).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(item.date).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">${Number(item.total_system || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-700">${Number(item.total_physical).toFixed(2)}</td>
                                        <td className={`px-6 py-4 font-bold ${item.difference == 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${Number(item.difference).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate" title={item.notes}>
                                            {item.notes || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Cerrado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.status || 'Pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                        No hay registros de arqueos recientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmSubmit}
                title="Confirmar Arqueo"
                message={`¿Está seguro de registrar este arqueo?\nDiferencia: $${difference.toFixed(2)}\nEsta acción no se puede deshacer.`}
                confirmText="Registrar Arqueo"
                confirmColor="blue"
            />
        </div>
    );
};

export default Reconciliation;

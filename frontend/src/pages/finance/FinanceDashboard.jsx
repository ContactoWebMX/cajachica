import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Download, Filter, X } from 'lucide-react';
import TransactionDetailModal from '../../components/TransactionDetailModal';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';

const FinanceDashboard = () => {
    const { setPageTitle } = useOutletContext();
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        setPageTitle('Dashboard Financiero');
    }, [setPageTitle]);

    const handleExport = async () => {
        try {
            const response = await api.get(`/finance/export/netsuite`, {
                params: { start_date: dateRange.start, end_date: dateRange.end },
                responseType: 'blob' // Important for file download
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `netsuite_export_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed', error);
            alert('Error al exportar. Verifique que existan datos en el rango seleccionado.');
        }
    };

    const [viewType, setViewType] = useState('summary'); // summary, advances, expenses
    const [filterStatus, setFilterStatus] = useState('');
    const [allItems, setAllItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const openModal = (item) => {
        setSelectedItem(item);
    };

    const closeModal = () => {
        setSelectedItem(null);
    };

    const fetchAllItems = async (type) => {
        try {
            const endpoint = type === 'advances' ? '/advances' : '/expenses';
            const res = await api.get(endpoint, {
                params: {
                    status: filterStatus,
                    start_date: dateRange.start,
                    end_date: dateRange.end
                }
            });
            setAllItems(res.data);
            setViewType(type);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="w-full mx-auto p-6">
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-secondary">
                    Dashboard Financiero
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Exportar NetSuite</span>
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                    >
                        {showFilters ? <X size={16} /> : <Filter size={16} />}
                        Filtros
                    </button>
                </div>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row items-end gap-4 mb-6 transition-all duration-300">
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Desde</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                className="border rounded p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                className="border rounded p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Estado</label>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="border rounded p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-w-[150px]"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Aprobado">Aprobado</option>
                                <option value="Rechazado">Rechazado</option>
                                <option value="Pagado">Pagado</option>
                                <option value="Pendiente Dirección">Pendiente Dirección</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchAllItems(viewType === 'summary' ? 'advances' : viewType)}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium h-10"
                    >
                        Aplicar
                    </button>
                </div>
            )}

            {/* View Selectors */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setViewType('summary')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewType === 'summary' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
                >
                    Resumen
                </button>
                <button
                    onClick={() => fetchAllItems('advances')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewType === 'advances' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
                >
                    Anticipos
                </button>
                <button
                    onClick={() => fetchAllItems('expenses')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewType === 'expenses' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
                >
                    Gastos
                </button>
            </div>

            {/* Data Table */}
            {viewType !== 'summary' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-3">Fecha</th>
                                <th className="p-3">Usuario</th>
                                <th className="p-3">Proyecto</th>
                                <th className="p-3">Monto</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3">Notas/Desc</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allItems.map(item => (
                                <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openModal(item)}>
                                    <td className="p-3">{new Date(item.request_date || item.date).toLocaleDateString()}</td>
                                    <td className="p-3">{item.user_id}</td>
                                    <td className="p-3">{item.project || '-'}</td>
                                    <td className="p-3 font-medium">{formatCurrency(item.amount || item.amount_requested)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${item.status.includes('Aprobado') ? 'bg-green-100 text-green-700' :
                                            item.status.includes('Rechazado') ? 'bg-red-100 text-red-700' :
                                                item.status.includes('Pendiente') ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-500 max-w-xs truncate">{item.notes || item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {viewType === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex items-center justify-center">
                        <p className="text-gray-400">Gráfico de Gastos por Categoría (Próximamente)</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex items-center justify-center">
                        <p className="text-gray-400">Gráfico de Flujo de Efectivo (Próximamente)</p>
                    </div>
                </div>
            )}

            <TransactionDetailModal
                isOpen={!!selectedItem}
                onClose={closeModal}
                item={selectedItem}
                type={viewType === 'expenses' ? 'GASTO' : 'ANTICIPO'}
            />
        </div>
    );
};

export default FinanceDashboard;

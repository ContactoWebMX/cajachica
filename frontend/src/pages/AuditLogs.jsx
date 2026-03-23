import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useOutletContext } from 'react-router-dom';
import { Filter, X, Search, Activity } from 'lucide-react';

const AuditLogs = () => {
    const { setPageTitle } = useOutletContext();
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setPageTitle('Auditoría del Sistema');
        api.get('/admin/logs').then(res => setLogs(res.data));
    }, [setPageTitle]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchTerm ||
            log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.new_value)?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = !filterAction || log.action === filterAction;
        return matchesSearch && matchesAction;
    });

    return (
        <div className="space-y-6">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-secondary">
                    Registros de Auditoría
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                    >
                        {showFilters ? <X size={16} /> : <Filter size={16} />}
                        Filtros
                    </button>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <Activity size={16} className="text-secondary" />
                        <span>{filteredLogs.length} Registros</span>
                    </div>
                </div>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 mb-6 transition-all duration-300 transform origin-top w-full">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-end">
                        <div className="relative flex-1 w-full">
                            <label className="block text-xs text-gray-500 mb-1">Buscar...</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Usuario, entidad o JSON..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700 text-sm outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-48">
                            <label className="block text-xs text-gray-500 mb-1">Acción</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700 text-sm outline-none h-10"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                            >
                                <option value="">Todas</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="LOGIN">LOGIN</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr className="text-xs uppercase tracking-wider">
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Usuario</th>
                                <th className="px-4 py-3">Acción</th>
                                <th className="px-4 py-3">Entidad</th>
                                <th className="px-4 py-3">Detalle (JSON)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                                        {log.user_name || 'Sistema'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-tight inline-block min-w-[60px] text-center
                                            ${log.action === 'CREATE' ? 'bg-green-100 text-green-700 bubble-anim' :
                                                log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <span className="font-semibold text-gray-800">{log.entity}</span> #{log.entity_id}
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono text-gray-500 truncate max-w-xs group cursor-pointer" title={JSON.stringify(log.new_value)}>
                                        {JSON.stringify(log.new_value)}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-gray-400">
                                        No se encontraron registros que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default AuditLogs;

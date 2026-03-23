import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Layers, Database, Briefcase, Plus, Trash2, Edit2, X, RefreshCw, Filter, Search } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useOutletContext } from 'react-router-dom';

const CatalogsManager = () => {
    const { setPageTitle } = useOutletContext();
    const [activeTab, setActiveTab] = useState('companies'); // companies | categories | cost-centers | departments | projects
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setPageTitle('Gestión de Catálogos');
    }, [setPageTitle]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b pb-1 gap-4">
                <div className="flex space-x-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('companies')}
                        className={`pb-2 px-4 font-medium transition-all whitespace-nowrap ${activeTab === 'companies' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Empresa
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-2 px-4 font-medium transition-all whitespace-nowrap ${activeTab === 'categories' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Categorías
                    </button>
                    <button
                        onClick={() => setActiveTab('cost-centers')}
                        className={`pb-2 px-4 font-medium transition-all whitespace-nowrap ${activeTab === 'cost-centers' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Centros de Costo
                    </button>
                    <button
                        onClick={() => setActiveTab('departments')}
                        className={`pb-2 px-4 font-medium transition-all whitespace-nowrap ${activeTab === 'departments' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Departamentos
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`pb-2 px-4 font-medium transition-all whitespace-nowrap ${activeTab === 'projects' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Proyectos
                    </button>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                >
                    {showFilters ? <X size={16} /> : <Filter size={16} />}
                    Filtros
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'companies' && <GenericCatalog endpoint="companies" title="Empresa" fields={[{ name: 'name', label: 'Nombre' }, { name: 'rfc', label: 'RFC' }, { name: 'description', label: 'Descripción' }]} showFilters={showFilters} />}
                {activeTab === 'categories' && <GenericCatalog endpoint="categories" title="Categoría" fields={[{ name: 'name', label: 'Nombre' }, { name: 'description', label: 'Descripción' }]} showFilters={showFilters} />}
                {activeTab === 'cost-centers' && <GenericCatalog endpoint="cost-centers" title="Centro de Costos" fields={[{ name: 'code', label: 'Código' }, { name: 'name', label: 'Nombre' }]} showFilters={showFilters} />}
                {activeTab === 'projects' && <GenericCatalog endpoint="projects" title="Proyecto" fields={[{ name: 'name', label: 'Nombre' }, { name: 'description', label: 'Descripción' }]} showFilters={showFilters} />}
                {activeTab === 'departments' && <DepartmentsCatalog showFilters={showFilters} />}
            </div>
        </div>
    );
};

const GenericCatalog = ({ endpoint, title, fields, showFilters }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    // Delete/Restore Modal State
    const [actionId, setActionId] = useState(null);
    const [actionType, setActionType] = useState(null); // 'delete' | 'restore'

    useEffect(() => {
        loadItems();
    }, [endpoint]);

    const loadItems = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/catalogs/${endpoint}`);
            setItems(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        const data = {};
        fields.forEach(f => data[f.name] = item[f.name]);
        setFormData(data);
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/catalogs/${endpoint}/${editingId}`, formData);
            } else {
                await api.post(`/catalogs/${endpoint}`, formData);
            }
            setEditingId(null);
            setFormData({});
            loadItems();
        } catch (error) {
            alert('Error guardando');
            console.error(error);
        }
    };

    const handleActionClick = (id, type) => {
        setActionId(id);
        setActionType(type);
    };

    const confirmAction = async () => {
        if (!actionId) return;
        try {
            if (actionType === 'delete') {
                await api.delete(`/catalogs/${endpoint}/${actionId}`);
            } else {
                await api.put(`/catalogs/${endpoint}/${actionId}`, { active: true });
            }
            loadItems();
        } catch (error) {
            alert('Error realizando acción');
            console.error(error);
        } finally {
            setActionId(null);
            setActionType(null);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesActive = showInactive || (item.active !== 0 && item.active !== false);
        const matchesSearch = !searchTerm || fields.some(f =>
            item[f.name]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        return matchesActive && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Collapsible Filters UI */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 mb-2 transition-all duration-300 w-full animate-in slide-in-from-top-2">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-end">
                        <div className="relative flex-1 w-full">
                            <label className="block text-xs text-gray-500 mb-1">Buscar...</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={`Buscar ${title.toLowerCase()}...`}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700 text-sm outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors h-10 whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-gray-700 select-none">Inactivos</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    {fields.map(f => <th key={f.name} className="p-3">{f.label}</th>)}
                                    <th className="p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className={item.active === 0 || item.active === false ? 'bg-gray-50 opacity-75' : ''}>
                                        {fields.map(f => <td key={f.name} className="p-3">{item[f.name]}</td>)}
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700">
                                                <Edit2 size={16} />
                                            </button>
                                            {item.active !== 0 && item.active !== false ? (
                                                <button onClick={() => handleActionClick(item.id, 'delete')} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleActionClick(item.id, 'restore')} className="text-green-500 hover:text-green-700">
                                                    <RefreshCw size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredItems.length === 0 && <p className="p-4 text-center text-gray-400">No hay registros.</p>}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">{editingId ? 'Editar' : 'Agregar'} {title}</h3>
                        {editingId && <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700"><X size={16} /></button>}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(f => (
                            <div key={f.name}>
                                <label className="block text-sm font-medium mb-1">{f.label}</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={formData[f.name] || ''}
                                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                                    required
                                />
                            </div>
                        ))}
                        <div className="flex gap-2">
                            {editingId && (
                                <button type="button" onClick={handleCancel} className="w-1/2 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">
                                    Cancelar
                                </button>
                            )}
                            <button className={`bg-primary text-white py-2 rounded hover:bg-secondary ${editingId ? 'w-1/2' : 'w-full'}`}>
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>

                <ConfirmationModal
                    isOpen={!!actionId}
                    onClose={() => setActionId(null)}
                    onConfirm={confirmAction}
                    title={actionType === 'delete' ? `Eliminar ${title}` : `Reactivar ${title}`}
                    message={actionType === 'delete' ? "¿Estás seguro de eliminar este elemento?" : "¿Desea reactivar este elemento?"}
                    confirmText={actionType === 'delete' ? "Eliminar" : "Reactivar"}
                    confirmColor={actionType === 'delete' ? "red" : "green"}
                />
            </div>
        </div>
    );
};

const DepartmentsCatalog = ({ showFilters }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [formData, setFormData] = useState({ name: '', cost_center_id: '' });
    const [editingId, setEditingId] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    // Delete/Restore Modal State
    const [actionId, setActionId] = useState(null);
    const [actionType, setActionType] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [depts, ccs] = await Promise.all([
                api.get('/catalogs/departments'),
                api.get('/catalogs/cost-centers')
            ]);
            setItems(depts.data || []);
            setCostCenters(ccs.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({ name: item.name, cost_center_id: item.cost_center_id || '' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', cost_center_id: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/catalogs/departments/${editingId}`, formData);
            } else {
                await api.post('/catalogs/departments', formData);
            }
            handleCancel();
            loadData();
        } catch (error) {
            alert('Error guardando');
            console.error(error);
        }
    };

    const handleActionClick = (id, type) => {
        setActionId(id);
        setActionType(type);
    };

    const confirmAction = async () => {
        if (!actionId) return;
        try {
            if (actionType === 'delete') {
                await api.delete(`/catalogs/departments/${actionId}`);
            } else {
                await api.put(`/catalogs/departments/${actionId}`, { active: true });
            }
            loadData();
        } catch (error) {
            alert('Error realizando acción');
            console.error(error);
        } finally {
            setActionId(null);
            setActionType(null);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesActive = showInactive || (item.active !== 0 && item.active !== false);
        const matchesSearch = !searchTerm ||
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.cost_center_id?.toString().includes(searchTerm);
        return matchesActive && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Collapsible Filters UI */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 mb-2 transition-all duration-300 w-full animate-in slide-in-from-top-2">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-end">
                        <div className="relative flex-1 w-full">
                            <label className="block text-xs text-gray-500 mb-1">Buscar...</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar departamento o ID..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700 text-sm outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors h-10 whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-gray-700 select-none">Inactivos</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">Centro de Costos (ID)</th>
                                    <th className="p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className={item.active === 0 || item.active === false ? 'bg-gray-50 opacity-75' : ''}>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3">{item.cost_center_id}</td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700">
                                                <Edit2 size={16} />
                                            </button>
                                            {item.active !== 0 && item.active !== false ? (
                                                <button onClick={() => handleActionClick(item.id, 'delete')} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleActionClick(item.id, 'restore')} className="text-green-500 hover:text-green-700">
                                                    <RefreshCw size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredItems.length === 0 && <p className="p-4 text-center text-gray-400">No hay registros.</p>}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">{editingId ? 'Editar' : 'Agregar'} Departamento</h3>
                        {editingId && <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700"><X size={16} /></button>}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre</label>
                            <input
                                className="w-full border rounded p-2"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Centro de Costos Relacionado</label>
                            <select
                                className="w-full border rounded p-2"
                                value={formData.cost_center_id}
                                onChange={e => setFormData({ ...formData, cost_center_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            {editingId && (
                                <button type="button" onClick={handleCancel} className="w-1/2 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">
                                    Cancelar
                                </button>
                            )}
                            <button className={`bg-primary text-white py-2 rounded hover:bg-secondary ${editingId ? 'w-1/2' : 'w-full'}`}>
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>

                <ConfirmationModal
                    isOpen={!!actionId}
                    onClose={() => setActionId(null)}
                    onConfirm={confirmAction}
                    title={actionType === 'delete' ? "Eliminar Departamento" : "Reactivar Departamento"}
                    message={actionType === 'delete' ? "¿Estás seguro de eliminar este departamento?" : "¿Desea reactivar este departamento?"}
                    confirmText={actionType === 'delete' ? "Eliminar" : "Reactivar"}
                    confirmColor={actionType === 'delete' ? "red" : "green"}
                />
            </div>
        </div>
    );
};

export default CatalogsManager;

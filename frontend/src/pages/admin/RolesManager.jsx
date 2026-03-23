import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Shield, Plus, Edit, Trash2, CheckCircle, XCircle, Filter, X, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const RolesManager = () => {
    const { setPageTitle } = useOutletContext();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setPageTitle('Gestión de Roles');
        fetchRoles();
    }, [setPageTitle]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, formData);
            } else {
                await api.post('/roles', formData);
            }
            setIsModalOpen(false);
            fetchRoles();
            setFormData({ name: '', description: '' });
            setEditingRole(null);
        } catch (error) {
            console.error('Error saving role:', error);
            alert('Error al guardar el rol');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas desactivar este rol?')) return;
        try {
            await api.delete(`/roles/${id}`);
            fetchRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
        }
    };

    const openEdit = (role) => {
        setEditingRole(role);
        setFormData({ name: role.name, description: role.description });
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '' });
        setIsModalOpen(true);
    };

    const filteredRoles = roles.filter(role => {
        const matchesActive = showInactive || role.active;
        const matchesSearch = !searchTerm ||
            role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesActive && matchesSearch;
    });

    if (loading) return <div>Cargando roles...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-secondary">
                    Gestión de Roles
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                    >
                        {showFilters ? <X size={16} /> : <Filter size={16} />}
                        Filtros
                    </button>
                    <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary text-sm font-medium shadow-sm flex items-center gap-2">
                        <Plus size={18} />
                        <span>Nuevo Rol</span>
                    </button>
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
                                    placeholder="Nombre o descripción del rol..."
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
                            <span className="text-sm font-medium text-gray-700 select-none">Mostrar Inactivos</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="p-4">Nombre del Rol</th>
                            <th className="p-4">Descripción</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRoles.map(role => (
                            <tr key={role.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{role.name}</td>
                                <td className="p-4 text-gray-600">{role.description}</td>
                                <td className="p-4">
                                    {role.active ?
                                        <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle size={14} /> Activo</span> :
                                        <span className="text-red-500 flex items-center gap-1 text-sm"><XCircle size={14} /> Inactivo</span>
                                    }
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => openEdit(role)} className="text-blue-500 hover:text-blue-700">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(role.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 p-6">
                        <h2 className="text-xl font-bold mb-4">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h2>
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
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea
                                    className="w-full border rounded p-2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesManager;

import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { User, Shield, Briefcase, CheckCircle, XCircle, Edit, Trash2, RefreshCw, Filter, X, Search } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useOutletContext } from 'react-router-dom';

const UsersManager = () => {
    const { setPageTitle } = useOutletContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: '', department_id: '', reports_to: ''
    });

    // Catalogs for Dropdowns
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [roles, setRoles] = useState([]);

    // Delete/Restore/Filter State
    const [showInactive, setShowInactive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [actionUser, setActionUser] = useState(null);
    const [actionType, setActionType] = useState(null); // 'delete' | 'restore'

    useEffect(() => {
        setPageTitle('Gestión de Usuarios');
        fetchUsers();
        fetchCatalogs();
    }, [setPageTitle]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data || []);
            // Filter potential managers (Admins or Managers)
            if (res.data) {
                setManagers(res.data.filter(u => u.role === 'Admin' || u.role === 'Manager'));
            }
        } catch (error) {
            console.error('Error fetching users', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogs = async () => {
        try {
            const [deptRes, roleRes] = await Promise.all([
                api.get('/catalogs/departments'),
                api.get('/roles')
            ]);
            setDepartments(deptRes.data || []);
            setRoles(roleRes.data || []);
        } catch (error) {
            console.error('Error fetching catalogs', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user', error);
            alert('Error al guardar usuario');
        }
    };

    const handleActionClick = (user, type) => {
        setActionUser(user);
        setActionType(type);
    };

    const confirmAction = async () => {
        if (!actionUser) return;
        try {
            if (actionType === 'delete') {
                await api.delete(`/users/${actionUser.id}`);
            } else {
                await api.put(`/users/${actionUser.id}`, { active: true });
            }
            fetchUsers();
        } catch (error) {
            console.error(`Error ${actionType} user`, error);
            const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
            alert(`Error: ${errorMsg}`);
        } finally {
            setActionUser(null);
            setActionType(null);
        }
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '', // Password is usually not populated for security
            role: user.role_id || '', // Assuming role_id is what's needed for the select
            department_id: user.department_id || '',
            reports_to: user.reports_to || ''
        });
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingUser(null);
        setFormData({
            name: '', email: '', password: '', role: '', department_id: '', reports_to: ''
        });
        setIsModalOpen(true);
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesActive = showInactive || user.active;
        const matchesSearch = !searchTerm ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.department?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesActive && matchesSearch;
    });

    if (loading) return <div>Cargando usuarios...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-secondary">
                    Gestión de Usuarios
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
                        <User size={16} />
                        <span>Nuevo Usuario</span>
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
                                    placeholder="Nombre, email, rol o depto..."
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
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Departamento</th>
                            <th className="p-4">Jefe Directo</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={`hover:bg-gray-50 ${!user.active ? 'bg-gray-50 opacity-75' : ''}`}>
                                <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                <td className="p-4 text-gray-600">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold
                                        ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {user.role || 'Sin Rol'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">{user.department || '-'}</td>
                                <td className="p-4 text-gray-600">{user.reports_to_name || '-'}</td>
                                <td className="p-4">
                                    {user.active ?
                                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Activo</span> :
                                        <span className="text-red-500 flex items-center gap-1"><XCircle size={14} /> Inactivo</span>
                                    }
                                </td>
                                <td className="p-4">
                                    <button onClick={() => openEdit(user)} className="text-gray-400 hover:text-accent mr-2" title="Editar">
                                        <Edit size={18} />
                                    </button>
                                    {user.active ? (
                                        <button onClick={() => handleActionClick(user, 'delete')} className="text-gray-400 hover:text-red-500" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    ) : (
                                        <button onClick={() => handleActionClick(user, 'restore')} className="text-gray-400 hover:text-green-500" title="Reactivar">
                                            <RefreshCw size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && <p className="p-6 text-center text-gray-400">No se encontraron usuarios.</p>}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 p-6">
                        <h2 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Nombre Completo</label>
                                <input type="text" required className="w-full border rounded p-2"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Email</label>
                                <input type="email" required className="w-full border rounded p-2"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Contraseña {editingUser ? '(Opcional)' : '(Requerida)'}</label>
                                <input
                                    type="password"
                                    className="w-full border rounded p-2"
                                    placeholder={editingUser ? "Dejar en blanco para mantener" : "********"}
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Rol</label>
                                    <select className="w-full border rounded p-2"
                                        value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="">Seleccionar...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Departamento</label>
                                    <select className="w-full border rounded p-2"
                                        value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })}>
                                        <option value="">Seleccionar...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Reporta a (Jefe)</label>
                                <select className="w-full border rounded p-2"
                                    value={formData.reports_to} onChange={e => setFormData({ ...formData, reports_to: e.target.value })}>
                                    <option value="">Nadie</option>
                                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!actionUser}
                onClose={() => setActionUser(null)}
                onConfirm={confirmAction}
                title={actionType === 'delete' ? "Eliminar Usuario" : "Reactivar Usuario"}
                message={actionType === 'delete'
                    ? `¿Estás seguro de que deseas eliminar a ${actionUser?.name}? Si tiene historial, se desactivará.`
                    : `¿Desea reactivar el acceso para ${actionUser?.name}?`}
                confirmText={actionType === 'delete' ? "Sí, eliminar" : "Sí, reactivar"}
                confirmColor={actionType === 'delete' ? "red" : "green"}
            />
        </div>
    );
};

export default UsersManager;

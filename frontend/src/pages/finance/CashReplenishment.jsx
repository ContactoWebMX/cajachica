import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, Save, ChevronDown, ChevronRight, Calendar, X, Info, TrendingUp, PlusCircle } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useOutletContext } from 'react-router-dom';

const CashReplenishment = () => {
    const { setPageTitle } = useOutletContext();

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null); // Accordion state
    const [selectedEntry, setSelectedEntry] = useState(null); // Side panel state

    // Filter Stats
    const [filterPeriod, setFilterPeriod] = useState('current_month');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    // Catalogs
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Auth & Admin
    const [users, setUsers] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role && ['admin', 'administrador', 'manager'].includes(currentUser.role.toLowerCase());

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        user_id: '',
        company_id: '',
        project_id: '',
        category_id: '',
        cost_center_id: '',
        department_id: ''
    });

    const fetchHistory = async () => {
        try {
            let start = '', end = '';
            const now = new Date();
            const y = now.getFullYear();
            const m = now.getMonth();

            if (filterPeriod === 'current_month') {
                start = new Date(y, m, 1).toISOString().split('T')[0];
                end = new Date(y, m + 1, 0).toISOString().split('T')[0];
            } else if (filterPeriod === 'last_month') {
                start = new Date(y, m - 1, 1).toISOString().split('T')[0];
                end = new Date(y, m, 0).toISOString().split('T')[0];
            } else if (filterPeriod === 'custom') {
                start = customDates.start;
                end = customDates.end;
            }

            const res = await api.get(`/finance/replenishments?start_date=${start}&end_date=${end}`);
            setHistory(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchCatalogs = async () => {
        try {
            const [comps, projs, cats, ccs, depts] = await Promise.all([
                api.get('/catalogs/companies'),
                api.get('/catalogs/projects'),
                api.get('/catalogs/categories'),
                api.get('/catalogs/cost-centers'),
                api.get('/catalogs/departments')
            ]);
            setCompanies(comps.data);
            setProjects(projs.data);
            setCategories(cats.data);
            setCostCenters(ccs.data);
            setDepartments(depts.data);
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        }
    };

    const fetchUsers = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/users');
            setUsers(res.data);

            if (res.data.length > 0 && !formData.user_id) {
                setFormData(prev => ({ ...prev, user_id: res.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        setPageTitle('Ingreso de Fondos');
        fetchCatalogs();
        if (isAdmin) {
            fetchUsers();
        } else {
            setFormData(prev => ({ ...prev, user_id: currentUser.id }));
        }
    }, [isAdmin, setPageTitle]);

    useEffect(() => {
        fetchHistory();
    }, [filterPeriod, customDates]);

    const totalInPeriod = history.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const countInPeriod = history.length;

    // Ensure a default user is selected when users are loaded
    useEffect(() => {
        if (isAdmin && users.length > 0) {
            const isValid = users.find(u => u.id === Number(formData.user_id));
            if (!formData.user_id || !isValid) {
                setFormData(prev => ({ ...prev, user_id: users[0].id }));
            }
        }
    }, [users, isAdmin, formData.user_id]);

    const handlePreSubmit = (e) => {
        e.preventDefault();

        if (!formData.user_id) {
            alert('Error: No se ha identificado el usuario.');
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        setLoading(true);
        setShowConfirmModal(false);

        try {
            await api.post('/finance/replenish', formData);
            setFormData({
                amount: '',
                description: '',
                user_id: formData.user_id,
                company_id: '',
                project_id: '',
                category_id: '',
                cost_center_id: '',
                department_id: ''
            });
            fetchHistory();
        } catch (error) {
            console.error(error);
            alert('Error al ingresar fondo: ' + (error.response?.data?.error || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";
    const inputStyle = "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white";

    const DetailRow = ({ label, value }) => (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">{label}</span>
            <span className="text-sm font-bold text-gray-700">{value || 'N/A'}</span>
        </div>
    );

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20">
            {/* ── HEADER FORM SECTION ── */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <PlusCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800">Registrar Ingreso de Fondos</h2>
                        <p className="text-sm text-gray-400">Complete los campos para clasificar la entrada de capital en caja.</p>
                    </div>
                </div>

                <form onSubmit={handlePreSubmit} className="space-y-6">
                    {isAdmin && (
                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl mb-6 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Info size={16} className="text-yellow-600" />
                                <label className="text-xs font-bold text-yellow-700 uppercase tracking-widest whitespace-nowrap">
                                    Registrar a nombre de:
                                </label>
                            </div>
                            <select
                                value={formData.user_id}
                                onChange={e => setFormData(prev => ({ ...prev, user_id: Number(e.target.value) }))}
                                className="w-full md:max-w-xs border-yellow-200 rounded-lg p-2 text-sm bg-white text-gray-800 shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role || 'Sin Rol'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Monto a Ingresar <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="0.00"
                                        className={`${inputStyle} pl-8 text-lg font-black text-green-700`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Descripción / Fuente <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Ej. Reposición Semanal..."
                                    className={inputStyle}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Empresa</label>
                                <select value={formData.company_id} onChange={e => setFormData(prev => ({ ...prev, company_id: e.target.value }))} className={inputStyle}>
                                    <option value="">Seleccionar empresa...</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Proyecto</label>
                                <select value={formData.project_id} onChange={e => setFormData(prev => ({ ...prev, project_id: e.target.value }))} className={inputStyle}>
                                    <option value="">Seleccionar proyecto...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Centro de Costos</label>
                                <select value={formData.cost_center_id} onChange={e => setFormData(prev => ({ ...prev, cost_center_id: e.target.value }))} className={inputStyle}>
                                    <option value="">Seleccionar centro...</option>
                                    {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Categoría</label>
                                <select value={formData.category_id} onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))} className={inputStyle}>
                                    <option value="">Seleccionar categoría...</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Departamento</label>
                                <select value={formData.department_id} onChange={e => setFormData(prev => ({ ...prev, department_id: e.target.value }))} className={inputStyle}>
                                    <option value="">Seleccionar departamento...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !formData.amount}
                            className="bg-green-600 hover:bg-green-700 text-white font-black py-4 px-12 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 text-lg"
                        >
                            <Save size={24} /> {loading ? 'PROCESANDO...' : 'REGISTRAR INGRESO'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── INNOVATIVE PERIOD INSIGHTS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                    <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Ingresos Periodo</p>
                    <h3 className="text-3xl font-black">${totalInPeriod.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-[10px] mt-2 font-medium bg-indigo-500 w-fit px-2 py-0.5 rounded-full">Basado en {countInPeriod} movimientos</p>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Filtrar por Periodo</h4>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'current_month', label: 'Este Mes' },
                                { id: 'last_month', label: 'Mes Anterior' },
                                { id: 'custom', label: 'Personalizado' },
                            ].map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setFilterPeriod(p.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterPeriod === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filterPeriod === 'custom' && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                            <div className="flex flex-col gap-1">
                                <span className={labelStyle}>Desde</span>
                                <input type="date" value={customDates.start} onChange={e => setCustomDates(d => ({ ...d, start: e.target.value }))} className="p-2 text-xs border border-gray-100 rounded-lg bg-gray-50 font-bold" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className={labelStyle}>Hasta</span>
                                <input type="date" value={customDates.end} onChange={e => setCustomDates(d => ({ ...d, end: e.target.value }))} className="p-2 text-xs border border-gray-100 rounded-lg bg-gray-50 font-bold" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── EXPANDABLE MASTER-DETAIL TABLE ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Historial de Ingresos</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                        <Calendar size={14} />
                        {filterPeriod === 'current_month' ? 'Abril 2026' : filterPeriod === 'last_month' ? 'Marzo 2026' : 'Rango personalizado'}
                    </div>
                </div>

                <div className="overflow-x-auto text-[13px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="p-4 w-10"></th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Movimiento</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Origen / Empresa</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Registrado por</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-20 text-center text-gray-300 italic">No se encontraron registros para este periodo</td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <React.Fragment key={item.id}>
                                        <tr
                                            className={`hover:bg-gray-50/80 transition-all cursor-pointer group ${expandedRow === item.id ? 'bg-indigo-50/30' : ''}`}
                                            onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                                        >
                                            <td className="p-4 text-center">
                                                {expandedRow === item.id
                                                    ? <ChevronDown className="text-indigo-600 transition-transform" size={18} />
                                                    : <ChevronRight className="text-gray-300 group-hover:text-gray-500" size={18} />
                                                }
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800 underline decoration-indigo-100 underline-offset-4 decoration-2">#{item.id} - {item.description}</div>
                                                <div className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(item.date).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-700 font-bold">{item.company_name || 'Sin Empresa'}</span>
                                                    <span className="text-[10px] text-indigo-500 font-black tracking-widest uppercase">{item.project_name || 'Sin Proyecto'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black text-gray-400">{item.user_name?.[0]}</div>
                                                    <span className="text-gray-500 font-medium">{item.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-base font-black text-green-600">+${Number(item.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedEntry(item); }}
                                                        className="text-[9px] text-indigo-400 font-black uppercase tracking-widest hover:text-indigo-600 flex items-center gap-0.5 mt-1"
                                                    >
                                                        Auditar <ChevronRight size={10} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Row Detail (Accordion) */}
                                        {expandedRow === item.id && (
                                            <tr className="bg-gray-50/50 animate-in slide-in-from-top-2 duration-300">
                                                <td className="p-0"></td>
                                                <td colSpan="4" className="p-6">
                                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 border-l-2 border-indigo-200 pl-6 py-2">
                                                        <DetailRow label="Empresa" value={item.company_name} />
                                                        <DetailRow label="Proyecto" value={item.project_name} />
                                                        <DetailRow label="Centro de Costos" value={item.cost_center_name} />
                                                        <DetailRow label="Departamento" value={item.department_name} />
                                                        <DetailRow label="Categoría" value={item.category_name} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── SIDE DRAWER PANEL ── */}
            {selectedEntry && (
                <div
                    className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setSelectedEntry(null)}
                >
                    <div
                        className="w-full max-w-md bg-white h-full shadow-2xl relative animate-in slide-in-from-right duration-500 overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-green-50 rounded-2xl">
                                    <PlusCircle size={32} className="text-green-600" />
                                </div>
                                <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Detalle de Ingreso</h2>
                                <p className="text-gray-400 font-medium">Referencia Auditoría: #{selectedEntry.id}</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Monto Inyectado</p>
                                <h3 className="text-4xl font-black text-green-600 tracking-tighter">
                                    +${Number(selectedEntry.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Clasificación Financiera</h4>
                                <div className="grid grid-cols-2 gap-y-6">
                                    <DetailRow label="Empresa" value={selectedEntry.company_name} />
                                    <DetailRow label="Proyecto" value={selectedEntry.project_name} />
                                    <DetailRow label="Centro de Costos" value={selectedEntry.cost_center_name} />
                                    <DetailRow label="Departamento" value={selectedEntry.department_name} />
                                    <DetailRow label="Categoría" value={selectedEntry.category_name} />
                                    <DetailRow label="Usuario" value={selectedEntry.user_name} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Concepto</h4>
                                <p className="text-gray-700 font-bold italic">"{selectedEntry.description}"</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                    <Calendar size={12} />
                                    {new Date(selectedEntry.date).toLocaleString()}
                                </div>
                            </div>

                            <div className="pt-10">
                                <button className="w-full py-4 bg-gray-800 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-colors shadow-xl shadow-gray-200">
                                    Imprimir Comprobante
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Confirmar Ingreso"
                message={`¿Está seguro que desea ingresar este monto a la caja?\n\nMonto: $${Number(formData.amount || 0).toFixed(2)}\nDescripción: ${formData.description}\n\n⚠️ Esta acción aumentará el saldo disponible inmediatamente.`}
                confirmText="Confirmar Ingreso"
                confirmColor="green"
            />
        </div>
    );
};

export default CashReplenishment;

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate, useOutletContext } from 'react-router-dom';

const AdvanceForm = () => {
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [costCenterId, setCostCenterId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [projectId, setProjectId] = useState('');
    const [companyId, setCompanyId] = useState('');

    // Catalogs
    const [categories, setCategories] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setPageTitle('Solicitar Anticipo');
        fetchCatalogs();
    }, [setPageTitle]);

    const fetchCatalogs = async () => {
        try {
            const [cats, ccs, depts, projs, comps] = await Promise.all([
                api.get('/catalogs/categories'),
                api.get('/catalogs/cost-centers'),
                api.get('/catalogs/departments'),
                api.get('/catalogs/projects'),
                api.get('/catalogs/companies')
            ]);
            setCategories(cats.data);
            setCostCenters(ccs.data);
            setDepartments(depts.data);
            setProjects(projs.data);
            setCompanies(comps.data);
        } catch (error) {
            console.error('Error fetching catalogs', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));

        setIsSubmitting(true);
        try {
            await api.post('/advances/request', {
                user_id: user?.id,
                amount: parseFloat(amount),
                notes,
                category_id: categoryId || null,
                cost_center_id: costCenterId || null,
                department_id: departmentId || null,
                project_id: projectId || null,
                company_id: companyId || null
            });
            alert('Solicitud enviada con éxito');
            navigate('/');
        } catch (error) {
            console.error('Error requesting advance:', error);
            alert('Error al solicitar anticipo');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors';

    return (
        <div className="w-full mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* === CLASIFICACIÓN (obligatorios) === */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-blue-800 mb-4 uppercase tracking-wide">Clasificación del Anticipo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Empresa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Empresa <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar empresa...</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Proyecto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proyecto <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar proyecto...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar categoría...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Centro de Costos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Centro de Costos <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={costCenterId}
                                onChange={(e) => setCostCenterId(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar centro de costos...</option>
                                {costCenters.map(cc => (
                                    <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Departamento */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Departamento <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar departamento...</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* === DATOS DEL ANTICIPO === */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Solicitado ($) <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={selectClass}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Justificación</label>
                    <textarea
                        rows="3"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={selectClass}
                        placeholder="Para gastos de viaje a..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-secondary'}`}
                >
                    {isSubmitting ? 'Enviando...' : 'Solicitar Fondos'}
                </button>
            </form>
        </div>
    );
};

export default AdvanceForm;

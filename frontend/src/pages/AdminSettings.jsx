import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { Palette, Mail, Upload, Save, CheckCircle, Shield } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { useOutletContext } from 'react-router-dom';

const AdminSettings = () => {
    const { settings: globalSettings, updateSettings } = useSettings();
    const { setPageTitle } = useOutletContext();
    const [activeTab, setActiveTab] = useState('branding'); // branding | smtp | approvals

    // Local state for forms
    const [brandingForm, setBrandingForm] = useState({
        app_name: '',
        // Sidebar colors
        sidebar_bg_color: '#1e293b',
        sidebar_text_color: '#ffffff',
        sidebar_hover_color: '#334155',
        sidebar_active_color: '#3b82f6',
        // Button colors
        button_bg_color: '#3b82f6',
        button_text_color: '#ffffff',
        button_hover_color: '#2563eb',
        button_border_color: '#3b82f6',
        logo: null // File object
    });

    const [smtpForm, setSmtpForm] = useState({
        smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', smtp_secure: 'false'
    });

    const [approvalForm, setApprovalForm] = useState({
        APPROVAL_MIN_AMOUNT: '1000',
        DIRECTOR_USER_IDS: [] // Array of user IDs
    });
    const [users, setUsers] = useState([]);

    const [previewLogo, setPreviewLogo] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'branding' | 'smtp'
        title: '',
        message: ''
    });

    useEffect(() => {
        setPageTitle('Configuración del Sistema');
        // Initialize branding form from global settings
        setBrandingForm({
            app_name: globalSettings.app_name || '',
            // Sidebar colors
            sidebar_bg_color: globalSettings.sidebar_bg_color || '#1e293b',
            sidebar_text_color: globalSettings.sidebar_text_color || '#ffffff',
            sidebar_hover_color: globalSettings.sidebar_hover_color || '#334155',
            sidebar_active_color: globalSettings.sidebar_active_color || '#3b82f6',
            // Button colors
            button_bg_color: globalSettings.button_bg_color || '#3b82f6',
            button_text_color: globalSettings.button_text_color || '#ffffff',
            button_hover_color: globalSettings.button_hover_color || '#2563eb',
            button_border_color: globalSettings.button_border_color || '#3b82f6',
            logo: null
        });
        if (globalSettings.logo_url) {
            setPreviewLogo(`http://localhost:3000${globalSettings.logo_url}`);
        }

        // Fetch SMTP and Approval settings
        api.get('/admin/settings').then(res => {
            setSmtpForm(prev => ({ ...prev, ...res.data }));

            // Parse Director IDs if stored as JSON string or comma-separated
            let directorIds = [];
            if (res.data.DIRECTOR_USER_IDS) {
                try {
                    directorIds = JSON.parse(res.data.DIRECTOR_USER_IDS);
                } catch (e) {
                    // Fallback if stored as string "1,2,3"
                    directorIds = res.data.DIRECTOR_USER_IDS.toString().split(',').map(Number);
                }
            }

            setApprovalForm(prev => ({
                ...prev,
                APPROVAL_MIN_AMOUNT: res.data.APPROVAL_MIN_AMOUNT || '1000',
                DIRECTOR_USER_IDS: Array.isArray(directorIds) ? directorIds : []
            }));
        }).catch(err => console.error(err));

        // Fetch Users for Director Selection
        api.get('/users').then(res => setUsers(res.data)).catch(err => console.error(err));
    }, [globalSettings]);

    const handleBrandingChange = (e) => {
        setBrandingForm({ ...brandingForm, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBrandingForm({ ...brandingForm, logo: file });
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    const requestSaveBranding = (e) => {
        e.preventDefault();
        setConfirmModal({
            isOpen: true,
            type: 'branding',
            title: 'Guardar Personalización',
            message: '¿Estás seguro de que deseas aplicar estos cambios de diseño a toda la aplicación?'
        });
    };

    const confirmSaveBranding = async () => {
        const formData = new FormData();
        formData.append('app_name', brandingForm.app_name);
        // Sidebar colors
        formData.append('sidebar_bg_color', brandingForm.sidebar_bg_color);
        formData.append('sidebar_text_color', brandingForm.sidebar_text_color);
        formData.append('sidebar_hover_color', brandingForm.sidebar_hover_color);
        formData.append('sidebar_active_color', brandingForm.sidebar_active_color);
        // Button colors
        formData.append('button_bg_color', brandingForm.button_bg_color);
        formData.append('button_text_color', brandingForm.button_text_color);
        formData.append('button_hover_color', brandingForm.button_hover_color);
        formData.append('button_border_color', brandingForm.button_border_color);
        if (brandingForm.logo) {
            formData.append('logo', brandingForm.logo);
        }

        const success = await updateSettings(formData);
        if (!success) alert('Error al actualizar.');
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const requestSaveSmtp = (e) => {
        e.preventDefault();
        setConfirmModal({
            isOpen: true,
            type: 'smtp',
            title: 'Guardar Configuración SMTP',
            message: '¿Estás seguro de que deseas guardar la configuración del servidor de correo?'
        });
    };

    const confirmSaveSmtp = async () => {
        try {
            await api.post('/admin/settings', smtpForm);
        } catch (error) {
            console.error(error);
            alert('Error al guardar SMTP.');
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const requestSaveApprovals = (e) => {
        e.preventDefault();
        setConfirmModal({
            isOpen: true,
            type: 'approvals',
            title: 'Guardar Configuración de Aprobaciones',
            message: '¿Estás seguro de guardar estos cambios?'
        });
    };

    const confirmSaveApprovals = async () => {
        try {
            const payload = {
                ...approvalForm,
                DIRECTOR_USER_IDS: JSON.stringify(approvalForm.DIRECTOR_USER_IDS)
            };
            await api.put('/admin/settings', payload);
        } catch (error) {
            console.error(error);
            alert('Error al guardar configuración.');
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    return (
        <div className="w-full mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {/* Tabs */}
            <div className="flex border-b mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('branding')}
                    className={`px-4 py-2 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'branding' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Palette size={18} /> Personalización
                </button>
                <button
                    onClick={() => setActiveTab('smtp')}
                    className={`px-4 py-2 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'smtp' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Mail size={18} /> Correo (SMTP)
                </button>
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`px-4 py-2 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'approvals' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <CheckCircle size={18} /> Aprobaciones
                </button>
            </div>

            {/* Branding Tab */}
            {activeTab === 'branding' && (
                <form onSubmit={requestSaveBranding} className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* App Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre de la Aplicación</label>
                                <input
                                    name="app_name"
                                    value={brandingForm.app_name}
                                    onChange={handleBrandingChange}
                                    className="w-full border p-2 rounded"
                                    placeholder="Induwell Cloud"
                                />
                            </div>

                            {/* Sidebar Colors Section */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded bg-slate-600"></span>
                                    Colores del Sidebar
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { name: 'sidebar_bg_color', label: 'Fondo' },
                                        { name: 'sidebar_text_color', label: 'Texto' },
                                        { name: 'sidebar_hover_color', label: 'Hover' },
                                        { name: 'sidebar_active_color', label: 'Activo' },
                                    ].map(({ name, label }) => (
                                        <div key={name}>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    name={name}
                                                    value={brandingForm[name]}
                                                    onChange={handleBrandingChange}
                                                    className="h-9 w-14 cursor-pointer border rounded flex-shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    name={name}
                                                    value={brandingForm[name]}
                                                    onChange={handleBrandingChange}
                                                    className="w-full border p-1.5 rounded text-sm uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Button Colors Section */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded bg-blue-500"></span>
                                    Colores de Botones
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { name: 'button_bg_color', label: 'Fondo' },
                                        { name: 'button_text_color', label: 'Texto' },
                                        { name: 'button_hover_color', label: 'Hover' },
                                        { name: 'button_border_color', label: 'Borde' },
                                    ].map(({ name, label }) => (
                                        <div key={name}>
                                            <label className="block text-xs font-medium text-blue-600 mb-1">{label}</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    name={name}
                                                    value={brandingForm[name]}
                                                    onChange={handleBrandingChange}
                                                    className="h-9 w-14 cursor-pointer border rounded flex-shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    name={name}
                                                    value={brandingForm[name]}
                                                    onChange={handleBrandingChange}
                                                    className="w-full border p-1.5 rounded text-sm uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium mb-1">Logotipo</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {previewLogo ? (
                                    <img src={previewLogo} alt="Preview" className="h-32 object-contain mb-2" />
                                ) : (
                                    <div className="h-32 w-32 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-gray-400">
                                        <Upload size={32} />
                                    </div>
                                )}
                                <span className="text-secondary font-medium">Click para subir imagen</span>
                                <span className="text-xs text-gray-500">Recomendado: PNG transparente</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary flex items-center gap-2">
                            <Save size={18} /> Guardar Personalización
                        </button>
                    </div>
                </form>
            )}

            {/* SMTP Tab */}
            {activeTab === 'smtp' && (
                <form onSubmit={requestSaveSmtp} className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Host</label>
                            <input name="smtp_host" value={smtpForm.smtp_host || ''} onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Puerto</label>
                            <input name="smtp_port" value={smtpForm.smtp_port || ''} onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Usuario</label>
                            <input name="smtp_user" value={smtpForm.smtp_user || ''} onChange={(e) => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input type="password" name="smtp_pass" value={smtpForm.smtp_pass || ''} onChange={(e) => setSmtpForm({ ...smtpForm, smtp_pass: e.target.value })} className="w-full border p-2 rounded" />
                        </div>
                        <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="smtp_secure"
                                checked={smtpForm.smtp_secure === 'true' || smtpForm.smtp_secure === true}
                                onChange={(e) => setSmtpForm({ ...smtpForm, smtp_secure: e.target.checked ? 'true' : 'false' })}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="smtp_secure" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Usar conexión segura (SSL/TLS) - Recomendado para puerto 465
                            </label>
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary flex items-center gap-2">
                            <Save size={18} /> Guardar SMTP
                        </button>
                    </div>
                </form>
            )}

            {/* Approvals Tab */}
            {activeTab === 'approvals' && (
                <form onSubmit={requestSaveApprovals} className="space-y-6 animate-in fade-in duration-300">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Reglas de Aprobación</h3>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Monto Mínimo para Aprobación de Dirección
                            </label>
                            <div className="relative max-w-xs">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={approvalForm.APPROVAL_MIN_AMOUNT}
                                    onChange={(e) => setApprovalForm({ ...approvalForm, APPROVAL_MIN_AMOUNT: e.target.value })}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Las solicitudes que superen este monto cambiarán a estado "Aprobado Jefe" después de la aprobación del gerente.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Shield className="text-purple-600" size={20} /> Directores Autorizados
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                            {users.map(user => (
                                <label key={user.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={approvalForm.DIRECTOR_USER_IDS.includes(user.id)}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setApprovalForm(prev => {
                                                const newIds = isChecked
                                                    ? [...prev.DIRECTOR_USER_IDS, user.id]
                                                    : prev.DIRECTOR_USER_IDS.filter(id => id !== user.id);
                                                return { ...prev, DIRECTOR_USER_IDS: newIds };
                                            });
                                        }}
                                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email} • {user.role}</p>
                                    </div>
                                    {user.role === 'Admin' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>}
                                </label>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Selecciona los usuarios que tendrán permiso para aprobar solicitudes escaladas a Dirección.
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary flex items-center gap-2">
                            <Save size={18} /> Guardar Configuración
                        </button>
                    </div>
                </form>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={
                    confirmModal.type === 'branding' ? confirmSaveBranding :
                        confirmModal.type === 'smtp' ? confirmSaveSmtp :
                            confirmSaveApprovals
                }
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Guardar Cambios"
                confirmColor="green"
            />
        </div>
    );
};
export default AdminSettings;

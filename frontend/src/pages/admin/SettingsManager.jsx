import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, RefreshCw } from 'lucide-react';

const SettingsManager = () => {
    const [settings, setSettings] = useState({
        APPROVAL_MIN_AMOUNT: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...res.data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await api.put('/settings', settings);
            alert('Configuración guardada exitosamente');
        } catch (error) {
            alert('Error al guardar configuración');
        }
    };

    if (loading) return <div>Cargando configuración...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Configuración del Sistema</h2>
                <button onClick={fetchSettings} className="p-2 text-gray-500 hover:text-blue-600">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Aprobaciones</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Mínimo para Aprobación de Dirección
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Las solicitudes que superen este monto requerirán una aprobación adicional.
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">$</span>
                            <input
                                type="number"
                                name="APPROVAL_MIN_AMOUNT"
                                value={settings.APPROVAL_MIN_AMOUNT}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="1000.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Save size={18} /> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Dynamic Logo
    const logoSrc = settings.logo_url ? `${import.meta.env.VITE_API_URL || '/api'}${settings.logo_url}` : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/users/login', { email, password });
            console.log('Login Response Data:', res.data); // DEBUG

            // Fallback for role if missing (migration compatibility)
            if (!res.data.role && res.data.role_old) {
                console.warn('Role missing, using role_old as fallback');
                res.data.role = res.data.role_old;
            }

            // Store user in local storage or state
            localStorage.setItem('user', JSON.stringify(res.data));

            // Callback to update parent state
            onLogin(res.data);

            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Error iniciando sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8 text-center bg-primary text-white flex flex-col items-center justify-center">
                    {logoSrc && (
                        <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain mb-4 bg-white/10 rounded-lg p-2" />
                    )}
                    <h1 className="text-3xl font-bold mb-2">{settings.app_name || 'Induwell Cloud-Cash'}</h1>
                    <p className="text-blue-100">Control de Gastos y Viáticos</p>
                </div>

                <div className="p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Iniciar Sesión</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="usuario@induwell.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? 'Iniciando...' : 'Entrar al Sistema'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-400">
                        &copy; 2026 Induwell. Todos los derechos reservados.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

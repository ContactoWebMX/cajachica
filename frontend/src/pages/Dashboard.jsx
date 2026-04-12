import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DollarSign, FileText, Activity, TrendingUp, TrendingDown, Users, Layers, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell,
    LineChart, Line,
    AreaChart, Area,
} from 'recharts';

/* ─── Color Palette ──────────────────────────────── */
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];
const statusColors = {
    Pendiente: '#f59e0b',
    'Aprobado Jefe': '#2977edff',
    'Aprobado Director': '#10b981',
    Pagado: '#8715f1ff',
    Rechazado: '#ef4444',
};

/* ─── Tooltip personalizado ──────────────────────── */
const CurrencyTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: {formatCurrency(p.value)}
                </p>
            ))}
        </div>
    );
};

const CountTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
            ))}
        </div>
    );
};

/* ─── KPI Card ───────────────────────────────────── */
const KpiCard = ({ label, value, icon: Icon, colorClass, subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon size={22} />
        </div>
        <div className="flex-1">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

/* ─── Section Card ───────────────────────────────── */
const ChartCard = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-5 ${className}`}>
        <h3 className="text-[10px] md:text-sm font-semibold text-gray-400 md:text-gray-600 uppercase tracking-wide mb-3 md:mb-4">{title}</h3>
        {children}
    </div>
);

/* ═══════════════════════════════════════════════════
   DASHBOARD COMPONENT
═══════════════════════════════════════════════════ */
const Dashboard = () => {
    const { setPageTitle } = useOutletContext();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [balanceData, setBalanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { setPageTitle('Dashboard'); }, [setPageTitle]);

    useEffect(() => {
        const fetchAll = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;
            setLoading(true);

            try {
                const params = new URLSearchParams();
                const isAdmin = ['admin', 'cajero', "director"].includes(user.role?.toLowerCase());
                const isManager = ['manager', 'gerente'].includes(user.role?.toLowerCase());
                // Admins/Cajeros see everything; Managers see reports too
                if (!isAdmin) {
                    params.append('user_id', user.id);
                    if (isManager) params.append('include_reports', 'true');
                }
                const qs = params.toString();

                const [balRes, expRes, advRes] = await Promise.all([
                    api.get(`/advances/balance/${user.id}`),
                    api.get(`/expenses?${qs}`),
                    api.get(`/advances?${qs}`),
                ]);

                let bd = balRes.data;
                // Fetch global stats for all users to show 'Caja Real' and 'Fondo Global' in the Universal Top Bar
                try {
                    const stats = await api.get(`/finance/stats?user_id=${user.id}`);
                    bd = { ...bd, ...stats.data };
                } catch { /* silent */ }

                let pendingCount = 0;
                if (['admin', 'cajero', 'director', 'manager', 'gerente'].includes(user.role?.toLowerCase())) {
                    try {
                        const roleName = user.role?.toLowerCase();
                        let status = 'Pendiente';
                        if (roleName === 'cajero') status = 'Aprobado Director';
                        else if (['admin', 'gerente', 'director'].includes(roleName)) {
                            status = (roleName === 'admin') ? 'AdminPending' : 'Aprobado Jefe';
                        }
                        const [pExp, pAdv] = await Promise.all([
                            api.get(`/approvals/pending?manager_id=${user.id}&status=${status}`),
                            api.get(`/approvals/pending-advances?manager_id=${user.id}&status=${status}`)
                        ]);
                        pendingCount = pExp.data.length + pAdv.data.length;
                    } catch { /* silent */ }
                }
                bd = { ...bd, pendingCount };

                setBalanceData(bd);
                setExpenses(expRes.data);
                setAdvances(advRes.data);
            } catch (e) {
                console.error('Dashboard fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    /* ── Derived metrics ── */
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = ['admin', 'cajero', 'director'].includes(currentUser?.role?.toLowerCase());

    /* Date Filtering Logic */
    const [filterPeriod, setFilterPeriod] = useState('current_month'); // 'current_month', 'last_month', 'ytd', 'all', 'custom'
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    const dateBounds = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        if (filterPeriod === 'current_month') {
            return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) };
        } else if (filterPeriod === 'last_month') {
            return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) };
        } else if (filterPeriod === 'ytd') {
            return { start: new Date(y, 0, 1), end: new Date(now.setHours(23, 59, 59, 999)) };
        } else if (filterPeriod === 'custom') {
            return {
                start: customDates.start ? new Date(customDates.start + 'T00:00:00') : new Date('2000-01-01'),
                end: customDates.end ? new Date(customDates.end + 'T23:59:59') : new Date('2100-01-01')
            };
        }
        return { start: new Date('2000-01-01'), end: new Date('2100-01-01') };
    }, [filterPeriod, customDates]);

    const filteredExpenses = useMemo(() => {
        if (filterPeriod === 'all') return expenses;
        return expenses.filter(e => {
            const d = new Date(e.date || e.created_at);
            return d >= dateBounds.start && d <= dateBounds.end;
        });
    }, [expenses, dateBounds, filterPeriod]);

    const filteredAdvances = useMemo(() => {
        if (filterPeriod === 'all') return advances;
        return advances.filter(a => {
            const d = new Date(a.request_date);
            return d >= dateBounds.start && d <= dateBounds.end;
        });
    }, [advances, dateBounds, filterPeriod]);

    const anticipos = useMemo(() => filteredAdvances.filter(a => a.type !== 'Reembolso'), [filteredAdvances]);
    const reembolsos = useMemo(() => filteredAdvances.filter(a => a.type === 'Reembolso'), [filteredAdvances]);

    /* Trend Calculation (Current Month vs Last Month) */
    const expenseTrend = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const startCurr = new Date(y, m, 1);
        const startPrev = new Date(y, m - 1, 1);
        const endPrev = new Date(y, m, 0, 23, 59, 59);

        let curr = 0, prev = 0;
        expenses.forEach(e => {
            if (e.status === 'Rechazado') return;
            const d = new Date(e.date || e.created_at);
            if (d >= startCurr) curr += parseFloat(e.amount);
            else if (d >= startPrev && d <= endPrev) prev += parseFloat(e.amount);
        });
        const percent = prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
        return { current: curr, previous: prev, percent };
    }, [expenses]);

    /* Pendientes calculation */
    const isPending = (status) => ['Pendiente', 'Aprobado Jefe', 'Aprobado Director', 'AdminPending'].includes(status);
    const pendingExpenses = useMemo(() => filteredExpenses.filter(e => isPending(e.status)).length, [filteredExpenses]);
    const pendingAdvances = useMemo(() => anticipos.filter(a => isPending(a.status)).length, [anticipos]);
    const pendingReimbursements = useMemo(() => reembolsos.filter(a => isPending(a.status)).length, [reembolsos]);

    /* 1. Gasto por categoría */
    const byCategory = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => {
            const k = e.category_name || 'Sin categoría';
            if (!map[k]) map[k] = { name: k, monto: 0, cantidad: 0 };
            map[k].monto += parseFloat(e.amount) || 0;
            map[k].cantidad++;
        });
        return Object.values(map).sort((a, b) => b.monto - a.monto).slice(0, 8);
    }, [filteredExpenses]);

    /* 2. Gasto por empresa */
    const byCompany = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => {
            const k = e.company_name || 'Sin empresa';
            if (!map[k]) map[k] = { name: k, monto: 0 };
            map[k].monto += parseFloat(e.amount) || 0;
        });
        return Object.values(map).sort((a, b) => b.monto - a.monto).slice(0, 8);
    }, [filteredExpenses]);

    /* 3. Distribución de estados (gastos) */
    const byStatus = useMemo(() => {
        const map = {};
        [...filteredExpenses, ...filteredAdvances].forEach(t => {
            const k = t.status || 'Desconocido';
            map[k] = (map[k] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses, filteredAdvances]);

    /* 4. Flujo mensual (últimos 6 meses) */
    const monthlyFlow = useMemo(() => {
        const map = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
            map[key] = { mes: key, gastos: 0, anticipos: 0 };
        }
        expenses.forEach(e => {
            const d = new Date(e.created_at || e.date);
            const key = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
            if (map[key]) map[key].gastos += parseFloat(e.amount) || 0;
        });
        anticipos.forEach(a => {
            const d = new Date(a.request_date);
            const key = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
            if (map[key]) map[key].anticipos += parseFloat(a.amount_requested) || 0;
        });
        return Object.values(map);
    }, [expenses, anticipos]);

    /* 5. Top usuarios */
    const topUsers = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => {
            const k = e.user_name || 'Desconocido';
            if (!map[k]) map[k] = { name: k, gastos: 0, monto: 0 };
            map[k].gastos++;
            map[k].monto += parseFloat(e.amount) || 0;
        });
        return Object.values(map).sort((a, b) => b.monto - a.monto).slice(0, 5);
    }, [filteredExpenses]);

    /* 6. Centro de costos */
    const byCostCenter = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => {
            const k = e.cost_center_name || 'Sin centro';
            if (!map[k]) map[k] = { name: k, monto: 0 };
            map[k].monto += parseFloat(e.amount) || 0;
        });
        return Object.values(map).sort((a, b) => b.monto - a.monto).slice(0, 6);
    }, [filteredExpenses]);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>;

    return (
        <div className="space-y-6">

            {/* ── ALIGN HEADER WITH DATE FORMATTER ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-1 gap-4">
                <div className="flex items-center gap-2 text-indigo-600">
                    <TrendingUp size={20} />
                    <span className="font-bold text-sm tracking-wide">
                        Tendencia vs Mes Anterior:
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs text-white ${expenseTrend.percent > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                            {expenseTrend.percent > 0 ? '▲' : '▼'} {Math.abs(expenseTrend.percent)}%
                        </span>
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {filterPeriod === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 w-full md:w-auto">
                            <input
                                type="date"
                                value={customDates.start}
                                onChange={e => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 py-1.5 px-2 rounded-lg shadow-sm focus:ring-primary focus:border-primary flex-1 md:flex-none"
                            />
                            <span className="text-gray-400 font-bold">-</span>
                            <input
                                type="date"
                                value={customDates.end}
                                onChange={e => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 py-1.5 px-2 rounded-lg shadow-sm focus:ring-primary focus:border-primary flex-1 md:flex-none"
                            />
                        </div>
                    )}
                    <select
                        value={filterPeriod}
                        onChange={e => setFilterPeriod(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 py-1.5 px-3 rounded-lg shadow-sm focus:ring-primary focus:border-primary cursor-pointer hover:bg-gray-100 transition-colors w-full md:w-auto"
                    >
                        <option value="current_month">Este Mes</option>
                        <option value="last_month">Mes Anterior</option>
                        <option value="ytd">Este Año</option>
                        <option value="custom">Personalizado</option>
                        <option value="all">Histórico Completo</option>
                    </select>
                </div>
            </div>

            {/* ── UNIVERSAL TOP BAR ── */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-3 md:p-4 flex flex-col xl:flex-row items-center justify-between gap-4">
                {/* Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap items-center gap-3 md:gap-5 justify-center w-full xl:w-auto xl:justify-start">

                    {/* Global Important Metrics (Admins Only) */}
                    {isAdmin && (
                        <>
                            <div className="flex items-center gap-3 bg-blue-600 border border-blue-700 pl-3 pr-4 md:pr-5 py-2 rounded-lg shadow-md text-white col-span-1 md:col-span-1">
                                <div className="p-1.5 md:p-2 rounded-md bg-blue-500">
                                    <DollarSign size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-blue-100 font-semibold text-[10px] uppercase tracking-widest">Caja Real</p>
                                    <p className="font-extrabold text-lg md:text-xl leading-none mt-0.5">{formatCurrency(balanceData?.global_balance || 0)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-emerald-600 border border-emerald-700 pl-3 pr-4 md:pr-5 py-2 rounded-lg shadow-md text-white col-span-1 md:col-span-1">
                                <div className="p-1.5 md:p-2 rounded-md bg-emerald-500">
                                    <Layers size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-emerald-100 font-semibold text-[10px] uppercase tracking-widest">Por comprobar</p>
                                    <p className="font-extrabold text-lg md:text-xl leading-none mt-0.5">{formatCurrency(balanceData?.global_unproven_balance || 0)}</p>
                                </div>
                            </div>

                            <div className="hidden xl:block h-10 w-px bg-gray-300 mx-2"></div>
                        </>
                    )}

                    {/* Personal Metrics Grid for Mobile */}
                    <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:items-center sm:gap-5">
                        <div className="flex items-center gap-3 col-span-1 border border-gray-50 md:border-none p-2 rounded-lg">
                            <div className={`p-1.5 rounded-lg ${balanceData?.balance < 0 ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
                                <DollarSign size={16} />
                            </div>
                            <div>
                                <p className="text-gray-400 font-medium text-[9px] uppercase tracking-widest leading-tight">{balanceData?.balance < 0 ? "A Favor" : "Mío"}</p>
                                <p className="font-bold text-gray-900 text-sm md:text-lg leading-none mt-0.5">{formatCurrency(Math.abs(balanceData?.balance || 0))}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 col-span-1 border border-gray-50 md:border-none p-2 rounded-lg">
                            <div>
                                <p className="text-gray-400 font-medium text-[9px] uppercase tracking-widest">Anticipos</p>
                                <p className="font-semibold text-gray-800 text-xs md:text-base">{formatCurrency(balanceData?.total_advances || 0)}</p>
                            </div>
                        </div>

                        <div className="hidden sm:block h-8 w-px bg-gray-200"></div>

                        <div className="flex items-center gap-3 col-span-1 border border-gray-50 md:border-none p-2 rounded-lg">
                            <div>
                                <p className="text-gray-400 font-medium text-[9px] uppercase tracking-widest">Mis Gastos</p>
                                <p className="font-semibold text-gray-800 text-xs md:text-base">{formatCurrency(balanceData?.total_proven_expenses || 0)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 col-span-1 border border-gray-50 md:border-none p-2 rounded-lg">
                            <div>
                                <p className="text-gray-400 font-medium text-[9px] uppercase tracking-widest">Reembolsos</p>
                                <p className="font-semibold text-gray-800 text-xs md:text-base">{formatCurrency(balanceData?.total_reimbursements || 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Center Pill */}
                {(isAdmin || balanceData?.pendingCount > 0) && (
                    <div className={`flex items-center border rounded-xl sm:rounded-full pl-4 pr-1 py-1 shadow-sm w-full sm:w-auto justify-between sm:justify-center ${balanceData?.pendingCount > 0 ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex items-center gap-2 mr-4">
                            <CheckCircle size={16} className={balanceData?.pendingCount > 0 ? "text-indigo-600" : "text-gray-400"} />
                            <span className={`${balanceData?.pendingCount > 0 ? "text-indigo-900" : "text-gray-500"} font-semibold text-[11px] md:text-sm`}>Pendientes:</span>
                            <span className={`${balanceData?.pendingCount > 0 ? "bg-indigo-600" : "bg-gray-500"} text-white font-bold px-2 py-0.5 rounded-full text-xs shadow-sm`}>
                                {balanceData?.pendingCount || 0}
                            </span>
                        </div>
                        <button
                            onClick={() => navigate("/approvals")}
                            className={`bg-white text-[11px] md:text-sm font-bold py-1.5 px-4 rounded-lg sm:rounded-full border transition-colors shadow-sm flex items-center gap-1 ${balanceData?.pendingCount > 0 ? "text-indigo-700 border-indigo-200 hover:bg-indigo-50" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                        >
                            Aprobar
                        </button>
                    </div>
                )}
            </div>

            {/* ── Global Executive Summary (Admin Only) ── */}
            {isAdmin && (
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen Ejecutivo Global</h2>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${balanceData?.global_employee_debt > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
                        <KpiCard label="Anticipos Globales"
                            value={formatCurrency(balanceData?.global_total_advances || 0)}
                            icon={Activity} colorClass="bg-indigo-50 text-indigo-700" />

                        <KpiCard label="Gastos Probados"
                            value={formatCurrency(balanceData?.global_total_proven_expenses || 0)}
                            icon={FileText} colorClass="bg-orange-50 text-orange-700" />

                        <KpiCard label="Reembolsos"
                            value={formatCurrency(balanceData?.global_total_reimbursements || 0)}
                            icon={TrendingUp} colorClass="bg-teal-50 text-teal-700" />

                        {(balanceData?.global_employee_debt > 0) && (
                            <KpiCard label="A Favor de Empleados"
                                value={formatCurrency(balanceData?.global_employee_debt || 0)}
                                icon={TrendingUp} colorClass="bg-red-600 text-white"
                                subtitle="Deuda por anticipos excedidos" />
                        )}
                    </div>
                </div>
            )}

            {/* ── Fila 2: Flujo mensual + Estados ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Flujo Mensual (últimos 6 meses)" className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={monthlyFlow}>
                            <defs>
                                <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gAnticipos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={v => "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CurrencyTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f97316" fill="url(#gGastos)" strokeWidth={2} />
                            <Area type="monotone" dataKey="anticipos" name="Anticipos" stroke="#3b82f6" fill="url(#gAnticipos)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Distribución de Estados">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={byStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                dataKey="value" nameKey="name" paddingAngle={3}>
                                {byStatus.map((entry, i) => (
                                    <Cell key={i} fill={statusColors[entry.name] || COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CountTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
            {/* ── Fila 2: Por categoría + Por empresa ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Gasto por Categoría">
                    {byCategory.length === 0
                        ? <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                        : <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={byCategory} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CurrencyTooltip />} />
                                <Bar dataKey="monto" name="Monto" radius={[0, 4, 4, 0]}>
                                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    }
                </ChartCard>

                <ChartCard title="Gasto por Empresa">
                    {byCompany.length === 0
                        ? <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                        : <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={byCompany} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CurrencyTooltip />} />
                                <Bar dataKey="monto" name="Monto" radius={[0, 4, 4, 0]}>
                                    {byCompany.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    }
                </ChartCard>
            </div>

            {/* ── Fila 3: Centro de costos + Top usuarios ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Gasto por Centro de Costos">
                    {byCostCenter.length === 0
                        ? <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                        : <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={byCostCenter}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CurrencyTooltip />} />
                                <Bar dataKey="monto" name="Monto" radius={[4, 4, 0, 0]}>
                                    {byCostCenter.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    }
                </ChartCard>

                <ChartCard title="Top 5 Usuarios por Monto">
                    {topUsers.length === 0
                        ? <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                        : <div className="space-y-3">
                            {topUsers.map((u, i) => {
                                const maxMonto = topUsers[0].monto || 1;
                                const pct = Math.round((u.monto / maxMonto) * 100);
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 truncate max-w-[60%]">{u.name}</span>
                                            <span className="text-gray-500">{formatCurrency(u.monto)} <span className="text-gray-400 text-xs">({u.gastos})</span></span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    }
                </ChartCard>
            </div>

            {/* ── Resumen de solicitudes con notificaciones de pendientes ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Carta de Gastos */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Gastos</p>
                            <p className="text-2xl font-black text-gray-800">{filteredExpenses.length} <span className="text-xs text-gray-400 font-medium lowercase">en este periodo</span></p>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg"><FileText className="text-orange-400" size={24} /></div>
                    </div>
                    <div>
                        {pendingExpenses > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-sm">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                {pendingExpenses} Pendiente(s)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                0 Pendientes
                            </span>
                        )}
                    </div>
                </div>

                {/* Carta de Anticipos */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Anticipos</p>
                            <p className="text-2xl font-black text-gray-800">{anticipos.length} <span className="text-xs text-gray-400 font-medium lowercase">en este periodo</span></p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="text-blue-400" size={24} /></div>
                    </div>
                    <div>
                        {pendingAdvances > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white shadow-sm">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                {pendingAdvances} Pendiente(s)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                0 Pendientes
                            </span>
                        )}
                    </div>
                </div>

                {/* Carta de Reembolsos */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Reembolsos</p>
                            <p className="text-2xl font-black text-gray-800">{reembolsos.length} <span className="text-xs text-gray-400 font-medium lowercase">en este periodo</span></p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp className="text-purple-400" size={24} /></div>
                    </div>
                    <div>
                        {pendingReimbursements > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500 text-white shadow-sm">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                {pendingReimbursements} Pendiente(s)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                0 Pendientes
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

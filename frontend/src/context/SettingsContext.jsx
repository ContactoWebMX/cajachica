import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        app_name: 'Induwell Caja Chica',
        logo_url: null,
        primary_color: '#404040',
        secondary_color: '#525252',
        accent_color: '#3b82f6',
        sidebar_bg_color: '#404040',
        sidebar_text_color: '#ffffff',
        sidebar_hover_color: '#525252',
        sidebar_active_color: '#3b82f6',
        button_bg_color: '#525252',
        button_text_color: '#ffffff',
        button_hover_color: '#404040',
        button_border_color: '#525252',
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data) {
                setSettings(prev => ({ ...prev, ...res.data }));
                applyTheme(res.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (themeSettings) => {
        const root = document.documentElement;
        if (themeSettings.primary_color) root.style.setProperty('--color-primary', themeSettings.primary_color);
        if (themeSettings.secondary_color) root.style.setProperty('--color-secondary', themeSettings.secondary_color);
        if (themeSettings.accent_color) root.style.setProperty('--color-accent', themeSettings.accent_color);

        if (themeSettings.sidebar_bg_color) root.style.setProperty('--color-sidebar-bg', themeSettings.sidebar_bg_color);
        if (themeSettings.sidebar_text_color) root.style.setProperty('--color-sidebar-text', themeSettings.sidebar_text_color);
        if (themeSettings.sidebar_hover_color) root.style.setProperty('--color-sidebar-hover', themeSettings.sidebar_hover_color);
        if (themeSettings.sidebar_active_color) root.style.setProperty('--color-sidebar-active', themeSettings.sidebar_active_color);

        if (themeSettings.button_bg_color) root.style.setProperty('--color-button-bg', themeSettings.button_bg_color);
        if (themeSettings.button_text_color) root.style.setProperty('--color-button-text', themeSettings.button_text_color);
        if (themeSettings.button_hover_color) root.style.setProperty('--color-button-hover', themeSettings.button_hover_color);
        if (themeSettings.button_border_color) root.style.setProperty('--color-button-border', themeSettings.button_border_color);
    };

    const updateSettings = async (newSettings) => {
        // newSettings can be FormData or Object
        try {
            await api.post('/settings', newSettings);
            await fetchSettings(); // Refresh to get latest (including processed logo URL)
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Bell, Mail, Shield, Database, Globe, Loader2 } from "lucide-react";

interface SettingsData {
    site_name: string;
    contact_email: string;
    default_language: string;
    timezone: string;
    ai_provider: string;
    email_provider: string;
    webhook_url: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsData>({
        site_name: 'Alea Signature',
        contact_email: 'info@aleasignature.com',
        default_language: 'es',
        timezone: 'Europe/Madrid',
        ai_provider: 'minimax',
        email_provider: 'resend',
        webhook_url: 'https://if8rkq6j.insforge.app/api/webhook/email'
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Simulate save
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Configuración</h1>
                    <p className="text-sm text-muted-foreground mt-1">Preferencias y configuración general del sistema</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span className="text-sm font-medium">{saved ? '✓ Guardado' : 'Guardar Cambios'}</span>
                </button>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8 max-w-4xl">
                {/* General */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Globe size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="font-medium">General</h2>
                            <p className="text-xs text-muted-foreground">Configuración básica del sitio</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Nombre del Sitio</label>
                            <input 
                                type="text" 
                                value={settings.site_name}
                                onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Email de Contacto</label>
                            <input 
                                type="email" 
                                value={settings.contact_email}
                                onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Idioma</label>
                                <select 
                                    value={settings.default_language}
                                    onChange={(e) => setSettings({...settings, default_language: e.target.value})}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50"
                                >
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Zona Horaria</label>
                                <select 
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50"
                                >
                                    <option value="Europe/Madrid">Europe/Madrid</option>
                                    <option value="Europe/London">Europe/London</option>
                                    <option value="America/New_York">America/New_York</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI & Integrations */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Settings size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="font-medium">IA y Integraciones</h2>
                            <p className="text-xs text-muted-foreground">Configuración de servicios externos</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Proveedor de IA</label>
                            <select 
                                value={settings.ai_provider}
                                onChange={(e) => setSettings({...settings, ai_provider: e.target.value})}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50"
                            >
                                <option value="minimax">MiniMax</option>
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Proveedor de Email</label>
                            <select 
                                value={settings.email_provider}
                                onChange={(e) => setSettings({...settings, email_provider: e.target.value})}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50"
                            >
                                <option value="resend">Resend</option>
                                <option value="sendgrid">SendGrid</option>
                                <option value="mailgun">Mailgun</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Webhook URL</label>
                            <input 
                                type="url" 
                                value={settings.webhook_url}
                                onChange={(e) => setSettings({...settings, webhook_url: e.target.value})}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50 font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <Shield size={20} className="text-green-500" />
                        </div>
                        <div>
                            <h2 className="font-medium">Seguridad</h2>
                            <p className="text-xs text-muted-foreground">Configuración de seguridad y acceso</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <Bell size={18} className="text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Registro de actividad</p>
                                    <p className="text-xs text-muted-foreground">Guardar todas las acciones del sistema</p>
                                </div>
                            </div>
                            <button className="relative w-12 h-6 bg-green-500 rounded-full">
                                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <Mail size={18} className="text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Notificaciones por email</p>
                                    <p className="text-xs text-muted-foreground">Recibir alertas de actividad importante</p>
                                </div>
                            </div>
                            <button className="relative w-12 h-6 bg-green-500 rounded-full">
                                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
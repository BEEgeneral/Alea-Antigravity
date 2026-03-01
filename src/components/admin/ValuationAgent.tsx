"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calculator, Info, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ValuationAgent() {
    const [marketValue, setMarketValue] = useState<number>(0);
    const [meters, setMeters] = useState<number>(0);
    const [exclusivityScore, setExclusivityScore] = useState<number>(0.1); // E
    const [accessScore, setAccessScore] = useState<number>(0.1); // A

    // Calculate Vp = (M^2 * Pm) * (1 + E + A)
    const baseValue = marketValue * meters;
    const strategicValue = baseValue * (1 + exclusivityScore + accessScore);
    const valueDifference = strategicValue - baseValue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto w-full p-8"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-medium flex items-center gap-3">
                        <ShieldCheck className="text-primary w-8 h-8" /> Alea Intelligence Engine: Valuation Agent
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Infraestructura de cálculo fiduciario: Determinación algorítmica de Prima Estratégica (Vp).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Parameters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Core Market Data
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold mb-2">Precio de Mercado (Pm) / m²</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
                                    <input
                                        type="number"
                                        value={marketValue || ''}
                                        onChange={(e) => setMarketValue(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="Ej. 12000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold mb-2">Superficie Patrimonial (M²)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={meters || ''}
                                        onChange={(e) => setMeters(Number(e.target.value))}
                                        className="w-full pr-10 pl-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="Ej. 250"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">m²</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Alea Strategic Multipliers
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="flex justify-between text-xs uppercase tracking-wider font-semibold mb-2">
                                    <span>Coeficiente Exclusividad (E)</span>
                                    <span className="text-primary">{(exclusivityScore * 100).toFixed(0)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.5"
                                    step="0.05"
                                    value={exclusivityScore}
                                    onChange={(e) => setExclusivityScore(Number(e.target.value))}
                                    className="w-full accent-primary"
                                />
                                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                                    Ponderación de atributos irrepetibles (ej. arquitectónicos, restricciones legales, licencias).
                                </p>
                            </div>

                            <div>
                                <label className="flex justify-between text-xs uppercase tracking-wider font-semibold mb-2">
                                    <span>Coeficiente Acceso / Privacidad (A)</span>
                                    <span className="text-primary">{(accessScore * 100).toFixed(0)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.5"
                                    step="0.05"
                                    value={accessScore}
                                    onChange={(e) => setAccessScore(Number(e.target.value))}
                                    className="w-full accent-primary"
                                />
                                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                                    Prima de due diligence y originación confidencial (protección contra exposición a mercado abierto).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Dashboard */}
                <div className="lg:col-span-2">
                    <div className="bg-primary text-primary-foreground rounded-[2.5rem] p-10 h-full flex flex-col justify-between relative overflow-hidden shadow-xl">
                        {/* Background elements */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Calculator className="w-48 h-48" />
                        </div>

                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-sm border border-white/10 shadow-sm">
                                <Info className="w-4 h-4" /> FÓRMULA: Vp = (M² × Pm) × (1 + E + A)
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-12 relative z-10">
                                <div>
                                    <p className="text-primary-foreground/70 text-[10px] uppercase tracking-widest font-bold mb-2">Valor Base Teórico (M² × Pm)</p>
                                    <p className="text-3xl font-serif">
                                        {baseValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-primary-foreground/70 text-[10px] uppercase tracking-widest font-bold mb-2">Prima Estratégica</p>
                                    <p className="text-3xl font-serif text-emerald-300">
                                        +{valueDifference.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
                            <p className="text-primary-foreground/90 text-sm uppercase tracking-widest font-bold mb-2">Target Fiduciario (Vp)</p>
                            <div className="flex items-end gap-4">
                                <p className="text-5xl md:text-6xl font-serif font-medium tracking-tight">
                                    {strategicValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="mt-8 flex gap-4">
                                <button className="flex-1 bg-white text-primary rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Generar Informe Fiduciario (Due Diligence)
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
}

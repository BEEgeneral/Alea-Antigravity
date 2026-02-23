"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { motion } from "framer-motion";

interface ProfitabilityCalculatorProps {
    basePrice: number;
    baseCapRate: number;
}

export function ProfitabilityCalculator({ basePrice, baseCapRate }: ProfitabilityCalculatorProps) {
    const [rentIncrease, setRentIncrease] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(25);

    const baseAnnualIncome = basePrice * (baseCapRate / 100);
    const adjustedIncome = baseAnnualIncome * (1 + rentIncrease / 100);
    const netIncome = adjustedIncome * (1 - taxRate / 100);

    const currentYield = (netIncome / basePrice) * 100;

    return (
        <div className="bg-muted/30 border border-border rounded-2xl p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calculator className="text-primary w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-medium">Dynamic Yield Calculator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-foreground">Projected Rent Increase</label>
                            <span className="text-sm text-muted-foreground">+{rentIncrease}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            value={rentIncrease}
                            onChange={(e) => setRentIncrease(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-foreground">Corporate Tax Rate</label>
                            <span className="text-sm text-muted-foreground">{taxRate}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="35"
                            value={taxRate}
                            onChange={(e) => setTaxRate(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center items-center text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Net Yield (Post-Tax)</p>
                    <motion.p
                        key={currentYield}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="font-serif text-4xl font-semibold text-primary"
                    >
                        {currentYield.toFixed(2)}%
                    </motion.p>
                    <p className="text-sm text-foreground/60 mt-3 font-medium">
                        Projected NOI: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(netIncome)}
                    </p>
                </div>
            </div>
        </div>
    );
}

"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "./Skeleton";


export interface Property {
    id: string;
    title: string;
    description: string;
    asset_type: string;
    location: string;
    price_eur: number;
    cap_rate: number;
    is_off_market: boolean;
    thumbnail_url: string;
}

interface PropertyCardProps {
    property: Property;
    userStatus: "public" | "registered" | "premium";
}

export function PropertyCard({ property, userStatus }: PropertyCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // If public and it's off-market, blur it strictly to drive curiosity/registration
    const isBlurred = property.is_off_market && userStatus === "public";

    return (
        <motion.div
            className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-md transition-all duration-500 hover:shadow-2xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -5 }}
        >
            {/* Image Container */}
            <div className="relative h-64 w-full overflow-hidden bg-muted">
                {/* Cinematic zoom effect on hover */}
                <div
                    className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'} ${isBlurred ? 'blur-md brightness-50' : 'brightness-90'}`}
                    style={{ backgroundImage: `url(${property.thumbnail_url})` }}
                />

                {/* Off-Market Lock Overlay */}
                {property.is_off_market && (
                    <div className="absolute top-4 right-4 z-10 glass-panel px-3 py-1.5 rounded-full flex items-center space-x-2 text-primary-foreground text-xs font-medium tracking-widest uppercase">
                        <Lock size={14} className="text-primary" />
                        <span>Off Market</span>
                    </div>
                )}

                {isBlurred && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                        <Lock size={32} className="text-primary mb-4" />
                        <h3 className="text-white font-serif text-xl font-medium mb-2">Restricted Access</h3>
                        <p className="text-white/80 text-sm font-sans mb-4">Se requiere verificación institucional para acceder a la Data Room de este mandato privado.</p>
                        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm transition-colors">
                            Request Access
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 relative bg-card">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2 block">
                            {property.asset_type} • {property.location}
                        </span>
                        <h3 className={`font-serif text-2xl font-medium ${isBlurred ? 'blur-sm select-none text-foreground/50' : 'text-foreground'}`}>
                            {isBlurred ? 'Exclusive Asset' : property.title}
                        </h3>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-6">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Asking Price</p>
                        <p className={`font-sans text-xl font-medium ${isBlurred ? 'blur-md select-none' : 'text-foreground'}`}>
                            {isBlurred ? '€00,000,000' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price_eur)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Cap Rate</p>
                        <p className={`font-serif text-2xl font-semibold text-primary ${isBlurred ? 'blur-sm select-none' : ''}`}>
                            {isBlurred ? 'X.XX' : property.cap_rate}%
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function PropertyCardSkeleton() {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-md">
            {/* Image Container Skeleton */}
            <div className="relative h-64 w-full bg-muted/40 animate-pulse overflow-hidden">
                <Skeleton className="absolute inset-0 h-full w-full" />
                <div className="absolute top-4 right-4 z-10 w-24 h-6 rounded-full bg-muted/60" />
            </div>

            {/* Content Skeleton */}
            <div className="p-6 relative bg-card">
                <div className="mb-4">
                    <Skeleton className="h-3 w-32 mb-2" />
                    <Skeleton className="h-8 w-64" />
                </div>

                <div className="flex items-end justify-between mt-6">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton className="h-3 w-16 ml-auto" />
                        <Skeleton className="h-8 w-12 ml-auto" />
                    </div>
                </div>
            </div>
        </div>
    );
}

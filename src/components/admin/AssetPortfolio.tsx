"use client";

import Image from "next/image";
import { MapPin, Building, Star, Maximize2, Bed, Bath, Search, Edit2, Trash2 } from "lucide-react";
import { Property } from "@/types/admin";

interface AssetPortfolioProps {
    properties: Property[];
    onSelectProperty: (property: Property) => void;
}

export default function AssetPortfolio({ properties, onSelectProperty }: AssetPortfolioProps) {
    return (
        <div className="bg-card border border-border rounded-[3rem] shadow-xl p-10 mt-10 max-w-5xl mx-auto overflow-hidden">
            <div className="flex justify-between items-center mb-10 px-6">
                <div>
                    <h2 className="text-2xl font-serif font-medium">Asset Portfolio</h2>
                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-1">Activos</p>
                </div>
                <button className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest">Publicar Activo</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((asset) => (
                    <div
                        key={asset.id}
                        onClick={() => onSelectProperty(asset)}
                        className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full shadow-sm cursor-pointer"
                    >
                        <div className="relative aspect-[16/10] overflow-hidden">
                            <Image
                                src={asset.images?.[0] || asset.image || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80"}
                                alt={asset.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center shadow-lg border border-primary/20">
                                    <Star size={10} className="mr-1 fill-white" />
                                    Exclusiva
                                </span>
                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-foreground text-[8px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-lg">
                                    {asset.status || 'Disponible'}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className="px-3 py-1 bg-primary/20 backdrop-blur-md text-primary text-[8px] font-black uppercase tracking-widest rounded-lg border border-primary/20">
                                    {asset.type || 'Piso'}
                                </span>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                                <Building size={80} className="text-white drop-shadow-2xl" />
                            </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                            <div className="mb-6">
                                <h4 className="text-lg font-serif font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 uppercase">
                                    {asset.title}
                                </h4>
                                <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                    <MapPin size={12} className="mr-2 text-primary/40" />
                                    {asset.address}
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-2xl font-serif font-bold text-primary">
                                        €{Number(asset.price).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Base</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-4 border-y border-border/30">
                                    <div className="flex flex-col items-center text-center">
                                        <Maximize2 size={14} className="text-primary/40 mb-1" />
                                        <span className="text-[10px] font-bold text-foreground">{asset.meters || 0}m²</span>
                                        <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-black">Sup</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <Bed size={14} className="text-primary/40 mb-1" />
                                        <span className="text-[10px] font-bold text-foreground">{asset.rooms || 0}</span>
                                        <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-black">Hab</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <Bath size={14} className="text-primary/40 mb-1" />
                                        <span className="text-[10px] font-bold text-foreground">{asset.bathrooms || 0}</span>
                                        <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-black">Baños</span>
                                    </div>
                                </div>

                                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic font-light">
                                    {asset.description || "Un activo exclusivo con gran potencial de rentabilidad y ubicación estratégica."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <div className="flex-1 bg-muted/40 hover:bg-primary/5 p-3 rounded-xl border border-border/60 hover:border-primary/20 transition-all flex items-center justify-center">
                                    <Search size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); }}
                                    className="flex-1 bg-muted/40 hover:bg-foreground/5 p-3 rounded-xl border border-border/60 hover:border-foreground/20 transition-all flex items-center justify-center"
                                >
                                    <Edit2 size={16} className="text-muted-foreground" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); }}
                                    className="flex-1 bg-muted/40 hover:bg-red-50 p-3 rounded-xl border border-border/60 hover:border-red-200 transition-all flex items-center justify-center"
                                >
                                    <Trash2 size={16} className="text-muted-foreground hover:text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

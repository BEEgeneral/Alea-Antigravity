"use client";

import AssetPyramid from "@/components/admin/AssetPyramid";
import { BarChart3 } from "lucide-react";

export default function PyramidPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-serif font-medium">Pirámide de Activos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Clasificación de activos por avance en CRM basada en interacciones, etapas y acciones
          </p>
        </div>
        <AssetPyramid />
      </div>
    </div>
  );
}

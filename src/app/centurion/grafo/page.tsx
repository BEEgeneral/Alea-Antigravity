"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";

const piedraColors: Record<string, string> = {
  ZAFIRO: "bg-blue-500/20 border-blue-500/40 text-blue-400",
  PERLA: "bg-purple-500/20 border-purple-500/40 text-purple-400",
  ESMERALDA: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
  RUBI: "bg-red-500/20 border-red-500/40 text-red-400",
};

const piedraEmojis: Record<string, string> = {
  ZAFIRO: "💎",
  PERLA: "🔮",
  ESMERALDA: "💚",
  RUBI: "❤️",
};

const activosColors: Record<string, string> = {
  HOTEL: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  TERRENO: "bg-orange-500/20 border-orange-500/40 text-orange-400",
  VILLA: "bg-cyan-500/20 border-cyan-500/40 text-cyan-400",
  EDIFICIO: "bg-indigo-500/20 border-indigo-500/40 text-indigo-400",
  PBSA: "bg-pink-500/20 border-pink-500/40 text-pink-400",
};

const activosEmojis: Record<string, string> = {
  HOTEL: "🏨",
  TERRENO: "🏗️",
  VILLA: "🏡",
  EDIFICIO: "🏢",
  PBSA: "🎓",
};

export default function GrafoPage() {
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-medium">Grafo de Operaciones</h1>
              <p className="text-sm text-muted-foreground">Red de perfiles y activos Alea Signature</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 2))}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`p-2 hover:bg-muted rounded-lg transition-colors ${showLegend ? "bg-primary/10 text-primary" : ""}`}
              title="Leyenda"
            >
              <Info size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-full mx-auto">
          {/* Grafo Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            <img
              src="/grafo_alea.png"
              alt="Grafo de Operaciones Alea Signature"
              className="w-full h-auto"
            />
          </motion.div>

          {/* Legend */}
          {showLegend && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-lg font-serif font-medium mb-4">Leyenda</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Perfiles */}
                <div>
                  <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Perfiles (Piedras Preciosas)</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💎</span>
                      <div>
                        <p className="text-sm font-medium">Zafiro</p>
                        <p className="text-xs text-muted-foreground">Diversión — sociable, competitivo</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🔮</span>
                      <div>
                        <p className="text-sm font-medium">Perla</p>
                        <p className="text-xs text-muted-foreground">Causa — leal, calmado, toca emocional</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💚</span>
                      <div>
                        <p className="text-sm font-medium">Esmeralda</p>
                        <p className="text-xs text-muted-foreground">Análisis — detallista, datos, proceso</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">❤️</span>
                      <div>
                        <p className="text-sm font-medium">Rubí</p>
                        <p className="text-xs text-muted-foreground">Desafío — competitivo, ambicioso, resultados</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activos */}
                <div>
                  <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Activos</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🏨</span>
                      <div>
                        <p className="text-sm font-medium">Hotel</p>
                        <p className="text-xs text-muted-foreground">Activos hoteleros</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🏗️</span>
                      <div>
                        <p className="text-sm font-medium">Terreno</p>
                        <p className="text-xs text-muted-foreground">Suelo y terrenos</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🏡</span>
                      <div>
                        <p className="text-sm font-medium">Villa</p>
                        <p className="text-xs text-muted-foreground">Residencial de lujo</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🏢</span>
                      <div>
                        <p className="text-sm font-medium">Edificio</p>
                        <p className="text-xs text-muted-foreground">Edificios y apartamentos</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🎓</span>
                      <div>
                        <p className="text-sm font-medium">PBSA</p>
                        <p className="text-xs text-muted-foreground">Purpose Built Student Accommodation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Las flechas representan relaciones entre perfiles y activos. Cada perfil puede operar en uno o más activos simultáneamente.
                  <br />
                  Para añadir nuevos perfiles al grafo, usa el <a href="/centurion/investors" className="text-primary hover:underline">directorio de inversores</a>.
                </p>
              </div>
            </motion.div>
          )}

          {/* Stats del grafo */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">7</p>
              <p className="text-sm text-muted-foreground">Perfiles clasificados</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-500">9</p>
              <p className="text-sm text-muted-foreground">Activos en operación</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-500">4</p>
              <p className="text-sm text-muted-foreground">Relaciones activas</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-purple-500">1</p>
              <p className="text-sm text-muted-foreground">Rafa Del Rivero (Rubí+Perla)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
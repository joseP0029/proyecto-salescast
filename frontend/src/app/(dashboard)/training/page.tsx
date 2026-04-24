"use client";
import { BrainCircuit, Play, BarChart3, Database } from "lucide-react";

export default function TrainingPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Entrenamiento del Modelo</h1>
          <p className="text-slate-400 mt-1">Administra y entrena tus modelos de machine learning.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2">
          <Play className="w-4 h-4" /> Iniciar Nuevo Entrenamiento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-200">Modelo Actual</h3>
          </div>
          <p className="text-2xl font-bold text-slate-50 mb-1">Random Forest v1.2</p>
          <p className="text-sm text-slate-400">Entrenado el: 20 Oct, 2024</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-200">Precisión (MAE)</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mb-1">1,240 USD</p>
          <p className="text-sm text-slate-400">Error promedio por predicción</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-200">Tamaño del Dataset</h3>
          </div>
          <p className="text-2xl font-bold text-slate-50 mb-1">1.2M Filas</p>
          <p className="text-sm text-slate-400">24 meses de datos históricos</p>
        </div>
      </div>
    </div>
  );
}

"use client";
import { LineChart, Settings2 } from "lucide-react";

export default function PredictionsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Predicciones de Ventas</h1>
        <p className="text-slate-400 mt-1">Genera pronósticos de ventas futuras basados en tu modelo entrenado.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-slate-300" />
            <h2 className="font-semibold text-slate-200">Parámetros</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Sucursal / Tienda</label>
              <select className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                <option>Todas las Tiendas</option>
                <option>NY Flagship</option>
                <option>LA Central</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Horizonte de Pronóstico</label>
              <select className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                <option>Próximos 30 Días</option>
                <option>Próximos 90 Días</option>
                <option>Próximos 6 Meses</option>
              </select>
            </div>
            <button className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              Generar Pronóstico
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[400px] shadow-sm">
          <div className="p-4 bg-slate-800/50 rounded-full mb-5 ring-4 ring-slate-800">
            <LineChart className="w-12 h-12 text-blue-500/50" />
          </div>
          <h3 className="text-xl font-medium text-slate-300 mb-2">Listo para Pronosticar</h3>
          <p className="text-slate-500 max-w-md">Ajusta los parámetros a la izquierda y da click en generar para visualizar tu gráfica de proyección y las tablas de datos aquí.</p>
        </div>
      </div>
    </div>
  );
}

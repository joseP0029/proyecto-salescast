"use client";
import { TrendingUp, Package, Store, ArrowUpRight, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const performanceData = [
  { name: 'Jan', actual: 4000, projected: 4100 },
  { name: 'Feb', actual: 3000, projected: 3200 },
  { name: 'Mar', actual: 2000, projected: 2150 },
  { name: 'Apr', actual: 2780, projected: 2600 },
  { name: 'May', actual: 1890, projected: 2000 },
  { name: 'Jun', actual: 2390, projected: 2400 },
  { name: 'Jul', actual: 3490, projected: 3600 },
  { name: 'Aug', actual: null, projected: 4000 },
  { name: 'Sep', actual: null, projected: 4500 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Resumen del Dashboard</h1>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4" /> Generar Nueva Predicción
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Ventas Totales (YTD)</p>
          <p className="text-3xl font-bold text-slate-50">$2.4M</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded flex items-center mr-2 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> +12%
            </span>
            <span className="text-slate-500">vs año pasado</span>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-16 h-16 text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Producto Top</p>
          <p className="text-xl font-bold text-slate-50 truncate pt-2">Premium Widget X</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">24% del ingreso total</span>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Store className="w-16 h-16 text-purple-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Tienda Top</p>
          <p className="text-xl font-bold text-slate-50 pt-2">NY Flagship</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded flex items-center mr-2 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> +8%
            </span>
            <span className="text-slate-500">crecimiento mensual</span>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart3 className="w-16 h-16 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Tendencia de Ventas</p>
          <p className="text-xl font-bold text-slate-50 pt-2">Al alza</p>
          <div className="mt-4 flex items-center text-sm text-slate-500">
            Basado en los últimos 30 días
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">Pronóstico de Ingresos</h3>
            <p className="text-sm text-slate-400 mt-1">Ventas reales vs predicciones de machine learning</p>
          </div>
          <div className="flex gap-4 text-sm bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 px-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              <span className="text-slate-300 font-medium">Real</span>
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="w-3 h-3 bg-indigo-500 border-2 border-indigo-500 border-dashed rounded-full bg-opacity-20"></div>
              <span className="text-slate-300 font-medium">Proyectado</span>
            </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#f8fafc', fontWeight: 500 }}
                formatter={(value) => {
                  if (value == null) return ["$0", ""];
                  return [`$${value}`, ""];
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
              />
              <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="6 4" fillOpacity={1} fill="url(#colorProjected)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#0f172a', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

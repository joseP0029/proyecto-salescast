"use client";
import { LineChart as LineChartIcon, Settings2, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface MLModel {
  id: number;
  dataset_id: number;
  created_at: string;
}

interface Prediction {
  target_date: string;
  store_nbr: number;
  family: string;
  predicted_value: number;
}

export default function PredictionsPage() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [horizon, setHorizon] = useState<string>("30");
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState("");
  
  const [selectedStore, setSelectedStore] = useState<string>("all");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/predictions/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModelId(data.models[data.models.length - 1].id.toString());
        }
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePredict = async () => {
    if (!selectedModelId) {
      setError("Por favor selecciona un modelo");
      return;
    }
    
    setIsPredicting(true);
    setError("");
    setPredictions([]);
    setSelectedStore("all");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/predictions/predict`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model_id: parseInt(selectedModelId),
          days_to_predict: parseInt(horizon)
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al generar predicciones");
      }
      
      const data = await res.json();
      setPredictions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  // Extract unique stores
  const uniqueStores = useMemo(() => {
    const stores = new Set<number>();
    predictions.forEach(p => stores.add(p.store_nbr));
    return Array.from(stores).sort((a, b) => a - b);
  }, [predictions]);

  // Format data for chart
  const chartData = useMemo(() => {
    if (predictions.length === 0) return [];
    
    // Filter by store if needed
    const filtered = selectedStore === "all" 
      ? predictions 
      : predictions.filter(p => p.store_nbr.toString() === selectedStore);
      
    // Aggregate sales by date (if all stores or all families)
    const aggregated: Record<string, number> = {};
    
    filtered.forEach(p => {
      const dateStr = new Date(p.target_date).toLocaleDateString();
      if (!aggregated[dateStr]) aggregated[dateStr] = 0;
      aggregated[dateStr] += p.predicted_value;
    });
    
    return Object.entries(aggregated)
      .map(([date, sales]) => ({ date, sales }))
      // Sort by date (basic sort, assumes valid date string formatting, might need proper Date parsing for complex locales)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [predictions, selectedStore]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Predicciones de Ventas</h1>
        <p className="text-slate-400 mt-1">Genera pronósticos de ventas futuras basados en tu modelo entrenado.</p>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-slate-300" />
            <h2 className="font-semibold text-slate-200">Parámetros</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Modelo</label>
              <select 
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">Selecciona un modelo...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>Modelo #{m.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Horizonte de Pronóstico</label>
              <select 
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="7">Próximos 7 Días</option>
                <option value="15">Próximos 15 Días</option>
                <option value="30">Próximos 30 Días</option>
                <option value="90">Próximos 90 Días</option>
              </select>
            </div>
            
            <button 
              onClick={handlePredict}
              disabled={isPredicting || !selectedModelId}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2"
            >
              {isPredicting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isPredicting ? "Calculando..." : "Generar Pronóstico"}
            </button>

            {predictions.length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-800">
                 <label className="block text-sm font-medium text-slate-400 mb-2">Filtro Visual: Tienda</label>
                 <select 
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="all">Todas las Tiendas (Agrupado)</option>
                  {uniqueStores.map(store => (
                    <option key={store} value={store.toString()}>Tienda {store}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[400px] shadow-sm overflow-hidden">
          {predictions.length === 0 ? (
            <>
              <div className="p-4 bg-slate-800/50 rounded-full mb-5 ring-4 ring-slate-800">
                <LineChartIcon className="w-12 h-12 text-blue-500/50" />
              </div>
              <h3 className="text-xl font-medium text-slate-300 mb-2">Listo para Pronosticar</h3>
              <p className="text-slate-500 max-w-md">Ajusta los parámetros a la izquierda y da click en generar para visualizar tu gráfica de proyección y las tablas de datos aquí.</p>
            </>
          ) : (
            <div className="w-full h-full flex flex-col">
              <h3 className="text-xl font-medium text-slate-200 mb-6 self-start">
                Proyección de Ventas {selectedStore === "all" ? "(Todas las Tiendas)" : `(Tienda ${selectedStore})`}
              </h3>
              <div className="flex-1 min-h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8' }} 
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8' }} 
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                      itemStyle={{ color: '#60a5fa' }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Ventas']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      name="Ventas Predichas" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} 
                      activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

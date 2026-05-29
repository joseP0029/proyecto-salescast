"use client";
import { LineChart as LineChartIcon, Settings2, Loader2, History, Trash2, Eye, TrendingUp, TrendingDown, Minus, CalendarRange, DollarSign, BarChart3 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Area,
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

interface PredictionRun {
  model_id: number;
  created_at: string;
  prediction_count: number;
}

interface Insights {
  feature_importances: Record<string, number>;
  total_projected: number;
  peak_day: string | null;
  trend: "upward" | "downward" | "stable";
}

export default function PredictionsPage() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [horizon, setHorizon] = useState<string>("30");

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState("");

  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");

  const [runs, setRuns] = useState<PredictionRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<{ model_id: number, created_at: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchHistory = async () => {
    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const baseUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      const token = localStorage.getItem("token");

      // Fetch models
      const resModels = await fetch(`${baseUrl}/api/predictions/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resModels.ok) {
        const data = await resModels.json();
        setModels(data.models);
        if (data.models.length > 0 && !selectedModelId) {
          setSelectedModelId(data.models[data.models.length - 1].id.toString());
        }
      }

      // Fetch runs
      const resRuns = await fetch(`${baseUrl}/api/predictions/runs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resRuns.ok) {
        const dataRuns = await resRuns.json();
        setRuns(dataRuns);
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

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const baseUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/predictions/predict`, {
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
      setIsPredicting(false);
      setSelectedStore("all");
      setSelectedFamily("all");
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
      setIsPredicting(false);
    }
  };

  const handleLoadRun = async (model_id: number, created_at: string) => {
    setError("");
    setSelectedStore("all");
    setSelectedFamily("all");
    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const baseUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/api/predictions/runs/${model_id}/${created_at}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Error al cargar la predicción");
      }

      const data = await res.json();
      setPredictions(data.predictions);
      setInsights(data.insights);
      setSelectedRun({ model_id, created_at });
      setSelectedModelId(model_id.toString());
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRun = async (model_id: number, created_at: string) => {
    if (!confirm("¿Estás seguro de eliminar este historial de predicción?")) return;

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const baseUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/api/predictions/runs/${model_id}/${created_at}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Error al eliminar la predicción");
      }

      if (selectedRun?.model_id === model_id && selectedRun?.created_at === created_at) {
        setPredictions([]);
        setSelectedRun(null);
      }

      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Extract unique stores
  const uniqueStores = useMemo(() => {
    const stores = new Set<number>();
    predictions.forEach(p => stores.add(p.store_nbr));
    return Array.from(stores).sort((a, b) => a - b);
  }, [predictions]);

  // Extract unique families
  const uniqueFamilies = useMemo(() => {
    const families = new Set<string>();
    predictions.forEach(p => families.add(p.family));
    return Array.from(families).sort();
  }, [predictions]);

  // Format data for chart
  const chartData = useMemo(() => {
    if (predictions.length === 0) return [];
    
    // Filter by store and family if needed
    const filtered = predictions.filter(p => {
      const matchStore = selectedStore === "all" || p.store_nbr.toString() === selectedStore;
      const matchFamily = selectedFamily === "all" || p.family === selectedFamily;
      return matchStore && matchFamily;
    });
      
    // Aggregate sales by date
    const aggregated: Record<string, number> = {};
    
    filtered.forEach(p => {
      const dateStr = new Date(p.target_date).toLocaleDateString();
      if (!aggregated[dateStr]) aggregated[dateStr] = 0;
      aggregated[dateStr] += p.predicted_value;
    });

    const baseData = Object.entries(aggregated)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item, index) => {
        // Base margin 8% + 0.5% per day into the future, capped at 25%
        const dynamicMargin = Math.min(0.08 + (index * 0.005), 0.25);
        const marginValue = item.sales * dynamicMargin;
        return {
          ...item,
          range: [
            Math.max(0, item.sales - marginValue), 
            item.sales + marginValue
          ],
          inflectionUp: undefined as number | undefined,
          inflectionDown: undefined as number | undefined
        };
      });

    // Detect Inflection Points (Slope Changes)
    if (baseData.length > 2) {
      const slopes = baseData.map((d, i, arr) => i === 0 ? 0 : d.sales - arr[i-1].sales);
      const slopeChanges = slopes.map((m, i, arr) => i === 0 ? 0 : m - arr[i-1]);
      
      const absChanges = slopeChanges.map(Math.abs);
      const meanChange = absChanges.reduce((a, b) => a + b, 0) / absChanges.length;
      const stdChange = Math.sqrt(absChanges.reduce((a, b) => a + Math.pow(b - meanChange, 2), 0) / absChanges.length);
      
      const threshold = meanChange + (stdChange * 1.5); // Sensitive threshold
      
      baseData.forEach((d, i) => {
        if (i > 1 && absChanges[i] > threshold) {
          if (slopeChanges[i] > 0) d.inflectionUp = d.sales;
          else d.inflectionDown = d.sales;
        }
      });
    }

    return baseData;
  }, [predictions, selectedStore, selectedFamily]);

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
              <div className="pt-4 mt-4 border-t border-slate-800 space-y-4">
                 <div>
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
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">Filtro Visual: Categoría</label>
                   <select 
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="all">Todas las Categorías (Agrupado)</option>
                    {uniqueFamilies.map(fam => (
                      <option key={fam} value={fam}>{fam}</option>
                    ))}
                  </select>
                </div>
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
              <p className="text-slate-500 max-w-md">Ajusta los parámetros a la izquierda y da click en generar para visualizar tu gráfica de proyección, o selecciona un historial de la tabla inferior.</p>
            </>
          ) : (
            <div className="w-full h-full flex flex-col">
              <h3 className="text-xl font-medium text-slate-200 mb-6 self-start">
                Proyección de Ventas 
                <span className="text-sm font-normal text-slate-400 block mt-1">
                  {selectedStore === "all" ? "Todas las tiendas" : `Tienda ${selectedStore}`} • {selectedFamily === "all" ? "Todas las categorías" : selectedFamily}
                </span>
              </h3>
              <div className="flex-1 min-h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                      itemStyle={{ color: '#60a5fa' }}
                      formatter={(value: any, name?: string | number) => {
                        const nameStr = String(name);
                        if (nameStr === "range") return null;
                        if (nameStr === "Aceleración" || nameStr === "Desaceleración") return null;
                        return [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Ventas'];
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="range" 
                      name="Margen de Predicción" 
                      fill="#3b82f6" 
                      fillOpacity={0.15} 
                      stroke="none" 
                      legendType="none"
                      tooltipType="none"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      name="Ventas Predichas" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} 
                      activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inflectionUp" 
                      name="Aceleración" 
                      stroke="none" 
                      dot={{ r: 5, fill: '#22c55e', strokeWidth: 2, stroke: '#0f172a' }} 
                      activeDot={false}
                      isAnimationActive={false} 
                      tooltipType="none"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inflectionDown" 
                      name="Desaceleración" 
                      stroke="none" 
                      dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#0f172a' }} 
                      activeDot={false}
                      isAnimationActive={false} 
                      tooltipType="none"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights Section */}
      {predictions.length > 0 && insights && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-50 mb-4">Insights de la Proyección</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Total Projected */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-slate-300 text-sm">Total Proyectado</h3>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-50">
                  ${insights.total_projected.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Suma de todas las ventas futuras</p>
              </div>
            </div>

            {/* Peak Day */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-amber-500/10 rounded-lg">
                  <CalendarRange className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-slate-300 text-sm">Día de Mayor Demanda</h3>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-50">
                  {insights.peak_day ? new Date(insights.peak_day).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Fecha con el pico más alto de ventas</p>
              </div>
            </div>

            {/* Trend */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${insights.trend === 'upward' ? 'bg-green-500/10' : insights.trend === 'downward' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                  {insights.trend === 'upward' ? <TrendingUp className="w-5 h-5 text-green-400" /> :
                    insights.trend === 'downward' ? <TrendingDown className="w-5 h-5 text-red-400" /> :
                      <Minus className="w-5 h-5 text-blue-400" />}
                </div>
                <h3 className="font-semibold text-slate-300 text-sm">Tendencia General</h3>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-50 capitalize">
                  {insights.trend === 'upward' ? 'Alcista' : insights.trend === 'downward' ? 'Bajista' : 'Estable'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Comportamiento esperado a lo largo del periodo</p>
              </div>
            </div>

            {/* Feature Importances */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-500/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-300 text-sm">Variables Influyentes</h3>
              </div>
              <div className="space-y-2 mt-4">
                {Object.entries(insights.feature_importances)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([feature, importance], idx) => {
                    // Simple normalization for visual bar
                    const maxImp = Math.max(...Object.values(insights.feature_importances));
                    const width = maxImp > 0 ? (importance / maxImp) * 100 : 0;
                    return (
                      <div key={feature} className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400 capitalize">{feature}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${width}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                }
                {Object.keys(insights.feature_importances).length === 0 && (
                  <p className="text-xs text-slate-500">Datos no disponibles para este modelo.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prediction History */}
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-200">Historial de Pronósticos</h2>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No hay predicciones guardadas todavía.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/50 text-slate-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha de Generación</th>
                  <th className="px-6 py-4 font-medium">Modelo Usado</th>
                  <th className="px-6 py-4 font-medium">Puntos Proyectados</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {runs.map((run) => (
                  <tr key={`${run.model_id}-${run.created_at}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-200 font-medium">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      Modelo #{run.model_id}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {run.prediction_count}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button
                        onClick={() => handleLoadRun(run.model_id, run.created_at)}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-blue-500/10"
                      >
                        <Eye className="w-4 h-4" /> Ver
                      </button>
                      <button
                        onClick={() => handleDeleteRun(run.model_id, run.created_at)}
                        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { TrendingUp, TrendingDown, Minus, CalendarRange, DollarSign, BarChart3, LineChart as LineChartIcon, Loader2, ArrowRight } from "lucide-react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Prediction {
  target_date: string;
  store_nbr: number;
  family: string;
  predicted_value: number;
}

interface Insights {
  feature_importances: Record<string, number>;
  total_projected: number;
  peak_day: string | null;
  trend: "upward" | "downward" | "stable";
}

export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLatestPrediction = async () => {
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const baseUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
        const token = localStorage.getItem("token");

        // Fetch runs
        const resRuns = await fetch(`${baseUrl}/api/predictions/runs`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resRuns.ok) throw new Error("Error fetching runs");
        const runs = await resRuns.json();

        if (runs.length === 0) {
          setIsLoading(false);
          return; // No predictions yet
        }

        // Fetch latest run details
        const latestRun = runs[0];
        const resDetails = await fetch(`${baseUrl}/api/predictions/runs/${latestRun.model_id}/${latestRun.created_at}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resDetails.ok) throw new Error("Error fetching prediction details");
        const data = await resDetails.json();

        setPredictions(data.predictions);
        setInsights(data.insights);
      } catch (err: any) {
        setError("No se pudo cargar la última predicción");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestPrediction();
  }, []);

  const chartData = useMemo(() => {
    if (predictions.length === 0) return [];

    // Aggregate sales by date (global)
    const aggregated: Record<string, number> = {};

    predictions.forEach(p => {
      const dateStr = new Date(p.target_date).toLocaleDateString();
      if (!aggregated[dateStr]) aggregated[dateStr] = 0;
      aggregated[dateStr] += p.predicted_value;
    });

    return Object.entries(aggregated)
      .map(([date, sales]) => ({ date, projected: sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item, index) => {
        const dynamicMargin = Math.min(0.08 + (index * 0.005), 0.25);
        const marginValue = item.projected * dynamicMargin;
        return {
          ...item,
          range: [
            Math.max(0, item.projected - marginValue),
            item.projected + marginValue
          ]
        };
      });
  }, [predictions]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
        <div className="p-4 bg-slate-800/50 rounded-full mb-2 ring-4 ring-slate-800">
          <LineChartIcon className="w-12 h-12 text-blue-500/50" />
        </div>
        <h1 className="text-2xl font-bold text-slate-50">Bienvenido a SalesCast</h1>
        <p className="text-slate-400 max-w-md">
          Aún no tienes predicciones generadas. Dirígete a la pestaña de Entrenamiento para crear tu primer modelo de pronóstico y luego genera una predicción.
        </p>
        <Link
          href="/dashboard/upload"
          className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          Subir Datos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Última Proyección Global</h1>
          <p className="text-slate-400 text-sm mt-1">Resumen general de tu proyección de ventas más reciente</p>
        </div>
        <Link href="/dashboard/predictions" className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">
          Ver todas las proyecciones
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {insights && (
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
              <p className="text-3xl font-bold text-slate-50">
                ${insights.total_projected.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">Ingreso esperado del lote</p>
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
              <p className="text-xs text-slate-500 mt-1">Comportamiento del mercado</p>
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
              <p className="text-xs text-slate-500 mt-1">Fecha con pico proyectado</p>
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
                .slice(0, 2) // Solo top 2 en dashboard para no sobrecargar
                .map(([feature, importance]) => {
                  const maxImp = Math.max(...Object.values(insights.feature_importances));
                  const width = maxImp > 0 ? (importance / maxImp) * 100 : 0;
                  return (
                    <div key={feature} className="w-full">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400 capitalize">{feature}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1">
                        <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${width}%` }}></div>
                      </div>
                    </div>
                  );
                })
              }
              {Object.keys(insights.feature_importances).length === 0 && (
                <p className="text-xs text-slate-500">No disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">Curva de Proyección</h3>
            <p className="text-sm text-slate-400 mt-1">Valores totales esperados en todas las tiendas</p>
          </div>
        </div>

        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#a78bfa', fontWeight: 500 }}
                formatter={(value: any, name?: string | number) => {
                  const nameStr = String(name); // Ensure name is treated as a string
                  if (nameStr === "range" || !nameStr) return null; // Handle undefined name or "range"
                  return [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Proyectado'];
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="range"
                fill="#8b5cf6"
                fillOpacity={0.15}
                stroke="none"
                tooltipType="none"
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Proyectado"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

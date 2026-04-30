"use client";
import { BrainCircuit, Play, Database, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Dataset {
  id: number;
  filename: string;
}

interface MLModel {
  id: number;
  dataset_id: number;
  created_at: string;
}

export default function TrainingPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/predictions/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets);
        setModels(data.models);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTrain = async () => {
    if (!selectedDatasetId) {
      setError("Por favor, selecciona un dataset primero.");
      return;
    }
    
    setIsTraining(true);
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/predictions/train/${selectedDatasetId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al entrenar el modelo");
      }
      
      setSuccess("Modelo entrenado exitosamente.");
      await fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTraining(false);
    }
  };

  const latestModel = models.length > 0 ? models[models.length - 1] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Entrenamiento del Modelo</h1>
          <p className="text-slate-400 mt-1">Administra y entrena tus modelos de machine learning.</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-sm p-3 rounded-lg flex items-center">
          <span className="mr-2">✓</span> {success}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm max-w-xl">
        <h3 className="font-semibold text-slate-200 mb-4">Iniciar Nuevo Entrenamiento</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Selecciona un Dataset</label>
            <select 
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="">-- Seleccionar --</option>
              {datasets.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.filename}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleTrain}
            disabled={isTraining || !selectedDatasetId}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
          >
            {isTraining ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Entrenando (esto puede tardar)...</>
            ) : (
              <><Play className="w-4 h-4" /> Iniciar Nuevo Entrenamiento</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-200">Modelo Más Reciente</h3>
          </div>
          {latestModel ? (
            <>
              <p className="text-2xl font-bold text-slate-50 mb-1">LightGBM Modelo #{latestModel.id}</p>
              <p className="text-sm text-slate-400">Entrenado el: {new Date(latestModel.created_at).toLocaleString()}</p>
            </>
          ) : (
            <p className="text-slate-500">Aún no hay modelos entrenados.</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-200">Modelos Totales</h3>
          </div>
          <p className="text-2xl font-bold text-slate-50 mb-1">{models.length} Modelos</p>
          <p className="text-sm text-slate-400">Disponibles en tu organización</p>
        </div>
      </div>
    </div>
  );
}

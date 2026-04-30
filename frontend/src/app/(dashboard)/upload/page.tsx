"use client";
import { UploadCloud, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Dataset {
  id: number;
  filename: string;
  uploaded_at: string;
}

export default function UploadPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/predictions/history`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    
    setIsUploading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/predictions/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al subir archivo");
      }
      
      await fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // reset input
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Subida de Datos</h1>
      <p className="text-slate-400">Sube tus datos históricos de ventas en formato CSV.</p>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {/* Dropzone */}
      <div className="mt-8">
        <label className={`flex justify-center w-full h-64 px-4 transition bg-slate-900 border-2 border-slate-700 ${isUploading ? 'border-solid opacity-70' : 'border-dashed cursor-pointer hover:border-blue-500 hover:bg-slate-800/50'} rounded-xl appearance-none group relative`}>
          <span className="flex flex-col items-center justify-center space-y-4">
            {isUploading ? (
              <>
                <div className="p-4 bg-blue-500/10 rounded-full animate-pulse">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
                <span className="font-medium text-slate-300">Subiendo archivo...</span>
              </>
            ) : (
              <>
                <div className="p-4 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-10 h-10 text-blue-500" />
                </div>
                <span className="font-medium text-slate-300">
                  Suelta los archivos aquí, o <span className="text-blue-500 underline">explora</span>
                </span>
                <span className="text-sm text-slate-500">Soporta .csv hasta 50MB</span>
              </>
            )}
          </span>
          <input 
            type="file" 
            name="file_upload" 
            className="hidden" 
            accept=".csv"
            disabled={isUploading}
            onChange={handleFileUpload} 
          />
        </label>
      </div>

      {/* Mocked History -> Actual History */}
      <h2 className="text-lg font-semibold text-slate-50 mt-10 mb-4">Cargas Recientes</h2>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {datasets.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No hay datasets subidos todavía.</div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-800/50 text-slate-300 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre del archivo</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    <span className="text-slate-200 font-medium">{ds.filename}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(ds.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex items-center text-emerald-400 gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Disponible
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

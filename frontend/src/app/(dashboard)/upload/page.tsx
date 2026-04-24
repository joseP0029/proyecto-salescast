"use client";
import { UploadCloud, FileSpreadsheet, CheckCircle2 } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Subida de Datos</h1>
      <p className="text-slate-400">Sube tus datos históricos de ventas en formato CSV o Excel.</p>
      
      {/* Dropzone */}
      <div className="mt-8">
        <label className="flex justify-center w-full h-64 px-4 transition bg-slate-900 border-2 border-slate-700 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 group">
          <span className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform">
              <UploadCloud className="w-10 h-10 text-blue-500" />
            </div>
            <span className="font-medium text-slate-300">
              Suelta los archivos aquí, o <span className="text-blue-500 underline">explora</span>
            </span>
            <span className="text-sm text-slate-500">Soporta .csv, .xlsx hasta 50MB</span>
          </span>
          <input type="file" name="file_upload" className="hidden" />
        </label>
      </div>

      {/* Mocked History */}
      <h2 className="text-lg font-semibold text-slate-50 mt-10 mb-4">Cargas Recientes</h2>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-800/50 text-slate-300 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Nombre del archivo</th>
              <th className="px-6 py-4 font-medium">Fecha</th>
              <th className="px-6 py-4 font-medium">Tamaño</th>
              <th className="px-6 py-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4 flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span className="text-slate-200 font-medium">sales_Q1_2024.csv</span>
              </td>
              <td className="px-6 py-4 text-slate-400">Oct 24, 2024</td>
              <td className="px-6 py-4 text-slate-400">2.4 MB</td>
              <td className="px-6 py-4 flex items-center text-emerald-400 gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Procesado
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Upload, BrainCircuit, LineChart, LogOut, Settings } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 flex border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/upload", icon: Upload, label: "Subir Datos" },
    { href: "/training", icon: BrainCircuit, label: "Modelos y Entrenamiento" },
    { href: "/predictions", icon: LineChart, label: "Predicciones" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col hidden md:flex shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
            SalesPredict
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-blue-600/10 text-blue-500 font-medium" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* System Status Panel */}
        <div className="p-4 mx-3 mb-6 bg-slate-800/30 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-sm font-medium text-slate-300">Sistema en línea</span>
          </div>
          <p className="text-xs text-slate-500">Latencia ML Backend: 42ms</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Topbar */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center md:hidden">
            <span className="text-xl font-bold text-blue-500">SP</span>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-md hover:bg-slate-800">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-medium shadow-lg border border-blue-400/20">
                Us
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-md hover:bg-slate-800 ml-1" title="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import Link from 'next/link';


export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center border-b border-slate-800/50 backdrop-blur-sm sticky top-0 bg-slate-950/80 z-10">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          SalesPredict AI
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-medium shadow-lg shadow-blue-500/20">
            Registrarse
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl relative z-10 leading-tight">
          Pronostica tus ventas con <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Precisión Absoluta</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl relative z-10">
          Una poderosa plataforma para empresas B2B modernas. Sube tus datos históricos, entrena modelos inteligentes y visualiza tendencias futuras.
        </p>
        <div className="flex gap-6 relative z-10">
          <Link href="/register" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-medium transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            Comenzar Prueba Gratis
          </Link>
          <Link href="/login" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-lg font-medium transition-all border border-slate-700">
            Acceder al Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

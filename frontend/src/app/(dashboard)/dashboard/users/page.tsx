"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface UserData {
  id: number;
  email: string;
  role: "admin" | "analyst";
  is_active: boolean;
  organization_id: number;
}

export default function UsersManagementPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const fetchUsers = async () => {
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
        
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Error fetching users");
        }

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError("Error loading users");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [user, isLoading, router]);

  const handleRoleChange = async (userId: number, newRole: "admin" | "analyst") => {
    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error updating role");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error updating status");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, is_active: isActive } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !newPassword) return;

    setResetError("");
    setResetSuccess("");

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${resetUserId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al cambiar contraseña");
      }

      setResetSuccess("Contraseña cambiada exitosamente");
      setTimeout(() => {
        setResetModalOpen(false);
        setNewPassword("");
        setResetSuccess("");
      }, 2000);
    } catch (err: any) {
      setResetError(err.message);
    }
  };

  if (isLoading || loadingUsers) {
    return <div className="text-white">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Gestión de Usuarios</h1>
        <p className="text-slate-400">
          Administra los usuarios de tu empresa, asigna roles y gestiona accesos.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Rol</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Analista'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.is_active 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <button
                      onClick={() => handleRoleChange(u.id, u.role === "admin" ? "analyst" : "admin")}
                      disabled={u.id === user?.id}
                      className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Cambiar a {u.role === "admin" ? "Analista" : "Admin"}
                    </button>
                    <button
                      onClick={() => handleStatusChange(u.id, !u.is_active)}
                      disabled={u.id === user?.id}
                      className={`${u.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium`}
                    >
                      {u.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => {
                        setResetUserId(u.id);
                        setNewPassword("");
                        setResetError("");
                        setResetSuccess("");
                        setResetModalOpen(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
                    >
                      Contraseña
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Restablecer Contraseña</h3>
            <p className="text-sm text-slate-400 mb-6">
              Ingresa la nueva contraseña para el usuario seleccionado.
            </p>
            
            <form onSubmit={handlePasswordReset}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              {resetError && <p className="text-red-400 text-sm mb-4">{resetError}</p>}
              {resetSuccess && <p className="text-green-400 text-sm mb-4">{resetSuccess}</p>}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPassword || !!resetSuccess}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                >
                  Guardar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

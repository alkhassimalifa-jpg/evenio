"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Phone, Mail } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  ORGANIZER: "Organisateur",
  PARTICIPANT: "Participant",
};

export default function UsersAdminPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (id: string, role: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast.success("Role mis a jour");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer definitivement le compte de ${name} ?`)) return;
    setProcessingId(id);
    try {
      await api.delete(`/users/${id}`);
      toast.success("Utilisateur supprime");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p className="text-muted text-sm">Chargement...</p>;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display font-bold text-ink mb-2">
        Utilisateurs ({users.length})
      </h2>

      {users.map((u) => (
        <div key={u.id} className="bg-panel rounded-bubble border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                {u.email ? (
                  <><Mail size={12} /> {u.email}</>
                ) : (
                  <><Phone size={12} /> {u.phone}</>
                )}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Inscrit le {new Date(u.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {u.id !== currentUser?.id && (
              <button
                onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                disabled={processingId === u.id}
                className="text-red-500 hover:text-red-600 disabled:opacity-50 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            {u.id === currentUser?.id ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-wa-accent/20 text-wa-accentDark">
                {roleLabels[u.role]} (toi)
              </span>
            ) : (
              <div className="flex gap-2">
                {["PARTICIPANT", "ORGANIZER", "ADMIN"].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(u.id, r)}
                    disabled={processingId === u.id || u.role === r}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:cursor-default ${
                      u.role === r
                        ? "bg-wa-teal text-white"
                        : "bg-surface text-muted hover:bg-border"
                    }`}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
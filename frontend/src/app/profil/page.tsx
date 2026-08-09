"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { User } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProfilePage() {
  const { user, hydrate, setAuth, token } = useAuthStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setForm({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          phone: res.data.phone || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/users/profile", form);
      if (token) setAuth(res.data, token);
      toast.success("Profil mis a jour");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la mise a jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted text-sm text-center py-16">Chargement...</p>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-muted">Connecte-toi pour voir ton profil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-wa-teal/10 flex items-center justify-center">
          <User size={22} className="text-wa-teal" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Mon profil</h1>
          <p className="text-xs text-muted">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-panel rounded-bubble border border-border p-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Prenom"
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label="Nom"
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>

        <Input
          label="Telephone"
          placeholder="77 123 45 67"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Email</label>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            {user.email}
          </div>
          <p className="text-xs text-muted">L&apos;email ne peut pas etre modifie pour le moment.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Type de compte</label>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted capitalize">
            {user.role === "ADMIN" ? "Administrateur" : user.role === "ORGANIZER" ? "Organisateur" : "Participant"}
          </div>
        </div>

        <Button type="submit" disabled={saving} fullWidth className="mt-2">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
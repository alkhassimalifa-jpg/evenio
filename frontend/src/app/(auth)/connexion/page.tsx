"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      setAuth(res.data.user, res.data.token);
      toast.success("Connexion reussie");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-panel rounded-bubble border border-border p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-wa-deep mb-1">Content de te revoir</h1>
        <p className="text-sm text-muted mb-6">Connecte-toi pour reserver tes prochains evenements.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="identifier"
            type="text"
            label="Email ou telephone"
            placeholder="toi@exemple.com ou 77 123 45 67"
            required
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
          <Input
            id="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={loading} fullWidth className="mt-2">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-wa-teal font-semibold hover:underline">
            Creer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Flame, Loader2 } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8" style={{ background: "#DCE2D2" }}>
      <div className="w-full max-w-md font-ui">
        <div className="rounded-[2px] p-8 sm:p-10" style={{ background: "#F6F4EC", boxShadow: "0 20px 50px -20px rgba(36,50,42,0.35)" }}>
          <div className="flex items-center gap-2 mb-1" style={{ color: "#C99A3E" }}>
            <Flame size={18} strokeWidth={2.5} />
            <span className="font-mono-num text-xs tracking-[0.2em] uppercase">Budget du jour</span>
          </div>
          <h1 className="font-display text-3xl mb-6" style={{ color: "#24322A" }}>
            {mode === "signin" ? "Connexion" : "Créer un compte"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-field"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mot de passe (6 caractères min.)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-field"
            />
            {error && <p className="text-xs" style={{ color: "#B0532E" }}>{error}</p>}
            {info && <p className="text-xs" style={{ color: "#3F5B48" }}>{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[2px] font-ui font-medium text-sm tracking-wide transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "#24322A", color: "#F6F4EC" }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "Se connecter" : "S'inscrire"}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}
            className="w-full mt-4 text-xs text-center"
            style={{ color: "#5C6659" }}
          >
            {mode === "signin" ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}

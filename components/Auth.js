"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Flame, Loader2 } from "lucide-react";

// Traduit les erreurs techniques (souvent en anglais) en messages compréhensibles
function friendlyError(err) {
  const msg = (err && err.message) || "";
  // "Load failed" (Safari/iPad), "Failed to fetch" (Chrome), "NetworkError" (Firefox) :
  // le navigateur n'a pas réussi à joindre Supabase du tout.
  if (/load failed|failed to fetch|networkerror|network request failed/i.test(msg)) {
    return "Impossible de joindre le serveur. Vérifie ta connexion internet. Si elle marche, le projet Supabase est peut-être en pause (il faut le réactiver depuis supabase.com).";
  }
  if (/already registered|already been registered/i.test(msg)) {
    return "Un compte existe déjà avec cette adresse. Essaie plutôt de te connecter.";
  }
  if (/invalid login credentials/i.test(msg)) {
    return "Email ou mot de passe incorrect.";
  }
  if (/email not confirmed/i.test(msg)) {
    return "Ton adresse email n'est pas encore confirmée : clique sur le lien reçu par mail.";
  }
  if (/rate limit|too many requests|security purposes/i.test(msg)) {
    return "Trop de tentatives d'affilée. Patiente quelques minutes avant de réessayer.";
  }
  if (/password should be at least/i.test(msg)) {
    return "Le mot de passe est trop court (6 caractères minimum).";
  }
  if (/signups? not allowed|email signups are disabled|provider is not enabled/i.test(msg)) {
    return "Les inscriptions par email sont désactivées sur le serveur (Supabase → Authentication → Providers → Email).";
  }
  if (/invalid email|unable to validate email/i.test(msg)) {
    return "Cette adresse email n'est pas valide.";
  }
  return msg || "Une erreur est survenue.";
}

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          // Le lien de confirmation reçu par mail ramène sur le site actuel
          // (StackBlitz, localhost ou Vercel) au lieu de l'URL par défaut de Supabase.
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Si la confirmation par email est désactivée, l'utilisateur est connecté directement.
        if (data.session) return;
        setInfo("Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Erreur d'authentification :", err);
      setError(friendlyError(err));
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

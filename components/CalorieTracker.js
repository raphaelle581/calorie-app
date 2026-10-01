"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, Receipt, Settings2, Flame, LogOut, Loader2, Search, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import Auth from "./Auth";

const ACTIVITY = [
  { id: "sedentary", label: "Peu ou pas de sport", mult: 1.2 },
  { id: "light", label: "Sport léger (1-3 j/sem)", mult: 1.375 },
  { id: "moderate", label: "Sport modéré (3-5 j/sem)", mult: 1.55 },
  { id: "active", label: "Sport intense (6-7 j/sem)", mult: 1.725 },
  { id: "very_active", label: "Très intense (physique/sport 2x/j)", mult: 1.9 },
];

const GOALS = [
  { id: "lose", label: "Perdre du poids", delta: -500 },
  { id: "maintain", label: "Maintenir mon poids", delta: 0 },
  { id: "gain", label: "Prendre du poids", delta: 500 },
];

const FLOOR = { homme: 1500, femme: 1200 };

// Date du jour au format AAAA-MM-JJ, dans le fuseau horaire de l'utilisateur
// (toISOString() donnerait la date UTC : entre minuit et 2h en France, on tombait sur la veille).
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Accepte "12,5" comme "12.5" (clavier français)
function parseNumber(value) {
  return parseFloat(String(value).replace(",", "."));
}

function computeTarget({ sex, weight, height, age, activity, goal }) {
  const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
  if (!w || !h || !a) return null;
  const bmr = sex === "homme" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const activityMult = ACTIVITY.find((x) => x.id === activity)?.mult ?? 1.2;
  const tdee = bmr * activityMult;
  const goalDelta = GOALS.find((g) => g.id === goal)?.delta ?? 0;
  let target = Math.round(tdee + goalDelta);
  const floor = FLOOR[sex] ?? 1200;
  const capped = Math.max(target, floor);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target: capped, wasCapped: capped !== target };
}

// Aliments génériques courants, vérifiés en premier (rapide et fiable)
const GENERIC_FOODS = [
  { name: "Pomme", kcalPer100g: 52 },
  { name: "Banane", kcalPer100g: 89 },
  { name: "Orange", kcalPer100g: 47 },
  { name: "Poire", kcalPer100g: 57 },
  { name: "Fraise", kcalPer100g: 32 },
  { name: "Raisin", kcalPer100g: 69 },
  { name: "Kiwi", kcalPer100g: 61 },
  { name: "Ananas", kcalPer100g: 50 },
  { name: "Pastèque", kcalPer100g: 30 },
  { name: "Melon", kcalPer100g: 34 },
  { name: "Cerise", kcalPer100g: 63 },
  { name: "Pêche", kcalPer100g: 39 },
  { name: "Abricot", kcalPer100g: 48 },
  { name: "Mangue", kcalPer100g: 60 },
  { name: "Citron", kcalPer100g: 29 },
  { name: "Avocat", kcalPer100g: 160 },
  { name: "Carotte", kcalPer100g: 41 },
  { name: "Tomate", kcalPer100g: 18 },
  { name: "Concombre", kcalPer100g: 15 },
  { name: "Courgette", kcalPer100g: 17 },
  { name: "Brocoli", kcalPer100g: 34 },
  { name: "Épinard", kcalPer100g: 23 },
  { name: "Salade / laitue", kcalPer100g: 15 },
  { name: "Poivron", kcalPer100g: 20 },
  { name: "Oignon", kcalPer100g: 40 },
  { name: "Ail", kcalPer100g: 149 },
  { name: "Pomme de terre (cuite)", kcalPer100g: 87 },
  { name: "Champignon", kcalPer100g: 22 },
  { name: "Haricot vert", kcalPer100g: 31 },
  { name: "Petit pois", kcalPer100g: 81 },
  { name: "Aubergine", kcalPer100g: 25 },
  { name: "Riz blanc (cuit)", kcalPer100g: 130 },
  { name: "Riz complet (cuit)", kcalPer100g: 111 },
  { name: "Pâtes (cuites)", kcalPer100g: 131 },
  { name: "Pain complet", kcalPer100g: 247 },
  { name: "Pain blanc / baguette", kcalPer100g: 265 },
  { name: "Quinoa (cuit)", kcalPer100g: 120 },
  { name: "Semoule (cuite)", kcalPer100g: 112 },
  { name: "Flocons d'avoine", kcalPer100g: 389 },
  { name: "Lentilles (cuites)", kcalPer100g: 116 },
  { name: "Pois chiches (cuits)", kcalPer100g: 164 },
  { name: "Poulet (blanc, cuit)", kcalPer100g: 165 },
  { name: "Bœuf haché (cuit)", kcalPer100g: 172 },
  { name: "Œuf", kcalPer100g: 155 },
  { name: "Saumon (cuit)", kcalPer100g: 208 },
  { name: "Thon (nature)", kcalPer100g: 132 },
  { name: "Jambon blanc", kcalPer100g: 145 },
  { name: "Dinde (cuite)", kcalPer100g: 189 },
  { name: "Tofu", kcalPer100g: 76 },
  { name: "Lait entier", kcalPer100g: 61 },
  { name: "Lait demi-écrémé", kcalPer100g: 46 },
  { name: "Yaourt nature", kcalPer100g: 61 },
  { name: "Fromage blanc 0%", kcalPer100g: 45 },
  { name: "Fromage blanc 20%", kcalPer100g: 90 },
  { name: "Emmental", kcalPer100g: 380 },
  { name: "Camembert", kcalPer100g: 300 },
  { name: "Beurre", kcalPer100g: 717 },
  { name: "Crème fraîche", kcalPer100g: 292 },
  { name: "Jus d'orange", kcalPer100g: 45 },
  { name: "Café noir", kcalPer100g: 1 },
  { name: "Thé nature", kcalPer100g: 1 },
  { name: "Amandes", kcalPer100g: 579 },
  { name: "Noix", kcalPer100g: 654 },
  { name: "Cacahuètes", kcalPer100g: 567 },
  { name: "Chocolat noir", kcalPer100g: 546 },
  { name: "Chocolat au lait", kcalPer100g: 535 },
  { name: "Miel", kcalPer100g: 304 },
  { name: "Sucre", kcalPer100g: 387 },
  { name: "Huile d'olive", kcalPer100g: 884 },
  { name: "Compote de pomme", kcalPer100g: 70 },
  { name: "Frites", kcalPer100g: 312 },
  { name: "Patate douce (cuite)", kcalPer100g: 90 },
  { name: "Maïs (doux)", kcalPer100g: 86 },
  { name: "Haricots rouges (cuits)", kcalPer100g: 127 },
  { name: "Pain de mie", kcalPer100g: 265 },
  { name: "Croissant", kcalPer100g: 406 },
  { name: "Pain au chocolat", kcalPer100g: 414 },
  { name: "Céréales (petit-déjeuner)", kcalPer100g: 380 },
  { name: "Steak haché 5% (cuit)", kcalPer100g: 150 },
  { name: "Cabillaud (cuit)", kcalPer100g: 105 },
  { name: "Crevettes (cuites)", kcalPer100g: 99 },
  { name: "Sardines à l'huile", kcalPer100g: 208 },
  { name: "Mozzarella", kcalPer100g: 280 },
  { name: "Comté", kcalPer100g: 410 },
  { name: "Chèvre frais", kcalPer100g: 206 },
  { name: "Yaourt grec", kcalPer100g: 120 },
  { name: "Skyr", kcalPer100g: 63 },
  { name: "Lait d'avoine", kcalPer100g: 45 },
  { name: "Pizza margherita", kcalPer100g: 250 },
  { name: "Confiture", kcalPer100g: 250 },
  { name: "Pâte à tartiner chocolat-noisette", kcalPer100g: 539 },
  { name: "Biscuits secs", kcalPer100g: 450 },
  { name: "Soda (type cola)", kcalPer100g: 42 },
  { name: "Bière", kcalPer100g: 43 },
  { name: "Vin rouge", kcalPer100g: 85 },
];

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/œ/g, "oe") // "Œuf" doit être trouvé en tapant "oeuf"
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Découpe en mots simplifiés : sans accents, sans majuscules, sans "s"/"x" du pluriel
// → "Pommes", "pomme" et "POMME" donnent tous ["pomme"]
function words(str) {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1)
    .map((w) => (w.length > 3 ? w.replace(/[sx]$/, "") : w));
}

// Vrai si chaque mot de la recherche apparaît au début d'un mot du nom
// ex. "riz cuit" trouve "Riz blanc (cuit)", "pomme" trouve "Pomme de terre"
function matchesQuery(name, query) {
  const q = words(query);
  if (q.length === 0) return false;
  const n = words(name);
  return q.every((qw) => n.some((nw) => nw.startsWith(qw)));
}

function searchGenericFoods(query) {
  return GENERIC_FOODS.filter((f) => matchesQuery(f.name, query)).map((f) => ({
    id: `generic-${f.name}`,
    name: f.name,
    brand: "Aliment générique",
    kcalPer100g: f.kcalPer100g,
  }));
}

// Calories pour 100 g d'un produit Open Food Facts.
// Certains produits n'ont que l'énergie en kJ : on convertit (1 kcal = 4,184 kJ).
function offKcalPer100g(nutriments) {
  if (!nutriments) return null;
  const kcal = Number(nutriments["energy-kcal_100g"]);
  if (Number.isFinite(kcal) && kcal >= 0) return Math.round(kcal);
  const kj = Number(nutriments["energy-kj_100g"] ?? nutriments["energy_100g"]);
  if (Number.isFinite(kj) && kj >= 0) return Math.round(kj / 4.184);
  return null;
}

const OFF_TIMEOUT_MS = 15000;

async function searchOpenFoodFacts(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=40&lc=fr&fields=product_name,product_name_fr,brands,nutriments`;

  // Open Food Facts est parfois très lent : on abandonne au bout de 15 s
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OFF_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (e) {
    throw new Error(e.name === "AbortError" ? "timeout" : "network_error");
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error("api_error");
  const data = await response.json();

  const seen = new Set();
  const products = [];
  for (const p of data.products || []) {
    const name = (p.product_name_fr || p.product_name || "").trim();
    const kcalPer100g = offKcalPer100g(p.nutriments);
    if (!name || kcalPer100g === null || kcalPer100g > 900) continue; // 900 kcal/100g = impossible (erreur de saisie)
    if (!matchesQuery(name, query)) continue;
    const brand = p.brands ? p.brands.split(",")[0].trim() : "";
    const key = normalize(`${name}|${brand}`);
    if (seen.has(key)) continue; // évite les doublons
    seen.add(key);
    products.push({ id: `off-${products.length}-${key}`, name, brand, kcalPer100g });
    if (products.length >= 10) break;
  }
  return products;
}

function searchErrorMessage(err) {
  if (err.message === "timeout") return "Open Food Facts met trop de temps à répondre. Réessaie, ou saisis l'aliment à la main.";
  if (err.message === "network_error") return "Impossible de joindre Open Food Facts. Vérifie ta connexion, ou saisis l'aliment à la main.";
  return "La recherche a échoué. Réessaie dans un instant, ou saisis l'aliment à la main.";
}

function Perforation() {
  return (
    <div className="flex justify-between px-1" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#EFF1E6]" style={{ boxShadow: "0 0 0 1px #A9B2A055" }} />
      ))}
    </div>
  );
}

export default function CalorieTracker() {
  const [session, setSession] = useState(undefined);
  const [step, setStep] = useState("loading");
  const [profile, setProfile] = useState({
    sex: "femme",
    weight: "",
    height: "",
    age: "",
    activity: "sedentary",
    goal: "maintain",
  });
  const [foods, setFoods] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [now] = useState(() => new Date());
  const todayKey = dateKey(now);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setStep("loading");
      setLoadError("");
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      const { data: logsData, error: logsErr } = await supabase
        .from("logs")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("log_date", todayKey)
        .order("created_at", { ascending: true });

      if (profileErr || logsErr) {
        console.error("Erreur de chargement :", profileErr || logsErr);
        setLoadError("Impossible de charger tes données. Vérifie ta connexion puis recharge la page.");
        setStep("error");
        return;
      }

      if (profileData) setProfile(profileData);
      setFoods(
        (logsData || []).map((l) => ({ id: l.id, name: l.name, kcal: l.kcal, qty: l.qty }))
      );
      setStep(profileData ? "tracking" : "setup");
    })();
  }, [session, todayKey]);

  const result = useMemo(() => computeTarget(profile), [profile]);

  async function saveProfileAndContinue() {
    setProfileError("");
    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      sex: profile.sex,
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      activity: profile.activity,
      goal: profile.goal,
    });
    if (error) {
      console.error("Erreur d'enregistrement du profil :", error);
      setProfileError("Le profil n'a pas pu être enregistré. Réessaie dans un instant.");
      return;
    }
    setStep("tracking");
  }

  const totalEaten = foods.reduce((sum, f) => sum + f.kcal * f.qty, 0);
  const target = result?.target ?? 0;
  const remaining = target - totalEaten;

  async function addFood(name, kcal) {
    const { data, error } = await supabase
      .from("logs")
      .insert({
        user_id: session.user.id,
        log_date: todayKey,
        name,
        kcal,
        qty: 1,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Erreur d'ajout :", error);
      return false;
    }
    setFoods((f) => [...f, { id: data.id, name: data.name, kcal: data.kcal, qty: data.qty }]);
    return true;
  }

  async function removeFood(id) {
    const previous = foods;
    setFoods((f) => f.filter((x) => x.id !== id));
    const { error } = await supabase.from("logs").delete().eq("id", id);
    if (error) {
      console.error("Erreur de suppression :", error);
      setFoods(previous); // on remet l'aliment si la suppression a échoué
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const dateLabel = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const timeLabel = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#DCE2D2" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#5C6659" }} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8" style={{ background: "#DCE2D2" }}>
      <div className="w-full max-w-md font-ui">
        {step === "loading" && (
          <div className="text-center py-20 text-sm" style={{ color: "#5C6659" }}>Chargement…</div>
        )}
        {step === "error" && (
          <div className="text-center py-20 text-sm space-y-3" style={{ color: "#B0532E" }}>
            <p>{loadError}</p>
            <button onClick={() => window.location.reload()} className="underline" style={{ color: "#3F5B48" }}>
              Recharger
            </button>
          </div>
        )}
        {step === "setup" && (
          <SetupCard profile={profile} setProfile={setProfile} onSubmit={saveProfileAndContinue} result={result} onSignOut={handleSignOut} error={profileError} />
        )}
        {step === "tracking" && (
          <ReceiptCard
            result={result}
            foods={foods}
            addFood={addFood}
            removeFood={removeFood}
            totalEaten={totalEaten}
            remaining={remaining}
            dateLabel={dateLabel}
            timeLabel={timeLabel}
            onEditProfile={() => setStep("setup")}
            onSignOut={handleSignOut}
          />
        )}
      </div>
    </div>
  );
}

function SetupCard({ profile, setProfile, onSubmit, result, onSignOut, error }) {
  const set = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));
  const valid = profile.weight && profile.height && profile.age;

  return (
    <div className="rounded-[2px] p-8 sm:p-10" style={{ background: "#F6F4EC", boxShadow: "0 20px 50px -20px rgba(36,50,42,0.35)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2" style={{ color: "#C99A3E" }}>
          <Flame size={18} strokeWidth={2.5} />
          <span className="font-mono-num text-xs tracking-[0.2em] uppercase">Budget du jour</span>
        </div>
        <button onClick={onSignOut} className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: "#5C6659" }} aria-label="Se déconnecter">
          <LogOut size={15} />
        </button>
      </div>
      <h1 className="font-display text-3xl mb-6" style={{ color: "#24322A" }}>Combien te faut-il&nbsp;?</h1>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sexe">
            <select value={profile.sex} onChange={set("sex")} className="input-field">
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
            </select>
          </Field>
          <Field label="Âge">
            <input type="number" min="10" max="100" placeholder="20" value={profile.age} onChange={set("age")} className="input-field" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Poids (kg)">
            <input type="number" min="30" max="250" placeholder="60" value={profile.weight} onChange={set("weight")} className="input-field" />
          </Field>
          <Field label="Taille (cm)">
            <input type="number" min="120" max="230" placeholder="165" value={profile.height} onChange={set("height")} className="input-field" />
          </Field>
        </div>
        <Field label="Niveau d'activité">
          <select value={profile.activity} onChange={set("activity")} className="input-field">
            {ACTIVITY.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Objectif">
          <div className="grid grid-cols-3 gap-2 mt-1">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setProfile((p) => ({ ...p, goal: g.id }))}
                className="py-2 px-1 text-xs rounded-[2px] border transition-colors"
                style={{
                  borderColor: profile.goal === g.id ? "#3F5B48" : "#D8D4C4",
                  background: profile.goal === g.id ? "#3F5B48" : "transparent",
                  color: profile.goal === g.id ? "#F6F4EC" : "#5C6659",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {valid && result && (
        <div className="mt-6 pt-5" style={{ borderTop: "1px dashed #C7C2AE" }}>
          <p className="font-mono-num text-xs uppercase tracking-wide" style={{ color: "#8A8672" }}>Estimation</p>
          <p className="font-display text-4xl mt-1" style={{ color: "#24322A" }}>
            {result.target.toLocaleString("fr-FR")} <span className="text-lg" style={{ color: "#8A8672" }}>kcal / jour</span>
          </p>
          {result.wasCapped && (
            <p className="text-xs mt-2" style={{ color: "#8A6A2E" }}>
              Ce chiffre a été relevé à un plancher sûr — pour un objectif plus précis, mieux vaut en discuter avec un professionnel de santé.
            </p>
          )}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!valid}
        className="w-full mt-7 py-3 rounded-[2px] font-ui font-medium text-sm tracking-wide transition-opacity disabled:opacity-40"
        style={{ background: "#24322A", color: "#F6F4EC" }}
      >
        Commencer à noter mes repas
      </button>
      {error && <p className="text-xs mt-2 text-center" style={{ color: "#B0532E" }}>{error}</p>}
      <p className="text-[11px] mt-3 text-center" style={{ color: "#9B9682" }}>
        Estimation générale, pas un avis médical.
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide" style={{ color: "#8A8672" }}>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ReceiptCard({ result, foods, addFood, removeFood, totalEaten, remaining, dateLabel, timeLabel, onEditProfile, onSignOut }) {
  const target = result?.target ?? 0;
  const over = remaining < 0;
  const pct = target ? Math.min(100, Math.round((totalEaten / target) * 100)) : 0;

  return (
    <div className="rounded-[2px] overflow-hidden" style={{ background: "#F6F4EC", boxShadow: "0 20px 50px -20px rgba(36,50,42,0.35)" }}>
      <div className="px-7 pt-7 pb-5" style={{ background: "#24322A", color: "#F6F4EC" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: "#C99A3E" }}>
            <Receipt size={16} strokeWidth={2.5} />
            <span className="font-mono-num text-[11px] tracking-[0.2em] uppercase">Ticket du jour</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onEditProfile} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Modifier mon profil">
              <Settings2 size={16} />
            </button>
            <button onClick={onSignOut} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Se déconnecter">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <p className="font-display text-2xl mt-2 capitalize">{dateLabel}</p>
        <p className="font-mono-num text-xs opacity-60 mt-0.5">{timeLabel}</p>
      </div>

      <div className="px-7 py-5" style={{ borderBottom: "1px dashed #C7C2AE" }}>
        <div className="flex justify-between items-baseline font-mono-num">
          <span className="text-xs uppercase tracking-wide" style={{ color: "#8A8672" }}>Budget</span>
          <span className="text-sm" style={{ color: "#24322A" }}>{target.toLocaleString("fr-FR")} kcal</span>
        </div>
        <div className="flex justify-between items-baseline font-mono-num mt-1">
          <span className="text-xs uppercase tracking-wide" style={{ color: "#8A8672" }}>Consommé</span>
          <span className="text-sm" style={{ color: "#24322A" }}>− {totalEaten.toLocaleString("fr-FR")} kcal</span>
        </div>
        <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: "#E3E0D2" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? "#B0532E" : "#3F5B48" }} />
        </div>
        <div className="flex justify-between items-baseline mt-4">
          <span className="font-ui text-xs uppercase tracking-wide" style={{ color: "#8A8672" }}>
            {over ? "Dépassement" : "Il reste"}
          </span>
          <span className="font-display text-3xl" style={{ color: over ? "#B0532E" : "#3F5B48" }}>
            {over ? "+" : ""}{Math.abs(remaining).toLocaleString("fr-FR")} <span className="text-sm font-ui">kcal</span>
          </span>
        </div>
      </div>

      <div className="px-7 py-4 max-h-56 overflow-y-auto">
        {foods.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#9B9682" }}>
            Rien noté pour l'instant — cherche ton premier aliment ci-dessous.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {foods.map((f) => (
              <li key={f.id} className="flex items-center justify-between group">
                <span className="font-mono-num text-sm pr-2" style={{ color: "#24322A" }}>{f.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono-num text-sm" style={{ color: "#5C6659" }}>{Math.round(f.kcal * f.qty)} kcal</span>
                  <button onClick={() => removeFood(f.id)} className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: "#B0532E" }} aria-label={`Supprimer ${f.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-3">
        <Perforation />
      </div>

      <FoodSearchForm addFood={addFood} />
    </div>
  );
}

function FoodSearchForm({ addFood }) {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState(""); // recherche réellement lancée
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchedOff, setSearchedOff] = useState(false); // Open Food Facts déjà interrogé ?
  const [offEmpty, setOffEmpty] = useState(false); // Open Food Facts n'a rien trouvé de plus
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState("100");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [manual, setManual] = useState(false);

  function reset() {
    setSelected(null);
    setResults([]);
    setQuery("");
    setLastQuery("");
    setSearchedOff(false);
    setOffEmpty(false);
    setSearchError("");
    setGrams("100");
    setManual(false);
    setAddError("");
  }

  async function runOffSearch(q, current) {
    setSearching(true);
    setSearchError("");
    try {
      const products = await searchOpenFoodFacts(q);
      setResults([...current, ...products]);
      setOffEmpty(products.length === 0);
    } catch (err) {
      setSearchError(searchErrorMessage(err));
    } finally {
      setSearchedOff(true);
      setSearching(false);
    }
  }

  // Liste générique d'abord (instantané). Si rien, on interroge directement Open Food Facts.
  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLastQuery(q);
    setSelected(null);
    setManual(false);
    setSearchError("");
    setSearchedOff(false);
    setOffEmpty(false);
    const generic = searchGenericFoods(q);
    setResults(generic);
    if (generic.length === 0) await runOffSearch(q, []);
  }

  async function handleAdd() {
    const g = parseNumber(grams);
    if (!selected || !g || g <= 0) return;
    setAdding(true);
    setAddError("");
    const totalKcal = Math.round((selected.kcalPer100g * g) / 100);
    const label = `${selected.name}${selected.brand && selected.brand !== "Aliment générique" ? " — " + selected.brand : ""} (${g} g)`;
    const ok = await addFood(label, totalKcal);
    setAdding(false);
    if (ok) reset();
    else setAddError("L'aliment n'a pas pu être enregistré. Vérifie ta connexion et réessaie.");
  }

  if (manual) {
    return <ManualEntryForm initialName={lastQuery || query} addFood={addFood} onCancel={() => setManual(false)} onDone={reset} />;
  }

  if (selected) {
    const g = parseNumber(grams);
    return (
      <div className="px-7 py-5 space-y-2.5">
        <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#8A8672" }}>Aliment choisi</p>
        <div className="flex items-start justify-between gap-2 p-3 rounded-[2px]" style={{ background: "#EFEBDD" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "#24322A" }}>{selected.name}</p>
            {selected.brand && <p className="text-xs" style={{ color: "#8A8672" }}>{selected.brand}</p>}
            <p className="font-mono-num text-xs mt-1" style={{ color: "#5C6659" }}>{selected.kcalPer100g} kcal / 100g</p>
          </div>
          <button onClick={() => setSelected(null)} style={{ color: "#5C6659" }} aria-label="Changer d'aliment">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Grammes"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            className="w-28 input-food"
          />
          <span className="flex items-center text-sm" style={{ color: "#8A8672" }}>g</span>
          <button
            onClick={handleAdd}
            disabled={adding || !g || g <= 0}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-[2px] text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#3F5B48", color: "#F6F4EC" }}
          >
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Ajouter
          </button>
        </div>
        {g > 0 && (
          <p className="font-mono-num text-xs" style={{ color: "#8A8672" }}>
            ≈ {Math.round((selected.kcalPer100g * g) / 100)} kcal au total
          </p>
        )}
        {addError && <p className="text-xs" style={{ color: "#B0532E" }}>{addError}</p>}
      </div>
    );
  }

  const noResult = lastQuery && !searching && searchedOff && results.length === 0 && !searchError;

  return (
    <div className="px-7 py-5 space-y-2.5">
      <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#8A8672" }}>Chercher un aliment</p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Ex. yaourt nature, pomme, riz..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 input-food"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="px-4 flex items-center justify-center rounded-[2px] text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "#3F5B48", color: "#F6F4EC" }}
          aria-label="Rechercher"
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </form>

      {searchError && <p className="text-xs" style={{ color: "#B0532E" }}>{searchError}</p>}
      {noResult && (
        <p className="text-xs" style={{ color: "#B0532E" }}>
          Aucun résultat pour « {lastQuery} ». Essaie un nom plus simple (ex. « yaourt » plutôt que « yaourt vanille bio »), ou saisis-le à la main.
        </p>
      )}

      {offEmpty && results.length > 0 && (
        <p className="text-xs" style={{ color: "#8A8672" }}>Aucun produit de marque trouvé pour « {lastQuery} ».</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-1.5 max-h-52 overflow-y-auto mt-2">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setSelected(p)}
                className="w-full text-left px-3 py-2 rounded-[2px] transition-colors"
                style={{ background: "#FCFBF6", border: "1px solid #E3E0D2" }}
              >
                <p className="text-sm" style={{ color: "#24322A" }}>{p.name}</p>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span className="text-xs" style={{ color: "#8A8672" }}>{p.brand}</span>
                  <span className="font-mono-num text-xs" style={{ color: "#5C6659" }}>{p.kcalPer100g} kcal/100g</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {lastQuery && !searchedOff && !searching && (
          <button onClick={() => runOffSearch(lastQuery, results)} className="text-xs underline" style={{ color: "#3F5B48" }}>
            Chercher aussi les produits de marque
          </button>
        )}
        <button onClick={() => setManual(true)} className="text-xs underline" style={{ color: "#3F5B48" }}>
          Saisir un aliment à la main
        </button>
      </div>

      <p className="text-[11px]" style={{ color: "#9B9682" }}>
        Recherche d'abord dans notre liste d'aliments courants, puis dans Open Food Facts si besoin.
      </p>
    </div>
  );
}

// Saisie manuelle : pour un aliment introuvable (plat maison, restaurant...)
function ManualEntryForm({ initialName, addFood, onCancel, onDone }) {
  const [name, setName] = useState(initialName || "");
  const [mode, setMode] = useState("per100"); // per100 = kcal/100g × grammes | total = kcal directement
  const [kcal, setKcal] = useState("");
  const [grams, setGrams] = useState("100");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const k = parseNumber(kcal);
  const g = parseNumber(grams);
  const total = mode === "per100" ? (k >= 0 && g > 0 ? Math.round((k * g) / 100) : NaN) : Math.round(k);
  const valid = name.trim() && Number.isFinite(total) && total >= 0 && total <= 10000;

  async function handleAdd(e) {
    e.preventDefault();
    if (!valid) return;
    setAdding(true);
    setError("");
    const label = mode === "per100" ? `${name.trim()} (${g} g)` : name.trim();
    const ok = await addFood(label, total);
    setAdding(false);
    if (ok) onDone();
    else setError("L'aliment n'a pas pu être enregistré. Vérifie ta connexion et réessaie.");
  }

  const tab = (id, label) => (
    <button
      type="button"
      onClick={() => setMode(id)}
      className="flex-1 py-1.5 text-xs rounded-[2px] border transition-colors"
      style={{
        borderColor: mode === id ? "#3F5B48" : "#D8D4C4",
        background: mode === id ? "#3F5B48" : "transparent",
        color: mode === id ? "#F6F4EC" : "#5C6659",
      }}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={handleAdd} className="px-7 py-5 space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] uppercase tracking-wide" style={{ color: "#8A8672" }}>Saisie manuelle</p>
        <button type="button" onClick={onCancel} style={{ color: "#5C6659" }} aria-label="Revenir à la recherche">
          <X size={16} />
        </button>
      </div>
      <input type="text" placeholder="Nom de l'aliment" value={name} onChange={(e) => setName(e.target.value)} className="input-food" />
      <div className="flex gap-2">
        {tab("per100", "kcal pour 100 g")}
        {tab("total", "kcal au total")}
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          inputMode="decimal"
          placeholder={mode === "per100" ? "kcal / 100 g" : "kcal"}
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          className="input-food"
        />
        {mode === "per100" && (
          <>
            <span className="text-sm" style={{ color: "#8A8672" }}>×</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Grammes"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="input-food"
            />
            <span className="text-sm" style={{ color: "#8A8672" }}>g</span>
          </>
        )}
      </div>
      {mode === "per100" && Number.isFinite(total) && (
        <p className="font-mono-num text-xs" style={{ color: "#8A8672" }}>≈ {total} kcal au total</p>
      )}
      <button
        type="submit"
        disabled={!valid || adding}
        className="w-full py-2.5 flex items-center justify-center gap-1.5 rounded-[2px] text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "#3F5B48", color: "#F6F4EC" }}
      >
        {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
        Ajouter
      </button>
      {error && <p className="text-xs" style={{ color: "#B0532E" }}>{error}</p>}
      <p className="text-[11px]" style={{ color: "#9B9682" }}>
        Astuce : les calories pour 100 g sont indiquées sur l'emballage (tableau nutritionnel, ligne « Énergie »).
      </p>
    </form>
  );
}

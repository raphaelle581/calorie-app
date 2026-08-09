"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, Receipt, Settings2, Flame } from "lucide-react";

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

function dateKey(d) {
  return d.toISOString().slice(0, 10);
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
  const [draft, setDraft] = useState({ name: "", kcal: "", qty: "1" });
  const [now] = useState(() => new Date());
  const todayKey = dateKey(now);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("profile");
      const savedFoods = localStorage.getItem(`log:${todayKey}`);
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedFoods) setFoods(JSON.parse(savedFoods));
      setStep(savedProfile ? "tracking" : "setup");
    } catch (e) {
      setStep("setup");
    }
  }, [todayKey]);

  const result = useMemo(() => computeTarget(profile), [profile]);

  const persistFoods = useCallback(
    (list) => {
      try {
        localStorage.setItem(`log:${todayKey}`, JSON.stringify(list));
      } catch (e) {}
    },
    [todayKey]
  );

  function saveProfileAndContinue() {
    try {
      localStorage.setItem("profile", JSON.stringify(profile));
    } catch (e) {}
    setStep("tracking");
  }

  const totalEaten = foods.reduce((sum, f) => sum + f.kcal * f.qty, 0);
  const target = result?.target ?? 0;
  const remaining = target - totalEaten;

  function addFood(e) {
    e.preventDefault();
    const kcal = parseFloat(draft.kcal);
    const qty = parseFloat(draft.qty) || 1;
    if (!draft.name.trim() || !kcal || kcal <= 0) return;
    const updated = [...foods, { id: Date.now(), name: draft.name.trim(), kcal, qty }];
    setFoods(updated);
    persistFoods(updated);
    setDraft({ name: "", kcal: "", qty: "1" });
  }

  function removeFood(id) {
    const updated = foods.filter((x) => x.id !== id);
    setFoods(updated);
    persistFoods(updated);
  }

  const dateLabel = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const timeLabel = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8" style={{ background: "#DCE2D2" }}>
      <div className="w-full max-w-md font-ui">
        {step === "loading" && (
          <div className="text-center py-20 text-sm" style={{ color: "#5C6659" }}>Chargement…</div>
        )}
        {step === "setup" && (
          <SetupCard profile={profile} setProfile={setProfile} onSubmit={saveProfileAndContinue} result={result} />
        )}
        {step === "tracking" && (
          <ReceiptCard
            result={result}
            foods={foods}
            draft={draft}
            setDraft={setDraft}
            addFood={addFood}
            removeFood={removeFood}
            totalEaten={totalEaten}
            remaining={remaining}
            dateLabel={dateLabel}
            timeLabel={timeLabel}
            onEditProfile={() => setStep("setup")}
          />
        )}
      </div>
    </div>
  );
}

function SetupCard({ profile, setProfile, onSubmit, result }) {
  const set = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));
  const valid = profile.weight && profile.height && profile.age;

  return (
    <div className="rounded-[2px] p-8 sm:p-10" style={{ background: "#F6F4EC", boxShadow: "0 20px 50px -20px rgba(36,50,42,0.35)" }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: "#C99A3E" }}>
        <Flame size={18} strokeWidth={2.5} />
        <span className="font-mono-num text-xs tracking-[0.2em] uppercase">Budget du jour</span>
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

function ReceiptCard({ result, foods, draft, setDraft, addFood, removeFood, totalEaten, remaining, dateLabel, timeLabel, onEditProfile }) {
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
          <button onClick={onEditProfile} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Modifier mon profil">
            <Settings2 size={16} />
          </button>
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

      <div className="px-7 py-4 max-h-64 overflow-y-auto">
        {foods.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#9B9682" }}>
            Rien noté pour l'instant — ajoute ton premier aliment ci-dessous.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {foods.map((f) => (
              <li key={f.id} className="flex items-center justify-between group">
                <div className="font-mono-num text-sm" style={{ color: "#24322A" }}>
                  <span>{f.name}</span>
                  {f.qty !== 1 && <span style={{ color: "#8A8672" }}> ×{f.qty}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-num text-sm" style={{ color: "#5C6659" }}>{Math.round(f.kcal * f.qty)} kcal</span>
                  <button onClick={() => removeFood(f.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#B0532E" }} aria-label={`Supprimer ${f.name}`}>
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

      <form onSubmit={addFood} className="px-7 py-5 space-y-2.5">
        <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#8A8672" }}>Ajouter un aliment</p>
        <input
          type="text"
          placeholder="Ex. Yaourt nature"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="w-full input-food"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Kcal"
            min="1"
            value={draft.kcal}
            onChange={(e) => setDraft((d) => ({ ...d, kcal: e.target.value }))}
            className="w-24 input-food"
          />
          <input
            type="number"
            placeholder="Qté"
            min="0.5"
            step="0.5"
            value={draft.qty}
            onChange={(e) => setDraft((d) => ({ ...d, qty: e.target.value }))}
            className="w-20 input-food"
          />
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-[2px] text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "#3F5B48", color: "#F6F4EC" }}
          >
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}


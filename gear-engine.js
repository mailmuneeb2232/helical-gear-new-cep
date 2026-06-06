/* ============================================================
   Helical Gear Design Engine  —  AGMA 2001 / Shigley methodology
   Pure functions, attached to window.GearEngine.
   Units: internal calculations done in US customary (hp, in, lbf,
   rpm, psi). Metric display conversions handled in the UI layer.
   This is an engineering-grade APPROXIMATION for UI demonstration.
   ============================================================ */
(function () {
  "use strict";

  const DEG = Math.PI / 180;

  /* ---------- Material library ----------
     St  = allowable bending stress number (psi)
     Sc  = allowable contact stress number (psi)
     HB  = Brinell hardness (case / effective)
     cost= relative cost index (1 cheapest .. 5 priciest)
     grade keyed to AGMA grade 1/2 quality                       */
  const MATERIALS = [
    { id: "4320c",    name: "AISI 4320",  treat: "Carburized & ground", HB: 600, St: 65000,  Sc: 225000, cost: 5, grade: 2,
      note: "Premium Grade 2 case-hardened alloy. Highest AGMA allowable stresses; aerospace / critical industrial drives." },
    { id: "8620c",    name: "AISI 8620",  treat: "Carburized & ground", HB: 580, St: 55000,  Sc: 225000, cost: 4, grade: 1,
      note: "Workhorse carburizing steel. Great balance of strength, cost and machinability." },
    { id: "4140n",    name: "AISI 4140",  treat: "Nitrided",            HB: 500, St: 58000,  Sc: 180000, cost: 3, grade: 1,
      note: "Through-hardened then nitrided. Good wear with low distortion; moderate loads." },
    { id: "4340qt",  name: "AISI 4340",  treat: "Q&T (HRC 35)",        HB: 340, St: 42000,  Sc: 155000, cost: 3, grade: 1,
      note: "Tough through-hardened alloy. Shock-tolerant, lower surface durability." },
    { id: "4140oqt1000", name: "AISI 4140", treat: "OQT 1000\u00b0F",  HB: 341, St: 40000,  Sc: 140000, cost: 2, grade: 1,
      note: "Through-hardened, oil-quenched and tempered at 1000\u00b0F. Reliable workhorse for moderate-to-high loads." },
    { id: "4140oqt1200", name: "AISI 4140", treat: "OQT 1200\u00b0F",  HB: 302, St: 36000,  Sc: 130000, cost: 2, grade: 1,
      note: "Through-hardened, tempered at 1200\u00b0F for improved toughness at the cost of some hardness." },
    { id: "1045",    name: "AISI 1045",  treat: "Flame hardened",      HB: 500, St: 40000,  Sc: 170000, cost: 2, grade: 1,
      note: "Medium-carbon steel, selectively hardened. Economical for light/medium duty." },
    { id: "1040hr",  name: "AISI 1040",  treat: "Through-hardened",    HB: 262, St: 26000,  Sc: 108000, cost: 1, grade: 1,
      note: "Economy through-hardened carbon steel. Suitable only for lightly-loaded, low-speed drives." },
    { id: "1020",    name: "AISI 1020",  treat: "Carburized",          HB: 480, St: 42000,  Sc: 175000, cost: 1, grade: 1,
      note: "Low-cost carburizing steel. Adequate for non-critical, low-speed drives." },
  ];

  /* ---------- Material suggestion ----------
     Given required AGMA stress numbers (psi), find the lowest-cost
     material that satisfies BOTH bending (St) and contact (Sc).
     Also return the minimum HB requirement from the Grade 1
     through-hardened linear formula:  Sc = 2.22\u00b7HB\u00b7145 + 200\u00b7145  (MPa\u2192psi)
     => HB_req = (Sc_req/145.04 - 200) / 2.22                      */
  function suggestMaterial(St_req, Sc_req) {
    const passing = MATERIALS.filter(m => m.St >= St_req && m.Sc >= Sc_req)
      .sort((a, b) => a.cost - b.cost || a.Sc - b.Sc);
    const mat = passing.length ? passing[0]
      : MATERIALS.slice().sort((a, b) =>
          (b.St/St_req + b.Sc/Sc_req) - (a.St/St_req + a.Sc/Sc_req))[0];
    const HB_req = Math.ceil(Math.max(180, (Sc_req / 145.04 - 200) / 2.22));
    return { ...mat, St_req, Sc_req, HB_req, ok: mat.St >= St_req && mat.Sc >= Sc_req };
  }

  const HEAT_TREATMENTS = [
    "Carburized & ground", "Carburized", "Nitrided", "Q&T (HRC 35)",
    "Flame hardened", "Induction hardened", "Through-hardened",
  ];

  function material(id) {
    return MATERIALS.find((m) => m.id === id) || MATERIALS[0];
  }

  /* Required gear tooth count to hit a target output speed, given the
     pinion teeth and pinion rpm. Clamped to a sensible range.       */
  function teethForSpeed(Np, pinionRpm, gearRpm) {
    if (!gearRpm || gearRpm <= 0) return Np;
    const ratio = pinionRpm / gearRpm;
    return Math.max(12, Math.min(200, Math.round(Np * ratio)));
  }

  /* ---------- AGMA helper factors ---------- */

  // Dynamic factor Kv from transmission accuracy Qv and pitch-line velocity (ft/min)
  function dynamicFactor(Qv, V) {
    const B = 0.25 * Math.pow(12 - Qv, 2 / 3);
    const A = 50 + 56 * (1 - B);
    return Math.pow((A + Math.sqrt(Math.min(V, 1e5))) / A, B);
  }

  // Reliability factor KR (Shigley table)
  function reliabilityFactor(R) {
    if (R >= 0.9999) return 1.50;
    if (R >= 0.999) return 1.25;
    if (R >= 0.99) return 1.00;
    if (R >= 0.98) return 0.94;
    if (R >= 0.95) return 0.85;
    return 0.85;
  }

  /* Overload factor Ko from application context (AGMA / Mott Table).
     src = power source, driven = driven-machine shock class.        */
  const POWER_SOURCES = [
    { id: "uniform", label: "Electric motor / turbine (uniform)" },
    { id: "light",   label: "Multi-cylinder engine (light shock)" },
    { id: "medium",  label: "Single-cylinder engine (medium shock)" },
  ];
  const DRIVEN_MACHINES = [
    { id: "uniform",  label: "Uniform — generator, conveyor (even load)" },
    { id: "moderate", label: "Moderate shock — milling machine, mixer" },
    { id: "heavy",    label: "Heavy shock — crusher, punch press" },
  ];
  function overloadFactor(src, driven) {
    const table = {
      uniform: { uniform: 1.00, moderate: 1.25, heavy: 1.75 },
      light:   { uniform: 1.25, moderate: 1.50, heavy: 2.00 },
      medium:  { uniform: 1.50, moderate: 1.75, heavy: 2.25 },
    };
    return ((table[src] || table.uniform)[driven]) || 1.25;
  }

  /* Size factor Ks (Shigley Eq 14-10, Lewis form factor ≈ 0.40). */
  function sizeFactor(F, Pd) {
    const Y = 0.40;
    const ks = 1.192 * Math.pow((F * Math.sqrt(Y)) / Pd, 0.0535);
    return Math.max(1.0, Math.min(1.4, ks));
  }

  /* Load-distribution factor Km (Shigley Cmf, uncrowned teeth,
     commercial enclosed gear unit). F, d in inches.               */
  function loadDistFactor(F, d) {
    const Cmc = 1.0;
    let Cpf = F <= 1 ? F / (10 * d) - 0.025 : F / (10 * d) - 0.0375 + 0.0125 * F;
    Cpf = Math.max(0, Cpf);
    const Cma = 0.127 + 0.0158 * F - 0.930e-4 * F * F;
    return Math.max(1.0, Math.min(2.2, 1 + Cmc * (Cpf + Cma)));
  }

  // Stress-cycle factors — computed from design life when provided
  function getYN(N) {
    if (N >= 3e6) return 1.3558 * Math.pow(N, -0.0178);
    if (N >= 1e3) return 2.3194 * Math.pow(N, -0.0538);
    return 1.0;
  }
  function getZN(N) {
    if (N >= 1e7) return 1.4488 * Math.pow(N, -0.023);
    if (N >= 1e5) return 2.466  * Math.pow(N, -0.056);
    return 1.0;
  }
  const Cp = 2300; // elastic coefficient, steel/steel (sqrt psi)

  /* ---------- Auto tooth-profile calculator ----------
     Returns recommended helix angle, pressure angle, JP and JG.
     Targets:
       • Axial contact ratio mF ≥ 2.0 (smooth, quiet helical action)
       • Standard pressure angle 20°
       • JP/JG from AGMA 908-B89 Shigley approximation            */
  function autoToothCalc(Np, Ng, Pn, F) {
    // Min helix angle for mF ≥ 2.0: F·Pn·tan(ψ)/π = 2.0
    const psiMin = Math.atan(2 * Math.PI / (F * Pn)) / DEG;
    const psi = Math.max(12, Math.min(35, Math.ceil(psiMin + 1))); // round up, clamp 12–35°
    const pressure = 20; // standard normal pressure angle

    // JP approximation (AGMA 908-B89 — helical, φn=20°)
    // base term from Lewis form factor, boosted by helix angle
    const hx = 1 + 0.013 * (psi / 10) + 0.007 * Math.pow(psi / 10, 2);
    const jpBase = 0.245 + 0.0095 * Np - 2.8e-5 * Np * Np;
    const JP = Math.min(0.60, Math.max(0.28, jpBase * hx));
    const jgBase = 0.270 + 0.0085 * Ng - 1.6e-5 * Ng * Ng;
    const JG = Math.min(0.65, Math.max(0.32, jgBase * hx));

    return { psi, pressure, JP, JG };
  }

  /* ---------- Main solver ---------- */
  function compute(input) {
    // Apply auto-tooth overrides before any geometry is computed
    const autoT = input.autoTooth;
    let i = input;
    if (autoT) {
      const at = autoToothCalc(input.Np, input.Ng, input.Pn, input.F);
      i = { ...input, helix: at.psi, pressure: at.pressure, JP: at.JP, JG: at.JG, _autoTooth: at };
    }
    const _at = autoT ? i._autoTooth : null;
    const mat = material(i.materialId);

    // Geometry
    const psi = i.helix * DEG;                 // helix angle
    const phin = i.pressure * DEG;             // normal pressure angle
    const phit = Math.atan(Math.tan(phin) / Math.cos(psi)); // transverse PA
    const Pt = i.Pn * Math.cos(psi);           // transverse diametral pitch
    const dP = i.Np / Pt;                      // pinion pitch dia (in)
    const dG = i.Ng / Pt;                      // gear pitch dia (in)
    const C = (dP + dG) / 2;                   // center distance (in)
    const ratio = i.Ng / i.Np;                 // gear ratio
    const nOut = i.rpm / ratio;                // output rpm

    // Kinematics / loads
    const V = (Math.PI * dP * i.rpm) / 12;     // pitch-line velocity (ft/min)
    const Wt = (33000 * i.power) / V;          // tangential load (lbf)
    const Wr = Wt * Math.tan(phit);            // radial (lbf)
    const Wa = Wt * Math.tan(psi);             // axial / thrust (lbf)
    const torque = (63025 * i.power) / i.rpm;  // pinion torque (lb-in)

    // Factors — auto-resolved from assumptions when autoFactors is on,
    // otherwise taken from the user's manual entries.
    const af = i.autoFactors;
    const Ko = af ? overloadFactor(i.powerSource, i.drivenMachine) : i.Ko;
    const Ks = af ? sizeFactor(i.F, Pt) : i.Ks;
    const Km = af ? loadDistFactor(i.F, dP) : i.Km;
    const KB = af ? 1.0 : i.KB;
    const Kv = (af || i.autoKv) ? dynamicFactor(i.Qv, V) : i.Kv;
    const KR = reliabilityFactor(i.reliability);
    const factorsAuto = af;

    // Geometry factors — user-supplied or fallback
    const J   = i.JP   != null ? i.JP   : 0.46;  // pinion bending
    const JG  = i.JG   != null ? i.JG   : 0.50;  // gear bending
    const Igeo = i.Igeo != null ? i.Igeo : 0.20;  // contact geometry
    const Cf = 1.0;

    // Stress-cycle factors from design life
    const Life   = i.Life  || 20000;
    const NP_cyc = 60 * i.rpm * Life;
    const NG_cyc = 60 * nOut * Life;
    const YNP = getYN(NP_cyc);
    const YNG = getYN(NG_cyc);
    const ZNP = getZN(NP_cyc);
    const ZNG = getZN(NG_cyc);


    // AGMA bending stress (psi) — pinion governs (smaller J)
    const sigmaB = Wt * Ko * Kv * Ks * (Pt / i.F) * ((Km * KB) / J);
    // Gear bending stress (uses JG)
    const sigmaB_G = Wt * Ko * Kv * Ks * (Pt / i.F) * ((Km * KB) / JG);

    // AGMA contact stress (psi)
    const sigmaC = Cp * Math.sqrt(
      Wt * Ko * Kv * Ks * (Km / (dP * i.F)) * (Cf / Igeo)
    );

    // Allowables — now use per-cycle YN/ZN factors
    const KT = 1.0;
    const sigmaB_all = (mat.St * YNP) / (KT * KR);
    const sigmaC_all = (mat.Sc * ZNP) / (KT * KR);

    // Safety factors
    const SF_bend = sigmaB_all / sigmaB;
    const SF_cont = (sigmaC_all / sigmaC);      // linear contact SF
    const SH = SF_cont;
    // contact compared on stress^2 basis for power-equivalent margin
    const SF_cont_power = Math.pow(sigmaC_all / sigmaC, 2);

    // Required allowable stress numbers (reversed AGMA — what the material MUST provide)
    // Pinion
    const St_req_P = (sigmaB   * KT * KR) / YNP;
    const Sc_req_P = (sigmaC   * KT * KR) / ZNP;
    // Gear
    const St_req_G = (sigmaB_G * KT * KR) / YNG;
    const Sc_req_G = (sigmaC   * KT * KR) / ZNG;
    // Auto-suggested materials (cheapest that satisfies both criteria)
    const sugMatP = suggestMaterial(St_req_P, Sc_req_P);
    const sugMatG = suggestMaterial(St_req_G, Sc_req_G);

    // Efficiency (simple mesh loss model)
    const eff = 0.985 - 0.004 * (1 / Math.cos(psi) - 1) * 10;
    const efficiency = Math.max(0.95, Math.min(0.995, eff));

    // Axial overlap (helical action quality) = F*tan(psi)*Pn/pi  in axial pitches
    const axialContact = (i.F * Math.tan(psi) * i.Pn) / Math.PI;

    // Cpf / Cma breakdown for load-distribution modal
    const ratio2 = i.F / dP;
    let CpfOut = ratio2 < 0.5 ? i.F / (10 * dP) - 0.025 : i.F / (10 * dP) - 0.0375 + 0.0125 * i.F;
    CpfOut = Math.max(0, CpfOut);
    const CmaOut = 0.127 + 0.0158 * i.F - 0.930e-4 * i.F * i.F;

    return {
      mat, ratio, nOut, phit: phit / DEG, Pt, dP, dG, C, V, Wt, Wr, Wa, torque,
      Kv, Ko, Ks, Km, KB, KR, J, JG, Igeo, factorsAuto,
      Cpf: CpfOut, Cma: CmaOut,
      NP_cyc, NG_cyc, YNP, YNG, ZNP, ZNG, Life,
      sigmaB, sigmaB_G, sigmaC, sigmaB_all, sigmaC_all,
      St_req_P, Sc_req_P, St_req_G, Sc_req_G, sugMatP, sugMatG,
      SF_bend, SF_cont, SH, SF_cont_power,
      efficiency, axialContact,
      autoTooth: autoT, autoToothResult: _at,
    };
  }

  /* ---------- Warnings engine ---------- */
  function warnings(i, r) {
    const out = [];
    const push = (level, title, detail, fix) => out.push({ level, title, detail, fix });

    /* ---- Bending ---- */
    if (r.SF_bend < 1.0) {
      const needSt = Math.round(r.St_req_P / 1000);
      push("fail", "Bending fatigue failure",
        `Bending SF = ${r.SF_bend.toFixed(2)} (need ≥ 1.5). Tooth root will fail under the current load.`,
        `Increase face width F, reduce diametral pitch Pn (larger teeth), or switch to a material with St ≥ ${needSt} ksi (e.g. 4320 Carburized).`);
    } else if (r.SF_bend < 1.5) {
      const gap = (1.5 - r.SF_bend).toFixed(2);
      push("warn", "Low bending margin",
        `Bending SF = ${r.SF_bend.toFixed(2)} — ${gap} below the 1.5 industrial target. Adequate for light-duty only.`,
        `Widen the face by ~${Math.ceil((1.5 / r.SF_bend - 1) * i.F * 10) / 10} in, or select a higher St material.`);
    } else {
      push("pass", "Bending strength adequate",
        `Bending SF = ${r.SF_bend.toFixed(2)} ≥ 1.5. Tooth root is safe for the specified life of ${(i.Life || 20000).toLocaleString()} hr.`);
    }

    /* ---- Contact (pitting) ---- */
    if (r.SF_cont_power < 1.0) {
      const needSc = Math.round(r.Sc_req_P / 1000);
      push("fail", "Surface pitting failure",
        `Contact SF² = ${r.SF_cont_power.toFixed(2)} < 1.0. Flank surfaces will pit rapidly.`,
        `Increase Np, face width, or center distance to lower σc. Upgrade to Sc ≥ ${needSc} ksi — carburized 4320 or 8620 recommended.`);
    } else if (r.SF_cont_power < 1.2) {
      push("warn", "Low contact (pitting) margin",
        `Contact SF² = ${r.SF_cont_power.toFixed(2)} — below the 1.2 pitting target. Pitting damage likely over full service life.`,
        `Add face width, increase Np (larger pinion), or switch to case-hardened steel (Sc ≥ ${Math.round(r.Sc_req_P / 1000)} ksi, e.g. 8620 Carburized).`);
    } else {
      push("pass", "Surface durability adequate",
        `Contact SF² = ${r.SF_cont_power.toFixed(2)} ≥ 1.2. Flank pitting life is acceptable for ${(i.Life || 20000).toLocaleString()} hr design life.`);
    }

    /* ---- Helical overlap ---- */
    if (r.axialContact < 1.0) {
      push("fail", "Insufficient helical overlap",
        `Axial contact ratio mF = ${r.axialContact.toFixed(2)} < 1.0. The gear is behaving like a spur gear with no true helical action.`,
        `Increase face width F or raise helix angle ψ. For Pn=${i.Pn} and current F, minimum ψ ≈ ${Math.ceil(Math.atan(Math.PI / (i.F * i.Pn)) / (Math.PI / 180))}°.`);
    } else if (r.axialContact < 2.0) {
      push("warn", "Marginal helical overlap",
        `mF = ${r.axialContact.toFixed(2)} — below the ≥ 2.0 target for smooth, quiet running. One tooth pair always in contact, but noise may be noticeable.`,
        `Increase F to ≈ ${(2.0 * Math.PI / (i.Pn * Math.tan(i.helix * Math.PI / 180))).toFixed(2)} in (at current ψ=${i.helix}°) to reach mF = 2.0.`);
    } else {
      push("pass", "Smooth helical engagement",
        `mF = ${r.axialContact.toFixed(2)} ≥ 2.0. Multiple tooth pairs share load simultaneously — low noise and vibration expected.`);
    }

    /* ---- Face width / pinion diameter ratio ---- */
    const fOverD = i.F / r.dP;
    const fBandLo = (3 * Math.PI / i.Pn).toFixed(2);
    const fBandHi = (5 * Math.PI / i.Pn).toFixed(2);
    if (fOverD > 2.0) {
      push("warn", "Wide face (F/d > 2.0)",
        `F/dP = ${fOverD.toFixed(2)}. Beyond 2× the pitch diameter the load distribution becomes uneven, raising Km and root stress.`,
        `Keep F ≤ ${(2.0 * r.dP).toFixed(2)} in, or switch to a finer pitch (higher Pn) to obtain a larger pinion diameter.`);
    } else if (fOverD < 0.5) {
      push("warn", "Narrow face (F/d < 0.5)",
        `F/dP = ${fOverD.toFixed(2)}. Very narrow faces may leave insufficient load-spread margin and are sensitive to misalignment.`,
        `AGMA recommends F in the band ${fBandLo}–${fBandHi} in for Pn=${i.Pn}. Try widening F toward ${fBandLo} in.`);
    }

    /* ---- Undercut ---- */
    if (i.Np < 14) {
      push("warn", "Undercut risk on pinion",
        `Np = ${i.Np} teeth. Involute profile below ~14T (20° pressure angle) will undercut at the root, weakening the tooth and reducing J.`,
        `Use at least Np = 17 (minimum recommended for ψ ≥ 15°), apply profile shift (positive x), or increase the normal pressure angle to 25°.`);
    } else if (i.Np >= 14 && i.Np < 17) {
      push("warn", "Low pinion tooth count",
        `Np = ${i.Np}. Marginally above the hard undercut limit but AGMA recommends ≥ 17 teeth for the pinion of a helical pair to ensure good form factor.`,
        `Increase Np to 17–20 and adjust Ng to maintain the target ratio.`);
    }

    /* ---- Pitch-line velocity ---- */
    if (r.V > 4000 && i.Qv < 9) {
      push("warn", "High velocity — upgrade quality grade",
        `Pitch-line velocity V = ${Math.round(r.V)} ft/min. At this speed AGMA recommends quality Av ≥ 9 to keep Kv acceptable.`,
        `Raise quality number Av to 9–11 in the Loading & Quality Factors panel, or reduce speed to below 4000 ft/min.`);
    } else if (r.V > 8000) {
      push("warn", "Very high pitch-line velocity",
        `V = ${Math.round(r.V)} ft/min. Above 8000 ft/min lubrication, dynamic balance, and bearing precision become critical.`,
        `Verify oil-jet lubrication, dynamic balancing of rotating elements, and use precision-ground gears (Av 10–11).`);
    }

    /* ---- Axial thrust ---- */
    if (r.Wa > 0.5 * r.Wt) {
      push("fail", "Excessive axial thrust load",
        `Axial thrust Wa = ${Math.round(r.Wa)} lbf — ${Math.round(100 * r.Wa / r.Wt)}% of tangential load Wt. Bearing selection and shaft design must account for this.`,
        `Reduce helix angle ψ below 20° to bring Wa under 40% of Wt, or specify angular-contact / tapered-roller thrust bearings.`);
    } else if (r.Wa > 0.4 * r.Wt) {
      push("warn", "High axial (thrust) load",
        `Wa = ${Math.round(r.Wa)} lbf (${Math.round(100 * r.Wa / r.Wt)}% of Wt). Helix angle is creating significant thrust that must be handled by the bearings.`,
        `Specify angular-contact or tapered-roller bearings for both shafts. Reducing ψ to 15–20° would lower thrust to a more manageable level.`);
    }

    /* ---- Gear ratio ---- */
    if (r.ratio > 5.0) {
      push("warn", "Gear ratio exceeds single-stage limit",
        `Ratio = ${r.ratio.toFixed(2)}:1 is above the AGMA-recommended 5:1 maximum for a single helical stage. Efficiency and dynamic loads worsen at high ratios.`,
        `Split into two stages (e.g. 2.5:1 × 2.5:1 = 6.25:1) or use a planetary arrangement to achieve ratios > 5:1.`);
    }

    /* ---- Dynamic factor ---- */
    if (r.Kv > 1.6) {
      push("warn", "High dynamic factor Kv",
        `Kv = ${r.Kv.toFixed(3)} — dynamic loads are amplifying the nominal transmitted load by over 60%.`,
        `Improve gear accuracy (raise Av), reduce pitch-line velocity, or review tooth profile modifications (tip relief) to reduce impact.`);
    }

    return out;
  }

  /* ---------- Assumptions engine ---------- */
  function assumptions(i, r) {
    const a = [];
    if (r.factorsAuto) {
      const srcLabel = (POWER_SOURCES.find((s) => s.id === i.powerSource) || {}).label || "uniform source";
      const drvLabel = (DRIVEN_MACHINES.find((s) => s.id === i.drivenMachine) || {}).label || "uniform load";
      a.push({ param: "Overload factor K\u2092", value: r.Ko.toFixed(2),
        reason: `Looked up for "${srcLabel.split(" (")[0]}" driving "${drvLabel.split(" \u2014 ")[0]}" (AGMA overload table).` });
      a.push({ param: "Size factor K\u209b", value: r.Ks.toFixed(3),
        reason: `Computed from face width F = ${i.F.toFixed(2)} in and tooth size (Shigley Eq 14-10); > 1 only for coarse teeth.` });
      a.push({ param: "Load-distribution K\u2098", value: r.Km.toFixed(3),
        reason: `Cmf method for an uncrowned, commercial enclosed unit at F/d = ${(i.F / r.dP).toFixed(2)} (Shigley Eq 14-30).` });
      a.push({ param: "Rim factor K_B", value: r.KB.toFixed(2),
        reason: "Assumed 1.00 \u2014 solid gear blank (rim thickness not a limiting factor)." });
    }
    a.push({ param: "Bending geometry factor J", value: r.J.toFixed(2),
      reason: "Typical AGMA value for a 20° helical pinion with ~20 teeth meshing with its gear (AGMA 908-B89)." });
    a.push({ param: "Contact geometry factor I", value: r.Igeo.toFixed(2),
      reason: "Representative external-helical value; depends on profile contact ratio and helix angle." });
    a.push({ param: "Elastic coefficient Cₚ", value: "2300 √psi",
      reason: "Steel-on-steel pinion/gear pair (E = 30 Mpsi, ν = 0.30), Shigley Table 14-8." });
    if (i.autoFactors || i.autoKv) a.push({ param: "Dynamic factor Kᵥ", value: r.Kv.toFixed(3),
      reason: `Derived from transmission accuracy Qᵥ = ${i.Qv} at V = ${Math.round(r.V)} ft/min (AGMA empirical curve).` });
    a.push({ param: "Stress-cycle factors Yɴ, Zɴ", value: `YN=${(r.YNP||1).toFixed(3)}, ZN=${(r.ZNP||1).toFixed(3)}`,
      reason: `Design life ${(i.Life||20000).toLocaleString()} hr → NP_cyc = ${r.NP_cyc ? r.NP_cyc.toExponential(2) : "—"} cycles.` });
    a.push({ param: "Reliability factor Kʀ", value: r.KR.toFixed(2),
      reason: `For ${(i.reliability * 100).toFixed(2)}% reliability target (Shigley Table 14-10).` });
    if (i.mode === "auto") a.push({ param: "Face width F", value: `${i.F.toFixed(2)} in`,
      reason: "Auto-set to ≈ 12 / Pₙ (within the 3π…5π·m band) to guarantee ≥ 2 axial pitches of overlap." });
    a.push({ param: "Temperature factor Kᴛ", value: "1.00",
      reason: "Operating oil temperature assumed below 250 °F (no thermal derating)." });
    return a;
  }

  /* ---------- Material ranking ----------
     Scores the 3 most relevant materials for the current load case  */
  function rankMaterials(i, r) {
    const ynp = r.YNP || 1.0, znp = r.ZNP || 1.0;
    return MATERIALS.map((m) => {
      const sb = (m.St * ynp) / (1 * r.KR) / r.sigmaB;
      const sc = Math.pow(((m.Sc * znp) / (1 * r.KR)) / r.sigmaC, 2);
      const bendScore = Math.min(sb / 1.6, 1.6);
      const contScore = Math.min(sc / 1.3, 1.6);
      const ok = sb >= 1.5 && sc >= 1.2;
      const raw = (bendScore * 0.45 + contScore * 0.45) * 100 - m.cost * 4;
      return { ...m, sb, sc, ok, score: Math.max(0, Math.min(100, Math.round(raw + (ok ? 8 : -20)))) };
    }).sort((a, b) => {
      if (a.ok !== b.ok) return a.ok ? -1 : 1;
      return b.score - a.score;
    });
  }

  /* ---------- Design comparison: generate A/B/C variants ---------- */
  function designOptions(i) {
    const variants = [
      { label: "A — Compact / Premium", materialId: "4320c", PnDelta: 1, Fscale: 0.92, tag: "Smallest envelope" },
      { label: "B — Balanced", materialId: "8620c", PnDelta: 0, Fscale: 1.0, tag: "Best value" },
      { label: "C — Economy / Robust", materialId: "4140n", PnDelta: -1, Fscale: 1.18, tag: "Lowest cost steel" },
    ];
    return variants.map((v) => {
      const vi = { ...i, materialId: v.materialId, Pn: Math.max(4, i.Pn + v.PnDelta), F: +(i.F * v.Fscale).toFixed(2), autoKv: true };
      const r = compute(vi);
      return { ...v, input: vi, r };
    });
  }

  /* ---------- Default + example presets ---------- */
  const DEFAULT_INPUT = {
    mode: "auto",          // auto | manual
    units: "imperial",     // imperial | metric
    power: 30,             // hp
    rpm: 1800,             // pinion rpm
    gearRpm: 600,          // desired gear (output) rpm -> sets Ng
    helix: 20,             // deg
    pressure: 20,          // normal pressure angle deg
    Np: 17, Ng: 51,
    Pn: 8,                 // normal diametral pitch
    F: 1.5,                // face width in
    materialId: "8620c",
    treat: "Carburized & ground",
    hardness: 580,         // HB
    // application context (drives auto factors)
    powerSource: "uniform",     // uniform | light | medium
    drivenMachine: "moderate",  // uniform | moderate | heavy
    autoFactors: true,          // auto-calculate Ko, Ks, Km, KB
    // manual factor fallbacks (used only when autoFactors is off)
    Ko: 1.25, Kv: 1.2, Ks: 1.0, Km: 1.3, KB: 1.0,
    autoKv: true, Qv: 7,
    reliability: 0.99,
    Life: 20000,
    JP: 0.46, JG: 0.50,
    Igeo: 0.20,
    autoMat: true,
    autoTooth: true,
  };

  // Shigley-style worked example (helical pair, continuous duty)
  const EXAMPLE_SHIGLEY = {
    ...DEFAULT_INPUT,
    mode: "manual",
    power: 30, rpm: 1800, gearRpm: 600, helix: 30, pressure: 20,
    Np: 17, Ng: 52, Pn: 10, F: 1.5,
    materialId: "4320c", treat: "Carburized & ground", hardness: 600,
    autoFactors: false,
    Ko: 1.0, Ks: 1.0, Km: 1.2, KB: 1.0, autoKv: true, Qv: 6, reliability: 0.99,
  };

  /* Textbook-style problem presets. Each loads the inputs that
     describe the problem; the program does the rest.            */
  const PRESETS = [
    {
      id: "default", name: "Default starting point",
      blurb: "30 hp general industrial drive, auto-sized.",
      input: { ...DEFAULT_INPUT },
    },
    {
      // ----------------------------------------------------------------
      // Shigley's Mechanical Engineering Design, Example Problem 10-3
      // Mott, Machine Elements in Mech. Design, Example 9-3
      // ----------------------------------------------------------------
      id: "shigley1003",
      name: "Shigley Ex. 10-3 — Milling drive 65 hp",
      blurb: "Exact textbook solution: Pnd=12, \u03c8=15\u00b0, Np=24, Ng=75, F=2.25 in. \u03c3b\u224831,400 psi, \u03c3c\u2248128,200 psi.",
      input: {
        ...DEFAULT_INPUT,
        // Problem statement
        power: 65, rpm: 3450, gearRpm: 1100,
        // Geometry (Shigley picks Pnd=12, Np=24, Ng=75, F=2.25 in)
        mode: "manual", autoTooth: false, autoMat: false,
        Np: 24, Ng: 75, Pn: 12,
        helix: 15, pressure: 20, F: 2.25,
        // Geometry factors from AGMA 908-B89 / Shigley charts
        // JP=0.48  Fig 10-6: 24-tooth pinion, 75-tooth mate, ψ=15°
        // JG≈0.50  75-tooth gear (symmetric root → slightly higher)
        // I=0.202  Table 10-1: NP=24, NG=75, ψ=15°, φn=20°
        JP: 0.48, JG: 0.50, Igeo: 0.202,
        // AGMA K-factors (Shigley / Mott values)
        autoFactors: false,
        Ko: 1.50,   // moderate shock: electric motor → milling machine
        Ks: 1.00,   // size factor (Pnd=12 ≥ 5 → Ks=1.0)
        Km: 1.26,   // load dist. (F/Dp=1.09, commercial enclosed gearing)
        KB: 1.00,   // solid gear blank
        // Kv from Mott Fig 9-5: Av=9, vt=1871 ft/min → 1.35
        autoKv: false, Kv: 1.35, Qv: 9,
        // Reliability & life (Shigley uses KR=1.25, Life=10,000 hr)
        reliability: 0.999,  // 1 failure in 1000 → KR=1.25
        Life: 10000,
        // Material: AISI 4320 SOQT 450, carburized & case hardened
        materialId: "4320c", hardness: 600,
        powerSource: "uniform", drivenMachine: "moderate",
      },
    },
    {
      id: "forces",
      name: "Force analysis — 2.5 hp @ 600 rpm",
      blurb: "Given geometry from a prior design, find Wt / Wr / Wa on pinion & gear.",
      input: {
        ...DEFAULT_INPUT,
        mode: "manual", autoFactors: false, autoTooth: false, autoMat: false,
        power: 2.5, rpm: 600, gearRpm: 300,
        Np: 20, Ng: 40, helix: 15, pressure: 20, Pn: 10, F: 1.0,
        JP: 0.46, JG: 0.50, Igeo: 0.175,
        materialId: "4140n", hardness: 500,
        Ko: 1.25, Ks: 1.0, Km: 1.2, KB: 1.0, autoKv: true, Qv: 6, reliability: 0.99,
        Life: 20000,
      },
    },
  ];

  window.GearEngine = {
    MATERIALS, HEAT_TREATMENTS, material, suggestMaterial, autoToothCalc,
    POWER_SOURCES, DRIVEN_MACHINES,
    overloadFactor, sizeFactor, loadDistFactor,
    compute, warnings, assumptions, rankMaterials, designOptions,
    dynamicFactor, reliabilityFactor,
    DEFAULT_INPUT, EXAMPLE_SHIGLEY, PRESETS,
    teethForSpeed,
  };
})();

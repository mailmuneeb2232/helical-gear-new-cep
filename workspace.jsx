/* ============================================================
   Center workspace — 4 tabs: Overview, Stress Analysis,
   Design Comparison, Visual Engineering.
   ============================================================ */
function Workspace({ input, r, tab, setTab }) {
  const U = window.Units;
  const sys = input.units;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "stress", label: "Stress Analysis" },
    { id: "compare", label: "Design Comparison" },
    { id: "visual", label: "Visual Engineering" },
  ];

  return (
    <main className="workspace">
      <div className="tabbar">
        {tabs.map((t) => (
          <button key={t.id} className={"tab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <div className="tabbar-spacer" />
        <VerdictPill r={r} />
      </div>
      <div className="workspace-scroll">
        {tab === "overview" && <OverviewTab input={input} r={r} sys={sys} />}
        {tab === "stress" && <StressTab input={input} r={r} sys={sys} />}
        {tab === "compare" && <CompareTab input={input} r={r} sys={sys} />}
        {tab === "visual" && <VisualTab input={input} r={r} sys={sys} />}
      </div>
    </main>
  );
}

function VerdictPill({ r }) {
  const ok = r.SF_bend >= 1.5 && r.SF_cont_power >= 1.2 && r.axialContact >= 1.0;
  const marginal = r.SF_bend >= 1.0 && r.SF_cont_power >= 1.0;
  const level = ok ? "pass" : marginal ? "warn" : "fail";
  const txt = ok ? "Design passes" : marginal ? "Marginal — review" : "Design fails";
  return <div className={"verdict verdict-" + level}><span className="verdict-dot" />{txt}</div>;
}

/* ---------------- Overview ---------------- */
function OverviewTab({ input, r, sys }) {
  const U = window.Units;
  const dp = U.len(r.dP, sys), c = U.len(r.C, sys);
  const tq = U.torque(r.torque, sys), v = U.vel(r.V, sys);
  const wt = U.force(r.Wt, sys);
  const sc   = U.stress(r.sigmaC, sys);
  const sacP = U.stress(r.Sc_req_P || r.sigmaC, sys);
  const sacG = U.stress(r.Sc_req_G || r.sigmaC, sys);
  const hbP  = r.sugMatP ? r.sugMatP.HB_req : null;
  const hbG  = r.sugMatG ? r.sugMatG.HB_req : null;
  return (
    <div className="tabpane">
      <div className="kpi-grid">
        <KpiCard label="Contact stress σc" value={sc.v} unit={sc.u} accent
          sub="AGMA Hertz, pitch point"
          tooltip="Cp·√(Wt·Ko·Kv·Ks·Km·KB / (F·Dp·I)) — governing surface-fatigue (pitting) stress." />
        <KpiCard label="Req. sᴄ — Pinion" value={sacP.v} unit={sacP.u} accent
          sub={`req HB ≥ ${hbP || "—"}`}
          tooltip="Required allowable contact stress number for the pinion material: σc·SF·KR / ZNP." />
        <KpiCard label="Req. sᴄ — Gear" value={sacG.v} unit={sacG.u} accent
          sub={`req HB ≥ ${hbG || "—"}`}
          tooltip="Required allowable contact stress number for the gear material: σc·SF·KR / ZNG." />
        <KpiCard label="Required hardness"
          value={hbP ? `P: ${hbP}` : "—"}
          sub={hbG ? `G: ${hbG} HB` : ""}
          unit=" HB"
          tooltip="Minimum Brinell hardness from the Grade-1 through-hardened formula. Carburized / nitrided steels meet this via case hardness at lower bulk HB." />
      </div>

      <div className="panel">
        <div className="panel-title">Material recommendation
          <span style={{marginLeft:8,fontSize:9,fontFamily:'var(--mono)',color:'var(--accent)',background:'var(--accent-dim)',padding:'2px 6px',borderRadius:4}}>AUTO</span>
        </div>
        <div className="sug-mat-row">
          <SugMatOvCard who="Pinion" sug={r.sugMatP} />
          <SugMatOvCard who="Gear" sug={r.sugMatG} />
        </div>
      </div>

      <div className="ov-cols">
        <div className="panel">
          <div className="panel-title">Geometry summary</div>
          <div className="spec-list">
            <SpecRow k="Pinion pitch dia." v={`${dp.v} ${dp.u}`} />
            <SpecRow k="Gear pitch dia." v={`${U.len(r.dG, sys).v} ${U.len(r.dG, sys).u}`} />
            <SpecRow k="Center distance" v={`${c.v} ${c.u}`} />
            <SpecRow k="Transverse pressure angle" v={`${r.phit.toFixed(2)}°`} />
            <SpecRow k="Axial contact ratio" v={`${r.axialContact.toFixed(2)} pitches`}
              level={r.axialContact >= 2 ? "pass" : r.axialContact >= 1 ? "warn" : "fail"} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Loads at the mesh</div>
          <div className="spec-list">
            <SpecRow k="Tangential  Wt" v={`${wt.v} ${wt.u}`} />
            <SpecRow k="Radial  Wr" v={`${U.force(r.Wr, sys).v} ${U.force(r.Wr, sys).u}`} />
            <SpecRow k="Axial / thrust  Wa" v={`${U.force(r.Wa, sys).v} ${U.force(r.Wa, sys).u}`}
              level={r.Wa > 0.4 * r.Wt ? "warn" : "pass"} />
            <SpecRow k="Pinion torque" v={`${tq.v} ${tq.u}`} />
            <SpecRow k="Pitch-line velocity" v={`${v.v} ${v.u}`} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Material — {r.mat.name} · {r.mat.treat}</div>
        <p className="panel-note">{r.mat.note}</p>

        <div className="mat-bars">
          <MatBar label={`Allowable bending Sₜ`} value={r.mat.St} max={70000} unit={U.stress(r.mat.St, sys).u} disp={U.stress(r.mat.St, sys).v} />
          <MatBar label={`Allowable contact S𝚌`} value={r.mat.Sc} max={240000} unit={U.stress(r.mat.Sc, sys).u} disp={U.stress(r.mat.Sc, sys).v} />
          <MatBar label="Surface hardness" value={input.hardness} max={650} unit="HB" disp={input.hardness} />
        </div>
      </div>
    </div>
  );
}

function SpecRow({ k, v, level }) {
  return (
    <div className="spec-row">
      <span className="spec-k">{k}</span>
      <span className={"spec-v mono" + (level ? " spec-" + level : "")}>{v}</span>
    </div>
  );
}
function MatBar({ label, value, max, unit, disp }) {
  return (
    <div className="matbar">
      <div className="matbar-head"><span>{label}</span><span className="mono">{disp} {unit}</span></div>
      <div className="matbar-track"><div className="matbar-fill" style={{ width: Math.min(100, value / max * 100) + "%" }} /></div>
    </div>
  );
}

/* suggested material compact card for overview */
function SugMatOvCard({ who, sug }) {
  if (!sug) return null;
  const ok = sug.ok;
  return (
    <div className={"sug-mat-card" + (ok ? " smc-ok" : " smc-warn")}>
      <div className="smc-who">{who}</div>
      <div className="smc-name">{sug.name}</div>
      <div className="smc-treat">{sug.treat}</div>
      <div className="smc-hb mono">HB &gt; {sug.HB_req} → spec {sug.HB} HB</div>
      <div className="smc-checks">
        <span className={sug.St >= sug.St_req ? "smc-ok-badge" : "smc-bad-badge"}>
          {sug.St >= sug.St_req ? "✓" : "✗"} Sᵂ {Math.round(sug.St/1000)}k psi
        </span>
        <span className={sug.Sc >= sug.Sc_req ? "smc-ok-badge" : "smc-bad-badge"}>
          {sug.Sc >= sug.Sc_req ? "✓" : "✗"} Sᴄ {Math.round(sug.Sc/1000)}k psi
        </span>
      </div>
    </div>
  );
}
function StressTab({ input, r, sys }) {
  const U = window.Units;
  const [activeFactor, setActiveFactor] = React.useState(null);
  const openFactor = (k, v) => setActiveFactor({ k, v });
  const closeFactor = () => setActiveFactor(null);
  return (
    <div className="tabpane">
      {activeFactor ? <FactorModal factor={activeFactor} input={input} r={r} onClose={closeFactor} /> : null}
      <div className="meter-grid">
        <BarMeter title="Bending stress σ (tooth root)" actual={r.sigmaB} allowable={r.sigmaB_all}
          unit={U.isMetric(sys) ? "MPa" : "psi"} sf={r.SF_bend} target={1.5}
          fmt={(v) => U.isMetric(sys) ? Math.round(v * 0.00689476).toLocaleString() : Math.round(v).toLocaleString()} />
        <BarMeter title="Contact stress σc (flank, pitting)" actual={r.sigmaC} allowable={r.sigmaC_all}
          unit={U.isMetric(sys) ? "MPa" : "psi"} sf={r.SF_cont_power} target={1.2}
          fmt={(v) => U.isMetric(sys) ? Math.round(v * 0.00689476).toLocaleString() : Math.round(v).toLocaleString()} />
      </div>

      <div className="panel">
        <div className="panel-title">Bending & contact stress numbers</div>
        <p className="panel-note">Required AGMA stress numbers (reversed from actual stress + life/reliability factors) compared to the selected material’s allowable numbers Sᵂ and Sᴄ. The bar shows what the material must provide; the dashed line shows what it does provide.</p>
        <StressPlot r={r} />
      </div>

      <div className="panel">
        <div className="panel-title">AGMA factor stack {r.factorsAuto ? <span className="title-tag">auto-derived</span> : <span className="title-tag tag-manual">manual</span>}</div>
        <p className="panel-note">{r.factorsAuto ? "Ko, Ks, Km, KB are computed from your application context — see Active assumptions for the rationale." : "Values come from your manual entries in the sidebar."}  <span className="panel-note-hint">↗ Click any chip to see its formula, chart, and reference table.</span></p>
        <div className="factor-grid">
          <FactorChip k="Ko" label="Overload" v={r.Ko.toFixed(2)} onClick={() => openFactor("Ko", r.Ko.toFixed(2))} />
          <FactorChip k="Kᵥ" label="Dynamic" v={r.Kv.toFixed(3)} hot={r.Kv > 1.4} onClick={() => openFactor("Kᵥ", r.Kv.toFixed(3))} />
          <FactorChip k="Ks" label="Size" v={r.Ks.toFixed(3)} onClick={() => openFactor("Ks", r.Ks.toFixed(3))} />
          <FactorChip k="Km" label="Load dist." v={r.Km.toFixed(3)} hot={r.Km > 1.6} onClick={() => openFactor("Km", r.Km.toFixed(3))} />
          <FactorChip k="KB" label="Rim" v={r.KB.toFixed(2)} onClick={() => openFactor("KB", r.KB.toFixed(2))} />
          <FactorChip k="KR" label="Reliability" v={r.KR.toFixed(2)} onClick={() => openFactor("KR", r.KR.toFixed(2))} />
          <FactorChip k="JP" label="Pinion J" v={(r.J || 0.46).toFixed(3)} onClick={() => openFactor("JP", (r.J || 0.46).toFixed(3))} />
          <FactorChip k="JG" label="Gear J" v={(r.JG || 0.50).toFixed(3)} onClick={() => openFactor("JG", (r.JG || 0.50).toFixed(3))} />
          <FactorChip k="I" label="Contact geom." v={r.Igeo.toFixed(3)} onClick={() => openFactor("I", r.Igeo.toFixed(3))} />
          <FactorChip k="Av" label="Quality no." v={String(input.Qv)} onClick={() => openFactor("Av", String(input.Qv))} />
          <FactorChip k="YN" label="Bend cycle" v={(r.YNP || 1).toFixed(3)} onClick={() => openFactor("YN", (r.YNP || 1).toFixed(3))} />
          <FactorChip k="ZN" label="Pitting cycle" v={(r.ZNP || 1).toFixed(3)} onClick={() => openFactor("ZN", (r.ZNP || 1).toFixed(3))} />
        </div>
      </div>
    </div>
  );
}
function FactorChip({ k, label, v, hot, onClick }) {
  return (
    <div className={"factor" + (hot ? " factor-hot" : "") + " factor-clickable"} onClick={onClick} title={"Click to see formula, chart and reference for " + k}>
      <div className="factor-k mono">{k}</div>
      <div className="factor-v mono">{v}</div>
      <div className="factor-label">{label}</div>
      <div className="factor-hint">↗ details</div>
    </div>
  );
}

/* ---------------- Design Comparison ---------------- */
function CompareTab({ input, r, sys }) {
  const U = window.Units;
  const E = window.GearEngine;
  const opts = React.useMemo(() => E.designOptions(input), [JSON.stringify(input)]);
  return (
    <div className="tabpane">
      <p className="pane-intro">Three engineered alternatives for your power & ratio, holding speed and tooth counts fixed. Stress factors recompute per variant.</p>
      <div className="compare-grid">
        {opts.map((o) => {
          const ok = o.r.SF_bend >= 1.5 && o.r.SF_cont_power >= 1.2;
          return (
            <div className={"compare-card" + (ok ? " cc-ok" : " cc-warn")} key={o.label}>
              <div className="cc-head">
                <span className="cc-tag">{o.tag}</span>
                <span className={"cc-badge " + (ok ? "ccb-pass" : "ccb-warn")}>{ok ? "PASS" : "REVIEW"}</span>
              </div>
              <div className="cc-title">{o.label}</div>
              <div className="cc-stats">
                <CcStat k="Bending SF" v={o.r.SF_bend.toFixed(2)} level={o.r.SF_bend >= 1.5 ? "pass" : "warn"} />
                <CcStat k="Contact SF" v={o.r.SF_cont_power.toFixed(2)} level={o.r.SF_cont_power >= 1.2 ? "pass" : "warn"} />
                <CcStat k="Center dist." v={`${U.len(o.r.C, sys).v} ${U.len(o.r.C, sys).u}`} />
                <CcStat k="Face width" v={`${U.len(o.input.F, sys).v} ${U.len(o.input.F, sys).u}`} />
              </div>
              <CompareMatPanel or={o.r} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
function CompareMatPanel({ or: r }) {
  const E = window.GearEngine;
  const [tab, setTab] = React.useState("pinion");
  if (!r.sugMatP || !r.sugMatG) return null;
  const sug    = tab === "pinion" ? r.sugMatP : r.sugMatG;
  const St_req = tab === "pinion" ? r.St_req_P : r.St_req_G;
  const Sc_req = tab === "pinion" ? r.Sc_req_P : r.Sc_req_G;
  const alts = E.MATERIALS.map(m => {
    const stOk = m.St >= St_req, scOk = m.Sc >= Sc_req;
    return { ...m, stOk, scOk, ok: stOk && scOk };
  }).sort((a, b) => { if (a.ok !== b.ok) return a.ok ? -1 : 1; return a.cost - b.cost; });
  return (
    <div className="cc-mat-full">
      <div className="cc-mat-full-title">Material specification</div>
      <div className="cc-mat-tabs">
        <button className={"cmt" + (tab === "pinion" ? " cmt-on" : "")} onClick={() => setTab("pinion")}>Pinion</button>
        <button className={"cmt" + (tab === "gear"   ? " cmt-on" : "")} onClick={() => setTab("gear")}>Gear</button>
      </div>
      <div className="cc-req-row">
        <span className="cc-req-item"><span className="cc-req-lbl">Sᵂ req</span><span className="cc-req-val mono">{Math.round(St_req/1000)}k psi</span></span>
        <span className="cc-req-item"><span className="cc-req-lbl">Sᴄ req</span><span className="cc-req-val mono">{Math.round(Sc_req/1000)}k psi</span></span>
        <span className="cc-req-item"><span className="cc-req-lbl">HB min</span><span className="cc-req-val mono">{sug.HB_req}</span></span>
      </div>
      <div className="cc-alt-list">
        {alts.map(m => {
          const isSug = m.id === sug.id;
          return (
            <div key={m.id} className={"cc-alt" + (isSug ? " cca-sug" : "") + (m.ok ? "" : " cca-fail")}>
              <div className="cca-top">
                <span className="cca-name">{m.name}</span>
                {isSug && <span className="cca-rec">★ rec.</span>}
                <span className="cca-cost mono">{"$".repeat(m.cost)}</span>
              </div>
              <div className="cca-detail">
                <span className="cca-treat">{m.treat}</span>
                <span className={"cca-chk " + (m.stOk ? "rc-ok" : "rc-bad")}>{m.stOk ? "✓" : "✗"}Sᵂ{Math.round(m.St/1000)}k</span>
                <span className={"cca-chk " + (m.scOk ? "rc-ok" : "rc-bad")}>{m.scOk ? "✓" : "✗"}Sᴄ{Math.round(m.Sc/1000)}k</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CcStat({ k, v, level }) {
  return (
    <div className="cc-stat">
      <span className="cc-stat-k">{k}</span>
      <span className={"cc-stat-v mono" + (level ? " spec-" + level : "")}>{v}</span>
    </div>
  );
}

/* ---------------- Visual Engineering ---------------- */
function VisualTab({ input, r, sys }) {
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1); // 0.25x, 0.5x, 1x, 2x
  const angleRef = React.useRef(0);
  const [pinionAngle, setPinionAngle] = React.useState(0);
  const rafRef = React.useRef(null);
  const lastTRef = React.useRef(null);

  // visual speed: 20 rpm * speed multiplier
  const degsPerMs = (20 * speed * 6) / 1000;

  React.useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTRef.current != null) {
        const dt = ts - lastTRef.current;
        angleRef.current = (angleRef.current + degsPerMs * dt) % 360;
        setPinionAngle(angleRef.current);
      }
      lastTRef.current = ts;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, degsPerMs]);

  const speedOpts = [{ v: 0.25, l: "¼×" }, { v: 0.5, l: "½×" }, { v: 1, l: "1×" }, { v: 2, l: "2×" }, { v: 4, l: "4×" }];

  return (
    <div className="tabpane">
      <div className="panel viz-hero">
        <div className="panel-title-row">
          <div className="panel-title" style={{marginBottom:0}}>Helical gear pair — meshing schematic</div>
          <div className="viz-controls">
            {speedOpts.map(o => (
              <button key={o.v}
                className={"viz-speed-btn" + (speed === o.v ? " vsb-on" : "")}
                onClick={() => setSpeed(o.v)}>{o.l}</button>
            ))}
            <button className={"viz-play-btn" + (playing ? " vpb-pause" : " vpb-play")} onClick={() => setPlaying(p => !p)}>
              {playing
                ? <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>
                : <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5V3z"/></svg>
              }
              {playing ? "Pause" : "Play"}
            </button>
          </div>
        </div>
        <GearSchematic r={r} input={input} pinionAngle={pinionAngle} />
      </div>
      <div className="viz-cols">
        <div className="panel">
          <div className="panel-title">Helix geometry</div>
          <HelixInset r={r} input={input} />
        </div>
        <div className="panel">
          <div className="panel-title">Force resolution at mesh</div>
          <ForceDiagram r={r} />
        </div>
      </div>
    </div>
  );
}

window.Workspace = Workspace;

/* ============================================================
   Left input sidebar — 5 collapsible groups of parameters.
   Receives `input`, `set(patch)`, `r` (results), `units`.
   ============================================================ */
function Sidebar({ input, set, r, openSections, toggleSection }) {
  const E = window.GearEngine;
  const U = window.Units;
  const sys = input.units;
  const auto = input.mode === "auto";

  // power slider (unit-aware)
  const ps = U.powerSlider(sys);
  const fs = U.faceSlider(sys);
  const pp = U.pitchSlider(sys);

  const matOpts = E.MATERIALS.map((m) => ({ value: m.id, label: `${m.name} · ${m.treat}` }));
  const treatOpts = E.HEAT_TREATMENTS.map((t) => ({ value: t, label: t }));

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <p className="sidebar-hint">
          Use the <strong style={{color:"var(--accent)"}}>eye icon</strong> on a section header to switch between
          <strong> Auto</strong> (program picks values) and <strong>Manual</strong> (you set them).
        </p>
      </div>

      <Section id="power" letter="01" title="Power & Speed" open={openSections.power} onToggle={toggleSection}>
        <SliderInput
          label={U.isMetric(sys) ? "Input power" : "Input power"}
          value={ps.to(input.power)} unit={ps.unit} min={ps.min} max={ps.max} step={ps.step} decimals={ps.decimals}
          onChange={(v) => set({ power: ps.from(v) })}
          tooltip="Transmitted power at the pinion shaft. Drives the tangential load Wt = 33000·P / V."
        />
        <SliderInput
          label="Pinion speed" value={input.rpm} unit="rpm" min={100} max={6000} step={50}
          onChange={(v) => set({ rpm: v })}
          tooltip="Rotational speed of the driving pinion. Higher rpm raises pitch-line velocity and the dynamic factor Kv."
        />
        <SliderInput
          label="Gear speed" value={input.gearRpm} unit="rpm" min={50} max={3600} step={25}
          onChange={(v) => set({ gearRpm: v })}
          tooltip="Desired output speed at the gear. Sets the required ratio — the program picks the gear tooth count Ng to match (rounded to whole teeth)."
        />
        <div className="derived-group">
          <DerivedRow label="Required ratio" value={(input.rpm / Math.max(1, input.gearRpm)).toFixed(3)} unit=":1" tooltip="Pinion rpm ÷ target gear rpm." />
          <DerivedRow label="Achieved ratio" value={r.ratio.toFixed(3)} unit=":1" tooltip="Actual ratio from whole-tooth counts Ng / Np." />
          <DerivedRow label="Pinion torque" value={U.torque(r.torque, sys).v} unit={U.torque(r.torque, sys).u} />
          <DerivedRow label="Actual gear speed" value={U.num(r.nOut, 0)} unit="rpm" tooltip="Pinion rpm ÷ achieved ratio. May differ slightly from target due to integer teeth." />
          <DerivedRow label="Pitch-line vel." value={U.vel(r.V, sys).v} unit={U.vel(r.V, sys).u} />
        </div>
      </Section>

      <Section id="geom" letter="02" title="Gear Geometry" open={openSections.geom} onToggle={toggleSection}
        eye={!auto} onEye={(manual) => set({ mode: manual ? "manual" : "auto" })}>
        <SliderInput
          label="Pinion teeth Np" value={input.Np} unit="T" min={10} max={40} step={1}
          onChange={(v) => set({ Np: v })}
          tooltip="Number of teeth on the pinion. Below ~14 risks undercutting at the tooth root."
        />
        <SliderInput
          label="Gear teeth Ng" value={input.Ng} unit="T" min={12} max={160} step={1}
          onChange={(v) => set({ Ng: v })}
          tooltip="Number of teeth on the gear. Linked to Gear speed above — editing it here updates the target output rpm, and vice-versa."
        />
        <SliderInput
          label={pp.label} value={pp.to(input.Pn)} unit={pp.unit} min={pp.min} max={pp.max} step={pp.step} decimals={pp.decimals}
          onChange={(v) => set({ Pn: pp.from(v) })}
          tooltip={U.isMetric(sys) ? "Normal module — tooth size. Larger module = bigger, stronger teeth." : "Normal diametral pitch — teeth per inch of diameter. Lower = larger, stronger teeth."}
        />
        <SliderInput
          label="Face width F" value={fs.to(input.F)} unit={fs.unit} min={fs.min} max={fs.max} step={fs.step} decimals={fs.decimals}
          onChange={(v) => set({ F: fs.from(v) })}
          disabled={auto} locked={auto}
          tooltip="Axial width of the teeth. Wider spreads load (lower stress) but risks uneven contact. Good band: 3π…5π·module."
        />
        <div className="derived-group">
          <DerivedRow label="Ratio" value={r.ratio.toFixed(3)} unit=":1" />
          <DerivedRow label="Pinion dia. dP" value={U.len(r.dP, sys).v} unit={U.len(r.dP, sys).u} />
          <DerivedRow label="Gear dia. dG" value={U.len(r.dG, sys).v} unit={U.len(r.dG, sys).u} />
          <DerivedRow label="Center dist. C" value={U.len(r.C, sys).v} unit={U.len(r.C, sys).u} />
        </div>
      </Section>

      <Section id="tooth" letter="03" title="Tooth Profile" open={openSections.tooth} onToggle={toggleSection}
        eye={!input.autoTooth} onEye={(manual) => set({ autoTooth: !manual })}>

        {input.autoTooth ? (
          <React.Fragment>
            <div className="auto-tooth-banner">
              <span className="auto-mat-icon">⚙️</span>
              <span className="auto-mat-text">Helix angle is set to the minimum that achieves axial contact ratio ≥ 2.0. JP and JG are estimated from AGMA 908-B89 approximations for the current tooth counts and helix angle.</span>
            </div>
            {r.autoToothResult && (
              <div className="derived-group">
                <DerivedRow label="Helix angle ψ" value={r.autoToothResult.psi.toFixed(0)} unit="deg"
                  tooltip="Smallest integer angle giving mF ≥ 2.0 for the current F and Pn." />
                <DerivedRow label="Pressure angle" value={r.autoToothResult.pressure.toFixed(0)} unit="deg"
                  tooltip="Standard 20° normal pressure angle." />
                <DerivedRow label="Pinion factor JP" value={r.autoToothResult.JP.toFixed(3)} unit=""
                  tooltip="AGMA 908-B89 approximation from Np, ψ, φn." />
                <DerivedRow label="Gear factor JG" value={r.autoToothResult.JG.toFixed(3)} unit=""
                  tooltip="AGMA 908-B89 approximation from Ng, ψ, φn." />
                <DerivedRow label="Transverse PA" value={r.phit.toFixed(2)} unit="deg" tooltip="φt = atan(tanφn / cosψ)." />
                <DerivedRow label="Axial contact" value={r.axialContact.toFixed(2)} unit="pitches"
                  tooltip="mF = F·Pn·tanψ/π. Auto mode targets ≥ 2.0." />
                <DerivedRow label="Contact factor I" value={(input.Igeo || 0.20).toFixed(3)} unit=""
                  tooltip="Contact geometry factor I — set manually in Manual mode from AGMA Table 10-1. Auto mode uses 0.20 as a typical helical-gear value." />
              </div>
            )}
          </React.Fragment>
        ) : (
          <React.Fragment>
        <SliderInput
          label="Helix angle ψ" value={input.helix} unit="deg" min={0} max={45} step={1}
          onChange={(v) => set({ helix: v })}
          tooltip="Angle of the teeth relative to the axis. 15–30° typical. Higher = smoother & quieter but more axial thrust."
        />
        <SliderInput
          label="Normal pressure angle" value={input.pressure} unit="deg" min={14.5} max={25} step={0.5} decimals={1}
          onChange={(v) => set({ pressure: v })}
          tooltip="Pressure angle φn. 20° is standard. Higher = stronger teeth, more radial separating force."
        />
        <SliderInput
          label="Pinion bending factor JP" value={input.JP != null ? input.JP : 0.46} unit="JP" min={0.2} max={0.7} step={0.005} decimals={3}
          onChange={(v) => set({ JP: v })}
          tooltip="Pinion bending geometry factor (AGMA 908-B89 / Shigley Fig 14-6). Depends on Np, Ng, φn, and ψ. Typical helical range 0.35–0.55."
        />
        <SliderInput
          label="Gear bending factor JG" value={input.JG != null ? input.JG : 0.50} unit="JG" min={0.2} max={0.7} step={0.005} decimals={3}
          onChange={(v) => set({ JG: v })}
          tooltip="Gear bending geometry factor. Slightly higher than JP because the gear tooth is more symmetric. Typical 0.40–0.60."
        />
        <SliderInput
          label="Contact geometry factor I" value={input.Igeo != null ? input.Igeo : 0.20} unit="I" min={0.05} max={0.30} step={0.001} decimals={3}
          onChange={(v) => set({ Igeo: v })}
          tooltip="Pitting (contact) geometry factor. Read from AGMA 908-B89 Table 10-1 for your NP, NG, ψ, φn. Typical helical range 0.10–0.22."
        />
        <div className="derived-group">
          <DerivedRow label="Transverse PA" value={r.phit.toFixed(2)} unit="deg" tooltip="Pressure angle in the plane of rotation, φt = atan(tanφn / cosψ)." />
          <DerivedRow label="Axial contact" value={r.axialContact.toFixed(2)} unit="pitches" tooltip="Helical overlap. ≥ 2.0 gives smooth, continuous engagement." />
        </div>
          </React.Fragment>
        )}
      </Section>

      <Section id="mat" letter="04" title="Material & Treatment" open={openSections.mat} onToggle={toggleSection}
        eye={!input.autoMat} onEye={(manual) => set({ autoMat: !manual })}>

        {input.autoMat ? (
          <React.Fragment>
            <div className="auto-mat-banner">
              <span className="auto-mat-icon">⚡</span>
              <span className="auto-mat-text">Suggesting least-cost material that satisfies both AGMA bending and pitting stress numbers for the current loads.</span>
            </div>
            <div className="auto-mat-cards">
              <AutoMatCard who="Pinion" sug={r.sugMatP} sys={input.units} />
              <AutoMatCard who="Gear" sug={r.sugMatG} sys={input.units} />
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
        <Select label="Material" value={input.materialId} options={matOpts} onChange={(v) => {
          const m = E.material(v); set({ materialId: v, treat: m.treat, hardness: m.HB });
        }} tooltip="Alloy + heat treatment set the allowable bending (St) and contact (Sc) stress numbers." />
        <SliderInput
          label="Surface hardness" value={input.hardness} unit="HB" min={180} max={650} step={10}
          onChange={(v) => set({ hardness: v })}
          tooltip="Brinell hardness of the working surface. Higher hardness directly raises contact (pitting) resistance."
        />
        <div className="mat-readout">
          <div className="mat-readout-row"><span>Allow. bending Sₜ</span><span className="mono">{U.stress(r.mat.St, sys).v} {U.stress(r.mat.St, sys).u}</span></div>
          <div className="mat-readout-row"><span>Allow. contact S𝚌</span><span className="mono">{U.stress(r.mat.Sc, sys).v} {U.stress(r.mat.Sc, sys).u}</span></div>
        </div>
          </React.Fragment>
        )}
      </Section>

      <Section id="qual" letter="05" title="Loading & Quality Factors" open={openSections.qual} onToggle={toggleSection}
        eye={!input.autoFactors} onEye={(manual) => set({ autoFactors: !manual })}>

        {input.autoFactors ? (
          <React.Fragment>
            <div className="auto-mat-banner">
              <span className="auto-mat-icon">⚙</span>
              <span className="auto-mat-text">Ko, Ks, Km, KB computed from application context. Flip the eye icon to enter your own values.</span>
            </div>
            <Select label="Power source" value={input.powerSource}
              options={E.POWER_SOURCES.map((s) => ({ value: s.id, label: s.label }))}
              onChange={(v) => set({ powerSource: v })}
              tooltip="The prime mover. Uniform (electric motor / turbine) adds no overload; engines add shock. Sets the overload factor Ko." />
            <Select label="Driven machine" value={input.drivenMachine}
              options={E.DRIVEN_MACHINES.map((s) => ({ value: s.id, label: s.label }))}
              onChange={(v) => set({ drivenMachine: v })}
              tooltip="Load character of what the gears drive. A milling machine is a moderate-shock load. Combined with the power source, this sets Ko." />
            <div className="derived-group">
              <DerivedRow label="Overload Ko" value={r.Ko.toFixed(2)} unit="" tooltip="From the power-source × driven-machine overload table." />
              <DerivedRow label="Size Ks" value={r.Ks.toFixed(3)} unit="" tooltip="Computed from tooth size & face width (Shigley Eq 14-10)." />
              <DerivedRow label="Load dist. Km" value={r.Km.toFixed(3)} unit="" tooltip="Cmf method for an uncrowned commercial enclosed unit." />
              <DerivedRow label="Rim KB" value={r.KB.toFixed(2)} unit="" tooltip="Assumed 1.0 — solid gear blank." />
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <SliderInput label="Overload Ko" value={input.Ko} unit="" min={1} max={2.5} step={0.05} decimals={2}
              onChange={(v) => set({ Ko: v })}
              tooltip="Overload factor for shock / duty. 1.0 uniform, 1.25 light, 1.75+ heavy shock." />
            <SliderInput label="Size Ks" value={input.Ks} unit="" min={1} max={1.5} step={0.01} decimals={2}
              onChange={(v) => set({ Ks: v })}
              tooltip="Size factor. ≈ 1.0 for fine teeth, larger for coarse-pitch gears." />
            <SliderInput label="Load distribution Km" value={input.Km} unit="" min={1} max={2} step={0.05} decimals={2}
              onChange={(v) => set({ Km: v })}
              tooltip="Accounts for non-uniform load across the face from misalignment & deflection. 1.2–1.4 typical." />
            <SliderInput label="Rim factor KB" value={input.KB} unit="" min={1} max={1.6} step={0.05} decimals={2}
              onChange={(v) => set({ KB: v })}
              tooltip="Rim-thickness factor. 1.0 for a solid gear; > 1 for thin-rimmed / spoked blanks." />
          </React.Fragment>
        )}

        <Select label="Reliability target" value={String(input.reliability)} onChange={(v) => set({ reliability: parseFloat(v) })}
          options={[
            { value: "0.9", label: "90% — general" },
            { value: "0.99", label: "99% — industrial" },
            { value: "0.999", label: "99.9% — critical" },
            { value: "0.9999", label: "99.99% — aerospace" },
          ]} tooltip="Higher reliability applies a larger KR derating to the allowable stress." />
        <SliderInput
          label="Quality number Av" value={input.Qv} unit="Av" min={5} max={11} step={1}
          onChange={(v) => set({ Qv: v })}
          tooltip="AGMA transmission accuracy number (Av). Higher Av = more precise gear = lower dynamic factor Kv."
        />
        <SliderInput
          label="Design life" value={input.Life || 20000} unit="hr" min={100} max={200000} step={500}
          onChange={(v) => set({ Life: v })}
          tooltip="Required service life in hours. Sets cycle counts NP_cyc and NG_cyc which determine the YN and ZN life factors."
        />
        <div className="derived-group">
          <DerivedRow label="Reliability KR" value={r.KR.toFixed(2)} unit="" />
          <DerivedRow label="Dynamic Kv" value={r.Kv.toFixed(3)} unit="" />
        </div>
      </Section>
    </aside>
  );
}

function AutoMatCard({ who, sug, sys }) {
  const U = window.Units;
  if (!sug) return null;
  const stOk = sug.St >= sug.St_req;
  const scOk = sug.Sc >= sug.Sc_req;
  return (
    <div className={"auto-mat-card" + (sug.ok ? " amc-ok" : " amc-warn")}>
      <div className="amc-who">{who}</div>
      <div className="amc-name">{sug.name}</div>
      <div className="amc-treat">{sug.treat}</div>
      <div className="amc-hb">
        {sug.caseHRC
          ? <><span className="amc-hb-req">Core HB &gt; {sug.HB_req}</span><span className={"amc-hb-val" + (sug.HB >= sug.HB_req ? " hb-ok" : " hb-bad")}>{"\u2192"} Core {sug.HB} HB {sug.HB >= sug.HB_req ? "\u2713" : "\u2717"} · Case HRC {sug.caseHRC}</span></>
          : <><span className="amc-hb-req">HB &gt; {sug.HB_req}</span><span className={"amc-hb-val" + (sug.HB >= sug.HB_req ? " hb-ok" : " hb-bad")}>{"\u2192"} {sug.HB} HB {sug.HB >= sug.HB_req ? "\u2713" : "\u2717"}</span></>
        }
      </div>
      <div className="amc-checks">
        <div className={"amc-chk " + (stOk ? "chk-ok" : "chk-bad")}>
          <span>{stOk ? "\u2713" : "\u2717"}</span>
          <span className="mono">S\u1d42 {Math.round(sug.St / 1000)}k \u2265 req {Math.round(sug.St_req / 1000)}k psi</span>
        </div>
        <div className={"amc-chk " + (scOk ? "chk-ok" : "chk-bad")}>
          <span>{scOk ? "\u2713" : "\u2717"}</span>
          <span className="mono">S\u1d04 {Math.round(sug.Sc / 1000)}k \u2265 req {Math.round(sug.Sc_req / 1000)}k psi</span>
        </div>
      </div>
    </div>
  );
}

window.AutoMatCard = AutoMatCard;
window.Sidebar = Sidebar;

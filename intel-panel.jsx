/* ============================================================
   Right "engineering intelligence" panel — live warnings,
   design assumptions, and material recommendations.
   ============================================================ */
function IntelPanel({ input, r }) {
  const E = window.GearEngine;
  const warns = React.useMemo(() => E.warnings(input, r), [JSON.stringify(input)]);
  const assumes = React.useMemo(() => E.assumptions(input, r), [JSON.stringify(input)]);
  const ranked = React.useMemo(() => E.rankMaterials(input, r), [JSON.stringify(input)]);

  const [open, setOpen] = React.useState({ warn: true, assume: true, mat: true });
  const t = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const counts = warns.reduce((a, w) => { a[w.level] = (a[w.level] || 0) + 1; return a; }, {});

  return (
    <aside className="intel">
      <div className="intel-title">
        <span className="intel-title-main">Engineering Intelligence</span>
        <span className="intel-title-sub">live design review</span>
      </div>

      <IntelGroup
        title="Design checks"
        open={open.warn} onToggle={() => t("warn")}
        badge={
          <span className="intel-badge-row">
            {counts.fail ? <span className="ib ib-fail">{counts.fail}</span> : null}
            {counts.warn ? <span className="ib ib-warn">{counts.warn}</span> : null}
            {counts.pass ? <span className="ib ib-pass">{counts.pass}</span> : null}
          </span>
        }
      >
        <div className="warn-list">
          {warns.map((w, i) => (
            <div className={"warn warn-" + w.level} key={i}>
              <div className="warn-head">
                <span className={"warn-icon wi-" + w.level}>
                  {w.level === "pass" ? "\u2713" : w.level === "warn" ? "!" : "\u00D7"}
                </span>
                <span className="warn-title">{w.title}</span>
              </div>
              <p className="warn-detail">{w.detail}</p>
              {w.fix ? (
                <p className="warn-fix">
                  <span className="warn-fix-label">{w.level === "fail" ? "⚠ Fix: " : "→ Tip: "}</span>
                  {w.fix}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </IntelGroup>

      <IntelGroup title="Material recommendations" open={open.mat} onToggle={() => t("mat")}>
        <MatRecommendPanel r={r} input={input} ranked={ranked} />
      </IntelGroup>

      <IntelGroup title="Active assumptions" open={open.assume} onToggle={() => t("assume")}>
        <div className="assume-list">
          {assumes.map((a, i) => (
            <div className="assume" key={i}>
              <div className="assume-head">
                <span className="assume-param">{a.param}</span>
                <span className="assume-val mono">{a.value}</span>
              </div>
              <p className="assume-reason">{a.reason}</p>
            </div>
          ))}
        </div>
      </IntelGroup>
    </aside>
  );
}

function IntelGroup({ title, open, onToggle, badge, children }) {
  return (
    <div className={"intel-group" + (open ? " open" : "")}>
      <button className="intel-group-head" onClick={onToggle}>
        <span className="intel-group-title">{title}</span>
        {badge}
        <span className="intel-chev">{open ? "\u2212" : "+"}</span>
      </button>
      {open ? <div className="intel-group-body">{children}</div> : null}
    </div>
  );
}

/* ---- Material Recommendations panel ---- */
function MatRecommendPanel({ r, input, ranked }) {
  const E = window.GearEngine;
  const [tab, setTab] = React.useState("pinion");
  if (!r.sugMatP || !r.sugMatG) return null;

  const sug = tab === "pinion" ? r.sugMatP : r.sugMatG;
  const St_req = tab === "pinion" ? r.St_req_P : r.St_req_G;
  const Sc_req = tab === "pinion" ? r.Sc_req_P : r.Sc_req_G;

  // Build alternatives: all materials ranked by cost for this tab's requirements
  const alts = E.MATERIALS.map(m => {
    const stOk = m.St >= St_req, scOk = m.Sc >= Sc_req;
    const ok = stOk && scOk;
    const margin = Math.min(m.St / Math.max(1, St_req), m.Sc / Math.max(1, Sc_req));
    return { ...m, stOk, scOk, ok, margin };
  }).sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    return a.cost - b.cost || b.margin - a.margin;
  });

  return (
    <div className="mat-rec-panel">
      {/* pinion / gear switcher */}
      <div className="mat-rec-tabs">
        <button className={"mrt" + (tab === "pinion" ? " mrt-on" : "")} onClick={() => setTab("pinion")}>Pinion</button>
        <button className={"mrt" + (tab === "gear" ? " mrt-on" : "")} onClick={() => setTab("gear")}>Gear</button>
      </div>

      {/* requirements */}
      <div className="mat-req-row">
        <div className="mat-req-item">
          <span className="mat-req-label">Req. S\u1d42</span>
          <span className="mat-req-val mono">{Math.round(St_req / 1000)}k psi</span>
        </div>
        <div className="mat-req-item">
          <span className="mat-req-label">Req. S\u1d04</span>
          <span className="mat-req-val mono">{Math.round(Sc_req / 1000)}k psi</span>
        </div>
        <div className="mat-req-item">
          <span className="mat-req-label">Min HB</span>
          <span className="mat-req-val mono">{sug.HB_req}</span>
        </div>
      </div>

      {/* material list */}
      <div className="rank-list">
        {alts.map((m, i) => {
          const isSug = m.id === sug.id;
          const isCurrent = m.id === input.materialId;
          return (
            <div className={"rank mat-alt" + (isSug ? " rank-sug" : "") + (isCurrent ? " rank-sel" : "") + (m.ok ? "" : " rank-fail")} key={m.id}>
              <div className="rank-bar-bg">
                <div className={"rank-bar " + (m.ok ? "rb-ok" : "rb-no")}
                  style={{ width: Math.min(100, m.margin * 60) + "%" }} />
              </div>
              <div className="rank-content">
                <div className="rank-top">
                  <span className="rank-name">{m.name}</span>
                  <span className="rank-badges">
                    {isSug ? <span className="rank-tag rt-sug">\u2605 recommended</span> : null}
                    {isCurrent ? <span className="rank-tag rt-curr">current</span> : null}
                    {!m.ok ? <span className="rank-tag rt-fail">insufficient</span> : null}
                  </span>
                  <span className="rank-cost mono">{"$".repeat(m.cost)}</span>
                </div>
                <div className="rank-meta">
                  <span className="rank-treat">{m.treat}</span>
                  <span className="rank-hb mono">HB {m.HB}</span>
                </div>
                <div className="rank-checks">
                  <span className={"rchk " + (m.stOk ? "rchk-ok" : "rchk-bad")}>
                    {m.stOk ? "\u2713" : "\u2717"} S\u1d42 {Math.round(m.St/1000)}k
                  </span>
                  <span className={"rchk " + (m.scOk ? "rchk-ok" : "rchk-bad")}>
                    {m.scOk ? "\u2713" : "\u2717"} S\u1d04 {Math.round(m.Sc/1000)}k
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.IntelPanel = IntelPanel;

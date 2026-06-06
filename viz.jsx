/* ============================================================
   Visualization components (SVG): helical gear pair schematic,
   force diagram, stress comparison plot.
   ============================================================ */

/* Build a castellated gear outline path (technical, not involute) */
function gearPath(cx, cy, rPitch, teeth, addn, dedn, rotDeg) {
  const N = Math.max(6, Math.round(teeth));
  const rA = rPitch + addn;
  const rD = rPitch - dedn;
  const rot = (rotDeg || 0) * Math.PI / 180;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const base = (i / N) * Math.PI * 2 + rot;
    const pitch = (Math.PI * 2) / N;
    // fractions around one tooth: dedendum -> rise -> top land -> fall
    const steps = [
      [0.00, rD], [0.16, rA], [0.40, rA], [0.56, rD], [1.0, rD],
    ];
    for (const [f, r] of steps) {
      const a = base + f * pitch;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return "M" + pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join("L") + "Z";
}

/* ---- 2D helical gear pair schematic ---- */
function GearSchematic({ r, input, pinionAngle }) {
  const angle = pinionAngle || 0;
  // gear rotates in opposite direction, scaled by tooth ratio
  const gearAngle = -(angle * input.Np / input.Ng);
  const W = 720, H = 460;
  // scale so pinion + gear fit
  const totalPD = r.dP + r.dG; // == 2C
  const margin = 80;
  const scale = (W - margin * 2) / (totalPD * 1.04);
  const rp = (r.dP / 2) * scale;
  const rg = (r.dG / 2) * scale;
  const addn = scale / input.Pn;        // addendum = 1/Pd
  const dedn = 1.25 * scale / input.Pn;
  const cyc = H / 2 - 20;
  const cxP = margin + rp;
  const cxG = cxP + rp + rg;            // tangent pitch circles
  const meshX = cxP + rp;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--text-3)" strokeWidth="0.6" opacity="0.5" />
        </pattern>
      </defs>

      {/* center distance dimension */}
      <line x1={cxP} y1={cyc} x2={cxG} y2={cyc} stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 3" />
      <line x1={cxP} y1={cyc - rp - addn - 26} x2={cxP} y2={cyc} stroke="var(--text-3)" strokeWidth="0.7" />
      <line x1={cxG} y1={cyc - rg - addn - 26} x2={cxG} y2={cyc} stroke="var(--text-3)" strokeWidth="0.7" />
      <line x1={cxP} y1={cyc - rp - addn - 18} x2={cxG} y2={cyc - rp - addn - 18} stroke="var(--accent)" strokeWidth="0.8" markerStart="url(#arL)" markerEnd="url(#arR)" />
      <text x={(cxP + cxG) / 2} y={cyc - rp - addn - 24} className="viz-dim" textAnchor="middle">
        C = {r.C.toFixed(3)} in
      </text>

      {/* Gear (large) */}
      <g transform={`rotate(${gearAngle.toFixed(3)}, ${cxG}, ${cyc})`}>
        <path d={gearPath(cxG, cyc, rg, input.Ng, addn, dedn, 360 / input.Ng / 2)}
          className="gear-body" />
        <circle cx={cxG} cy={cyc} r={3.5} className="gear-center" />
      </g>
      <circle cx={cxG} cy={cyc} r={rg} className="pitch-circle" />
      <text x={cxG} y={cyc + rg + addn + 22} className="viz-label" textAnchor="middle">
        GEAR · {input.Ng}T · {(r.dG).toFixed(2)} in
      </text>

      {/* Pinion (small) */}
      <g transform={`rotate(${angle.toFixed(3)}, ${cxP}, ${cyc})`}>
        <path d={gearPath(cxP, cyc, rp, input.Np, addn, dedn, 0)} className="gear-body pinion" />
        <circle cx={cxP} cy={cyc} r={3.5} className="gear-center" />
      </g>
      <circle cx={cxP} cy={cyc} r={rp} className="pitch-circle" />
      <text x={cxP} y={cyc + rg + addn + 22} className="viz-label" textAnchor="middle">
        PINION · {input.Np}T · {(r.dP).toFixed(2)} in
      </text>

      {/* mesh point */}
      <circle cx={meshX} cy={cyc} r={4} className="mesh-point" />
      <text x={meshX} y={cyc - 8} className="viz-dim" textAnchor="middle" fill="var(--warn)">pitch point</text>

      {/* rotation arrows */}
      <g className="rot-arrow">
        <path d={`M ${cxP} ${cyc - rp * 0.55} A ${rp * 0.55} ${rp * 0.55} 0 0 1 ${cxP + rp * 0.55} ${cyc}`} fill="none" />
        <path d={`M ${cxG} ${cyc - rg * 0.55} A ${rg * 0.55} ${rg * 0.55} 0 0 0 ${cxG - rg * 0.55} ${cyc}`} fill="none" />
      </g>

      <marker id="arL" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M6,1 L1,4 L6,7" fill="none" stroke="var(--accent)" strokeWidth="1" /></marker>
      <marker id="arR" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto"><path d="M2,1 L7,4 L2,7" fill="none" stroke="var(--accent)" strokeWidth="1" /></marker>
    </svg>
  );
}

/* ---- helix angle inset (the face, with helix lines) ---- */
function HelixInset({ r, input }) {
  const W = 320, H = 200;
  const fx = 40, fy = 40, fw = 240, fh = 110;
  const psi = input.helix;
  const lines = [];
  const dx = fh * Math.tan(psi * Math.PI / 180);
  for (let x = fx - dx; x < fx + fw; x += 18) {
    lines.push([x, fy + fh, x + dx, fy]);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" preserveAspectRatio="xMidYMid meet">
      <rect x={fx} y={fy} width={fw} height={fh} className="face-rect" />
      <clipPath id="faceClip"><rect x={fx} y={fy} width={fw} height={fh} /></clipPath>
      <g clipPath="url(#faceClip)">
        {lines.map((l, i) => (
          <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} className="helix-line" />
        ))}
      </g>
      {/* helix angle arc */}
      <line x1={fx} y1={fy + fh} x2={fx + 60} y2={fy + fh} className="dim-line" />
      <line x1={fx} y1={fy + fh} x2={fx + 60 * Math.cos(-psi * Math.PI / 180) + 0} y2={fy + fh + 60 * Math.sin(-psi * Math.PI / 180)} className="dim-line" />
      <text x={fx + 66} y={fy + fh - 14} className="viz-dim" fill="var(--accent)">{"\u03C8"} = {psi}{"\u00B0"}</text>
      <text x={fx} y={fy - 12} className="viz-label">FACE WIDTH F = {input.F.toFixed(2)} in</text>
      <line x1={fx} y1={fy + fh + 22} x2={fx + fw} y2={fy + fh + 22} className="dim-line" markerStart="url(#arL)" markerEnd="url(#arR)" />
    </svg>
  );
}

/* ---- Force diagram: Wt / Wr / Wa vectors at the pitch point ---- */
function ForceDiagram({ r }) {
  const W = 340, H = 240;
  const ox = 150, oy = 150;
  const max = Math.max(r.Wt, r.Wr, r.Wa, 1);
  const L = 90;
  const wt = (r.Wt / max) * L, wr = (r.Wr / max) * L, wa = (r.Wa / max) * L;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="fv" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="currentColor" /></marker>
      </defs>
      <circle cx={ox} cy={oy} r={4} className="mesh-point" />
      <text x={ox - 8} y={oy + 20} className="viz-dim">tooth contact</text>

      {/* Wt tangential (down) */}
      <g className="fvec fvec-t">
        <line x1={ox} y1={oy} x2={ox} y2={oy - wt} markerEnd="url(#fv)" />
        <text x={ox + 8} y={oy - wt - 4}>Wt {Math.round(r.Wt)} lbf</text>
      </g>
      {/* Wr radial (left) */}
      <g className="fvec fvec-r">
        <line x1={ox} y1={oy} x2={ox - wr} y2={oy} markerEnd="url(#fv)" />
        <text x={ox - wr - 6} y={oy + 16} textAnchor="end">Wr {Math.round(r.Wr)}</text>
      </g>
      {/* Wa axial (iso, up-right) */}
      <g className="fvec fvec-a">
        <line x1={ox} y1={oy} x2={ox + wa * 0.8} y2={oy - wa * 0.45} markerEnd="url(#fv)" />
        <text x={ox + wa * 0.8 + 6} y={oy - wa * 0.45}>Wa {Math.round(r.Wa)}</text>
      </g>
    </svg>
  );
}

/* ---- Stress Numbers plot: required St/Sc vs material allowable ---- */
function StressPlot({ r }) {
  if (!r.St_req_P || !r.mat) return null;

  const rows = [
    {
      label: "Bending — Pinion",
      sub: "Sₜ required vs mat. Sₜ",
      req: r.St_req_P,
      allow: r.mat.St,
      level: r.mat.St >= r.St_req_P ? "pass" : "fail",
    },
    {
      label: "Bending — Gear",
      sub: "Sₜ required vs mat. Sₜ",
      req: r.St_req_G || r.St_req_P,
      allow: r.mat.St,
      level: r.mat.St >= (r.St_req_G || r.St_req_P) ? "pass" : "fail",
    },
    {
      label: "Contact — Pinion",
      sub: "S꜀ required vs mat. S꜀",
      req: r.Sc_req_P,
      allow: r.mat.Sc,
      level: r.mat.Sc >= r.Sc_req_P ? "pass" : "fail",
    },
    {
      label: "Contact — Gear",
      sub: "S꜀ required vs mat. S꜀",
      req: r.Sc_req_G || r.Sc_req_P,
      allow: r.mat.Sc,
      level: r.mat.Sc >= (r.Sc_req_G || r.Sc_req_P) ? "pass" : "fail",
    },
  ];
  const max = Math.max(...rows.map(x => Math.max(x.req, x.allow))) * 1.08;

  return (
    <div className="stressplot">
      {rows.map((row) => {
        const reqPct  = Math.min(100, row.req   / max * 100);
        const allowPct = Math.min(100, row.allow / max * 100);
        const margin = row.allow - row.req;
        const marginPct = ((margin / row.allow) * 100).toFixed(0);
        return (
          <div className="sp-row sp-row-4" key={row.label}>
            <div className="sp-label-col">
              <div className="sp-label">{row.label}</div>
              <div className="sp-sub">{row.sub}</div>
            </div>
            <div className="sp-bars">
              <div className="sp-barwrap">
                <div className="sp-bar-bg">
                  {/* allowable (background reference) */}
                  <div className="sp-bar sp-allow-bg" style={{ width: allowPct + "%" }} />
                  {/* required (foreground) */}
                  <div className={"sp-bar sp-req fill-" + row.level} style={{ width: reqPct + "%" }}>
                    <span className="sp-val mono">{Math.round(row.req).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="sp-legend">
                <span className="sp-legend-allow mono">{Math.round(row.allow).toLocaleString()} psi allow</span>
                <span className={"sp-margin " + (margin >= 0 ? "sp-margin-ok" : "sp-margin-bad")}>
                  {margin >= 0 ? "+" : ""}{Math.round(margin / 1000)}k margin ({marginPct}%)
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="sp-axis mono">stress number (psi) {"\u2192"}</div>
    </div>
  );
}

Object.assign(window, { GearSchematic, HelixInset, ForceDiagram, StressPlot });

/* ============================================================
   Factor detail modal — comprehensive charts for all AGMA factors.
   Exported: FactorModal.  Relies on gear-engine.js being loaded.
   ============================================================ */

/* ---------- helpers ---------- */
const SUP = ["\u2070","\u00B9","\u00B2","\u00B3","\u2074","\u2075","\u2076","\u2077","\u2078","\u2079"];
function sup(n) { return String(n).split("").map(c => SUP[+c] ?? c).join(""); }

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

/* ---------- LinearChart ---------- */
function LinearChart({ w = 360, h = 170, xMin, xMax, yMin, yMax, xLabel, yLabel, series, markX, markY, xFmt, yFmt }) {
  const pad = { l: 46, r: 18, t: 14, b: 36 };
  const W = w - pad.l - pad.r, H = h - pad.t - pad.b;
  const sx = x => pad.l + ((x - xMin) / (xMax - xMin)) * W;
  const sy = y => pad.t + H - ((y - yMin) / (yMax - yMin)) * H;
  const xf = xFmt || (v => v.toFixed(1));
  const yf = yFmt || (v => v.toFixed(2));
  const xTicks = 5, yTicks = 4;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="factor-chart" preserveAspectRatio="xMidYMid meet">
      {Array.from({length: yTicks+1}, (_,i) => { const y = yMin + (i/yTicks)*(yMax-yMin); return <line key={i} x1={pad.l} y1={sy(y)} x2={pad.l+W} y2={sy(y)} stroke="var(--line)" strokeWidth="0.7"/>; })}
      {Array.from({length: xTicks+1}, (_,i) => { const x = xMin + (i/xTicks)*(xMax-xMin); return <line key={i} x1={sx(x)} y1={pad.t} x2={sx(x)} y2={pad.t+H} stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 3"/>; })}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t+H} stroke="var(--line-2)" strokeWidth="1"/>
      <line x1={pad.l} y1={pad.t+H} x2={pad.l+W} y2={pad.t+H} stroke="var(--line-2)" strokeWidth="1"/>
      {Array.from({length: yTicks+1}, (_,i) => { const y = yMin + (i/yTicks)*(yMax-yMin); return <text key={i} x={pad.l-4} y={sy(y)+3.5} textAnchor="end" className="chart-tick">{yf(y)}</text>; })}
      {Array.from({length: xTicks+1}, (_,i) => { const x = xMin + (i/xTicks)*(xMax-xMin); return <text key={i} x={sx(x)} y={pad.t+H+13} textAnchor="middle" className="chart-tick">{xf(x)}</text>; })}
      <text x={pad.l+W/2} y={h-1} textAnchor="middle" className="chart-label">{xLabel}</text>
      <text x={10} y={pad.t+H/2} textAnchor="middle" className="chart-label" transform={`rotate(-90,10,${pad.t+H/2})`}>{yLabel}</text>
      {series.map((s,si) => {
        const pts = s.points.map(p => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
        return <g key={si}>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth={s.active?2.2:1.2} opacity={s.active?1:0.4}/>
          {s.label && <text x={sx(s.points[Math.floor(s.points.length*0.85)][0])+5} y={sy(s.points[Math.floor(s.points.length*0.85)][1])} className="chart-label" fill={s.color}>{s.label}</text>}
        </g>;
      })}
      {markX!=null && markY!=null && <g>
        <line x1={sx(markX)} y1={pad.t} x2={sx(markX)} y2={pad.t+H} stroke="var(--warn)" strokeWidth="1" strokeDasharray="3 2"/>
        <circle cx={sx(markX)} cy={sy(markY)} r={5} fill="var(--warn)" stroke="var(--bg-1)" strokeWidth="1.5"/>
        <text x={sx(markX)+7} y={sy(markY)-5} className="chart-label" fill="var(--warn)">{markY.toFixed(3)}</text>
      </g>}
    </svg>
  );
}

/* ---------- LogChart (log x-axis for S-N curves) ---------- */
function LogChart({ w = 360, h = 170, xLogMin, xLogMax, yMin, yMax, xLabel, yLabel, series, markX, markY }) {
  const pad = { l: 46, r: 20, t: 14, b: 36 };
  const W = w - pad.l - pad.r, H = h - pad.t - pad.b;
  const sx = x => x > 0 ? pad.l + ((Math.log10(x) - xLogMin) / (xLogMax - xLogMin)) * W : pad.l;
  const sy = y => pad.t + H - ((y - yMin) / (yMax - yMin)) * H;
  const decades = Array.from({length: xLogMax - xLogMin + 1}, (_, i) => xLogMin + i);
  const yTicks = 4;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="factor-chart" preserveAspectRatio="xMidYMid meet">
      {decades.map(d => <line key={d} x1={sx(Math.pow(10,d))} y1={pad.t} x2={sx(Math.pow(10,d))} y2={pad.t+H} stroke="var(--line)" strokeWidth="0.7"/>)}
      {Array.from({length: yTicks+1}, (_,i) => { const y = yMin+(i/yTicks)*(yMax-yMin); return <line key={i} x1={pad.l} y1={sy(y)} x2={pad.l+W} y2={sy(y)} stroke="var(--line)" strokeWidth="0.7"/>; })}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t+H} stroke="var(--line-2)" strokeWidth="1"/>
      <line x1={pad.l} y1={pad.t+H} x2={pad.l+W} y2={pad.t+H} stroke="var(--line-2)" strokeWidth="1"/>
      {decades.map(d => <text key={d} x={sx(Math.pow(10,d))} y={pad.t+H+14} textAnchor="middle" className="chart-tick">{"10"+sup(d)}</text>)}
      {Array.from({length: yTicks+1}, (_,i) => { const y = yMin+(i/yTicks)*(yMax-yMin); return <text key={i} x={pad.l-4} y={sy(y)+3.5} textAnchor="end" className="chart-tick">{y.toFixed(2)}</text>; })}
      <text x={pad.l+W/2} y={h-1} textAnchor="middle" className="chart-label">{xLabel}</text>
      <text x={10} y={pad.t+H/2} textAnchor="middle" className="chart-label" transform={`rotate(-90,10,${pad.t+H/2})`}>{yLabel}</text>
      {series.map((s,si) => {
        const pts = s.points.filter(p=>p[0]>0&&isFinite(p[1])).map(p=>`${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
        const mid = s.points[Math.floor(s.points.length*0.6)];
        return <g key={si}>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth={s.active?2.2:1.2} opacity={s.active?1:0.4}/>
          {s.label && mid && <text x={sx(mid[0])+5} y={sy(mid[1])-4} className="chart-label" fill={s.color}>{s.label}</text>}
        </g>;
      })}
      {markX!=null && markY!=null && markX>0 && <g>
        <line x1={sx(markX)} y1={pad.t} x2={sx(markX)} y2={pad.t+H} stroke="var(--warn)" strokeWidth="1.2" strokeDasharray="3 2"/>
        <circle cx={sx(markX)} cy={sy(markY)} r={5} fill="var(--warn)" stroke="var(--bg-1)" strokeWidth="1.5"/>
        <text x={sx(markX)+7} y={sy(markY)-5} className="chart-label" fill="var(--warn)">{markY.toFixed(3)}</text>
      </g>}
    </svg>
  );
}

/* ---------- RefTable ---------- */
function RefTable({ rows, cols, data, highlightRow, highlightCol, caption }) {
  return (
    <div className="ref-table-wrap">
      {caption && <p className="ref-caption">{caption}</p>}
      <table className="ref-table">
        <thead><tr><th></th>{cols.map((c,i)=><th key={i}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((row,ri)=>(
          <tr key={ri}><td className="ref-row-head">{row}</td>
            {data[ri].map((val,ci)=>(
              <td key={ci} className={ri===highlightRow&&ci===highlightCol?"ref-hl":""}>{val}</td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/* ---------- KmBar ---------- */
function KmBar({ base, cpf, cma }) {
  const total = base + cpf + cma;
  return (
    <div className="km-bar-wrap">
      <div className="km-bar">
        <div className="km-seg km-base" style={{width:(base/total*100)+"%"}}>1.0</div>
        <div className="km-seg km-cpf" style={{width:(cpf/total*100)+"%"}}>Cpf {cpf.toFixed(3)}</div>
        <div className="km-seg km-cma" style={{width:(cma/total*100)+"%"}}>Cma {cma.toFixed(3)}</div>
      </div>
      <div className="km-bar-label mono">Km = 1.0 + {cpf.toFixed(3)} + {cma.toFixed(3)} = {total.toFixed(3)}</div>
    </div>
  );
}

/* ---------- KoMatrix ---------- */
function KoMatrix({ srcIdx, drvIdx }) {
  const vals = [[1.00,1.25,1.75],[1.25,1.50,2.00],[1.50,1.75,2.25]];
  const rows = ["Electric motor","Multi-cyl. engine","Single-cyl. engine"];
  const cols = ["Uniform","Moderate shock","Heavy shock"];
  const color = v => v<=1.0?"var(--pass)":v<=1.25?"var(--warn)":v<=1.75?"#e87c30":"var(--fail)";
  return (
    <div className="ko-matrix">
      <div className="ko-col-heads"><span className="ko-blank"></span>{cols.map((c,i)=><span key={i} className="ko-col-head">{c}</span>)}</div>
      {rows.map((row,ri)=>(
        <div key={ri} className="ko-row">
          <span className="ko-row-head">{row}</span>
          {vals[ri].map((v,ci)=>(
            <span key={ci} className={"ko-cell"+(ri===srcIdx&&ci===drvIdx?" ko-active":"")} style={{"--kc":color(v)}}>
              {v.toFixed(2)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- KrBars ---------- */
function KrBars({ reliability }) {
  const levels = [{r:0.90,kr:0.85},{r:0.99,kr:1.00},{r:0.999,kr:1.25},{r:0.9999,kr:1.50}];
  const cur = [0.9,0.99,0.999,0.9999].indexOf(reliability);
  return (
    <div className="kr-bars">
      {levels.map((l,i)=>(
        <div key={i} className={"kr-bar-row"+(i===cur?" kr-active":"")}>
          <span className="kr-label mono">{(l.r*100).toFixed(2)}%</span>
          <div className="kr-track"><div className="kr-fill" style={{width:(l.kr/1.5*100)+"%"}}></div></div>
          <span className="kr-val mono">{l.kr.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- LifeTable ---------- */
function LifeTable({ rpm, Life }) {
  const hours = [100,500,1000,3000,5000,10000,20000,50000,100000];
  const NP_cyc = h => 60 * rpm * h;
  const cur = hours.reduce((best,h,i) => Math.abs(h-Life)<Math.abs(best.h-Life)?{h,i}:best, {h:hours[0],i:0}).i;
  return (
    <div className="life-table-wrap">
      <table className="ref-table">
        <thead><tr><th>Life (hr)</th><th>N cycles (pinion)</th><th>YN</th><th>ZN</th></tr></thead>
        <tbody>{hours.map((h,i)=>{
          const N=NP_cyc(h), yn=getYN(N), zn=getZN(N);
          return (
            <tr key={i}>
              <td className={i===cur?"ref-hl ref-row-head":"ref-row-head"}>{h.toLocaleString()}</td>
              <td className={i===cur?"ref-hl":""} style={{fontFamily:"var(--mono)",fontSize:11}}>{N.toExponential(2)}</td>
              <td className={i===cur?"ref-hl":""} style={{fontFamily:"var(--mono)"}}>{yn.toFixed(3)}</td>
              <td className={i===cur?"ref-hl":""} style={{fontFamily:"var(--mono)"}}>{zn.toFixed(3)}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

/* ============================================================
   factorContent — returns { title, subtitle, body } per factor key
   ============================================================ */
function factorContent(k, input, r) {
  const DEG = Math.PI / 180;

  /* ----- Ko ----- */
  if (k === "Ko") {
    const srcIdx = ["uniform","light","medium"].indexOf(input.powerSource);
    const drvIdx = ["uniform","moderate","heavy"].indexOf(input.drivenMachine);
    const E = window.GearEngine;
    return {
      title: "Ko — Overload Factor",
      subtitle: "Accounts for external shock loads from the driver and driven machine beyond rated transmitted power.",
      body: (<>
        <KoMatrix srcIdx={srcIdx} drvIdx={drvIdx} />
        <div className="formula-block">
          <div className="mono sm">Source: {(E.POWER_SOURCES.find(s=>s.id===input.powerSource)||{}).label}</div>
          <div className="mono sm">Driven: {(E.DRIVEN_MACHINES.find(s=>s.id===input.drivenMachine)||{}).label}</div>
          <div className="mono sm">Ko = <span className="accent">{r.Ko.toFixed(2)}</span></div>
        </div>
      </>)
    };
  }

  /* ----- Kv ----- */
  if (k === "Kᵥ") {
    const vtMax = Math.max(3500, r.V * 1.5);
    const kvOf = (Av, vt) => { const B=0.25*Math.pow(12-Av,2/3),A=50+56*(1-B); return Math.pow((A+Math.sqrt(vt))/A,B); };
    const colors = ["#f06a6a","#e8b341","#3ecf8e","var(--accent)","#a78bfa"];
    const avs = [5,7,9,11];
    const N = 80;
    const series = avs.map((av,i)=>({ label:`Av=${av}`, color:colors[i], active:av===input.Qv,
      points:Array.from({length:N+1},(_,j)=>{const vt=j/N*vtMax;return[vt,kvOf(av,vt)];})
    }));
    const kvMax = Math.max(...series.map(s=>s.points[N][1]))*1.05;
    return {
      title: "Kᵥ — Dynamic Factor",
      subtitle: "Amplifies the load to account for internal gear-mesh dynamics. Higher quality number Av = lower Kv = smoother running.",
      body: (<>
        <LinearChart w={360} h={170} xMin={0} xMax={vtMax} yMin={1} yMax={Math.ceil(kvMax*10)/10}
          xLabel="Pitch-line velocity vt (ft/min)" yLabel="Kᵥ"
          series={series} markX={r.V} markY={r.Kv} xFmt={v=>Math.round(v)} />
        <div className="formula-block">
          <div className="mono sm">B = 0.25×(12−Av)^(2/3) = {(0.25*Math.pow(12-input.Qv,2/3)).toFixed(3)}</div>
          <div className="mono sm">A = 50 + 56×(1−B) = {(50+56*(1-0.25*Math.pow(12-input.Qv,2/3))).toFixed(3)}</div>
          <div className="mono sm">Kv = ((A+√vt)/A)^B at vt={Math.round(r.V)} ft/min = <span className="accent">{r.Kv.toFixed(4)}</span></div>
        </div>
      </>)
    };
  }

  /* ----- Ks ----- */
  if (k === "Ks") {
    const ksOf = (Pn) => Pn>=5 ? 1.0 : Math.max(1.0, 1.192*Math.pow(input.F*Math.sqrt(0.40)/Pn,0.0535));
    const series = [{ label:"", color:"var(--accent)", active:true,
      points:Array.from({length:60},(_,i)=>{const p=2+i*0.35;return[p,ksOf(p)];})
    }];
    return {
      title: "Ks — Size Factor",
      subtitle: "Penalises coarser teeth (lower Pn) where material properties are less uniform through the section.",
      body: (<>
        <LinearChart w={360} h={160} xMin={2} xMax={22} yMin={0.98} yMax={1.14}
          xLabel="Normal diametral pitch Pnd (in⁻¹)" yLabel="Ks"
          series={series} markX={input.Pn} markY={r.Ks} xFmt={v=>v.toFixed(0)} />
        <div className="formula-block">
          <div className="mono sm">if Pn ≥ 5: Ks = 1.00</div>
          <div className="mono sm">else: Ks = 1.192×(F√Y / Pn)^0.0535,  Y ≈ 0.40</div>
          <div className="mono sm">Current Pn={input.Pn} → Ks = <span className="accent">{r.Ks.toFixed(3)}</span></div>
        </div>
      </>)
    };
  }

  /* ----- Km ----- */
  if (k === "Km") {
    const cpf = isFinite(r.Cpf)?r.Cpf:0, cma = isFinite(r.Cma)?r.Cma:0;
    // Cpf vs F/Dp for several F values
    const cpfOf = (ratio, F) => Math.max(0, ratio<0.5 ? ratio/10-0.025 : ratio/10-0.0375+0.0125*F);
    const Fs = [0.75, 1.0, 1.5, 2.0, 3.0];
    const colors = ["#5a7aaa","var(--text-2)","var(--accent)","#e8b341","#f06a6a"];
    const cpfSeries = Fs.map((F,i)=>({
      label:`F=${F}"`, color:colors[i], active:Math.abs(F-input.F)<0.3,
      points:Array.from({length:50},(_,j)=>{const ratio=j/49*2;return[ratio,cpfOf(ratio,F)];})
    }));
    const curRatio = r.dP>0 ? input.F/r.dP : 0;
    // Cma vs F (formula + gearing type reference lines)
    const cmaSeries = [
      { label:"Formula", color:"var(--accent)", active:true,
        points:Array.from({length:50},(_,j)=>{const F=j/49*5;return[F,0.127+0.0158*F-9.3e-5*F*F];}) },
      { label:"Open 0.264", color:"#f06a6a", active:false,
        points:[[0,0.264],[5,0.264]] },
      { label:"Comm 0.143", color:"#e8b341", active:false,
        points:[[0,0.143],[5,0.143]] },
      { label:"Prec 0.080", color:"var(--pass)", active:false,
        points:[[0,0.080],[5,0.080]] },
    ];
    return {
      title: "Km — Load-Distribution Factor",
      subtitle: "Non-uniform load across the face width due to misalignment and gear/shaft deflection. Km = 1 + Cpf + Cma.",
      body: (<>
        <KmBar base={1.0} cpf={cpf} cma={cma} />
        <p className="chart-section-label">Cpf — Pinion Proportion Factor vs F/Dₚ</p>
        <LinearChart w={360} h={155} xMin={0} xMax={2} yMin={0} yMax={0.45}
          xLabel="F/Dₚ ratio" yLabel="Cpf" series={cpfSeries} markX={curRatio} markY={cpf} xFmt={v=>v.toFixed(2)} />
        <p className="chart-section-label">Cma — Mesh-Alignment Factor vs Face Width F</p>
        <LinearChart w={360} h={145} xMin={0} xMax={5} yMin={0} yMax={0.32}
          xLabel="Face width F (in)" yLabel="Cma" series={cmaSeries} markX={input.F} markY={cma} xFmt={v=>v.toFixed(1)} />
        <div className="formula-block">
          <div className="mono sm">Cma = 0.127 + 0.0158·F − 9.3×10⁻⁵·F² = {cma.toFixed(3)}</div>
          <div className="mono sm">Cpf = {cpf.toFixed(3)}, Cma = {cma.toFixed(3)}</div>
          <div className="mono sm">Km = 1 + {cpf.toFixed(3)} + {cma.toFixed(3)} = <span className="accent">{r.Km.toFixed(3)}</span></div>
        </div>
      </>)
    };
  }

  /* ----- KB ----- */
  if (k === "KB") {
    // KB vs mB curve (Shigley Fig 14-16, approximate)
    const kbPts = [[0.30,2.40],[0.40,1.90],[0.50,1.60],[0.60,1.35],[0.80,1.18],[1.00,1.08],[1.20,1.00],[1.50,1.00],[2.00,1.00]];
    const series = [{ label:"", color:"var(--accent)", active:true, points:kbPts }];
    return {
      title: "KB — Rim Thickness Factor",
      subtitle: "Reduces the effective tooth root strength when a thin gear rim flexes instead of fully supporting the tooth.",
      body: (<>
        <LinearChart w={360} h={165} xMin={0.2} xMax={2.0} yMin={0.95} yMax={2.5}
          xLabel="mB = tR / ht  (rim thickness / tooth height)" yLabel="KB"
          series={series} markX={null} markY={null} xFmt={v=>v.toFixed(1)} />
        <div className="formula-block">
          <div className="mono sm">mB = tR / ht  (rim thickness ÷ whole tooth height)</div>
          <div className="mono sm">mB ≥ 1.2 → KB = 1.00 (solid or thick rim — no penalty)</div>
          <div className="mono sm">mB &lt; 1.2 → KB increases; thin rims amplify root stress</div>
        </div>
        <p className="detail-note">Solid blank assumed in auto mode → KB = <span className="mono accent">1.00</span>. For thin-rimmed or spoked blanks, compute mB from the blank geometry.</p>
      </>)
    };
  }

  /* ----- KR ----- */
  if (k === "KR") {
    const hi = [0.9,0.99,0.999,0.9999].indexOf(input.reliability);
    return {
      title: "KR — Reliability Factor",
      subtitle: "Derates allowable stress to achieve the specified probability of survival over the full design life.",
      body: (<>
        <KrBars reliability={input.reliability} />
        <RefTable caption="KR vs reliability target (Shigley Table 14-10)"
          rows={["90%","99%","99.9%","99.99%"]} cols={["KR"]}
          data={[[0.85],[1.00],[1.25],[1.50]]}
          highlightRow={hi} highlightCol={0} />
        <p className="detail-note">Current target: {(input.reliability*100).toFixed(2)}% → KR = <span className="mono accent">{r.KR.toFixed(2)}</span>.  Higher KR lowers the allowable stress, reducing safety factor margin.</p>
      </>)
    };
  }

  /* ----- JP (pinion J) ----- */
  if (k === "JP") {
    const psiDeg = input.helix;
    // Approximate J vs NP from AGMA 908-B89 typical values for helical gear, phi_n=20°
    const jOf = (NP, psi) => {
      const base = 0.245 + 0.0095*NP - 2.8e-5*NP*NP; // spur approx
      const hx = 1 + 0.013*(psi/10) + 0.007*(psi/10)*(psi/10); // helix bonus
      return Math.min(0.65, base * hx);
    };
    const psis = [0,15,20,25,30];
    const colors = ["var(--text-3)","#5a7aaa","var(--accent)","#e8b341","#f06a6a"];
    const series = psis.map((psi,i)=>({
      label:`ψ=${psi}°`, color:colors[i], active:Math.abs(psi-psiDeg)<3,
      points:Array.from({length:40},(_,j)=>{const NP=10+j*3;return[NP,jOf(NP,psi)];})
    }));
    return {
      title: "JP — Pinion Bending Geometry Factor",
      subtitle: "Combines the Lewis form factor, load-sharing ratio, and root stress concentration for the pinion tooth.",
      body: (<>
        <LinearChart w={360} h={165} xMin={10} xMax={120} yMin={0.25} yMax={0.62}
          xLabel="Pinion teeth NP" yLabel="JP"
          series={series} markX={input.Np} markY={r.J} xFmt={v=>Math.round(v)} />
        <p className="detail-note">Helical gears have higher J than equivalent spur gears due to load sharing across the face. <br/>Read exact values from <strong>AGMA 908-B89 Figure 1</strong> for φn={input.pressure}°, ψ={input.helix}°. Current JP = <span className="mono accent">{r.J.toFixed(3)}</span>.</p>
        <div className="formula-block">
          <div className="mono sm">JP = (1/Kf) × (cos αt × sin αt / 2mN) × mN/mF</div>
          <div className="mono sm">where Kf = stress concentration, mN = load sharing ratio</div>
        </div>
      </>)
    };
  }

  /* ----- JG (gear J) ----- */
  if (k === "JG") {
    const psiDeg = input.helix;
    const jOf = (NG, psi) => {
      const base = 0.270 + 0.0085*NG - 1.6e-5*NG*NG;
      const hx = 1 + 0.013*(psi/10) + 0.007*(psi/10)*(psi/10);
      return Math.min(0.68, base * hx);
    };
    const psis = [0,15,20,25,30];
    const colors = ["var(--text-3)","#5a7aaa","var(--accent)","#e8b341","#f06a6a"];
    const series = psis.map((psi,i)=>({
      label:`ψ=${psi}°`, color:colors[i], active:Math.abs(psi-psiDeg)<3,
      points:Array.from({length:40},(_,j)=>{const NG=15+j*4;return[NG,jOf(NG,psi)];})
    }));
    const JG = r.JG || 0.50;
    return {
      title: "JG — Gear Bending Geometry Factor",
      subtitle: "Same derivation as JP but for the gear tooth profile. JG > JP because the gear tooth is more symmetric at the root.",
      body: (<>
        <LinearChart w={360} h={165} xMin={15} xMax={170} yMin={0.28} yMax={0.66}
          xLabel="Gear teeth NG" yLabel="JG"
          series={series} markX={input.Ng} markY={JG} xFmt={v=>Math.round(v)} />
        <p className="detail-note">Read exact values from <strong>AGMA 908-B89 Figure 2</strong>. Current JG = <span className="mono accent">{JG.toFixed(3)}</span>. When the gear is the weaker member, use JG instead of JP in the bending-stress equation.</p>
      </>)
    };
  }

  /* ----- I (contact geometry) ----- */
  if (k === "I") {
    const phi_n = input.pressure * DEG;
    const iOf = (mG, psi_deg) => {
      const psi = psi_deg * DEG;
      const phit = Math.atan(Math.tan(phi_n)/Math.cos(psi));
      const mN = 1/Math.cos(psi);
      return (Math.cos(phit)*Math.sin(phit)/(2*mN)) * (mG/(mG+1));
    };
    const psis = [0,15,20,30];
    const colors = ["var(--text-3)","#5a7aaa","var(--accent)","#e8b341"];
    const series = psis.map((psi,i)=>({
      label:`ψ=${psi}°`, color:colors[i], active:Math.abs(psi-input.helix)<3,
      points:Array.from({length:50},(_,j)=>{const mG=1+j*0.18;return[mG,iOf(mG,psi)];})
    }));
    const curMG = input.Ng/input.Np;
    return {
      title: "I — Contact (Pitting) Geometry Factor",
      subtitle: "Accounts for the curvature of contacting tooth flanks at the pitch point. Larger I means lower contact stress for the same load.",
      body: (<>
        <LinearChart w={360} h={165} xMin={1} xMax={10} yMin={0.05} yMax={0.25}
          xLabel="Gear ratio mG = NG/NP" yLabel="I"
          series={series} markX={curMG} markY={r.Igeo} xFmt={v=>v.toFixed(1)} />
        <div className="formula-block">
          <div className="mono sm">I = (cos φt · sin φt / 2mN) · (mG / (mG+1))</div>
          <div className="mono sm">mN = 1/cos ψ = {(1/Math.cos(input.helix*DEG)).toFixed(3)}</div>
          <div className="mono sm">φt = {r.phit.toFixed(2)}°,  mG = {curMG.toFixed(3)}</div>
          <div className="mono sm">I = <span className="accent">{r.Igeo.toFixed(4)}</span></div>
        </div>
      </>)
    };
  }

  /* ----- YN (bending S-N) ----- */
  if (k === "YN") {
    const NP_cyc = r.NP_cyc || 60*input.rpm*(input.Life||20000);
    const NG_cyc = r.NG_cyc || 60*(input.rpm/(input.Ng/input.Np))*(input.Life||20000);
    const N = 80;
    const series = [
      { label:"YN", color:"var(--accent)", active:true,
        points:Array.from({length:N+1},(_,i)=>{const x=Math.pow(10,3+i/N*6);return[x,getYN(x)];}) }
    ];
    return {
      title: "YN — Bending Stress-Cycle Factor",
      subtitle: "S-N (life) factor for bending. Values above 1.0 allow higher stress for short-life applications; flat at 1.0 for infinite life.",
      body: (<>
        <LogChart w={360} h={170} xLogMin={3} xLogMax={9} yMin={0.85} yMax={1.7}
          xLabel="Load cycles N" yLabel="YN" series={series} markX={NP_cyc} markY={r.YNP||getYN(NP_cyc)} />
        <LifeTable rpm={input.rpm} Life={input.Life||20000} />
        <div className="formula-block">
          <div className="mono sm">N ≥ 3×10⁶:  YN = 1.3558 × N⁻⁰·⁰¹⁷⁸</div>
          <div className="mono sm">N ≥ 10³:    YN = 2.3194 × N⁻⁰·⁰⁵³⁸</div>
          <div className="mono sm">Pinion:  N={NP_cyc.toExponential(2)} → YNP = <span className="accent">{(r.YNP||getYN(NP_cyc)).toFixed(3)}</span></div>
          <div className="mono sm">Gear:    N={NG_cyc.toExponential(2)} → YNG = <span className="accent">{(r.YNG||getYN(NG_cyc)).toFixed(3)}</span></div>
        </div>
      </>)
    };
  }

  /* ----- ZN (contact S-N) ----- */
  if (k === "ZN") {
    const NP_cyc = r.NP_cyc || 60*input.rpm*(input.Life||20000);
    const NG_cyc = r.NG_cyc || 60*(input.rpm/(input.Ng/input.Np))*(input.Life||20000);
    const N = 80;
    const series = [
      { label:"ZN", color:"var(--pass)", active:true,
        points:Array.from({length:N+1},(_,i)=>{const x=Math.pow(10,4+i/N*5);return[x,getZN(x)];}) }
    ];
    return {
      title: "ZN — Contact Stress-Cycle Factor",
      subtitle: "S-N factor for pitting resistance. Drops more steeply than YN — contact fatigue is more sensitive to cycle count.",
      body: (<>
        <LogChart w={360} h={170} xLogMin={4} xLogMax={9} yMin={0.85} yMax={1.5}
          xLabel="Load cycles N" yLabel="ZN" series={series} markX={NP_cyc} markY={r.ZNP||getZN(NP_cyc)} />
        <LifeTable rpm={input.rpm} Life={input.Life||20000} />
        <div className="formula-block">
          <div className="mono sm">N ≥ 10⁷:  ZN = 1.4488 × N⁻⁰·⁰²³</div>
          <div className="mono sm">N ≥ 10⁵:  ZN = 2.466  × N⁻⁰·⁰⁵⁶</div>
          <div className="mono sm">Pinion:  N={NP_cyc.toExponential(2)} → ZNP = <span className="accent">{(r.ZNP||getZN(NP_cyc)).toFixed(3)}</span></div>
          <div className="mono sm">Gear:    N={NG_cyc.toExponential(2)} → ZNG = <span className="accent">{(r.ZNG||getZN(NG_cyc)).toFixed(3)}</span></div>
        </div>
      </>)
    };
  }

  /* ----- Av (quality number) ----- */
  if (k === "Av") {
    const vtMax = Math.max(3500, r.V * 1.5);
    const kvOf = (Av, vt) => { const B=0.25*Math.pow(12-Av,2/3),A=50+56*(1-B); return Math.pow((A+Math.sqrt(vt))/A,B); };
    const avs = [5,6,7,8,9,10,11];
    const colors = ["#f06a6a","#e87c30","#e8b341","#9ab341","var(--pass)","#22d3ee","var(--accent)"];
    const N = 80;
    const series = avs.map((av,i)=>({
      label:`Av ${av}`, color:colors[i], active:av===input.Qv,
      points:Array.from({length:N+1},(_,j)=>{const vt=j/N*vtMax;return[vt,kvOf(av,vt)];})
    }));
    return {
      title: "Av — Transmission Accuracy Number (Quality)",
      subtitle: "Higher Av = tighter tooth-profile tolerances = lower pitch error = lower Kv = lower dynamic load. AGMA Qv in older standards.",
      body: (<>
        <LinearChart w={360} h={165} xMin={0} xMax={vtMax} yMin={1} yMax={2.0}
          xLabel="Pitch-line velocity vt (ft/min)" yLabel="Kᵥ (dynamic factor)"
          series={series} markX={r.V} markY={r.Kv} xFmt={v=>Math.round(v)} />
        <RefTable caption="AGMA accuracy grades by application (Shigley Table 14-7)"
          rows={["Av 3–5","Av 6–8","Av 9–11"]}
          cols={["Application / vt limit"]}
          data={[["Rough industrial, < 800 ft/min"],["Commercial enclosed, < 3000 ft/min"],["Precision / high-speed, > 3000 ft/min"]]}
          highlightRow={input.Qv<=5?0:input.Qv<=8?1:2} highlightCol={0} />
        <p className="detail-note">Current Av = <span className="mono accent">{input.Qv}</span> at vt = {Math.round(r.V)} ft/min → Kv = <span className="mono accent">{r.Kv.toFixed(3)}</span>.</p>
      </>)
    };
  }

  /* ----- J (fallback for old key) ----- */
  if (k === "J") return factorContent("JP", input, r);

  return { title: k, subtitle: "No chart available for this factor.", body: <p className="detail-note">No detail available.</p> };
}

/* ---------- FactorModal ---------- */
function FactorModal({ factor, input, r, onClose }) {
  if (!factor) return null;
  const content = factorContent(factor.k, input, r);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="factor-modal" onClick={e => e.stopPropagation()}>
        <div className="factor-modal-head">
          <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
            <span className="fmh-k mono">{factor.k}</span>
            <span className="fmh-title">{content.title}</span>
          </div>
          <button className="fmh-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <p className="fmh-sub">{content.subtitle}</p>
        <div className="factor-modal-body">{content.body}</div>
        <div className="factor-modal-foot">
          <span className="fmh-val mono">Current value: <strong>{factor.v}</strong></span>
          <span className="fmh-ref">Shigley MED 10e / AGMA 2001-D04</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FactorModal, factorContent });

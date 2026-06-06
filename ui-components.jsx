/* ============================================================
   UI primitives for the Helical Gear Design tool.
   Exported to window for cross-file React (Babel) use.
   ============================================================ */

/* Small inline "?" info chip with hover popover ("Explain this value") */
function Info({ text }) {
  if (!text) return null;
  return (
    <span className="info" tabIndex={0}>
      <span className="info-dot">i</span>
      <span className="info-pop">{text}</span>
    </span>
  );
}

/* Segmented control (Auto/Manual, Imperial/Metric, etc.) */
function Segmented({ value, options, onChange, size }) {
  return (
    <div className={"seg" + (size === "sm" ? " seg-sm" : "")}>
      {options.map((o) => (
        <button
          key={o.value}
          className={"seg-btn" + (value === o.value ? " on" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* On/off switch with label + helper text */
function Toggle({ label, hint, value, onChange, onLabel, offLabel }) {
  return (
    <div className="toggle-row">
      <div className="toggle-text">
        <span className="toggle-label">{label}</span>
        {hint ? <span className="toggle-hint">{hint}</span> : null}
      </div>
      <button
        className={"switch" + (value ? " switch-on" : "")}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        title={value ? (onLabel || "On") : (offLabel || "Off")}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

/* Collapsible input group — with optional eye toggle for auto/manual */
function Section({ id, title, letter, open, onToggle, children, badge, eye, onEye }) {
  const EyeIcon = ({ open: eyeOpen }) => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {eyeOpen
        ? <><path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" /><circle cx="8" cy="8" r="2" /></>
        : <><path d="M2 2L14 14M6.5 6.7C6.2 7 6 7.5 6 8C6 9.1 6.9 10 8 10C8.5 10 9 9.8 9.3 9.5M4.2 4.4C2.9 5.4 1.9 6.8 1 8C1 8 3.5 13 8 13C9.5 13 10.8 12.4 11.8 11.6M7 3.1C7.3 3 7.7 3 8 3C12.5 3 15 8 15 8C14.7 8.7 14.2 9.4 13.6 10" /></>
      }
    </svg>
  );
  return (
    <div className={"section" + (open ? " open" : "")}>
      <button className="section-head" onClick={() => onToggle(id)}>
        <span className="section-letter">{letter}</span>
        <span className="section-title">{title}</span>
        {badge ? <span className="section-badge">{badge}</span> : null}
        {eye !== undefined ? (
          <span
            className={"section-eye" + (eye ? " eye-on" : " eye-off")}
            title={eye ? "Manual mode — click to auto-compute" : "Auto mode — click to set manually"}
            onClick={(e) => { e.stopPropagation(); onEye(!eye); }}
            role="button"
            aria-label={eye ? "Switch to auto" : "Switch to manual"}
          >
            <EyeIcon open={eye} />
            <span className="eye-label">{eye ? "MANUAL" : "AUTO"}</span>
          </span>
        ) : null}
        <span className="section-chev">{open ? "\u2212" : "+"}</span>
      </button>
      {open ? <div className="section-body">{children}</div> : null}
    </div>
  );
}

/* Slider + numeric box + unit, the core engineering input */
function SliderInput({
  label, value, onChange, min, max, step, unit, decimals = 0,
  tooltip, disabled, locked,
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const fmt = (v) => (decimals ? (+v).toFixed(decimals) : Math.round(v).toString());
  const [text, setText] = React.useState(fmt(value));
  React.useEffect(() => { setText(fmt(value)); }, [value, decimals]);

  const commit = (raw) => {
    let n = parseFloat(raw);
    if (isNaN(n)) { setText(fmt(value)); return; }
    n = Math.max(min, Math.min(max, n));
    onChange(n);
  };

  return (
    <div className={"field" + (disabled ? " field-dis" : "")}>
      <div className="field-head">
        <label className="field-label">
          {label}
          {tooltip ? <Info text={tooltip} /> : null}
          {locked ? <span className="field-lock" title="Auto-set in Auto mode">AUTO</span> : null}
        </label>
        <div className="field-input">
          <input
            className="num"
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
          />
          {unit ? <span className="unit">{unit}</span> : null}
        </div>
      </div>
      <input
        type="range"
        className="slider"
        min={min} max={max} step={step} value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ "--pct": pct + "%" }}
      />
    </div>
  );
}

/* Read-only derived value shown in the sidebar (torque, ratio…) */
function DerivedRow({ label, value, unit, tooltip }) {
  return (
    <div className="derived">
      <span className="derived-label">{label}{tooltip ? <Info text={tooltip} /> : null}</span>
      <span className="derived-val mono">{value}<span className="derived-unit">{unit}</span></span>
    </div>
  );
}

/* Dropdown */
function Select({ label, value, options, onChange, tooltip }) {
  return (
    <div className="field">
      <div className="field-head">
        <label className="field-label">{label}{tooltip ? <Info text={tooltip} /> : null}</label>
      </div>
      <div className="select-wrap">
        <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="select-chev">{"\u25BE"}</span>
      </div>
    </div>
  );
}

/* KPI card for the Overview tab */
function KpiCard({ label, value, unit, sub, accent, tooltip }) {
  return (
    <div className={"kpi" + (accent ? " kpi-accent" : "")}>
      <div className="kpi-label">{label}{tooltip ? <Info text={tooltip} /> : null}</div>
      <div className="kpi-value mono">
        {value}{unit ? <span className="kpi-unit">{unit}</span> : null}
      </div>
      {sub ? <div className="kpi-sub mono">{sub}</div> : null}
    </div>
  );
}

/* Status dot + label */
function Status({ level, children }) {
  return (
    <span className={"status status-" + level}>
      <span className="status-dot" />
      {children}
    </span>
  );
}

/* Linear stress bar meter — actual stress vs allowable, with SF + threshold */
function BarMeter({ title, actual, allowable, unit, sf, target, fmt }) {
  const f = fmt || ((v) => Math.round(v).toLocaleString());
  const ratio = Math.min(1.35, actual / allowable);
  const pct = Math.min(100, (actual / allowable) * 100);
  const targetPct = Math.min(100, (1 / target) * 100); // allowable/target marks usable limit
  const level = sf >= target ? "pass" : sf >= target * 0.8 ? "warn" : "fail";
  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-title">{title}</span>
        <span className={"meter-sf sf-" + level}>SF {sf.toFixed(2)}</span>
      </div>
      <div className="meter-track">
        <div className={"meter-fill fill-" + level} style={{ width: pct + "%" }} />
        <div className="meter-limit" style={{ left: targetPct + "%" }} title={`Design limit (SF = ${target})`} />
      </div>
      <div className="meter-foot mono">
        <span>{f(actual)} {unit}</span>
        <span className="meter-allow">allow {f(allowable)} {unit}</span>
      </div>
    </div>
  );
}

/* Radial-ish thin gauge for efficiency / overlap */
function MiniStat({ label, value, unit, level }) {
  return (
    <div className="ministat">
      <div className={"ministat-val mono" + (level ? " ms-" + level : "")}>{value}<span className="ministat-unit">{unit}</span></div>
      <div className="ministat-label">{label}</div>
    </div>
  );
}

Object.assign(window, {
  Info, Segmented, Toggle, Section, SliderInput, DerivedRow, Select,
  KpiCard, Status, BarMeter, MiniStat,
});

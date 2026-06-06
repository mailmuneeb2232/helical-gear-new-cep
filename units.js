/* ============================================================
   Unit conversion + formatting helpers.  Engine works in US
   customary; these convert for display when units === 'metric'.
   ============================================================ */
(function () {
  "use strict";
  const M = (sys) => sys === "metric";

  function num(v, d = 0) {
    if (!isFinite(v)) return "\u2014";
    return (+v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  const Units = {
    isMetric: M,
    num,
    // results (display only)
    len: (inch, sys, d = 3) => M(sys) ? { v: num(inch * 25.4, d <= 2 ? 1 : 2), u: "mm" } : { v: num(inch, d), u: "in" },
    force: (lbf, sys) => M(sys) ? { v: num(lbf * 4.4482, 0), u: "N" } : { v: num(lbf, 0), u: "lbf" },
    torque: (lbin, sys) => M(sys) ? { v: num(lbin * 0.112985, 1), u: "N\u00B7m" } : { v: num(lbin, 1), u: "lb\u00B7in" },
    stress: (psi, sys) => M(sys) ? { v: num(psi * 0.00689476, 1), u: "MPa" } : { v: num(psi / 1000, 1), u: "ksi" },
    vel: (fpm, sys) => M(sys) ? { v: num(fpm * 0.00508, 2), u: "m/s" } : { v: num(fpm, 0), u: "ft/min" },
    power: (hp, sys) => M(sys) ? { v: num(hp * 0.7457, 1), u: "kW" } : { v: num(hp, 1), u: "hp" },
    // input slider config for unit-bearing fields
    powerSlider: (sys) => M(sys)
      ? { unit: "kW", min: 0.75, max: 150, step: 0.5, decimals: 1, to: (hp) => hp * 0.7457, from: (kw) => kw / 0.7457 }
      : { unit: "hp", min: 1, max: 200, step: 1, decimals: 0, to: (hp) => hp, from: (hp) => hp },
    faceSlider: (sys) => M(sys)
      ? { unit: "mm", min: 6, max: 150, step: 1, decimals: 0, to: (i) => i * 25.4, from: (mm) => mm / 25.4 }
      : { unit: "in", min: 0.25, max: 6, step: 0.05, decimals: 2, to: (i) => i, from: (i) => i },
    // pitch: imperial diametral pitch Pn ; metric module m = 25.4 / Pn
    pitchSlider: (sys) => M(sys)
      ? { unit: "mm mod", min: 1, max: 8, step: 0.25, decimals: 2, label: "Module m", to: (Pn) => 25.4 / Pn, from: (m) => 25.4 / m }
      : { unit: "1/in", min: 4, max: 24, step: 1, decimals: 0, label: "Diametral pitch P\u2099", to: (Pn) => Pn, from: (Pn) => Pn },
  };

  window.Units = Units;
})();

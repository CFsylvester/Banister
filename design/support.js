// support.js — minimal stand-in runtime for the .dc.html design export, written because the original
// support.js was not supplied. It renders the design's OWN template + logic class (no Banister build code),
// so it can serve as the independent TARGET for the pixel-diff gate. [assumption] The template semantics
// below are inferred from the file itself — {{ path }} bindings, <sc-if value>, <sc-for list as>,
// style-hover, <helmet>, a `class Component extends DCLogic` with renderVals() — not from a spec.
// Props: data-props defaults, overridable by query string, e.g. ?startPage=services&quoteAnimation=fade.
(function () {
  const REACT = "https://esm.sh/react@19.2.8", DOM = "https://esm.sh/react-dom@19.2.8/client";
  const ATTR = { onclick: "onClick", onsubmit: "onSubmit", onchange: "onChange", onmouseenter: "onMouseEnter",
    onmouseleave: "onMouseLeave", novalidate: "noValidate", readonly: "readOnly", maxlength: "maxLength", tabindex: "tabIndex" };
  const BOOL = new Set(["required", "disabled", "checked", "multiple", "noValidate", "readOnly"]);
  const hoverRules = new Map();

  const lookup = (scope, expr) => {
    expr = expr.trim();
    if (expr === "true") return true; if (expr === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    return expr.split(".").reduce((v, k) => (v == null ? v : v[k]), scope);
  };
  const ONLY = /^\s*\{\{([^}]+)\}\}\s*$/;
  const interp = (scope, s) => s.replace(/\{\{([^}]+)\}\}/g, (_, e) => { const v = lookup(scope, e); return v == null ? "" : String(v); });
  const camel = (p) => p.startsWith("--") ? p : p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const styleObj = (css) => {
    const o = {};
    for (const decl of css.split(";")) { const i = decl.indexOf(":"); if (i < 0) continue;
      const k = decl.slice(0, i).trim(); const v = decl.slice(i + 1).trim(); if (k && v) o[camel(k)] = v; }
    return o;
  };
  const hoverClass = (css) => {
    if (!hoverRules.has(css)) {
      const cls = `dch${hoverRules.size}`; hoverRules.set(css, cls);
      const body = css.split(";").filter((d) => d.includes(":")).map((d) => d.trim() + " !important").join(";");
      document.getElementById("dc-hover").append(`.${cls}:hover{${body}}`);
    }
    return hoverRules.get(css);
  };

  function build(React, node, scope, key) {
    const h = React.createElement;
    if (node.nodeType === 3) {
      const t = node.nodeValue; if (!t.includes("{{")) return t;
      const out = []; let last = 0; const re = /\{\{([^}]+)\}\}/g; let m;
      while ((m = re.exec(t))) { if (m.index > last) out.push(t.slice(last, m.index)); const v = lookup(scope, m[1]);
        if (v != null && v !== false) out.push(typeof v === "object" ? v : String(v)); last = re.lastIndex; }
      if (last < t.length) out.push(t.slice(last));
      return h(React.Fragment, { key }, ...out);
    }
    if (node.nodeType !== 1) return null;
    const tag = node.localName;
    const kids = (sc) => [...node.childNodes].map((c, i) => build(React, c, sc, i)).filter((x) => x !== null);
    if (tag === "sc-if") { const on = lookup(scope, node.getAttribute("value").replace(/^\{\{|\}\}$/g, ""));
      return on ? h(React.Fragment, { key }, ...kids(scope)) : null; }
    if (tag === "sc-for") {
      const list = lookup(scope, node.getAttribute("list").replace(/^\{\{|\}\}$/g, "")) || [];
      const as = node.getAttribute("as");
      return h(React.Fragment, { key }, ...list.map((item, i) => h(React.Fragment, { key: i }, ...kids({ ...scope, [as]: item }))));
    }
    const props = { key }; let hover = null;
    for (const { name, value } of node.attributes) {
      if (name.startsWith("hint-")) continue;
      if (name === "style-hover") { hover = value; continue; }
      const prop = ATTR[name] || name;
      const only = value.match(ONLY);
      if (prop === "style") { props.style = styleObj(interp(scope, value)); continue; }
      if (only) { const v = lookup(scope, only[1]); if (prop === "ref") props.ref = v; else if (v !== undefined) props[prop] = v; continue; }
      props[prop] = BOOL.has(prop) ? true : interp(scope, value);
    }
    if (hover) props.className = hoverClass(hover);
    if (tag === "input" && "value" in props && !props.onChange) props.readOnly = true;
    const c = kids(scope);
    return h(tag, props, ...(c.length ? c : []));
  }

  async function boot() {
    const [React, { createRoot }] = await Promise.all([import(REACT), import(DOM)]);
    window.React = React;
    const style = document.createElement("style"); style.id = "dc-hover"; document.head.append(style);
    const host = document.querySelector("x-dc");
    const helmet = host.querySelector("helmet");
    if (helmet) [...helmet.childNodes].forEach((n) => document.head.append(n));
    const script = document.querySelector("script[data-dc-script]");
    const defs = JSON.parse(script.dataset.props || "{}"), props = {};
    for (const [k, d] of Object.entries(defs)) props[k] = d.default;
    for (const [k, v] of new URLSearchParams(location.search)) props[k] = v === "true" ? true : v === "false" ? false : v;
    class DCLogic extends React.Component { render() { return h(this.renderVals()); } }
    // Template root: the single element child of <x-dc> after <helmet> is removed.
    const root = [...host.children].find((n) => n.localName !== "helmet");
    const h = (vals) => build(React, root, vals, 0);
    const Component = new Function("React", "DCLogic", script.textContent + "\nreturn Component;")(React, DCLogic);
    const mount = document.createElement("div"); host.replaceWith(mount);
    createRoot(mount).render(React.createElement(Component, props));
  }
  const start = () => boot().catch((e) => { document.body.textContent = "support.js shim failed: " + e.message; console.error(e); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

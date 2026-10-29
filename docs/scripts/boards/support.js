// Minimal stand-in for the Claude Design canvas runtime, enough to render a
// .dc.html board as a static screen: `class Component extends DCLogic` with
// `renderVals()`, `{{ expr }}` in text and attributes, <sc-for list as>,
// <sc-if value>, onClick. The URL hash may carry JSON merged into the state,
// e.g. Board.dc.html#{"tab":"requests"}, to show another state of the board.
(function () {
  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(patch) {
      Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch);
      render();
    }
  }
  window.DCLogic = DCLogic;

  const WHOLE = /^\s*\{\{\s*([\s\S]+?)\s*\}\}\s*$/;
  const PART = /\{\{\s*([\s\S]+?)\s*\}\}/g;
  const evaluate = (expr, scope) => {
    try {
      return Function('scope', 'with (scope) { return (' + expr + '); }')(scope);
    } catch (e) {
      console.warn('[board] cannot evaluate {{ ' + expr + ' }}: ' + e.message);
      return undefined;
    }
  };
  const interpolate = (text, scope) => {
    const whole = text.match(WHOLE);
    if (whole) return evaluate(whole[1], scope);
    return text.replace(PART, (_, expr) => {
      const v = evaluate(expr, scope);
      return v == null ? '' : String(v);
    });
  };

  let component;
  let template = [];
  let host;

  const build = (node, scope) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const v = interpolate(node.textContent, scope);
      return [document.createTextNode(v == null ? '' : String(v))];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const tag = node.localName;
    const children = (s) => Array.from(node.childNodes).flatMap((c) => build(c, s));

    if (tag === 'sc-for') {
      const list = interpolate(node.getAttribute('list') || '', scope) || [];
      const as = node.getAttribute('as') || 'item';
      return Array.from(list).flatMap((item, index) => {
        const inner = Object.create(scope);
        inner[as] = item;
        inner.$index = index;
        return children(inner);
      });
    }
    if (tag === 'sc-if') {
      return interpolate(node.getAttribute('value') || '', scope) ? children(scope) : [];
    }

    // localName keeps the case the parser gave (div, linearGradient); tagName is upper-case for HTML.
    const el = document.createElementNS(node.namespaceURI, node.localName);
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith('hint-')) continue;
      if (attr.name.toLowerCase() === 'onclick') {
        const expr = attr.value;
        el.addEventListener('click', (event) => {
          const v = interpolate(expr, scope);
          if (typeof v === 'function') v(event);
        });
        continue;
      }
      const v = interpolate(attr.value, scope);
      if (v === false || v == null) continue;
      el.setAttribute(attr.name, v === true ? '' : String(v));
    }
    for (const c of children(scope)) el.appendChild(c);
    return [el];
  };

  function render() {
    const vals = component.renderVals ? component.renderVals() : {};
    const scope = Object.assign(Object.create(null), vals);
    host.replaceChildren(...template.flatMap((n) => build(n, scope)));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('x-dc');
    if (!root) return;
    const helmet = root.querySelector('helmet');
    if (helmet) for (const c of Array.from(helmet.childNodes)) document.head.appendChild(c);
    // The board script may sit inside <x-dc> or after it.
    const script = document.querySelector('script[type="text/x-dc"]');
    template = Array.from(root.childNodes).filter((n) => n !== helmet && n !== script);

    let props = {};
    try {
      props = JSON.parse(script?.dataset.props || '{}');
    } catch (e) {}
    const Component = script ? Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic) : DCLogic;
    component = new Component(props);
    try {
      const override = location.hash.length > 1 ? JSON.parse(decodeURIComponent(location.hash.slice(1))) : null;
      if (override) Object.assign(component.state, override);
    } catch (e) {}

    // Boards shorter than the phone screen continue in the app's page color.
    document.documentElement.style.background = '#0B0E14';
    document.body.style.margin = '0';
    host = document.createElement('div');
    root.replaceWith(host);
    render();
  });
})();

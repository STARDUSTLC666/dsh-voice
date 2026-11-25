// Generated: shared optional update controls; edit the original client templates.
(function(){
/* DSH workbench UI v1. MIT. Canonical source: dsh-suite/ui/workbench-ui.js.
 * Vendored into each plugin: no Suite or extra runtime dependency is required.
 * Styles are scoped to .dshw and never replace the host chrome or theme.
 */
function createWorkbenchUI(React) {
  const h = React.createElement;
  const { useEffect, useId, useRef } = React;
  const cx = (...values) => values.filter(Boolean).join(' ');
  const paths = {
    book: ['M4 4h6a3 3 0 0 1 2 2v15a4 4 0 0 0-4-2H4z', 'M20 4h-6a3 3 0 0 0-2 2v15a4 4 0 0 1 4-2h4z'],
    calendar: ['M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z', 'M7 3v4M17 3v4M3 10h18'],
    mail: ['M3 5h18v14H3z', 'm3 6 9 7 9-7'],
    rss: ['M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16', 'M4 19h.01'],
    slides: ['M3 4h18v13H3z', 'M12 17v4M8 21h8'],
    shield: ['m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6z', 'm8 12 3 3 5-6'],
    layers: ['M5 3h16v16H5z', 'M2 7v15h15'],
    play: ['m9 6 9 6-9 6Z'],
    video: ['M3 5h12v14H3z', 'm15 10 6-4v12l-6-4'],
    search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm16 16 5 5'],
    plus: ['M12 5v14M5 12h14'],
    refresh: ['M20 7a9 9 0 1 0 1 8', 'M20 2v5h-5'],
    settings: ['m9 3-.7 2.4-2 .9L4 5.8 2.5 8.4l1.7 1.8v2.3L2.5 14 4 17l2.5-.4 1.9 1L9 20h3l.8-2.4 2-1 2.5.4 1.5-2.7-1.7-1.9v-2.2l1.7-1.8-1.5-2.6-2.5.4-2-1L12 3Z', 'M14 11.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'],
    close: ['m6 6 12 12M18 6 6 18'],
    left: ['m14 5-7 7 7 7'],
    right: ['m10 5 7 7-7 7'],
    down: ['m5 9 7 7 7-7'],
    filter: ['M4 5h16M7 12h10M10 19h4'],
    download: ['M12 3v12m-5-5 5 5 5-5', 'M4 16v5h16v-5'],
    upload: ['M12 16V4m-5 5 5-5 5 5', 'M4 16v5h16v-5'],
    copy: ['M8 8h13v13H8z', 'M16 8V3H3v13h5'],
    external: ['M14 3h7v7m0-7L10 14', 'M10 3H3v18h18v-7'],
    file: ['M4 3h10l6 6v12H4z', 'M14 3v6h6M8 13h8M8 17h6'],
    folder: ['M3 5h7l2 3h9v12H3z'],
    edit: ['m15 4 5 5-10 10-6 1 1-6Z', 'm13 6 5 5'],
    trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],
    more: ['M5 12h.01M12 12h.01M19 12h.01'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6M12 7h.01'],
    check: ['m5 12 4 4L19 6'],
    quote: ['M4 12h6v7H3v-7c0-4 2-6 5-7M15 12h6v7h-7v-7c0-4 2-6 5-7'],
    star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z'],
    reply: ['m9 5-7 7 7 7v-5h6c3 0 5 2 6 5 0-8-4-11-12-11Z'],
    link: ['m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0', 'm14 8 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0'],
  };
  function Icon({ name = 'file', size = 20, ...props }) {
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props },
      (paths[name] || paths.file).map((d, index) => h('path', { key: index, d })));
  }
  function Button({ children, icon, variant, className, ...props }) {
    return h('button', { type: 'button', ...props, className: cx('w-button', variant && 'w-' + variant, className) }, icon ? h(Icon, { name: icon, size: 18 }) : null, children);
  }
  function IconButton({ label, icon, ...props }) {
    return h(Button, { ...props, icon, className: cx('w-icon-button', props.className), 'aria-label': label, title: label });
  }
  function Page({ title, subtitle, actions, children, workbench = false, className, rootRef, ...props }) {
    return h('section', { ...props, ref: rootRef, className: cx('dshw', 'w-page', className), 'data-main': workbench ? 'true' : 'false' },
      h(Styles, { key: 'styles' }),
      h('header', { className: 'w-page-header' }, h('div', { className: 'w-heading' }, h('h1', null, title), subtitle ? h('p', { className: 'w-subtitle' }, subtitle) : null), actions ? h('div', { className: 'w-header-actions' }, actions) : null),
      h('div', { className: 'w-body' }, children));
  }
  function Tabs({ items, value, onChange, label, children }) {
    const id = useId();
    const active = items.some(item => item.id === value) ? value : items[0]?.id;
    function keys(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
      const node = event.currentTarget.parentElement?.querySelectorAll('[role=tab]')[next];
      if (node) { onChange(items[next].id); node.focus(); }
    }
    return h('div', { className: 'w-tabs-layout' },
      h('div', { className: 'w-tabs', role: 'tablist', 'aria-label': label }, items.map((item, index) => h('button', {
        type: 'button', role: 'tab', key: item.id, id: id + '-' + item.id, 'aria-controls': id + '-panel', 'aria-selected': active === item.id, tabIndex: active === item.id ? 0 : -1,
        onClick: () => onChange(item.id), onKeyDown: event => keys(event, index),
      }, item.label, item.count !== undefined ? h('span', { className: 'w-count' }, item.count) : null))),
      h('div', { className: 'w-tab-panel', id: id + '-panel', role: 'tabpanel', 'aria-labelledby': id + '-' + active }, children));
  }
  function Status({ children, tone = 'info', className }) {
    if (!children) return null;
    return h('div', { className: cx('dshw', 'w-status', 'w-status-' + tone, className), role: tone === 'error' ? 'alert' : 'status', 'aria-live': tone === 'error' ? 'assertive' : 'polite' }, h(Icon, { name: tone === 'success' ? 'check' : 'info', size: 18 }), h('div', null, children));
  }
  function Empty({ title, children, action, icon = 'file' }) {
    return h('div', { className: 'dshw w-empty' }, h(Styles, { key: 'styles' }), h(Icon, { name: icon, size: 32 }), h('h2', null, title), children ? h('div', { className: 'w-muted' }, children) : null, action ? h('div', { className: 'w-toolbar' }, action) : null);
  }
  function Split({ list, detail, selected, onBack, backLabel, className, listWidth = 360 }) {
    const ref = useRef(null);
    useEffect(() => {
      if (!selected || !ref.current || ref.current.clientWidth > 760) return;
      const heading = ref.current.querySelector('.w-detail h2');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }, [selected]);
    return h('div', { ref, className: cx('w-split', className), 'data-selected': selected ? 'true' : 'false', style: { '--w-list-width': listWidth + 'px' } },
      h('div', { className: 'w-master' }, list),
      h('div', { className: 'w-detail' }, selected ? h(Button, { className: 'w-back', icon: 'left', variant: 'ghost', onClick: onBack }, backLabel) : null, detail));
  }
  function Row({ title, meta, description, active, onClick, children, status, className, disabled }) {
    return h('div', { className: cx('w-row', active && 'w-selected', className) },
      children ? h('div', { className: 'w-row-select' }, children) : null,
      h('button', { type: 'button', className: 'w-row-button', onClick, disabled, 'aria-pressed': !!active },
        h('span', { className: 'w-row-head' }, h('strong', null, title), status ? h('span', { className: 'w-tag' }, status) : null),
        meta ? h('span', { className: 'w-row-meta' }, meta) : null,
        description ? h('span', { className: 'w-row-description' }, description) : null));
  }
  function Search({ label, value, onChange, ...props }) {
    const id = useId();
    return h('div', { className: 'w-search' }, h(Icon, { name: 'search', size: 18 }), h('input', { type: 'search', id, 'aria-label': label, placeholder: label, value, onChange, ...props }));
  }
  function Switch({ label, checked, onChange, disabled }) {
    return h('label', { className: 'w-switch-label' }, h('span', null, label), h('input', { type: 'checkbox', role: 'switch', checked, disabled, onChange, 'aria-label': label }), h('span', { className: 'w-switch-track', 'aria-hidden': true }));
  }
  function Dialog({ title, children, onClose, closeLabel, className, busy = false }) {
    const id = useId(), panel = useRef(null);
    useEffect(() => {
      const previous = document.activeElement;
      panel.current?.querySelector('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')?.focus();
      return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
    }, []);
    function keydown(event) {
      if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); if (!busy) onClose(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (!controls.length) { event.preventDefault(); panel.current.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    return h('div', { className: 'dshw w-overlay', onClick: event => { if (!busy && event.target === event.currentTarget) onClose(); } },
      h(Styles, { key: 'styles' }),
      h('section', { ref: panel, className: cx('w-dialog', className), role: 'dialog', 'aria-modal': true, 'aria-labelledby': id, tabIndex: -1, onKeyDown: keydown },
        h('header', { className: 'w-dialog-header' }, h('h2', { id }, title), h(IconButton, { icon: 'close', label: closeLabel, disabled: busy, onClick: onClose })), h('div', { className: 'w-dialog-body' }, children)));
  }
  function register(ctx, { id, label, icon, component, inject, order = 50 }) {
    // The two slots are optional. Existing settings and manual tools still load
    // in hosts without a workbench, while RC.3 owns navigation/pinning itself.
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: id, inject: () => ({ ...(inject?.() || {}), workbench: true }) }, component));
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id, order, label }, function WorkbenchIcon({ size }) { return h(Icon, { name: icon, size }); }));
  }
  const styles = `
.dshw{--w-bg:var(--dsw-alias-bg-layer-1,#fff);--w-soft:var(--dsw-alias-bg-layer-2,#f7f8fa);--w-text:var(--dsw-alias-label-primary,#18202c);--w-muted:var(--dsw-alias-label-secondary,#667085);--w-border:var(--dsw-alias-border-l3,#e7e9ef);--w-accent:var(--dsh-plugin-workbench-accent,#4f6bdb);--w-selected:color-mix(in srgb,var(--w-accent) 10%,var(--w-bg));--w-primary:var(--w-text);--w-on-primary:var(--w-bg);container-type:inline-size;container-name:dsh-workbench;color:var(--w-text);font:14px/1.65 var(--dsh-font-family-content,system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif);min-width:0;max-width:100%;box-sizing:border-box;text-align:start;color-scheme:inherit}
.dshw *,.dshw *:before,.dshw *:after{box-sizing:border-box}.dshw h1,.dshw h2,.dshw h3,.dshw h4,.dshw p{margin:0}.dshw h1{font-size:30px;line-height:1.25;letter-spacing:-.025em;font-weight:650}.dshw h2{font-size:24px;line-height:1.35;font-weight:650;letter-spacing:-.015em;overflow-wrap:anywhere}.dshw h3,.dshw h4{font-size:16px;line-height:1.4;font-weight:600}.dshw a{color:var(--w-accent);text-underline-offset:3px;overflow-wrap:anywhere}.dshw button,.dshw input,.dshw select,.dshw textarea{font:inherit;color:inherit;max-width:100%}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select,.dshw textarea{background:var(--dsw-specific-input-major,var(--w-bg));border:1px solid var(--w-border);border-radius:8px;padding:8px 11px;min-width:0;line-height:1.5}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select{min-height:38px}.dshw textarea{resize:vertical}.dshw input[type=checkbox],.dshw input[type=radio]{width:16px;height:16px;flex-shrink:0;accent-color:var(--w-accent)}.dshw :focus-visible{outline:2px solid var(--w-accent);outline-offset:3px}.dshw button:disabled,.dshw input:disabled,.dshw select:disabled,.dshw textarea:disabled{opacity:.5;cursor:not-allowed}.dshw label{font-size:13px}.dshw fieldset{min-width:0;border:1px solid var(--w-border);border-radius:8px}.dshw summary{cursor:pointer;font-weight:550;list-style:none;display:flex;align-items:center;gap:8px}.dshw summary::-webkit-details-marker{display:none}.dshw summary:after{content:'';display:block;margin-inline-start:auto;width:7px;height:7px;border-inline-end:1.75px solid currentColor;border-bottom:1.75px solid currentColor;transform:rotate(45deg);flex-shrink:0}.dshw details[open]>summary:after{transform:rotate(225deg)}.dshw details>summary+*{margin-top:12px}.dshw pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;max-width:100%;background:var(--w-soft);border-radius:6px;padding:14px}.dshw img,.dshw video,.dshw iframe{max-width:100%}
.w-page{display:flex;flex-direction:column;position:relative;padding:0;min-height:540px;gap:0}.w-page[data-main=true]{height:100%;min-height:0;padding:calc(24px + var(--dsh-frame-top-clearance,0px)) 28px 0 max(28px,var(--dsh-frame-leading-clearance,0px));overflow:auto}.dshw[data-main=true]{background:var(--w-bg)}.dshw.w-page,.dshw .w-body,.dshw .w-tab-panel{overflow-x:clip}.w-page-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:22px;flex-shrink:0}.w-heading{min-width:0}.w-subtitle{margin-top:8px!important;font-size:14px;color:var(--w-muted);line-height:1.6}.w-header-actions,.w-toolbar,.w-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0}.w-header-actions{justify-content:flex-end}.w-body,.w-tabs-layout{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0}.w-body{overflow:auto}.w-tab-panel{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:auto}.w-tabs{display:flex;align-items:stretch;gap:20px;border-bottom:1px solid var(--w-border);flex-shrink:0;overflow-x:auto;scrollbar-width:thin}.dshw .w-tabs>button{border:0;border-bottom:2px solid transparent;background:transparent;padding:11px 8px 13px;white-space:nowrap;font-size:14px;font-weight:550;cursor:pointer;color:var(--w-muted);display:flex;align-items:center;gap:7px}.dshw .w-tabs>button[aria-selected=true]{border-bottom-color:var(--w-accent);color:var(--w-accent)}.w-count,.w-tag{font-size:12px;line-height:1.5;display:inline-flex;align-items:center;flex-shrink:0;background:var(--w-soft);border-radius:5px;padding:1px 6px;color:var(--w-muted)}.w-tabs [aria-selected=true] .w-count,.w-selected .w-tag{color:var(--w-accent);background:var(--w-selected)}
.dshw .w-button{display:inline-flex;justify-content:center;align-items:center;gap:7px;background:var(--w-bg);border:1px solid var(--w-border);border-radius:8px;padding:8px 12px;min-height:36px;line-height:1.4;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;white-space:normal}.dshw .w-button:not(:disabled):hover{background:var(--w-soft)}.dshw .w-primary{background:var(--w-primary);border-color:var(--w-primary);color:var(--w-on-primary)}.dshw .w-primary:not(:disabled):hover{background:var(--w-primary);opacity:.9}.dshw .w-ghost{background:transparent;border-color:transparent}.dshw .w-danger{color:var(--dsw-alias-state-error-primary,#b43c3c)}.dshw .w-icon-button{width:36px;min-width:36px;padding:8px}.dshw .w-button svg{flex-shrink:0}.w-muted{color:var(--w-muted);font-size:12px;line-height:1.6}.w-section{padding:24px 0;border-bottom:1px solid var(--w-border);min-width:0}.w-section>h3{margin-bottom:12px}.w-section>p+p{margin-top:8px}.w-fields{display:grid;gap:16px;min-width:0}.w-field{display:grid;gap:6px;min-width:0}.w-field>input,.w-field>select,.w-field>textarea{width:100%}.w-status{display:flex;align-items:flex-start;gap:8px;padding:11px 13px;margin:12px 0;border:1px solid var(--w-border);border-radius:8px;background:var(--w-soft);font-size:13px;overflow-wrap:anywhere;flex-shrink:0}.w-status>svg{flex-shrink:0;margin-top:2px}.w-status-error{color:var(--dsw-alias-state-error-primary,#ad3636)}.w-status-success{color:var(--dsw-alias-state-success-primary,#24794a)}.w-status-warn{color:var(--dsw-alias-state-warning-primary,#8a5a00)}.w-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;width:100%;max-width:580px;padding:48px 24px;margin:auto;min-height:280px;overflow-wrap:anywhere}.w-empty>svg{color:var(--w-muted)}.w-empty h2{font-size:20px}.w-empty .w-muted{font-size:14px}.w-empty .w-toolbar{justify-content:center}
.w-split{display:grid;grid-template-columns:minmax(240px,var(--w-list-width)) minmax(0,1fr);min-height:460px;flex:1;min-width:0}.w-master{min-width:0;border-inline-end:1px solid var(--w-border);overflow:auto;padding-bottom:24px}.w-detail{min-width:0;padding:26px 28px;overflow:auto;overflow-wrap:anywhere;display:flex;flex-direction:column}.w-master-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:20px 16px}.w-search{display:flex;align-items:center;gap:8px;border:1px solid var(--w-border);border-radius:8px;padding:0 10px;min-width:0;flex:1;background:var(--w-bg)}.w-search>svg{color:var(--w-muted);flex-shrink:0}.dshw .w-search>input{border:0!important;background:transparent!important;padding:8px 0!important;width:100%;outline-offset:0}.w-row{display:flex;gap:0;min-width:0;position:relative;border-bottom:1px solid var(--w-border);border-inline-start:3px solid transparent}.w-row-select{display:flex;align-items:flex-start;padding:21px 0 0 14px}.dshw .w-row-button{display:flex;flex-direction:column;align-items:stretch;gap:7px;text-align:start;width:100%;padding:18px 18px 18px 16px;border:0;background:transparent;color:inherit;min-width:0;cursor:pointer;line-height:1.5}.dshw .w-row-button:hover{background:var(--w-soft)}.w-row-head{display:flex;align-items:flex-start;gap:10px;justify-content:space-between;min-width:0}.w-row-head>strong{font-size:14px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}.w-row-meta,.w-row-description{color:var(--w-muted);font-size:12px;line-height:1.6;overflow-wrap:anywhere}.w-row-description{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.w-selected{background:var(--w-selected);border-inline-start-color:var(--w-accent)}.w-back{display:none!important}.w-detail-title{margin-bottom:12px!important}.w-detail-meta{color:var(--w-muted);font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.w-detail-footer{padding:24px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;border-top:1px solid var(--w-border)}.w-detail-footer .w-muted{flex:1;min-width:160px}.w-definition{display:grid;grid-template-columns:minmax(80px,120px) minmax(0,1fr);gap:8px 16px;font-size:14px;margin:20px 0}.w-definition dt{color:var(--w-muted)}.w-definition dd{margin:0;min-width:0;overflow-wrap:anywhere}
.w-switch-label{display:inline-flex;align-items:center;gap:8px;font-size:13px;position:relative;cursor:pointer}.w-switch-label>input{position:absolute;opacity:0;inset-inline-end:0;width:36px!important;height:22px!important;margin:0;cursor:pointer}.w-switch-track{width:36px;height:22px;border-radius:12px;display:block;background:var(--w-border);border:1px solid var(--w-border);pointer-events:none;padding:2px;transition:background .15s}.w-switch-track:before{content:'';display:block;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0002;transition:transform .15s}.w-switch-label>input:checked+.w-switch-track{background:var(--w-accent);border-color:var(--w-accent)}.w-switch-label>input:checked+.w-switch-track:before{transform:translateX(14px)}.w-switch-label>input:focus-visible+.w-switch-track{outline:2px solid var(--w-accent);outline-offset:3px}.w-switch-label:has(>input:disabled){opacity:.5;cursor:not-allowed}
.w-overlay{position:fixed;inset:0;background:#0005;display:flex;justify-content:flex-end;z-index:1000;padding:12px;overflow:auto}.w-dialog{width:min(620px,100%);max-height:100%;display:flex;flex-direction:column;min-height:0;background:var(--w-bg);color:var(--w-text);border:1px solid var(--w-border);border-radius:12px;box-shadow:0 18px 70px #0003}.w-dialog-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid var(--w-border);flex-shrink:0}.w-dialog-header>h2{font-size:20px}.w-dialog-body{overflow:auto;padding:20px 24px;min-height:0}.w-editor-grid{display:grid;grid-template-columns:210px minmax(0,1fr) 300px;min-height:500px;flex:1}.w-editor-list{padding:20px 12px;border-inline-end:1px solid var(--w-border);min-width:0}.w-editor-canvas{background:var(--w-soft);padding:20px;min-width:0;display:flex;flex-direction:column;gap:14px}.w-editor-inspector{padding:24px;border-inline-start:1px solid var(--w-border);min-width:0;overflow:auto}.w-editor-inspector h3{margin-bottom:18px}.w-preview-empty{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px;aspect-ratio:16/9;min-height:180px;background:var(--w-soft);border:1px solid var(--w-border);border-radius:8px;padding:24px;color:var(--w-muted)}.w-content-pad{padding:24px 0}.w-stack{display:flex;flex-direction:column;gap:16px;min-width:0}.w-scroll-x{overflow:auto;max-width:100%}
@container dsh-workbench (max-width:1000px){.w-editor-grid{grid-template-columns:160px minmax(0,1fr)}.w-editor-inspector{grid-column:1/-1;border-inline-start:0;border-top:1px solid var(--w-border)}.w-header-actions{max-width:60%}.w-split{grid-template-columns:minmax(240px,32%) minmax(0,1fr)}}
@container dsh-workbench (max-width:760px){.w-page-header{gap:14px;flex-wrap:wrap;padding-bottom:18px}.w-heading{flex:1;min-width:170px}.dshw h1{font-size:24px}.w-header-actions{max-width:100%;justify-content:flex-start}.w-subtitle{font-size:13px}.w-tabs{gap:12px}.dshw .w-tabs>button{padding:10px 4px 12px}.w-split{display:block;min-height:360px}.w-split[data-selected=false]>.w-detail{display:none}.w-split[data-selected=true]>.w-master{display:none}.w-master{border-inline-end:0}.w-detail{padding:20px 0}.w-back{display:inline-flex!important;align-self:flex-start;margin:0 0 16px!important}.w-detail h2{font-size:22px}.w-master-toolbar{padding:16px 0}.dshw .w-row-button{padding:16px 10px}.w-detail-footer{position:static}.w-detail-footer .w-muted{flex-basis:100%}.w-editor-grid{display:flex;flex-direction:column}.w-editor-list{border-inline-end:0;border-bottom:1px solid var(--w-border);padding:16px 0}.w-editor-canvas{padding:16px 0;background:var(--w-bg)}.w-editor-inspector{padding:20px 0}.w-dialog-header,.w-dialog-body{padding:16px}.w-button{min-height:40px}.w-definition{grid-template-columns:80px minmax(0,1fr)}}
@media(max-width:700px){.w-page[data-main=true]{padding:calc(16px + var(--dsh-frame-top-clearance,0px)) 16px 0 max(16px,var(--dsh-frame-leading-clearance,0px))}.w-overlay{padding:8px}.w-dialog{width:100%}}
@media(prefers-reduced-motion:reduce){.dshw *,.dshw *:before{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;
  function Styles() { return h('style', null, styles); }
  return { Icon, Button, IconButton, Page, Tabs, Status, Empty, Split, Row, Search, Switch, Dialog, Styles, register, styles };
}

/* One update control per plugin. Only transport, idle guards and installation
 * coordination are shared; no global update page or update-all action exists. */
function __stardustUpdatesGuards() {
  const key = Symbol.for('stardustlc.plugin-updates.guards.v1');
  return globalThis[key] ||= { values: new Map(), listeners: new Set(), viewListeners: new Set(), clients: new Set() };
}
function __stardustUpdatesGuard(React, name, { dirty = false, busy = false, retainOnClose = false } = {}) {
  const token = React.useRef(null);
  if (!token.current) token.current = {};
  React.useLayoutEffect(() => {
    const pool = __stardustUpdatesGuards();
    if (!dirty && !busy) for (const [key, value] of pool.values) if (value.name === name && value.orphan) pool.values.delete(key);
    pool.values.set(token.current, { name, dirty: !!dirty, busy: !!busy, retainOnClose, orphan: false });
    for (const listener of pool.listeners) listener();
  }, [name, !!dirty, !!busy, retainOnClose]);
  React.useEffect(() => () => {
    const pool = __stardustUpdatesGuards(), value = pool.values.get(token.current);
    if (value?.retainOnClose && (value.dirty || value.busy)) value.orphan = true;
    else pool.values.delete(token.current);
    for (const listener of pool.listeners) listener();
  }, []);
}
function __StardustPluginUpdatesFooter({ React, name }) {
  const [, render] = React.useState(0), pool = __stardustUpdatesGuards();
  React.useEffect(() => { const fn = () => render(value => value + 1); pool.viewListeners.add(fn); return () => pool.viewListeners.delete(fn); }, []);
  const client = [...pool.clients].find(client => typeof client.Footer === 'function' && client.has(name));
  if (!client) return null;
  return React.createElement(client.Footer, { name });
}
function __stardustUpdatesFooter(React, name) {
  return React.createElement(__StardustPluginUpdatesFooter, { key: 'plugin-updates', React, name });
}
function __stardustUpdatesInlinePage(React, element, name) {
  return React.cloneElement(element, null, element.props.children, __stardustUpdatesFooter(React, name));
}
function __stardustUpdatesDetailName(subject, rows) {
  if (!subject || !['bundle', 'row'].includes(subject.kind)) return null;
  if (subject.kind === 'row' && subject.pkg?.name === '@stardustlc/dsh-suite') {
    const component = rows.find(row => row.bundledBy === subject.pkg.name && (subject.row?.moduleName === row.name || subject.row?.moduleName?.startsWith(row.name + '/')));
    if (component) return component.name;
  }
  return rows.some(row => row.name === subject.pkg?.name) ? subject.pkg.name : null;
}
function __stardustUpdatesNativeFormState(document) {
  let dirty = false, busy = false;
  for (const scope of document.querySelectorAll('[data-plugin-detail],[data-plugin-row-detail]')) for (const button of scope.querySelectorAll('button')) {
    if (!button.getClientRects().length || button.closest('.plugin-updates-footer')) continue;
    const label = (button.getAttribute('aria-label') || button.textContent || '').trim();
    if (/^(?:正在保存|保存中|Saving)(?:[.…\s]|$)/i.test(label) || button.getAttribute('aria-busy') === 'true') busy = true;
    if (!button.disabled && button.getAttribute('aria-disabled') !== 'true' && /^(?:保存(?:更改|设置|配置)?|Save(?: changes| settings| configuration)?)(?:\s+(?:Ctrl|⌘|Enter|↵).*)?$/i.test(label)) dirty = true;
  }
  return { dirty, busy };
}
function __stardustUpdatesDisplayRows(next, known) {
  for (const row of next.rows) known.set(row.name, row);
  if (!['verifying', 'installing', 'cancelling', 'unknown', 'restore-failed'].includes(next.job?.state)) return next;
  const rows = [...next.rows];
  for (const row of known.values()) if ((row.name === next.job.name || row.bundledBy === next.job.name) && !rows.some(item => item.name === row.name)) rows.push({ ...row, updating: true });
  return { ...next, rows };
}
function __stardustUpdatesSuiteRows(next, participants) {
  // The official manager lists top-level dependencies, not Suite's transitive
  // components. Project active, build-identified clients for display only.
  // Installation and preferences still use the real Suite row from the host.
  const suiteUpdating = next.job?.name === '@stardustlc/dsh-suite' && ['verifying', 'installing', 'cancelling', 'unknown', 'restore-failed'].includes(next.job?.state);
  const suite = next.rows.find(row => row.name === '@stardustlc/dsh-suite' && (row.enabled || suiteUpdating));
  if (!suite) return next;
  const rows = [...next.rows], names = new Set(rows.map(row => row.name));
  for (const item of participants) if (item.suiteComponent && item.packageVersion && item.label && !names.has(item.name)) {
    names.add(item.name);
    rows.push({ name: item.name, version: item.packageVersion, enabled: true, sourceKind: 'suite', loadError: false, label: item.label, labelEn: item.labelEn, bundledBy: suite.name });
  }
  return { ...next, rows };
}
function __stardustUpdatesWrap(definition, participant) {
  return { ...definition, factory(require) {
    const original = definition.factory(require);
    if (!original || typeof original !== 'object') return original;
    const React = require('react');
    return { ...original, apply(ctx, ...args) {
      const result = original.apply?.call(this, ctx, ...args);
      // The optional alpha.3 slot stays dormant in older hosts; its scoped
      // injection unregisters naturally when the plugin is unloaded.
      if (participant.iconData && participant.sectionIds?.length && typeof ctx.inject === 'function') ctx.inject(['slots'], host => {
        for (const id of new Set(participant.sectionIds)) host.slots.inject('settings.section.icon', () => host.slots.register({ name: 'settings.section.icon', id }, function PluginSettingsIcon({ size = 20 }) {
          return React.createElement('img', { src: participant.iconData, alt: '', 'aria-hidden': true, width: size, height: size, style: { objectFit: 'contain', display: 'block', flexShrink: 0 } });
        }));
      });
      if (typeof ctx.inject === 'function') ctx.inject(['slots', 'locale', 'remote', 'remote.pluginManager'], host => __stardustUpdatesJoin(host, React, require, participant));
      return result;
    } };
  } };
}
function __stardustUpdatesJoin(host, React, require, participant) {
  const key = Symbol.for('stardustlc.plugin-updates.client.v1'), pools = globalThis[key] ||= new WeakMap(), root = host.root || host;
  if (typeof root.plugin !== 'function') return;
  let record = pools.get(root);
  if (!record) {
    record = { refs: new Map(), timer: null, version: participant.version, alive: true, hold: false, uiRevision: 11, migration: Promise.resolve() };
    pools.set(root, record);
    __stardustUpdatesActivate(record, pools, root, React, require);
  } else if ((record.uiRevision || 0) < 11 && !record.upgrading) {
    // An earlier loaded participant may still own an older client revision. Keep
    // its references and draft guards, wait for any admitted install, then
    // replace that one client fiber instead of running two window heartbeats.
    const shared = record;
    const previousMigration = record.migration;
    record.upgrading = record.migration = Promise.resolve(previousMigration).then(async () => {
      while (shared.alive && shared.hold) await new Promise(resolve => setTimeout(resolve, 500));
      if (!shared.alive || !shared.refs.size) return;
      await shared.fiber?.dispose?.();
      if (!shared.refs.size) return;
      shared.alive = true; shared.uiRevision = 11; pools.set(root, shared);
      __stardustUpdatesActivate(shared, pools, root, React, require);
    }).catch(() => { /* The original page remains usable if host disposal fails. */ });
  }
  clearTimeout(record.timer);
  const ref = {}; record.refs.set(ref, participant);
  host.effect(() => () => {
    record.refs.delete(ref);
    const stop = () => {
      if (record.refs.size || !record.alive) return;
      if (record.hold) { record.timer = setTimeout(stop, 1000); return; }
      record.alive = false; Promise.resolve(record.fiber?.dispose?.()).catch(() => {});
    };
    if (!record.refs.size) record.timer = setTimeout(stop, 1000);
  });
}
function __stardustUpdatesActivate(shared, pools, root, React, require) {
  shared.fiber = root.plugin({ name: 'stardustlc-plugin-updates-client', inject: ['slots', 'locale', 'remote', 'remote.pluginManager'], apply(ctx) {
    const client = __stardustUpdatesClient(ctx, React, require, shared);
    ctx.effect(() => () => { shared.alive = false; client.dispose(); if (pools.get(root) === shared) pools.delete(root); });
  } });
  Promise.resolve(shared.fiber).catch(() => { shared.alive = false; if (pools.get(root) === shared) pools.delete(root); });
}
function __stardustUpdatesClient(ctx, React, require, shared) {
  const h = React.createElement, W = createWorkbenchUI(React), route = new URL('api/stardustlc/plugin-updates', document.baseURI);
  const { useState, useEffect, useRef } = React, id = crypto.randomUUID(), listeners = new Set(), pool = __stardustUpdatesGuards(), requests = new Set(), knownRows = new Map();
  let alive = true, registered = false, state = null, lastInteraction = Date.now(), inPoll = false, manualOperation = false;
  const language = () => String(ctx.locale?.getSnapshot?.().active || '').startsWith('en') ? 'en' : 'zh';
  const t = (zh, en) => language() === 'en' ? en : zh;
  const REPOS = { 'dsh-calendar': 'dsh-calendar', 'dsh-cite': 'dsh-cite', 'dsh-code-security': 'dsh-code-security', 'dsh-codex-port': 'dsh-codex-port', 'deepseek-computer-use': 'deepseek-computer-use', 'dsh-dingtalk': 'dsh-dingtalk', '@stardustlc/dsh-docker': 'dsh-docker', '@stardustlc/dsh-dream': 'dsh-dream', 'dsh-email': 'dsh-email', 'dsh-ffmpeg': 'dsh-ffmpeg', 'dsh-flakefinder': 'dsh-flakefinder', 'dsh-hyperframes': 'dsh-hyperframes', 'dsh-minimal-ptc': 'dsh-minimal-ptc', 'dsh-ppt': 'dsh-ppt', 'dsh-remotion': 'dsh-remotion', '@stardustlc/dsh-review': 'dsh-review', 'dsh-rss': 'dsh-rss', 'dsh-slack': 'dsh-slack', 'dsh-sql': 'dsh-sql', '@stardustlc/dsh-suite': 'dsh-suite', 'dsh-voice': 'dsh-voice' };
  const repoUrl = pkg => Object.hasOwn(REPOS, pkg) ? 'https://github.com/STARDUSTLC666/' + REPOS[pkg] : null;
  const preferences = name => state?.preferences.packages[name] || { checkEnabled: true, autoInstall: false, autoScope: 'compatible', deferredUntil: 0, ignoredVersion: null };
  const originalRow = name => state?.rows.find(row => row.name === name);
  const rowFor = name => { const row = originalRow(name); return row?.bundledBy ? originalRow(row.bundledBy) : row; };
  const activeJob = () => ['verifying', 'installing', 'cancelling'].includes(state?.job?.state);
  function notify() { shared.hold = manualOperation || activeJob(); for (const listener of listeners) listener(); for (const listener of pool.viewListeners) listener(); }
  async function api(body = { action: 'state' }) {
    const controller = new AbortController(); requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), body.action === 'check' ? 95000 : 45000);
    try {
      const response = await fetch(route, { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { 'content-type': 'application/json', 'x-stardustlc-updates': '1' }, body: JSON.stringify(body) });
      let data; try { data = await response.json(); } catch { throw new Error('service-unavailable'); }
      if (!response.ok || !data.ok) throw new Error(response.status === 403 ? 'owner-required' : data.code || 'service-unavailable');
      return data.value;
    } catch (error) { if (error?.name === 'AbortError') throw new Error('service-unavailable'); throw error; }
    finally { clearTimeout(timeout); requests.delete(controller); }
  }
  function pageState(manual = manualOperation) {
    const values = [...pool.values.values()], nativeForm = __stardustUpdatesNativeFormState(document);
    const dialog = [...document.querySelectorAll('[role="dialog"],dialog[open]')].some(node => node.getClientRects().length && !(manual && (node.closest('.plugin-updates-footer') || node.querySelector('.plugin-updates-footer'))));
    return { action: 'heartbeat', id, dirty: nativeForm.dirty || values.some(value => value.dirty), busy: nativeForm.busy || values.some(value => value.busy) || dialog, idleForMs: Math.min(86400000, Math.max(0, Date.now() - lastInteraction)) };
  }
  const heartbeat = () => api(pageState());
  function interaction() { lastInteraction = Date.now(); if (registered && alive) void heartbeat().catch(() => {}); }
  const guardChanged = () => { if (registered && alive) void heartbeat().catch(() => {}); };
  for (const event of ['pointerdown', 'keydown', 'input']) document.addEventListener(event, interaction, { capture: true, passive: true });
  pool.listeners.add(guardChanged);
  const close = () => { void fetch(route, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'content-type': 'application/json', 'x-stardustlc-updates': '1' }, body: JSON.stringify({ action: 'client-close', id }) }).catch(() => {}); };
  window.addEventListener('pagehide', close);
  async function refresh() { const next = await api(); if (alive) { state = __stardustUpdatesDisplayRows(__stardustUpdatesSuiteRows(next, shared.refs.values()), knownRows); notify(); } return next; }
  const STALE_CHECK_MS = 30 * 60 * 1000, STALE_RETRY_MS = 5 * 60 * 1000, staleChecks = new Map(), staleInFlight = new Set();
  function refreshIfStale(row) {
    if (!alive || !row || row.sourceKind !== 'registry' || row.bundledBy || !row.available || row.updating) return;
    const now = Date.now();
    if (row.checkedAt && now - row.checkedAt <= STALE_CHECK_MS) return;
    if (staleInFlight.has(row.name) || now - (staleChecks.get(row.name) ?? -Infinity) < STALE_RETRY_MS) return;
    staleChecks.set(row.name, now);
    staleInFlight.add(row.name);
    void (async () => {
      try { await api({ action: 'check', name: row.name }); await refresh(); }
      catch { /* Offline or transient errors stay silent and throttled by staleChecks. */ }
      finally { staleInFlight.delete(row.name); }
    })();
  }
  function useSnapshot() {
    const [, render] = useState(0);
    useEffect(() => { const fn = () => render(value => value + 1); listeners.add(fn); const stop = ctx.locale?.subscribe?.(fn); return () => { listeners.delete(fn); stop?.(); }; }, []);
    return state;
  }
  function message(code) {
    return ({
      'page-dirty': t('有未保存的修改。请先保存或放弃修改，再更新。', 'Save or discard unsaved changes before updating.'),
      'page-busy': t('有页面操作或对话框尚未结束，请完成后再试。', 'Finish the active page operation or close its dialog, then retry.'),
      'page-not-ready': t('还有窗口状态未确认，或旧版插件尚未提供状态保护。请刷新相关窗口，必要时先手动更新旧版插件。', 'A window state is unknown or an older plugin lacks state protection. Refresh the affected windows and manually update legacy plugins if needed.'),
      busy: t('DSH 正在执行任务或安装，请等操作结束。', 'DSH is running a task or installation. Wait for it to finish.'),
      'activity-unknown': t('无法确认任务是否空闲，已暂停安装。', 'Installation paused because task activity is unknown.'),
      'restart-required': t('更新服务需要重启后继续。请在方便时手动重启 DSH。', 'The updater needs a restart. Restart DSH manually when convenient.'),
      'operation-unconfirmed': t('上次安装未确认或恢复失败。请在官方插件管理中检查并修复，之后手动重启 DSH。', 'The last installation is unconfirmed or recovery failed. Check and repair it in native plugin management, then restart DSH manually.'),
      'check-first': t('检查结果已过期，请重新检查。', 'This check expired. Check again.'),
      'release-changed': t('发现更新的发布版本（或发布信息已更新），已刷新至最新状态，请再次确认安装。', 'A newer release or updated metadata was found and refreshed; confirm again to install.'),
      'preferences-conflict': t('另一个窗口修改了偏好，已刷新，请重试。', 'Preferences changed in another window. They have been refreshed; retry.'),
      'preferences-unreadable': t('更新偏好文件无法读取，自动安装已关闭。请检查当前 profile 的 stardustlc-plugin-updates.json。', 'Preferences could not be read. Automatic installation is off. Check stardustlc-plugin-updates.json in this profile.'),
      'no-update': t('版本已变化或暂不兼容，请重新检查。', 'The version changed or is incompatible. Check again.'),
      'source-not-registry': t('本地源码、Git 等安装，请通过原安装方式更新。', 'Update local, Git and other external sources through their original installation method.'),
      'managed-by-suite': t('这个插件随 Suite 安装，通过 Suite 更新。', 'This plugin was installed through Suite and is updated through Suite.'),
      'owner-required': t('只有 profile 拥有者能管理更新。', 'Only the profile owner can manage updates.'),
      'version-mismatch': t('宿主装入的版本与目标不同。请重新检查版本和软件源策略。', 'The installed version differs from the target. Check the release and registry policy.'),
      'unexpected-package': t('宿主装入的包或版本与目标不同。请检查版本和软件源策略。', 'The installed package or version differed from the target. Check the release and registry policy.'),
      'version-unconfirmed': t('尚未确认新版已加载，请在插件详情中检查当前版本。', 'The new version could not be confirmed. Check the installed version in plugin details.'),
      'build-blocked': t('构建脚本等待批准。请查看原生插件管理中的安装提示。', 'Build scripts await approval. Review the install details in native plugin management.'),
      'bundle-in-use': t('宿主暂时无法热卸载旧版（通常因本轮刚更新过其他共用底层依赖的插件，内存路径待刷新；或同时启用了包含此组件的组合包）：直接手动重启一次 DSH 即可继续更新，无需逐个停用插件。', 'The host cannot hot-unload the previous version right now (usually because another plugin sharing dependencies was updated earlier in this session, or a bundle containing this component is also active): restart DSH once and retry without disabling plugins one by one.'),
      'already-installed': t('该包已在当前配置中，请刷新或重启 DSH 后查看当前版本。', 'This package is already present in the profile; refresh or restart DSH to inspect its version.'),
      'incompatible-version': t('目标版本与当前运行的 DSH 版本不兼容。', 'The target version is incompatible with the running DSH version.'),
      'stop-profile': t('当前配置未启用热重载，需关闭 DSH 后再通过命令行更新。', 'This profile runs without hot reload; stop DSH and update via CLI.'),
      'not-removable': t('此内置或受保护插件不支持在此处移除替换。', 'This built-in or protected bundle cannot be replaced here.'),
      'pkg-network': t('连接 npm 源时网络中断，请稍后重试。', 'Network error reaching the package registry. Retry shortly.'),
      'pkg-timeout': t('包管理器请求超时，请检查网络后重试。', 'Package manager request timed out. Check your connection and retry.'),
      'pkg-not-found': t('未找到目标版本或已被源撤回，请重新检查更新。', 'Target release was not found on the registry. Check again.'),
      'pkg-no-matching-version': t('没有匹配当前兼容性要求的已发布版本。', 'No published version matches the compatibility constraints.'),
      'pkg-integrity': t('下载包的完整性校验未通过，已放弃安装，请重试。', 'Package integrity verification failed. Installation aborted; retry.'),
      'pkg-disk-full': t('磁盘空间不足，请清理后重试。', 'Disk space is full. Free disk space and retry.'),
      'pkg-permission': t('无权写入当前 profile 目录，请检查文件权限。', 'Permission denied writing to this profile directory.'),
      'pkg-pnpm-missing': t('未检测到可用的 pnpm，请在环境或宿主插件设置中检查。', 'pnpm is unavailable to the host package manager.'),
      'operation-error': t('宿主包管理器未能完成操作，可在原生「插件」详情页点击更新查看完整日志。', 'Host package manager did not complete the operation. Retry from native plugin details to inspect logs.'),
    })[code] || t('操作未完成，请刷新后重试。DSH 不会因此自动重启。', 'The operation could not be completed. Refresh and retry. DSH will not restart automatically.');
  }
  function reasonOf(job) {
    if (!job) return null;
    if (job.reason) return job.reason;
    const res = job.outcome?.result;
    if (res?.pendingBuilds || res?.failureKind === 'build-blocked') return 'build-blocked';
    if (res?.failureKind && ['network', 'timeout', 'not-found', 'no-matching-version', 'integrity', 'pnpm-missing', 'disk-full', 'permission'].includes(res.failureKind)) return 'pkg-' + res.failureKind;
    return res?.error?.code || null;
  }
  // releaseOf() keeps the failing engine/peer range check as a stable code; say which
  // environment has to change instead of only reporting that the release is incompatible.
  function requirement(release) {
    return ({
      'dsh-version': t('需要换成与该版本匹配的 DSH 本体', 'it needs a different DSH version'),
      'node-version': t('需要换成与该版本匹配的 Node.js', 'it needs a different Node.js version'),
      deprecated: t('作者已把这个版本标记为弃用', 'the author marked this release as deprecated'),
      'not-bundle': t('这个版本不是可加载的 DSH 插件包', 'this release is not a loadable DSH plugin bundle'),
    })[release?.reason] || t('发布元数据的兼容范围与当前环境不符', 'its published compatibility range does not match this environment');
  }
  function jobLabel(job) {
    if (job.state === 'installing') {
      const phase = ({
        checking: t('宿主正在检查版本', 'Host checking release'),
        removing: t('正在卸载旧版', 'Unloading the previous version'),
        applying: t('正在加载新版', 'Loading the new version'),
        restoring: t('正在恢复旧版', 'Restoring the previous version'),
      })[job.phase];
      if (phase) return phase;
    }
    return ({ verifying: t('正在核对版本', 'Verifying release'), installing: t('正在安装', 'Installing'), cancelling: t('正在请求取消', 'Requesting cancellation'), complete: t('已更新', 'Updated'), 'restart-required': t('已安装，等待你手动重启', 'Installed; manual restart needed'), restored: t('更新未成功，已恢复原版本', 'Update failed; previous version restored'), 'restore-failed': t('恢复未成功，请检查官方插件管理', 'Recovery failed; check native plugin management'), unknown: t('结果未确认，请检查官方插件管理', 'Result unconfirmed; check native plugin management'), cancelled: t('已取消', 'Cancelled'), failed: t('更新未成功', 'Update failed') })[job.state] || job.state;
  }
  const FOOTER_CSS = '.plugin-updates-footer{box-sizing:border-box;flex-shrink:0;margin-top:16px;padding-top:14px;border-top:var(--dsh-control-border-width,0.5px) solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3,#e5e7eb));min-width:0;max-width:100%;color:var(--dsw-alias-label-primary,#202124)}'
    + '.dshw.plugin-updates-footer.is-inline{display:block!important;width:100%!important;max-width:100%!important;margin-block:auto 0!important;margin-inline:0!important;padding:6px 14px!important;border-top:var(--dsh-control-border-width,0.5px) solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3,#e5e7eb));background:var(--dsw-alias-bg-layer-1,var(--w-soft,#f7f8fa));font-size:12px;line-height:1.45}'
    + '.plugin-updates-footer .updates-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;min-block-size:28px;min-width:0}'
    + '.plugin-updates-footer .updates-bar-info,.plugin-updates-footer .updates-bar-actions,.plugin-updates-footer .updates-head-actions,.plugin-updates-footer .updates-title-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;min-width:0}'
    + '.plugin-updates-footer .updates-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 12px}'
    + '.plugin-updates-footer .updates-compact-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px 12px}'
    + '.plugin-updates-footer .updates-compact-bar>.updates-options{margin-top:0;min-width:0}'
    + '.plugin-updates-footer .updates-compact-bar>.updates-options[open]{flex:1 1 100%}'
    + '.plugin-updates-footer h2{font-size:13.5px;line-height:1.4;margin:0;font-weight:600}'
    + '.plugin-updates-footer .updates-pill{display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;font-size:11px;font-weight:600;line-height:1.5;background:var(--dsw-alias-bg-layer-2,var(--w-soft,#eef1f6));color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-pill.is-accent{background:color-mix(in srgb,var(--w-accent,#4f6bdb) 14%,transparent);color:var(--w-accent,#4f6bdb)}'
    + '.plugin-updates-footer .updates-pill.is-error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ad3636) 14%,transparent);color:var(--dsw-alias-state-error-primary,#ad3636)}'
    + '.plugin-updates-footer .updates-mono,.plugin-updates-footer .updates-subtitle,.plugin-updates-footer .updates-version{font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere;margin:0}'
    + '.plugin-updates-footer .updates-badge{padding:1px 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-2,var(--w-soft,#eef1f6));color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-meta-line,.plugin-updates-footer .updates-note{margin:3px 0 0;font-size:12px;line-height:1.55}'
    + '.plugin-updates-footer .updates-inline-msg.is-error{color:var(--dsw-alias-state-error-primary,#ad3636);font-size:12px}'
    + '.plugin-updates-footer .w-button.is-sm{min-block-size:26px;min-inline-size:26px;min-height:26px;padding:3px 9px;font-size:12px;gap:5px;border-radius:6px}'
    + '.plugin-updates-footer .updates-options{margin-top:8px}'
    + '.plugin-updates-footer .updates-options>summary{cursor:pointer;display:inline-flex;align-items:center;gap:0.55ch;min-block-size:24px;font-size:12px;line-height:1.5;font-weight:500;color:var(--dsw-alias-label-secondary,#657080);list-style:none}'
    + '.plugin-updates-footer .updates-options>summary:after{display:none}'
    + '.plugin-updates-footer .updates-options>summary::before{content:"";inline-size:6px;block-size:6px;flex-shrink:0;border-inline-end:1.5px solid currentColor;border-block-end:1.5px solid currentColor;rotate:-45deg}'
    + '.plugin-updates-footer .updates-options>summary:dir(rtl)::before{rotate:135deg}'
    + '.plugin-updates-footer .updates-options[open]>summary::before{rotate:45deg}'
    + '.plugin-updates-footer .updates-options>summary:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:3px;border-radius:4px}'
    + '.plugin-updates-footer details::details-content{interpolate-size:allow-keywords;overflow:clip;contain:layout}'
    + '.plugin-updates-footer details:not([open])::details-content{block-size:0}'
    + '.plugin-updates-footer .updates-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:14px;padding:10px 0 2px}'
    + '.plugin-updates-footer>.w-section{margin:8px 0 0;padding:0;border:0}'
    + '.plugin-updates-footer .w-toolbar{margin-top:8px!important}'
    + '.plugin-updates-footer .w-switch-label{max-width:100%;gap:12px;align-items:flex-start}'
    + '.plugin-updates-footer .w-switch-track{flex-shrink:0}'
    + '.plugin-updates-footer .updates-notes{margin-top:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l3,#e5e7eb);border-radius:8px;background:var(--dsw-alias-bg-base,var(--w-bg,#fff))}'
    + '.plugin-updates-footer .updates-notes pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;margin:6px 0;padding:10px;font:12px/1.65 ui-monospace,monospace}'
    + '.plugin-updates-footer .updates-notes pre code{font:inherit;background:transparent;padding:0}'
    + '.plugin-updates-footer .updates-links{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;margin-top:10px;padding-top:8px;border-top:1px dashed var(--dsw-alias-border-l3,#e5e7eb);font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-links a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;min-block-size:24px;gap:4px}'
    + '.plugin-updates-footer .updates-links a:hover{color:var(--dsw-alias-label-primary,#202124);text-decoration:underline}'
    + '.plugin-updates-footer .updates-links a:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:3px;border-radius:4px}'
    + '.plugin-updates-footer .w-overlay{z-index:1002}'
    + '.plugin-updates-footer .updates-auto-nudge{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin-top:6px;font-size:12px;color:var(--dsw-alias-label-secondary,#657080)}'
    + '@media(pointer:coarse){.plugin-updates-footer .w-button.is-sm{min-block-size:32px;min-height:32px;padding:5px 11px}}'
    + '@media(prefers-reduced-motion:no-preference){.plugin-updates-footer .updates-options>summary::before{transition:rotate .18s ease}.plugin-updates-footer details::details-content{transition:block-size .22s ease,content-visibility .22s ease allow-discrete}}'
    + '@media(max-width:600px){.plugin-updates-footer .updates-head{gap:8px}.plugin-updates-footer .w-toolbar{gap:6px;flex-wrap:wrap}.plugin-updates-footer .w-button{max-width:100%}}';
  function FooterFrame({ name, label, inline = false, supplement = false, head, children }) {
    return h('section', { className: 'dshw plugin-updates-footer' + (inline ? ' is-inline' : ''), 'data-plugin-update-footer': name, 'aria-label': label + (supplement ? t(' · 自动更新与反馈', ' · Auto-update and feedback') : t(' · 版本与更新', ' · Version and updates')) },
      h('style', null, W.styles),
      h('style', null, FOOTER_CSS),
      head, children);
  }
  function Panel({ name, inline = false }) {
    const snapshot = useSnapshot(), [error, setError] = useState(''), [working, setWorking] = useState(false), [checking, setChecking] = useState(false), [dialog, setDialog] = useState(null), [selectedVersion, setSelectedVersion] = useState(null), [notes, setNotes] = useState(null), [notesOpen, setNotesOpen] = useState(false), [loadingNotes, setLoadingNotes] = useState(false), [dismissedJobId, setDismissedJobId] = useState(null);
    const seenActiveJob = useRef ? useRef(null) : { current: null };
    const row = rowFor(name), original = originalRow(name), target = row?.name || name, prefs = preferences(target), job = snapshot?.job?.name === target ? snapshot.job : null;
    if (job && ['verifying', 'installing', 'cancelling'].includes(job.state)) seenActiveJob.current = job.id;
    const panelStaleTarget = !!snapshot && !!row && !!original && (!inline || (row.sourceKind === 'registry' && row.available && prefs.deferredUntil <= Date.now() && prefs.ignoredVersion !== row.release?.version));
    useEffect(() => { if (panelStaleTarget && !activeJob()) refreshIfStale(row); }, [panelStaleTarget, row?.name, row?.available, row?.checkedAt]);
    async function perform(callback) { setError(''); setWorking(true); try { await callback(); await refresh(); } catch (error) { setError(error.message); await refresh().catch(() => {}); } finally { setWorking(false); } }
    async function save(changes, consent) { await api({ action: 'preferences', name: target, revision: state.preferences.revision, changes, consent }); }
    async function check() { setError(''); setChecking(true); try { staleChecks.set(target, Date.now()); await api({ action: 'check', name: target }); await refresh(); } catch (error) { setError(error.message); } finally { setChecking(false); } }
    async function runOperation(request) {
      setDialog(null); manualOperation = true; notify();
      setError(''); setWorking(true);
      try {
        try {
          await heartbeat();
          const started = await api(request);
          seenActiveJob.current = started.id;
          while (alive) {
            await new Promise(resolve => setTimeout(resolve, 800)); await heartbeat(); await refresh();
            if (state.job?.id !== started.id) throw new Error('operation-unconfirmed');
            if (!activeJob()) break;
          }
          await refresh();
        } finally { manualOperation = false; notify(); }
      } catch (err) {
        setError(err.message);
        if (request.action === 'install' && ['check-first', 'release-changed'].includes(err?.message)) {
          staleChecks.set(target, Date.now());
          await api({ action: 'check', name: target }).catch(() => {});
        }
        await refresh().catch(() => {});
      } finally { setWorking(false); }
    }
    async function showNotes() {
      if (notesOpen) { setNotesOpen(false); return; }
      setNotesOpen(true); setNotes(null); setLoadingNotes(true); setError('');
      try { setNotes(await api({ action: 'notes', name: target, version: row.release.version })); } catch (error) { setError(error.message); } finally { setLoadingNotes(false); }
    }
    if (inline && (!snapshot || !row || !original)) return null;
    if (!snapshot) return h('p', { className: 'dshw w-muted' }, t('正在读取更新状态…', 'Loading update status…'));
    if (!row || !original) return h(W.Status, null, t('此插件尚未安装或已从当前 profile 移除。', 'This plugin is not installed in the current profile.'));
    const title = language() === 'en' ? original.labelEn : original.label;
    const ownPage = pageState(true), unconfirmed = ['unknown', 'restore-failed'].includes(snapshot.job?.state);
    const staleWindows = (snapshot.pages.clients || []).some(client => !client.fresh);
    const pageBusy = ownPage.busy || (snapshot.pages.clients || []).some(client => client.id !== id && client.busy);
    const installLocked = working || activeJob() || unconfirmed || snapshot.updaterRestart || snapshot.preferenceError || !snapshot.activity.known
      || snapshot.activity.busy || snapshot.pages.dirty || ownPage.dirty || pageBusy || !snapshot.pages.known;
    const checkingThis = checking || snapshot.checkingNames?.includes(target);
    const managed = row.sourceKind === 'registry';
    const showUpdate = managed && row.available;
    const deferred = prefs.deferredUntil > Date.now();
    const ignored = !!row.release?.version && prefs.ignoredVersion === row.release.version;
    const actionableUpdate = showUpdate && !deferred && !ignored;
    const canConfirm = showUpdate && row.release?.version === selectedVersion && !installLocked && !row.loadError;
    const isSuite = target === '@stardustlc/dsh-suite';
    const jobResult = job?.outcome?.result;
    const jobReason = reasonOf(job);
    const jobActiveThis = !!job && ['verifying', 'installing', 'cancelling'].includes(job.state);
    const canCancel = jobActiveThis && !['applying', 'restoring'].includes(job.phase);
    const jobAttentionThis = !!job && ['restart-required', 'restored', 'restore-failed', 'unknown', 'failed'].includes(job.state) && (unconfirmed || dismissedJobId !== job.id);
    const jobJustCompleted = !!job && job.state === 'complete' && seenActiveJob.current === job.id && dismissedJobId !== job.id;
    const canSuggestAuto = !!job && job.state === 'complete' && !jobReason && job.mode !== 'automatic' && (!prefs.autoInstall || prefs.autoScope !== 'compatible') && managed && !snapshot.preferenceError && dismissedJobId !== job.id;
    const inlineJobVisible = jobActiveThis || jobAttentionThis || jobJustCompleted;
    if (inline && !actionableUpdate && !inlineJobVisible && !working && !checking && !error && !dialog && !notesOpen) return null;
    const notesSection = notesOpen && h('section', { className: 'updates-notes', 'aria-label': t('更新记录', 'Release notes') },
      h('strong', null, target + ' · ' + (notes?.version || row.release?.version || '')),
      loadingNotes ? h('p', { className: 'w-muted updates-note' }, t('正在读取…', 'Loading…'))
        : notes?.text ? h('pre', { tabIndex: 0, role: 'region', 'aria-label': t('更新记录内容', 'Release notes content') }, h('code', null, notes.text))
        : h('p', { className: 'w-muted updates-note' }, t('未找到此版本的独立更新记录。', 'No separate notes were found for this version.')),
      notes?.url && h('a', { href: notes.url, target: '_blank', rel: 'noreferrer noopener' }, t('查看仓库更新记录', 'View repository changelog')));
    const windowsDialog = dialog === 'windows' && h(W.Dialog, { title: t('断开的窗口都已关闭？', 'Are the disconnected windows closed?'), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
      h('div', { className: 'w-stack' }, h('p', null, t('只清除超过 45 秒未回应的其他窗口记录。请先确认它们已经关闭；仍在使用的窗口请保存修改并刷新。当前或仍在回应的窗口保护会保留。', 'Only other windows silent for over 45 seconds are cleared. Confirm that they are closed; save and refresh windows still in use. Current and responsive windows remain protected.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')), h(W.Button, { onClick: () => { setDialog(null); void perform(() => api({ ...pageState(true), action: 'reconfirm-windows', confirmation: 'other-stale-windows-are-closed' })); } }, t('已关闭，重新确认状态', 'They are closed; reconfirm')))));
    const confirmDialog = ['automatic', 'install'].includes(dialog) && h(W.Dialog, { title: dialog === 'automatic' ? (isSuite ? t('允许 Suite 空闲时自动热更新？', 'Allow idle automatic updates for Suite?') : t('允许这个插件空闲时自动热更新？', 'Allow idle automatic updates for this plugin?')) : (isSuite ? t('确认更新 Suite 整包', 'Confirm Suite bundle update') : t('确认更新此插件', 'Confirm this plugin update')), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
      dialog === 'automatic' ? h('div', { className: 'w-stack' }, h('p', null, (language() === 'en' ? row.labelEn : row.label) + ' · ' + target), isSuite && h('p', null, t('此处设置作用于 Suite 整包（包含 18 个组件）。独立安装的其他插件不受影响。', 'This setting applies to the whole Suite (including its 18 components). Other independently installed plugins are unaffected.')), h('p', null, t('你正在主动启用自动安装。只处理通过当前 DSH 与 Node 兼容性校验的稳定版本（含功能小版本与补丁，跨主版本仍需手动确认）；有任务、未保存修改、未知窗口或等待重启时暂停。', 'You are explicitly enabling automatic installation for compatible stable releases (minor and patch updates matching this DSH and Node runtime; major upgrades still require manual confirmation). Running tasks, unsaved changes, unknown windows or a pending restart pause it.')), h('p', null, t('支持热更新时原地重载，不会自动重启 DSH；其他插件不会跟着开启，可随时关闭。', 'Hot-reloads in place when supported and never restarts DSH automatically. Other plugins remain unchanged; turn it off anytime.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('保持关闭', 'Keep off')), h(W.Button, { variant: 'primary', onClick: () => { setDialog(null); void perform(() => save({ checkEnabled: true, autoInstall: true, autoScope: 'compatible' }, 'enable-idle-compatible-updates')); } }, t('允许空闲自动热更新', 'Allow idle automatic updates')))) :
      h('div', { className: 'w-stack' },
        isSuite && h('p', null, t('此处操作的是 Suite 整包，包含 18 个组件。独立安装的其他插件不受影响。', 'This action applies to the whole Suite, including its 18 components. Other independently installed plugins are unaffected.')),
        h('p', { className: 'updates-version' }, target + ' · ' + row.version + ' → ' + selectedVersion),
        h('p', null, selectedVersion === row.release?.version ? t('Harness 会热更新并重新加载；需要手动重启时，更新区会显示宿主结果，停用状态会保留。', 'Harness hot-updates and reloads in place. If a manual restart is needed, it appears in the update result; disabled status is preserved.') : (showUpdate && row.release?.version ? message('release-changed') : message('check-first'))),
        h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')),
          showUpdate && row.release?.version && row.release.version !== selectedVersion
            ? h(W.Button, { variant: 'primary', disabled: installLocked || row.loadError, onClick: () => { setError(''); setSelectedVersion(row.release.version); } }, t('更新为 v', 'Use v') + row.release.version)
            : h(W.Button, { variant: 'primary', disabled: !canConfirm, onClick: () => runOperation({ action: 'install', name: target, version: selectedVersion, confirmation: 'update-installed-plugin' }) }, t('安装此版本', 'Install this version')))));
    const checkButton = variant => h(W.Button, { variant, className: 'is-sm', icon: 'refresh', disabled: checkingThis || !managed, onClick: check }, checkingThis ? t('正在检查…', 'Checking…') : isSuite ? t('检查整包更新', 'Check Suite updates') : t('检查更新', 'Check for updates'));
    const recheckButton = variant => h(W.Button, { variant, className: 'is-sm', icon: 'refresh', disabled: checkingThis || !managed, onClick: check }, checkingThis ? t('正在检查…', 'Checking…') : t('重新检查', 'Check again'));
    const primary = showUpdate
      ? h(W.Button, { variant: 'primary', className: 'is-sm', icon: 'download', disabled: installLocked || row.loadError, onClick: () => { setError(''); if (job && !jobActiveThis && !unconfirmed) setDismissedJobId(job.id); setSelectedVersion(row.release.version); setDialog('install'); } }, (isSuite ? t('更新 Suite 至 v', 'Update Suite to v') : t('更新至 v', 'Update to v')) + row.release.version)
      : managed ? checkButton() : null;
    if (inline) {
      const lockHint = unconfirmed ? message('operation-unconfirmed')
        : snapshot.updaterRestart ? message('restart-required')
        : snapshot.preferenceError ? message('preferences-unreadable')
        : (snapshot.pages.dirty || ownPage.dirty) ? t('请先保存修改后再更新', 'Save changes before updating')
        : (snapshot.activity.busy || pageBusy) ? t('当前任务或对话框结束后可更新', 'Finish active task or dialog to update')
        : (!snapshot.activity.known || !snapshot.pages.known) ? t('等待窗口状态确认', 'Waiting for window confirmation')
        : '';
      return h(FooterFrame, { name, label: title, inline: true, head: h('div', { className: 'updates-bar' },
        h('div', { className: 'updates-bar-info' },
          inlineJobVisible
            ? h(React.Fragment, null,
              h('span', { className: 'updates-pill' + (jobActiveThis ? ' is-accent' : ['failed', 'restore-failed', 'unknown', 'restored'].includes(job.state) ? ' is-error' : '') }, jobLabel(job)),
              job.to && h('span', { className: 'updates-mono' }, (isSuite ? 'dsh-suite ' : '') + job.from + ' → ' + job.to),
              jobReason && h('span', { className: 'updates-inline-msg is-error' }, message(jobReason)))
            : actionableUpdate ? h(React.Fragment, null,
              h('span', { className: 'updates-pill is-accent' }, isSuite ? t('Suite 新版本', 'Suite update') : t('有新版本', 'Update available')),
              h('span', { className: 'updates-mono' }, (isSuite ? 'dsh-suite ' : '') + 'v' + row.version + ' → v' + row.release.version),
              lockHint && h('span', { className: 'w-muted' }, '· ' + lockHint)) : null,
          error && h('span', { className: 'updates-inline-msg is-error', role: 'alert' }, message(error))),
        h('div', { className: 'updates-bar-actions' },
          staleWindows && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDialog('windows') }, t('确认已关闭窗口', 'Confirm closed windows')),
          canCancel && h(W.Button, { className: 'is-sm', disabled: job?.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update')),
          !jobActiveThis && error === 'check-first' && managed && recheckButton(actionableUpdate ? 'ghost' : 'primary'),
          !jobActiveThis && actionableUpdate && row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
          !jobActiveThis && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('明天再提醒', 'Remind me tomorrow')),
          !jobActiveThis && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版', 'Ignore')),
          !jobActiveThis && actionableUpdate && primary,
          !jobActiveThis && !actionableUpdate && canSuggestAuto && h(W.Button, { variant: 'primary', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('开启空闲自动热更新', 'Enable idle auto-updates')),
          !jobActiveThis && !actionableUpdate && !unconfirmed && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => { setError(''); setNotesOpen(false); if (job) setDismissedJobId(job.id); } }, t('关闭', 'Dismiss')))) },
        notesSection, windowsDialog, confirmDialog);
    }
    function progress() {
      if (!job || (!jobActiveThis && !unconfirmed && dismissedJobId === job.id)) return null;
      if (job.state === 'complete' && !jobReason) {
        return job.to ? h('div', null,
          h('p', { className: 'w-muted updates-note' }, '✓ ' + jobLabel(job) + ' · ' + job.from + ' → ' + job.to + (job.mode === 'automatic' ? t(' · 自动更新', ' · Automatic update') : '')),
          canSuggestAuto && h('div', { className: 'updates-auto-nudge' },
            h('span', null, t('以后有兼容新版本时，需要空闲自动热更新吗？', 'Auto-install future compatible updates while idle?')),
            h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('开启空闲自动热更新', 'Enable idle auto-updates')),
            h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDismissedJobId(job.id) }, t('关闭', 'Dismiss')))) : null;
      }
      return h('section', { className: 'w-section', role: 'status', 'aria-label': t('更新进度', 'Update progress') },
        h('h3', null, jobLabel(job)),
        job.to && h('p', { className: 'w-muted' }, job.from + ' → ' + job.to + (job.mode === 'automatic' ? t(' · 自动更新', ' · Automatic update') : '')),
        job.state === 'restart-required' && jobResult?.restartReason === 'package-moved' && h('p', { className: 'w-muted updates-note' }, t('新版已就绪；因多个独立插件共用底层依赖，请先手动重启一次 DSH 生效后再继续更新其他插件。', 'Installed; because standalone plugins share dependencies, restart DSH once before updating additional plugins.')),
        jobReason && h(W.Status, { tone: 'error' }, message(jobReason)),
        h('div', { className: 'updates-bar-actions', style: { marginTop: '6px' } },
          canCancel && h(W.Button, { className: 'is-sm', disabled: job.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update')),
          !jobActiveThis && !unconfirmed && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDismissedJobId(job.id) }, t('关闭提示', 'Dismiss'))));
    }
    function windowControls() {
      if (!staleWindows) return null;
      return h(W.Status, null, h('p', null, t('有窗口已断开，无法确认是否还有未保存修改。仍在使用的窗口请先保存并刷新；已关闭的窗口可以手动重新确认。', 'A disconnected window may contain unsaved changes. Save and refresh windows still in use. If they are closed, you can confirm that manually.')), h(W.Button, { className: 'is-sm', onClick: () => setDialog('windows') }, t('重新确认已关闭的窗口', 'Confirm closed windows')));
    }
    const incompatibleText = row.release && !row.release.compatible ? t('新版本暂不兼容当前环境：', 'Latest release is incompatible with this environment: ') + requirement(row.release) + (row.release.required ? ' (' + row.release.required + ')' : '') : '';
    const optionsSection = h('details', { className: 'updates-options' },
      h('summary', null, !original.bundledBy ? t('自动更新与提醒', 'Auto-update & reminders') : t('更新选项', 'Update options'), ' · ', prefs.checkEnabled ? t('自动检查：开', 'Checks: on') : t('自动检查：关', 'Checks: off'), ' · ', prefs.autoInstall ? (prefs.autoScope === 'compatible' ? t('空闲自动热更新：兼容版', 'Idle auto-update: compatible') : t('空闲自动热更新：仅补丁', 'Idle auto-update: patches')) : t('空闲自动热更新：关', 'Idle auto-update: off')),
      h('section', { className: 'updates-settings', 'aria-label': t('这个插件的更新偏好', 'Update preferences for this plugin') },
        h('div', null, h(W.Switch, { label: isSuite ? t('自动检查 Suite 整包更新', 'Automatically check Suite updates') : t('自动检查这个插件的更新', 'Automatically check this plugin'), checked: prefs.checkEnabled, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => perform(() => save({ checkEnabled: event.target.checked })) }), h('p', { className: 'w-muted updates-note' }, t('默认开启，每 6 小时最多一次。只影响这个安装包，关闭后仍可手动检查。', 'On by default, at most every 6 hours. This affects only this bundle; manual checks remain available.'))),
        h('div', null, h(W.Switch, { label: isSuite ? t('空闲时自动热更新 Suite 兼容版本', 'Auto-install compatible Suite updates while idle') : t('空闲时自动热更新兼容版本', 'Auto-install compatible updates while idle'), checked: prefs.autoInstall, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => event.target.checked ? (setError(''), setDialog('automatic')) : perform(() => save({ autoInstall: false })) }), h('p', { className: 'w-muted updates-note' }, t('默认关闭。明确开启后，仅在空闲且无未保存修改时热更新兼容稳定版（含功能小版本与补丁，不含跨主版本）。其他插件的开关不变。', 'Off by default. Explicitly enable compatible stable updates (minor and patch, excluding major) while idle with no unsaved changes. Other plugins’ settings stay unchanged.')), prefs.autoInstall && prefs.autoScope !== 'compatible' && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('升级为包含兼容功能小版本', 'Include compatible minor updates')))));
    const errorStatus = error && h(W.Status, { tone: 'error' }, error === 'check-first' && managed ? h('div', { className: 'updates-bar-actions' }, h('span', null, message(error)), recheckButton('ghost')) : message(error));
    const linksNav = (() => {
      const ownRepo = repoUrl(original.name), suiteRepo = repoUrl('@stardustlc/dsh-suite'), starRepo = isSuite ? suiteRepo : ownRepo;
      if (!ownRepo && !starRepo) return null;
      return h('nav', { className: 'updates-links', 'aria-label': t('开源仓库与反馈', 'Repository and feedback') },
        starRepo && h('a', { href: starRepo, target: '_blank', rel: 'noreferrer noopener' }, isSuite ? t('★ 觉得好用？在 GitHub 给 dsh-suite 点个 Star', '★ Useful? Star dsh-suite on GitHub') : t('★ 觉得好用？在 GitHub 点个 Star', '★ Useful? Star on GitHub')),
        ownRepo && h('a', { href: ownRepo + '/issues', target: '_blank', rel: 'noreferrer noopener' }, t('提交建议 / 问题反馈', 'Feedback & issues')),
        isSuite && original.name !== '@stardustlc/dsh-suite' && ownRepo && h('a', { href: ownRepo, target: '_blank', rel: 'noreferrer noopener' }, t('组件仓库', 'Component repo')),
        !isSuite && suiteRepo && h('a', { href: suiteRepo, target: '_blank', rel: 'noreferrer noopener' }, t('了解 dsh-suite（18 合 1 组合包）', 'Explore dsh-suite (18-in-1 bundle)')));
    })();
    if (!original.bundledBy) {
      // Native bundle detail pages in DSH already render their own Version & Source sections
      // ("重新检查", version list & "更新" button). Keep only non-duplicative auto-update preferences,
      // inline changelog notes, compatibility/error diagnostics, and GitHub feedback links here.
      return h(FooterFrame, { name, label: title, supplement: true, head: h('div', { className: 'updates-compact-bar' },
        optionsSection,
        (row.release || (showUpdate && (!deferred || !ignored))) && h('div', { className: 'updates-head-actions' },
          row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
          showUpdate && !deferred && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('推迟提醒 24h', 'Snooze 24h')),
          showUpdate && !ignored && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版提醒', 'Mute reminder')))) },
        notesSection,
        incompatibleText && h(W.Status, null, incompatibleText),
        errorStatus, snapshot.preferenceError && h(W.Status, { tone: 'error' }, message('preferences-unreadable')),
        snapshot.pendingRestart && h(W.Status, null, snapshot.updaterRestart ? message('restart-required') : t('已有插件更新等待手动重启后生效；空闲自动热更新已暂停，建议先重启一次 DSH 再继续更新其他共用依赖的插件。', 'An update awaits a manual restart; idle auto-updates are paused. Restart DSH once before updating other plugins that share dependencies.')),
        prefs.autoInstall && snapshot.autoReady === false && h(W.Status, null, message('page-not-ready')),
        (prefs.autoInstall || jobActiveThis) && windowControls(),
        jobActiveThis && (snapshot.pages.dirty || ownPage.dirty) && h(W.Status, null, message('page-dirty')),
        jobActiveThis && (snapshot.activity.busy || pageBusy) && h(W.Status, null, message(snapshot.activity.busy ? 'busy' : 'page-busy')),
        deferred && h('p', { className: 'w-muted updates-note' }, t('已推迟此插件的工作台更新提示 24 小时。', 'Workbench update notices for this plugin are snoozed for 24 hours.')),
        unconfirmed && h(W.Status, { tone: 'error' }, message('operation-unconfirmed')),
        progress(),
        linksNav,
        windowsDialog, confirmDialog
      );
    }
    const status = !managed ? t('本地 / 外部来源，保留原安装方式', 'Local / external source; keep original install method') : row.loadError ? t('加载异常，请先检查原生插件管理', 'Loading error; check native plugin management') : row.error ? t('检查失败，可以重试', 'Check failed; retry available') : incompatibleText || (row.available ? (ignored ? t('已忽略提醒，仍可手动更新', 'Reminder ignored; manual update available') : t('有兼容的新版本', 'Compatible update available')) : row.checkedAt ? t('当前已是最新稳定版', 'Latest stable version') : t('尚未检查', 'Not checked yet'));
    return h(FooterFrame, { name, label: title, head: h('div', { className: 'updates-head' },
      h('div', null,
        h('div', { className: 'updates-title-row' }, h('h2', null, t('随 Suite 整包管理', 'Managed via Suite bundle')), h('span', { className: 'updates-mono updates-badge' }, original.name + ' · v' + original.version)),
        h('p', { className: 'w-muted updates-meta-line' }, status, row.checkedAt ? ' · ' + t('上次检查：', 'Last checked: ') + new Date(row.checkedAt).toLocaleString(language() === 'en' ? 'en-US' : 'zh-CN') : ''),
        h('p', { className: 'updates-version updates-note' }, target + ' · v' + row.version, row.release?.version && row.release.version !== row.version ? ' → v' + row.release.version : '')),
      h('div', { className: 'updates-head-actions' },
        showUpdate && checkButton('ghost'),
        row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
        showUpdate && !deferred && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('明天再提醒', 'Remind me tomorrow')),
        showUpdate && !ignored && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版本提醒', 'Ignore this reminder')),
        primary)) },
      notesSection,
      optionsSection,
      errorStatus, snapshot.preferenceError && h(W.Status, { tone: 'error' }, message('preferences-unreadable')),
      snapshot.pendingRestart && h(W.Status, null, snapshot.updaterRestart ? message('restart-required') : t('已有插件更新等待手动重启后生效；空闲自动热更新已暂停。', 'An update awaits a manual restart; idle auto-updates are paused.')),
      prefs.autoInstall && snapshot.autoReady === false && h(W.Status, null, message('page-not-ready')),
      windowControls(),
      (showUpdate || jobActiveThis) && (snapshot.pages.dirty || ownPage.dirty) && h(W.Status, null, message('page-dirty')),
      (showUpdate || jobActiveThis) && (snapshot.activity.busy || pageBusy) && h(W.Status, null, message(snapshot.activity.busy ? 'busy' : 'page-busy')),
      deferred && h(W.Status, null, t('已推迟 Suite 提醒和自动安装 24 小时，仍可手动更新。', 'Suite reminders and automatic installation are deferred for 24 hours. Manual updates remain available.')),
      unconfirmed && h(W.Status, { tone: 'error' }, message('operation-unconfirmed')),
      progress(),
      linksNav,
      windowsDialog, confirmDialog
    );
  }
  function InlineFooter({ name }) { return h(Panel, { name, inline: true }); }
  function NativeFooter({ subject }) {
    const snapshot = useSnapshot(), name = __stardustUpdatesDetailName(subject, snapshot?.rows || []);
    return name ? h(Panel, { name, inline: false }) : null;
  }
  function register() {
    if (!alive) return;
    if (!registered) {
      registered = true; pool.clients.add(client);
      ctx.slots.inject('plugins.detail.section', () => ctx.slots.register({ name: 'plugins.detail.section', id: 'stardustlc.plugin-update-footer', order: 1000 }, NativeFooter));
      notify();
    }
  }
  async function poll() {
    if (inPoll || !alive || !shared.refs.size) return;
    inPoll = true;
    try { await refresh(); register(); await heartbeat(); }
    catch { /* Owner-only controls stay absent for guests and unsupported hosts. */ }
    finally { inPoll = false; }
  }
  const timer = setInterval(() => { void poll(); }, 15000), first = setTimeout(() => { void poll(); }, 100);
  const client = { t, Footer: InlineFooter, NativeFooter, Button: W.Button, open(name) { const footer = [...document.querySelectorAll('[data-plugin-update-footer]')].find(node => node.getAttribute('data-plugin-update-footer') === name); if (!footer) return false; footer.scrollIntoView({ block: 'end', behavior: 'smooth' }); return true; }, has: name => registered && !!originalRow(name), row: rowFor, dispose() {
    close(); alive = false; clearTimeout(first); clearInterval(timer); pool.clients.delete(client);
    pool.listeners.delete(guardChanged); listeners.clear();
    for (const event of ['pointerdown', 'keydown', 'input']) document.removeEventListener(event, interaction, true);
    window.removeEventListener('pagehide', close);
    for (const controller of requests) controller.abort();
    for (const listener of pool.viewListeners) listener();
  } };
  return client;
}

/* STARDUSTLC_UPDATE_CLIENT_BODY_START */
// Generated from templates/client.js, templates/panels/, templates/style-switcher.js, templates/themes-and-motion.css and templates/workbench-ui.js. Edit the sources.
(function () {
const DSH_THEMES_AND_MOTION_CSS = "/* ==========================================================================\n * DeepSeek Harness (>=0.2.2-rc.3) Unified Workbench Themes & Motion System\n * Shared across STARDUSTLC666 workbench plugins:\n *   dsh-email, dsh-calendar, dsh-cite, dsh-dream, dsh-code-security,\n *   dsh-rss, dsh-ppt, dsh-remotion, dsh-hyperframes\n *\n * Design Principles:\n * 1. NEVER TOO DARK: Airy daylight defaults; when host `body[data-ds-dark-theme]`\n *    is active under `harness`, soften to breathable slate (#1f232b / #272c36),\n *    never pitch black (#000 / #090a0f / #151517).\n * 2. 5 SWITCHABLE PRESETS via `[data-dsh-style]`:\n *    - `harness`   (原生清透 / Native Airy)\n *    - `cream`     (米白纸感 / Warm Cream)\n *    - `claude`    (Claude 暖书卷 / Claude Warmth)\n *    - `pixel8bit` (8-Bit 像素 / Bright 8-Bit)\n *    - `mint`      (晴空薄荷 / Airy Mint)\n * 3. PORTALED OVERLAY SYNC: Selectors match both `[data-dsh-style=\"...\"]` roots\n *    AND portaled `[role=\"dialog\"]` / `[role=\"menu\"]` containers carrying or\n *    wrapping `[data-dsh-style=\"...\"]`.\n * 4. COMPOSITOR MOTION & ICON MICRO-ANIMATIONS with full `prefers-reduced-motion`\n *    and `forced-colors` compliance.\n * ========================================================================== */\n\n/* --------------------------------------------------------------------------\n * 1. Motion Timing & Base Token Fallbacks (Standalone + Host Safe)\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) {\n  --dsh-ease-out: cubic-bezier(0.22, 1, 0.36, 1);\n  --dsh-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);\n  /* Standard cubic-bezier fallback before linear() physics spring */\n  --dsh-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);\n  --dsh-motion-fast: 140ms;\n  --dsh-motion-base: 200ms;\n  --dsh-motion-dialog: 220ms;\n  --dsh-control-border-width: 0.5px;\n  --dsh-button-shadow: none;\n  --dsh-button-hover-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);\n  --dsh-card-hover-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);\n}\n\n@supports (transition-timing-function: linear(0, 1)) {\n  :where([data-dsh-style]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) {\n    --dsh-ease-spring: linear(\n      0, 0.402 7.4%, 0.711 15.3%, 0.929 23.7%, 1.008 28.2%,\n      1.067 33%, 1.099 36.9%, 1.12 41%, 1.13 45.4%, 1.13 50.1%,\n      1.111 58.5%, 1.019 83.2%, 1.004 91.3%, 1\n    );\n  }\n}\n\n/* Electron / macOS 0.2.2+ window-drag-regions rule:\n * Exclude ONLY the visible overlay owner box itself (never `[data-window-drag-exclude] *`,\n * so scrolled/clipped descendants cannot register offscreen no-drag rects over headers). */\n[data-window-drag-exclude] {\n  -webkit-app-region: no-drag;\n}\n\n/* --------------------------------------------------------------------------\n * 2. Preset 1: `harness` — 原生清透 / Native Airy\n *    - Daylight: crisp airy white & mist slate; defers to host tokens when set,\n *      with bright standalone fallbacks for tests/previews.\n *    - Host Dark (`body[data-ds-dark-theme]`): softened breathable slate\n *      (`#1f232b` / `#272c36`), overriding DSH's near-black `#151517`.\n * -------------------------------------------------------------------------- */\n:where(body:not([data-ds-dark-theme])) [data-dsh-style=\"harness\"],\n:where(body:not([data-ds-dark-theme])) :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style=\"harness\"]) {\n  color-scheme: light;\n  accent-color: var(--dsw-alias-state-business-primary, #4176e6);\n}\n\n/* Standalone fallbacks when host ui-theme stylesheet is not mounted (e.g. jsdom / preview) */\n:root:not([data-dsh-host-tokens]) [data-dsh-style=\"harness\"] {\n  --dsw-radius-xs: 6px;\n  --dsw-radius-sm: 8px;\n  --dsw-radius-md: 12px;\n  --dsw-radius-lg: 16px;\n  --dsw-radius-xl: 20px;\n}\n\nbody:not([data-ds-dark-theme]) [data-dsh-style=\"harness\"] {\n  --dsh-surface-spotlight: rgba(65, 118, 230, 0.06);\n}\n\n/* NEVER TOO DARK: Soft breathable slate when host dark mode is active in `harness` mode */\nbody[data-ds-dark-theme] [data-dsh-style=\"harness\"],\nbody[data-ds-dark-theme] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"harness\"], :has([data-dsh-style=\"harness\"])) {\n  color-scheme: dark;\n  accent-color: #7aaaff;\n  --dsw-alias-bg-base: #1f232b;\n  --dsw-alias-bg-layer-1: #272c36;\n  --dsw-alias-bg-layer-2: #2f3542;\n  --dsw-alias-bg-layer-3: #373e4d;\n  --dsw-alias-bg-overlay: #2a303c;\n  --dsw-alias-bg-module-platform: #2c323e;\n  --dsw-alias-settings-card-fill: #262b35;\n  --dsw-alias-settings-card-stroke: rgba(226, 232, 240, 0.12);\n  --dsw-specific-menu: rgba(39, 44, 54, 0.96);\n  --dsw-alias-border-l1: rgba(226, 232, 240, 0.09);\n  --dsw-alias-border-l2: rgba(226, 232, 240, 0.15);\n  --dsw-alias-border-l3: rgba(226, 232, 240, 0.22);\n  --dsw-alias-border-l4: rgba(226, 232, 240, 0.28);\n  --dsw-alias-label-primary: #eef2f7;\n  --dsw-alias-label-secondary: #b6c0cf;\n  --dsw-alias-label-tertiary: #8d98ab;\n  --dsw-alias-label-dimmed: #737e91;\n  --dsw-alias-brand-primary: #7aaaff;\n  --dsw-alias-brand-text: #eef2f7;\n  --dsw-alias-state-business-primary: #7aaaff;\n  --dsw-alias-state-business-tertiary: rgba(122, 170, 255, 0.16);\n  --dsw-alias-link: #8bb6ff;\n  --dsw-alias-button-primary-fill: #5b8def;\n  --dsw-alias-button-primary-hover: #6f9cf4;\n  --dsw-alias-button-primary-ink: #ffffff;\n  --dsw-alias-interactive-bg-hover: rgba(226, 232, 240, 0.07);\n  --dsw-alias-interactive-bg-active: rgba(226, 232, 240, 0.13);\n  --dsw-alias-interactive-bg-hover-accent: rgba(122, 170, 255, 0.15);\n  --dsw-alias-interactive-bg-hover-danger: rgba(248, 113, 113, 0.16);\n  --dsw-alias-state-error-primary: #f87171;\n  --dsw-alias-state-warn-primary: #fbbf24;\n  --dsw-alias-state-warn-label: #fcd34d;\n  --dsw-alias-state-warn-tertiary: rgba(251, 191, 36, 0.15);\n  --dsw-alias-state-success-primary: #4ade80;\n  --dsw-elevation-panel: 0 4px 16px rgba(10, 14, 22, 0.28), 0 0 0 1px rgba(226, 232, 240, 0.12);\n  --dsw-elevation-prominent: 0 14px 38px rgba(10, 14, 22, 0.42), 0 0 0 1px rgba(226, 232, 240, 0.16);\n  --dsh-button-hover-shadow: 0 2px 8px rgba(10, 14, 22, 0.25);\n  --dsh-card-hover-shadow: 0 8px 22px rgba(10, 14, 22, 0.32);\n  --dsh-surface-spotlight: rgba(122, 170, 255, 0.10);\n}\n\n/* --------------------------------------------------------------------------\n * 3. Preset 2: `cream` — 米白纸感 / Warm Cream\n *    (#FAF7F0 / #F3EFE4 paper surfaces, #2B2620 ink, warm amber/sand accents)\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"cream\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"cream\"], :has([data-dsh-style=\"cream\"])) {\n  color-scheme: light;\n  accent-color: #9e5829;\n  --dsw-alias-bg-base: #faf7f0;\n  --dsw-alias-bg-layer-1: #f3efe4;\n  --dsw-alias-bg-layer-2: #eae3d3;\n  --dsw-alias-bg-layer-3: #e0d7c3;\n  --dsw-alias-bg-overlay: #fcfaf4;\n  --dsw-alias-bg-module-platform: #efe9da;\n  --dsw-alias-settings-card-fill: #f5f1e6;\n  --dsw-alias-settings-card-stroke: #dfd5be;\n  --dsw-specific-menu: rgba(252, 250, 244, 0.97);\n  --dsw-alias-border-l1: #e6dec8;\n  --dsw-alias-border-l2: #d4c8ae;\n  --dsw-alias-border-l3: #c0b193;\n  --dsw-alias-border-l4: #ad9c7c;\n  --dsw-alias-label-primary: #2b2620;\n  --dsw-alias-label-secondary: #655b4e;\n  --dsw-alias-label-tertiary: #857968;\n  --dsw-alias-label-dimmed: #9c907f;\n  --dsw-alias-brand-primary: #9e5829;\n  --dsw-alias-brand-text: #2b2620;\n  --dsw-alias-state-business-primary: #a65e2e;\n  --dsw-alias-state-business-tertiary: rgba(166, 94, 46, 0.13);\n  --dsw-alias-link: #934e20;\n  --dsw-alias-button-primary-fill: #9e5829;\n  --dsw-alias-button-primary-hover: #86481e;\n  --dsw-alias-button-primary-ink: #fffdf9;\n  --dsw-alias-interactive-bg-hover: rgba(108, 84, 50, 0.075);\n  --dsw-alias-interactive-bg-active: rgba(166, 94, 46, 0.14);\n  --dsw-alias-interactive-bg-hover-accent: rgba(166, 94, 46, 0.12);\n  --dsw-alias-interactive-bg-hover-danger: rgba(185, 56, 44, 0.11);\n  --dsw-alias-state-error-primary: #b9382c;\n  --dsw-alias-state-warn-primary: #b45309;\n  --dsw-alias-state-warn-label: #8c3d08;\n  --dsw-alias-state-warn-tertiary: #fdefd6;\n  --dsw-alias-state-success-primary: #2a6f4e;\n  --dsw-radius-xs: 6px;\n  --dsw-radius-sm: 9px;\n  --dsw-radius-md: 13px;\n  --dsw-radius-lg: 16px;\n  --dsw-radius-xl: 20px;\n  --dsw-elevation-panel: 0 3px 12px rgba(68, 52, 32, 0.07), 0 0 0 1px rgba(180, 164, 138, 0.35);\n  --dsw-elevation-prominent: 0 14px 34px rgba(68, 52, 32, 0.14), 0 2px 6px rgba(68, 52, 32, 0.06), 0 0 0 1px rgba(180, 164, 138, 0.42);\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: 0 2px 6px rgba(84, 62, 34, 0.09);\n  --dsh-card-hover-shadow: 0 8px 20px rgba(84, 62, 34, 0.10);\n  --dsh-surface-spotlight: rgba(166, 94, 46, 0.08);\n}\n\n/* --------------------------------------------------------------------------\n * 4. Preset 3: `claude` — Claude 暖书卷 / Claude Warmth\n *    (#F5F4ED / #ECE9DF parchment, #C96442 terracotta accent, editorial warmth)\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"claude\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"claude\"], :has([data-dsh-style=\"claude\"])) {\n  color-scheme: light;\n  accent-color: #c96442;\n  --dsw-alias-bg-base: #f5f4ed;\n  --dsw-alias-bg-layer-1: #ece9df;\n  --dsw-alias-bg-layer-2: #e3dfd2;\n  --dsw-alias-bg-layer-3: #d8d3c3;\n  --dsw-alias-bg-overlay: #faf9f4;\n  --dsw-alias-bg-module-platform: #e7e3d6;\n  --dsw-alias-settings-card-fill: #efece2;\n  --dsw-alias-settings-card-stroke: #dad5c6;\n  --dsw-specific-menu: rgba(250, 249, 244, 0.97);\n  --dsw-alias-border-l1: #e2ded0;\n  --dsw-alias-border-l2: #d0cbc0;\n  --dsw-alias-border-l3: #bcb6a7;\n  --dsw-alias-border-l4: #a69f8f;\n  --dsw-alias-label-primary: #1f1e1b;\n  --dsw-alias-label-secondary: #5d5a51;\n  --dsw-alias-label-tertiary: #7b776c;\n  --dsw-alias-label-dimmed: #948f83;\n  --dsw-alias-brand-primary: #c96442;\n  --dsw-alias-brand-text: #1f1e1b;\n  --dsw-alias-state-business-primary: #c96442;\n  --dsw-alias-state-business-tertiary: rgba(201, 100, 66, 0.14);\n  --dsw-alias-link: #b35030;\n  --dsw-alias-button-primary-fill: #c96442;\n  --dsw-alias-button-primary-hover: #b25232;\n  --dsw-alias-button-primary-ink: #faf9f5;\n  --dsw-alias-interactive-bg-hover: rgba(31, 30, 27, 0.055);\n  --dsw-alias-interactive-bg-active: rgba(201, 100, 66, 0.14);\n  --dsw-alias-interactive-bg-hover-accent: rgba(201, 100, 66, 0.11);\n  --dsw-alias-interactive-bg-hover-danger: rgba(180, 48, 42, 0.11);\n  --dsw-alias-state-error-primary: #b4302a;\n  --dsw-alias-state-warn-primary: #b85d19;\n  --dsw-alias-state-warn-label: #8c430c;\n  --dsw-alias-state-warn-tertiary: #f7e8d6;\n  --dsw-alias-state-success-primary: #2d6a4f;\n  --dsw-radius-xs: 7px;\n  --dsw-radius-sm: 10px;\n  --dsw-radius-md: 14px;\n  --dsw-radius-lg: 18px;\n  --dsw-radius-xl: 22px;\n  --dsw-elevation-panel: 0 3px 14px rgba(31, 30, 27, 0.06), 0 0 0 1px rgba(145, 139, 126, 0.28);\n  --dsw-elevation-prominent: 0 16px 38px rgba(31, 30, 27, 0.13), 0 2px 8px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(145, 139, 126, 0.34);\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: 0 2px 7px rgba(31, 30, 27, 0.08);\n  --dsh-card-hover-shadow: 0 8px 22px rgba(31, 30, 27, 0.09);\n  --dsh-surface-spotlight: rgba(201, 100, 66, 0.08);\n}\n\n/* Subtle editorial serif warmth on primary workbench/dialog headings in Claude preset */\n[data-dsh-style=\"claude\"] :where(header h1, [data-dsh-editorial-heading]),\n:where([role=\"dialog\"], dialog):where([data-dsh-style=\"claude\"], :has([data-dsh-style=\"claude\"])) header h2 {\n  font-family: \"Iowan Old Style\", \"Georgia\", \"Songti SC\", \"Noto Serif SC\", var(--dsw-font-family, serif);\n  letter-spacing: -0.01em;\n}\n\n/* --------------------------------------------------------------------------\n * 5. Preset 4: `pixel8bit` — 8-Bit 像素 / Bright 8-Bit\n *    (#F4F6E8 / #E7EED2 pastel arcade, #1E2826 ink, #2E7D5B & #D95B43 accents,\n *     0px radius, 2px solid crisp borders, 2px 2px 0 pixel shadow,\n *     stepped translate(1px, 1px) press — bright & legible!)\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"pixel8bit\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) {\n  color-scheme: light;\n  accent-color: #2e7d5b;\n  --dsw-alias-bg-base: #f4f6e8;\n  --dsw-alias-bg-layer-1: #e7eed2;\n  --dsw-alias-bg-layer-2: #dbe5c0;\n  --dsw-alias-bg-layer-3: #cedaad;\n  --dsw-alias-bg-overlay: #f9fbf0;\n  --dsw-alias-bg-module-platform: #e2ebc9;\n  --dsw-alias-settings-card-fill: #edf2dc;\n  --dsw-alias-settings-card-stroke: #1e2826;\n  --dsw-specific-menu: #f9fbf0;\n  --dsw-alias-border-l1: #7e9478;\n  --dsw-alias-border-l2: #1e2826;\n  --dsw-alias-border-l3: #1e2826;\n  --dsw-alias-border-l4: #1e2826;\n  --dsw-alias-label-primary: #1e2826;\n  --dsw-alias-label-secondary: #3d514c;\n  --dsw-alias-label-tertiary: #58706a;\n  --dsw-alias-label-dimmed: #6e857f;\n  --dsw-alias-brand-primary: #2e7d5b;\n  --dsw-alias-brand-text: #1e2826;\n  --dsw-alias-state-business-primary: #2e7d5b;\n  --dsw-alias-state-business-tertiary: rgba(46, 125, 91, 0.18);\n  --dsw-alias-link: #226448;\n  --dsw-alias-button-primary-fill: #2e7d5b;\n  --dsw-alias-button-primary-hover: #24674a;\n  --dsw-alias-button-primary-ink: #f4f6e8;\n  --dsw-alias-interactive-bg-hover: #dfe9c4;\n  --dsw-alias-interactive-bg-active: #cfe0ad;\n  --dsw-alias-interactive-bg-hover-accent: rgba(46, 125, 91, 0.16);\n  --dsw-alias-interactive-bg-hover-danger: rgba(217, 91, 67, 0.18);\n  --dsw-alias-state-error-primary: #d95b43;\n  --dsw-alias-state-warn-primary: #c47614;\n  --dsw-alias-state-warn-label: #7a4808;\n  --dsw-alias-state-warn-tertiary: #f6e7b4;\n  --dsw-alias-state-success-primary: #2e7d5b;\n  --dsh-pixel-accent-secondary: #d95b43;\n  --dsw-radius-xs: 0px;\n  --dsw-radius-sm: 0px;\n  --dsw-radius-md: 0px;\n  --dsw-radius-lg: 0px;\n  --dsw-radius-xl: 0px;\n  --dsw-corner-shape: square;\n  --dsw-elevation-panel: 3px 3px 0px #1e2826;\n  --dsw-elevation-prominent: 4px 4px 0px #1e2826;\n  --dsh-control-border-width: 2px;\n  --dsh-button-shadow: 2px 2px 0px #1e2826;\n  --dsh-button-hover-shadow: 3px 3px 0px #1e2826;\n  --dsh-card-hover-shadow: 4px 4px 0px #1e2826;\n  --dsh-surface-spotlight: rgba(46, 125, 91, 0.12);\n}\n\n/* Crisp 0px corners, 2px solid borders, and arcade shadows in `pixel8bit` */\n[data-dsh-style=\"pixel8bit\"] :where(button, input, select, textarea, [role=\"button\"], [role=\"tab\"], [role=\"menuitem\"], [role=\"menuitemradio\"], [data-dsh-card], [data-dsh-panel]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button, input, select, textarea, [role=\"menuitem\"], [role=\"menuitemradio\"]) {\n  border-radius: 0px !important;\n  corner-shape: square;\n}\n\n[data-dsh-style=\"pixel8bit\"] :where(button:not([role=\"tab\"]), .dsh-btn),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]), .dsh-btn) {\n  border: 2px solid #1e2826;\n  box-shadow: 2px 2px 0px #1e2826;\n}\n\n[data-dsh-style=\"pixel8bit\"] :where(input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]), select, textarea),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]), select, textarea) {\n  border-width: 2px;\n  border-color: #1e2826;\n}\n\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) {\n  border: 2px solid #1e2826 !important;\n  box-shadow: 4px 4px 0px #1e2826 !important;\n  backdrop-filter: none;\n}\n\n[data-dsh-style=\"pixel8bit\"] [role=\"tab\"][aria-selected=\"true\"]::after {\n  border-block-end-color: #d95b43;\n  border-block-end-width: 3px;\n}\n\n/* --------------------------------------------------------------------------\n * 6. Preset 5: `mint` — 晴空薄荷 / Airy Mint\n *    (#F5FAFB / #EAF3F6 breeze surfaces, #0F766E teal & #0284C7 sky accents)\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"mint\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"mint\"], :has([data-dsh-style=\"mint\"])) {\n  color-scheme: light;\n  accent-color: #0f766e;\n  --dsw-alias-bg-base: #f5fafb;\n  --dsw-alias-bg-layer-1: #eaf3f6;\n  --dsw-alias-bg-layer-2: #dcebf0;\n  --dsw-alias-bg-layer-3: #cce1e8;\n  --dsw-alias-bg-overlay: #fafdff;\n  --dsw-alias-bg-module-platform: #e3eff3;\n  --dsw-alias-settings-card-fill: #eef6f8;\n  --dsw-alias-settings-card-stroke: #c7dde5;\n  --dsw-specific-menu: rgba(250, 253, 255, 0.97);\n  --dsw-alias-border-l1: #d5e6ec;\n  --dsw-alias-border-l2: #bdd5de;\n  --dsw-alias-border-l3: #9ec0cd;\n  --dsw-alias-border-l4: #7faab9;\n  --dsw-alias-label-primary: #132a2e;\n  --dsw-alias-label-secondary: #426067;\n  --dsw-alias-label-tertiary: #628088;\n  --dsw-alias-label-dimmed: #7c98a0;\n  --dsw-alias-brand-primary: #0f766e;\n  --dsw-alias-brand-text: #132a2e;\n  --dsw-alias-state-business-primary: #0f766e;\n  --dsw-alias-state-business-tertiary: rgba(15, 118, 110, 0.13);\n  --dsw-alias-link: #0284c7;\n  --dsw-alias-button-primary-fill: #0f766e;\n  --dsw-alias-button-primary-hover: #0d635c;\n  --dsw-alias-button-primary-ink: #f5fafb;\n  --dsw-alias-interactive-bg-hover: rgba(15, 118, 110, 0.07);\n  --dsw-alias-interactive-bg-active: rgba(15, 118, 110, 0.13);\n  --dsw-alias-interactive-bg-hover-accent: rgba(2, 132, 199, 0.11);\n  --dsw-alias-interactive-bg-hover-danger: rgba(200, 50, 64, 0.11);\n  --dsw-alias-state-error-primary: #c83240;\n  --dsw-alias-state-warn-primary: #b4690e;\n  --dsw-alias-state-warn-label: #864c07;\n  --dsw-alias-state-warn-tertiary: #fdf1d6;\n  --dsw-alias-state-success-primary: #0f766e;\n  --dsh-mint-sky-accent: #0284c7;\n  --dsw-radius-xs: 6px;\n  --dsw-radius-sm: 9px;\n  --dsw-radius-md: 12px;\n  --dsw-radius-lg: 16px;\n  --dsw-radius-xl: 20px;\n  --dsw-elevation-panel: 0 3px 12px rgba(15, 76, 92, 0.07), 0 0 0 1px rgba(127, 170, 185, 0.28);\n  --dsw-elevation-prominent: 0 14px 34px rgba(15, 76, 92, 0.13), 0 2px 6px rgba(15, 76, 92, 0.05), 0 0 0 1px rgba(127, 170, 185, 0.34);\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: 0 2px 7px rgba(15, 118, 110, 0.11);\n  --dsh-card-hover-shadow: 0 8px 22px rgba(2, 132, 199, 0.10);\n  --dsh-surface-spotlight: rgba(2, 132, 199, 0.08);\n}\n\n/* --------------------------------------------------------------------------\n * 7. Interactive Dynamics: Tactile Button Physics & Active States\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) :where(button, [role=\"button\"]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"]) {\n  /* Identity transforms prevent mid-interaction stacking-context shifts */\n  translate: 0px 0px;\n  scale: 1;\n  transition-property: background-color, border-color, color, box-shadow, opacity, translate, scale;\n  transition-duration: var(--dsh-motion-fast);\n  transition-timing-function: var(--dsh-ease-out);\n}\n\n/* Visible active style on open menu triggers (per `menu` guidance) */\n:where([data-dsh-style]) :where(button, [role=\"button\"])[aria-expanded=\"true\"]:not(:disabled):not([aria-disabled=\"true\"]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"])[aria-expanded=\"true\"]:not(:disabled):not([aria-disabled=\"true\"]) {\n  background-color: var(--dsw-alias-interactive-bg-active);\n  color: var(--dsw-alias-label-primary);\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  @media (hover: hover) {\n    :where([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]):not([role=\"switch\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]),\n    :where([role=\"dialog\"], [role=\"alertdialog\"], dialog):has([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]):not([role=\"switch\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]) {\n      translate: 0px -0.5px;\n    }\n\n    [data-dsh-style=\"pixel8bit\"] :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]),\n    :where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]) {\n      translate: -1px -1px;\n      box-shadow: 3px 3px 0px #1e2826;\n      transition-timing-function: steps(2, end);\n      transition-duration: 70ms;\n    }\n  }\n\n  /* Tactile spring press on non-pixel themes */\n  :where([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"switch\"]), [role=\"button\"]):active:not(:disabled):not([aria-disabled=\"true\"]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"switch\"]), [role=\"button\"]):active:not(:disabled):not([aria-disabled=\"true\"]) {\n    scale: 0.965;\n    translate: 0px 0.5px;\n    transition-duration: 80ms;\n  }\n\n  /* Stepped 8-Bit arcade press (`translate(1px, 1px)` + crisp 1px pixel shadow) */\n  [data-dsh-style=\"pixel8bit\"] :where(button:not([role=\"tab\"]):not([role=\"switch\"]), .dsh-btn):active:not(:disabled):not([aria-disabled=\"true\"]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]):not([role=\"switch\"]), .dsh-btn):active:not(:disabled):not([aria-disabled=\"true\"]) {\n    translate: 1px 1px !important;\n    scale: 1 !important;\n    box-shadow: 1px 1px 0px #1e2826 !important;\n    transition-timing-function: steps(2, end);\n    transition-duration: 50ms;\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 8. Small-Button SVG Icon Micro-Animations\n *    Works automatically with `svg[data-dsh-icon=\"<name>\"]` or `svg[data-icon=\"<name>\"]`\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) :where(button, [role=\"button\"], summary) svg,\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"], summary) svg {\n  translate: 0px 0px;\n  rotate: 0deg;\n  scale: 1;\n  transform-origin: center;\n}\n\n@keyframes dsh-icon-spin {\n  to {\n    rotate: 360deg;\n  }\n}\n\n@keyframes dsh-icon-wiggle {\n  0% { rotate: 0deg; }\n  25% { rotate: -12deg; }\n  55% { rotate: 10deg; }\n  80% { rotate: -5deg; }\n  100% { rotate: 0deg; }\n}\n\n@keyframes dsh-icon-pop {\n  0% { scale: 1; }\n  45% { scale: 1.26; }\n  75% { scale: 0.94; }\n  100% { scale: 1; }\n}\n\n@keyframes dsh-icon-bounce {\n  0%, 100% { translate: 0px 0px; }\n  45% { translate: 0px 2.5px; }\n  75% { translate: 0px -1px; }\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  :where([data-dsh-style]) :where(button, [role=\"button\"], summary) svg,\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"], summary) svg {\n    transition:\n      translate var(--dsh-motion-base) var(--dsh-ease-spring),\n      rotate 240ms var(--dsh-ease-spring),\n      scale var(--dsh-motion-base) var(--dsh-ease-spring);\n  }\n\n  /* 1) `down` / chevron: 180deg flip on `[aria-expanded=\"true\"]` or `details[open]` */\n  :where([data-dsh-style]) :where([aria-expanded=\"true\"], [data-open=\"true\"], details[open] > summary) :is(svg[data-dsh-icon=\"down\"], svg[data-dsh-icon=\"chevron-down\"], svg[data-icon=\"down\"], svg[data-icon=\"chevron-down\"]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog):has([data-dsh-style]) :where([aria-expanded=\"true\"], [data-open=\"true\"]) :is(svg[data-dsh-icon=\"down\"], svg[data-dsh-icon=\"chevron-down\"], svg[data-icon=\"down\"], svg[data-icon=\"chevron-down\"]) {\n    rotate: 180deg;\n  }\n\n  /* 2) `refresh` / `sync`: smooth 180deg spin on hover, continuous spin when busy */\n  :where([data-dsh-style]) :where(button, [role=\"button\"])[aria-busy=\"true\"] :is(svg[data-dsh-icon=\"refresh\"], svg[data-dsh-icon=\"sync\"], svg[data-icon=\"refresh\"], svg[data-icon=\"sync\"]),\n  :where([data-dsh-style]) :is(svg[data-dsh-icon=\"refresh\"], svg[data-icon=\"refresh\"])[data-spinning=\"true\"] {\n    animation: dsh-icon-spin 0.85s linear infinite;\n  }\n\n  @media (hover: hover) {\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"refresh\"], svg[data-dsh-icon=\"sync\"], svg[data-dsh-icon=\"reload\"], svg[data-icon=\"refresh\"], svg[data-icon=\"sync\"], svg[data-icon=\"reload\"]) {\n      rotate: 180deg;\n    }\n\n    /* 3) `plus` / `close`: crisp 90deg turn */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"plus\"], svg[data-dsh-icon=\"add\"], svg[data-dsh-icon=\"close\"], svg[data-dsh-icon=\"x\"], svg[data-icon=\"plus\"], svg[data-icon=\"add\"], svg[data-icon=\"close\"], svg[data-icon=\"x\"]) {\n      rotate: 90deg;\n    }\n\n    /* 4) `send` / `external` / `link`: forward/diagonal glide */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"], a):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"send\"], svg[data-dsh-icon=\"external\"], svg[data-dsh-icon=\"link\"], svg[data-icon=\"send\"], svg[data-icon=\"external\"], svg[data-icon=\"link\"]) {\n      translate: 2px -1.5px;\n    }\n\n    /* 5) `reply` / `left` / `undo`: leading glide */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"reply\"], svg[data-dsh-icon=\"left\"], svg[data-dsh-icon=\"undo\"], svg[data-icon=\"reply\"], svg[data-icon=\"left\"], svg[data-icon=\"undo\"]) {\n      translate: -2px 0px;\n    }\n\n    /* 6) `right` / `play`: trailing nudge & pulse */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"right\"], svg[data-icon=\"right\"]) {\n      translate: 2px 0px;\n    }\n\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"play\"], svg[data-icon=\"play\"]) {\n      translate: 1.5px 0px;\n      scale: 1.14;\n    }\n\n    /* 7) `trash` / `delete`: tactile warning wiggle */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"trash\"], svg[data-dsh-icon=\"delete\"], svg[data-icon=\"trash\"], svg[data-icon=\"delete\"]) {\n      animation: dsh-icon-wiggle 360ms var(--dsh-ease-in-out);\n    }\n\n    /* 8) `star` / `check` / `copy` / `bookmark`: spring pop */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"star\"], svg[data-dsh-icon=\"check\"], svg[data-dsh-icon=\"copy\"], svg[data-dsh-icon=\"bookmark\"], svg[data-icon=\"star\"], svg[data-icon=\"check\"], svg[data-icon=\"copy\"], svg[data-icon=\"bookmark\"]) {\n      scale: 1.18;\n    }\n\n    /* 9) `download` / `export`: vertical bounce */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"download\"], svg[data-dsh-icon=\"export\"], svg[data-icon=\"download\"], svg[data-icon=\"export\"]) {\n      animation: dsh-icon-bounce 420ms var(--dsh-ease-out);\n    }\n\n    /* 10) `palette` / `sparkles` / `edit`: playful tilt */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"palette\"], svg[data-dsh-icon=\"sparkles\"], svg[data-dsh-icon=\"edit\"], svg[data-icon=\"palette\"], svg[data-icon=\"sparkles\"], svg[data-icon=\"edit\"]) {\n      rotate: -12deg;\n      scale: 1.08;\n    }\n\n    /* Closed chevron gentle downward cue on hover */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"])[aria-expanded=\"false\"]:hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"down\"], svg[data-dsh-icon=\"chevron-down\"], svg[data-icon=\"down\"], svg[data-icon=\"chevron-down\"]) {\n      translate: 0px 1.5px;\n    }\n  }\n\n  /* Pop feedback when toggled into active/pressed/checked state */\n  :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where([aria-pressed=\"true\"], [aria-checked=\"true\"], [data-active=\"true\"], [data-copied=\"true\"]) :is(svg[data-dsh-icon=\"star\"], svg[data-dsh-icon=\"check\"], svg[data-dsh-icon=\"copy\"], svg[data-icon=\"star\"], svg[data-icon=\"check\"], svg[data-icon=\"copy\"]) {\n    animation: dsh-icon-pop 300ms var(--dsh-ease-spring);\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 9. Tabs, Interactive Rows, Cards & Top-Layer Dialog/Popover Entrance\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) [role=\"tablist\"] {\n  scrollbar-width: thin;\n}\n\n:where([data-dsh-style]) [role=\"tab\"] {\n  position: relative;\n}\n\n/* Non-color border indicator on selected tabs (WCAG 1.4.1 + Forced Colors safe) */\n:where([data-dsh-style]) [role=\"tab\"][aria-selected=\"true\"]::after {\n  content: \"\";\n  position: absolute;\n  inset-inline: 6px;\n  inset-block-end: 0;\n  border-block-end: 2px solid var(--dsw-alias-state-business-primary);\n  pointer-events: none;\n}\n\n/* Interactive workbench cards & list rows */\n:where([data-dsh-style]) :where([data-dsh-card], .dsh-card, [data-dsh-row], .dsh-row) {\n  translate: 0px 0px;\n  transition:\n    background-color var(--dsh-motion-fast) var(--dsh-ease-out),\n    border-color var(--dsh-motion-fast) var(--dsh-ease-out),\n    box-shadow var(--dsh-motion-base) var(--dsh-ease-out),\n    translate var(--dsh-motion-base) var(--dsh-ease-out);\n}\n\n@media (hover: hover) and (prefers-reduced-motion: no-preference) {\n  :where([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"])) :where([data-dsh-card], .dsh-card):hover {\n    translate: 0px -1.5px;\n    box-shadow: var(--dsh-card-hover-shadow);\n  }\n\n  [data-dsh-style=\"pixel8bit\"] :where([data-dsh-card], .dsh-card):hover {\n    translate: -1px -1px;\n    box-shadow: 4px 4px 0px #1e2826;\n  }\n\n  :where([data-dsh-style]) :where([data-dsh-row], .dsh-row):hover:not([data-selected=\"true\"]):not([aria-selected=\"true\"]) {\n    background-color: var(--dsh-surface-spotlight, var(--dsw-alias-interactive-bg-hover));\n  }\n}\n\n/* Modal / Dialog & Popover Top-Layer Entrance + Scroll Containment */\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n  overscroll-behavior: contain;\n  opacity: 1;\n  transition-property: opacity, scale, translate, display, overlay;\n  transition-duration: var(--dsh-motion-dialog);\n  transition-timing-function: var(--dsh-ease-out);\n  /* Separate declaration after transition so older parsers never drop transitions */\n  transition-behavior: allow-discrete;\n}\n\n@starting-style {\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n    opacity: 0;\n  }\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n    scale: 1;\n    translate: 0px 0px;\n  }\n\n  @starting-style {\n    :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n      scale: 0.965;\n      translate: 0px 6px;\n    }\n  }\n}\n\ndialog[open]::backdrop {\n  overflow: hidden;\n  overscroll-behavior: contain;\n}\n\n/* --------------------------------------------------------------------------\n * 10. Unified Header Style Switcher Chrome (`.dsh-style-switcher`)\n * -------------------------------------------------------------------------- */\n.dsh-style-switcher {\n  display: inline-flex;\n  align-items: center;\n  flex: none;\n}\n\n.dsh-style-trigger.dsh-style-trigger {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 28px;\n  padding-inline: 8px;\n  width: auto;\n  font-size: 12px;\n  line-height: 18px;\n  font-weight: 500;\n  color: var(--dsw-alias-label-secondary);\n  background: var(--dsw-alias-bg-layer-1);\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm, 8px);\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n@media (hover: hover) {\n  .dsh-style-trigger.dsh-style-trigger:hover:not(:disabled) {\n    color: var(--dsw-alias-label-primary);\n    background: var(--dsw-alias-interactive-bg-hover);\n  }\n}\n\n.dsh-style-swatch {\n  display: inline-block;\n  flex: none;\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  corner-shape: round;\n  background: var(--dsh-swatch-color, var(--dsw-alias-state-business-primary));\n  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16);\n}\n\n[data-dsh-style=\"pixel8bit\"] .dsh-style-swatch {\n  border-radius: 0px !important;\n  corner-shape: square;\n  box-shadow: 1px 1px 0px #1e2826;\n}\n\n.dsh-style-fallback-wrap {\n  position: relative;\n  display: inline-flex;\n}\n\n.dsh-style-fallback-menu {\n  position: absolute;\n  inset-block-start: calc(100% + 4px);\n  inset-inline-end: 0;\n  z-index: 2147483001;\n  display: grid;\n  gap: 2px;\n  min-width: 168px;\n  padding: 4px;\n  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base));\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md, 12px);\n  box-shadow: var(--dsw-elevation-prominent);\n}\n\n.dsh-style-fallback-item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  width: 100%;\n  min-height: 28px;\n  padding: 4px 8px;\n  border: 0;\n  border-radius: var(--dsw-radius-xs, 6px);\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font: inherit;\n  font-size: 12px;\n  text-align: start;\n  cursor: pointer;\n}\n\n.dsh-style-fallback-item[aria-checked=\"true\"] {\n  background: var(--dsw-alias-interactive-bg-active);\n  font-weight: 600;\n}\n\n@media (hover: hover) {\n  .dsh-style-fallback-item:hover:not(:disabled) {\n    background: var(--dsw-alias-interactive-bg-hover);\n  }\n}\n\n/* Fallback Modal & Menu Chrome (when host `@deepseek-ai/dsh-client-ui-primitives` is absent) */\n.dsh-fallback-modal-root {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  display: grid;\n  place-items: center;\n  padding: 16px;\n}\n\n.dsh-fallback-modal-mask {\n  position: fixed;\n  inset: 0;\n  background: rgba(15, 23, 42, 0.36);\n}\n\n.dsh-fallback-modal-dialog {\n  position: relative;\n  z-index: 1;\n  max-width: min(560px, calc(100dvw - 32px));\n  max-height: calc(100dvh - 32px);\n  overflow: clip;\n  display: flex;\n  flex-direction: column;\n  border-radius: var(--dsw-radius-md, 12px);\n  background: var(--dsw-alias-bg-layer-1, #f8fafc);\n  color: var(--dsw-alias-label-primary, #1f232b);\n  box-shadow: var(--dsw-elevation-prominent);\n}\n\n/* --------------------------------------------------------------------------\n * 11. Accessibility: Reduced Motion & Windows High Contrast (Forced Colors)\n * -------------------------------------------------------------------------- */\n@media (prefers-reduced-motion: reduce) {\n  :where([data-dsh-style]) :where(button, [role=\"button\"], [data-dsh-card], .dsh-card, [data-dsh-row], .dsh-row),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"]) {\n    translate: none !important;\n    scale: none !important;\n    transition-property: background-color, border-color, color, opacity;\n    transition-duration: 90ms;\n  }\n\n  :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"], summary) svg {\n    animation: none !important;\n    transition: none !important;\n    translate: none !important;\n    scale: none !important;\n  }\n\n  /* Short, non-spatial fade only for top-layer dialogs under reduced motion */\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n    scale: none !important;\n    translate: none !important;\n    transition-duration: 100ms;\n  }\n}\n\n@media (forced-colors: active) {\n  :where([data-dsh-style]) :where(button, input, select, textarea),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style], :has([data-dsh-style])) {\n    border: 1px solid ButtonText;\n  }\n\n  :where([data-dsh-style]) [role=\"tab\"][aria-selected=\"true\"]::after {\n    border-block-end: 3px solid Highlight;\n  }\n}\n";
/**
 * DeepSeek Harness (>=0.2.2-rc.3) Unified Style Switcher & Safe Host Primitives
 * Shared across STARDUSTLC666 workbench plugins:
 *   dsh-email, dsh-calendar, dsh-cite, dsh-dream, dsh-code-security,
 *   dsh-rss, dsh-ppt, dsh-remotion, dsh-hyperframes
 *
 * Zero external runtime imports: accepts `React` and optional `require` so this
 * module can be bundled via esbuild IIFE or inlined into classic DSH client
 * scripts without requiring `react` in plugin `node_modules` or triggering
 * eager UI `require()` calls during `window.__ModuleLoader__.load`.
 */

const DSH_STYLE_STORAGE_KEY = 'dsh-stardust:ui-style';
const DSH_STYLE_EVENT = 'dsh-stardust-style';
const DSH_DEFAULT_STYLE = 'harness';

const DSH_STYLES = Object.freeze([
  Object.freeze({
    id: 'harness',
    zh: '原生清透',
    zhShort: '原生',
    en: 'Native Airy',
    enShort: 'Native',
    swatch: '#4176e6',
    surface: '#f8fafc',
  }),
  Object.freeze({
    id: 'cream',
    zh: '米白纸感',
    zhShort: '米白色',
    en: 'Warm Cream',
    enShort: 'Cream',
    swatch: '#9e5829',
    surface: '#faf7f0',
  }),
  Object.freeze({
    id: 'claude',
    zh: 'Claude 暖书卷',
    zhShort: 'Claude风',
    en: 'Claude Warmth',
    enShort: 'Claude',
    swatch: '#c96442',
    surface: '#f5f4ed',
  }),
  Object.freeze({
    id: 'pixel8bit',
    zh: '8-Bit 像素',
    zhShort: '8-Bit像素',
    en: 'Bright 8-Bit',
    enShort: '8-Bit',
    swatch: '#2e7d5b',
    surface: '#f4f6e8',
  }),
  Object.freeze({
    id: 'mint',
    zh: '晴空薄荷',
    zhShort: '薄荷',
    en: 'Airy Mint',
    enShort: 'Mint',
    swatch: '#0f766e',
    surface: '#f5fafb',
  }),
]);

const VALID_STYLE_IDS = new Set(DSH_STYLES.map(preset => preset.id));

function resolveWindow(win) {
  if (win && typeof win === 'object') return win;
  return typeof window !== 'undefined' ? window : null;
}

function normalizeDshStyle(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  return VALID_STYLE_IDS.has(key) ? key : DSH_DEFAULT_STYLE;
}

function getDshStylePreset(value) {
  const id = normalizeDshStyle(value);
  return DSH_STYLES.find(preset => preset.id === id) || DSH_STYLES[0];
}

function readDshStyle(win) {
  const target = resolveWindow(win);
  if (!target) return DSH_DEFAULT_STYLE;
  try {
    const raw = target.localStorage?.getItem(DSH_STYLE_STORAGE_KEY);
    return normalizeDshStyle(raw);
  } catch {
    return DSH_DEFAULT_STYLE;
  }
}

/**
 * Stamps `[data-dsh-style]` and `[data-window-drag-exclude]` onto any currently
 * open portaled `[role="dialog"]` / `[role="menu"]` surfaces in `document.body`
 * that were synced via `createOverlaySyncRef` or carry `[data-dsh-portal-synced]`.
 */
function syncPortaledOverlays(style, doc) {
  const normalized = normalizeDshStyle(style);
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (!targetDoc || typeof targetDoc.querySelectorAll !== 'function') return;
  for (const el of targetDoc.querySelectorAll('[data-dsh-portal-synced]')) {
    el.setAttribute('data-dsh-style', normalized);
    if (!el.hasAttribute('data-window-drag-exclude')) {
      el.setAttribute('data-window-drag-exclude', '');
    }
  }
}

function writeDshStyle(nextStyle, win) {
  const normalized = normalizeDshStyle(nextStyle);
  const target = resolveWindow(win);
  if (target) {
    try {
      target.localStorage?.setItem(DSH_STYLE_STORAGE_KEY, normalized);
    } catch {
      // Restricted storage: keep in-memory + custom event sync working.
    }
    syncPortaledOverlays(normalized, target.document);
    if (typeof target.dispatchEvent === 'function') {
      try {
        const CustomEventCtor = target.CustomEvent || (typeof CustomEvent === 'function' ? CustomEvent : null);
        if (CustomEventCtor) {
          target.dispatchEvent(new CustomEventCtor(DSH_STYLE_EVENT, { detail: { style: normalized } }));
        } else if (typeof Event === 'function') {
          const ev = new Event(DSH_STYLE_EVENT);
          ev.detail = { style: normalized };
          target.dispatchEvent(ev);
        }
      } catch {
        // Ignore synthetic event errors in minimal VM environments.
      }
    }
  }
  return normalized;
}

function subscribeDshStyle(onChange, win) {
  const target = resolveWindow(win);
  if (!target || typeof target.addEventListener !== 'function' || typeof onChange !== 'function') {
    return () => {};
  }
  const onCustom = event => {
    const next = normalizeDshStyle(event?.detail?.style ?? readDshStyle(target));
    syncPortaledOverlays(next, target.document);
    onChange(next);
  };
  const onStorage = event => {
    if (event && event.key !== null && event.key !== undefined && event.key !== DSH_STYLE_STORAGE_KEY) {
      return;
    }
    const next = normalizeDshStyle(event?.newValue ?? readDshStyle(target));
    syncPortaledOverlays(next, target.document);
    onChange(next);
  };
  target.addEventListener(DSH_STYLE_EVENT, onCustom);
  target.addEventListener('storage', onStorage);
  return () => {
    target.removeEventListener(DSH_STYLE_EVENT, onCustom);
    target.removeEventListener('storage', onStorage);
  };
}

/**
 * React hook returning `[style, setStyle]`, synced across plugins, tabs, and
 * portaled dialogs via `localStorage['dsh-stardust:ui-style']` + `dsh-stardust-style`.
 * Safe in minimal VM registration tests where `React.useState` may be absent.
 */
function useDshStyle(React, win) {
  if (!React || typeof React.useState !== 'function') {
    return [readDshStyle(win), next => writeDshStyle(next, win)];
  }
  const [style, setStyleState] = React.useState(() => readDshStyle(win));
  if (typeof React.useEffect === 'function') {
    React.useEffect(() => {
      const current = readDshStyle(win);
      setStyleState(prev => (prev === current ? prev : current));
      syncPortaledOverlays(current, resolveWindow(win)?.document);
      return subscribeDshStyle(next => {
        setStyleState(prev => (prev === next ? prev : next));
      }, win);
    }, [win]);
  }
  const setStyle = next => {
    const resolved = typeof next === 'function' ? next(style) : next;
    const applied = writeDshStyle(resolved, win);
    setStyleState(applied);
    return applied;
  };
  return [style, setStyle];
}

/**
 * Callback ref for elements rendered inside host `@deepseek-ai/dsh-client-ui-primitives`
 * `Modal` or `Menu` portals (`createPortal(..., document.body)`).
 * Host `Modal` and `Menu` do not spread arbitrary `data-*` props onto their outer
 * `<div role="dialog">` / `<div role="menu">` wrapper, so attaching this ref to an
 * inner header/body wrapper promotes `data-dsh-style` and `data-window-drag-exclude`
 * onto the portaled overlay frame itself.
 */
function createOverlaySyncRef(style) {
  const normalized = normalizeDshStyle(style);
  return node => {
    if (!node || typeof node.setAttribute !== 'function') return;
    node.setAttribute('data-dsh-style', normalized);
    node.setAttribute('data-window-drag-exclude', '');
    node.setAttribute('data-dsh-portal-synced', 'true');
    if (typeof node.closest === 'function') {
      const overlay = node.closest('[role="dialog"], [role="alertdialog"], [role="menu"], dialog');
      if (overlay) {
        overlay.setAttribute('data-dsh-style', normalized);
        overlay.setAttribute('data-window-drag-exclude', '');
        overlay.setAttribute('data-dsh-portal-synced', 'true');
      }
    }
  };
}

/**
 * Shared crisp 24x24 stroke icons for workbench headers, buttons, and micro-animations.
 */
const DSH_ICON_PATHS = Object.freeze({
  mail: ['M3 5h18v14H3z', 'm3 6 9 7 9-7'],
  inbox: ['M4 13 6 5h12l2 8v6H4z', 'M4 13h5l1 3h4l1-3h5'],
  send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm16 16 5 5'],
  plus: ['M12 5v14M5 12h14'],
  refresh: ['M20 7a9 9 0 1 0 1 8', 'M20 2v5h-5'],
  close: ['m6 6 12 12M18 6 6 18'],
  left: ['m14 5-7 7 7 7'],
  right: ['m10 5 7 7-7 7'],
  down: ['m5 9 7 7 7-7'],
  download: ['M12 3v12m-5-5 5 5 5-5', 'M4 16v5h16v-5'],
  file: ['M4 3h10l6 6v12H4z', 'M14 3v6h6M8 13h8M8 17h6'],
  folder: ['M3 5h7l2 3h9v12H3z'],
  edit: ['m15 4 5 5-10 10-6 1 1-6Z', 'm13 6 5 5'],
  trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6M12 7h.01'],
  check: ['m5 12 4 4L19 6'],
  star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z'],
  reply: ['m9 5-7 7 7 7v-5h6c3 0 5 2 6 5 0-8-4-11-12-11Z'],
  lock: ['M5 10h14v11H5z', 'M8 10V7a4 4 0 0 1 8 0v3M12 14v3'],
  clip: ['m8 13 6-6a2.5 2.5 0 0 1 3.5 3.5l-7 7a4 4 0 0 1-5.7-5.7l8-8a5 5 0 0 1 7.1 7.1l-8 8'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  image: ['M3 4h18v16H3z', 'm3 17 6-6 5 5 2-2 5 5M16 8h.01'],
  copy: ['M9 9h10v11H9z', 'M5 15H4V4h10v1'],
  external: ['M14 4h6v6', 'M10 14 20 4', 'M18 13v6H5V6h6'],
  link: ['M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11 4.9', 'M14 11a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1L13 19.1'],
  play: ['m7 5 12 7-12 7Z'],
  palette: ['M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-2.2-4-4-9-4Z', 'M7.5 10.5h.01M10.5 7.5h.01M14.5 7.5h.01'],
  sparkles: ['m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z', 'M19 15v4M17 17h4'],
  calendar: ['M4 6h16v14H4z', 'M8 3v4M16 3v4M4 10h16'],
  shield: ['M12 3 5 6v6c0 5 3.4 8.3 7 9 3.6-.7 7-4 7-9V6Z'],
  rss: ['M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M4 11a9 9 0 0 1 9 9', 'M4 5a15 15 0 0 1 15 15'],
});

function renderDshIcon(React, { name = 'file', size = 16, paths = DSH_ICON_PATHS, ...props } = {}) {
  const h = React.createElement;
  const segments = paths[name] || DSH_ICON_PATHS[name] || DSH_ICON_PATHS.file;
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.65,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      'data-dsh-icon': name,
      ...props,
    },
    segments.map((d, index) => h('path', { key: index, d })),
  );
}

const primitivesByReact = new WeakMap();

/**
 * Lazily resolves `@deepseek-ai/dsh-client-ui-primitives` on render and supplies
 * semantic, accessible HTML fallbacks when running in standalone `jsdom` or `node:vm`
 * tests where host UI primitives are not mounted.
 *
 * IMPORTANT: Call ONLY inside component render paths — never eagerly inside
 * `window.__ModuleLoader__.load({ factory })` or `apply(ctx)`.
 */
function resolveHostPrimitives(React, requireFn) {
  const h = React.createElement;
  let host = null;
  if (typeof requireFn === 'function') {
    try {
      host = requireFn('@deepseek-ai/dsh-client-ui-primitives') || null;
    } catch {
      host = null;
    }
  }

  // Keep component types stable while still discovering host changes on render.
  let primitivesByHost = primitivesByReact.get(React);
  if (!primitivesByHost) {
    primitivesByHost = new Map();
    primitivesByReact.set(React, primitivesByHost);
  }
  const cached = primitivesByHost.get(host);
  if (cached) return cached;

  function FallbackButton({ variant = 'ghost', size = 'md', icon, className, children, type = 'button', ...rest }) {
    const cls = ['dsh-btn', `dsh-btn-${variant}`, `dsh-btn-${size}`, className].filter(Boolean).join(' ');
    return h(
      'button',
      { type, className: cls, ...rest },
      icon != null ? h('span', { className: 'dsh-fallback-btn-icon' }, icon) : null,
      children,
    );
  }

  function FallbackInput({ icon, className, ...rest }) {
    const cls = ['dsh-fallback-input-wrap', className].filter(Boolean).join(' ');
    return h(
      'span',
      { className: cls },
      icon != null ? h('span', { className: 'dsh-fallback-input-icon' }, icon) : null,
      h('input', rest),
    );
  }

  let fallbackControlSeq = 0;
  function FallbackCheckbox({ checked = false, onChange, label, disabled = false, title, className, id, ...rest }) {
    const inputId = id || (typeof React.useId === 'function' ? React.useId() : 'dsh-chk-' + (++fallbackControlSeq));
    return h(
      'label',
      { htmlFor: inputId, className, title },
      h('input', {
        id: inputId,
        type: 'checkbox',
        checked: Boolean(checked),
        disabled,
        onChange: event => onChange?.(Boolean(event?.target?.checked)),
        ...rest,
      }),
      h('span', null, label),
    );
  }

  function FallbackSwitch({ checked = false, onChange, label, disabled = false, title, className }) {
    return h(
      'button',
      {
        type: 'button',
        role: 'switch',
        'aria-checked': Boolean(checked),
        'aria-label': label,
        title,
        disabled,
        className,
        onClick: () => onChange?.(!checked),
      },
      h('span', null),
    );
  }

  function FallbackSegmentedControl({ id, value, options = [], onChange, label, disabled = false, className }) {
    return h(
      'div',
      { role: 'tablist', 'aria-label': label, className },
      options.map(opt => {
        const selected = opt.value === value;
        return h(
          'button',
          {
            key: opt.value,
            id: id ? `${id}-${opt.value}` : undefined,
            type: 'button',
            role: 'tab',
            'aria-selected': selected,
            tabIndex: selected ? 0 : -1,
            disabled: disabled || Boolean(opt.disabled),
            onClick: () => {
              if (!disabled && !opt.disabled && opt.value !== value) onChange?.(opt.value);
            },
          },
          opt.label,
        );
      }),
    );
  }

  function renderPortalSyncNode(styleValue) {
    const syncStyle = normalizeDshStyle(styleValue ?? readDshStyle());
    return h('span', {
      key: '__dsh_portal_sync__',
      ref: createOverlaySyncRef(syncStyle),
      hidden: true,
      'aria-hidden': 'true',
      'data-dsh-style': syncStyle,
    });
  }

  function FallbackMenu({
    open = false,
    anchor,
    items = [],
    children,
    selectedId,
    onSelect,
    onClose,
    footer,
    className,
    listClassName,
    dshStyle,
  }) {
    const style = normalizeDshStyle(dshStyle ?? readDshStyle());
    return h(
      'div',
      { className: ['dsh-style-fallback-wrap', className].filter(Boolean).join(' ') },
      anchor,
      open
        ? h(
            'div',
            {
              role: 'menu',
              'data-dsh-style': style,
              'data-window-drag-exclude': '',
              'data-dsh-portal-synced': 'true',
              className: ['dsh-style-fallback-menu', listClassName].filter(Boolean).join(' '),
              onKeyDown: event => {
                if (event?.key === 'Escape') {
                  event.stopPropagation?.();
                  onClose?.();
                }
              },
            },
            items.map(item =>
              h(
                'button',
                {
                  key: item.id,
                  type: 'button',
                  role: 'menuitemradio',
                  'aria-checked': item.id === selectedId,
                  disabled: Boolean(item.disabled),
                  className: 'dsh-style-fallback-item',
                  onClick: () => {
                    if (!item.disabled) {
                      onSelect?.(item.id);
                      onClose?.();
                    }
                  },
                },
                h('span', null, item.label),
                item.id === selectedId ? h('span', { 'aria-hidden': 'true' }, '✓') : null,
              ),
            ),
            children,
            footer,
          )
        : null,
    );
  }

  function FallbackModal({
    open = true,
    onClose,
    title,
    closeLabel = 'Close',
    children,
    footer,
    className,
    contentClassName,
    onKeyDownCapture,
    headless = false,
    dshStyle,
  }) {
    if (!open) return null;
    const style = normalizeDshStyle(dshStyle ?? readDshStyle());
    return h(
      'div',
      {
        className: 'dsh-fallback-modal-root',
        role: 'presentation',
        'data-dsh-style': style,
        'data-window-drag-exclude': '',
        'data-dsh-portal-synced': 'true',
        onKeyDownCapture,
        // Let nested menus/editors consume Escape before the enclosing dialog.
        onKeyDown: event => {
          if (!event?.defaultPrevented && event?.key === 'Escape') {
            event.stopPropagation?.();
            onClose?.();
          }
        },
      },
      h('div', { className: 'dsh-fallback-modal-mask', 'aria-hidden': 'true', onClick: onClose }),
      h(
        'div',
        {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': title,
          tabIndex: -1,
          'data-dsh-style': style,
          'data-window-drag-exclude': '',
          'data-dsh-portal-synced': 'true',
          className: ['dsh-fallback-modal-dialog', className].filter(Boolean).join(' '),
        },
        headless
          ? children
          : h(
              React.Fragment || 'div',
              null,
              h(
                'header',
                null,
                h('h2', null, title),
                h('button', { type: 'button', 'aria-label': closeLabel, onClick: onClose }, '×'),
              ),
              h('div', { className: contentClassName }, children),
              footer ? h('footer', null, footer) : null,
            ),
      ),
    );
  }

  const WrappedMenu = host?.Menu
    ? function HostMenuWithStyle({ dshStyle, children, ...menuProps }) {
        if (!menuProps.open) {
          return children !== undefined ? h(host.Menu, menuProps, children) : h(host.Menu, menuProps);
        }
        const syncNode = renderPortalSyncNode(dshStyle);
        return children !== undefined && children !== null
          ? h(host.Menu, menuProps, children, syncNode)
          : h(host.Menu, menuProps, syncNode);
      }
    : FallbackMenu;

  const WrappedModal = host?.Modal
    ? function HostModalWithStyle({ dshStyle, children, ...modalProps }) {
        if (!modalProps.open) {
          return children !== undefined ? h(host.Modal, modalProps, children) : h(host.Modal, modalProps);
        }
        const syncNode = renderPortalSyncNode(dshStyle);
        return children !== undefined && children !== null
          ? h(host.Modal, modalProps, children, syncNode)
          : h(host.Modal, modalProps, syncNode);
      }
    : FallbackModal;

  const resolved = {
    ...(host || {}),
    isFallback: !host,
    Button: host?.Button || FallbackButton,
    Input: host?.Input || FallbackInput,
    Checkbox: host?.Checkbox || FallbackCheckbox,
    Switch: host?.Switch || FallbackSwitch,
    SegmentedControl: host?.SegmentedControl || FallbackSegmentedControl,
    Menu: WrappedMenu,
    Modal: WrappedModal,
  };
  primitivesByHost.set(host, resolved);
  return resolved;
}

/**
 * Ready-made 5-preset Style Switcher component factory (`StyleSwitcher`).
 * Renders a compact header menu button with a live color swatch, localized preset
 * label, `aria-expanded` state, and `down` chevron (which flips 180deg when open),
 * syncing selection via `localStorage['dsh-stardust:ui-style']` + `dsh-stardust-style`.
 */
function createStyleSwitcherComponent(React, requireFn) {
  const h = React.createElement;
  return function StyleSwitcher({
    style: controlledStyle,
    onChange,
    lang = 'zh',
    id = 'dsh-style-switcher',
    compact = false,
    disabled = false,
    align = 'end',
    className,
  } = {}) {
    const [syncedStyle, setSyncedStyle] = useDshStyle(React);
    const activeStyle = normalizeDshStyle(controlledStyle ?? syncedStyle);
    const [open, setOpen] = typeof React.useState === 'function' ? React.useState(false) : [false, () => {}];
    const isZh = String(lang || '').toLowerCase().startsWith('zh');
    const preset = getDshStylePreset(activeStyle);
    const P = resolveHostPrimitives(React, requireFn);
    const triggerLabel = isZh ? `界面风格：${preset.zh}` : `UI style: ${preset.en}`;
    const visibleText = compact
      ? (isZh ? preset.zhShort : preset.enShort)
      : (isZh ? preset.zh : preset.en);
    const items = DSH_STYLES.map(option => ({
      id: option.id,
      label: isZh ? `${option.zh} (${option.enShort})` : `${option.en}`,
    }));
    const selectStyle = nextId => {
      const applied = writeDshStyle(nextId);
      setSyncedStyle(applied);
      onChange?.(applied);
      setOpen(false);
    };

    return h(
      'div',
      {
        className: ['dsh-style-switcher', className].filter(Boolean).join(' '),
        'data-window-drag-exclude': '',
      },
      h(P.Menu, {
        open: open && !disabled,
        selectedId: activeStyle,
        dshStyle: activeStyle,
        items,
        align,
        portal: !P.isFallback,
        autoFocus: true,
        minWidthFromAnchor: true,
        onClose: () => setOpen(false),
        onSelect: selectStyle,
        anchor: h(
          P.Button,
          {
            id,
            variant: 'outline',
            size: 'sm',
            disabled,
            className: 'dsh-style-trigger',
            'aria-label': triggerLabel,
            'aria-haspopup': 'menu',
            'aria-expanded': Boolean(open && !disabled),
            title: triggerLabel,
            onClick: () => setOpen(prev => !prev),
            onKeyDown: event => {
              if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault?.();
                setOpen(true);
              }
            },
          },
          h('span', {
            className: 'dsh-style-swatch',
            'aria-hidden': 'true',
            style: { '--dsh-swatch-color': preset.swatch },
          }),
          h('span', { className: 'dsh-style-label' }, visibleText),
          renderDshIcon(React, { name: 'down', size: 14 }),
        ),
      }),
    );
  };
}

/* DSH Workbench UI v2 — DeepSeek Harness (>=0.2.2-rc.3) Host Primitives,
 * 5-Style Theme Switcher (`harness`, `cream`, `claude`, `pixel8bit`, `mint`),
 * Never-Too-Dark Soft Slate Adaptation, and Tactile Micro-Motion.
 */
function createWorkbenchUI(React, require) {
  const h = React.createElement;
  const cx = (...values) => values.filter(Boolean).join(' ');
  const useSafeId = (fallback = 'dsh-wb-id') => (typeof React.useId === 'function' ? React.useId() : fallback);
  const useSafeState = initial => (
    typeof React.useState === 'function'
      ? React.useState(initial)
      : [typeof initial === 'function' ? initial() : initial, () => {}]
  );
  const useSafeRef = initial => (typeof React.useRef === 'function' ? React.useRef(initial) : { current: initial });
  const useSafeEffect = (fn, deps) => {
    if (typeof React.useEffect === 'function') React.useEffect(fn, deps);
  };

  // Lazy host primitive resolution: NEVER call require('@deepseek-ai/dsh-client-ui-primitives') eagerly!
  const primitives = () => resolveHostPrimitives(React, require);
  const StyleSwitcher = createStyleSwitcherComponent(React, require);

  const WORKBENCH_ICON_PATHS = Object.freeze({
    ...DSH_ICON_PATHS,
    filter: ['M4 5h16M7 12h10M10 19h4'],
    upload: ['M12 16V4m-5 5 5-5 5 5', 'M4 16v5h16v-5'],
    more: ['M5 12h.01M12 12h.01M19 12h.01'],
    settings: [
      'm9 3-.7 2.4-2 .9L4 5.8 2.5 8.4l1.7 1.8v2.3L2.5 14 4 17l2.5-.4 1.9 1L9 20h3l.8-2.4 2-1 2.5.4 1.5-2.7-1.7-1.9v-2.2l1.7-1.8-1.5-2.6-2.5.4-2-1L12 3Z',
      'M14 11.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z',
    ],
    book: ['M4 4h6a3 3 0 0 1 2 2v15a4 4 0 0 0-4-2H4z', 'M20 4h-6a3 3 0 0 0-2 2v15a4 4 0 0 1 4-2h4z'],
    slides: ['M3 4h18v13H3z', 'M12 17v4M8 21h8'],
    layers: ['M5 3h16v16H5z', 'M2 7v15h15'],
    video: ['M3 5h12v14H3z', 'm15 10 6-4v12l-6-4'],
    quote: ['M4 12h6v7H3v-7c0-4 2-6 5-7M15 12h6v7h-7v-7c0-4 2-6 5-7'],
  });

  function Icon({ name = 'file', size = 16, ...props }) {
    return renderDshIcon(React, { name, size, paths: WORKBENCH_ICON_PATHS, ...props });
  }

  function Button({
    children,
    icon,
    iconSize = 15,
    variant = 'outline',
    size = 'sm',
    spinning = false,
    copied = false,
    className,
    ...props
  }) {
    const P = primitives();
    const resolvedVariant = variant || 'outline';
    const hostVariant = resolvedVariant === 'danger'
      ? 'ghost'
      : (resolvedVariant === 'primary' || resolvedVariant === 'ghost' ? resolvedVariant : 'outline');
    return h(
      P.Button,
      {
        variant: hostVariant,
        size,
        'aria-busy': spinning ? 'true' : props['aria-busy'],
        'data-copied': copied ? 'true' : props['data-copied'],
        ...props,
        className: cx('dsh-wb-btn', 'dsh-wb-btn-' + resolvedVariant, className),
        icon: icon ? h(Icon, { name: icon, size: iconSize, 'data-spinning': spinning ? 'true' : undefined }) : undefined,
      },
      children,
    );
  }

  function IconButton({ label, icon, iconSize = 16, variant = 'ghost', size = 'sm', spinning = false, className, ...props }) {
    return h(Button, {
      ...props,
      icon,
      iconSize,
      variant,
      size,
      spinning,
      className: cx('dsh-wb-icon-btn', className),
      'aria-label': label,
      title: props.title ?? label,
    });
  }

  function Input({ icon, className, ...props }) {
    const P = primitives();
    return h(P.Input, {
      ...props,
      icon: icon ? h(Icon, { name: icon, size: 15 }) : undefined,
      className: cx('dsh-wb-input', className),
    });
  }

  function Checkbox({ label, checked = false, onChange, hiddenLabel = false, disabled = false, className, ...props }) {
    const P = primitives();
    return h(P.Checkbox, {
      ...props,
      checked: Boolean(checked),
      disabled: Boolean(disabled),
      label,
      className: cx('dsh-wb-checkbox', hiddenLabel && 'dsh-wb-checkbox-hidden', className),
      onChange: next => {
        const value = typeof next === 'boolean' ? next : Boolean(next?.target?.checked);
        onChange?.(value);
      },
    });
  }

  function Switch({ label, checked = false, onChange, disabled = false, className }) {
    const P = primitives();
    return h(
      'div',
      { className: cx('dsh-wb-switch-row', className) },
      h(P.Switch, {
        checked: Boolean(checked),
        disabled: Boolean(disabled),
        label,
        className: 'dsh-wb-switch',
        onChange: next => {
          const value = typeof next === 'boolean' ? next : Boolean(next?.target?.checked);
          onChange?.(value);
        },
      }),
      h('span', { className: 'dsh-wb-switch-text' }, label),
    );
  }

  function ChoiceMenu({
    label,
    id,
    value,
    items = [],
    onChange,
    disabled = false,
    children,
    className,
    align = 'start',
    icon,
  }) {
    const [open, setOpen] = useSafeState(false);
    const [style] = useDshStyle(React);
    const P = primitives();
    const currentValue = String(value ?? '');
    const selected = items.find(item => String(item.id) === currentValue);
    return h(
      'div',
      { className: cx('dsh-wb-choice', className), 'data-window-drag-exclude': '' },
      h(P.Menu, {
        open: Boolean(open && !disabled),
        selectedId: currentValue,
        dshStyle: style,
        items: items.map(item => ({ ...item, id: String(item.id) })),
        align,
        portal: !P.isFallback,
        autoFocus: true,
        minWidthFromAnchor: true,
        className: 'dsh-wb-menu',
        onClose: () => setOpen(false),
        onSelect: next => {
          setOpen(false);
          if (String(next) !== currentValue) onChange?.(next);
        },
        anchor: h(
          Button,
          {
            id,
            variant: 'outline',
            className: 'dsh-wb-menu-btn',
            disabled: Boolean(disabled || items.length === 0),
            'aria-label': label,
            'aria-haspopup': 'menu',
            'aria-expanded': Boolean(open && !disabled),
            onClick: () => setOpen(prev => !prev),
            onKeyDown: event => {
              if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault?.();
                setOpen(true);
              }
            },
          },
          icon ? h(Icon, { name: icon, size: 14 }) : null,
          h('span', { className: 'dsh-wb-menu-value' }, children ?? selected?.label ?? label),
          h(Icon, { name: 'down', size: 14 }),
        ),
      }),
    );
  }

  function Search({ label, value = '', onChange, clearLabel = 'Clear', disabled = false, className, ...props }) {
    const id = useSafeId('dsh-wb-search');
    const hasValue = String(value || '').length > 0;
    return h(
      'div',
      { className: cx('dsh-wb-search', className) },
      h(Input, {
        type: 'search',
        id,
        icon: 'search',
        'aria-label': label,
        placeholder: label,
        value,
        disabled,
        onChange,
        ...props,
      }),
      hasValue && !disabled
        ? h(IconButton, {
            icon: 'close',
            iconSize: 13,
            label: clearLabel,
            className: 'dsh-wb-search-clear',
            onClick: () => onChange?.({ target: { value: '' } }),
          })
        : null,
    );
  }

  const tourSessionDone = new Set();

  function readTourDone(storageKey) {
    if (!storageKey) return false;
    if (tourSessionDone.has(storageKey)) return true;
    try {
      return typeof window !== 'undefined' && window.localStorage?.getItem(storageKey) === 'done';
    } catch {
      return false;
    }
  }

  function writeTourDone(storageKey) {
    if (!storageKey) return;
    tourSessionDone.add(storageKey);
    try {
      if (typeof window !== 'undefined') window.localStorage?.setItem(storageKey, 'done');
    } catch {
      // Ignore storage quota / security errors.
    }
  }

  function computeTourLayout(target, preferredSide, cardEl) {
    const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
    const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
    const cw = cardEl?.offsetWidth || 320;
    const ch = cardEl?.offsetHeight || 196;
    const pad = 5;
    const gap = 12;
    const raw = target?.getBoundingClientRect?.();
    if (!target) {
      return {
        spotlight: null,
        side: 'center',
        left: Math.max(12, Math.round((vw - cw) / 2)),
        top: Math.max(12, Math.round((vh - ch) / 2)),
        arrowX: 28,
        arrowY: 24,
      };
    }
    const hasBox = Boolean(raw && (raw.width > 0 || raw.height > 0));
    const rect = hasBox ? raw : { left: 120, top: 72, width: 140, height: 32 };
    const spotlight = {
      left: Math.round(rect.left - pad),
      top: Math.round(rect.top - pad),
      width: Math.round(rect.width + pad * 2),
      height: Math.round(rect.height + pad * 2),
    };
    const spaceBottom = vh - spotlight.top - spotlight.height;
    const spaceTop = spotlight.top;
    const spaceRight = vw - spotlight.left - spotlight.width;
    const spaceLeft = spotlight.left;
    let side = preferredSide || 'bottom';
    if (side === 'right' && spaceRight < cw + gap + 12) {
      side = spaceBottom >= ch + gap + 12 ? 'bottom' : spaceLeft >= cw + gap + 12 ? 'left' : 'top';
    } else if (side === 'left' && spaceLeft < cw + gap + 12) {
      side = spaceRight >= cw + gap + 12 ? 'right' : 'bottom';
    } else if (side === 'bottom' && spaceBottom < ch + gap + 12 && spaceTop > spaceBottom) {
      side = 'top';
    } else if (side === 'top' && spaceTop < ch + gap + 12 && spaceBottom > spaceTop) {
      side = 'bottom';
    }
    let left = spotlight.left;
    let top = spotlight.top + spotlight.height + gap;
    if (side === 'top') top = spotlight.top - ch - gap;
    else if (side === 'right') { left = spotlight.left + spotlight.width + gap; top = spotlight.top; }
    else if (side === 'left') { left = spotlight.left - cw - gap; top = spotlight.top; }
    left = Math.round(Math.max(12, Math.min(vw - cw - 12, left)));
    top = Math.round(Math.max(12, Math.min(vh - ch - 12, top)));
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return {
      spotlight,
      side,
      left,
      top,
      arrowX: Math.round(Math.max(18, Math.min(cw - 18, centerX - left))),
      arrowY: Math.round(Math.max(18, Math.min(ch - 18, centerY - top))),
    };
  }

  function CoachmarkTour({
    rootRef,
    steps = [],
    step = 0,
    manual = false,
    style = 'harness',
    lang = 'zh',
    layout: rawLayout,
    setLayout,
    onStep,
    onClose,
    onCopyPrompt,
  }) {
    const layerRef = useSafeRef(null);
    const cardRef = useSafeRef(null);
    const nextBtnRef = useSafeRef(null);
    const copyTimerRef = useSafeRef(null);
    const [copied, setCopied] = useSafeState(false);
    const [copyNotice, setCopyNotice] = useSafeState('');
    const titleId = useSafeId('dsh-wb-tour') + '-title';
    const isEn = String(lang || '').toLowerCase().startsWith('en');
    const l = (zh, en) => (isEn ? en : zh);
    const current = steps[Math.max(0, Math.min(steps.length - 1, step))] || {};
    const layout = rawLayout && typeof rawLayout === 'object' && rawLayout.side
      ? rawLayout
      : { spotlight: null, side: current.side || 'bottom', left: 24, top: 76, arrowX: 28, arrowY: 24 };

    useSafeEffect(() => () => {
      if (copyTimerRef.current && typeof clearTimeout === 'function') clearTimeout(copyTimerRef.current);
    }, []);

    useSafeEffect(() => {
      const node = layerRef.current;
      if (!node) return undefined;
      try {
        node.setAttribute?.('popover', 'manual');
        node.showPopover?.();
      } catch {
        // Ignore when Popover API is unavailable in synthetic test DOM.
      }
      return () => {
        try { node.hidePopover?.(); } catch {}
      };
    }, []);

    useSafeEffect(() => {
      function measure() {
        const scope = rootRef?.current || (typeof document !== 'undefined' ? document : null);
        if (!scope || typeof scope.querySelector !== 'function') return;
        function query(selector) {
          if (!selector) return null;
          try {
            return scope.querySelector(selector);
          } catch {
            // The guide can still use its fallback or show the card without a highlight.
            return null;
          }
        }
        const target = query(current.selector) || query(current.fallback);
        setLayout?.(computeTourLayout(target, current.side, cardRef.current));
      }
      measure();
      const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(measure) : null;
      if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
        return () => {
          if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        };
      }
      window.addEventListener('resize', measure, { passive: true });
      window.addEventListener('scroll', measure, true);
      return () => {
        if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        window.removeEventListener('resize', measure);
        window.removeEventListener('scroll', measure, true);
      };
    }, [step, current.selector, current.fallback, current.side]);

    useSafeEffect(() => {
      if (!manual) return;
      const btn = nextBtnRef.current || cardRef.current?.querySelector?.('[data-tour-next]');
      btn?.focus?.();
    }, [manual, step]);

    async function handleCopy() {
      if (!current.prompt) return;
      const copyFn = onCopyPrompt || writeClipboardText;
      const ok = await copyFn(current.prompt);
      if (ok !== false) {
        if (copyTimerRef.current && typeof clearTimeout === 'function') clearTimeout(copyTimerRef.current);
        setCopied(true);
        let msg = l('已复制指令，粘贴到对话发送即可', 'Prompt copied — paste into chat');
        if (msg === lastWbCopyAnnouncement) msg += '\u00A0';
        lastWbCopyAnnouncement = msg;
        setCopyNotice(msg);
        if (typeof setTimeout === 'function') {
          const timer = setTimeout(() => {
            setCopied(false);
            setCopyNotice('');
          }, 1800);
          timer?.unref?.();
          copyTimerRef.current = timer;
        }
      }
    }

    const isLast = step >= steps.length - 1;
    const isCopied = copied === true;
    function finish() { onClose?.(manual); }
    function onKeyDown(event) {
      if (event.isComposing || event.nativeEvent?.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault?.(); event.stopPropagation?.(); finish(); }
      else if (event.key === 'ArrowRight' && !isLast) { event.preventDefault?.(); onStep?.(step + 1, true); }
      else if (event.key === 'ArrowLeft' && step > 0) { event.preventDefault?.(); onStep?.(step - 1, true); }
    }

    return h(
      'div',
      {
        ref: layerRef,
        className: 'dsh-wb-tour-layer',
        'data-dsh-style': style,
        'data-wb-tour': current.id || String(step),
        'data-window-drag-exclude': '',
      },
      layout.spotlight
        ? h('div', {
            className: 'dsh-wb-tour-spotlight',
            'data-tour-spotlight': current.id || String(step),
            'aria-hidden': 'true',
            style: {
              left: layout.spotlight.left + 'px',
              top: layout.spotlight.top + 'px',
              width: layout.spotlight.width + 'px',
              height: layout.spotlight.height + 'px',
            },
          })
        : h('div', { className: 'dsh-wb-tour-backdrop', 'aria-hidden': 'true' }),
      h(
        'div',
        {
          ref: cardRef,
          role: 'dialog',
          'aria-modal': 'false',
          'aria-labelledby': titleId,
          tabIndex: -1,
          onKeyDown,
          className: 'dsh-wb-tour-card',
          'data-side': layout.side,
          'data-tour-card': current.id || String(step),
          style: {
            left: layout.left + 'px',
            top: layout.top + 'px',
            '--arrow-x': layout.arrowX + 'px',
            '--arrow-y': layout.arrowY + 'px',
          },
        },
        h('span', { className: 'dsh-wb-tour-arrow', 'data-tour-arrow': layout.side, 'aria-hidden': 'true' }),
        h(
          'div',
          { className: 'dsh-wb-tour-head' },
          h(
            'div',
            { className: 'dsh-wb-tour-step-meta' },
            h('span', { className: 'dsh-wb-tour-badge' }, (step + 1) + ' / ' + steps.length),
            h(
              'span',
              { className: 'dsh-wb-tour-dots', 'aria-hidden': 'true' },
              steps.map((item, idx) =>
                h('span', {
                  key: item.id || idx,
                  className: 'dsh-wb-tour-dot',
                  'data-active': idx === step ? 'true' : undefined,
                }),
              ),
            ),
          ),
          h('button', { type: 'button', className: 'dsh-wb-tour-skip', 'data-tour-skip': '', onClick: finish }, l('跳过', 'Skip')),
        ),
        h('h2', { id: titleId, className: 'dsh-wb-tour-title', 'data-dsh-editorial-heading': '' }, current.title),
        h('p', { className: 'dsh-wb-tour-desc' }, current.desc),
        current.prompt
          ? h(
              'div',
              { className: 'dsh-wb-tour-inline-action' },
              h(
                Button,
                {
                  type: 'button',
                  variant: 'outline',
                  icon: isCopied ? 'check' : 'copy',
                  copied: isCopied,
                  'data-copy-prompt': current.prompt,
                  'data-copied': isCopied ? 'true' : undefined,
                  title: current.prompt,
                  onClick: () => { void handleCopy(); },
                },
                isCopied ? l('已复制', 'Copied') : (current.promptLabel || l('复制对话指令', 'Copy prompt')),
              ),
              h(
                'span',
                {
                  className: 'dsh-wb-copy-status',
                  role: 'status',
                  'data-visible': isCopied ? 'true' : undefined,
                },
                typeof copyNotice === 'string' ? copyNotice : '',
              ),
            )
          : null,
        h(
          'div',
          { className: 'dsh-wb-tour-footer' },
          step > 0
            ? h(Button, { type: 'button', variant: 'ghost', onClick: () => onStep?.(step - 1, true), 'data-tour-prev': '' }, l('上一步', 'Back'))
            : h('span', null),
          h(
            'div',
            { className: 'dsh-wb-tour-nav' },
            h(
              Button,
              {
                ref: nextBtnRef,
                type: 'button',
                variant: 'primary',
                'data-tour-next': '',
                onClick: () => (isLast ? finish() : onStep?.(step + 1, true)),
              },
              isLast ? l('完成引导', 'Done') : l('下一步', 'Next'),
            ),
          ),
        ),
      ),
    );
  }

  function Page({
    title,
    subtitle,
    icon = 'shield',
    lang = 'zh',
    navigation,
    toolbar,
    actions,
    children,
    workbench = false,
    showUpdates = true,
    className,
    rootRef: externalRootRef,
    style: controlledStyle,
    onStyleChange,
    styleSwitcherId,
    tourSteps = null,
    tourStorageKey = 'dsh-wb.tour.v1',
    onTourCopyPrompt,
    modalOpen = false,
    ...props
  }) {
    const [syncedStyle, setSyncedStyle] = useDshStyle(React);
    const activeStyle = normalizeDshStyle(controlledStyle ?? syncedStyle);
    const pageRootRef = useSafeRef(null);
    const triggerRef = useSafeRef(null);
    const [tour, setTour] = useSafeState({ open: false, step: 0, manual: false });
    const [tourLayout, setTourLayout] = useSafeState(null);
    const hasTour = Array.isArray(tourSteps) && tourSteps.length > 0;
    const isEn = String(lang || '').toLowerCase().startsWith('en');

    useSafeEffect(() => {
      if (!workbench || !hasTour || modalOpen || readTourDone(tourStorageKey)) return undefined;
      if (typeof setTimeout !== 'function') return undefined;
      const timer = setTimeout(() => {
        const hasModalInDom = typeof document !== 'undefined' && Boolean(document.querySelector?.('[role="dialog"][aria-modal="true"], dialog[open]:not([popover])'));
        if (!hasModalInDom && !readTourDone(tourStorageKey)) {
          setTour({ open: true, step: 0, manual: false });
        }
      }, 280);
      timer?.unref?.();
      return () => {
        if (typeof clearTimeout === 'function') clearTimeout(timer);
      };
    }, [workbench, hasTour, modalOpen, tourStorageKey]);

    useSafeEffect(() => {
      if (modalOpen && tour.open) {
        setTour(prev => (prev.open ? { ...prev, open: false } : prev));
      }
    }, [modalOpen, tour.open]);

    function closeTour(restoreFocus = false) {
      writeTourDone(tourStorageKey);
      setTour(prev => ({ ...prev, open: false }));
      if (restoreFocus && typeof setTimeout === 'function') {
        const timer = setTimeout(() => {
          const btn = triggerRef.current || pageRootRef.current?.querySelector?.('[data-tour-trigger]');
          btn?.focus?.();
        }, 0);
        timer?.unref?.();
      }
    }

    const bindPageRef = node => {
      pageRootRef.current = node;
      if (typeof externalRootRef === 'function') externalRootRef(node);
      else if (externalRootRef && typeof externalRootRef === 'object') externalRootRef.current = node;
    };

    return h(
      'section',
      {
        ...props,
        ref: bindPageRef,
        className: cx('dsh-wb-page', !workbench && 'dsh-wb-embedded', className),
        'data-dsh-style': activeStyle,
        'data-main': workbench ? 'true' : 'false',
      },
      h(Styles, { key: 'dsh-wb-styles' }),
      h(
        'header',
        { className: 'dsh-wb-header' },
        h(
          'div',
          { className: 'dsh-wb-heading' },
          h(
            'h1',
            { className: 'dsh-wb-title', 'data-dsh-editorial-heading': '' },
            h('span', { className: 'dsh-wb-brand', 'aria-hidden': 'true' }, h(Icon, { name: icon, size: 16 })),
            h('span', null, title),
          ),
          subtitle ? h('p', { className: 'dsh-wb-subtitle' }, subtitle) : null,
        ),
        navigation,
        h(
          'div',
          { className: 'dsh-wb-header-actions', 'data-window-drag-exclude': '' },
          actions,
          hasTour
            ? h(
                Button,
                {
                  ref: triggerRef,
                  type: 'button',
                  variant: 'ghost',
                  className: 'dsh-wb-tour-trigger',
                  'data-tour-trigger': '',
                  'aria-label': isEn ? 'Interactive guide' : '使用引导',
                  'aria-expanded': Boolean(tour.open),
                  title: isEn ? 'Interactive guide' : '使用引导',
                  onClick: () => (tour.open && tour.manual ? closeTour(true) : setTour({ open: true, step: 0, manual: true })),
                },
                isEn ? '? Tour' : '? 引导',
              )
            : null,
          h(StyleSwitcher, {
            id: styleSwitcherId,
            style: activeStyle,
            lang,
            compact: true,
            onChange: next => {
              setSyncedStyle(next);
              onStyleChange?.(next);
            },
          }),
        ),
      ),
      toolbar ? h('div', { className: 'dsh-wb-subbar' }, toolbar) : null,
      h('div', { className: 'dsh-wb-body', 'data-show-updates': showUpdates ? 'true' : 'false' }, children),
      hasTour && tour.open && !modalOpen
        ? h(CoachmarkTour, {
            rootRef: pageRootRef,
            steps: tourSteps,
            step: tour.step,
            manual: tour.manual,
            style: activeStyle,
            lang,
            layout: tourLayout,
            setLayout: setTourLayout,
            onStep: (next, isManual) => setTour({ open: true, step: next, manual: Boolean(isManual) }),
            onClose: closeTour,
            onCopyPrompt: onTourCopyPrompt,
          })
        : null,
    );
  }

  function Tabs({ items = [], value, onChange, label, id: customId, children, footer, className }) {
    const baseId = customId || useSafeId('dsh-wb-tabs');
    const active = items.some(item => item.id === value) ? value : items[0]?.id;
    function onKeyDown(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault?.();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + step + items.length) % items.length;
      if (items[next]) {
        onChange?.(items[next].id);
        event.currentTarget?.parentElement?.querySelectorAll?.('[role="tab"]')?.[next]?.focus?.();
      }
    }
    const tablist = h(
      'div',
      { className: cx('dsh-wb-tabs', className), role: 'tablist', 'aria-label': label },
      items.map((item, index) =>
        h(
          Button,
          {
            key: item.id,
            variant: 'ghost',
            icon: item.icon,
            role: 'tab',
            id: baseId + '-tab-' + item.id,
            'data-voice-tab': item.id,
            'aria-controls': baseId + '-panel',
            'aria-selected': active === item.id,
            tabIndex: active === item.id ? 0 : -1,
            className: 'dsh-wb-tab',
            onClick: () => onChange?.(item.id),
            onKeyDown: event => onKeyDown(event, index),
          },
          h('span', null, item.label),
          item.count !== undefined ? h('span', { className: 'dsh-wb-count' }, item.count) : null,
        ),
      ),
    );
    if (children === undefined && footer === undefined) return tablist;
    return h(
      'div',
      { className: 'dsh-wb-tabs-layout' },
      tablist,
      h(
        'div',
        {
          className: 'dsh-wb-tab-panel',
          id: baseId + '-panel',
          role: 'tabpanel',
          'aria-labelledby': baseId + '-tab-' + active,
        },
        children,
        footer,
      ),
    );
  }

  function Status({ children, tone = 'info', action, className }) {
    if (!children) return null;
    return h(
      'div',
      {
        className: cx('dsh-wb-status', className),
        'data-tone': tone,
        role: tone === 'error' ? 'alert' : 'status',
        'aria-live': tone === 'error' ? 'assertive' : 'polite',
      },
      h(Icon, { name: tone === 'success' ? 'check' : 'info', size: 16 }),
      h('div', { className: 'dsh-wb-status-text' }, children),
      action ? h('div', { className: 'dsh-wb-status-action' }, action) : null,
    );
  }

  function Empty({ title, children, action = null, icon = 'file', className }) {
    return h(
      'div',
      { className: cx('dsh-wb-empty', className) },
      h('span', { className: 'dsh-wb-empty-icon', 'aria-hidden': 'true' }, h(Icon, { name: icon, size: 22 })),
      h('h2', null, title),
      children ? h('div', { className: 'dsh-wb-empty-desc' }, children) : null,
      action ? h('div', { className: 'dsh-wb-actions' }, action) : null,
    );
  }

  function Split({ list, detail, selected, onBack, backLabel, className, listWidth = 360 }) {
    const ref = useSafeRef(null);
    useSafeEffect(() => {
      if (!selected || !ref.current || !(ref.current.clientWidth <= 760)) return;
      const heading = ref.current.querySelector?.('.dsh-wb-detail h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus?.({ preventScroll: true });
      }
    }, [selected]);
    return h(
      'div',
      {
        ref,
        className: cx('dsh-wb-split', className),
        'data-selected': selected ? 'true' : 'false',
        style: { '--dsh-list-width': listWidth + 'px' },
      },
      h('div', { className: 'dsh-wb-master' }, list),
      h(
        'div',
        { className: 'dsh-wb-detail' },
        selected
          ? h(
              Button,
              { className: 'dsh-wb-back', icon: 'left', variant: 'ghost', onClick: onBack },
              backLabel,
            )
          : null,
        detail,
      ),
    );
  }

  function Row({ title, meta, description, active, onClick, children, status, statusTone, className, disabled }) {
    return h(
      'div',
      {
        className: cx('dsh-wb-row', 'dsh-row', active && 'is-selected', className),
        'data-dsh-row': '',
        'data-selected': active ? 'true' : 'false',
      },
      children ? h('div', { className: 'dsh-wb-row-select' }, children) : null,
      h(
        'button',
        {
          type: 'button',
          className: 'dsh-wb-row-btn',
          onClick,
          disabled,
          'aria-pressed': Boolean(active),
        },
        h(
          'span',
          { className: 'dsh-wb-row-head' },
          h('strong', null, title),
          status ? h('span', { className: 'dsh-wb-tag', 'data-tone': statusTone }, status) : null,
        ),
        meta ? h('span', { className: 'dsh-wb-row-meta' }, meta) : null,
        description ? h('span', { className: 'dsh-wb-row-desc' }, description) : null,
      ),
    );
  }

  function Details({ summary, children, open, className }) {
    return h(
      'details',
      { className: cx('dsh-wb-details', className), open },
      h(
        'summary',
        { className: 'dsh-wb-summary' },
        h('span', null, summary),
        h(Icon, { name: 'down', size: 14 }),
      ),
      h('div', { className: 'dsh-wb-details-body' }, children),
    );
  }

  let lastWbCopyAnnouncement = '';

  function legacyClipboardWrite(text) {
    try {
      if (typeof document === 'undefined' || typeof document.createElement !== 'function' || typeof document.execCommand !== 'function' || !document.body?.append) {
        return false;
      }
      const field = Object.assign(document.createElement('textarea'), { value: text });
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
      document.body.append(field);
      field.select?.();
      try { return Boolean(document.execCommand('copy')); } finally { field.remove?.(); }
    } catch {
      return false;
    }
  }

  async function writeClipboardText(text) {
    if (!text) return false;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through to legacy textarea copy when clipboard API rejects.
    }
    return legacyClipboardWrite(text);
  }

  function CopyPrompt({
    prompt,
    label,
    copiedLabel = 'Copied',
    statusText = 'Copied to clipboard',
    failedText = 'Copy failed',
    variant = 'outline',
    size = 'sm',
    className,
    onCopied,
  }) {
    const text = typeof prompt === 'string' ? prompt.trim() : '';
    const [copied, setCopied] = useSafeState(false);
    const [failed, setFailed] = useSafeState(false);
    const [announcement, setAnnouncement] = useSafeState('');
    const timerRef = useSafeRef(null);
    useSafeEffect(() => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }, []);
    if (!text) return null;

    const isCopied = copied === true;
    const isFailed = failed === true;
    const triggerCopy = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      writeClipboardText(text).then(ok => {
        setCopied(ok);
        setFailed(!ok);
        let msg = ok ? statusText : failedText;
        if (msg === lastWbCopyAnnouncement) msg += '\u00A0';
        lastWbCopyAnnouncement = msg;
        setAnnouncement(msg);
        if (ok) onCopied?.(text);
        if (typeof setTimeout === 'function') {
          const timer = setTimeout(() => {
            setCopied(false);
            setFailed(false);
            setAnnouncement('');
          }, 2000);
          timer?.unref?.();
          timerRef.current = timer;
        }
      });
    };

    return h(
      'span',
      { className: cx('dsh-wb-copy-wrap', className) },
      h(
        Button,
        {
          type: 'button',
          variant,
          size,
          icon: isCopied ? 'check' : 'copy',
          copied: isCopied,
          'data-copied': isCopied ? 'true' : undefined,
          'data-failed': isFailed ? 'true' : undefined,
          'data-copy-prompt': text,
          title: text,
          onClick: triggerCopy,
        },
        isCopied ? copiedLabel : (label || text),
      ),
      h(
        'span',
        {
          className: 'dsh-wb-copy-status',
          role: 'status',
          'data-visible': isCopied || isFailed ? 'true' : undefined,
        },
        typeof announcement === 'string' ? announcement : '',
      ),
      isFailed ? h('code', { className: 'dsh-wb-copy-fallback', tabIndex: 0 }, text) : null,
    );
  }

  function Dialog({ title, children, onClose, closeLabel = 'Close', className, busy = false, footer, tone, wide = false }) {
    const [style] = useDshStyle(React);
    const titleId = useSafeId('dsh-wb-dialog-title');
    const P = primitives();
    const close = () => {
      if (!busy) onClose?.();
    };
    return h(
      P.Modal,
      {
        open: true,
        headless: true,
        dshStyle: style,
        title,
        closeLabel,
        onClose: close,
        backdropBlur: false,
        className: cx('dsh-wb-dialog', wide && 'dsh-wb-dialog-wide', className),
      },
      h(Styles, { key: 'dsh-wb-dialog-styles' }),
      h(
        'div',
        {
          ref: createOverlaySyncRef(style),
          className: 'dsh-wb-dialog-frame',
          'data-dsh-style': style,
          'data-window-drag-exclude': '',
        },
        h(
          'header',
          { className: 'dsh-wb-dialog-header' },
          h('h2', { id: titleId, 'data-tone': tone, 'data-dsh-editorial-heading': '' }, title),
          h(IconButton, { icon: 'close', label: closeLabel, disabled: busy, onClick: close }),
        ),
        h('div', { className: 'dsh-wb-dialog-body', 'aria-busy': busy ? 'true' : undefined }, children),
        footer ? h('footer', { className: 'dsh-wb-dialog-footer' }, footer) : null,
      ),
    );
  }

  function register(ctx, { id, label, icon, component, inject, order = 50 }) {
    ctx.slots.inject('main', () =>
      ctx.slots.register(
        { name: 'main', key: id, inject: () => ({ ...(inject?.() || {}), workbench: true }) },
        component,
      ),
    );
    ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register({ name: 'sidebar.panellist', id, order, label }, function WorkbenchIcon({ size }) {
        return h(Icon, { name: icon, size });
      }),
    );
  }

  const WORKBENCH_V2_CSS = `
.dsh-wb-page,
.dsh-wb-dialog-frame,
.dsh-wb-tour-layer {
  --w-bg-base: var(--dsw-alias-bg-base, #ffffff);
  --w-bg-1: var(--dsw-alias-bg-layer-1, #f8fafc);
  --w-bg-2: var(--dsw-alias-bg-layer-2, #f1f5f9);
  --w-border: var(--dsw-alias-border-l2, #e2e8f0);
  --w-border-strong: var(--dsw-alias-border-l3, #cbd5e1);
  --w-ink: var(--dsw-alias-label-primary, #1e293b);
  --w-muted: var(--dsw-alias-label-secondary, #526075);
  --w-tertiary: var(--dsw-alias-label-tertiary, #64748b);
  --w-accent: var(--dsw-alias-state-business-primary, #4176e6);
  --dsh-plugin-workbench-accent: var(--w-accent);
  --w-accent-soft: var(--dsw-alias-interactive-bg-hover-accent, rgba(65, 118, 230, 0.10));
  --w-hover: var(--dsw-alias-interactive-bg-hover, rgba(15, 23, 42, 0.045));
  --w-active: var(--dsw-alias-interactive-bg-active, rgba(65, 118, 230, 0.11));
  --w-primary-fill: var(--dsw-alias-button-primary-fill, #3b6fe0);
  --w-primary-hover: var(--dsw-alias-button-primary-hover, #2f5fc8);
  --w-primary-ink: var(--dsw-alias-button-primary-ink, #ffffff);
  --w-danger: var(--dsw-alias-state-error-primary, #c6392f);
  --w-danger-soft: var(--dsw-alias-interactive-bg-hover-danger, rgba(198, 57, 47, 0.10));
  --w-warn: var(--dsw-alias-state-warn-primary, #b45309);
  --w-warn-label: var(--dsw-alias-state-warn-label, #92400e);
  --w-warn-soft: var(--dsw-alias-state-warn-tertiary, #fef3c7);
  --w-success: var(--dsw-alias-state-success-primary, #1f7a53);
  --w-link: var(--dsw-alias-link, #2f63d4);
  --w-radius-xs: var(--dsw-radius-xs, 6px);
  --w-radius-sm: var(--dsw-radius-sm, 8px);
  --w-radius-md: var(--dsw-radius-md, 12px);
  box-sizing: border-box;
  color: var(--w-ink);
  font-family: var(--dsh-font-family-content, system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif);
  font-size: 13px;
  line-height: 20px;
  text-align: start;
}

.dsh-wb-page *,
.dsh-wb-page *::before,
.dsh-wb-page *::after,
.dsh-wb-dialog-frame *,
.dsh-wb-dialog-frame *::before,
.dsh-wb-dialog-frame *::after,
.dsh-wb-tour-layer *,
.dsh-wb-tour-layer *::before,
.dsh-wb-tour-layer *::after {
  box-sizing: border-box;
}

.dsh-wb-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  padding-block-start: var(--dsh-frame-top-clearance, 0px);
  padding-inline-start: var(--dsh-frame-leading-clearance, 0px);
  background: var(--w-bg-base);
  container-type: inline-size;
  container-name: dsh-workbench;
}

.dsh-wb-embedded {
  height: min(740px, 82dvh);
  padding: 0;
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  border-radius: var(--w-radius-md);
  overflow: clip;
}

.dsh-wb-header {
  display: flex;
  flex: none;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px;
  border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
}

.dsh-wb-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dsh-wb-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  font-weight: 650;
  color: var(--w-ink);
}

.dsh-wb-subtitle {
  margin: 0;
  padding-inline-start: 35px;
  font-size: 12px;
  line-height: 18px;
  color: var(--w-muted);
}

.dsh-wb-brand,
.dsh-wb-empty-icon {
  display: grid;
  place-items: center;
  flex: none;
  color: var(--w-accent);
  background: var(--w-accent-soft);
  border-radius: var(--w-radius-sm);
}

.dsh-wb-brand {
  width: 26px;
  height: 26px;
}

.dsh-wb-header-actions,
.dsh-wb-actions,
.dsh-wb-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dsh-wb-header-actions {
  margin-inline-start: auto;
  justify-content: flex-end;
  flex: none;
}

.dsh-wb-subbar {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 8px 18px;
  background: var(--w-bg-1);
  border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
}

.dsh-wb-body,
.dsh-wb-tabs-layout,
.dsh-wb-tab-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.dsh-wb-body {
  overflow: auto;
  overscroll-behavior: contain;
}

.dsh-wb-body > [data-plugin-update-footer],
.dsh-wb-tab-panel > [data-plugin-update-footer] {
  box-sizing: border-box;
  width: min(100%, 960px);
  margin: auto auto 0;
  padding: 14px 20px 22px;
  border-block-start: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
}

.dsh-wb-body[data-show-updates="false"] [data-plugin-update-footer] {
  display: none;
}

.dsh-wb-tabs {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  padding: 6px 18px 0;
  border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
}

.dsh-wb-tab.dsh-wb-tab {
  flex: none;
  min-height: 34px;
  padding: 6px 12px 8px;
  border: 0;
  border-radius: var(--w-radius-xs) var(--w-radius-xs) 0 0;
  background: transparent;
  color: var(--w-muted);
  font-weight: 550;
  white-space: nowrap;
  box-shadow: none;
}

.dsh-wb-tab.dsh-wb-tab[aria-selected="true"] {
  color: var(--w-ink);
  background: var(--w-hover);
  font-weight: 650;
}

.dsh-wb-tab-panel {
  overflow: auto;
  overscroll-behavior: contain;
}

.dsh-wb-count,
.dsh-wb-tag {
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 1px 7px;
  border-radius: var(--w-radius-xs);
  background: var(--w-bg-2);
  color: var(--w-muted);
  font-size: 11.5px;
  line-height: 17px;
  font-weight: 550;
}

.dsh-wb-tag[data-tone="error"],
.dsh-wb-tag[data-tone="critical"],
.dsh-wb-tag[data-tone="high"] {
  background: var(--w-danger-soft);
  color: var(--w-danger);
}

.dsh-wb-tag[data-tone="warn"],
.dsh-wb-tag[data-tone="medium"] {
  background: var(--w-warn-soft);
  color: var(--w-warn-label);
}

.dsh-wb-tag[data-tone="success"] {
  background: var(--w-accent-soft);
  color: var(--w-success);
}

/* Buttons (both host primitives().Button and semantic FallbackButton) */
.dsh-wb-btn.dsh-wb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: auto;
  min-height: 30px;
  padding: 4px 11px;
  border-radius: var(--w-radius-sm);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  font-weight: 550;
  cursor: pointer;
  text-align: center;
  white-space: normal;
  text-decoration: none;
}

.dsh-wb-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dsh-wb-btn-outline.dsh-wb-btn-outline {
  background: var(--w-bg-base);
  color: var(--w-ink);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border-strong);
  box-shadow: var(--dsh-button-shadow, none);
}

.dsh-wb-btn-ghost.dsh-wb-btn-ghost {
  background: transparent;
  color: var(--w-muted);
  border: var(--dsh-control-border-width, 0.5px) solid transparent;
}

.dsh-wb-btn-primary.dsh-wb-btn-primary {
  background: var(--w-primary-fill);
  color: var(--w-primary-ink);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-primary-fill);
  box-shadow: var(--dsh-button-shadow, none);
}

.dsh-wb-btn-danger.dsh-wb-btn-danger {
  background: var(--w-bg-base);
  color: var(--w-danger);
  border: var(--dsh-control-border-width, 0.5px) solid color-mix(in oklab, var(--w-danger) 32%, var(--w-border));
}

.dsh-wb-icon-btn.dsh-wb-icon-btn {
  flex: none;
  width: 30px;
  min-width: 30px;
  padding-inline: 0;
}

.dsh-fallback-btn-icon {
  display: inline-grid;
  place-items: center;
  flex: none;
}

@media (hover: hover) {
  .dsh-wb-btn-outline:hover:not(:disabled) {
    background: var(--w-hover);
    border-color: var(--w-accent);
  }
  .dsh-wb-btn-ghost:hover:not(:disabled) {
    background: var(--w-hover);
    color: var(--w-ink);
  }
  .dsh-wb-btn-primary:hover:not(:disabled) {
    background: var(--w-primary-hover);
    border-color: var(--w-primary-hover);
  }
  .dsh-wb-btn-danger:hover:not(:disabled) {
    background: var(--w-danger-soft);
    border-color: var(--w-danger);
  }
}

/* Inputs, Textareas, Checkboxes & Choice Menus */
.dsh-wb-input.dsh-wb-input,
.dsh-fallback-input-wrap.dsh-wb-input {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  width: 100%;
  min-height: 32px;
  padding: 3px 10px;
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border-strong);
  border-radius: var(--w-radius-sm);
  background: var(--w-bg-base);
  color: var(--w-ink);
  box-shadow: none;
}

.dsh-fallback-input-icon {
  display: inline-grid;
  place-items: center;
  flex: none;
  color: var(--w-tertiary);
}

.dsh-wb-input > input {
  flex: 1;
  min-width: 0;
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  padding: 2px 0;
}

.dsh-wb-input:focus-within,
.dsh-wb-textarea:focus-visible {
  border-color: var(--w-accent);
  outline: 2px solid var(--w-accent);
  outline-offset: 1px;
}

.dsh-wb-textarea {
  width: 100%;
  min-width: 0;
  min-height: 120px;
  padding: 8px 11px;
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border-strong);
  border-radius: var(--w-radius-sm);
  background: var(--w-bg-base);
  color: var(--w-ink);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  resize: vertical;
}

.dsh-wb-checkbox.dsh-wb-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 2px 0;
  color: var(--w-ink);
  cursor: pointer;
  font-size: 13px;
}

.dsh-wb-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  flex: none;
  accent-color: var(--w-accent);
}

.dsh-wb-checkbox-hidden > span {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.dsh-wb-switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dsh-wb-switch-text {
  font-size: 13px;
  line-height: 20px;
  color: var(--w-ink);
  white-space: nowrap;
}

.dsh-wb-choice {
  display: block;
  min-width: 0;
}

.dsh-wb-choice > .dsh-style-fallback-wrap,
.dsh-wb-menu.dsh-wb-menu {
  display: block;
  width: 100%;
  min-width: 0;
}

.dsh-wb-menu-btn.dsh-wb-menu-btn {
  width: 100%;
  min-height: 32px;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 10px;
  text-align: start;
}

.dsh-wb-menu-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-wb-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.dsh-wb-search-clear.dsh-wb-search-clear {
  position: absolute;
  inset-inline-end: 3px;
  width: 24px;
  min-width: 24px;
  min-height: 24px;
}

.dsh-wb-search:has(.dsh-wb-search-clear) .dsh-wb-input {
  padding-inline-end: 28px;
}

.dsh-wb-search input[type="search"]::-webkit-search-cancel-button,
.dsh-wb-search input[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}

/* Status Banner */
.dsh-wb-status {
  display: flex;
  flex: none;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 18px 0;
  padding: 9px 12px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-1);
  color: var(--w-muted);
  font-size: 12.5px;
  line-height: 19px;
}

.dsh-wb-status > svg {
  flex: none;
  margin-block-start: 1.5px;
}

.dsh-wb-status-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.dsh-wb-status[data-tone="error"] {
  background: var(--w-danger-soft);
  border-color: color-mix(in oklab, var(--w-danger) 28%, var(--w-border));
  color: var(--w-danger);
}

.dsh-wb-status[data-tone="warn"] {
  background: var(--w-warn-soft);
  color: var(--w-warn-label);
}

.dsh-wb-status[data-tone="success"] {
  background: var(--w-accent-soft);
  color: var(--w-success);
}

/* Empty State */
.dsh-wb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 200px;
  flex: 1;
  padding: 28px 18px;
  text-align: center;
  overflow-wrap: anywhere;
}

.dsh-wb-empty-icon {
  width: 44px;
  height: 44px;
  margin-block-end: 4px;
}

.dsh-wb-empty > h2 {
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
  color: var(--w-ink);
}

.dsh-wb-empty-desc {
  max-width: 44ch;
  color: var(--w-muted);
  font-size: 13px;
  line-height: 20px;
}

/* Master-Detail Split & Interactive Rows */
.dsh-wb-split {
  display: grid;
  grid-template-columns: minmax(250px, var(--dsh-list-width, 360px)) minmax(0, 1fr);
  flex: 1;
  min-height: 440px;
  min-width: 0;
}

.dsh-wb-master {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  border-inline-end: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
}

.dsh-wb-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  overflow-wrap: anywhere;
  padding: 20px 24px;
  background: var(--w-bg-base);
}

@media (prefers-reduced-motion: no-preference) {
  .dsh-wb-detail > article {
    opacity: 1;
    translate: 0px 0px;
    transition: opacity var(--dsh-motion-base, 200ms) var(--dsh-ease-out),
      translate var(--dsh-motion-base, 200ms) var(--dsh-ease-out);
  }
  @starting-style {
    .dsh-wb-detail > article {
      opacity: 0;
      translate: 0px 4px;
    }
  }
}

.dsh-wb-master-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-1);
}

.dsh-wb-row {
  display: flex;
  min-width: 0;
  position: relative;
  border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  border-inline-start: 3px solid transparent;
}

.dsh-wb-row.is-selected {
  background: var(--w-active);
  border-inline-start-color: var(--w-accent);
}

.dsh-wb-row.is-selected .dsh-wb-tag:not([data-tone]) {
  background: var(--w-accent-soft);
  color: var(--w-accent);
}

.dsh-wb-row-select {
  display: flex;
  align-items: flex-start;
  padding: 14px 0 0 12px;
}

.dsh-wb-row-btn.dsh-wb-row-btn {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 5px;
  width: 100%;
  min-width: 0;
  padding: 13px 14px;
  border: 0 !important;
  box-shadow: none !important;
  background: transparent;
  color: inherit;
  text-align: start;
  cursor: pointer;
}

.dsh-wb-row-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.dsh-wb-row-head > strong {
  font-size: 13.5px;
  line-height: 19px;
  font-weight: 600;
  color: var(--w-ink);
  overflow-wrap: anywhere;
}

.dsh-wb-row-meta,
.dsh-wb-row-desc {
  color: var(--w-muted);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}

.dsh-wb-row-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dsh-wb-back.dsh-wb-back {
  display: none;
  align-self: flex-start;
  margin-block-end: 12px;
}

/* Details Disclosure with Animated Chevron */
.dsh-wb-details {
  border-block-start: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  padding-block: 14px;
}

.dsh-wb-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  list-style: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--w-ink);
}

.dsh-wb-summary::-webkit-details-marker {
  display: none;
}

.dsh-wb-details-body {
  padding-block-start: 10px;
}

/* Interactive Spotlight + Directional Arrow CoachmarkTour & CopyPrompt */
[popover]:is(:popover-open, .\\:popover-open) {
  display: block;
}

.dsh-wb-tour-trigger.dsh-wb-tour-trigger {
  font-weight: 600;
}

.dsh-wb-tour-layer {
  --tour-accent: var(--dsw-alias-state-business-primary, #4176e6);
  --tour-bg: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base, #ffffff));
  --tour-ink: var(--dsw-alias-label-primary, #1b2230);
  --tour-muted: var(--dsw-alias-label-secondary, #5b667a);
  --tour-border: var(--dsw-alias-border-l2, #d8e0ec);
  --tour-radius: var(--dsw-radius-md, 12px);
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  overflow: visible;
  pointer-events: none;
  z-index: 2147483000;
  color: var(--tour-ink);
  font: 13px/1.55 var(--ds-font-family-ui, system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif);
}

.dsh-wb-tour-layer[data-dsh-style="pixel8bit"] {
  --tour-radius: 0px;
}

.dsh-wb-tour-spotlight {
  position: fixed;
  pointer-events: none;
  border-radius: calc(var(--tour-radius) * 0.75 + 2px);
  box-shadow:
    0 0 0 2px var(--tour-accent),
    0 0 0 5px color-mix(in oklab, var(--tour-accent) 22%, transparent),
    0 0 0 9999px rgba(15, 23, 42, 0.26);
}

.dsh-wb-tour-layer[data-dsh-style="pixel8bit"] .dsh-wb-tour-spotlight {
  border-radius: 0px;
}

.dsh-wb-tour-backdrop {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: rgba(15, 23, 42, 0.24);
}

.dsh-wb-tour-card {
  position: fixed;
  inset: auto;
  margin: 0;
  width: min(328px, calc(100dvw - 24px));
  max-block-size: calc(100dvh - 24px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 13px 15px 12px;
  border: 1px solid var(--tour-border);
  border-radius: var(--tour-radius);
  background: var(--tour-bg);
  color: var(--tour-ink);
  box-shadow: var(--dsw-elevation-prominent, 0 16px 40px rgba(15, 23, 42, 0.18));
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dsh-wb-tour-layer[data-dsh-style="pixel8bit"] .dsh-wb-tour-card {
  border-width: 2px;
  border-color: #1e2826;
  box-shadow: 4px 4px 0px #1e2826;
}

.dsh-wb-tour-arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--tour-bg);
  transform: rotate(45deg);
  pointer-events: none;
}

.dsh-wb-tour-card[data-side="bottom"] > .dsh-wb-tour-arrow {
  top: -6px;
  left: calc(var(--arrow-x, 28px) - 5px);
  border-top: 1px solid var(--tour-border);
  border-left: 1px solid var(--tour-border);
}

.dsh-wb-tour-card[data-side="top"] > .dsh-wb-tour-arrow {
  bottom: -6px;
  left: calc(var(--arrow-x, 28px) - 5px);
  border-bottom: 1px solid var(--tour-border);
  border-right: 1px solid var(--tour-border);
}

.dsh-wb-tour-card[data-side="right"] > .dsh-wb-tour-arrow {
  left: -6px;
  top: calc(var(--arrow-y, 24px) - 5px);
  border-bottom: 1px solid var(--tour-border);
  border-left: 1px solid var(--tour-border);
}

.dsh-wb-tour-card[data-side="left"] > .dsh-wb-tour-arrow {
  right: -6px;
  top: calc(var(--arrow-y, 24px) - 5px);
  border-top: 1px solid var(--tour-border);
  border-right: 1px solid var(--tour-border);
}

.dsh-wb-tour-layer[data-dsh-style="pixel8bit"] .dsh-wb-tour-card[data-side="bottom"] > .dsh-wb-tour-arrow {
  border-top: 2px solid #1e2826;
  border-left: 2px solid #1e2826;
}

.dsh-wb-tour-layer[data-dsh-style="pixel8bit"] .dsh-wb-tour-card[data-side="top"] > .dsh-wb-tour-arrow {
  border-bottom: 2px solid #1e2826;
  border-right: 2px solid #1e2826;
}

.dsh-wb-tour-layer[data-dsh-style="pixel8bit"] .dsh-wb-tour-card[data-side="right"] > .dsh-wb-tour-arrow {
  border-bottom: 2px solid #1e2826;
  border-left: 2px solid #1e2826;
}

.dsh-wb-tour-layer[data-dsh-style="pixel8bit"] .dsh-wb-tour-card[data-side="left"] > .dsh-wb-tour-arrow {
  border-top: 2px solid #1e2826;
  border-right: 2px solid #1e2826;
}

.dsh-wb-tour-card[data-side="center"] > .dsh-wb-tour-arrow {
  display: none;
}

.dsh-wb-tour-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dsh-wb-tour-step-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dsh-wb-tour-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  background: color-mix(in oklab, var(--tour-accent) 14%, transparent);
  color: var(--tour-accent);
}

.dsh-wb-tour-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dsh-wb-tour-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--tour-border);
}

.dsh-wb-tour-dot[data-active="true"] {
  width: 14px;
  background: var(--tour-accent);
}

.dsh-wb-tour-skip {
  min-block-size: 24px;
  min-inline-size: 24px;
  padding: 2px 6px;
  border: 0;
  border-radius: var(--dsw-radius-xs, 6px);
  background: transparent;
  color: var(--tour-muted);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

.dsh-wb-tour-skip:hover {
  color: var(--tour-ink);
  background: var(--dsw-alias-interactive-bg-hover, rgba(15, 23, 42, 0.05));
}

.dsh-wb-tour-title {
  margin: 0;
  font-size: 14px;
  line-height: 1.38;
  font-weight: 650;
  color: var(--tour-ink);
}

.dsh-wb-tour-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--tour-muted);
}

.dsh-wb-tour-inline-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-block-start: 2px;
}

.dsh-wb-tour-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-block-start: 2px;
  padding-block-start: 8px;
  border-block-start: 0.5px solid var(--tour-border);
}

.dsh-wb-tour-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-inline-start: auto;
}

@media (pointer: coarse) {
  .dsh-wb-tour-skip {
    min-block-size: 32px;
    padding: 4px 10px;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .dsh-wb-tour-spotlight {
    transition:
      top 0.24s cubic-bezier(0.22, 1, 0.36, 1),
      left 0.24s cubic-bezier(0.22, 1, 0.36, 1),
      width 0.24s cubic-bezier(0.22, 1, 0.36, 1),
      height 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dsh-wb-tour-card {
    transition: top 0.22s cubic-bezier(0.22, 1, 0.36, 1), left 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dsh-wb-tour-dot {
    transition: width 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dsh-wb-tour-spotlight,
  .dsh-wb-tour-card,
  .dsh-wb-tour-dot {
    transition: none;
  }
}

.dsh-wb-prompt-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.dsh-wb-empty .dsh-wb-prompt-chips {
  justify-content: center;
}

.dsh-wb-copy-wrap {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  max-width: 100%;
}

.dsh-wb-copy-status {
  font-size: 11.5px;
  line-height: 17px;
  color: var(--w-muted);
  opacity: 0;
  pointer-events: none;
  max-inline-size: 0;
  overflow: clip;
  white-space: nowrap;
  transition: opacity 0.16s ease;
}

.dsh-wb-copy-status[data-visible="true"] {
  opacity: 1;
  max-inline-size: 280px;
  padding: 2px 6px;
  border-radius: var(--w-radius-xs);
  background: var(--w-bg-2);
}

.dsh-wb-copy-fallback {
  display: inline-block;
  max-width: 100%;
  padding: 2px 6px;
  border-radius: var(--w-radius-xs);
  background: var(--w-bg-2);
  color: var(--w-ink);
  font: 11.5px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace;
  overflow-wrap: anywhere;
  user-select: text;
}

/* Portaled / Fallback Modal Dialog */
.dsh-wb-dialog.dsh-wb-dialog {
  box-sizing: border-box;
  width: min(560px, 100%);
  max-height: 100%;
  min-height: 0;
  padding: 0;
  gap: 0;
  border: 0;
  background: var(--w-bg-1);
  box-shadow: var(--dsw-elevation-prominent);
}

.dsh-wb-dialog-wide.dsh-wb-dialog-wide {
  width: min(860px, 100%);
  max-width: min(860px, calc(100dvw - 32px));
}

.dsh-wb-dialog-frame {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100dvh - 40px);
  background: var(--w-bg-1);
  color: var(--w-ink);
}

.dsh-wb-dialog-header,
.dsh-wb-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: 8px;
  padding: 12px 18px;
  background: var(--w-bg-base);
}

.dsh-wb-dialog-header {
  border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
}

.dsh-wb-dialog-header > h2 {
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  font-weight: 650;
  color: var(--w-ink);
}

.dsh-wb-dialog-header > h2[data-tone="warn"] {
  color: var(--w-warn);
}

.dsh-wb-dialog-body {
  min-height: 0;
  min-width: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 18px;
}

.dsh-wb-dialog-footer {
  flex-wrap: wrap;
  justify-content: flex-end;
  border-block-start: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
}

/* Focus Indicators */
.dsh-wb-page :focus-visible,
.dsh-wb-dialog-frame :focus-visible,
.dsh-wb-tour-layer :focus-visible {
  outline: 2px solid var(--w-accent);
  outline-offset: 2px;
}

/* Container Queries */
@container dsh-workbench (max-width: 960px) {
  .dsh-wb-split {
    grid-template-columns: minmax(230px, 36%) minmax(0, 1fr);
  }
}

@container dsh-workbench (max-width: 760px) {
  .dsh-wb-header {
    flex-wrap: wrap;
    padding: 10px 14px;
  }
  .dsh-wb-subtitle {
    padding-inline-start: 0;
  }
  .dsh-wb-header-actions {
    width: 100%;
    margin-inline-start: 0;
    justify-content: flex-start;
  }
  .dsh-wb-tabs {
    padding-inline: 12px;
  }
  .dsh-wb-split {
    display: flex;
    flex-direction: column;
    min-height: 360px;
  }
  .dsh-wb-split[data-selected="false"] > .dsh-wb-detail {
    display: none;
  }
  .dsh-wb-split[data-selected="true"] > .dsh-wb-master {
    display: none;
  }
  .dsh-wb-master {
    border-inline-end: 0;
  }
  .dsh-wb-detail {
    padding: 16px 14px;
  }
  .dsh-wb-back.dsh-wb-back {
    display: inline-flex;
  }
}
`;

  const styles = DSH_THEMES_AND_MOTION_CSS + '\n' + WORKBENCH_V2_CSS;

  function ensureStylesInHead() {
    if (typeof document === 'undefined' || !document.head || typeof document.querySelector !== 'function') {
      return false;
    }
    const id = 'dsh-workbench-ui-v2';
    if (!document.querySelector('style[data-plugin-css="' + id + '"]')) {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-plugin-css', id);
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
    return true;
  }

  function Styles() {
    useSafeEffect(() => {
      ensureStylesInHead();
    }, []);
    if (ensureStylesInHead()) return null;
    return h('style', { 'data-plugin-css': 'dsh-workbench-ui-v2' }, styles);
  }

  return {
    Icon,
    Button,
    IconButton,
    Input,
    Checkbox,
    Switch,
    ChoiceMenu,
    Search,
    Page,
    Tabs,
    Status,
    Empty,
    Split,
    Row,
    Details,
    CopyPrompt,
    CoachmarkTour,
    computeTourLayout,
    writeClipboardText,
    Dialog,
    StyleSwitcher,
    Styles,
    register,
    primitives,
    styles,
    DSH_STYLES,
    useDshStyle,
    readDshStyle,
    writeDshStyle,
    subscribeDshStyle,
    createOverlaySyncRef,
  };
}

// Editable browser entry. Build with node scripts/build-client.mjs.
window.__ModuleLoader__.load(__stardustUpdatesWrap({
  id: 'dsh-voice',
  factory: require => {
    const React = require('react');
    const W = createWorkbenchUI(React, require);

    const { useState, useEffect, useRef, useId } = React;
    const h = React.createElement;
    const ROUTE = 'api/dsh-voice/studio';
    let language = 'zh';
    const listeners = new Set();

    const words = {
      title: ['语音工作室', 'Voice Studio'],
      subtitle: ['音色试听、多角色对话合成、8秒克隆角色、同步字幕跟读与词典工作台。', 'Audition voices, compose multi-speaker dialogues, clone mic voices, and play synced subtitles.'],
      tabVoices: ['音色与人设', 'Voices & Personas'],
      tabStudio: ['试配与对话合成', 'Studio & Dialogue'],
      tabMic: ['麦克风与克隆角色', 'Mic & Clone Voices'],
      tabLexicon: ['发音词典与自检', 'Lexicon & Health'],
      tabLibrary: ['工作区成品库', 'Workspace Library'],
      refresh: ['刷新状态', 'Refresh'],
      loading: ['正在读取语音工作台…', 'Loading Voice Studio…'],
      retry: ['重新读取', 'Retry'],
      loadError: ['无法连接 Voice Studio。请确认 DSH 仍在运行，然后重试。', 'Cannot load Voice Studio. Check that DSH is running, then retry.'],
      session: ['DSH 会话已失效，请重新打开 DSH 页面。', 'The DSH session has expired. Reopen the DSH page.'],
      readonly: ['当前配置为只读。你可以试听音色、合成对话、浏览成品库并转写录音；保存默认设置或克隆别名需可写权限。', 'Settings are read-only. You can still audition voices, synthesize dialogues, play library media, and transcribe audio.'],
      guideSummary: ['使用指南与真·创作闭环（点击展开）', 'Creative workflow guide & quick AI voice prompts'],
      guideStep1: ['1. 选音色/跟读试听：在「音色与人设」搜索或联网加载 300+ Edge 音色，点击 ▶ 试听并在顶部字幕条点击任意句跳转跟读。', '1. Pick & follow along: Browse or fetch 300+ Edge voices, click ▶ to preview, and click any subtitle cue in the top player to seek.'],
      guideStep2: ['2. 多角色台本直出：在「试配与对话合成」直接编排多角色台词、一键合成双人播客试听或保存到 voice_outputs/。', '2. Multi-speaker composer: Arrange multi-role dialogue scripts in Studio and synthesize MP3 + synced cues directly in the panel.'],
      guideStep3: ['3. 8 秒录音建克隆 & 成品库：在「麦克风与克隆角色」朗读 5–10 秒一键生成克隆角色；在「工作区成品库」随时回放音频与同步字幕。', '3. 8s mic clone & library: Record 5–10s to create a custom voice role in 1 click, and replay workspace audio + .srt/.vtt in Library.'],
      audition: ['试听', 'Preview'],
      auditioning: ['合成中…', 'Synthesizing…'],
      setDefault: ['设为默认音色', 'Set default'],
      isDefault: ['当前默认', 'Default'],
      copyPrompt: ['复制配音指令', 'Copy prompt'],
      copied: ['已复制', 'Copied'],
      copyStatus: ['已复制指令，粘贴到对话发送即可', 'Prompt copied — paste into chat'],
      copyFailed: ['复制失败', 'Copy failed'],
      searchVoice: ['搜索音色 ID、地区或风格', 'Search voice ID, locale, or tag'],
      clear: ['清空', 'Clear'],
      genderAll: ['全部性别', 'All genders'],
      female: ['女声', 'Female'],
      male: ['男声', 'Male'],
      tagAll: ['全部场景标签', 'All tags'],
      onlineToggle: ['联网加载 300+ 音色', 'Load 300+ online voices'],
      loadingVoices: ['正在拉取在线目录…', 'Fetching online voices…'],
      personasTitle: ['开箱即用人设配方（10 套）', 'Ready-to-use Personas (10)'],
      voicesTitle: ['音色目录', 'Voice Catalog'],
      speed: ['倍速', 'Speed'],
      noMatches: ['没有匹配的音色，试试清空筛选。', 'No matching voices. Try clearing filters.'],
      previewReady: ['试听就绪', 'Preview ready'],
      savedDefault: ['已更新默认语音配置', 'Default voice configuration saved'],
      savedConfig: ['配置已保存并立即生效', 'Configuration saved and live'],
    };

    const t = key => (words[key] || [key, key])[language === 'en' ? 1 : 0];
    const vText = (zh, en) => (language === 'en' ? en : zh);

    async function request(action, args, signal) {
      const response = await fetch(new URL(ROUTE, document.baseURI), action ? {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-DSH-VOICE': '1' },
        body: JSON.stringify({ action, ...args }),
        signal,
      } : {
        credentials: 'same-origin',
        headers: { 'X-DSH-VOICE': '1' },
        signal,
      });
      let value;
      try {
        value = await response.json();
      } catch {
        throw new Error(response.status === 401 ? t('session') : t('loadError'));
      }
      if (!response.ok) {
        const err = new Error(value.error || t('loadError'));
        err.snapshot = value.snapshot;
        throw err;
      }
      return value;
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(vText('读取录音数据失败。', 'Failed to read audio recording.')));
        reader.readAsDataURL(blob);
      });
    }

    function formatTimer(sec) {
      const s = Math.max(0, Math.floor(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    }

    function Panel({ workbench = false } = {}) {
      const [, setLanguage] = useState(language);
      const [activeTab, setActiveTab] = useState('voices');
      const [state, setState] = useState(null);
      const [loading, setLoading] = useState(true);
      const [busy, setBusy] = useState('');
      const [error, setError] = useState('');
      const [notice, setNotice] = useState('');

      // Audio follow-along player bar state
      const [previewAudio, setPreviewAudio] = useState(null);
      const [playbackRate, setPlaybackRate] = useState('1.0');
      const [currentTimeMs, setCurrentTimeMs] = useState(0);
      const audioRef = useRef(null);

      // Tab 1: Voices & Personas
      const [voiceQuery, setVoiceQuery] = useState('');
      const [genderFilter, setGenderFilter] = useState('*');
      const [tagFilter, setTagFilter] = useState('*');
      const [onlineMode, setOnlineMode] = useState(false);
      const [voicesList, setVoicesList] = useState(null);
      const [voiceSource, setVoiceSource] = useState('builtin');

      // Tab 2: Studio, Visual Multi-Speaker Dialogue Composer & Prompt Builders
      const [studioText, setStudioText] = useState('你好，欢迎来到 DSH 语音工作室！现在试听自带同步字幕跟读与点击跳播。');
      const [studioVoice, setStudioVoice] = useState('');
      const [studioRate, setStudioRate] = useState('+0%');
      const [studioPitch, setStudioPitch] = useState('+0Hz');
      const [studioInstructions, setStudioInstructions] = useState('');
      const [dialogueLines, setDialogueLines] = useState([
        { speaker: '女主持', voice: 'podcast-host-female', text: '欢迎收听本期 AI 语音工作台节目！', pauseMs: 300 },
        { speaker: '男主持', voice: 'podcast-host-male', text: '现在在侧边栏就能直接编排多角色台本、一键合成试听并同步滚动字幕。', pauseMs: 300 },
      ]);
      const [saveDialogueToWs, setSaveDialogueToWs] = useState(false);
      const [dialogueOutName, setDialogueOutName] = useState('');
      const [hostA, setHostA] = useState('podcast-host-female');
      const [hostB, setHostB] = useState('podcast-host-male');
      const [podcastTopic, setPodcastTopic] = useState('本周 AI 开发工具与音频工作流进展');
      const [bgmFile, setBgmFile] = useState('');
      const [bgmVolume, setBgmVolume] = useState('0.18');
      const [podcastLoudness, setPodcastLoudness] = useState(true);
      const [srtFile, setSrtFile] = useState('video.srt');
      const [dubVoice, setDubVoice] = useState('zh-CN-YunjianNeural');
      const [dubOut, setDubOut] = useState('dubbing.mp3');

      // Tab 3: Mic Memo, 8s Direct-to-Clone Creator & Custom Voices
      const [recording, setRecording] = useState(false);
      const [recordMode, setRecordMode] = useState('');
      const [recordSec, setRecordSec] = useState(0);
      const [micLang, setMicLang] = useState('');
      const [micPrompt, setMicPrompt] = useState('');
      const [transcript, setTranscript] = useState(null);
      const [cloneAliasName, setCloneAliasName] = useState('我的克隆音色');
      const [cloneRefText, setCloneRefText] = useState('');
      const [cloneResult, setCloneResult] = useState(null);
      const [customDraft, setCustomDraft] = useState({
        name: '',
        voice: '',
        persona: '',
        rate: '',
        pitch: '',
        instructions: '',
        referenceAudio: '',
        referenceText: '',
      });
      const mediaRecorderRef = useRef(null);
      const mediaStreamRef = useRef(null);
      const recordTimerRef = useRef(null);
      const recordChunksRef = useRef([]);
      const recordModeRef = useRef('');

      // Tab 4: Lexicon & Health
      const [lexWord, setLexWord] = useState('');
      const [lexAlias, setLexAlias] = useState('');

      // Tab 5: Workspace Library
      const [libraryItems, setLibraryItems] = useState([]);
      const [libraryLoaded, setLibraryLoaded] = useState(false);

      const rawUid = typeof useId === 'function' ? useId() : 'dsh-voice';
      const baseId = 'dshv-' + String(rawUid).replace(/[^a-zA-Z0-9_-]/g, '');
      const tabsId = baseId + '-tabs';
      const controller = useRef(null);

      const hasDirtyDraft = Boolean(
        customDraft.name.trim() || lexWord.trim() || lexAlias.trim() || cloneRefText.trim(),
      );
      if (typeof __stardustUpdatesGuard === 'function') {
        __stardustUpdatesGuard(React, 'dsh-voice', {
          dirty: hasDirtyDraft,
          busy: Boolean(busy || recording),
        });
      }

      useEffect(() => {
        listeners.add(setLanguage);
        return () => listeners.delete(setLanguage);
      }, []);

      useEffect(() => {
        void run(null, {}, value => {
          if (value?.snapshot?.voices) setVoicesList(value.snapshot.voices);
        });
        return () => {
          controller.current?.abort();
          if (recordTimerRef.current) clearInterval(recordTimerRef.current);
          if (mediaStreamRef.current) {
            for (const track of mediaStreamRef.current.getTracks()) track.stop();
          }
        };
      }, []);

      useEffect(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = Number(playbackRate) || 1;
        }
      }, [playbackRate, previewAudio]);

      useEffect(() => {
        if (activeTab === 'library' && !libraryLoaded && !busy) {
          void loadLibrary();
        }
      }, [activeTab, libraryLoaded]);

      async function run(action, args = {}, onSuccess, busyKey) {
        if (controller.current) return;
        const abort = new AbortController();
        controller.current = abort;
        setBusy(busyKey || action || 'load');
        setError('');
        if (action !== 'preview' && action !== 'workspaceLibrary') setNotice('');
        try {
          const value = await request(action, args, abort.signal);
          abort.signal.throwIfAborted();
          if (value.snapshot) {
            setState(value.snapshot);
            if (!voicesList && Array.isArray(value.snapshot.voices)) {
              setVoicesList(value.snapshot.voices);
            }
          }
          if (onSuccess) onSuccess(value);
          return value;
        } catch (failure) {
          if (!abort.signal.aborted) {
            if (failure.snapshot) setState(failure.snapshot);
            setError(failure.message || t('loadError'));
          }
        } finally {
          if (!abort.signal.aborted) {
            setBusy('');
            setLoading(false);
          }
          controller.current = null;
        }
      }

      function playInPlayerBar(nextAudio, noticeMsg) {
        setCurrentTimeMs(0);
        setPreviewAudio(nextAudio);
        if (noticeMsg) setNotice(noticeMsg);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.playbackRate = Number(playbackRate) || 1;
            void audioRef.current.play().catch(() => {});
          }
        }, 30);
      }

      function triggerPreview(opts, label) {
        const key = 'preview:' + (label || opts.persona || opts.voice || 'studio');
        return run('preview', opts, value => {
          const p = value?.preview;
          if (p?.audioBase64) {
            const url = 'data:' + (p.mime || 'audio/mpeg') + ';base64,' + p.audioBase64;
            const safeFile = String(p.voice || 'voice-studio').replace(/[^a-zA-Z0-9._-]+/g, '-') + '.mp3';
            playInPlayerBar(
              {
                dataUrl: url,
                voice: p.voice,
                fileName: safeFile,
                durationMs: p.durationMs,
                durationSec: p.durationSec,
                bytes: p.bytes,
                cues: Array.isArray(p.cues) ? p.cues : [],
              },
              `${t('previewReady')}: ${p.voice} (${p.durationSec}s)`,
            );
          }
        }, key);
      }

      function triggerDialogueSynthesis() {
        const validSegments = dialogueLines
          .map(line => ({
            ...(line.speaker && line.speaker.trim() ? { speaker: line.speaker.trim() } : {}),
            ...(line.voice && line.voice.trim() ? { voice: line.voice.trim() } : {}),
            text: String(line.text || '').trim(),
            pauseMs: Number.isFinite(Number(line.pauseMs)) ? Math.max(0, Math.min(5000, Number(line.pauseMs))) : 300,
          }))
          .filter(line => line.text !== '');
        if (validSegments.length === 0) {
          setError(vText('请至少填写一段非空对话台词。', 'Please enter at least one non-empty dialogue line.'));
          return;
        }
        return run('synthesizeDialogue', {
          segments: validSegments,
          ...(bgmFile.trim() ? { bgmFile: bgmFile.trim(), bgmVolume: Number(bgmVolume) || 0.18 } : {}),
          normalizeLoudness: podcastLoudness,
          saveToWorkspace: saveDialogueToWs,
          ...(saveDialogueToWs && dialogueOutName.trim() ? { outputName: dialogueOutName.trim() } : {}),
        }, value => {
          const s = value?.synthesis;
          if (s?.audioBase64) {
            const url = 'data:' + (s.mime || 'audio/mpeg') + ';base64,' + s.audioBase64;
            const savedLeaf = s.savedMp3 ? s.savedMp3.split('/').pop() : '';
            if (s.savedMp3) setLibraryLoaded(false);
            playInPlayerBar(
              {
                dataUrl: url,
                voice: vText(`多角色对话 (${validSegments.length} 句)`, `Dialogue (${validSegments.length} lines)`),
                fileName: savedLeaf || 'dialogue-studio.mp3',
                durationMs: s.durationMs,
                durationSec: s.durationSec,
                bytes: s.bytes,
                cues: Array.isArray(s.cues) ? s.cues : [],
                savedMp3: s.savedMp3 || '',
                savedSubtitle: s.savedSubtitle || '',
              },
              s.savedMp3
                ? vText(`多角色对话合成完成 (${s.durationSec}s)，已保存至 ${s.savedMp3}`, `Dialogue synthesized (${s.durationSec}s) & saved to ${s.savedMp3}`)
                : vText(`多角色对话合成就绪 (${s.durationSec}s)，点击字幕条可逐句跳播`, `Dialogue ready (${s.durationSec}s) — click any cue to seek`),
            );
          }
        }, 'synthesizeDialogue');
      }

      function loadLibrary() {
        return run('workspaceLibrary', {}, value => {
          if (Array.isArray(value?.items)) {
            setLibraryItems(value.items);
          }
          setLibraryLoaded(true);
        }, 'workspaceLibrary');
      }

      function playWorkspaceItem(item) {
        return run('loadWorkspaceMedia', { path: item.path }, value => {
          const m = value?.media;
          if (m?.audioBase64) {
            const url = 'data:' + (m.mime || 'audio/mpeg') + ';base64,' + m.audioBase64;
            playInPlayerBar(
              {
                dataUrl: url,
                voice: m.name,
                fileName: m.name,
                durationMs: m.durationMs,
                durationSec: m.durationSec,
                bytes: m.bytes,
                cues: Array.isArray(m.cues) ? m.cues : [],
                savedMp3: m.path,
              },
              m.cues && m.cues.length > 0
                ? vText(`正在跟读播放：${m.path}（${m.cues.length} 条同步字幕）`, `Playing ${m.path} (${m.cues.length} synced cues)`)
                : vText(`正在播放：${m.path}`, `Playing: ${m.path}`),
            );
          }
        }, 'media:' + item.path);
      }

      function toggleOnlineVoices(checked) {
        setOnlineMode(checked);
        return run('voices', { online: checked }, value => {
          if (Array.isArray(value?.voices)) setVoicesList(value.voices);
          if (value?.source) setVoiceSource(value.source);
          if (value?.source === 'builtin-fallback' && value?.fallbackReason) {
            setNotice(vText('在线目录拉取失败，已回退内置目录：', 'Online fetch failed, using built-in catalog: ') + value.fallbackReason);
          } else if (value?.source === 'edge-online') {
            setNotice(vText(`已联网加载 ${value.voices.length} 个 Edge 音色`, `Loaded ${value.voices.length} online Edge voices`));
          }
        }, 'voices');
      }

      async function startRecording(mode = 'memo') {
        setError('');
        setNotice('');
        if (mode === 'clone' && !cloneAliasName.trim()) {
          setError(vText('请先填写克隆角色名称（如：我的克隆音色）。', 'Please enter an alias name for your cloned voice first.'));
          return;
        }
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
          setError(vText('当前浏览器或环境不支持 MediaRecorder 麦克风录音。', 'MediaRecorder microphone capture is unavailable in this environment.'));
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          recordChunksRef.current = [];
          const mimeType = MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : (MediaRecorder.isTypeSupported?.('audio/webm') ? 'audio/webm' : '');
          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          recordModeRef.current = mode;
          recorder.ondataavailable = ev => {
            if (ev.data && ev.data.size > 0) recordChunksRef.current.push(ev.data);
          };
          recorder.start();
          setRecordMode(mode);
          setRecording(true);
          setRecordSec(0);
          recordTimerRef.current = setInterval(() => setRecordSec(s => s + 1), 1000);
        } catch (err) {
          setError(vText('无法打开麦克风：', 'Cannot access microphone: ') + (err?.message || String(err)));
        }
      }

      function stopAndProcessRecording(cancelOnly = false) {
        const recorder = mediaRecorderRef.current;
        const stream = mediaStreamRef.current;
        const mode = recordModeRef.current || recordMode || 'memo';
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setRecording(false);
        setRecordMode('');
        recordModeRef.current = '';
        if (!recorder) {
          if (stream) for (const track of stream.getTracks()) track.stop();
          mediaStreamRef.current = null;
          return;
        }
        recorder.onstop = async () => {
          const chunks = recordChunksRef.current.slice();
          recordChunksRef.current = [];
          if (stream) for (const track of stream.getTracks()) track.stop();
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          if (cancelOnly || chunks.length === 0) return;
          const mime = recorder.mimeType || 'audio/webm';
          const ext = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm';
          try {
            const blob = new Blob(chunks, { type: mime });
            const dataUrl = await blobToBase64(blob);
            if (mode === 'clone') {
              await run('saveCloneVoice', {
                audioBase64: dataUrl,
                filename: 'clone-sample.' + ext,
                aliasName: cloneAliasName.trim(),
                ...(cloneRefText.trim() ? { referenceText: cloneRefText.trim() } : {}),
                ...(micLang.trim() ? { language: micLang.trim() } : {}),
                autoTranscribe: true,
                saveAlias: writable,
              }, value => {
                if (value?.clone) {
                  setCloneResult(value.clone);
                  setLibraryLoaded(false);
                  setNotice(
                    vText(
                      `克隆角色「${value.clone.name}」已保存至 ${value.clone.referenceAudio}`,
                      `Cloned voice "${value.clone.name}" saved to ${value.clone.referenceAudio}`,
                    ),
                  );
                }
              }, 'saveCloneVoice');
            } else {
              await run('transcribeMic', {
                audioBase64: dataUrl,
                filename: 'mic-memo.' + ext,
                ...(micLang.trim() ? { language: micLang.trim() } : {}),
                ...(micPrompt.trim() ? { prompt: micPrompt.trim() } : {}),
              }, value => {
                if (value?.transcript) {
                  setTranscript(value.transcript);
                  setNotice(vText('语音速记转写完成', 'Voice memo transcribed'));
                }
              }, 'transcribeMic');
            }
          } catch (err) {
            setError(err?.message || String(err));
          }
        };
        try {
          recorder.stop();
        } catch {
          if (stream) for (const track of stream.getTracks()) track.stop();
          mediaStreamRef.current = null;
        }
      }

      const writable = state?.writable === true;
      const allVoices = voicesList || state?.voices || [];
      const personas = state?.personas || [];
      const customVoices = state?.customVoices || [];
      const pronunciations = state?.pronunciations || [];

      const availableTags = [...new Set(allVoices.flatMap(v => Array.isArray(v.tags) ? v.tags : []))].sort();
      const filteredVoices = allVoices.filter(v => {
        if (genderFilter !== '*' && v.gender !== genderFilter) return false;
        if (tagFilter !== '*' && !(Array.isArray(v.tags) && v.tags.includes(tagFilter))) return false;
        const q = voiceQuery.trim().toLowerCase();
        if (q) {
          const hay = (v.id + ' ' + v.locale + ' ' + (v.tags || []).join(' ')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      const podcastPromptText = vText(
        `请使用双人播客模式制作一段关于「${podcastTopic || '今日话题'}」的对话音频：主持人 A 用 ${hostA}、主持人 B 用 ${hostB}，${bgmFile.trim() ? `搭配背景音乐 ${bgmFile.trim()}（音量 ${bgmVolume || '0.18'}，开启自动压低 bgmDucking），` : ''}${podcastLoudness ? '启用 -16 LUFS 响度均衡，' : ''}并输出 MP3 与 .srt 字幕。`,
        `Create a dual-host podcast episode about "${podcastTopic || 'today’s topic'}": Host A (${hostA}), Host B (${hostB})${bgmFile.trim() ? `, with BGM ${bgmFile.trim()} (volume ${bgmVolume || '0.18'}, auto-ducking enabled)` : ''}${podcastLoudness ? ', with -16 LUFS loudness normalization' : ''}, exporting MP3 and .srt subtitles.`,
      );

      const dubbingPromptText = vText(
        `请读取工作区字幕文件 ${srtFile || 'video.srt'}，使用音色 ${dubVoice || state?.ttsVoice || 'zh-CN-XiaoxiaoNeural'} 执行反向时间轴卡点配音（超长自动微调语速加速，句间自动补齐静音），输出 ${dubOut || 'dubbing.mp3'}。`,
        `Read workspace subtitle file ${srtFile || 'video.srt'} and synthesize timeline-synced voiceover using ${dubVoice || state?.ttsVoice || 'zh-CN-XiaoxiaoNeural'} (auto-speedup and gap padding), outputting ${dubOut || 'dubbing.mp3'}.`,
      );

      const voiceTourSteps = [
        {
          id: 'voices',
          selector: '[data-voice-tab="voices"]',
          side: 'bottom',
          title: vText('音色库与字幕跟读试听', 'Voices & Follow-Along Preview'),
          desc: vText(
            '浏览 51+ 全年龄与方言音色及 10 套人设，点击 ▶ 即时在线试听并在顶部字幕条点击任意句跳播。',
            'Browse 51+ built-in voices & 10 personas, click ▶ for instant preview with click-to-seek subtitles.',
          ),
        },
        {
          id: 'studio',
          selector: '[data-voice-tab="studio"]',
          side: 'bottom',
          title: vText('可视化多角色台本与试配台', 'Multi-Speaker Dialogue Composer'),
          desc: vText(
            '直接在面板编排多角色对话台本、一键合成 MP3 并跟读字幕，或复制完整播客 / .srt 卡点配音指令。',
            'Compose multi-speaker scripts and synthesize MP3 + synced cues directly, or copy full podcast / .srt prompts.',
          ),
          prompt: podcastPromptText,
          promptLabel: vText('复制：双人播客配音指令', 'Copy: Dual-host podcast prompt'),
        },
        {
          id: 'mic',
          selector: '[data-voice-tab="mic"]',
          side: 'bottom',
          title: vText('8 秒录音一键生成克隆角色', '8-Second Mic Direct-to-Clone'),
          desc: vText(
            '朗读 5–10 秒即可自动保存样本至 voice_clones/、调用 ASR 提取参考台词并注册为可复用的克隆角色。',
            'Record 5–10s to save reference audio, auto-transcribe via ASR, and register a reusable custom clone role.',
          ),
        },
        {
          id: 'lexicon',
          selector: '[data-voice-tab="lexicon"]',
          side: 'bottom',
          title: vText('发音词典与健康自检', 'Pronunciation Lexicon & Health'),
          desc: vText(
            '配置专有名词替读规则（如 Nginx → Engine X），并实时查看 TTS / ASR / FFmpeg 就绪状态。',
            'Manage pronunciation overrides (e.g. Nginx → Engine X) and inspect live TTS / ASR / FFmpeg readiness.',
          ),
        },
        {
          id: 'library',
          selector: '[data-voice-tab="library"]',
          side: 'bottom',
          title: vText('工作区音频与同步字幕成品库', 'Workspace Audio & Subtitle Library'),
          desc: vText(
            '自动发现工作区生成的音频与同名 .srt/.vtt 字幕，一键开启交互式字幕高亮跟读与点按跳转。',
            'Browse workspace audio files paired with .srt/.vtt subtitles for instant click-to-seek follow-along playback.',
          ),
        },
      ];

      function renderVoicePlayerBar() {
        if (!previewAudio) return null;
        const cues = Array.isArray(previewAudio.cues) ? previewAudio.cues : [];
        return h('div', { className: 'voice-player-bar', 'data-dsh-card': '' },
          h('div', { className: 'voice-player-top' },
            h('div', { className: 'voice-player-meta' },
              h('strong', null, previewAudio.voice),
              h('span', { className: 'dsh-wb-tag', 'data-tone': 'success' },
                `${previewAudio.durationSec || 0}s · ${Math.max(1, Math.round((previewAudio.bytes || 0) / 1024))} KB`),
              previewAudio.savedMp3
                ? h('span', { className: 'voice-mono' }, previewAudio.savedMp3)
                : null,
            ),
            h('div', { className: 'voice-player-controls' },
              h('audio', {
                ref: audioRef,
                controls: true,
                src: previewAudio.dataUrl,
                className: 'voice-audio-el',
                onTimeUpdate: e => setCurrentTimeMs(Math.round((e.currentTarget.currentTime || 0) * 1000)),
                onSeeked: e => setCurrentTimeMs(Math.round((e.currentTarget.currentTime || 0) * 1000)),
                onLoadedMetadata: e => setCurrentTimeMs(Math.round((e.currentTarget.currentTime || 0) * 1000)),
              }),
              h(W.ChoiceMenu, {
                label: t('speed'),
                value: playbackRate,
                items: [
                  { id: '0.8', label: '0.8x' },
                  { id: '1.0', label: '1.0x' },
                  { id: '1.2', label: '1.2x' },
                  { id: '1.5', label: '1.5x' },
                ],
                onChange: setPlaybackRate,
                className: 'voice-speed-select',
              }),
              h('a', {
                className: 'dsh-wb-btn dsh-wb-btn-outline voice-download-link',
                href: previewAudio.dataUrl,
                download: previewAudio.fileName || 'voice-studio.mp3',
                title: vText('下载音频', 'Download audio'),
              },
                h(W.Icon, { name: 'download', size: 14 }),
                h('span', null, vText('下载音频', 'Download')),
              ),
            ),
          ),
          cues.length > 0
            ? h('div', {
                className: 'voice-cue-strip',
                role: 'list',
                'aria-label': vText('同步字幕跟读（点击任意句跳转播放）', 'Synchronized subtitles (click any cue to seek)'),
              },
                cues.map((cue, idx) => {
                  const isActive = currentTimeMs >= cue.startMs && currentTimeMs <= cue.endMs;
                  return h('button', {
                    key: (cue.index || idx) + '-' + cue.startMs,
                    type: 'button',
                    role: 'listitem',
                    className: 'voice-cue-chip' + (isActive ? ' is-active' : ''),
                    title: vText('点击跳转到该句播放', 'Click to seek and play this cue'),
                    onClick: () => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = (cue.startMs || 0) / 1000;
                        setCurrentTimeMs(cue.startMs || 0);
                        void audioRef.current.play().catch(() => {});
                      }
                    },
                  },
                    h('span', { className: 'voice-cue-time' }, formatTimer(Math.floor((cue.startMs || 0) / 1000))),
                    h('span', { className: 'voice-cue-text' }, cue.text),
                  );
                }),
              )
            : null,
        );
      }

      function renderVoicesTab() {
        return h('div', { className: 'voice-section-stack' },
          h('div', { className: 'voice-filter-bar', 'data-dsh-card': '' },
            h(W.Search, {
              label: t('searchVoice'),
              clearLabel: t('clear'),
              value: voiceQuery,
              onChange: e => setVoiceQuery(e.target.value),
            }),
            h(W.ChoiceMenu, {
              icon: 'filter',
              label: t('genderAll'),
              value: genderFilter,
              items: [
                { id: '*', label: t('genderAll') },
                { id: 'Female', label: t('female') },
                { id: 'Male', label: t('male') },
              ],
              onChange: setGenderFilter,
              className: 'voice-filter-select',
            }),
            h(W.ChoiceMenu, {
              icon: 'folder',
              label: t('tagAll'),
              value: tagFilter,
              items: [
                { id: '*', label: t('tagAll') },
                ...availableTags.map(tag => ({ id: tag, label: tag })),
              ],
              onChange: setTagFilter,
              className: 'voice-filter-select',
            }),
            h(W.Switch, {
              label: busy === 'voices' ? t('loadingVoices') : t('onlineToggle'),
              checked: onlineMode,
              disabled: !!busy,
              onChange: toggleOnlineVoices,
            }),
          ),
          h('section', { className: 'voice-block' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, t('personasTitle')),
              h('span', { className: 'dsh-wb-count' }, personas.length),
            ),
            h('div', { className: 'voice-card-grid' },
              personas.map(p => h('article', { key: p.id, className: 'voice-card', 'data-dsh-card': '' },
                h('div', { className: 'voice-card-top' },
                  h('strong', null, p.label),
                  h('span', { className: 'dsh-wb-tag' }, p.id),
                ),
                h('p', { className: 'voice-muted' }, p.description),
                h('p', { className: 'voice-mono' }, `${p.voice} · ${p.rate} · ${p.pitch}`),
                h('div', { className: 'voice-card-actions' },
                  h(W.Button, {
                    size: 'sm',
                    variant: 'primary',
                    icon: 'play',
                    spinning: busy === 'preview:' + p.id,
                    disabled: !!busy,
                    onClick: () => triggerPreview({ persona: p.id }, p.id),
                  }, busy === 'preview:' + p.id ? t('auditioning') : t('audition')),
                  h(W.Button, {
                    size: 'sm',
                    icon: 'check',
                    disabled: !writable || !!busy,
                    onClick: () => run('updateConfig', {
                      patch: { ttsVoice: p.voice, ttsRate: p.rate, ttsPitch: p.pitch },
                    }, () => setNotice(t('savedDefault') + ' (' + p.label + ')')),
                  }, t('setDefault')),
                  h(W.CopyPrompt, {
                    prompt: vText(
                      `请使用角色人设「${p.label}」(${p.id}) 将以下文本合成为 MP3 语音：`,
                      `Synthesize the following text to MP3 using persona "${p.label}" (${p.id}):`,
                    ),
                    label: t('copyPrompt'),
                    copiedLabel: t('copied'),
                    statusText: t('copyStatus'),
                    failedText: t('copyFailed'),
                  }),
                ),
              )),
            ),
          ),
          h('section', { className: 'voice-block' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, t('voicesTitle')),
              h('span', { className: 'dsh-wb-count' }, `${filteredVoices.length} (${voiceSource})`),
            ),
            filteredVoices.length === 0
              ? h(W.Empty, {
                  title: t('noMatches'),
                  icon: 'search',
                  action: h(W.Button, {
                    icon: 'close',
                    onClick: () => { setVoiceQuery(''); setGenderFilter('*'); setTagFilter('*'); },
                  }, t('clear')),
                })
              : h('div', { className: 'voice-card-grid' },
                  filteredVoices.map(v => {
                    const isDef = state?.ttsVoice === v.id;
                    return h('article', {
                      key: v.id,
                      className: 'voice-card' + (isDef ? ' is-default' : ''),
                      'data-dsh-card': '',
                    },
                      h('div', { className: 'voice-card-top' },
                        h('strong', { className: 'voice-mono' }, v.id),
                        isDef
                          ? h('span', { className: 'dsh-wb-tag', 'data-tone': 'success' }, t('isDefault'))
                          : h('span', { className: 'dsh-wb-tag' }, v.gender === 'Male' ? t('male') : t('female')),
                      ),
                      h('p', { className: 'voice-muted' }, v.locale),
                      Array.isArray(v.tags) && v.tags.length > 0
                        ? h('div', { className: 'voice-tags-row' },
                            v.tags.slice(0, 5).map(tag => h('span', { key: tag, className: 'dsh-wb-count' }, tag)),
                          )
                        : null,
                      h('div', { className: 'voice-card-actions' },
                        h(W.Button, {
                          size: 'sm',
                          variant: 'primary',
                          icon: 'play',
                          spinning: busy === 'preview:' + v.id,
                          disabled: !!busy,
                          onClick: () => triggerPreview({ voice: v.id }, v.id),
                        }, busy === 'preview:' + v.id ? t('auditioning') : t('audition')),
                        h(W.Button, {
                          size: 'sm',
                          icon: 'check',
                          disabled: !writable || !!busy || isDef,
                          onClick: () => run('updateConfig', {
                            patch: { ttsVoice: v.id },
                          }, () => setNotice(t('savedDefault') + ': ' + v.id)),
                        }, isDef ? t('isDefault') : t('setDefault')),
                        h(W.CopyPrompt, {
                          prompt: vText(
                            `请使用音色 ${v.id} 为我朗读以下内容并输出 MP3：`,
                            `Read the following text aloud using voice ${v.id} and save as MP3:`,
                          ),
                          label: t('copyPrompt'),
                          copiedLabel: t('copied'),
                          statusText: t('copyStatus'),
                          failedText: t('copyFailed'),
                        }),
                      ),
                    );
                  }),
                ),
          ),
        );
      }

      function renderStudioTab() {
        const voiceOptions = [
          ...customVoices.map(cv => ({ id: cv.name, label: `★ ${cv.name} (${vText('自定义角色', 'Custom')})` })),
          ...personas.map(p => ({ id: p.id, label: `${p.label} (${p.id})` })),
          ...allVoices.map(v => ({ id: v.id, label: `${v.id} · ${v.locale}` })),
        ];
        const ensureOption = val =>
          voiceOptions.some(o => o.id === val) ? voiceOptions : [{ id: val, label: val }, ...voiceOptions];
        const selectedTarget = studioVoice || state?.ttsVoice || 'zh-CN-XiaoxiaoNeural';

        const updateDialogueLine = (idx, patch) => {
          setDialogueLines(prev => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
        };

        return h('div', { className: 'voice-section-stack' },
          h('form', {
            className: 'voice-panel-card',
            'data-dsh-card': '',
            onSubmit: e => {
              e.preventDefault();
              void triggerPreview({
                text: studioText,
                voice: selectedTarget,
                rate: studioRate,
                pitch: studioPitch,
                ...(studioInstructions.trim() ? { instructions: studioInstructions.trim() } : {}),
              }, 'studio');
            },
          },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('实时参数试配台（含同步字幕跟读）', 'Live Audition Playground')),
              h('span', { className: 'dsh-wb-count' }, `${studioText.length} / 300`),
            ),
            h('textarea', {
              className: 'dsh-wb-textarea',
              maxLength: 300,
              value: studioText,
              disabled: !!busy,
              placeholder: vText('输入最多 300 字试听台词（支持 [pause:500ms] 内联停顿标签）…', 'Enter up to 300 chars to audition…'),
              onChange: e => setStudioText(e.target.value),
            }),
            h('div', { className: 'voice-form-grid' },
              h('label', { className: 'voice-field' },
                h('span', null, vText('音色 / 人设 / 克隆角色', 'Voice / Persona / Clone Alias')),
                h(W.ChoiceMenu, {
                  label: vText('选择音色或人设', 'Choose voice or persona'),
                  value: selectedTarget,
                  items: ensureOption(selectedTarget),
                  onChange: setStudioVoice,
                }),
              ),
              h('label', { className: 'voice-field' },
                h('span', null, vText('语速 (rate)', 'Rate')),
                h(W.Input, {
                  value: studioRate,
                  placeholder: '+0%',
                  disabled: !!busy,
                  onChange: e => setStudioRate(e.target.value),
                }),
              ),
              h('label', { className: 'voice-field' },
                h('span', null, vText('音调 (pitch)', 'Pitch')),
                h(W.Input, {
                  value: studioPitch,
                  placeholder: '+0Hz',
                  disabled: !!busy,
                  onChange: e => setStudioPitch(e.target.value),
                }),
              ),
              h('label', { className: 'voice-field' },
                h('span', null, vText('情绪指令 (OpenAI / CosyVoice2)', 'Instructions (OpenAI / CosyVoice2)')),
                h(W.Input, {
                  value: studioInstructions,
                  placeholder: vText('如：用温柔悬疑的语气讲述', 'e.g. Speak warmly and calmly'),
                  disabled: !!busy,
                  onChange: e => setStudioInstructions(e.target.value),
                }),
              ),
            ),
            h('div', { className: 'dsh-wb-toolbar' },
              h(W.Button, {
                type: 'submit',
                variant: 'primary',
                icon: 'play',
                spinning: busy === 'preview:studio',
                disabled: !!busy || !studioText.trim(),
              }, busy === 'preview:studio' ? t('auditioning') : vText('立即试听并跟读测算时长', 'Audition & Measure Duration')),
              h(W.CopyPrompt, {
                prompt: vText(
                  `请用音色/人设「${selectedTarget}」（语速 ${studioRate}，音调 ${studioPitch}${studioInstructions.trim() ? `，情绪指令：${studioInstructions.trim()}` : ''}）合成以下文稿：${studioText}`,
                  `Synthesize this script with voice/persona "${selectedTarget}" (rate ${studioRate}, pitch ${studioPitch}${studioInstructions.trim() ? `, instructions: ${studioInstructions.trim()}` : ''}): ${studioText}`,
                ),
                label: vText('复制当前参数配音指令', 'Copy prompt with current settings'),
                copiedLabel: t('copied'),
                statusText: t('copyStatus'),
                failedText: t('copyFailed'),
              }),
            ),
          ),

          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('可视化多角色对话编排器 & 双人播客合成', 'Visual Multi-Speaker Dialogue Composer & Podcast')),
              h('span', { className: 'dsh-wb-count' }, vText(`${dialogueLines.length} / 20 句`, `${dialogueLines.length} / 20 lines`)),
            ),
            h('p', { className: 'voice-muted' }, vText(
              '直接在下方编排多角色台词（支持内置人设、300+ 音色或你录制的克隆角色），一键合成多角色 MP3 并在顶部播放器逐句高亮跟读；也可复制完整节目指令交由 AI 扩写长篇播客。',
              'Arrange multi-role lines using personas, catalog voices, or your cloned roles, then synthesize MP3 + synced cues right here — or copy the AI prompt for a full episode.',
            )),
            h('div', { className: 'voice-dialogue-list' },
              dialogueLines.map((line, idx) => {
                const lineVoice = line.voice || state?.ttsVoice || 'podcast-host-female';
                return h('div', { key: idx, className: 'voice-dialogue-row' },
                  h('div', { className: 'voice-dialogue-meta' },
                    h(W.Input, {
                      value: line.speaker,
                      disabled: !!busy,
                      placeholder: vText('角色名（如 女主持）', 'Speaker'),
                      onChange: e => updateDialogueLine(idx, { speaker: e.target.value }),
                    }),
                    h(W.ChoiceMenu, {
                      label: vText('选择角色音色', 'Speaker voice'),
                      value: lineVoice,
                      disabled: !!busy,
                      items: ensureOption(lineVoice),
                      onChange: nextVoice => updateDialogueLine(idx, { voice: nextVoice }),
                    }),
                    h(W.IconButton, {
                      icon: 'trash',
                      label: vText('删除此句', 'Remove line'),
                      disabled: !!busy || dialogueLines.length <= 1,
                      onClick: () => setDialogueLines(prev => prev.filter((_, i) => i !== idx)),
                    }),
                  ),
                  h('textarea', {
                    className: 'dsh-wb-textarea voice-dialogue-input',
                    rows: 2,
                    value: line.text,
                    disabled: !!busy,
                    placeholder: vText('输入该角色台词…', 'Enter speaker dialogue line…'),
                    onChange: e => updateDialogueLine(idx, { text: e.target.value }),
                  }),
                );
              }),
            ),
            h('div', { className: 'dsh-wb-toolbar' },
              h(W.Button, {
                size: 'sm',
                icon: 'plus',
                disabled: !!busy || dialogueLines.length >= 20,
                onClick: () => {
                  const isEven = dialogueLines.length % 2 === 0;
                  setDialogueLines(prev => [
                    ...prev,
                    {
                      speaker: isEven ? vText('女主持', 'Host A') : vText('男主持', 'Host B'),
                      voice: isEven ? (hostA || 'podcast-host-female') : (hostB || 'podcast-host-male'),
                      text: '',
                      pauseMs: 300,
                    },
                  ]);
                },
              }, vText('添加台词', 'Add Line')),
              h(W.Checkbox, {
                label: vText('保存到工作区 voice_outputs/（含 .mp3 + .srt）', 'Save MP3 + .srt to workspace voice_outputs/'),
                checked: saveDialogueToWs,
                disabled: !!busy,
                onChange: setSaveDialogueToWs,
              }),
              saveDialogueToWs
                ? h(W.Input, {
                    value: dialogueOutName,
                    disabled: !!busy,
                    placeholder: vText('文件名（可选，如 episode-1）', 'Output name (optional)'),
                    className: 'voice-inline-name-input',
                    onChange: e => setDialogueOutName(e.target.value),
                  })
                : null,
            ),
            h('div', { className: 'voice-form-grid' },
              h('label', { className: 'voice-field' },
                h('span', null, vText('背景音乐 (bgmFile，可选工作区路径)', 'BGM File (optional workspace path)')),
                h(W.Input, { value: bgmFile, placeholder: 'bgm.mp3', disabled: !!busy, onChange: e => setBgmFile(e.target.value) }),
              ),
              h('label', { className: 'voice-field' },
                h('span', null, vText('背景音量 (0.02-1.0)', 'BGM Volume')),
                h(W.Input, { value: bgmVolume, placeholder: '0.18', disabled: !!busy, onChange: e => setBgmVolume(e.target.value) }),
              ),
            ),
            h(W.Checkbox, {
              label: vText('开启 -16 LUFS 播客响度均衡 (normalizeLoudness)', 'Enable -16 LUFS loudness normalization'),
              checked: podcastLoudness,
              disabled: !!busy,
              onChange: setPodcastLoudness,
            }),
            h('div', { className: 'dsh-wb-toolbar' },
              h(W.Button, {
                variant: 'primary',
                icon: 'play',
                spinning: busy === 'synthesizeDialogue',
                disabled: !!busy,
                onClick: () => { void triggerDialogueSynthesis(); },
              }, busy === 'synthesizeDialogue'
                ? vText('正在合成多角色对话…', 'Synthesizing dialogue…')
                : vText('直接合成多角色对话并跟读播放', 'Synthesize Multi-Speaker Dialogue & Play')),
            ),

            h('div', { className: 'voice-subform' },
              h('div', { className: 'voice-block-head' },
                h('strong', null, vText('长篇双人播客 AI 扩写指令生成器', 'Full-Episode AI Podcast Prompt Builder')),
              ),
              h('div', { className: 'voice-form-grid' },
                h('label', { className: 'voice-field' },
                  h('span', null, vText('主持人 A', 'Host A')),
                  h(W.ChoiceMenu, {
                    label: 'Host A',
                    value: hostA,
                    items: ensureOption(hostA),
                    onChange: setHostA,
                  }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('主持人 B', 'Host B')),
                  h(W.ChoiceMenu, {
                    label: 'Host B',
                    value: hostB,
                    items: ensureOption(hostB),
                    onChange: setHostB,
                  }),
                ),
                h('label', { className: 'voice-field voice-field-span2' },
                  h('span', null, vText('播客主题或文稿路径', 'Topic or script path')),
                  h(W.Input, { value: podcastTopic, onChange: e => setPodcastTopic(e.target.value) }),
                ),
              ),
              h('pre', { className: 'voice-prompt-preview' }, podcastPromptText),
              h(W.CopyPrompt, {
                variant: 'outline',
                prompt: podcastPromptText,
                label: vText('一键复制播客配音指令', 'Copy Podcast Prompt'),
                copiedLabel: t('copied'),
                statusText: t('copyStatus'),
                failedText: t('copyFailed'),
              }),
            ),
          ),

          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('h3', { 'data-dsh-editorial-heading': '' }, vText('.srt / .vtt 视频反向卡点配音生成器', '.srt / .vtt Timeline-Synced Dubbing')),
            h('div', { className: 'voice-form-grid' },
              h('label', { className: 'voice-field' },
                h('span', null, vText('字幕文件路径 (subtitleInput)', 'Subtitle file path')),
                h(W.Input, { value: srtFile, placeholder: 'video.srt', onChange: e => setSrtFile(e.target.value) }),
              ),
              h('label', { className: 'voice-field' },
                h('span', null, vText('配音音色 / 人设', 'Target Voice / Persona')),
                h(W.Input, { value: dubVoice, placeholder: 'zh-CN-YunjianNeural', onChange: e => setDubVoice(e.target.value) }),
              ),
              h('label', { className: 'voice-field voice-field-span2' },
                h('span', null, vText('输出音频路径', 'Output MP3 path')),
                h(W.Input, { value: dubOut, placeholder: 'dubbing.mp3', onChange: e => setDubOut(e.target.value) }),
              ),
            ),
            h('pre', { className: 'voice-prompt-preview' }, dubbingPromptText),
            h(W.CopyPrompt, {
              variant: 'primary',
              prompt: dubbingPromptText,
              label: vText('一键复制视频卡点配音指令', 'Copy Video Dubbing Prompt'),
              copiedLabel: t('copied'),
              statusText: t('copyStatus'),
              failedText: t('copyFailed'),
            }),
          ),
        );
      }

      function renderMicTab() {
        return h('div', { className: 'voice-section-stack' },
          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('8 秒录音一键生成克隆角色', '8-Second Mic Direct-to-Clone Role Creator')),
              h('span', { className: 'dsh-wb-tag', 'data-tone': 'success' }, vText('建议朗读 5–10 秒清晰人声', 'Read clearly for 5–10s')),
            ),
            h('p', { className: 'voice-muted' }, vText(
              '用麦克风录制 5–10 秒人声，自动落盘至工作区 voice_clones/、调用已就绪 ASR 自动提取参考台词，并注册到 customVoices（配合 SiliconFlow CosyVoice2 或本地 GPT-SoVITS 即可零样本克隆音色）。',
              'Record 5–10s of clear speech to save under voice_clones/, auto-transcribe reference text via ASR, and register a reusable clone role in customVoices.',
            )),
            h('div', { className: 'voice-form-grid' },
              h('label', { className: 'voice-field' },
                h('span', null, vText('克隆角色名称 *', 'Clone Role Alias *')),
                h(W.Input, {
                  value: cloneAliasName,
                  placeholder: vText('我的克隆音色', 'my-cloned-voice'),
                  disabled: recording || !!busy,
                  onChange: e => setCloneAliasName(e.target.value),
                }),
              ),
              h('label', { className: 'voice-field' },
                h('span', null, vText('参考台词（留空则通过 ASR 自动转写）', 'Reference text (leave blank for auto-ASR)')),
                h(W.Input, {
                  value: cloneRefText,
                  placeholder: vText('如：大家好，这是我的专属语音克隆样本。', 'Optional transcript of your sample'),
                  disabled: recording || !!busy,
                  onChange: e => setCloneRefText(e.target.value),
                }),
              ),
            ),
            h('div', { className: 'dsh-wb-toolbar' },
              !(recording && recordMode === 'clone')
                ? h(W.Button, {
                    variant: 'primary',
                    icon: 'sparkles',
                    spinning: busy === 'saveCloneVoice',
                    disabled: recording || !!busy || !cloneAliasName.trim() || !writable,
                    onClick: () => { void startRecording('clone'); },
                  }, busy === 'saveCloneVoice'
                    ? vText('正在保存并生成克隆角色…', 'Creating clone role…')
                    : vText('开始 8 秒克隆样本录音', 'Start 8s Clone Recording'))
                : h(React.Fragment, null,
                    h(W.Button, {
                      variant: 'primary',
                      icon: 'check',
                      onClick: () => stopAndProcessRecording(false),
                    }, vText(`停止并创建克隆角色 (${formatTimer(recordSec)})`, `Stop & Create Clone Role (${formatTimer(recordSec)})`)),
                    h(W.Button, {
                      icon: 'close',
                      onClick: () => stopAndProcessRecording(true),
                    }, vText('取消录音', 'Cancel')),
                    h('span', { className: 'voice-muted' }, vText('建议朗读 5–10 秒清晰人声', 'Recommended: 5–10s of clear speech')),
                  ),
            ),
            cloneResult
              ? h('div', { className: 'voice-clone-result' },
                  h('div', { className: 'voice-block-head' },
                    h('strong', null, vText(`已创建克隆角色：${cloneResult.name}`, `Created Clone Role: ${cloneResult.name}`)),
                    h('span', { className: 'voice-mono' }, cloneResult.referenceAudio),
                  ),
                  cloneResult.referenceText
                    ? h('p', { className: 'voice-muted' }, vText('参考台词：', 'Reference text: ') + cloneResult.referenceText)
                    : null,
                  cloneResult.transcribeWarning
                    ? h('p', { className: 'voice-muted' }, vText('自动转写提示：', 'ASR note: ') + cloneResult.transcribeWarning)
                    : null,
                  h('div', { className: 'dsh-wb-toolbar' },
                    h(W.Button, {
                      size: 'sm',
                      variant: 'primary',
                      icon: 'play',
                      disabled: !!busy,
                      onClick: () => {
                        setStudioVoice(cloneResult.name);
                        setActiveTab('studio');
                      },
                    }, vText('在试配台使用该角色', 'Use Role in Studio')),
                    h(W.CopyPrompt, {
                      prompt: vText(
                        `请使用我的自定义克隆角色「${cloneResult.name}」将以下内容合成为 MP3：`,
                        `Synthesize the following text to MP3 using my cloned voice "${cloneResult.name}":`,
                      ),
                      label: vText('复制克隆角色配音指令', 'Copy Clone Voice Prompt'),
                      copiedLabel: t('copied'),
                      statusText: t('copyStatus'),
                      failedText: t('copyFailed'),
                    }),
                  ),
                )
              : null,
          ),

          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('浏览器麦克风语音速记（ASR 转写）', 'Browser Mic Voice Memo (ASR)')),
              state?.sttReady
                ? h('span', { className: 'dsh-wb-tag', 'data-tone': 'success' }, `${state.asrEngine} · ${vText('已就绪', 'Ready')}`)
                : h('span', { className: 'dsh-wb-tag', 'data-tone': 'warn' }, vText('需配置 ASR 密钥', 'ASR key needed')),
            ),
            h('p', { className: 'voice-muted' }, vText(
              '录制一段语音备忘录后自动发送至已配置的 ASR 端点（Groq / OpenAI / SiliconFlow / 本地 Whisper）转为文字。',
              'Record a quick voice memo and transcribe it via your configured ASR endpoint (Groq / OpenAI / SiliconFlow / local Whisper).',
            )),
            h('div', { className: 'voice-form-grid' },
              h('label', { className: 'voice-field' },
                h('span', null, vText('语言代码（可选，如 zh / en）', 'Language hint (optional, e.g. zh / en)')),
                h(W.Input, { value: micLang, placeholder: 'zh', disabled: recording || !!busy, onChange: e => setMicLang(e.target.value) }),
              ),
              h('label', { className: 'voice-field' },
                h('span', null, vText('上下文提示词（可选）', 'Prompt hint (optional)')),
                h(W.Input, { value: micPrompt, placeholder: vText('如：专有名词 DSH、Cordis', 'e.g. technical terms'), disabled: recording || !!busy, onChange: e => setMicPrompt(e.target.value) }),
              ),
            ),
            h('div', { className: 'dsh-wb-toolbar' },
              !(recording && recordMode === 'memo')
                ? h(W.Button, {
                    variant: 'primary',
                    icon: 'play',
                    spinning: busy === 'transcribeMic',
                    disabled: recording || !!busy || !state?.sttReady,
                    onClick: () => { void startRecording('memo'); },
                  }, busy === 'transcribeMic' ? vText('正在转写…', 'Transcribing…') : vText('开始麦克风录音', 'Start Mic Recording'))
                : h(React.Fragment, null,
                    h(W.Button, {
                      variant: 'primary',
                      icon: 'check',
                      onClick: () => stopAndProcessRecording(false),
                    }, vText(`停止并转写 (${formatTimer(recordSec)})`, `Stop & Transcribe (${formatTimer(recordSec)})`)),
                    h(W.Button, {
                      icon: 'close',
                      onClick: () => stopAndProcessRecording(true),
                    }, vText('取消录音', 'Cancel')),
                  ),
            ),
            transcript
              ? h('div', { className: 'voice-transcript-box' },
                  h('div', { className: 'voice-block-head' },
                    h('strong', null, vText('转写结果', 'Transcript')),
                    h('span', { className: 'dsh-wb-count' },
                      [transcript.language, transcript.duration ? `${Math.round(transcript.duration * 10) / 10}s` : ''].filter(Boolean).join(' · ') || 'OK',
                    ),
                  ),
                  h('textarea', {
                    className: 'dsh-wb-textarea',
                    readOnly: true,
                    value: transcript.text,
                  }),
                  h('div', { className: 'dsh-wb-toolbar' },
                    h(W.CopyPrompt, {
                      variant: 'primary',
                      prompt: transcript.text,
                      label: vText('复制转写文本', 'Copy Transcript'),
                      copiedLabel: t('copied'),
                      statusText: vText('已复制转写文本', 'Transcript copied'),
                      failedText: t('copyFailed'),
                    }),
                  ),
                )
              : null,
          ),

          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('自定义音色别名与参考音频 (customVoices)', 'Custom Voice Aliases (customVoices)')),
              h('span', { className: 'dsh-wb-count' }, customVoices.length),
            ),
            customVoices.length > 0
              ? h('div', { className: 'voice-list-stack' },
                  customVoices.map((cv, idx) => h('div', { key: cv.name + '-' + idx, className: 'voice-list-item' },
                    h('div', { className: 'voice-list-main' },
                      h('strong', null, cv.name),
                      h('span', { className: 'voice-mono' }, [cv.voice, cv.persona, cv.rate, cv.pitch, cv.instructions ? 'style:' + cv.instructions : '', cv.referenceAudio ? 'ref:' + cv.referenceAudio : ''].filter(Boolean).join(' · ') || 'default'),
                    ),
                    h('div', { className: 'dsh-wb-toolbar' },
                      h(W.Button, {
                        size: 'sm',
                        icon: 'play',
                        disabled: !!busy,
                        onClick: () => triggerPreview({ voice: cv.name }, 'cv-' + cv.name),
                      }, t('audition')),
                      h(W.Button, {
                        size: 'sm',
                        variant: 'danger',
                        icon: 'trash',
                        disabled: !writable || !!busy,
                        onClick: () => run('updateConfig', {
                          patch: { customVoices: customVoices.filter((_, i) => i !== idx) },
                        }, () => setNotice(t('savedConfig'))),
                      }, vText('移除', 'Remove')),
                    ),
                  )),
                )
              : h('p', { className: 'voice-muted' }, vText('暂无自定义音色别名，可用上方 8 秒录音创建或在下方手动添加。', 'No custom voice aliases yet. Record above or add one below.')),
            h('form', {
              className: 'voice-subform',
              onSubmit: e => {
                e.preventDefault();
                if (!customDraft.name.trim()) return;
                const entry = {
                  name: customDraft.name.trim(),
                  ...(customDraft.voice.trim() ? { voice: customDraft.voice.trim() } : {}),
                  ...(customDraft.persona.trim() ? { persona: customDraft.persona.trim() } : {}),
                  ...(customDraft.rate.trim() ? { rate: customDraft.rate.trim() } : {}),
                  ...(customDraft.pitch.trim() ? { pitch: customDraft.pitch.trim() } : {}),
                  ...(customDraft.instructions.trim() ? { instructions: customDraft.instructions.trim() } : {}),
                  ...(customDraft.referenceAudio.trim() ? { referenceAudio: customDraft.referenceAudio.trim() } : {}),
                  ...(customDraft.referenceText.trim() ? { referenceText: customDraft.referenceText.trim() } : {}),
                };
                const next = [...customVoices.filter(c => c.name.toLowerCase() !== entry.name.toLowerCase()), entry];
                void run('updateConfig', { patch: { customVoices: next } }, () => {
                  setCustomDraft({ name: '', voice: '', persona: '', rate: '', pitch: '', instructions: '', referenceAudio: '', referenceText: '' });
                  setNotice(t('savedConfig'));
                });
              },
            },
              h('div', { className: 'voice-form-grid' },
                h('label', { className: 'voice-field' },
                  h('span', null, vText('别名 *（如：老王、悬疑旁白）', 'Alias Name *')),
                  h(W.Input, { required: true, value: customDraft.name, placeholder: vText('女主持', 'host-a'), disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, name: e.target.value }) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('底层音色 ID', 'Voice ID')),
                  h(W.Input, { value: customDraft.voice, placeholder: 'zh-CN-YunjianNeural', disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, voice: e.target.value }) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('继承人设 ID', 'Persona ID')),
                  h(W.Input, { value: customDraft.persona, placeholder: 'late-night-radio', disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, persona: e.target.value }) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('语速 / 音调', 'Rate / Pitch')),
                  h('div', { className: 'voice-pair-row' },
                    h(W.Input, { value: customDraft.rate, placeholder: '+0%', disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, rate: e.target.value }) }),
                    h(W.Input, { value: customDraft.pitch, placeholder: '+0Hz', disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, pitch: e.target.value }) }),
                  ),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('情绪 / 语气指令（可选）', 'Emotion / Style Instructions (optional)')),
                  h(W.Input, { value: customDraft.instructions, placeholder: vText('如：低沉神秘、放慢语速', 'e.g. warm, calm storytelling'), disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, instructions: e.target.value }) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('参考音频（零样本克隆）', 'Reference audio path')),
                  h(W.Input, { value: customDraft.referenceAudio, placeholder: 'ref.wav', disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, referenceAudio: e.target.value }) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('参考台词文本', 'Reference text')),
                  h(W.Input, { value: customDraft.referenceText, placeholder: vText('参考音频对应的文字', 'Transcript of ref audio'), disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, referenceText: e.target.value }) }),
                ),
              ),
              h(W.Button, {
                type: 'submit',
                variant: 'primary',
                icon: 'plus',
                disabled: !writable || !!busy || !customDraft.name.trim(),
              }, vText('保存自定义角色', 'Save Custom Voice')),
            ),
          ),
        );
      }

      function renderLexiconTab() {
        const presets = [
          { word: 'Nginx', alias: 'Engine X' },
          { word: 'SQL', alias: 'S Q L' },
          { word: 'Kubernetes', alias: 'K8s' },
          { word: '重构', alias: '重够' },
        ];
        return h('div', { className: 'voice-section-stack' },
          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('h3', { 'data-dsh-editorial-heading': '' }, vText('引擎就绪状态与环境自检', 'Engine Readiness & Health')),
            h('div', { className: 'voice-health-grid' },
              h('div', { className: 'voice-health-item' },
                h('strong', null, 'TTS Engine'),
                h('span', { className: 'dsh-wb-tag', 'data-tone': state?.ttsReady ? 'success' : 'error' },
                  state?.ttsReady ? vText('就绪', 'Ready') : vText('未就绪', 'Not ready')),
                h('span', { className: 'voice-muted' }, `${state?.ttsEngine || 'edge'} · ${state?.ttsVoice || '-'}`),
              ),
              h('div', { className: 'voice-health-item' },
                h('strong', null, 'ASR / STT'),
                h('span', { className: 'dsh-wb-tag', 'data-tone': state?.sttReady ? 'success' : 'warn' },
                  state?.sttReady ? vText('就绪', 'Ready') : vText('缺密钥/地址', 'Key/URL needed')),
                h('span', { className: 'voice-muted' }, `${state?.asrEngine || 'groq'} · ${state?.asrModel || '-'}`),
              ),
              h('div', { className: 'voice-health-item' },
                h('strong', null, 'FFmpeg'),
                h('span', { className: 'dsh-wb-tag', 'data-tone': state?.hasFfmpeg ? 'success' : 'warn' },
                  state?.hasFfmpeg ? vText('可用', 'Available') : vText('未安装', 'Not found')),
                h('span', { className: 'voice-muted' }, vText('响度均衡、BGM 混音与视频直转', 'Loudnorm, BGM ducking & video STT')),
              ),
              h('div', { className: 'voice-health-item' },
                h('strong', null, vText('网络代理 & 写入权限', 'Proxy & Write Mode')),
                h('span', { className: 'dsh-wb-tag', 'data-tone': writable ? 'success' : 'warn' },
                  writable ? vText('可写', 'Writable') : vText('只读', 'Read-only')),
                h('span', { className: 'voice-muted' }, state?.hasProxy ? vText('已配置代理 (脱敏)', 'Proxy configured (masked)') : vText('直连网络', 'Direct connection')),
              ),
            ),
            h('p', { className: 'voice-muted' }, vText(
              '安全提示：API 密钥与代理地址仅在宿主设置表单中脱敏保存，本工作台后端绝不向页面返回任何密钥原文。',
              'Security note: API keys and proxy URLs are masked in host settings and are never returned to the browser.',
            )),
          ),
          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('发音替读词典 (pronunciations)', 'Pronunciation Lexicon (pronunciations)')),
              h('span', { className: 'dsh-wb-count' }, pronunciations.length),
            ),
            h('p', { className: 'voice-muted' }, vText(
              '支持 ASCII 词边界安全匹配（如 OS 绝不误伤 POST），在 Edge / OpenAI / SiliconFlow 合成前自动按替读发音处理。',
              'Word-boundary safe matching (e.g. OS never corrupts POST), applied cleanly across Edge, OpenAI, and SiliconFlow.',
            )),
            h('div', { className: 'dsh-wb-prompt-chips' },
              presets.map(p => h(W.Button, {
                key: p.word,
                size: 'sm',
                icon: 'plus',
                disabled: !writable || !!busy,
                onClick: () => {
                  const next = [...pronunciations.filter(r => r.word.toLowerCase() !== p.word.toLowerCase()), p];
                  void run('updateConfig', { patch: { pronunciations: next } }, () => setNotice(t('savedConfig')));
                },
              }, `${p.word} → ${p.alias}`)),
            ),
            pronunciations.length > 0
              ? h('div', { className: 'voice-list-stack' },
                  pronunciations.map((rule, idx) => h('div', { key: rule.word + '-' + idx, className: 'voice-list-item' },
                    h('div', { className: 'voice-list-main' },
                      h('strong', null, rule.word),
                      h('span', { className: 'voice-mono' }, '→ ' + rule.alias),
                    ),
                    h(W.Button, {
                      size: 'sm',
                      variant: 'danger',
                      icon: 'trash',
                      disabled: !writable || !!busy,
                      onClick: () => run('updateConfig', {
                        patch: { pronunciations: pronunciations.filter((_, i) => i !== idx) },
                      }, () => setNotice(t('savedConfig'))),
                    }, vText('删除', 'Delete')),
                  )),
                )
              : h('p', { className: 'voice-muted' }, vText('暂无发音规则。点击上方示例或下方表单添加。', 'No pronunciation rules yet.')),
            h('form', {
              className: 'voice-subform',
              onSubmit: e => {
                e.preventDefault();
                const w = lexWord.trim();
                const a = lexAlias.trim();
                if (!w || !a) return;
                const next = [...pronunciations.filter(r => r.word.toLowerCase() !== w.toLowerCase()), { word: w, alias: a }];
                void run('updateConfig', { patch: { pronunciations: next } }, () => {
                  setLexWord('');
                  setLexAlias('');
                  setNotice(t('savedConfig'));
                });
              },
            },
              h('div', { className: 'voice-form-grid' },
                h('label', { className: 'voice-field' },
                  h('span', null, vText('原词 / 缩写 *', 'Word / Acronym *')),
                  h(W.Input, { required: true, value: lexWord, placeholder: 'Nginx', disabled: !writable || !!busy, onChange: e => setLexWord(e.target.value) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('替读发音 *', 'Spoken Alias *')),
                  h(W.Input, { required: true, value: lexAlias, placeholder: 'Engine X', disabled: !writable || !!busy, onChange: e => setLexAlias(e.target.value) }),
                ),
              ),
              h(W.Button, {
                type: 'submit',
                variant: 'primary',
                icon: 'plus',
                disabled: !writable || !!busy || !lexWord.trim() || !lexAlias.trim(),
              }, vText('添加发音规则', 'Add Pronunciation Rule')),
            ),
          ),
        );
      }

      function renderLibraryTab() {
        return h('div', { className: 'voice-section-stack' },
          h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
            h('div', { className: 'voice-block-head' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('工作区音频与同步字幕成品库', 'Workspace Audio & Subtitle Library')),
              h(W.Button, {
                size: 'sm',
                icon: 'refresh',
                spinning: busy === 'workspaceLibrary',
                disabled: !!busy,
                onClick: () => { void loadLibrary(); },
              }, vText('刷新列表', 'Refresh')),
            ),
            h('p', { className: 'voice-muted' }, vText(
              '自动扫描当前会话工作区根目录及 voice_outputs/、voice_previews/、voice_clones/ 中的音频文件，并配对同名 .srt/.vtt 字幕实现点按跳播跟读。',
              'Lists audio files across workspace root, voice_outputs/, voice_previews/, and voice_clones/, pairing sibling .srt/.vtt subtitles for click-to-seek playback.',
            )),
            busy === 'workspaceLibrary' && !libraryLoaded
              ? h(W.Empty, { title: vText('正在扫描工作区音频…', 'Scanning workspace media…'), icon: 'folder' })
              : libraryItems.length === 0
                ? h(W.Empty, {
                    title: vText('当前工作区暂无音频成品', 'No audio files in workspace yet'),
                    icon: 'folder',
                    action: h(W.Button, {
                      variant: 'primary',
                      icon: 'play',
                      onClick: () => setActiveTab('studio'),
                    }, vText('前往编排多角色对话', 'Open Dialogue Composer')),
                  })
                : h('div', { className: 'voice-list-stack' },
                    libraryItems.map(item => h('div', { key: item.path, className: 'voice-list-item' },
                      h('div', { className: 'voice-list-main' },
                        h('div', { className: 'voice-library-title-row' },
                          h('strong', null, item.name),
                          item.subtitlePath
                            ? h('span', { className: 'dsh-wb-tag', 'data-tone': 'success' },
                                vText('含同步字幕 .srt/.vtt', 'Synced .srt/.vtt'))
                            : null,
                        ),
                        h('span', { className: 'voice-mono' },
                          `${item.path} · ${Math.max(1, Math.round((item.bytes || 0) / 1024))} KB`),
                      ),
                      h('div', { className: 'dsh-wb-toolbar' },
                        h(W.Button, {
                          size: 'sm',
                          variant: 'primary',
                          icon: 'play',
                          spinning: busy === 'media:' + item.path,
                          disabled: !!busy,
                          onClick: () => { void playWorkspaceItem(item); },
                        }, vText('字幕跟读播放', 'Follow-Along Play')),
                      ),
                    )),
                  ),
          ),
        );
      }

      return __stardustUpdatesInlinePage(React,h(W.Page, {
        workbench,
        icon: 'play',
        lang: language,
        title: t('title'),
        subtitle: t('subtitle'),
        className: 'dshv voice-workbench',
        tourSteps: voiceTourSteps,
        tourStorageKey: 'dsh-voice.tour.v1',
        onTourCopyPrompt: async textVal => {
          const ok = await W.writeClipboardText(textVal);
          if (ok) setNotice(t('copyStatus'));
          return ok;
        },
        actions: h(React.Fragment, null,
          h(W.IconButton, {
            icon: 'refresh',
            spinning: busy === 'load',
            label: t('refresh'),
            disabled: !!busy,
            onClick: () => run(null),
          }),
        ),
      },
        h('style', { 'data-plugin-css': 'dsh-voice/workbench' }, VOICE_WORKBENCH_CSS),
        state && !writable ? h(W.Status, { tone: 'warn' }, t('readonly')) : null,
        error ? h(W.Status, { tone: 'error' }, error) : null,
        notice ? h(W.Status, { tone: 'success' }, notice) : null,
        renderVoicePlayerBar(),
        h('div', { className: 'voice-guide-wrap' },
          h(W.Details, { summary: t('guideSummary'), className: 'voice-guide-details' },
            h('p', { className: 'voice-muted' }, t('guideStep1')),
            h('p', { className: 'voice-muted' }, t('guideStep2')),
            h('p', { className: 'voice-muted' }, t('guideStep3')),
            h('div', { className: 'dsh-wb-prompt-chips' },
              h(W.CopyPrompt, {
                prompt: vText('请用「深夜电台」(late-night-radio) 人设为我朗读今天的重点资讯并导出 MP3', 'Read today’s briefing aloud using persona "late-night-radio" and export MP3'),
                label: vText('复制：深夜电台播报', 'Copy: Late-night radio'),
                copiedLabel: t('copied'),
                statusText: t('copyStatus'),
                failedText: t('copyFailed'),
              }),
              h(W.CopyPrompt, {
                prompt: podcastPromptText,
                label: vText('复制：双人播客 + BGM 压低', 'Copy: Podcast + BGM ducking'),
                copiedLabel: t('copied'),
                statusText: t('copyStatus'),
                failedText: t('copyFailed'),
              }),
              h(W.CopyPrompt, {
                prompt: vText('请把当前工作区的会议录音或 MP4 视频转为文字，开启说话人区分并导出 .srt 字幕', 'Transcribe the meeting audio/MP4 video with speaker diarization and export .srt subtitles'),
                label: vText('复制：视频/录音转字幕', 'Copy: Video/Audio transcription'),
                copiedLabel: t('copied'),
                statusText: t('copyStatus'),
                failedText: t('copyFailed'),
              }),
            ),
          ),
        ),
        h(W.Tabs, {
          id: tabsId,
          label: vText('语音工作室视图', 'Voice Studio views'),
          value: activeTab,
          onChange: setActiveTab,
          items: [
            { id: 'voices', label: t('tabVoices'), count: allVoices.length || undefined },
            { id: 'studio', label: t('tabStudio') },
            { id: 'mic', label: t('tabMic'), count: customVoices.length || undefined },
            { id: 'lexicon', label: t('tabLexicon'), count: pronunciations.length || undefined },
            { id: 'library', label: t('tabLibrary'), count: libraryItems.length || undefined },
          ],
        },
          loading ? h(W.Empty, { title: t('loading'), icon: 'play' })
          : !state ? h(W.Empty, {
              title: t('loadError'),
              icon: 'play',
              action: h(W.Button, { icon: 'refresh', disabled: !!busy, onClick: () => run(null) }, t('retry')),
            })
          : activeTab === 'voices' ? renderVoicesTab()
          : activeTab === 'studio' ? renderStudioTab()
          : activeTab === 'mic' ? renderMicTab()
          : activeTab === 'library' ? renderLibraryTab()
          : renderLexiconTab(),
        ),
      ),"dsh-voice");
    }

    function apply(ctx) {
      W.register(ctx, {
        id: 'dsh-voice.workbench',
        label: () => t('title'),
        icon: 'play',
        component: Panel,
        order: 58,
      });
      ctx.effect(() => {
        const service = ctx.get ? ctx.get('locale') : ctx.locale;
        const update = () => {
          language = String(service?.getSnapshot?.().active || 'zh').startsWith('en') ? 'en' : 'zh';
          for (const notify of listeners) notify(language);
        };
        update();
        return service?.subscribe?.(update) || (() => {});
      }, 'dsh-voice: locale');
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register({
          name: 'settings.section',
          id: 'dsh-voice',
          order: 58,
          label: () => {
            let lang = language;
            try {
              const service = ctx.get ? ctx.get('locale') : ctx.locale;
              if (service?.getSnapshot) {
                lang = String(service.getSnapshot().active || '').startsWith('en') ? 'en' : 'zh';
              }
            } catch { /* ignore */ }
            return words.title[lang === 'en' ? 1 : 0];
          },
          inject: () => ({}),
        }, Panel),
      );
    }

    return { apply, inject: ['slots', 'locale'] };
  },
},{"name":"dsh-voice","version":"0.1.0","hasWorkbench":true,"packageVersion":"0.11.4","label":"语音","labelEn":"Voice","suiteComponent":true,"sectionIds":["dsh-voice"],"iconData":"data:image/webp;base64,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"}));

const VOICE_WORKBENCH_CSS = `
.voice-workbench {
  min-width: 0;
}

.voice-workbench .voice-guide-wrap {
  padding: 6px 18px 0;
}

.voice-workbench .voice-guide-details {
  padding-block: 8px;
  border-block-start: 0;
}

.voice-workbench .voice-player-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 18px 0;
  padding: 10px 14px;
  border-radius: var(--w-radius-md);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-1);
}

.voice-workbench .voice-player-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 14px;
}

.voice-workbench .voice-player-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.voice-workbench .voice-player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 240px;
  flex-wrap: wrap;
}

.voice-workbench .voice-audio-el {
  flex: 1;
  min-width: 170px;
  height: 34px;
}

.voice-workbench .voice-speed-select {
  width: 84px;
  flex: none;
}

.voice-workbench .voice-download-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
  color: var(--w-ink);
  text-decoration: none;
  font-size: 12px;
  font-weight: 550;
  white-space: nowrap;
}

.voice-workbench .voice-download-link:hover {
  border-color: var(--w-accent);
  color: var(--w-accent);
}

.voice-workbench .voice-cue-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 128px;
  overflow-y: auto;
  padding-block-start: 6px;
  border-block-start: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
}

.voice-workbench .voice-cue-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 9px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
  color: var(--w-ink);
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease;
}

.voice-workbench .voice-cue-chip:hover {
  border-color: var(--w-accent);
}

.voice-workbench .voice-cue-chip.is-active {
  border-color: var(--w-accent);
  background: var(--w-accent-soft);
  font-weight: 600;
}

.voice-workbench .voice-cue-time {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  color: var(--w-muted);
  flex: none;
}

.voice-workbench .voice-section-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 18px 28px;
  width: min(1040px, 100%);
}

.voice-workbench .voice-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--w-radius-md);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-1);
}

.voice-workbench .voice-filter-select {
  min-width: 140px;
}

.voice-workbench .voice-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.voice-workbench .voice-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.voice-workbench .voice-block-head h3,
.voice-workbench .voice-panel-card h3 {
  margin: 0;
  font-size: 14.5px;
  line-height: 21px;
  font-weight: 650;
  color: var(--w-ink);
}

.voice-workbench .voice-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 10px;
}

.voice-workbench .voice-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 14px;
  border-radius: var(--w-radius-md);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-1);
}

.voice-workbench .voice-card.is-default {
  border-color: var(--w-accent);
  background: var(--w-accent-soft);
}

.voice-workbench .voice-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.voice-workbench .voice-card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-block-start: auto;
  padding-block-start: 4px;
}

.voice-workbench .voice-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.voice-workbench .voice-muted {
  margin: 0;
  color: var(--w-muted);
  font-size: 12.5px;
  line-height: 18px;
}

.voice-workbench .voice-mono {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  color: var(--w-muted);
  overflow-wrap: anywhere;
}

.voice-workbench .voice-panel-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border-radius: var(--w-radius-md);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-1);
}

.voice-workbench .voice-dialogue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.voice-workbench .voice-dialogue-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
}

.voice-workbench .voice-dialogue-meta {
  display: grid;
  grid-template-columns: minmax(110px, 160px) minmax(160px, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.voice-workbench .voice-dialogue-input {
  min-height: 52px;
}

.voice-workbench .voice-inline-name-input {
  max-width: 220px;
}

.voice-workbench .voice-clone-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 11px 13px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-accent);
  background: var(--w-accent-soft);
}

.voice-workbench .voice-library-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.voice-workbench .voice-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 10px 12px;
}

.voice-workbench .voice-field {
  display: grid;
  align-content: start;
  gap: 5px;
  min-width: 0;
}

.voice-workbench .voice-field > span {
  font-size: 12px;
  font-weight: 600;
  color: var(--w-muted);
}

.voice-workbench .voice-field-span2 {
  grid-column: span 2;
}

.voice-workbench .voice-pair-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 8px;
}

.voice-workbench .voice-prompt-preview {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
  font: 12px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--w-ink);
}

.voice-workbench .voice-transcript-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-block-start: 6px;
}

.voice-workbench .voice-list-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-workbench .voice-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
}

.voice-workbench .voice-list-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.voice-workbench .voice-subform {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-block-start: 10px;
  border-block-start: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
}

.voice-workbench .voice-health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
}

.voice-workbench .voice-health-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 11px 13px;
  border-radius: var(--w-radius-sm);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-base);
}

@container dsh-workbench (max-width: 720px) {
  .voice-workbench .voice-form-grid {
    grid-template-columns: 1fr;
  }
  .voice-workbench .voice-field-span2 {
    grid-column: span 1;
  }
  .voice-workbench .voice-dialogue-meta {
    grid-template-columns: 1fr;
  }
  .voice-workbench .voice-section-stack {
    padding: 12px 12px 24px;
  }
}
`;

})();

/* STARDUSTLC_UPDATE_CLIENT_BODY_END */
})();

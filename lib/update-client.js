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
    record = { refs: new Map(), timer: null, version: participant.version, alive: true, hold: false, uiRevision: 5, migration: Promise.resolve() };
    pools.set(root, record);
    __stardustUpdatesActivate(record, pools, root, React, require);
  } else if ((record.uiRevision || 0) < 5 && !record.upgrading) {
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
      shared.alive = true; shared.uiRevision = 5; pools.set(root, shared);
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
  const { useState, useEffect } = React, id = crypto.randomUUID(), listeners = new Set(), pool = __stardustUpdatesGuards(), requests = new Set(), notified = new Set(), knownRows = new Map();
  let alive = true, registered = false, state = null, lastInteraction = Date.now(), inPoll = false, manualOperation = false, legacyHint = null;
  const language = () => String(ctx.locale?.getSnapshot?.().active || '').startsWith('en') ? 'en' : 'zh';
  const t = (zh, en) => language() === 'en' ? en : zh;
  const REPOS = { 'dsh-calendar': 'dsh-calendar', 'dsh-cite': 'dsh-cite', 'dsh-code-security': 'dsh-code-security', 'dsh-codex-port': 'dsh-codex-port', 'deepseek-computer-use': 'deepseek-computer-use', 'dsh-dingtalk': 'dsh-dingtalk', '@stardustlc/dsh-docker': 'dsh-docker', '@stardustlc/dsh-dream': 'dsh-dream', 'dsh-email': 'dsh-email', 'dsh-ffmpeg': 'dsh-ffmpeg', 'dsh-flakefinder': 'dsh-flakefinder', 'dsh-hyperframes': 'dsh-hyperframes', 'dsh-minimal-ptc': 'dsh-minimal-ptc', 'dsh-ppt': 'dsh-ppt', 'dsh-remotion': 'dsh-remotion', '@stardustlc/dsh-review': 'dsh-review', 'dsh-rss': 'dsh-rss', 'dsh-slack': 'dsh-slack', 'dsh-sql': 'dsh-sql', '@stardustlc/dsh-suite': 'dsh-suite', 'dsh-voice': 'dsh-voice' };
  const repoUrl = pkg => Object.hasOwn(REPOS, pkg) ? 'https://github.com/STARDUSTLC666/' + REPOS[pkg] : null;
  const preferences = name => state?.preferences.packages[name] || { checkEnabled: true, autoInstall: false, deferredUntil: 0, ignoredVersion: null };
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
      'release-changed': t('发布信息已变化，本次未安装。请重新检查。', 'Release metadata changed. Nothing was installed; check again.'),
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
    })[code] || t('操作未完成，请刷新后重试。DSH 不会因此自动重启。', 'The operation could not be completed. Refresh and retry. DSH will not restart automatically.');
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
  function FooterFrame({ name, label, subtitle, actions, children }) {
    return h('section', { className: 'dshw plugin-updates-footer', 'data-plugin-update-footer': name, 'aria-label': label + t(' · 版本与更新', ' · Version and updates') },
      h('style', null, W.styles),
      h('style', null, '.plugin-updates-footer{box-sizing:border-box;flex-shrink:0;margin-top:28px;padding-top:18px;border-top:1px solid var(--dsw-alias-border-l3,#e5e7eb);min-width:0;max-width:100%;color:var(--dsw-alias-label-primary,#202124)}.plugin-updates-footer .updates-head{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px}.plugin-updates-footer h2{font-size:14px;line-height:22px;margin:0;font-weight:600}.plugin-updates-footer .updates-subtitle,.plugin-updates-footer .updates-version{font:12px/1.6 ui-monospace,monospace;overflow-wrap:anywhere;margin:4px 0}.plugin-updates-footer .updates-options{margin-top:12px}.plugin-updates-footer .updates-options>summary{cursor:pointer;font-size:12px;line-height:22px;color:var(--dsw-alias-label-secondary,#657080)}.plugin-updates-footer .updates-options>summary:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:4px}.plugin-updates-footer .updates-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px;padding:14px 0 0}.plugin-updates-footer .updates-note{margin:5px 0 0;font-size:12px;line-height:1.6}.plugin-updates-footer>.w-section{margin:10px 0 0;padding:0;border:0}.plugin-updates-footer .w-toolbar{margin-top:10px!important}.plugin-updates-footer .w-switch-label{max-width:100%;gap:12px;align-items:flex-start}.plugin-updates-footer .w-switch-track{flex-shrink:0}.plugin-updates-footer .updates-notes{margin-top:12px;padding:12px;border:1px solid var(--dsw-alias-border-l3,#e5e7eb);border-radius:10px}.plugin-updates-footer .updates-notes pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto;font:12px/1.7 ui-monospace,monospace}.plugin-updates-footer .updates-links{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin-top:12px;padding-top:10px;border-top:1px dashed var(--dsw-alias-border-l3,#e5e7eb);font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#657080)}.plugin-updates-footer .updates-links a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:4px}.plugin-updates-footer .updates-links a:hover{color:var(--dsw-alias-label-primary,#202124);text-decoration:underline}.plugin-updates-footer .updates-links a:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:3px;border-radius:4px}.plugin-updates-footer .w-overlay{z-index:1002}@media(max-width:600px){.plugin-updates-footer .updates-head{gap:8px}.plugin-updates-footer .w-toolbar{gap:6px;flex-wrap:wrap}.plugin-updates-footer .w-button{max-width:100%}}'),
      h('div', { className: 'updates-head' }, h('div', null, h('h2', null, t('版本与更新', 'Version and updates')), h('p', { className: 'updates-subtitle w-muted' }, subtitle)), actions), children);
  }
  function Panel({ name }) {
    const snapshot = useSnapshot(), [error, setError] = useState(''), [working, setWorking] = useState(false), [checking, setChecking] = useState(false), [dialog, setDialog] = useState(null), [selectedVersion, setSelectedVersion] = useState(null), [notes, setNotes] = useState(null), [notesOpen, setNotesOpen] = useState(false), [loadingNotes, setLoadingNotes] = useState(false);
    const row = rowFor(name), original = originalRow(name), target = row?.name || name, prefs = preferences(target), job = snapshot?.job?.name === target ? snapshot.job : null;
    async function perform(callback) { setError(''); setWorking(true); try { await callback(); await refresh(); } catch (error) { setError(error.message); await refresh().catch(() => {}); } finally { setWorking(false); } }
    async function save(changes, consent) { await api({ action: 'preferences', name: target, revision: state.preferences.revision, changes, consent }); }
    async function check() { setError(''); setChecking(true); try { await api({ action: 'check', name: target }); await refresh(); } catch (error) { setError(error.message); } finally { setChecking(false); } }
    async function runOperation(request) {
      setDialog(null); manualOperation = true; notify();
      await perform(async () => {
        try {
          await heartbeat();
          const started = await api(request);
          while (alive) {
            await new Promise(resolve => setTimeout(resolve, 800)); await heartbeat(); await refresh();
            if (state.job?.id !== started.id) throw new Error('operation-unconfirmed');
            if (!activeJob()) break;
          }
        } finally { manualOperation = false; notify(); }
      });
    }
    async function showNotes() {
      if (notesOpen) { setNotesOpen(false); return; }
      setNotesOpen(true); setNotes(null); setLoadingNotes(true); setError('');
      try { setNotes(await api({ action: 'notes', name: target, version: row.release.version })); } catch (error) { setError(error.message); } finally { setLoadingNotes(false); }
    }
    if (!snapshot) return h(W.Status, null, t('正在读取更新状态…', 'Loading update status…'));
    if (!row || !original) return h(W.Status, null, t('此插件尚未安装或已从当前 profile 移除。', 'This plugin is not installed in the current profile.'));
    const title = language() === 'en' ? original.labelEn : original.label;
    const ownPage = pageState(true), unconfirmed = ['unknown', 'restore-failed'].includes(snapshot.job?.state);
    const pageBusy = ownPage.busy || (snapshot.pages.clients || []).some(client => client.id !== id && client.busy);
    const installLocked = working || activeJob() || unconfirmed || snapshot.updaterRestart || snapshot.preferenceError || !snapshot.activity.known
      || snapshot.activity.busy || snapshot.pages.dirty || ownPage.dirty || pageBusy || !snapshot.pages.known;
    const checkingThis = checking || snapshot.checkingNames?.includes(target);
    const managed = row.sourceKind === 'registry';
    const showUpdate = managed && row.available;
    const canConfirm = showUpdate && row.release?.version === selectedVersion && !installLocked && !row.loadError;
    const isSuite = target === '@stardustlc/dsh-suite';
    function progress() {
      if (!job) return null;
      const result = job.outcome?.result;
      const reason = job.reason || (result?.pendingBuilds || result?.failureKind === 'build-blocked' ? 'build-blocked' : result?.error?.code);
      const canCancel = activeJob() && !['applying', 'restoring'].includes(job.phase);
      return h('section', { className: 'w-section', role: 'status', 'aria-label': t('更新进度', 'Update progress') },
        h('h3', null, jobLabel(job)),
        job.to && h('p', { className: 'w-muted' }, job.from + ' → ' + job.to + (job.mode === 'automatic' ? t(' · 自动补丁', ' · Automatic patch') : '')),
        reason && h(W.Status, { tone: 'error' }, message(reason)),
        canCancel && h(W.Button, { disabled: job.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update')));
    }
    function windowControls() {
      if (!(snapshot.pages.clients || []).some(client => !client.fresh)) return null;
      return h('div', null,
        h(W.Status, null, h('p', null, t('有窗口已断开，无法确认是否还有未保存修改。仍在使用的窗口请先保存并刷新；已关闭的窗口可以手动重新确认。', 'A disconnected window may contain unsaved changes. Save and refresh windows still in use. If they are closed, you can confirm that manually.')), h(W.Button, { onClick: () => setDialog('windows') }, t('重新确认已关闭的窗口', 'Confirm closed windows'))),
        dialog === 'windows' && h(W.Dialog, { title: t('断开的窗口都已关闭？', 'Are the disconnected windows closed?'), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
          h('div', { className: 'w-stack' }, h('p', null, t('只清除超过 45 秒未回应的其他窗口记录。请先确认它们已经关闭；仍在使用的窗口请保存修改并刷新。当前或仍在回应的窗口保护会保留。', 'Only other windows silent for over 45 seconds are cleared. Confirm that they are closed; save and refresh windows still in use. Current and responsive windows remain protected.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')), h(W.Button, { onClick: () => { setDialog(null); void perform(() => api({ ...pageState(true), action: 'reconfirm-windows', confirmation: 'other-stale-windows-are-closed' })); } }, t('已关闭，重新确认状态', 'They are closed; reconfirm'))))));
    }
    const status = !managed ? t('本地 / 外部来源，保留原安装方式', 'Local / external source; keep original install method') : row.loadError ? t('加载异常，请先检查原生插件管理', 'Loading error; check native plugin management') : row.error ? t('检查失败，可以重试', 'Check failed; retry available') : row.release && !row.release.compatible ? t('新版本暂不兼容当前环境：', 'Latest release is incompatible with this environment: ') + requirement(row.release) + (row.release.required ? ' (' + row.release.required + ')' : '') : row.available ? (prefs.ignoredVersion === row.release.version ? t('已忽略提醒，仍可手动更新', 'Reminder ignored; manual update available') : t('有兼容的新版本', 'Compatible update available')) : row.checkedAt ? t('当前已是最新稳定版', 'Latest stable version') : t('尚未检查', 'Not checked yet');
    const checkButton = variant => h(W.Button, { variant, icon: 'refresh', disabled: checkingThis || !managed, onClick: check }, checkingThis ? t('正在检查…', 'Checking…') : isSuite ? t('检查整包更新', 'Check Suite updates') : t('检查更新', 'Check for updates'));
    const primary = showUpdate
      ? h(W.Button, { variant: 'primary', icon: 'download', disabled: installLocked || row.loadError, onClick: () => { setSelectedVersion(row.release.version); setDialog('install'); } }, (isSuite ? t('更新 Suite 至 v', 'Update Suite to v') : t('更新至 v', 'Update to v')) + row.release.version)
      : managed ? checkButton() : null;
    return h(FooterFrame, { name, label: title, subtitle: original.name + ' · ' + original.version, actions: primary },
      original.bundledBy && h(W.Status, null, t('此插件随 Suite 安装。以下设置与安装作用于 Suite 整包，以保持组件版本一致。单独安装的插件可以独立更新。', 'This plugin was installed through Suite. These controls update Suite as a package so its components stay consistent. Independently installed plugins update individually.')),
      h('section', { className: 'w-section' },
        (original.bundledBy || row.available) && h('p', { className: 'updates-version' }, target + ' · ' + row.version, row.release?.version && row.release.version !== row.version ? ' → ' + row.release.version : ''),
        h('p', { className: 'w-muted updates-note' }, status),
        !row.enabled && h('p', { className: 'w-muted' }, t('当前已停用，更新后仍保持停用。', 'Currently disabled; it will remain disabled after updating.')),
        row.checkedAt && h('p', { className: 'w-muted updates-note' }, t('上次检查：', 'Last checked: ') + new Date(row.checkedAt).toLocaleString(language() === 'en' ? 'en-US' : 'zh-CN')),
        h('div', { className: 'w-toolbar' },
          showUpdate && checkButton('ghost'),
          row.release && h(W.Button, { variant: 'ghost', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
          showUpdate && h(W.Button, { variant: 'ghost', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('明天再提醒', 'Remind me tomorrow')),
          showUpdate && prefs.ignoredVersion !== row.release.version && h(W.Button, { variant: 'ghost', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版本提醒', 'Ignore this reminder')))),
      notesOpen && h('section', { className: 'updates-notes', 'aria-label': t('更新记录', 'Release notes') }, h('strong', null, target + ' · ' + (notes?.version || row.release?.version || '')), loadingNotes ? h('p', null, t('正在读取…', 'Loading…')) : notes?.text ? h('pre', null, notes.text) : h('p', null, t('未找到此版本的独立更新记录。', 'No separate notes were found for this version.')), notes?.url && h('a', { href: notes.url, target: '_blank', rel: 'noreferrer noopener' }, t('查看仓库更新记录', 'View repository changelog'))),
      h('details', { className: 'updates-options' }, h('summary', null, t('更新选项', 'Update options'), ' · ', prefs.checkEnabled ? t('自动检查：开', 'Checks: on') : t('自动检查：关', 'Checks: off'), ' · ', prefs.autoInstall ? t('自动安装：开', 'Install: on') : t('自动安装：关', 'Install: off')), h('section', { className: 'updates-settings', 'aria-label': t('这个插件的更新偏好', 'Update preferences for this plugin') },
        h('div', null, h(W.Switch, { label: isSuite ? t('自动检查 Suite 整包更新', 'Automatically check Suite updates') : t('自动检查这个插件的更新', 'Automatically check this plugin'), checked: prefs.checkEnabled, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => perform(() => save({ checkEnabled: event.target.checked })) }), h('p', { className: 'w-muted updates-note' }, t('默认开启，每天最多一次。只影响这个安装包，关闭后仍可手动检查。', 'On by default, at most once daily. This affects only this bundle; manual checks remain available.'))),
        h('div', null, h(W.Switch, { label: isSuite ? t('空闲时自动安装 Suite 补丁', 'Install Suite patches while idle') : t('空闲时自动安装这个插件的补丁', 'Install patches for this plugin while idle'), checked: prefs.autoInstall, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => event.target.checked ? setDialog('automatic') : perform(() => save({ autoInstall: false })) }), h('p', { className: 'w-muted updates-note' }, t('默认关闭。明确开启后，仅空闲且没有未保存修改时安装兼容补丁。其他插件的开关不变。', 'Off by default. Explicitly enable compatible patches while idle with no unsaved changes. Other plugins’ settings stay unchanged.'))))),
      error && h(W.Status, { tone: 'error' }, message(error)), snapshot.preferenceError && h(W.Status, { tone: 'error' }, message('preferences-unreadable')),
      snapshot.pendingRestart && h(W.Status, null, snapshot.updaterRestart ? message('restart-required') : t('已有更新等待手动重启后生效。你可以继续工作，自动安装已暂停。', 'Some updates need a manual restart. Continue your work; automatic installation is paused.')),
      prefs.autoInstall && snapshot.autoReady === false && h(W.Status, null, message('page-not-ready')),
      windowControls(),
      (snapshot.pages.dirty || ownPage.dirty) && h(W.Status, null, message('page-dirty')), (snapshot.activity.busy || pageBusy) && h(W.Status, null, message(snapshot.activity.busy ? 'busy' : 'page-busy')),
      prefs.deferredUntil > Date.now() && h(W.Status, null, t('此插件已推迟提醒和自动安装 24 小时，仍可手动更新。', 'Reminders and automatic installation for this plugin are deferred for 24 hours. Manual updates remain available.')),
      unconfirmed && h(W.Status, { tone: 'error' }, message('operation-unconfirmed')),
      progress(),
      (() => {
        const ownRepo = repoUrl(original.name), suiteRepo = repoUrl('@stardustlc/dsh-suite'), starRepo = isSuite ? suiteRepo : ownRepo;
        if (!ownRepo && !starRepo) return null;
        return h('nav', { className: 'updates-links', 'aria-label': t('开源仓库与反馈', 'Repository and feedback') },
          starRepo && h('a', { href: starRepo, target: '_blank', rel: 'noreferrer noopener' }, isSuite ? t('★ 觉得好用？在 GitHub 给 dsh-suite 点个 Star', '★ Useful? Star dsh-suite on GitHub') : t('★ 觉得好用？在 GitHub 点个 Star', '★ Useful? Star on GitHub')),
          ownRepo && h('a', { href: ownRepo + '/issues', target: '_blank', rel: 'noreferrer noopener' }, t('提交建议 / 问题反馈', 'Feedback & issues')),
          isSuite && original.name !== '@stardustlc/dsh-suite' && ownRepo && h('a', { href: ownRepo, target: '_blank', rel: 'noreferrer noopener' }, t('组件仓库', 'Component repo')),
          !isSuite && suiteRepo && h('a', { href: suiteRepo, target: '_blank', rel: 'noreferrer noopener' }, t('了解 dsh-suite（18 合 1 组合包）', 'Explore dsh-suite (18-in-1 bundle)')));
      })(),
      ['automatic', 'install'].includes(dialog) && h(W.Dialog, { title: dialog === 'automatic' ? (isSuite ? t('允许 Suite 自动安装补丁？', 'Allow automatic patches for Suite?') : t('允许这个插件自动安装补丁？', 'Allow automatic patches for this plugin?')) : (isSuite ? t('确认更新 Suite 整包', 'Confirm Suite bundle update') : t('确认更新此插件', 'Confirm this plugin update')), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
        dialog === 'automatic' ? h('div', { className: 'w-stack' }, h('p', null, (language() === 'en' ? row.labelEn : row.label) + ' · ' + target), isSuite && h('p', null, t('此处设置作用于 Suite 整包（包含 18 个组件）。独立安装的其他插件不受影响。', 'This setting applies to the whole Suite (including its 18 components). Other independently installed plugins are unaffected.')), h('p', null, t('你正在主动启用自动安装。只处理兼容的稳定补丁；有任务、未保存修改、未知窗口或等待重启时暂停。', 'You are explicitly enabling automatic installation. Only compatible stable patches qualify; running tasks, unsaved changes, unknown windows or a pending restart pause it.')), h('p', null, t('支持热更新时原地重载，不会自动重启 DSH；其他插件不会跟着开启，可随时关闭。', 'Hot-reloads in place when supported and never restarts DSH automatically. Other plugins remain unchanged; turn it off anytime.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('保持关闭', 'Keep off')), h(W.Button, { variant: 'primary', onClick: () => { setDialog(null); void perform(() => save({ checkEnabled: true, autoInstall: true }, 'enable-idle-patch-updates')); } }, t('允许自动安装补丁', 'Allow automatic patches')))) :
        h('div', { className: 'w-stack' },
          isSuite && h('p', null, t('此处操作的是 Suite 整包，包含 18 个组件。独立安装的其他插件不受影响。', 'This action applies to the whole Suite, including its 18 components. Other independently installed plugins are unaffected.')),
          h('p', { className: 'updates-version' }, target + ' · ' + row.version + ' → ' + selectedVersion),
          h('p', null, selectedVersion === row.release?.version ? t('Harness 会热更新并重新加载；需要手动重启时，更新区会显示宿主结果，停用状态会保留。', 'Harness hot-updates and reloads in place. If a manual restart is needed, it appears in the update result; disabled status is preserved.') : message('check-first')),
          h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')),
            h(W.Button, { variant: 'primary', disabled: !canConfirm, onClick: () => runOperation({ action: 'install', name: target, version: selectedVersion, confirmation: 'update-installed-plugin' }) }, t('安装此版本', 'Install this version')))))
    );
  }
  function NativeFooter({ subject }) {
    const snapshot = useSnapshot(), name = __stardustUpdatesDetailName(subject, snapshot?.rows || []);
    return name ? h(Panel, { name }) : null;
  }
  function Reminder() {
    useSnapshot();
    const row = state?.rows.find(row => { const prefs = preferences(row.name); return row.available && !row.updating && !row.bundledBy && prefs.checkEnabled && prefs.deferredUntil <= Date.now() && prefs.ignoredVersion !== row.release.version && !notified.has(row.name + '@' + row.release.version); });
    if (!row && !legacyHint) return null;
    let Toast; try { Toast = require('@deepseek-ai/dsh-client-ui-primitives').Toast; } catch { return null; }
    if (!Toast) return null;
    const hint = legacyHint, key = hint ? 'legacy-' + hint : row.name + '@' + row.release.version;
    return h(Toast, { key, text: hint ? hint + t('：请打开「插件」中的此插件详情页，在底部管理更新。', ': open its details in Plugins to manage updates at the bottom.') : (language() === 'en' ? row.labelEn : row.label) + t('有新版本，可在页面底部查看。', ' has an update. Review it at the bottom of its page.'), icon: h(W.Icon, { name: 'refresh', size: 18 }), holdMs: 7000, onDone: () => { if (hint) legacyHint = null; else notified.add(key); notify(); } });
  }
  function register() {
    if (!alive) return;
    if (!registered) {
      registered = true; pool.clients.add(client);
      ctx.slots.inject('plugins.detail.section', () => ctx.slots.register({ name: 'plugins.detail.section', id: 'stardustlc.plugin-update-footer', order: 1000 }, NativeFooter));
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'stardustlc.plugin-update-reminder' }, Reminder));
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
  const client = { t, Footer: Panel, Button: W.Button, open(name) { const footer = [...document.querySelectorAll('[data-plugin-update-footer]')].find(node => node.getAttribute('data-plugin-update-footer') === name); if (footer) footer.scrollIntoView({ block: 'end', behavior: 'smooth' }); else { legacyHint = name; notify(); } }, has: name => registered && !!originalRow(name), row: rowFor, dispose() {
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
window.__ModuleLoader__.load(__stardustUpdatesWrap({id:"dsh-voice",factory:require=>({apply(){}})},{"name":"dsh-voice","version":"0.1.0","hasWorkbench":false,"packageVersion":"0.5.11","label":"语音","labelEn":"Voice","suiteComponent":true,"sectionIds":[],"iconData":"data:image/webp;base64,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"}));

/* STARDUSTLC_UPDATE_CLIENT_BODY_END */
})();

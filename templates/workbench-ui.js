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
        const target = (current.selector && scope.querySelector(current.selector))
          || (current.fallback && scope.querySelector(current.fallback))
          || null;
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

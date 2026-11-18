// Editable browser entry. Build with node scripts/build-client.mjs.
window.__ModuleLoader__.load({
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
      subtitle: ['音色试听、人设配音、麦克风速记与发音词典工作台。', 'Audition voices, design personas, transcribe mic memos, and tune pronunciations.'],
      tabVoices: ['音色与人设', 'Voices & Personas'],
      tabStudio: ['快速试配与播客指令', 'Studio & Prompts'],
      tabMic: ['麦克风速记与角色', 'Mic & Custom Voices'],
      tabLexicon: ['发音词典与自检', 'Lexicon & Health'],
      refresh: ['刷新状态', 'Refresh'],
      loading: ['正在读取语音工作台…', 'Loading Voice Studio…'],
      retry: ['重新读取', 'Retry'],
      loadError: ['无法连接 Voice Studio。请确认 DSH 仍在运行，然后重试。', 'Cannot load Voice Studio. Check that DSH is running, then retry.'],
      session: ['DSH 会话已失效，请重新打开 DSH 页面。', 'The DSH session has expired. Reopen the DSH page.'],
      readonly: ['当前配置为只读。你可以试听音色、转写录音并复制对话指令；修改默认设置需可写权限。', 'Settings are read-only. You can still audition voices, transcribe audio, and copy prompts.'],
      guideSummary: ['使用指南与快捷 AI 配音指令（点击展开）', 'Workflow guide & quick AI voice prompts'],
      guideStep1: ['1. 选音色/人设：在「音色与人设」搜索或联网加载 300+ Edge 音色，点击 ▶ 试听并可一键设为默认。', '1. Pick a voice/persona: Search or load 300+ Edge voices online, click ▶ to audition, or set as default.'],
      guideStep2: ['2. 试配与生成指令：在「快速试配」调节语速/音调/情绪并查看精确秒数，或一键复制双人播客 + BGM 自动压低 / .srt 视频配音指令发到对话。', '2. Studio & prompts: Test rate/pitch/instructions with exact duration, or copy dual-host podcast / .srt dubbing prompts into chat.'],
      guideStep3: ['3. 速记与词典：用浏览器麦克风录音速记转写，或维护专有名词发音词典（如 Nginx → Engine X）。', '3. Mic & lexicon: Record voice memos to transcribe or manage pronunciation overrides (e.g. Nginx → Engine X).'],
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

      // Audio preview bar state
      const [previewAudio, setPreviewAudio] = useState(null);
      const [playbackRate, setPlaybackRate] = useState('1.0');
      const audioRef = useRef(null);

      // Tab 1: Voices & Personas
      const [voiceQuery, setVoiceQuery] = useState('');
      const [genderFilter, setGenderFilter] = useState('*');
      const [tagFilter, setTagFilter] = useState('*');
      const [onlineMode, setOnlineMode] = useState(false);
      const [voicesList, setVoicesList] = useState(null);
      const [voiceSource, setVoiceSource] = useState('builtin');

      // Tab 2: Studio & Prompt Builders
      const [studioText, setStudioText] = useState('你好，欢迎来到 DSH 语音工作室！Hello, this is a live audition.');
      const [studioVoice, setStudioVoice] = useState('');
      const [studioRate, setStudioRate] = useState('+0%');
      const [studioPitch, setStudioPitch] = useState('+0Hz');
      const [studioInstructions, setStudioInstructions] = useState('');
      const [hostA, setHostA] = useState('podcast-host-female');
      const [hostB, setHostB] = useState('podcast-host-male');
      const [podcastTopic, setPodcastTopic] = useState('本周 AI 开发工具与音频工作流进展');
      const [bgmFile, setBgmFile] = useState('bgm.mp3');
      const [bgmVolume, setBgmVolume] = useState('0.18');
      const [podcastLoudness, setPodcastLoudness] = useState(true);
      const [srtFile, setSrtFile] = useState('video.srt');
      const [dubVoice, setDubVoice] = useState('zh-CN-YunzeNeural');
      const [dubOut, setDubOut] = useState('dubbing.mp3');

      // Tab 3: Mic & Custom Voices
      const [recording, setRecording] = useState(false);
      const [recordSec, setRecordSec] = useState(0);
      const [micLang, setMicLang] = useState('');
      const [micPrompt, setMicPrompt] = useState('');
      const [transcript, setTranscript] = useState(null);
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

      // Tab 4: Lexicon & Health
      const [lexWord, setLexWord] = useState('');
      const [lexAlias, setLexAlias] = useState('');

      const baseId = typeof useId === 'function' ? useId() : 'dsh-voice';
      const tabsId = baseId + '-tabs';
      const controller = useRef(null);

      const hasDirtyDraft = Boolean(customDraft.name.trim() || lexWord.trim() || lexAlias.trim());
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

      async function run(action, args = {}, onSuccess, busyKey) {
        if (controller.current) return;
        const abort = new AbortController();
        controller.current = abort;
        setBusy(busyKey || action || 'load');
        setError('');
        if (action !== 'preview') setNotice('');
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

      function triggerPreview(opts, label) {
        const key = 'preview:' + (label || opts.persona || opts.voice || 'studio');
        return run('preview', opts, value => {
          const p = value?.preview;
          if (p?.audioBase64) {
            const url = 'data:' + (p.mime || 'audio/mpeg') + ';base64,' + p.audioBase64;
            setPreviewAudio({
              dataUrl: url,
              voice: p.voice,
              durationMs: p.durationMs,
              durationSec: p.durationSec,
              bytes: p.bytes,
            });
            setNotice(`${t('previewReady')}: ${p.voice} (${p.durationSec}s)`);
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.playbackRate = Number(playbackRate) || 1;
                void audioRef.current.play().catch(() => {});
              }
            }, 30);
          }
        }, key);
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

      async function startRecording() {
        setError('');
        setNotice('');
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
          recorder.ondataavailable = ev => {
            if (ev.data && ev.data.size > 0) recordChunksRef.current.push(ev.data);
          };
          recorder.start();
          setRecording(true);
          setRecordSec(0);
          recordTimerRef.current = setInterval(() => setRecordSec(s => s + 1), 1000);
        } catch (err) {
          setError(vText('无法打开麦克风：', 'Cannot access microphone: ') + (err?.message || String(err)));
        }
      }

      function stopAndTranscribe(cancelOnly = false) {
        const recorder = mediaRecorderRef.current;
        const stream = mediaStreamRef.current;
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setRecording(false);
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
          selector: '#' + tabsId + '-tab-voices',
          side: 'bottom',
          title: vText('音色库与开箱人设', 'Voices & Personas'),
          desc: vText(
            '浏览 45+ 全年龄与方言音色及 10 套人设，点击 ▶ 即时在线试听，可联网拉取 300+ Edge 音色并一键设为默认。',
            'Browse 45+ built-in voices & 10 personas, click ▶ for instant audio preview, fetch 300+ online voices, or set default.',
          ),
        },
        {
          id: 'studio',
          selector: '#' + tabsId + '-tab-studio',
          side: 'bottom',
          title: vText('快速试配与播客 / 视频配音', 'Studio & Prompt Builders'),
          desc: vText(
            '自由调节语速、音调与情绪指令试听并查看精确秒数；还可一键复制双人播客 + BGM 自动压低或 .srt 视频卡点配音指令。',
            'Test rate, pitch, and instructions with exact duration, or copy dual-host podcast + BGM ducking and .srt dubbing prompts.',
          ),
          prompt: podcastPromptText,
          promptLabel: vText('复制：双人播客配音指令', 'Copy: Dual-host podcast prompt'),
        },
        {
          id: 'mic',
          selector: '#' + tabsId + '-tab-mic',
          side: 'bottom',
          title: vText('麦克风速记与自定义角色', 'Mic Memo & Custom Voices'),
          desc: vText(
            '直接用浏览器麦克风录音并一键转写文字，还可管理可复用的自定义音色别名与参考音频。',
            'Record voice memos right in your browser for instant transcription, and manage reusable custom voice aliases.',
          ),
        },
        {
          id: 'lexicon',
          selector: '#' + tabsId + '-tab-lexicon',
          side: 'bottom',
          title: vText('发音词典与健康自检', 'Pronunciation Lexicon & Health'),
          desc: vText(
            '配置专有名词替读规则（如 Nginx → Engine X），并实时查看 TTS / ASR / FFmpeg 就绪状态。',
            'Manage pronunciation overrides (e.g. Nginx → Engine X) and inspect live TTS / ASR / FFmpeg readiness.',
          ),
        },
      ];

      function renderVoicePlayerBar() {
        if (!previewAudio) return null;
        return h('div', { className: 'voice-player-bar', 'data-dsh-card': '' },
          h('div', { className: 'voice-player-meta' },
            h('strong', null, previewAudio.voice),
            h('span', { className: 'dsh-wb-tag', 'data-tone': 'success' }, `${previewAudio.durationSec}s · ${Math.round(previewAudio.bytes / 1024)} KB`),
          ),
          h('div', { className: 'voice-player-controls' },
            h('audio', {
              ref: audioRef,
              controls: true,
              src: previewAudio.dataUrl,
              className: 'voice-audio-el',
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
          ),
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
          ...personas.map(p => ({ id: p.id, label: `${p.label} (${p.id})` })),
          ...allVoices.slice(0, 45).map(v => ({ id: v.id, label: `${v.id} · ${v.locale}` })),
        ];
        const selectedTarget = studioVoice || state?.ttsVoice || 'zh-CN-XiaoxiaoNeural';

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
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('实时参数试配台', 'Live Audition Playground')),
              h('span', { className: 'dsh-wb-count' }, `${studioText.length} / 300`),
            ),
            h('textarea', {
              className: 'dsh-wb-textarea',
              maxLength: 300,
              value: studioText,
              disabled: !!busy,
              placeholder: vText('输入最多 300 字试听台词…', 'Enter up to 300 chars to audition…'),
              onChange: e => setStudioText(e.target.value),
            }),
            h('div', { className: 'voice-form-grid' },
              h('label', { className: 'voice-field' },
                h('span', null, vText('音色 / 人设 / 别名', 'Voice / Persona / Alias')),
                h(W.ChoiceMenu, {
                  label: vText('选择音色或人设', 'Choose voice or persona'),
                  value: selectedTarget,
                  items: voiceOptions.some(o => o.id === selectedTarget)
                    ? voiceOptions
                    : [{ id: selectedTarget, label: selectedTarget }, ...voiceOptions],
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
              }, busy === 'preview:studio' ? t('auditioning') : vText('▶ 立即试听并测算时长', '▶ Audition & Measure Duration')),
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
          h('div', { className: 'voice-builders-grid' },
            h('section', { className: 'voice-panel-card', 'data-dsh-card': '' },
              h('h3', { 'data-dsh-editorial-heading': '' }, vText('双人播客 + BGM 自动压低生成器', 'Dual-Host Podcast + BGM Auto-Ducking')),
              h('div', { className: 'voice-form-grid' },
                h('label', { className: 'voice-field' },
                  h('span', null, vText('主持人 A', 'Host A')),
                  h(W.ChoiceMenu, {
                    label: 'Host A',
                    value: hostA,
                    items: personas.map(p => ({ id: p.id, label: `${p.label} (${p.id})` })),
                    onChange: setHostA,
                  }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('主持人 B', 'Host B')),
                  h(W.ChoiceMenu, {
                    label: 'Host B',
                    value: hostB,
                    items: personas.map(p => ({ id: p.id, label: `${p.label} (${p.id})` })),
                    onChange: setHostB,
                  }),
                ),
                h('label', { className: 'voice-field voice-field-span2' },
                  h('span', null, vText('播客主题或文稿路径', 'Topic or script path')),
                  h(W.Input, { value: podcastTopic, onChange: e => setPodcastTopic(e.target.value) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('背景音乐 (bgmFile)', 'BGM File (optional)')),
                  h(W.Input, { value: bgmFile, placeholder: 'bgm.mp3', onChange: e => setBgmFile(e.target.value) }),
                ),
                h('label', { className: 'voice-field' },
                  h('span', null, vText('背景音量 (0.02-1.0)', 'BGM Volume')),
                  h(W.Input, { value: bgmVolume, placeholder: '0.18', onChange: e => setBgmVolume(e.target.value) }),
                ),
              ),
              h(W.Checkbox, {
                label: vText('开启 -16 LUFS 播客响度均衡 (normalizeLoudness)', 'Enable -16 LUFS loudness normalization'),
                checked: podcastLoudness,
                onChange: setPodcastLoudness,
              }),
              h('pre', { className: 'voice-prompt-preview' }, podcastPromptText),
              h(W.CopyPrompt, {
                variant: 'primary',
                prompt: podcastPromptText,
                label: vText('一键复制播客配音指令', 'Copy Podcast Prompt'),
                copiedLabel: t('copied'),
                statusText: t('copyStatus'),
                failedText: t('copyFailed'),
              }),
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
                  h(W.Input, { value: dubVoice, placeholder: 'zh-CN-YunzeNeural', onChange: e => setDubVoice(e.target.value) }),
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
          ),
        );
      }

      function renderMicTab() {
        return h('div', { className: 'voice-section-stack' },
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
              !recording
                ? h(W.Button, {
                    variant: 'primary',
                    icon: 'play',
                    disabled: !!busy || !state?.sttReady,
                    onClick: () => { void startRecording(); },
                  }, busy === 'transcribeMic' ? vText('正在转写…', 'Transcribing…') : vText('开始麦克风录音', 'Start Mic Recording'))
                : h(React.Fragment, null,
                    h(W.Button, {
                      variant: 'primary',
                      icon: 'check',
                      onClick: () => stopAndTranscribe(false),
                    }, vText(`停止并转写 (${formatTimer(recordSec)})`, `Stop & Transcribe (${formatTimer(recordSec)})`)),
                    h(W.Button, {
                      icon: 'close',
                      onClick: () => stopAndTranscribe(true),
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
                      h('span', { className: 'voice-mono' }, [cv.voice, cv.persona, cv.rate, cv.pitch, cv.referenceAudio ? 'ref:' + cv.referenceAudio : ''].filter(Boolean).join(' · ') || 'default'),
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
              : h('p', { className: 'voice-muted' }, vText('暂无自定义音色别名，可在下方添加常用角色。', 'No custom voice aliases yet. Add one below.')),
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
                  h(W.Input, { value: customDraft.voice, placeholder: 'zh-CN-YunzeNeural', disabled: !writable || !!busy, onChange: e => setCustomDraft({ ...customDraft, voice: e.target.value }) }),
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
                h('span', { className: 'voice-muted' }, vText('响度均衡、BGM 混音与声道分离', 'Loudnorm, BGM ducking & stereo split')),
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
              'Edge TTS 自动生成 SSML <sub alias>（同步字幕保留原词 Nginx，语音读作 Engine X）；OpenAI/SiliconFlow 自动替读。',
              'Edge TTS emits SSML <sub alias> so subtitles keep original spelling while speech uses the alias; OpenAI/SiliconFlow replace inline.',
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

      return h(W.Page, {
        workbench,
        icon: 'play',
        lang: language,
        title: t('title'),
        subtitle: t('subtitle'),
        className: 'dshv voice-workbench',
        tourSteps: voiceTourSteps,
        tourStorageKey: 'dsh-voice.tour.v1',
        onTourCopyPrompt: async text => {
          const ok = await W.writeClipboardText(text);
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
                prompt: vText('请把当前工作区的会议录音转为文字，开启说话人区分并导出 .srt 字幕', 'Transcribe the meeting audio with speaker diarization and export .srt subtitles'),
                label: vText('复制：会议录音转字幕', 'Copy: Diarized transcription'),
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
          : renderLexiconTab(),
        ),
      );
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
});

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
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 14px;
  margin: 10px 18px 0;
  padding: 10px 14px;
  border-radius: var(--w-radius-md);
  border: var(--dsh-control-border-width, 0.5px) solid var(--w-border);
  background: var(--w-bg-1);
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
}

.voice-workbench .voice-audio-el {
  flex: 1;
  min-width: 180px;
  height: 34px;
}

.voice-workbench .voice-speed-select {
  width: 84px;
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

.voice-workbench .voice-builders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 14px;
}

.voice-workbench .voice-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.voice-workbench .voice-field {
  display: grid;
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
  .voice-workbench .voice-section-stack {
    padding: 12px 12px 24px;
  }
}
`;

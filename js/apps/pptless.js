/* PowerPointless 2003（Offense 2003 三件套里做幻灯片的；开始 ▸ 所有程序 ▸ Offense 2003 ▸ PowerPointless 2003）
   照那几年的样子：左边一列幻灯片小图、中间一张幻灯片、下面"单击此处添加备注"、右边任务窗格（幻灯片版式 ／ 幻灯片设计 ／ 自定义动画）
   - 做幻灯片不用打字：点"单击此处添加标题 ／ 文本"弹几句挑；也能自己输入；东西能拖来拖去
   - 插入：新幻灯片、幻灯片副本、文本框、艺术字（跟 Wordy 同一套）、剪贴画（游戏里的羊、铁公鸡、葱油饼……）、自选图形
   - 设计模板 6 个（CSS 画的）；自定义动画：飞入 ／ 百叶窗 ／ 螺旋 ／ 打字机，配声音：打字机 ／ 鼓掌 ／ 爆炸 ／ 风铃
   - 幻灯片放映（F5）：盖满整个屏幕，点一下飞进来一样；放完黑屏"放映结束，单击鼠标退出。"
   - 能存 .ppt 进我的文档（算 200 个文件）；我的文档里有现成的"班会：如何防止沉迷网络.ppt"
   - 小算盘（offense.js）：看起来你在做幻灯片，要不要给每样东西都加上动画
   - 蓝屏：一页上放超过 20 样东西，或者页数到了 99 页再加一页 → SLIDE_OVERLOAD */
(function () {
  'use strict';
  const el = OS.el;
  const FS = OS.fs;
  const app = OS.apps.byId.ppt;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = 'PowerPointless 2003';
  const UNTITLED = '演示文稿1';
  const L = {
    menus: ['文件(F)', '编辑(E)', '视图(V)', '插入(I)', '格式(O)', '工具(T)', '幻灯片放映(D)', '窗口(W)', '帮助(H)'],
    tools: ['新建', '打开', '保存', '新幻灯片', '文本框', '艺术字', '剪贴画', '自选图形', '放映'],
    status: (i, n, d) => '幻灯片 ' + i + ' / ' + n + '　　' + d + '　　中文(中国)',
    open: '文件都在我的文档里，\n去那儿双击。',
    undo: '幻灯片做错了不能撤销，\n只能讲的时候说"这页不算"。',
    cd: '刻录失败：你的光驱只会读，不会写。',
    master: '母版是什么？\n做了这么多年幻灯片也没人知道。',
    browse: '幻灯片浏览：左边那一列就是。',
    notesPage: '备注页：就是下面那一条。',
    spellText: '没有拼写错误。\n有的是逻辑错误。',
    optText: '没有"自动讲完"这个选项。',
    hide: '藏起来也得讲。',
    music: '插入失败：这首歌太长，\n放完都下课了。',
    newWin: '一节班会一个窗口，\n够用了。',
    help: 'PowerPointless 帮助', about: '关于 PowerPointless 2003',
    aboutText: 'PowerPointless 2003\n版本 2003\n讲了半天，\n也没讲出什么。\n(C) ' + OS.YEAR + ' 无聊科技',
    palShow: '显示小算盘', palHide: '隐藏小算盘',
    // 占位框
    ph: { title: '单击此处添加标题', sub: '单击此处添加副标题', body: '单击此处添加文本' },
    notesPh: '单击此处添加备注',
    // 任务窗格
    panes: ['幻灯片版式', '幻灯片设计', '自定义动画'],
    layouts: [['title', '标题幻灯片'], ['body', '标题和文本'], ['blank', '空白']],
    pickFirst: '请先在幻灯片上\n选中一样东西。',
    addFx: '添加效果', sound: '声音', play: '幻灯片放映',
    fx: [['', '无'], ['fly', '飞入'], ['blinds', '百叶窗'], ['spiral', '螺旋'], ['type', '打字机']],
    snd: [['', '无声音'], ['typewriter', '打字机'], ['clap', '鼓掌'], ['burst', '爆炸'], ['chime', '风铃']],
    // 东西的名字（自定义动画列表里）
    kinds: { title: '标题', sub: '副标题', body: '文本', text: '文本框', wordart: '艺术字', clip: '剪贴画', shape: '自选图形' },
    // 右键
    change: '更换文字…', toTop: '置于顶层', del: '删除', anim: '自定义动画…',
    newSlide: '新幻灯片', dupSlide: '幻灯片副本', delSlide: '删除幻灯片',
    // 挑字
    self: '自己输入…', ask: '文字：', clipTitle: '剪贴画', shapeTitle: '自选图形', waTitle: '艺术字库', waText: '编辑"艺术字"文字',
    // 保存
    save: '保存', saveAs: '另存为', fileName: '文件名：', saved: '已保存',
    askSave: n => '是否保存对"' + n + '"的更改？', yes: '是', no: '否', cancel: '取消',
    // 放映
    end: '放映结束，单击鼠标退出。'
  };
  // 点占位框挑的字
  const TITLES = ['我的理想', '自我介绍', '寒假计划', '年终总结', '班会：如何防止沉迷网络', '我的同桌', '谢谢观看'];
  const SUBS = ['主讲人：你', '以上内容纯属虚构', '请大家多多指教', '下面我简单说两句', OS.YEAR + ' 年'];
  const BODIES = [
    ['自我介绍', ['姓名：你', '爱好：上网', '特长：拨号', '座右铭：明天再说']],
    ['寒假计划', ['第一天：写作业', '第二天到第三十天：上网', '最后一天：补作业']],
    ['年终总结', ['今年：没干什么', '明年：争取干点什么']],
    ['我的理想', ['小时候：当科学家', '现在：当上网管不着的人', '将来：再说']]
  ];
  const LINES = ['重点！', '这里要考', '以上', '请看大屏幕', '下一页更精彩', '鼓掌！'];
  const NOTES = ['讲的时候别看稿。稿在这儿。', '这一页讲慢点，凑时间。', '讲到这里，下面应该有掌声。', '这页要是忘词了，就放下一页。'];
  // 剪贴画：游戏里现成的东西
  const CLIPS = [['sheep', '羊'], ['koukou', '铁公鸡'], ['pie', '葱油饼'], ['globe', '地球'], ['computer', '电脑'], ['pal', '小算盘'], ['music', '耳机'], ['logo', "Windoesn't"]];
  // 自选图形
  const SHAPES = [['star', '五角星'], ['burst', '爆炸形'], ['smile', '笑脸'], ['arrow', '右箭头'], ['callout', '对话框']];
  // 设计模板（CSS 画的，见 os.css 的 .pl-d-*）
  const DESIGNS = [['plain', '默认设计模板'], ['sky', '蓝天白云'], ['gold', '金光闪闪'], ['board', '黑板报'], ['pink', '粉红回忆'], ['tech', '科技蓝']];
  // 小算盘
  const PAL = {
    back: '我又回来了。', wake: '我没睡！\n我在帮你想动画。',
    tips: ['小提示：动画越多，\n显得越用心。', '小提示：每页换一种字体，\n大家才不会睡着。', '小提示：讲不下去的时候，\n就放下一页。', '小提示：按 F5 开始放映。'],
    hello: '看起来你在做幻灯片。\n要我给每样东西都加上动画吗？', yes: '全都加上', no: '不用了',
    did: '加好了。\n放映的时候记得捂耳朵。', noHelp: '好的。\n我会一直看着你的。',
    crowd: { 15: '这一页已经挤不下了。', 19: '不奔腾的风扇越转越响了。' },
    pages: { 50: '这么多页，\n讲到放学也讲不完。', 90: '不奔腾已经开始发烫了。' }
  };
  const BSOD = { id: 'ppt', name: 'SLIDE_OVERLOAD', text: '你的不奔腾开始抗议了。' };
  const MAX_ITEMS = 20, MAX_SLIDES = 99;

  /* ================= 一张幻灯片：虚拟 400 × 300，画的时候整体缩放 ================= */
  const VW = 400, VH = 300;
  let seq = 0;
  const nid = () => 'i' + Date.now().toString(36) + (seq++);
  // 版式自带的占位框
  function layoutItems(layout) {
    if (layout === 'title') return [
      { id: nid(), kind: 'title', x: 30, y: 92, w: 340, text: '' },
      { id: nid(), kind: 'sub', x: 60, y: 172, w: 280, text: '' }
    ];
    if (layout === 'body') return [
      { id: nid(), kind: 'title', x: 24, y: 16, w: 352, text: '', size: 26 },
      { id: nid(), kind: 'body', x: 36, y: 74, w: 330, lines: [] }
    ];
    return [];
  }
  const newSlide = layout => ({ layout, items: layoutItems(layout), note: '' });
  const isEmpty = it => (it.kind === 'body' ? !(it.lines && it.lines.length) : (it.kind === 'title' || it.kind === 'sub' || it.kind === 'text') ? !it.text : false);
  const designName = d => (DESIGNS.find(x => x[0] === d) || DESIGNS[0])[1];

  const SHAPE_SVG = {
    star: '<svg viewBox="0 0 100 100"><defs><linearGradient id="plg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff38a"/><stop offset="1" stop-color="#f29b0c"/></linearGradient></defs><polygon points="50,4 62,38 98,38 69,59 80,94 50,73 20,94 31,59 2,38 38,38" fill="url(#plg1)" stroke="#b35c00" stroke-width="3"/></svg>',
    burst: '<svg viewBox="0 0 100 100"><polygon points="50,2 58,28 80,10 72,36 98,34 76,52 96,70 68,66 72,96 52,74 36,98 34,70 8,82 24,58 2,44 28,38 14,14 40,26" fill="#ffde3a" stroke="#e0251a" stroke-width="4"/></svg>',
    smile: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ffd93a" stroke="#c98a00" stroke-width="4"/><circle cx="35" cy="40" r="6" fill="#3a2a00"/><circle cx="65" cy="40" r="6" fill="#3a2a00"/><path d="M28 60 Q50 82 72 60" fill="none" stroke="#3a2a00" stroke-width="5" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 100 100"><defs><linearGradient id="plg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc1ff"/><stop offset="1" stop-color="#1f5fd0"/></linearGradient></defs><polygon points="4,32 58,32 58,10 96,50 58,90 58,68 4,68" fill="url(#plg2)" stroke="#0d3a8c" stroke-width="3"/></svg>',
    callout: '<svg viewBox="0 0 100 100"><path d="M10 8 H90 Q96 8 96 14 V62 Q96 68 90 68 H44 L22 92 L28 68 H10 Q4 68 4 62 V14 Q4 8 10 8 Z" fill="#fff" stroke="#3c6ad8" stroke-width="4"/></svg>'
  };
  function clipEl(k) {
    if (k === 'sheep') return el('div', { class: 'pl-sheepw' }, [el('span', { class: 'wp-sheep', html: OS.desktop.sheepHtml })]);
    if (k === 'pie') return el('img', { class: 'pl-img', src: 'assets/office/pie.webp', alt: '' });
    if (k === 'pal') return el('div', { class: 'pl-pal' });
    return OS.iconEl(k, 'pl-img');
  }
  // 画一样东西（编辑、小图、放映共用）；edit = 编辑时空的占位框也画出来
  function itemEl(it, edit) {
    const d = el('div', { class: 'pl-it pl-k-' + it.kind });
    d.dataset.id = it.id;
    d.style.left = it.x + 'px';
    d.style.top = it.y + 'px';
    if (it.w) d.style.width = it.w + 'px';
    if (it.kind === 'title' || it.kind === 'sub' || it.kind === 'text') {
      if (!it.text) { if (!edit) return null; d.classList.add('pl-ph'); d.textContent = L.ph[it.kind === 'text' ? 'body' : it.kind]; }
      else d.textContent = it.text;
      if (it.size) d.style.fontSize = it.size + 'px';
    } else if (it.kind === 'body') {
      if (!it.lines || !it.lines.length) { if (!edit) return null; d.classList.add('pl-ph'); d.textContent = L.ph.body; }
      else it.lines.forEach(t => d.appendChild(el('div', { class: 'pl-li' }, [el('span', { class: 'pl-bul', text: '•' }), el('span', { text: t })])));
    } else if (it.kind === 'wordart') {
      d.appendChild(OS.wordart ? OS.wordart.el({ style: it.style, text: it.text, scale: it.scale || 1.4 }) : el('span', { text: it.text }));
    } else if (it.kind === 'clip') {
      d.classList.add('pl-box');
      d.appendChild(clipEl(it.clip));
    } else if (it.kind === 'shape') {
      d.classList.add('pl-box');
      d.innerHTML = SHAPE_SVG[it.shape] || '';
    }
    return d;
  }
  function slideEl(deck, slide, scale, edit) {
    const inner = el('div', { class: 'pl-slide pl-d-' + (deck.design || 'plain'), style: { width: VW + 'px', height: VH + 'px', transform: 'scale(' + scale + ')' } });
    slide.items.forEach(it => { const n = itemEl(it, edit); if (n) inner.appendChild(n); });
    return el('div', { class: 'pl-slidew', style: { width: VW * scale + 'px', height: VH * scale + 'px' } }, [inner]);
  }

  /* ================= 窗口 ================= */
  function open(f) {
    f = f || {};
    let name = f.name || UNTITLED, path = f.user ? f.path : null, dirty = false;
    let deck = f.deck ? JSON.parse(JSON.stringify(f.deck)) : { design: 'plain', slides: [newSlide('title')] };
    if (!deck.slides || !deck.slides.length) deck.slides = [newSlide('title')];
    let cur = 0, selId = null, pane = 0, busy = false, greeted = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => { if (!win.isClosed) fn(); }, ms));
    const slide = () => deck.slides[cur];
    const selItem = () => slide().items.find(i => i.id === selId) || null;
    const touched = () => { dirty = true; };
    const ES = 0.62;   // 编辑区缩放：400 × 300 → 248 × 186

    const bar = OS.ui.menuBar(L.menus, menuFor, 'np-mbar');
    const tb = (text, fn) => { const b = el('button', { class: 'wp-tb', text }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(b); }); return b; };
    const sep = () => el('span', { class: 'wp-sep' });
    const T = L.tools;
    const tools = el('div', { class: 'wp-bar' }, [
      tb(T[0], fileNew), tb(T[1], say(NAME, 'info', L.open)), tb(T[2], () => save(false)), sep(),
      tb(T[3], () => addSlide(false)), sep(), tb(T[4], insertText), tb(T[5], insertWordArt), tb(T[6], insertClip), tb(T[7], b => insertShape(b)), sep(),
      tb(T[8], () => slideShow(cur))
    ]);
    const thumbs = el('div', { class: 'pl-thumbs' });
    const stageBox = el('div', { class: 'pl-edit' });
    const notes = el('div', { class: 'pl-notes' });
    const center = el('div', { class: 'pl-center' }, [stageBox, notes]);
    const paneHead = el('div', { class: 'pl-panehead' });
    const paneBody = el('div', { class: 'pl-panebody' });
    const paneEl = el('div', { class: 'pl-pane' }, [paneHead, paneBody]);
    const status = el('div', { class: 'wp-status pl-status' });
    const box = el('div', { class: 'wp wy pl' }, [bar, tools, el('div', { class: 'pl-main' }, [thumbs, center, paneEl]), status]);
    OS.ui.scrollable(thumbs);
    OS.ui.scrollable(paneBody);
    const title = () => NAME + ' - [' + name + ']';
    const win = OS.wm.open({
      title: title(), icon: 'ppt', width: 476, height: 300, content: box, appId: app.id, center: true,
      beforeClose: () => {
        if (busy) return false;
        if (!dirty) return true;
        OS.ui.dialog({ title: NAME, icon: 'warn', text: L.askSave(name), buttons: [L.yes, L.no, L.cancel] }).then(v => {
          if (v === L.no) { dirty = false; win.close(); } else if (v === L.yes) save(false).then(ok => { if (ok) win.close(); });
        });
        return false;
      }
    });
    win.filePath = () => path;   // 磁盘清理（cleanup.js）删了这个文件：窗口直接关掉
    const pal = OS.offense.pal(center, later, () => win.isClosed, PAL);
    win.closed.then(() => { timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey, true); });

    /* ---------- 画 ---------- */
    function render() {
      // 左边小图
      thumbs.textContent = '';
      deck.slides.forEach((s, i) => {
        const t = el('div', { class: 'pl-thumb' + (i === cur ? ' on' : '') }, [el('span', { class: 'pl-tn', text: String(i + 1) }), slideEl(deck, s, 0.13, false)]);
        t.addEventListener('click', () => { if (cur !== i) { OS.sound.play('click'); cur = i; selId = null; render(); } });
        OS.ui.onContext(t, () => { cur = i; selId = null; render(); return slideMenu(); });
        thumbs.appendChild(t);
      });
      // 中间那张
      stageBox.textContent = '';
      const sw = slideEl(deck, slide(), ES, true);
      stageBox.appendChild(sw);
      sw.querySelectorAll('.pl-it').forEach(n => bindItem(n));
      if (selId) { const n = sw.querySelector('.pl-it[data-id="' + selId + '"]'); if (n) n.classList.add('sel'); }
      // 备注
      notes.textContent = slide().note || L.notesPh;
      notes.classList.toggle('empty', !slide().note);
      drawPane();
      status.textContent = L.status(cur + 1, deck.slides.length, designName(deck.design));
      const on = thumbs.children[cur];
      if (on) { const top = on.offsetTop - thumbs.offsetTop, h = thumbs.clientHeight; if (top < thumbs.scrollTop || top + on.offsetHeight > thumbs.scrollTop + h) thumbs.scrollTop = top - 4; }
    }
    // 点空白：不选；点东西：选中；再点文字：换字；拖：挪地方
    stageBox.addEventListener('click', e => { if (!e.target.closest('.pl-it') && selId) { selId = null; render(); } });
    function bindItem(n) {
      const it = slide().items.find(i => i.id === n.dataset.id);
      if (!it) return;
      n.addEventListener('pointerdown', e => {
        if (e.button != null && e.button !== 0) return;
        e.stopPropagation();
        const was = selId === it.id;
        const s0 = OS.stage.toLocal(e.clientX, e.clientY), ox = it.x, oy = it.y;
        let moved = false;
        try { n.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        if (!was) { selId = it.id; stageBox.querySelectorAll('.pl-it.sel').forEach(x => x.classList.remove('sel')); n.classList.add('sel'); drawPane(); }
        const move = ev => {
          const q = OS.stage.toLocal(ev.clientX, ev.clientY), dx = (q.x - s0.x) / ES, dy = (q.y - s0.y) / ES;
          if (!moved && dx * dx + dy * dy < 16) return;
          moved = true;
          it.x = Math.round(OS.clamp(ox + dx, -20, VW - 20));
          it.y = Math.round(OS.clamp(oy + dy, -10, VH - 16));
          n.style.left = it.x + 'px'; n.style.top = it.y + 'px';
        };
        const up = () => {
          n.removeEventListener('pointermove', move); n.removeEventListener('pointerup', up); n.removeEventListener('pointercancel', up);
          if (moved) { touched(); render(); return; }
          if (isEmpty(it) || (was && (it.kind !== 'clip' && it.kind !== 'shape'))) pickFor(it);
        };
        n.addEventListener('pointermove', move); n.addEventListener('pointerup', up); n.addEventListener('pointercancel', up);
      });
      OS.ui.onContext(n, () => { selId = it.id; render(); return itemMenu(it); });
    }
    notes.addEventListener('click', () => {
      OS.sound.play('click');
      pickList(L.notesPh, NOTES.concat([L.self]), i => {
        if (i === NOTES.length) askLine(L.notesPh, slide().note, t => { slide().note = t; touched(); render(); });
        else { slide().note = NOTES[i]; touched(); render(); }
      });
    });

    /* ---------- 挑字 ---------- */
    function pickFor(it) {
      const done = () => { touched(); render(); greet(); };
      if (it.kind === 'body') {
        const opts = BODIES.map(b => b[0]).concat([L.self]);
        pickList(L.ph.body, opts, i => {
          if (i === BODIES.length) askLine(L.ph.body, '', t => { it.lines = (it.lines || []).concat(t); done(); });
          else { it.lines = BODIES[i][1].slice(); done(); }
        });
        return;
      }
      if (it.kind === 'wordart') { waText(t => { it.text = t; done(); }); return; }
      const list = it.kind === 'title' ? TITLES : it.kind === 'sub' ? SUBS : LINES;
      pickList(L.ph[it.kind === 'text' ? 'body' : it.kind], list.concat([L.self]), i => {
        if (i === list.length) askLine(L.ask, it.text, t => { it.text = t; done(); });
        else { it.text = list[i]; done(); }
      });
    }
    function pickList(t, items, cb) {
      const list = el('div', { class: 'wp-list' });
      const w = OS.wm.open({ title: t, icon: 'ppt', width: 220, content: el('div', { class: 'wp-pick' }, [list]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      items.forEach((s, i) => { const r = el('div', { class: 'wp-li', text: s }); r.addEventListener('click', () => { OS.sound.play('click'); w.close(); cb(i); }); list.appendChild(r); });
      OS.ui.scrollable(list);
    }
    const askLine = (t, v, cb) => OS.explorer.askText(t, L.ask, v || '', r => { if (r && r.trim()) cb(r.trim().slice(0, 24)); });

    /* ---------- 插入 ---------- */
    // 往这一页加一样东西：超过 20 样 → 蓝屏
    function addItem(it) {
      if (busy) return;
      const items = slide().items;
      if (items.length >= MAX_ITEMS) { overload(); return; }
      items.push(it);
      selId = it.id;
      touched();
      render();
      greet();
      if (PAL.crowd[items.length]) { pal.say(PAL.crowd[items.length]); if (items.length >= 19) OS.sound.play('fan'); }
    }
    const spot = () => ({ x: 120 + Math.round(Math.random() * 120), y: 90 + Math.round(Math.random() * 100) });
    function insertText() { const it = Object.assign({ id: nid(), kind: 'text', w: 160, text: '' }, spot()); pickList(L.tools[4], LINES.concat([L.self]), i => { if (i === LINES.length) askLine(L.ask, '', t => { it.text = t; addItem(it); }); else { it.text = LINES[i]; addItem(it); } }); }
    function insertWordArt() {
      if (!OS.wordart) return;
      const grid = el('div', { class: 'wy-gal' });
      const w = OS.wm.open({ title: L.waTitle, icon: 'ppt', width: 290, content: el('div', { class: 'wy-galw' }, [grid]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      OS.wordart.styles.forEach(([k, n]) => {
        const c = el('div', { class: 'wy-gcell', title: n }, [OS.wordart.el({ style: k, text: '艺术字', scale: 0.75 })]);
        c.addEventListener('click', () => { OS.sound.play('click'); w.close(); waText(t => addItem(Object.assign({ id: nid(), kind: 'wordart', style: k, text: t, scale: 1.4 }, { x: 70, y: 110 }))); });
        grid.appendChild(c);
      });
    }
    function waText(cb) { pickList(L.waText, TITLES.concat(LINES, [L.self]), i => { const all = TITLES.concat(LINES); if (i === all.length) askLine(L.waText, '', cb); else cb(all[i]); }); }
    function insertClip() {
      const grid = el('div', { class: 'pl-clips' });
      const w = OS.wm.open({ title: L.clipTitle, icon: 'ppt', width: 260, content: el('div', { class: 'wy-galw' }, [grid]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      CLIPS.forEach(([k, n]) => {
        const c = el('div', { class: 'pl-clipcell' }, [el('div', { class: 'pl-clipprev' }, [clipEl(k)]), el('div', { text: n })]);
        c.addEventListener('click', () => { OS.sound.play('click'); w.close(); addItem(Object.assign({ id: nid(), kind: 'clip', clip: k, w: 70 }, spot())); });
        grid.appendChild(c);
      });
    }
    function insertShape(btn) {
      const items = SHAPES.map(([k, n]) => ({ label: n, action: () => addItem(Object.assign({ id: nid(), kind: 'shape', shape: k, w: 70 }, spot())) }));
      if (btn) { const r = OS.stage.rectOf(btn); OS.ui.contextMenu(items, r.left, r.bottom); }
      return items;
    }
    // 加一页：到了 99 页再加 → 蓝屏
    function addSlide(copy) {
      if (busy) return;
      if (deck.slides.length >= MAX_SLIDES) { overload(); return; }
      const s = copy ? JSON.parse(JSON.stringify(slide())) : newSlide('body');
      if (copy) s.items.forEach(i => { i.id = nid(); });
      deck.slides.splice(cur + 1, 0, s);
      cur++;
      selId = null;
      touched();
      render();
      if (PAL.pages[deck.slides.length]) pal.say(PAL.pages[deck.slides.length]);
    }
    function delSlide() {
      if (deck.slides.length <= 1) { deck.slides = [newSlide('title')]; cur = 0; }
      else { deck.slides.splice(cur, 1); cur = Math.min(cur, deck.slides.length - 1); }
      selId = null; touched(); render();
    }
    function delItem(it) { slide().items = slide().items.filter(x => x !== it); selId = null; touched(); render(); }
    function overload() {
      if (busy) return;   // 只蓝一次
      busy = true;
      OS.sound.play('fan');
      later(() => OS.sound.play('fan'), 250);
      later(() => OS.ui.bsod(BSOD), 700);
    }

    /* ---------- 小算盘：头一回往幻灯片上放东西 ---------- */
    function greet() {
      if (greeted) return;
      greeted = pal.ask(PAL.hello, [PAL.yes, PAL.no], i => {
        if (i === 1) { pal.say(PAL.noHelp); return; }
        deck.slides.forEach(s => s.items.forEach(it => { if (!isEmpty(it)) it.anim = { fx: 'spiral', snd: 'burst' }; }));
        touched();
        render();
        pal.say(PAL.did);
      });
    }

    /* ---------- 右边任务窗格 ---------- */
    function drawPane() {
      paneHead.textContent = '';
      const h = el('div', { class: 'pl-pdrop', text: L.panes[pane] + ' ▾' });
      h.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); const r = OS.stage.rectOf(h); OS.ui.contextMenu(L.panes.map((p, i) => ({ label: p, checked: pane === i, action: () => { pane = i; drawPane(); } })), r.left, r.bottom); });
      paneHead.appendChild(h);
      paneBody.textContent = '';
      if (pane === 0) L.layouts.forEach(([k, n]) => {
        const c = el('div', { class: 'pl-lay' + (slide().layout === k ? ' on' : '') }, [el('div', { class: 'pl-laypic pl-lay-' + k }, [el('i'), el('b')]), el('div', { text: n })]);
        c.addEventListener('click', () => { OS.sound.play('click'); applyLayout(k); });
        paneBody.appendChild(c);
      });
      if (pane === 1) DESIGNS.forEach(([k, n]) => {
        const c = el('div', { class: 'pl-des' + (deck.design === k ? ' on' : '') }, [el('div', { class: 'pl-despic pl-d-' + k }, [el('span', { text: 'Aa' })]), el('div', { text: n })]);
        c.addEventListener('click', () => { OS.sound.play('click'); deck.design = k; touched(); render(); });
        paneBody.appendChild(c);
      });
      if (pane === 2) animPane();
    }
    function applyLayout(k) {
      const s = slide();
      const keep = s.items.filter(i => i.kind !== 'title' && i.kind !== 'sub' && i.kind !== 'body');
      const old = s.items.filter(i => i.kind === 'title' || i.kind === 'sub' || i.kind === 'body');
      const fresh = layoutItems(k);
      // 换版式：标题、文字尽量搬过去
      fresh.forEach(n => { const o = old.find(x => x.kind === n.kind); if (o) { n.text = o.text; n.lines = o.lines; n.anim = o.anim; } });
      s.layout = k;
      s.items = fresh.concat(keep);
      selId = null; touched(); render();
    }
    function animPane() {
      const it = selItem();
      const dd = (label, list, val, set) => {
        const b = el('div', { class: 'pl-pdrop pl-small', text: label + '：' + (list.find(x => x[0] === val) || list[0])[1] + ' ▾' });
        b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); const r = OS.stage.rectOf(b); OS.ui.contextMenu(list.map(([k, n]) => ({ label: n, checked: k === val, action: () => set(k) })), r.left, r.bottom); });
        return b;
      };
      if (!it || isEmpty(it)) paneBody.appendChild(el('div', { class: 'pl-hint', text: L.pickFirst }));
      else {
        const a = it.anim || { fx: '', snd: '' };
        const setA = (k, v) => { const n = Object.assign({ fx: '', snd: '' }, it.anim, { [k]: v }); it.anim = n.fx ? n : null; touched(); render(); if (k === 'snd' && v) OS.sound.play(v); };
        paneBody.append(dd(L.addFx, L.fx, a.fx, v => setA('fx', v)), dd(L.sound, L.snd, a.snd, v => setA('snd', v)));
      }
      // 这一页上加了动画的，按出场顺序
      const list = el('div', { class: 'pl-alist' });
      slide().items.filter(i => i.anim && !isEmpty(i)).forEach((i, k) => list.appendChild(el('div', { class: 'pl-ali' + (i.id === selId ? ' on' : '') }, [el('b', { text: String(k + 1) }), el('span', { text: L.kinds[i.kind] + '　' + (L.fx.find(x => x[0] === i.anim.fx) || ['', ''])[1] })])));
      paneBody.appendChild(list);
      const play = el('button', { class: 'xpbtn pl-play', text: '▶ ' + L.play });
      play.addEventListener('click', () => { OS.sound.play('click'); slideShow(cur); });
      paneBody.appendChild(play);
    }

    /* ---------- 菜单 ---------- */
    const itemMenu = it => [
      it.kind === 'clip' || it.kind === 'shape' ? null : { label: L.change, action: () => pickFor(it) },
      { label: L.anim, action: () => { pane = 2; drawPane(); } },
      { label: L.toTop, action: () => { const s = slide(); s.items = s.items.filter(x => x !== it).concat(it); touched(); render(); } },
      '-',
      { label: L.del, action: () => delItem(it) }
    ];
    const slideMenu = () => [{ label: L.newSlide, action: () => addSlide(false) }, { label: L.dupSlide, action: () => addSlide(true) }, '-', { label: L.delSlide, action: delSlide }];
    function menuFor(m) {
      if (busy) return null;
      const it = selItem();
      if (m === '文件(F)') return [
        { label: '新建', action: fileNew },
        { label: '打开…', action: say(NAME, 'info', L.open) },
        { label: '保存', action: () => save(false) },
        { label: '另存为…', action: () => save(true) },
        '-', { label: '打包成 CD…', action: say(NAME, 'error', L.cd) },
        { label: '打印…', action: () => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }) },
        '-', { label: '退出', action: () => OS.wm.requestClose(win) }
      ];
      if (m === '编辑(E)') return [
        { label: '撤销', action: say(NAME, 'warn', L.undo) }, '-',
        { label: L.dupSlide, action: () => addSlide(true) }, { label: L.delSlide, action: delSlide }, '-',
        { label: L.del, disabled: !it, action: () => it && delItem(it) }
      ];
      if (m === '视图(V)') return [
        { label: '普通', checked: true }, { label: '幻灯片浏览', action: say(NAME, 'info', L.browse) }, { label: '幻灯片放映　F5', action: () => slideShow(0) },
        { label: '备注页', action: say(NAME, 'info', L.notesPage) }, '-', { label: '母版', sub: [{ label: '幻灯片母版', action: say(NAME, 'info', L.master) }] }
      ];
      if (m === '插入(I)') return [
        { label: L.newSlide + '…', action: () => addSlide(false) }, { label: L.dupSlide, action: () => addSlide(true) }, '-',
        { label: L.tools[4], action: insertText },
        { label: '图片', sub: [{ label: L.clipTitle + '…', action: insertClip }, { label: '艺术字…', action: insertWordArt }] },
        { label: L.shapeTitle, sub: insertShape(null) },
        { label: '影片和声音', sub: [{ label: '千千不听里的歌…', action: say(NAME, 'info', L.music) }] }
      ];
      if (m === '格式(O)') return [
        { label: L.panes[1] + '…', action: () => { pane = 1; drawPane(); } },
        { label: L.panes[0] + '…', action: () => { pane = 0; drawPane(); } }
      ];
      if (m === '工具(T)') return [{ label: '拼写检查…', action: say(NAME, 'info', L.spellText) }, { label: '选项…', action: say(NAME, 'info', L.optText) }];
      if (m === '幻灯片放映(D)') return [
        { label: '观看放映　F5', action: () => slideShow(0) }, { label: L.anim, action: () => { pane = 2; drawPane(); } }, '-',
        { label: '隐藏幻灯片', action: say(NAME, 'info', L.hide) }
      ];
      if (m === '窗口(W)') return [{ label: '新建窗口', action: say(NAME, 'info', L.newWin) }];
      return [
        { label: L.help, action: () => pal.tip() },
        pal.hidden() ? { label: L.palShow, action: () => pal.comeBack() } : { label: L.palHide, action: () => pal.hide() },
        '-', { label: L.about, action: say(L.about, 'info', L.aboutText) }
      ];
    }
    function onKey(e) {
      if (win.isClosed || OS.wm.active !== win || busy) return;
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === 'F5') { e.preventDefault(); slideShow(0); }
      if (e.key === 'Delete' && selItem()) { e.preventDefault(); delItem(selItem()); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); addSlide(false); }
    }
    document.addEventListener('keydown', onKey, true);

    /* ---------- 新建、保存 ---------- */
    function fileNew() {
      const go = () => { deck = { design: 'plain', slides: [newSlide('title')] }; cur = 0; selId = null; name = UNTITLED; path = null; dirty = false; win.setTitle(title()); render(); };
      if (!dirty) { go(); return; }
      OS.ui.dialog({ title: NAME, icon: 'warn', text: L.askSave(name), buttons: [L.yes, L.no, L.cancel] }).then(v => { if (v === L.no) go(); else if (v === L.yes) save(false).then(ok => { if (ok) go(); }); });
    }
    function save(asNew) {
      return new Promise(res => {
        if (!asNew && path && FS.get(path)) { FS.setDeck(path, deck); dirty = false; res(true); return; }
        OS.explorer.askText(L.saveAs, L.fileName, name.replace(/\.ppt$/i, '') + '.ppt', v => {
          if (v == null || win.isClosed) { res(false); return; }
          let fname = v.trim().replace(/[\\/:*?"<>|]/g, '');
          if (!fname) { res(false); return; }
          if (!/\.ppt$/i.test(fname)) fname += '.ppt';
          const same = FS.get(FS.join(FS.MYDOCS, fname));
          let node;
          if (same && same.user) { FS.setDeck(same.path, deck); node = same; }
          else node = FS.createFile(FS.MYDOCS, fname, 'ppt', { deck: JSON.parse(JSON.stringify(deck)) });
          if (!node) { res(false); return; }
          path = node.path; name = node.name; dirty = false;
          win.setTitle(title());
          res(true);
        });
      });
    }

    /* ================= 幻灯片放映：盖满整个屏幕 ================= */
    function slideShow(from) {
      if (busy) return;
      busy = true;
      const W = OS.stage.W, H = OS.stage.H, sc = Math.min(W / VW, H / VH);
      const ov = el('div', { class: 'pl-show', style: { width: W + 'px', height: H + 'px' } });
      document.getElementById('overlay').appendChild(ov);
      let si = from, queue = [], ended = false;
      const close = () => { ov.remove(); busy = false; document.removeEventListener('keydown', esc, true); };
      const esc = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
      document.addEventListener('keydown', esc, true);
      function showSlide() {
        ov.textContent = '';
        const s = deck.slides[si];
        const w = slideEl(deck, s, sc, false);
        w.classList.add('pl-in');
        w.style.left = (W - VW * sc) / 2 + 'px';
        w.style.top = (H - VH * sc) / 2 + 'px';
        ov.appendChild(w);
        // 加了动画的先藏着，点一下出来一个
        queue = s.items.filter(i => i.anim && !isEmpty(i)).map(i => ({ it: i, n: w.querySelector('.pl-it[data-id="' + i.id + '"]') })).filter(q => q.n);
        queue.forEach(q => q.n.classList.add('pl-wait'));
      }
      function reveal(q) {
        const { it, n } = q;
        n.classList.remove('pl-wait');
        if (it.anim.snd) OS.sound.play(it.anim.snd);
        if (it.anim.fx === 'type' && (it.kind === 'title' || it.kind === 'sub' || it.kind === 'text')) {
          const full = it.text; let k = 0;
          n.textContent = '';
          const tick = () => { if (!n.isConnected || k >= full.length) return; n.textContent = full.slice(0, ++k); OS.sound.play('key'); setTimeout(tick, 70); };
          tick();
          return;
        }
        n.classList.add('pl-fx-' + (it.anim.fx === 'type' ? 'fade' : it.anim.fx));
      }
      function next() {
        if (ended) { close(); return; }
        if (queue.length) { reveal(queue.shift()); return; }
        if (si + 1 < deck.slides.length) { si++; showSlide(); return; }
        ended = true;
        ov.textContent = '';
        ov.appendChild(el('div', { class: 'pl-end', text: L.end }));
      }
      ov.addEventListener('click', e => { e.stopPropagation(); next(); });
      OS.ui.onContext(ov, () => { close(); return null; });
      showSlide();
    }

    render();
    return win;
  }

  /* ================= 我的文档里现成的：班会：如何防止沉迷网络.ppt ================= */
  const T_ = (kind, x, y, w, text, anim, size) => ({ id: nid(), kind, x, y, w, text, anim, size });
  const B_ = (lines, anim) => ({ id: nid(), kind: 'body', x: 36, y: 74, w: 330, lines, anim });
  const A_ = (fx, snd) => ({ fx, snd });
  const CLASS_NAME = '班会：如何防止沉迷网络.ppt';
  const CLASS_DECK = {
    design: 'sky',
    slides: [
      { layout: 'title', note: '讲的时候别看稿。稿在这儿。', items: [
        T_('title', 30, 92, 340, '班会：如何防止沉迷网络', A_('spiral', 'burst')),
        T_('sub', 60, 172, 280, '主讲人：班长', A_('type', 'typewriter')),
        { id: nid(), kind: 'clip', clip: 'globe', x: 300, y: 20, w: 70, anim: A_('fly', 'chime') }] },
      { layout: 'body', note: '这一页讲慢点，凑时间。', items: [
        T_('title', 24, 16, 352, '一、网络的危害', A_('fly', 'clap'), 26),
        B_(['浪费时间', '影响视力', '网速太慢，影响心情', '家里电话一直占线'], A_('blinds', 'chime')),
        { id: nid(), kind: 'clip', clip: 'computer', x: 300, y: 190, w: 70, anim: A_('spiral', 'burst') }] },
      { layout: 'body', note: '讲到这里，下面应该有掌声。', items: [
        T_('title', 24, 16, 352, '二、沉迷网络的表现', A_('spiral', 'burst'), 26),
        B_(['做梦都在拨号', '一听到"嘀——嘟——"就兴奋', '把作业本当成键盘', '管同桌叫"楼主"'], A_('fly', 'typewriter')),
        { id: nid(), kind: 'shape', shape: 'burst', x: 300, y: 180, w: 70, anim: A_('spiral', 'burst') }] },
      { layout: 'body', note: '这页要是忘词了，就放下一页。', items: [
        T_('title', 24, 16, 352, '三、怎么办', A_('fly', 'clap'), 26),
        B_(['把猫交给家长保管', '每天上网不超过 56 分钟', '多去楼下小卖部走走', '有事打电话，别发抠抠'], A_('blinds', 'chime')),
        { id: nid(), kind: 'clip', clip: 'sheep', x: 290, y: 196, w: 80, anim: A_('fly', 'burst') }] },
      { layout: 'title', note: '', items: [
        T_('title', 30, 92, 340, '谢谢观看', A_('spiral', 'clap')),
        T_('sub', 60, 172, 280, '下课以后请立刻关电脑', A_('type', 'typewriter')),
        { id: nid(), kind: 'shape', shape: 'smile', x: 165, y: 220, w: 70, anim: A_('spiral', 'clap') }] }
    ]
  };
  FS.add(FS.MYDOCS + '\\' + CLASS_NAME, { kind: 'ppt', deck: CLASS_DECK, noDelete: '删不掉：班长说明天还要用。', noRename: '重命名失败：班长会找不到的。' });

  /* ================= 打开法 ================= */
  app.open = () => open();
  OS.pptless = {
    // 双击 .ppt（我的文档里存过的 ／ 班会那个）
    open: nd => open({ name: nd.name, path: nd.path, user: !!nd.user, deck: nd.deck })
  };
})();

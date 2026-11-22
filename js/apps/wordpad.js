/* 写字板（开始 ▸ 所有程序 ▸ 附件；.doc、.rtf 都用它打开）：那几年“没装 Word 的人的 Word”
   - 跟记事本最大的不同是能排版：文章按“段”存，每段有自己的字体、字号、粗斜下划线、颜色（含七彩）、对齐、项目符号、缩进
   - 写字不用打字：点白纸空白处弹“范文”（作文、检讨、情书、请假条），一段一段自己打进去，排版是现成的；也能“自己输入…”
   - 点一段 = 选中这一段，格式栏改的就是它；编辑 ▸ 全选 一起改
   - 插入 ▸ 对象：抠抠表情、我的图片（欠条、示例图片）、千千不听音乐片段、羊；插入 ▸ 日期和时间
   - 存 RTF / Word 排版都在；存成文本文档全丢；存到桌面羊照吃，文章里插了羊的话羊不吃
   - 蓝屏：格式 ▸ 字体… 字号填超过 1638（XP 写字板真上限），头一回报错，再填 → 那个字撑破屏幕 → FONT_TOO_BIG */
(function () {
  'use strict';
  const el = OS.el;
  const FS = OS.fs;
  const app = OS.apps.byId.wordpad;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = '写字板', UNTITLED = '文档';
  const L = {
    menus: ['文件(F)', '编辑(E)', '查看(V)', '插入(I)', '格式(O)', '帮助(H)'],
    status: '按 F1 获取帮助',
    help: '写字板帮助：写字板是一个能写字的板。',
    about: '写字板\n版本 2003\n(C) ' + OS.YEAR + ' 无聊科技',
    open: '打开失败：文件都在我的文档里，去那儿双击。',
    page: '纸张大小：作业本',
    send: 'Outluck Excess 正在施工。\n你的作文只能自己看了。',
    undo: '撤销功能需要升级专业版：后悔药 2.0。',
    find: '找不到"作业"。\n你本来也没写。',
    tabs: '制表位是什么？\n写了这么多年作文也没人知道。',
    wordArt: '写字板没有艺术字。\n想要艺术字，请购买 Wuliao Word 2003。',
    noDrawing: '你还没画过画。',
    preview: '第 1 页\n共 1 页，后面那页是你想象出来的',
    ask: n => '要保存对 ' + n + ' 的更改吗？',
    toText: '你选择了文本文档格式，所有格式都将丢失。\n包括你辛辛苦苦调的七彩。',
    roFail: '保存失败：这个文件是只读的。',
    sizeErr: '字号必须介于 1 和 1638 之间。',
    sample: '无聊科技 AaBbCc',
    newTitle: '新建', newTypes: ['RTF 文档', '文本文档', 'Unicode 文本文档', 'Word 6.0 文档'],
    objTitle: '插入对象', objs: ['抠抠表情', '我的图片', '千千不听音乐片段', '画图图片', '羊'],
    noPics: '我的图片里什么都没有。',
    dateTitle: '日期和时间'
  };
  // 范文：点白纸空白处弹出来选，一段一段打进去（p = 段落格式）
  const D = (text, o) => Object.assign({ text }, o || {});
  const TEMPLATES = [
    ['写作文', [D('我的同桌', { align: 'center', b: true, size: 16 }), D('我的同桌是一个爱抄作业的人。', { indent: 2 }),
      D('每天早上，同桌都会对我说：作业借我抄一下。', { indent: 2 }), D('我问同桌为什么不自己写，同桌说：写了也是错，不如抄你的。', { indent: 2 }),
      D('我觉得同桌说得很有道理。', { indent: 2 })]],
    ['写检讨', [D('检讨书', { align: 'center', b: true, size: 16 }), D('尊敬的老师：'), D('我错了。', { indent: 2 }),
      D('我不该在作业本上画小人。', { indent: 2 }), D('更不该给小人画上您的发型。', { indent: 2 }), D('此致', { indent: 2 }), D('敬礼'),
      D('检讨人：你', { align: 'right' }), D('@date', { align: 'right' })]],
    ['写情书', [D('致 同桌：', { color: '#ff3fa6', b: true, size: 14 }), D('每次你借我作业抄，我都很开心。', { bullet: 'heart', color: '#ff3fa6' }),
      D('不是因为作业，是因为你。', { bullet: 'heart', color: '#ff3fa6' }), D('下课一起去小卖部好吗？我请客。', { bullet: 'heart', color: '#ff3fa6' }),
      D('这次真的我请。', { bullet: 'heart', color: '#ff3fa6' }), D('——一个不愿透露姓名的人', { align: 'right', i: true })]],
    ['写请假条', [D('请假条', { align: 'center', b: true, size: 16 }), D('尊敬的班主任：'), D('本人因肚子疼，明天不能上学，特此请假一天。', { indent: 2 }),
      D('肚子疼的原因是：明天考数学。', { indent: 2 }), D('此致', { indent: 2 }), D('敬礼'), D('请假人：你', { align: 'right' }), D('@date', { align: 'right' })]]
  ];
  const LINES = ['今天天气很好。', '我要好好学习。', '我再也不玩电脑了。', '作业写完了。骗你的。', '在吗', '联通'];
  const SELF_TYPE = '自己输入…';
  const FONTS = { '宋体': 'SimSun, "宋体", serif', '黑体': 'SimHei, "黑体", "Microsoft YaHei", sans-serif', '楷体': 'KaiTi, "楷体", "楷体_GB2312", STKaiti, serif',
    '隶书': 'LiSu, "隶书", STLiti, serif', '幼圆': 'YouYuan, "幼圆", "Microsoft YaHei", sans-serif', '华文彩云': 'STCaiyun, "华文彩云", SimHei, sans-serif', '火星文': 'SimSun, "宋体", serif' };
  const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  const COLORS = [['黑色', '#000000'], ['栗色', '#800000'], ['绿色', '#008000'], ['橄榄色', '#808000'], ['藏青色', '#000080'], ['紫色', '#800080'], ['蓝绿色', '#008080'], ['灰色', '#808080'],
    ['银色', '#c0c0c0'], ['红色', '#ff0000'], ['亮绿色', '#00ff00'], ['黄色', '#ffff00'], ['蓝色', '#0000ff'], ['紫红色', '#ff00ff'], ['水绿色', '#00ffff'], ['白色', '#ffffff'], ['七彩', 'rainbow']];
  const BULLETS = [['圆点', 'dot', '●'], ['爱心', 'heart', '♥'], ['五角星', 'star', '★'], ['小猪', 'pig', '🐷']];
  const UNITS = ['厘米', '英寸', '点', '派卡'];
  const SIZE_MAX = 1638, PX = 1.25;   // 1 号字 = 1.25 像素
  const BSOD = { id: 'wordpad', name: 'FONT_TOO_BIG', text: '一个字太大，把屏幕撑破了。' };
  const TYPES = [['RTF 文档(*.rtf)', 'rtf', '.rtf'], ['Word 6.0 文档(*.doc)', 'doc', '.doc'], ['文本文档(*.txt)', 'txt', '.txt'], ['Unicode 文本文档(*.txt)', 'txt', '.txt']];

  const today = () => { const d = OS.clock.now(); return OS.YEAR + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; };
  const blank = () => ({ text: '', font: '宋体', size: 10 });
  // 纯文字变成一段一段（打开只有字的 .doc 时用）
  const fromText = t => String(t || '').split('\n').map(x => Object.assign(blank(), { text: x }));
  const toText = doc => doc.map(p => (p.obj ? '' : (p.bullet ? bulletChar(p.bullet) + ' ' : '') + p.text)).join('\n');
  const bulletChar = b => (BULLETS.find(x => x[1] === b) || BULLETS[0])[2];
  const hasSheep = doc => doc.some(p => p.obj && p.obj.type === 'sheep');
  const toMars = t => (OS.notepad && OS.notepad.toMars ? OS.notepad.toMars(t) : t);

  /* ================= 打开 =================
     f: { name, doc: [段], where: { type: 'fs', path } | { type: 'desk' } | { type: 'ro', msg } } */
  function open(f) {
    f = f || {};
    let name = f.name || UNTITLED, where = f.where || null;
    let doc = (f.doc || [blank()]).map(p => Object.assign(blank(), p));
    if (!doc.length) doc = [blank()];
    let sel = new Set(), dirty = false, busy = false, unit = '厘米', clip = null, oversize = 0, typingAt = -1;
    const show = { tools: true, fmt: true, ruler: true, status: true };

    /* ---------- 窗口 ---------- */
    const bar = OS.ui.menuBar(L.menus, menuFor, 'np-mbar');
    const tb = (text, title, fn, cls) => { const b = el('button', { class: 'wp-tb' + (cls ? ' ' + cls : ''), text, title: title || text }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(b); }); return b; };
    const sep = () => el('span', { class: 'wp-sep' });
    const tools = el('div', { class: 'wp-bar' }, [
      tb('新建', '', fileNew), tb('打开', '', say(NAME, 'info', L.open)), tb('保存', '', () => save(false)), tb('打印', '', print), tb('预览', '打印预览', preview), sep(),
      tb('查找', '', say('查找', 'info', L.find)), sep(), tb('剪切', '', cut), tb('复制', '', copy), tb('粘贴', '', paste), tb('撤销', '', say(NAME, 'warn', L.undo)), sep(), tb('日期', '日期和时间', insertDate)
    ]);
    const fontBtn = tb('宋体 ▾', '字体', b => drop(b, Object.keys(FONTS).map(k => ({ label: k, checked: cur().font === k, action: () => apply({ font: k }) }))), 'wp-drop wp-fontsel');
    const sizeBtn = tb('10 ▾', '字号', b => drop(b, SIZES.map(s => ({ label: String(s), checked: cur().size === s, action: () => apply({ size: s }) }))), 'wp-drop wp-sizesel');
    const bBtn = tb('B', '粗体', () => apply({ b: !cur().b }), 'f-b'), iBtn = tb('I', '斜体', () => apply({ i: !cur().i }), 'f-i'), uBtn = tb('U', '下划线', () => apply({ u: !cur().u }), 'f-u');
    const colorBtn = tb('颜色', '颜色', b => drop(b, COLORS.map(([n, c]) => ({ label: n, checked: (cur().color || '#000000') === c, action: () => apply({ color: c }) }))), 'wp-color');
    const alBtns = [['左', 'left'], ['中', 'center'], ['右', 'right']].map(([t, a]) => tb(t, t === '左' ? '左对齐' : t === '中' ? '居中' : '右对齐', () => apply({ align: a }), 'wp-al'));
    const bulBtn = tb('•', '项目符号', () => apply({ bullet: cur().bullet ? null : 'dot' }));
    const fmtBar = el('div', { class: 'wp-bar wp-fmt' }, [fontBtn, sizeBtn, sep(), bBtn, iBtn, uBtn, colorBtn, sep()].concat(alBtns, [sep(), bulBtn]));
    const ruler = el('div', { class: 'wp-ruler' });
    const page = el('div', { class: 'wp-page' });
    const paper = el('div', { class: 'wp-paper' }, [page]);
    const status = el('div', { class: 'wp-status', text: L.status });
    const box = el('div', { class: 'wp' }, [bar, tools, fmtBar, ruler, paper, status]);
    const win = OS.wm.open({
      title: title(), icon: 'wordpad', width: 400, height: 286, content: box, appId: app.id,
      beforeClose: () => { if (busy) { OS.sound.play('ding'); return false; } if (!dirty) return true; askSave(() => win.close()); return false; }
    });
    OS.ui.scrollable(paper);
    function title() { return name + ' - ' + NAME; }
    const setDirty = () => { dirty = true; };

    /* ---------- 标尺 ---------- */
    function drawRuler() {
      ruler.textContent = '';
      const step = { '厘米': 30, '英寸': 76, '点': 36, '派卡': 48 }[unit];
      const lab = { '厘米': i => i, '英寸': i => i, '点': i => i * 36, '派卡': i => i * 3 }[unit];
      for (let i = 1; i * step < 380; i++) ruler.appendChild(el('span', { class: 'wp-rl', text: String(lab(i)), style: { left: (8 + i * step) + 'px' } }));
      ruler.appendChild(el('span', { class: 'wp-runit', text: unit }));
    }

    /* ---------- 画纸 ---------- */
    const cur = () => doc[sel.size ? [...sel][0] : doc.length - 1] || blank();
    function render() {
      page.textContent = '';
      doc.forEach((p, i) => page.appendChild(paraEl(p, i)));
      page.appendChild(el('div', { class: 'wp-tail' }));   // 最后留一块空白，点了弹范文
      const c = cur();
      fontBtn.textContent = c.font + ' ▾';
      sizeBtn.textContent = c.size + ' ▾';
      bBtn.classList.toggle('on', !!c.b); iBtn.classList.toggle('on', !!c.i); uBtn.classList.toggle('on', !!c.u);
      bulBtn.classList.toggle('on', !!c.bullet);
      alBtns.forEach((b, k) => b.classList.toggle('on', (c.align || 'left') === ['left', 'center', 'right'][k]));
      tools.style.display = show.tools ? '' : 'none';
      fmtBar.style.display = show.fmt ? '' : 'none';
      ruler.style.display = show.ruler ? '' : 'none';
      status.style.display = show.status ? '' : 'none';
    }
    function paraEl(p, i) {
      const d = el('div', { class: 'wp-p' + (sel.has(i) ? ' sel' : '') });
      d.dataset.i = i;
      const st = d.style;
      st.fontFamily = FONTS[p.font] || FONTS['宋体'];
      st.fontSize = (p.size * PX) + 'px';
      st.fontWeight = p.b ? 'bold' : 'normal';
      st.fontStyle = p.i ? 'italic' : 'normal';
      st.textDecoration = p.u ? 'underline' : 'none';
      st.textAlign = p.align || 'left';
      st.paddingLeft = (p.indent || 0) + 'em';
      if (p.color && p.color !== 'rainbow') st.color = p.color;
      if (p.font === '华文彩云') d.classList.add('wp-caiyun');
      if (p.obj) { d.classList.add('wp-objp'); d.appendChild(objEl(p.obj)); return d; }
      if (p.bullet) d.appendChild(el('span', { class: 'wp-bul', text: bulletChar(p.bullet) + ' ' }));
      const text = p.font === '火星文' ? toMars(p.text) : p.text;
      // 七彩：一个字一个颜色；跟华文彩云一起用时是空心描边的七彩
      if (p.color === 'rainbow') [...text].forEach((ch, k) => {
        const hue = 'hsl(' + ((k * 47) % 360) + ', 90%, 48%)';
        d.appendChild(el('span', { text: ch, style: p.font === '华文彩云' ? { color: 'transparent', webkitTextStroke: '1px ' + hue } : { color: hue } }));
      });
      else d.appendChild(document.createTextNode(text || '​'));
      return d;
    }
    // 插进文章里的东西
    function objEl(o) {
      if (o.type === 'emo') return el('span', { class: 'wp-emo', style: { backgroundPosition: (o.i / 15 * 100) + '% 0' } });
      if (o.type === 'sheep') return el('span', { class: 'wp-sheep', html: OS.desktop.sheepHtml });
      if (o.type === 'music') {
        const n = el('span', { class: 'wp-music' }, [OS.iconEl('music', 'wp-music-ico'), el('span', { text: o.title })]);
        let lastT = 0;
        n.addEventListener('click', () => { const t = Date.now(); if (t - lastT < OS.dblMs()) { lastT = 0; if (OS.qianqian) OS.qianqian.play(o.track); } else lastT = t; });
        return n;
      }
      if (o.type === 'pic') {
        const node = FS.get(o.path);
        if (node && node.slip) {
          const s = node.slip;
          return el('div', { class: 'wp-slip' }, [el('b', { text: '欠　条' }), el('div', { text: '欠款人：' + s.who }), el('div', { text: '共计 ¥' + s.total })]);
        }
        const c = el('canvas', { class: 'wp-pic' });
        c.width = 120; c.height = 80;
        try {
          if (node && OS.abcsee) OS.abcsee.drawNode(node, c.getContext('2d'), 120, 80);
          else if (OS.richPic) { const src = OS.richPic(); c.getContext('2d').drawImage(src, 0, 0, 120, 80); }
        } catch (e) { /* 画不出来就空着 */ }
        return c;
      }
      return el('span', { text: '?' });
    }
    render();
    drawRuler();

    /* ---------- 点：点到某一段 = 选中它；点空白 = 弹范文 ---------- */
    let menuClosedAt = 0;
    page.addEventListener('click', e => {
      if (busy || typingAt >= 0) return;
      const pEl = e.target.closest('.wp-p');
      if (pEl) { const i = +pEl.dataset.i; sel = new Set([i]); render(); return; }
      if (Date.now() - menuClosedAt < 350) return;
      sel = new Set();
      render();
      const pt = OS.stage.toLocal(e.clientX, e.clientY);
      let picked = false;
      const items = TEMPLATES.map(([label, paras]) => ({ label, action: () => { picked = true; writeParas(paras); } }))
        .concat([{ label: '写一句话', sub: LINES.map(t => ({ label: t, action: () => { picked = true; writeParas([D(t)]); } })) }, '-', { label: SELF_TYPE, action: () => { picked = true; selfType(); } }]);
      OS.ui.contextMenu(items, pt.x, pt.y, false, { onClose: () => setTimeout(() => { if (!picked) menuClosedAt = Date.now(); }, 0) });
    });
    // 一段一段打进去（排版是范文自带的）
    async function writeParas(paras) {
      busy = true;
      if (doc.length === 1 && !doc[0].text && !doc[0].obj) doc = [];
      for (const src of paras) {
        const p = Object.assign(blank(), src, { text: '' });
        const full = src.text === '@date' ? today() : src.text;
        doc.push(p);
        for (const ch of full) {
          if (win.isClosed) return;
          p.text += ch;
          render();
          paper.scrollTop = paper.scrollHeight;
          if (ch.trim()) OS.sound.play('key');
          await OS.wait(55);
        }
      }
      sel = new Set();
      setDirty();
      busy = false;
      render();
    }
    // 自己输入：新起一段，真能打字，点别处就停
    function selfType() {
      if (doc.length === 1 && !doc[0].text && !doc[0].obj) doc = [];
      const last = doc[doc.length - 1];
      doc.push(Object.assign(blank(), last && !last.obj ? { font: last.font, size: last.size, color: last.color } : {}));
      typingAt = doc.length - 1;
      render();
      const pEl = page.querySelector('.wp-p[data-i="' + typingAt + '"]');
      pEl.textContent = '';
      pEl.contentEditable = 'plaintext-only';
      if (pEl.contentEditable !== 'plaintext-only') pEl.contentEditable = 'true';
      pEl.classList.add('typing');
      pEl.focus();
      pEl.addEventListener('blur', () => {
        const t = pEl.innerText.replace(/\n+$/, '');
        const lines = t.split('\n');
        const base = doc[typingAt];
        doc.splice(typingAt, 1, ...lines.map(x => Object.assign({}, base, { text: x })));
        typingAt = -1;
        setDirty();
        render();
      }, { once: true });
    }

    /* ---------- 格式：改选中的段（没选就改最后一段） ---------- */
    function apply(change) {
      const idx = sel.size ? [...sel] : [doc.length - 1];
      idx.forEach(i => { if (doc[i]) Object.assign(doc[i], change); });
      setDirty();
      render();
    }
    function drop(btn, items) {
      const r = OS.stage.rectOf(btn), pt = { x: r.left, y: r.bottom };
      OS.ui.contextMenu(items, pt.x, pt.y);
    }

    /* ---------- 菜单 ---------- */
    function menuFor(m) {
      if (busy) return null;
      if (m === L.menus[0]) return [
        { label: '新建…', action: fileNew },
        { label: '打开…', action: say(NAME, 'info', L.open) },
        { label: '保存', action: () => save(false) },
        { label: '另存为…', action: () => save(true) },
        '-',
        { label: '打印…', action: print },
        { label: '打印预览', action: preview },
        { label: '页面设置…', action: say('页面设置', 'info', L.page) },
        '-',
        { label: '发送…', action: say('发送', 'info', L.send) },
        '-',
        { label: '退出', action: () => OS.wm.requestClose(win) }
      ];
      if (m === L.menus[1]) return [
        { label: '撤销', action: say(NAME, 'warn', L.undo) },
        '-',
        { label: '剪切', disabled: !sel.size, action: cut },
        { label: '复制', disabled: !sel.size, action: copy },
        { label: '粘贴', disabled: !clip, action: paste },
        { label: '清除', disabled: !sel.size, action: clear },
        { label: '全选', action: () => { sel = new Set(doc.map((_, i) => i)); render(); } },
        '-',
        { label: '查找…', action: say('查找', 'info', L.find) }
      ];
      if (m === L.menus[2]) return [
        { label: '工具栏', checked: show.tools, action: () => { show.tools = !show.tools; render(); } },
        { label: '格式栏', checked: show.fmt, action: () => { show.fmt = !show.fmt; render(); } },
        { label: '标尺', checked: show.ruler, action: () => { show.ruler = !show.ruler; render(); } },
        { label: '状态栏', checked: show.status, action: () => { show.status = !show.status; render(); } },
        '-',
        { label: '选项…', sub: UNITS.map(u => ({ label: '度量单位：' + u, checked: unit === u, action: () => { unit = u; drawRuler(); } })) }
      ];
      if (m === L.menus[3]) return [
        { label: '日期和时间…', action: insertDate },
        { label: '对象…', action: insertObject },
        '-',
        { label: '艺术字…', action: say('艺术字', 'info', L.wordArt) }
      ];
      if (m === L.menus[4]) return [
        { label: '字体…', action: fontDialog },
        { label: '项目符号样式', sub: [{ label: '无', checked: !cur().bullet, action: () => apply({ bullet: null }) }].concat(BULLETS.map(([n, k]) => ({ label: n, checked: cur().bullet === k, action: () => apply({ bullet: k }) }))) },
        { label: '段落…', sub: [0, 2, 4].map(n => ({ label: '左缩进：' + (n ? n + ' 字' : '无'), checked: (cur().indent || 0) === n, action: () => apply({ indent: n }) })) },
        { label: '制表位…', action: say('制表位', 'info', L.tabs) }
      ];
      return [{ label: '帮助主题', action: say('写字板帮助', 'help', L.help) }, '-', { label: '关于写字板', action: say('关于写字板', 'info', L.about) }];
    }
    // F1：帮助
    function onKey(e) { if (!win.isClosed && OS.wm.active === win && e.key === 'F1') { e.preventDefault(); OS.ui.dialog({ title: '写字板帮助', icon: 'help', text: L.help }); } }
    document.addEventListener('keydown', onKey, true);
    win.closed.then(() => document.removeEventListener('keydown', onKey, true));

    function cut() { if (!sel.size) return; copy(); clear(); }
    function copy() { if (!sel.size) return; clip = [...sel].sort((a, b) => a - b).map(i => JSON.parse(JSON.stringify(doc[i]))); }
    function paste() {
      if (!clip) return;
      const at = sel.size ? Math.max(...sel) + 1 : doc.length;
      doc.splice(at, 0, ...clip.map(p => JSON.parse(JSON.stringify(p))));
      sel = new Set();
      setDirty();
      render();
    }
    function clear() {
      if (!sel.size) return;
      doc = doc.filter((_, i) => !sel.has(i));
      if (!doc.length) doc = [blank()];
      sel = new Set();
      setDirty();
      render();
    }
    function insertParas(paras) {
      if (doc.length === 1 && !doc[0].text && !doc[0].obj) doc = [];
      const at = sel.size ? Math.max(...sel) + 1 : doc.length;
      doc.splice(at, 0, ...paras);
      sel = new Set();
      setDirty();
      render();
      paper.scrollTop = paper.scrollHeight;
    }
    function insertDate() {
      const d = OS.clock.now(), wk = '日一二三四五六'[d.getDay()];
      const opts = [OS.YEAR + '-' + OS.pad2(d.getMonth() + 1) + '-' + OS.pad2(d.getDate()), today(), '星期' + wk, OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()) + ':' + OS.pad2(d.getSeconds())];
      pickList(L.dateTitle, opts, i => insertParas([Object.assign(blank(), cur().obj ? {} : { font: cur().font, size: cur().size }, { text: opts[i] })]));
    }
    // 插入对象
    function insertObject() {
      pickList(L.objTitle, L.objs, i => {
        const k = L.objs[i];
        if (k === '抠抠表情') return pickEmo();
        if (k === '我的图片') return pickPic();
        if (k === '千千不听音乐片段') {
          const songs = ['宝贝我爱你爱你爱你（DJ 劲爆版）', '下雨天记得收衣服（伴奏）', '不知道谁唱的', '莪們哋噯', '桌面背景音乐'];
          return pickList('千千不听音乐片段', songs, t => insertParas([Object.assign(blank(), { obj: { type: 'music', track: t, title: songs[t] } })]));
        }
        if (k === '画图图片') return pickDrawing();
        insertParas([Object.assign(blank(), { obj: { type: 'sheep' } })]);
      });
    }
    function pickEmo() {
      const grid = el('div', { class: 'wp-emogrid' });
      const w = OS.wm.open({ title: '抠抠表情', icon: 'koukou', width: 210, content: grid, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      for (let i = 0; i < 16; i++) {
        const c = el('span', { class: 'wp-emo', style: { backgroundPosition: (i / 15 * 100) + '% 0' } });
        c.addEventListener('click', () => { OS.sound.play('click'); w.close(); insertParas([Object.assign(blank(), { obj: { type: 'emo', i } })]); });
        grid.appendChild(c);
      }
    }
    // 画图 AI版画过的画
    function pickDrawing() {
      const nodes = FS.list(FS.PICS).concat(FS.list(FS.PICS).filter(n => n.folder).reduce((a, f) => a.concat(FS.list(f.path)), [])).filter(n => n.img);
      if (!nodes.length) { OS.ui.dialog({ title: L.objTitle, icon: 'info', text: L.noDrawing }); return; }
      pickList('画图图片', nodes.map(n => n.name), i => insertParas([Object.assign(blank(), { obj: { type: 'pic', path: nodes[i].path } })]));
    }
    function pickPic() {
      const nodes = FS.list(FS.PICS).concat(FS.list(FS.join(FS.PICS, '示例图片'))).filter(n => n.kind === 'jpg' || n.kind === 'bmp');
      if (!nodes.length) { OS.ui.dialog({ title: '我的图片', icon: 'info', text: L.noPics }); return; }
      pickList('我的图片', nodes.map(n => n.name), i => insertParas([Object.assign(blank(), { obj: { type: 'pic', path: nodes[i].path } })]));
    }
    // 一个简单的“选一个”框
    function pickList(t, items, done) {
      const list = el('div', { class: 'wp-list' });
      const w = OS.wm.open({ title: t, icon: 'doc', width: 220, content: el('div', { class: 'wp-pick' }, [list]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      items.forEach((s, i) => { const r = el('div', { class: 'wp-li', text: s }); r.addEventListener('click', () => { OS.sound.play('click'); w.close(); done(i); }); list.appendChild(r); });
      OS.ui.scrollable(list);
    }

    /* ---------- 格式 ▸ 字体…：字体、字号、颜色、粗斜下划线、示例；字号能自己填（蓝屏就在这） ---------- */
    function fontDialog() {
      const c0 = Object.assign({}, cur());
      const pick = { font: c0.font, size: c0.size, b: !!c0.b, i: !!c0.i, u: !!c0.u, color: c0.color || '#000000' };
      const sample = el('div', { class: 'wp-sample', text: L.sample });
      const drawSample = () => {
        sample.style.fontFamily = FONTS[pick.font];
        sample.style.fontSize = Math.min(pick.size, 36) * PX + 'px';
        sample.style.fontWeight = pick.b ? 'bold' : 'normal'; sample.style.fontStyle = pick.i ? 'italic' : 'normal'; sample.style.textDecoration = pick.u ? 'underline' : 'none';
        sample.style.color = pick.color === 'rainbow' ? '#e0389a' : pick.color;
      };
      const fontList = el('div', { class: 'wp-flist' }, Object.keys(FONTS).map(k => { const r = el('div', { class: 'wp-li' + (k === pick.font ? ' on' : ''), text: k }); r.addEventListener('click', () => { pick.font = k; fontList.querySelectorAll('.wp-li').forEach(x => x.classList.toggle('on', x === r)); drawSample(); }); return r; }));
      const sizeIn = el('input', { class: 'xl-input wp-sizein', type: 'text', inputmode: 'numeric', maxlength: '6' });
      sizeIn.value = String(pick.size);
      const sizeList = el('div', { class: 'wp-flist wp-slist' }, SIZES.map(s => { const r = el('div', { class: 'wp-li', text: String(s) }); r.addEventListener('click', () => { sizeIn.value = String(s); pick.size = s; drawSample(); }); return r; }));
      sizeIn.addEventListener('input', () => { const v = parseInt(sizeIn.value, 10); if (v > 0) { pick.size = v; drawSample(); } });
      const chk = (k, label) => { const b = el('input', { type: 'checkbox' }); b.checked = pick[k]; b.addEventListener('change', () => { pick[k] = b.checked; drawSample(); }); return el('label', { class: 'wp-chk' }, [b, el('span', { text: label })]); };
      const colorSel = el('button', { class: 'wp-tb wp-drop', text: (COLORS.find(c => c[1] === pick.color) || COLORS[0])[0] + ' ▾' });
      colorSel.addEventListener('click', e => { e.stopPropagation(); drop(colorSel, COLORS.map(([n, c]) => ({ label: n, checked: pick.color === c, action: () => { pick.color = c; colorSel.textContent = n + ' ▾'; drawSample(); } }))); });
      const ok = el('button', { class: 'xpbtn default', text: '确定' });
      const no = el('button', { class: 'xpbtn', text: '取消' });
      const content = el('div', { class: 'wp-fd' }, [
        el('div', { class: 'wp-fd-cols' }, [
          el('div', {}, [el('div', { class: 'wp-fd-h', text: '字体：' }), fontList]),
          el('div', {}, [el('div', { class: 'wp-fd-h', text: '字号：' }), sizeIn, sizeList]),
          el('div', { class: 'wp-fd-fx' }, [el('div', { class: 'wp-fd-h', text: '效果：' }), chk('b', '粗体'), chk('i', '斜体'), chk('u', '下划线'), el('div', { class: 'wp-fd-h', text: '颜色：' }), colorSel])
        ]),
        el('div', { class: 'wp-fd-h', text: '示例' }), el('div', { class: 'wp-samplebox' }, [sample]),
        el('div', { class: 'dlg-btns' }, [ok, no])
      ]);
      drawSample();
      const w = OS.wm.open({ title: '字体', icon: 'doc', width: 300, content, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
      ok.addEventListener('click', () => {
        OS.sound.play('click');
        const v = parseInt(sizeIn.value, 10);
        if (!(v >= 1 && v <= SIZE_MAX)) {
          // 超过 1638：头一回报错（XP 真是这句）；再来一次，那个字就撑破屏幕
          if (v > SIZE_MAX && oversize >= 1) { w.close(); burst(); return; }
          if (v > SIZE_MAX) oversize++;
          OS.ui.dialog({ title: NAME, icon: 'warn', text: L.sizeErr });
          return;
        }
        pick.size = v;
        w.close();
        apply(pick);
      });
    }
    // 蓝屏：选中那段的第一个字从窗口里撑出来，铺满整个屏幕
    function burst() {
      busy = true;
      const p = cur();
      const ch = (p.text || '字').trim().charAt(0) || '字';
      const giant = el('div', { class: 'wp-giant', text: ch, style: { fontFamily: FONTS[p.font] || FONTS['宋体'], color: p.color && p.color !== 'rainbow' ? p.color : '#000' } });
      const r = OS.stage.rectOf(win.el), a = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      giant.style.left = a.x + 'px';
      giant.style.top = a.y + 'px';
      document.getElementById('overlay').appendChild(giant);
      OS.sound.play('burst');
      setTimeout(() => { giant.remove(); OS.ui.bsod(BSOD); }, 1300);
    }

    /* ---------- 新建、打印、预览 ---------- */
    function fileNew() {
      pickList(L.newTitle, L.newTypes, i => {
        askSave(() => {
          if (i === 1 || i === 2) { win.close(); OS.notepad.open(); return; }   // 文本文档就用记事本
          doc = [blank()]; name = UNTITLED; where = null; dirty = false; sel = new Set(); win.setTitle(title()); render();
        });
      });
    }
    function print() { [0, 300, 600].forEach(t => setTimeout(() => OS.sound.play('printer'), t)); setTimeout(() => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }), 900); }
    function preview() {
      const mini = page.cloneNode(true);
      mini.classList.add('wp-mini');
      const pv = el('div', { class: 'wp-pv' }, [el('div', { class: 'wp-pv-sheet' }, [mini]), el('div', { class: 'wp-pv-txt', text: L.preview })]);
      const btns = ['打印', '下一页', '放大', '关闭'].map(t => el('button', { class: 'xpbtn', text: t }));
      btns[1].disabled = true;
      const w = OS.wm.open({ title: name + ' - 打印预览', icon: 'doc', width: 300, content: el('div', {}, [el('div', { class: 'wp-pv-bar' }, btns), pv]), maximizable: false, center: true });
      btns[0].addEventListener('click', () => { OS.sound.play('click'); w.close(); print(); });
      btns[2].addEventListener('click', () => { OS.sound.play('click'); pv.classList.toggle('zoom'); });
      btns[3].addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    }

    /* ---------- 保存 ---------- */
    function askSave(done) {
      if (!dirty) { done(); return; }
      OS.ui.dialog({ title: NAME, icon: 'warn', text: L.ask(name), buttons: ['是', '否', '取消'] }).then(v => {
        if (v === '否') { dirty = false; done(); } else if (v === '是') save(false).then(ok => { if (ok) done(); });
      });
    }
    async function save(asNew) {
      if (!asNew && where && where.type === 'ro') { await OS.ui.dialog({ title: NAME, icon: 'error', text: where.msg || L.roFail }); return false; }
      if (!asNew && where && where.type === 'fs' && FS.get(where.path)) { FS.setDoc(where.path, doc); dirty = false; return true; }
      const pick = await saveAs(name);
      if (!pick || win.isClosed) return false;
      const [, kind, ext] = TYPES[pick.type];
      if (kind === 'txt' && doc.some(p => p.obj || p.b || p.i || p.u || (p.color && p.color !== '#000000') || p.font !== '宋体' || p.size !== 10 || p.bullet || p.align)) {
        const v = await OS.ui.dialog({ title: NAME, icon: 'warn', text: L.toText, buttons: ['是', '否'] });
        if (v !== '是') return false;
      }
      const fname = pick.name.replace(/\.(rtf|doc|txt)$/i, '') + ext;
      const text = toText(doc);
      if (pick.place === 'docs') {
        const same = FS.get(FS.join(FS.MYDOCS, fname));
        let node;
        if (same && same.user) { if (kind === 'txt') FS.setText(same.path, text); else FS.setDoc(same.path, doc); node = same; }
        else node = FS.createFile(FS.MYDOCS, fname, kind, kind === 'txt' ? { text } : { doc: JSON.parse(JSON.stringify(doc)) });
        if (!node) return false;
        if (kind === 'txt') { dirty = false; win.close(); return true; }
        name = node.name; where = { type: 'fs', path: node.path };
      } else {
        const snapshot = JSON.parse(JSON.stringify(doc));
        const ok = await OS.notepad.toDesktop(fname, text, true, kind === 'txt' ? null : {
          icon: 'doc', sheepInside: hasSheep(doc), open: () => open({ name: fname, doc: snapshot, where: { type: 'desk' } }), typeName: kind === 'rtf' ? 'RTF 文档' : 'Word 文档'
        });
        if (!ok) return false;
        name = fname; where = { type: 'desk' };
      }
      dirty = false;
      win.setTitle(title());
      return true;
    }
    return win;
  }

  /* ================= 另存为：保存在 桌面 ／ 我的文档；保存类型 四种 ================= */
  function saveAs(fname) {
    return new Promise(resolve => {
      let place = 'desk', type = 0;
      const row = (k, v, drop) => el('div', { class: 'np-sa-row' }, [el('span', { class: 'np-sa-k', text: k }), el('div', { class: 'np-sa-v' + (drop ? ' drop' : '') }, v)]);
      const placeIco = el('span', { class: 'np-sa-icowrap' }, [OS.iconEl('computer', 'np-sa-ico')]);
      const placeTxt = el('span', { text: '桌面' });
      const typeTxt = el('span', { text: TYPES[0][0] });
      const whereRow = row('保存在：', [placeIco, placeTxt, el('i', { class: 'np-sa-arrow' })], true);
      const typeRow = row('保存类型：', [typeTxt, el('i', { class: 'np-sa-arrow' })], true);
      const nameTxt = el('span', { text: fname.replace(/\.(rtf|doc|txt)$/i, '') + TYPES[0][2] });
      const setType = t => { type = t; typeTxt.textContent = TYPES[t][0]; nameTxt.textContent = fname.replace(/\.(rtf|doc|txt)$/i, '') + TYPES[t][2]; };
      const dropAt = (node, items) => { const r = OS.stage.rectOf(node), p = { x: r.left, y: r.bottom }; OS.ui.contextMenu(items, p.x, p.y); };
      whereRow.querySelector('.np-sa-v').addEventListener('click', e => {
        e.stopPropagation(); OS.sound.play('click');
        dropAt(e.currentTarget, [['desk', '桌面', 'computer'], ['docs', '我的文档', 'mydocs']].map(([k, label, icon]) => ({ label, icon, checked: place === k, action: () => {
          place = k; placeTxt.textContent = label; placeIco.textContent = ''; placeIco.appendChild(OS.iconEl(icon, 'np-sa-ico'));
        } })));
      });
      typeRow.querySelector('.np-sa-v').addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); dropAt(e.currentTarget, TYPES.map((t, i) => ({ label: t[0], checked: type === i, action: () => setType(i) }))); });
      const ok = el('button', { class: 'xpbtn default', text: '保存' });
      const no = el('button', { class: 'xpbtn', text: '取消' });
      const content = el('div', { class: 'np-sa' }, [whereRow, row('文件名：', [nameTxt]), typeRow, el('div', { class: 'dlg-btns' }, [ok, no])]);
      let v = null;
      const w = OS.wm.open({ title: '另存为', width: 270, content, modal: true, taskbar: false, minimizable: false, maximizable: false, onClose: () => resolve(v) });
      ok.addEventListener('click', () => { OS.sound.play('click'); v = { name: nameTxt.textContent, place, type }; w.close(); });
      no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    });
  }

  app.open = () => open();
  OS.wordpad = { open, fromText };
})();

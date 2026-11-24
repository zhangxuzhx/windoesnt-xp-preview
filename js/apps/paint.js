/* 画图 AI版（开始 ▸ 所有程序 ▸ 附件；开始菜单左栏）：那几年人人都画过的“画图”，手指真能画
   - 12 个工具：选择 ／ 橡皮 ／ 油漆桶 ／ 取色 ／ 放大镜 ／ 铅笔 ／ 刷子 ／ 喷枪 ／ 文字 ／ 直线 ／ 矩形 ／ 椭圆；下面 28 色颜料盒（长按 = 背景色）
   - 只能撤销 3 次（XP 画图真是这样），第 4 次：人生一次都不能
   - AI 菜单：智能识别（很自信，但永远认错，最爱说土豆）／ 一键美化（七彩边框 + 星星 + ★我的作品★，Codex 画的贴纸）／ 一键非主流（黑白 + 火星文）／ 智能补全（角上补一只羊）
   - 保存只能存 .bmp，存进我的图片（免费版自动加水印）；ABCSee 里能看、能设为墙纸；系统送的图能打开，但只能另存为
   - 蓝屏：油漆桶连倒 8 桶、每桶换个颜色 → 颜料从窗口溢出来流满屏幕 → PAINT_SPILLED
   创意稿见「画图AI版-创意.md」 */
(function () {
  'use strict';
  const el = OS.el, FS = OS.fs;
  const app = OS.apps.byId.paint;
  const NAME = '画图 AI版', UNTITLED = '未命名';
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const L = {
    menus: ['文件(F)', '编辑(E)', '查看(V)', '图像(I)', '颜色(C)', 'AI(A)', '帮助(H)'],
    status: '要获得帮助，请在"帮助"菜单中，单击"帮助主题"。',
    undo4: '画图只能撤销 3 次。\n人生一次都不能。',
    props: '宽度：300 像素\n高度：190 像素\n颜色：彩色\n纸就这么大，家里穷。',
    help: '画图帮助：拿手指画就行。\n画得不好，是你的问题。',
    about: '画图 AI版\n人工智能，智能地画图。\n(C) ' + OS.YEAR + ' 无聊科技',
    noWatermark: '请购买画图 AI版 专业版。',
    ask: n => '要保存对 ' + n + ' 的更改吗？',
    texts: ['到此一游', '我的作品', '某某某是猪'], selfType: '自己输入…', typeAsk: '写点什么：',
    // AI
    thinking: '正在用人工智能分析您的作品……\n已调用 1 台电脑的算力',
    aiTitle: '智能识别',
    blank: '这是：一张白纸\n人工智能也不知道你想画什么',
    hair: '这是：一根头发\n准确率：99%',
    abstract: '这是：抽象派大师作品\n估价：0.5 元',
    guess: x => '这是：' + x + '\n准确率：99%',
    GUESS: { yellow: '土豆', green: '西兰花', red: '番茄炒蛋', black: '一碗面条', blue: '游泳池里的土豆' },
    potato: '土豆',
    pretty: '★我的作品★', prettyDone: '美化完成。',
    nonMain: '伱鈈慬莪哋惢', nonMainDone: '已转换为非主流风格。',
    completeDone: '补全完成。根据大数据，您的画缺一只羊。',
    watermark: '画图 AI版 免费版',
    // 存
    saveTitle: '另存为', saveName: '文件名：', saveWhere: '保存在：', saveType: '保存类型：', typeName: '24 位位图 (*.bmp)',
    nameEmpty: '文件名不能是空的。', sysTaken: '保存失败：这是系统送的图，不能覆盖。\n换个名字吧。', replace: n => n + ' 已存在。\n要替换它吗？',
    openTitle: '打开', noPics: '我的图片里什么都没有。',
    // 油漆桶要溢出来了
    fill6: '油漆桶有点满了。', fill7: '油漆桶要溢出来了！'
  };
  const BSOD = { id: 'paint', name: 'PAINT_SPILLED', text: '油漆洒出来了，把显示器糊住了。' };
  const CW = 300, CH = 190, UNDO_MAX = 3, SPILL_AT = 8;
  // 那几年画图下面那 28 个颜色
  const PALETTE = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'];
  // 颜色 ▸ 编辑颜色… 里多的那些
  const MORE = ['#ff8080', '#ffff80', '#80ff80', '#00ff80', '#80ffff', '#0080ff', '#ff80c0', '#ff80ff', '#ff0000', '#ffff00', '#80ff00', '#00ff40', '#00ffff', '#0080c0', '#8080c0', '#ff00ff',
    '#804040', '#ff8040', '#00ff00', '#008080', '#004080', '#8080ff', '#800040', '#ff0080', '#800000', '#ff8000', '#008000', '#008040', '#0000ff', '#0000a0', '#800080', '#8000ff',
    '#400000', '#804000', '#004000', '#004040', '#000080', '#000040', '#400040', '#400080', '#000000', '#808000', '#808040', '#808080', '#408080', '#c0c0c0', '#400040', '#ffffff'];
  // 工具：[名字, 显示的字]；小图标是 Codex 画的 assets/paint/tools.webp（12 帧横排，顺序就是这个）
  const TOOLS = [['select', '选择'], ['eraser', '橡皮'], ['fill', '油漆桶'], ['pick', '取色'], ['zoom', '放大镜'], ['pencil', '铅笔'],
    ['brush', '刷子'], ['spray', '喷枪'], ['text', '文字'], ['line', '直线'], ['rect', '矩形'], ['ellipse', '椭圆']];
  // 一键美化的贴纸（Codex 画的）：七彩边框 600×380 ／ 星星 4 帧 32×32 ／ ★我的作品★ 220×56；没加载完就用代码画的顶着
  const ART = {};
  ['frame', 'stars', 'sticker'].forEach(n => { const im = new Image(); im.src = 'assets/paint/' + n + '.webp'; ART[n] = im; });
  const ready = im => im.complete && im.naturalWidth > 0;
  // 粗细：每个工具自己的几档
  const SIZES = { brush: [2, 4, 7], line: [1, 2, 3, 5], eraser: [4, 8, 12], spray: [6, 10, 16], rect: ['空心', '带边', '实心'], ellipse: ['空心', '带边', '实心'] };

  /* ================= 主窗口 ================= */
  let inst = null;
  app.open = () => openWin(null);
  function openWin(nd) {
    if (inst && !inst.win.isClosed) { OS.wm.focus(inst.win); if (nd) inst.openNode(nd); return inst.win; }
    inst = build();
    if (nd) inst.openNode(nd);
    return inst.win;
  }

  function build() {
    let tool = 'pencil', lastTool = 'pencil', fg = '#000000', bg = '#ffffff', zoom = 1;
    const size = { brush: 1, line: 0, eraser: 1, spray: 1, rect: 0, ellipse: 0 };   // 存的是第几档
    let undo = [], dirty = false, strokes = 0, file = null, busy = false;
    let fillChain = { n: 0, last: null };
    let sel = null;   // 选择工具：{ x, y, w, h, data（拎起来的像素）, lifted }
    let clip = null;  // 剪贴板：ImageData
    const show = { tools: true, pal: true, status: true };

    const cv = el('canvas', { class: 'pt-cv' });
    const ov = el('canvas', { class: 'pt-ov' });
    cv.width = ov.width = CW; cv.height = ov.height = CH;
    const g = cv.getContext('2d'), o = ov.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, CW, CH);
    const paper = el('div', { class: 'pt-paper' }, [cv, ov]);
    const scroll = el('div', { class: 'pt-scroll' }, [paper]);
    const toolBox = el('div', { class: 'pt-tools' });
    const opts = el('div', { class: 'pt-opts' });
    const box = el('div', { class: 'pt-box' }, [toolBox, opts]);
    const fgEl = el('div', { class: 'pt-fg' }), bgEl = el('div', { class: 'pt-bg' });
    const colors = el('div', { class: 'pt-colors' });
    const pal = el('div', { class: 'pt-pal' }, [el('div', { class: 'pt-cur' }, [bgEl, fgEl]), colors]);
    const stLeft = el('span', { class: 'pt-st-l', text: L.status }), stRight = el('span', { class: 'pt-st-r' });
    const status = el('div', { class: 'pt-status' }, [stLeft, stRight]);
    const content = el('div', { class: 'pt' }, [OS.ui.menuBar(L.menus, menuFor, 'pt-mbar'), el('div', { class: 'pt-mid' }, [box, scroll]), pal, status]);
    const win = OS.wm.open({ title: title(), icon: 'paint', width: 452, height: 300, appId: app.id, content, center: true,
      beforeClose: () => { if (busy) return false; if (!dirty) return true; askSave(() => win.close()); return false; } });
    win.closed.then(() => { if (inst && inst.win === win) inst = null; stopSpray(); });
    win.filePath = () => (file ? file.path : null);   // 磁盘清理（cleanup.js）删了这张画：窗口直接关掉

    function title() { return (file ? file.name : UNTITLED) + ' - ' + NAME; }
    function setDirty() { dirty = true; }
    let stTimer = 0;
    function note(t) { stLeft.textContent = t; clearTimeout(stTimer); stTimer = setTimeout(() => { stLeft.textContent = L.status; }, 5000); }

    /* ---------- 工具箱、颜料盒 ---------- */
    function drawTools() {
      toolBox.textContent = '';
      TOOLS.forEach(([id, label], i) => {
        const b = el('button', { class: 'pt-tool' + (tool === id ? ' on' : ''), title: label }, [el('span', { class: 'pt-ti', style: { backgroundPosition: (-i * 16) + 'px 0' } })]);
        b.addEventListener('click', () => { OS.sound.play('click'); setTool(id); });
        toolBox.appendChild(b);
      });
      drawOpts();
    }
    function drawOpts() {
      opts.textContent = '';
      const list = SIZES[tool];
      if (!list) return;
      list.forEach((v, i) => {
        const b = el('div', { class: 'pt-opt' + (size[tool] === i ? ' on' : '') });
        if (typeof v === 'number') b.appendChild(el('span', { class: 'pt-dot', style: { width: Math.min(14, v + 1) + 'px', height: Math.min(14, tool === 'line' ? v : v + 1) + 'px', borderRadius: tool === 'line' ? '0' : '50%' } }));
        else b.appendChild(el('span', { class: 'pt-shape pt-' + i }));
        b.addEventListener('click', () => { size[tool] = i; drawOpts(); });
        opts.appendChild(b);
      });
    }
    function setTool(id) {
      commitSel();
      if (id === 'zoom') { setZoom(zoom === 1 ? 4 : 1); return; }
      if (id === 'pick') lastTool = tool;
      tool = id;
      drawTools();
      ov.style.cursor = id === 'text' ? 'text' : 'crosshair';
    }
    function setZoom(z) {
      zoom = z;
      cv.style.width = ov.style.width = (CW * z) + 'px';
      cv.style.height = ov.style.height = (CH * z) + 'px';
      paper.classList.toggle('big', z > 1);
      drawSel();
    }
    function drawPal() {
      colors.textContent = '';
      PALETTE.forEach(c => {
        const sw = el('div', { class: 'pt-sw', style: { background: c } });
        sw.addEventListener('click', () => { fg = c; drawCur(); });
        OS.ui.onContext(sw, () => { bg = c; drawCur(); return null; });   // 长按 / 右键 = 背景色
        colors.appendChild(sw);
      });
      drawCur();
    }
    function drawCur() { fgEl.style.background = fg; bgEl.style.background = bg; }

    /* ---------- 撤销：只能 3 次 ---------- */
    function snap() {
      undo.push(g.getImageData(0, 0, CW, CH));
      if (undo.length > UNDO_MAX) undo.shift();
    }
    function doUndo() {
      commitSel();
      if (!undo.length) { if (dirty) OS.ui.dialog({ title: NAME, icon: 'warn', text: L.undo4 }); return; }
      g.putImageData(undo.pop(), 0, 0);
      setDirty();
    }

    /* ---------- 手指在纸上 ---------- */
    const pos = e => {
      const r = OS.stage.rectOf(cv), p = OS.stage.toLocal(e.clientX, e.clientY);
      return { x: Math.floor((p.x - r.left) / r.width * CW), y: Math.floor((p.y - r.top) / r.height * CH) };
    };
    const inside = p => p.x >= 0 && p.y >= 0 && p.x < CW && p.y < CH;
    // 铅笔：一个像素一个像素地点（不糊边）
    function plotLine(x0, y0, x1, y1, w, color) {
      g.fillStyle = color;
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx - dy, x = x0, y = y0, guard = 0;
      while (guard++ < 2000) {
        g.fillRect(x - Math.floor(w / 2), y - Math.floor(w / 2), w, w);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
    }
    let drag = null, sprayT = 0;
    function stopSpray() { clearInterval(sprayT); sprayT = 0; }
    ov.addEventListener('pointerdown', e => {
      if (busy || (e.button != null && e.button > 0)) return;
      e.preventDefault();
      const p = pos(e);
      try { ov.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      stRight.textContent = p.x + ',' + p.y;
      if (tool === 'text') { askText(e, p); return; }
      if (tool === 'pick') { if (inside(p)) { const d = g.getImageData(p.x, p.y, 1, 1).data; fg = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); drawCur(); } setTool(lastTool); return; }
      if (tool === 'fill') { if (inside(p)) bucket(p.x, p.y); return; }
      if (tool === 'select') { selDown(p); return; }
      fillChain = { n: 0, last: null };
      snap();
      strokes++;
      setDirty();
      drag = { start: p, last: p };
      if (tool === 'pencil') plotLine(p.x, p.y, p.x, p.y, 1, fg);
      else if (tool === 'brush') stroke(p, p);
      else if (tool === 'eraser') plotLine(p.x, p.y, p.x, p.y, SIZES.eraser[size.eraser], bg);
      else if (tool === 'spray') { spray(p); sprayT = setInterval(() => drag && spray(drag.last), 40); }
    });
    ov.addEventListener('pointermove', e => {
      const p = pos(e);
      if (inside(p)) stRight.textContent = p.x + ',' + p.y;
      if (tool === 'select' && selDrag) { selMove(p); return; }
      if (!drag) return;
      if (tool === 'pencil') plotLine(drag.last.x, drag.last.y, p.x, p.y, 1, fg);
      else if (tool === 'brush') stroke(drag.last, p);
      else if (tool === 'eraser') plotLine(drag.last.x, drag.last.y, p.x, p.y, SIZES.eraser[size.eraser], bg);
      else if (tool === 'line' || tool === 'rect' || tool === 'ellipse') { o.clearRect(0, 0, CW, CH); shape(o, drag.start, p); }
      drag.last = p;
    });
    const up = e => {
      if (tool === 'select' && selDrag) { selUp(); return; }
      if (!drag) return;
      stopSpray();
      if (tool === 'line' || tool === 'rect' || tool === 'ellipse') { o.clearRect(0, 0, CW, CH); shape(g, drag.start, e ? pos(e) : drag.last); }
      drag = null;
    };
    ov.addEventListener('pointerup', up);
    ov.addEventListener('pointercancel', () => up(null));

    function stroke(a, b) {
      g.strokeStyle = fg; g.lineWidth = SIZES.brush[size.brush]; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(a.x + 0.5, a.y + 0.5); g.lineTo(b.x + 0.5, b.y + 0.5); g.stroke();
    }
    function spray(p) {
      const r = SIZES.spray[size.spray];
      g.fillStyle = fg;
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * r;
        g.fillRect(Math.round(p.x + Math.cos(a) * d), Math.round(p.y + Math.sin(a) * d), 1, 1);
      }
      if (Math.random() < 0.3) OS.sound.play('spray');
    }
    function shape(ctx, a, b) {
      ctx.save();
      if (tool === 'line') {
        ctx.strokeStyle = fg; ctx.lineWidth = SIZES.line[size.line]; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y + 0.5); ctx.lineTo(b.x + 0.5, b.y + 0.5); ctx.stroke();
      } else {
        const x = Math.min(a.x, b.x) + 0.5, y = Math.min(a.y, b.y) + 0.5, w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
        const style = size[tool];   // 0 空心 1 带边 2 实心
        ctx.beginPath();
        if (tool === 'rect') ctx.rect(x, y, w, h);
        else ctx.ellipse(x + w / 2, y + h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2);
        if (style === 1) { ctx.fillStyle = bg; ctx.fill(); }
        if (style === 2) { ctx.fillStyle = fg; ctx.fill(); }
        else { ctx.strokeStyle = fg; ctx.lineWidth = 1; ctx.stroke(); }
      }
      ctx.restore();
    }
    // 文字：弹选单写一句
    function askText(e, p) {
      const at = OS.stage.toLocal(e.clientX, e.clientY);
      const put = t => { if (!t) return; snap(); strokes++; setDirty(); g.fillStyle = fg; g.font = '14px SimSun, "宋体", serif'; g.textBaseline = 'top'; g.fillText(t, p.x, p.y); };
      OS.ui.contextMenu(L.texts.map(t => ({ label: t, action: () => put(t) })).concat(['-', { label: L.selfType, action: () => OS.explorer.askText('文字', L.typeAsk, '', put) }]), at.x, at.y);
    }

    /* ---------- 油漆桶（连着倒 8 桶、每桶换颜色 → 洒了 → 蓝屏） ---------- */
    function bucket(x, y) {
      const img = g.getImageData(0, 0, CW, CH), d = img.data;
      const i0 = (y * CW + x) * 4, tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2];
      const c = hexRgb(fg);
      if (tr === c[0] && tg === c[1] && tb === c[2]) return;
      snap();
      const stack = [[x, y]], seen = new Uint8Array(CW * CH);
      while (stack.length) {
        const [px, py] = stack.pop();
        if (px < 0 || py < 0 || px >= CW || py >= CH) continue;
        const k = py * CW + px;
        if (seen[k]) continue;
        const i = k * 4;
        if (d[i] !== tr || d[i + 1] !== tg || d[i + 2] !== tb) continue;
        seen[k] = 1;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
        stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
      }
      g.putImageData(img, 0, 0);
      strokes++;
      setDirty();
      OS.sound.play('splash');
      if (fg !== fillChain.last) { fillChain.n++; fillChain.last = fg; }
      if (fillChain.n === 6) note(L.fill6);
      if (fillChain.n === 7) note(L.fill7);
      if (fillChain.n >= SPILL_AT) spill();
    }
    function spill() {
      busy = true;
      const r = OS.stage.rectOf(cv);
      const goo = el('div', { class: 'pt-spill', style: { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', background: fg } });
      document.getElementById('overlay').appendChild(goo);
      OS.sound.play('squish');
      requestAnimationFrame(() => requestAnimationFrame(() => { goo.classList.add('go'); }));
      setTimeout(() => { goo.remove(); OS.ui.bsod(BSOD); }, 1700);
    }

    /* ---------- 选择：框一块，拖着挪；编辑菜单能剪切 / 复制 / 粘贴 / 清除 ---------- */
    let selDrag = null;
    function selDown(p) {
      if (sel && p.x >= sel.x && p.y >= sel.y && p.x < sel.x + sel.w && p.y < sel.y + sel.h) {
        if (!sel.lifted) { snap(); sel.data = g.getImageData(sel.x, sel.y, sel.w, sel.h); g.fillStyle = bg; g.fillRect(sel.x, sel.y, sel.w, sel.h); sel.lifted = true; setDirty(); }
        selDrag = { mode: 'move', from: p, x0: sel.x, y0: sel.y };
        return;
      }
      commitSel();
      selDrag = { mode: 'new', from: p };
      sel = { x: p.x, y: p.y, w: 1, h: 1, lifted: false };
      drawSel();
    }
    function selMove(p) {
      if (selDrag.mode === 'move') { sel.x = selDrag.x0 + p.x - selDrag.from.x; sel.y = selDrag.y0 + p.y - selDrag.from.y; }
      else {
        const x = OS.clamp(Math.min(p.x, selDrag.from.x), 0, CW - 1), y = OS.clamp(Math.min(p.y, selDrag.from.y), 0, CH - 1);
        sel.x = x; sel.y = y;
        sel.w = Math.max(1, Math.min(CW - x, Math.abs(p.x - selDrag.from.x)));
        sel.h = Math.max(1, Math.min(CH - y, Math.abs(p.y - selDrag.from.y)));
      }
      drawSel();
    }
    function selUp() { if (selDrag && selDrag.mode === 'new' && sel.w < 3 && sel.h < 3) sel = null; selDrag = null; drawSel(); }
    function drawSel() {
      o.clearRect(0, 0, CW, CH);
      if (!sel) return;
      if (sel.lifted && sel.data) o.putImageData(sel.data, sel.x, sel.y);
      o.save(); o.setLineDash([3, 2]); o.strokeStyle = '#000'; o.lineWidth = 1; o.strokeRect(sel.x + 0.5, sel.y + 0.5, sel.w - 1, sel.h - 1); o.restore();
    }
    function commitSel() {
      if (sel && sel.lifted && sel.data) { g.putImageData(sel.data, sel.x, sel.y); setDirty(); }
      sel = null; selDrag = null;
      o.clearRect(0, 0, CW, CH);
    }
    const selData = () => (sel ? (sel.lifted ? sel.data : g.getImageData(sel.x, sel.y, sel.w, sel.h)) : null);
    function clearSel() { if (!sel) return; if (!sel.lifted) { snap(); g.fillStyle = bg; g.fillRect(sel.x, sel.y, sel.w, sel.h); } sel = null; drawSel(); setDirty(); }
    function paste() {
      if (!clip) return;
      commitSel();
      snap();
      tool = 'select'; drawTools();
      sel = { x: 0, y: 0, w: clip.width, h: clip.height, data: clip, lifted: true };
      drawSel();
      setDirty();
    }

    /* ---------- AI ---------- */
    function aiBusy(done) {
      busy = true;
      const fill = el('div', { class: 'cp-pfill' });
      const w = OS.wm.open({ title: L.aiTitle, icon: 'paint', width: 240, modal: true, taskbar: false, minimizable: false, maximizable: false, closable: false, className: 'is-dialog',
        content: el('div', { class: 'cp-busy pt-busy' }, [el('div', { text: L.thinking }), el('div', { class: 'cp-pbar' }, [fill])]) });
      requestAnimationFrame(() => { fill.style.transition = 'width 1500ms linear'; fill.style.width = '100%'; });
      setTimeout(() => { w.close(); busy = false; done(); }, 1650);
    }
    // 看一眼画：没画 ／ 一笔 ／ 画满了 ／ 哪种颜色多
    function recognize() {
      commitSel();
      aiBusy(() => {
        const d = g.getImageData(0, 0, CW, CH).data;
        const n = { yellow: 0, green: 0, red: 0, black: 0, blue: 0, other: 0 };
        let ink = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], gg = d[i + 1], b = d[i + 2];
          if (r > 240 && gg > 240 && b > 240) continue;
          ink++;
          n[hueOf(r, gg, b)]++;
        }
        const cover = ink / (CW * CH);
        let text;
        if (cover < 0.002) text = L.blank;
        else if (strokes <= 1 && cover < 0.03) text = L.hair;
        else if (cover > 0.6) text = L.abstract;
        else {
          const top = Object.keys(L.GUESS).sort((a, b) => n[b] - n[a])[0];
          text = L.guess(n[top] > ink * 0.3 ? L.GUESS[top] : L.potato);
        }
        OS.ui.dialog({ title: L.aiTitle, icon: 'info', text });
      });
    }
    function beautify() {
      commitSel(); snap(); setDirty();
      if (ready(ART.frame) && ready(ART.stars) && ready(ART.sticker)) {
        g.drawImage(ART.frame, 0, 0, CW, CH);
        for (let i = 0; i < 14; i++) {
          const k = Math.floor(Math.random() * 4), sz = 9 + Math.random() * 9;
          g.drawImage(ART.stars, k * 32, 0, 32, 32, 12 + Math.random() * (CW - 24 - sz), 12 + Math.random() * (CH - 40 - sz), sz, sz);
        }
        g.drawImage(ART.sticker, CW - 122, CH - 40, 110, 28);
        OS.sound.play('ding');
        note(L.prettyDone);
        return;
      }
      const rb = g.createLinearGradient(0, 0, CW, CH);
      ['#ff3b3b', '#ffb03b', '#ffe63b', '#3bdc5a', '#3bb4ff', '#b43bff'].forEach((c, i) => rb.addColorStop(i / 5, c));
      g.save(); g.strokeStyle = rb; g.lineWidth = 8; g.strokeRect(4, 4, CW - 8, CH - 8); g.restore();
      for (let i = 0; i < 16; i++) star(10 + Math.random() * (CW - 20), 10 + Math.random() * (CH - 20), 3 + Math.random() * 5, OS.pick(['#ffe14a', '#ff7ad9', '#ffffff', '#7ae8ff']));
      g.save();
      g.font = 'bold 18px STCaiyun, "华文彩云", SimHei, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'bottom';
      g.lineWidth = 3; g.strokeStyle = '#fff'; g.strokeText(L.pretty, CW - 12, CH - 10);
      g.fillStyle = rb; g.fillText(L.pretty, CW - 12, CH - 10);
      g.restore();
      OS.sound.play('ding');
      note(L.prettyDone);
    }
    function star(x, y, r, c) {
      g.save(); g.translate(x, y); g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath(); g.shadowColor = c; g.shadowBlur = 4; g.fillStyle = c; g.fill(); g.restore();
    }
    function nonMainstream() {
      commitSel(); snap(); setDirty();
      const img = g.getImageData(0, 0, CW, CH), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = OS.clamp((0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2] - 128) * 1.3 + 128, 0, 255);
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      g.putImageData(img, 0, 0);
      g.save();
      g.font = 'bold 22px SimSun, "宋体", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText(L.nonMain, CW / 2, CH / 2);
      g.fillStyle = '#fff'; g.fillText(L.nonMain, CW / 2, CH / 2);
      g.restore();
      OS.sound.play('ding');
      note(L.nonMainDone);
    }
    function complete() {
      commitSel(); snap(); setDirty();
      // 右下角补一只站着的羊（sheep.webp 第一格）
      const pic = OS.desktop.sheepPic, im = pic.img;
      const draw = () => { g.drawImage(im, 0, 0, pic.w, pic.h, CW - 92, CH - 70, 88, 66); OS.sound.play('baa'); note(L.completeDone); };
      if (im.complete && im.naturalWidth) draw(); else im.addEventListener('load', draw, { once: true });
    }

    /* ---------- 图像 ---------- */
    function flip(h, v) {
      commitSel(); snap(); setDirty();
      const c = el('canvas'); c.width = CW; c.height = CH;
      c.getContext('2d').drawImage(cv, 0, 0);
      g.save(); g.translate(h ? CW : 0, v ? CH : 0); g.scale(h ? -1 : 1, v ? -1 : 1); g.drawImage(c, 0, 0); g.restore();
    }
    function invert() {
      commitSel(); snap(); setDirty();
      const img = g.getImageData(0, 0, CW, CH), d = img.data;
      for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; }
      g.putImageData(img, 0, 0);
    }
    function clearAll() { commitSel(); snap(); setDirty(); g.fillStyle = bg; g.fillRect(0, 0, CW, CH); strokes = 0; }
    function editColors() {
      const grid = el('div', { class: 'pt-more' });
      const w = OS.wm.open({ title: '编辑颜色', icon: 'paint', width: 200, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
        content: el('div', { class: 'pt-edit' }, [el('div', { class: 'pt-edit-h', text: '基本颜色：' }), grid]) });
      MORE.forEach(c => {
        const sw = el('div', { class: 'pt-sw', style: { background: c } });
        sw.addEventListener('click', () => { OS.sound.play('click'); fg = c; drawCur(); w.close(); });
        grid.appendChild(sw);
      });
    }

    /* ---------- 文件 ---------- */
    function askSave(done) {
      if (!dirty) { done(); return; }
      OS.ui.dialog({ title: NAME, icon: 'warn', text: L.ask(file ? file.name : UNTITLED), buttons: ['是', '否', '取消'] }).then(v => {
        if (v === '否') { dirty = false; done(); } else if (v === '是') save(false).then(ok => { if (ok) done(); });
      });
    }
    function fresh() {
      commitSel();
      g.fillStyle = '#fff'; g.fillRect(0, 0, CW, CH);
      undo = []; strokes = 0; dirty = false; file = null; fillChain = { n: 0, last: null };
      win.setTitle(title());
    }
    // 打开一张图：缩进 300 × 190 的白纸正中间；系统送的图只能另存为
    function openNode(nd) {
      askSave(() => {
        fresh();
        const put = (src, w, h) => {
          const s = Math.min(1, CW / w, CH / h), dw = Math.round(w * s), dh = Math.round(h * s);
          g.drawImage(src, Math.round((CW - dw) / 2), Math.round((CH - dh) / 2), dw, dh);
        };
        file = { name: nd.name, path: nd.path, own: !!nd.user };
        win.setTitle(title());
        if (nd.img || nd.src) { const im = new Image(); im.onload = () => put(im, im.naturalWidth, im.naturalHeight); im.src = nd.img || nd.src; return; }
        if (OS.abcsee) {
          const a = OS.abcsee.aspect(nd), w = CW, h = Math.round(CW * a);
          const c = el('canvas'); c.width = w; c.height = h;
          OS.abcsee.drawNode(nd, c.getContext('2d'), w, h);
          put(c, w, h);
        }
      });
    }
    function pickOpen() {
      const nodes = FS.list(FS.PICS).filter(n => n.kind === 'jpg' || n.kind === 'bmp')
        .concat(FS.list(FS.PICS).filter(n => n.folder).reduce((a, f) => a.concat(FS.list(f.path).filter(n => n.kind === 'jpg' || n.kind === 'bmp')), []));
      if (!nodes.length) { OS.ui.dialog({ title: L.openTitle, icon: 'info', text: L.noPics }); return; }
      const list = el('div', { class: 'wp-list' });
      const w = OS.wm.open({ title: L.openTitle, icon: 'paint', width: 220, content: el('div', { class: 'wp-pick' }, [list]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      nodes.forEach(n => { const r = el('div', { class: 'wp-li', text: n.name }); r.addEventListener('click', () => { OS.sound.play('click'); w.close(); openNode(n); }); list.appendChild(r); });
      OS.ui.scrollable(list);
    }
    // 存出去的图：免费版右下角加水印
    function exportUrl() {
      commitSel();
      const c = el('canvas'); c.width = CW; c.height = CH;
      const x = c.getContext('2d');
      x.drawImage(cv, 0, 0);
      x.font = '9px SimSun, "宋体", sans-serif'; x.textAlign = 'right'; x.textBaseline = 'bottom';
      x.fillStyle = 'rgba(255, 255, 255, .7)'; x.fillText(L.watermark, CW - 3, CH - 2);
      x.fillStyle = 'rgba(90, 90, 90, .75)'; x.fillText(L.watermark, CW - 4, CH - 3);
      return c.toDataURL('image/png');
    }
    // 保存：自己的图直接存；新图、系统送的图 → 另存为
    function save(asNew) {
      if (!asNew && file && file.own && FS.get(file.path)) {
        FS.setImg(file.path, exportUrl());
        dirty = false;
        return Promise.resolve(true);
      }
      return saveAs();
    }
    function saveAs() {
      return new Promise(resolve => {
        let done = false;
        const finish = v => { if (!done) { done = true; resolve(v); } };
        const input = el('input', { class: 'xl-input pt-name', type: 'text' });
        input.value = file ? file.name.replace(/\.(jpg|bmp)$/i, '') + '.bmp' : UNTITLED + '.bmp';
        const ok = el('button', { class: 'xpbtn default', text: '保存' }), no = el('button', { class: 'xpbtn', text: '取消' });
        const row = (k, v) => el('div', { class: 'ab-rrow' }, [el('span', { text: k }), v]);
        const w = OS.wm.open({ title: L.saveTitle, icon: 'paint', width: 260, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog', onClose: () => finish(false),
          content: el('div', { class: 'ab-reg' }, [row(L.saveWhere, el('div', { class: 'ab-field', text: '我的图片' })), row(L.saveName, input), row(L.saveType, el('div', { class: 'ab-field', text: L.typeName })), el('div', { class: 'dlg-btns' }, [ok, no])]) });
        no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
        ok.addEventListener('click', () => {
          OS.sound.play('click');
          let name = input.value.trim().replace(/[\\/:*?"<>|]/g, '');
          if (!name || name === '.bmp') { OS.ui.dialog({ title: L.saveTitle, icon: 'warn', text: L.nameEmpty }); return; }
          if (!/\.bmp$/i.test(name)) name = name.replace(/\.[^.]*$/, '') + '.bmp';
          const path = FS.join(FS.PICS, name), old = FS.get(path);
          const write = () => {
            const url = exportUrl();
            let nd;
            if (old) { FS.setImg(path, url); nd = FS.get(path); }
            else nd = FS.createFile(FS.PICS, name, 'bmp', { img: url });
            if (!nd) return;   // 满 200 个（createFile 自己弹框）
            file = { name: nd.name, path: nd.path, own: true };
            dirty = false;
            win.setTitle(title());
            finish(true);
            w.close();
          };
          if (old && !old.user) { OS.ui.dialog({ title: L.saveTitle, icon: 'warn', text: L.sysTaken }); return; }
          if (old) { OS.ui.dialog({ title: L.saveTitle, icon: 'warn', text: L.replace(name), buttons: ['是', '否'] }).then(v => { if (v === '是') write(); }); return; }
          write();
        });
      });
    }
    function print() {
      [0, 300, 600].forEach(t => setTimeout(() => OS.sound.play('printer'), t));
      setTimeout(() => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }), 900);
    }

    /* ---------- 菜单 ---------- */
    function menuFor(m) {
      if (busy) return null;
      if (m === L.menus[0]) return [
        { label: '新建', action: () => askSave(fresh) },
        { label: '打开…', action: pickOpen },
        { label: '保存', action: () => save(false) },
        { label: '另存为…', action: () => save(true) },
        '-',
        { label: '打印…', action: print },
        { label: '设为墙纸', action: () => OS.abcsee && OS.abcsee.setWallUrl(exportUrl(), file ? file.name : UNTITLED + '.bmp') },
        '-',
        { label: '退出', action: () => OS.wm.requestClose(win) }
      ];
      if (m === L.menus[1]) return [
        { label: '撤销', action: doUndo },
        '-',
        { label: '剪切', disabled: !sel, action: () => { clip = selData(); clearSel(); } },
        { label: '复制', disabled: !sel, action: () => { clip = selData(); } },
        { label: '粘贴', disabled: !clip, action: paste },
        { label: '清除选定内容', disabled: !sel, action: clearSel },
        { label: '全选', action: () => { commitSel(); tool = 'select'; drawTools(); sel = { x: 0, y: 0, w: CW, h: CH, lifted: false }; drawSel(); } }
      ];
      if (m === L.menus[2]) return [
        { label: '工具箱', checked: show.tools, action: () => { show.tools = !show.tools; box.style.display = show.tools ? '' : 'none'; } },
        { label: '颜料盒', checked: show.pal, action: () => { show.pal = !show.pal; pal.style.display = show.pal ? '' : 'none'; } },
        { label: '状态栏', checked: show.status, action: () => { show.status = !show.status; status.style.display = show.status ? '' : 'none'; } },
        '-',
        { label: '缩放', sub: [{ label: '常规大小', checked: zoom === 1, action: () => setZoom(1) }, { label: '大尺寸', checked: zoom > 1, action: () => setZoom(4) }] }
      ];
      if (m === L.menus[3]) return [
        { label: '翻转/旋转', sub: [{ label: '水平翻转', action: () => flip(true, false) }, { label: '垂直翻转', action: () => flip(false, true) }, { label: '旋转 180°', action: () => flip(true, true) }] },
        { label: '反色', action: invert },
        { label: '属性…', action: say('属性', 'info', L.props) },
        { label: '清除图像', action: clearAll }
      ];
      if (m === L.menus[4]) return [{ label: '编辑颜色…', action: editColors }];
      if (m === L.menus[5]) return [
        { label: '智能识别', action: recognize },
        '-',
        { label: '一键美化', action: beautify },
        { label: '一键非主流', action: nonMainstream },
        { label: '智能补全', action: complete }
      ];
      return [
        { label: '帮助主题', action: say('画图帮助', 'help', L.help) },
        { label: '去水印', action: say(NAME, 'info', L.noWatermark) },
        '-',
        { label: '关于画图 AI版', action: say('关于画图 AI版', 'info', L.about) }
      ];
    }

    drawTools();
    drawPal();
    setZoom(1);
    return { win, openNode };
  }

  /* ================= 小工具 ================= */
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  // 一个像素算哪种颜色（智能识别用）
  function hueOf(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max < 90) return 'black';
    if (max - min < 40) return max < 160 ? 'black' : 'other';
    let h;
    if (max === r) h = ((g - b) / (max - min)) * 60;
    else if (max === g) h = (2 + (b - r) / (max - min)) * 60;
    else h = (4 + (r - g) / (max - min)) * 60;
    if (h < 0) h += 360;
    if (h < 25 || h >= 330) return 'red';
    if (h < 70) return 'yellow';
    if (h < 165) return 'green';
    if (h < 260) return 'blue';
    return 'other';
  }

  /* ================= 给别的地方用 ================= */
  OS.paint = { open: nd => openWin(nd) };
})();

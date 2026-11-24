/* 记事本（开始 ▸ 所有程序 ▸ 附件）：游戏里所有 .txt 都用它打开
   - 写字默认用选单：点白纸弹出几句那年头会写的话，选了一个字一个字“写”进去；最后一项“自己输入…”能真打字。
   - 保存只能存桌面 → 桌面冒出 txt 图标 → 壁纸上的羊走过去吃掉（desktop.js），吃大文件还拉羊粪，刷新扫掉。
     字太多（1000 字以上）保存时窗口 (未响应) → XP“结束程序”框，反正不给存。
   - 联通乱码：文件里只有“联通”两个字，存完再打开是乱码（存到桌面会被羊吃；另存为到我的文档就留得住，从那儿再打开看得到）。
   - 字数上限 9999：左下角一直显示 X/9999；超过就撑爆 → 蓝屏 COPY_PASTE_OVERFLOW（全选 → 复制 → 粘贴一路翻倍最快）。
     超了也不真把那么多字画出来，免得浏览器先卡死 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.notepad;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = '记事本';
  const UNTITLED = '无标题';
  const LINES = ['今天天气很好。', '我要好好学习。', '我再也不玩电脑了。', '作业写完了。骗你的。', '在吗', '联通'];
  const SELF_TYPE = '自己输入…';
  const L = {
    menus: ['文件(F)', '编辑(E)', '格式(O)', '查看(V)', '帮助(H)'],
    openFail: '打开失败：桌面上的文本文档都被羊吃了。',
    page: '纸张大小：作业本',
    undo: '撤销功能需要升级专业版：后悔药 2.0。',
    find: '找不到"作业"。\n你本来也没写。',
    statusGrey: '开着自动换行的时候不让看状态栏。\n这是真的，不信你去问 2003 年的记事本。',
    help: '记事本没什么好帮的。\n想写什么就写什么，反正羊会吃掉。',
    about: '记事本\n版本 2003\n(C) 2003 无聊科技',
    ask: n => '文件 ' + n + ' 的文字已经更改。\n想保存文件吗？',
    netFail: pc => '保存失败：这是 ' + pc + ' 电脑上的文件，人家只给你看，不给你改。',
    roFail: '保存失败：这个文件是只读的。',
    rarFail: '保存失败：压缩包里的文件改了就不灵了。',
    hangTitle: n => '结束程序 - ' + n + ' - 记事本',
    hangText: '此程序没有响应。\n如果选择立即结束此程序，您会丢失所有未保存的信息。',
    hangBtns: ['立即结束', '取消'],
    tooLong: '保存失败。\n字太多了，羊看了一眼，扭头走了。',
    // 羊不在、桌面上已经留着一个 txt 了，再建第二个：用原来桌面“新建失败”那句
    newFailTitle: '新建文本文档',
    newFail: '新建失败：你上次新建的文本文档，到现在已经写了多少字呢？',
    // 羊不在、回收站里躺着一个 txt 时再建（不然建一个扔一个，最后倒出来满桌面都是）
    binFail: '新建失败：上一个文本文档还在回收站里躺着呢。',
    status: (r, c) => '第 ' + r + ' 行，第 ' + c + ' 列'
  };
  const FONTS = ['宋体', '黑体', '火星文'];
  const SAVE_HANG = 1000;          // 这么多字以上，保存就 (未响应)
  const POOP_AT = [100, 300, 600]; // 吃的文件够大才拉羊粪：100 / 300 / 600 字以上，一堆比一堆大
  const PASTE_HANG = 64;           // 粘贴翻到 64 倍卡一下
  const MAX_CHARS = 9999;          // 字数上限：左下角 X/9999，超过就蓝屏
  const BSOD = { id: 'notepad', name: 'COPY_PASTE_OVERFLOW', text: '我倒，你居然用记事本把你家不奔腾搞冒烟了！弓虽！' };
  // 联通乱码：只有“联通”两个字的文本文档，存完再打开就是这个（当年记事本真有这毛病）
  const GARBLED = { '联通': '��ͨ' };
  // 火星文：只是“字体”，改的是显示，原文不动，换回宋体就回来
  const MARS = {
    '你': '伱', '我': '莪', '的': '哋', '了': '孒', '是': '湜', '在': '茬', '有': '侑', '吗': '嗎', '好': '恏', '天': '兲',
    '气': '氣', '很': '佷', '要': '婹', '学': '斈', '习': '習', '不': '鈈', '玩': '琓', '电': '電', '脑': '腦', '再': '侢',
    '也': '吔', '作': '莋', '业': '業', '写': '冩', '完': '唍', '骗': '騙', '今': '妗', '联': '聯', '通': '嗵', '人': '亽',
    '一': '①', '爱': '噯', '心': '惢', '世': '卋', '界': '堺', '懂': '慬', '说': '説', '话': '話', '这': '這', '个': '個',
    '们': '們', '来': '唻', '去': '呿', '吃': '喫', '饭': '飯', '家': '傢', '妈': '媽', '回': '囬', '没': '莈', '就': '僦',
    '都': '嘟', '会': '浍', '还': '還', '和': '啝', '给': '給', '时': '溡', '到': '菿', '上': '仩', '下': '丅', '大': '汏',
    '小': '尛', '多': '哆', '少': '尐', '后': '後', '自': '洎', '么': '庅', '为': '為', '什': '什', '想': '想',
    '开': '閞', '关': '関', '闭': '閉', '设': '設', '统': '統', '网': '網', '络': '絡', '邻': '鄰', '编': '編', '辑': '輯',
    '帮': '幫', '确': '確', '定': '萣', '文': '呅', '档': '檔', '图': '圖', '乐': '樂', '视': '視', '频': '頻', '声': '聲',
    '语': '語', '区': '區', '选': '選', '项': '項', '务': '務', '栏': '欄', '单': '單', '软': '軟', '运': '運', '间': '間',
    '期': '剘', '面': '靣', '收': '荍', '站': '跕', '音': '喑', '新': '噺', '建': '踺', '夹': '夾', '件': '件', '记': '記',
    '事': '倳', '本': '夲', '点': '點', '击': '擊', '请': '請', '欢': '歡', '迎': '迊', '使': '使', '用': '鼡', '快': '赽'
  };
  const toMars = t => t.replace(/[一-龥]/g, ch => MARS[ch] || ch);

  /* ================= 打开 =================
     f: { name, text, where: { type: 'net', pc } | { type: 'rar' } | { type: 'desk' } | { type: 'fs', path } | { type: 'ro', msg },
          link: { line, onClick } } */
  function open(f) {
    f = f || {};
    let name = f.name || UNTITLED, text = f.text || '', where = f.where || null;
    let dirty = false, sel = false, wrap = true, status = false, font = '宋体', clip = '', clipAt = 0, copyBase = 0, hung64 = false, busy = false, typing = false;

    const page = el('div', { class: 'np-page' });
    const ta = el('textarea', { class: 'np-ta', spellcheck: 'false' });
    const cnt = el('span', { class: 'np-count' });
    const rc = el('span', { class: 'np-rc' });
    const st = el('div', { class: 'np-status' }, [cnt, rc]);
    const bar = OS.ui.menuBar(L.menus, menuFor, 'np-mbar');
    const box = el('div', { class: 'np' }, [bar, page, ta, st]);
    const win = OS.wm.open({
      title: title(), icon: 'diary', width: 330, height: 250, content: box, appId: app.id,
      beforeClose: () => { if (busy) { OS.sound.play('ding'); return false; } if (!dirty) return true; askSave(() => win.close()); return false; }
    });
    OS.ui.scrollable(page);
    // 磁盘清理（cleanup.js）删了这个文件：窗口直接关掉
    win.filePath = () => (where && where.type === 'fs' ? where.path : where && where.type === 'desk' ? 'desk:' + name : null);

    function title() { return name + ' - ' + NAME; }
    function setDirty() { dirty = true; }
    function render() {
      const shown = font === '火星文' ? toMars(text) : text;
      page.textContent = '';
      page.classList.toggle('nowrap', !wrap);
      page.classList.toggle('hei', font === '黑体');
      const holder = sel ? el('span', { class: 'np-sel' }) : page;
      if (sel) page.appendChild(holder);
      // 转帖里 shutdown -a 那一行：单独拎出来，能点
      if (f.link && font !== '火星文' && shown.split('\n').indexOf(f.link.line) >= 0) {
        shown.split('\n').forEach((ln, i, arr) => {
          if (ln === f.link.line) {
            const a = el('span', { class: 'np-cmd' + (f.link.done ? ' sel' : ''), text: ln });
            a.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); f.link.done = true; a.classList.add('sel'); f.link.onClick(); });
            holder.appendChild(a);
          } else holder.appendChild(document.createTextNode(ln));
          if (i < arr.length - 1) holder.appendChild(document.createTextNode('\n'));
        });
      } else holder.appendChild(document.createTextNode(shown));
      const rows = text.split('\n');
      rc.textContent = L.status(rows.length, rows[rows.length - 1].length + 1);
      box.classList.toggle('status', status && !wrap);
      showCount(text.length);
    }
    function showCount(n) {
      cnt.textContent = n + '/' + MAX_CHARS;
      cnt.classList.toggle('over', n > MAX_CHARS);
    }
    // 超过 9999 字：数字变红、窗口 (未响应) 一会儿，然后蓝屏（那么多字不往纸上画）
    async function overflow(n) {
      sel = false;
      showCount(n);
      await hang(1800);
      OS.ui.bsod(BSOD);
    }
    render();

    /* ---------- 写字：点白纸弹选单 ---------- */
    let menuClosedAt = 0;
    page.addEventListener('click', e => {
      if (busy || typing || Date.now() - menuClosedAt < 350) return;
      if (e.target.closest('.np-cmd')) return;
      const p = OS.stage.toLocal(e.clientX, e.clientY);
      let picked = false;
      const own = (f.lines || []).map(l => ({ label: l.label, action: () => { picked = true; if (l.replace) replaceAll(l.text); else write(l.text); } }));
      OS.ui.contextMenu(own.concat(own.length ? ['-'] : [], LINES.map(t => ({ label: t, action: () => { picked = true; write(t); } })))
        .concat(['-', { label: SELF_TYPE, action: () => { picked = true; startTyping(); } }]), p.x, p.y, false,
        { onClose: () => setTimeout(() => { if (!picked) menuClosedAt = Date.now(); }, 0) });
    });
    async function write(t) {
      busy = true;
      sel = false;
      const add = (text && !text.endsWith('\n') ? '\n' : '') + t;
      if (text.length + add.length > MAX_CHARS) { overflow(text.length + add.length); return; }
      if (text.length > 3000) { text += add; render(); }
      else for (const ch of add) {
        if (win.isClosed) return;
        text += ch;
        render();
        page.scrollTop = page.scrollHeight;
        if (ch.trim()) OS.sound.play('key');
        await OS.wait(70);
      }
      setDirty();
      busy = false;
    }
    // 整篇换掉（课文.txt 的"全部改成 AAAA…"）：一下子刷刷刷写满
    async function replaceAll(t) {
      busy = true; sel = false; text = '';
      for (let i = 0; i < t.length; i += 12) {
        if (win.isClosed) return;
        text = t.slice(0, i + 12);
        render();
        OS.sound.play('key');
        await OS.wait(30);
      }
      text = t; render(); setDirty(); busy = false;
    }
    // 自己输入：白纸换成真能打字的框，点别处就停
    function startTyping() {
      typing = true;
      sel = false;
      ta.value = text;
      ta.classList.toggle('nowrap', !wrap);
      box.classList.add('typing');
      ta.focus();
      try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (_) { /* ignore */ }
      ta.scrollTop = ta.scrollHeight;
    }
    ta.addEventListener('input', () => {
      const n = ta.value.length;
      showCount(n);
      if (n <= MAX_CHARS) return;
      typing = false;
      ta.value = '';
      box.classList.remove('typing');
      overflow(n);
    });
    ta.addEventListener('blur', () => {
      if (!typing) return;
      typing = false;
      if (ta.value !== text) { text = ta.value; setDirty(); }
      box.classList.remove('typing');
      render();
    });
    // 电脑上：F5 插入时间/日期（真记事本也是 F5）
    function onKey(e) {
      if (win.isClosed || OS.wm.active !== win || busy) return;
      if (e.key === 'F5') { e.preventDefault(); insertTime(); }
    }
    document.addEventListener('keydown', onKey, true);
    win.closed.then(() => document.removeEventListener('keydown', onKey, true));

    /* ---------- 菜单 ---------- */
    function menuFor(m) {
      if (busy) return null;
      if (typing) ta.blur();
      if (m === L.menus[0]) return [
        { label: '新建', action: () => askSave(() => { name = UNTITLED; text = ''; where = null; dirty = false; sel = false; win.setTitle(title()); render(); }) },
        { label: '打开…', action: say(NAME, 'info', L.openFail) },
        { label: '保存', action: () => save(false) },
        { label: '另存为…', action: () => save(true) },
        '-',
        { label: '页面设置…', action: say('页面设置', 'info', L.page) },
        { label: '打印…', action: () => { OS.sound.play('printer'); setTimeout(() => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }), 700); } },
        '-',
        { label: '退出', action: () => OS.wm.requestClose(win) }
      ];
      if (m === L.menus[1]) return [
        { label: '撤销', action: say(NAME, 'warn', L.undo) },
        '-',
        { label: '剪切', disabled: !sel, action: () => { clip = text; clipAt = Date.now(); OS.textClip = { text: clip, at: clipAt }; text = ''; sel = false; setDirty(); render(); } },
        { label: '复制', disabled: !sel, action: () => { clip = text; clipAt = Date.now(); OS.textClip = { text: clip, at: clipAt }; if (!copyBase) copyBase = Math.max(1, clip.length); } },
        { label: '粘贴', disabled: !pasteText(), action: paste },
        { label: '删除', disabled: !sel, action: () => { text = ''; sel = false; setDirty(); render(); } },
        '-',
        { label: '查找…', action: say('查找', 'info', L.find) },
        '-',
        { label: '全选', action: () => { sel = true; render(); } },
        { label: '时间/日期', action: insertTime }
      ];
      if (m === L.menus[2]) return [
        { label: '自动换行', checked: wrap, action: () => { wrap = !wrap; render(); } },
        { label: '字体…', action: pickFont }
      ];
      if (m === L.menus[3]) return [
        wrap ? { label: '状态栏', grey: true, action: say(NAME, 'info', L.statusGrey) }
          : { label: '状态栏', checked: status, action: () => { status = !status; render(); } }
      ];
      return [
        { label: '帮助主题', action: say('记事本帮助', 'help', L.help) },
        '-',
        { label: '关于记事本', action: say('关于记事本', 'info', L.about) }
      ];
    }
    function insertTime() {
      const d = OS.clock.now();
      const s = d.getHours() + ':' + OS.pad2(d.getMinutes()) + ' ' + OS.YEAR + '/' + (d.getMonth() + 1) + '/' + d.getDate();
      if (text.length + s.length > MAX_CHARS) { overflow(text.length + s.length); return; }
      text += s;
      sel = false;
      setDirty();
      render();
      page.scrollTop = page.scrollHeight;
    }
    function pickFont() {
      OS.ui.dialog({ title: '字体', icon: null, text: '字体：' + font, buttons: FONTS }).then(v => {
        if (!v || win.isClosed) return;
        font = v;
        render();
      });
    }

    /* ---------- 粘贴：一律贴在最后面；字数翻到 64 倍卡一下，超过 9999 字撑爆 ---------- */
    // 贴哪个：自己复制的，或者别的软件（计算器）后来复制的，哪个新贴哪个
    function pasteText() { const g = OS.textClip; return g && g.at > clipAt ? g.text : clip; }
    async function paste() {
      const src = pasteText();
      if (!src) return;
      if (text.length + src.length > MAX_CHARS) { overflow(text.length + src.length); return; }
      text += src;
      sel = false;
      setDirty();
      render();
      page.scrollTop = page.scrollHeight;
      const ratio = copyBase ? text.length / copyBase : 0;
      if (ratio >= PASTE_HANG && !hung64) { hung64 = true; await hang(2000); unhang(); }
    }
    function hang(ms) {
      busy = true;
      win.setTitle(title() + ' (未响应)');
      win.el.classList.add('np-hung');
      return OS.wait(ms);
    }
    function unhang() {
      busy = false;
      if (win.isClosed) return;
      win.setTitle(title());
      win.el.classList.remove('np-hung');
    }

    /* ---------- 保存 ---------- */
    // 关窗口 / 新建 时字改过：问要不要存；done = 存好了 / 不存，接着干
    function askSave(done) {
      if (!dirty) { done(); return; }
      OS.ui.dialog({ title: NAME, icon: 'warn', text: L.ask(name), buttons: ['是', '否', '取消'] }).then(v => {
        if (v === '否') { dirty = false; done(); }
        else if (v === '是') save(false).then(ok => { if (ok) done(); });
      });
    }
    // 返回 Promise<bool>：存上了没有（存上 = 放到桌面让羊吃）
    async function save(asNew) {
      if (text.length >= SAVE_HANG) { await saveHang(); return false; }
      if (!asNew && where && where.type === 'net') { await OS.ui.dialog({ title: NAME, icon: 'error', text: L.netFail(where.pc) }); return false; }
      if (!asNew && where && where.type === 'rar') { await OS.ui.dialog({ title: NAME, icon: 'error', text: L.rarFail }); return false; }
      if (!asNew && where && where.type === 'ro') { await OS.ui.dialog({ title: NAME, icon: 'error', text: where.msg || L.roFail }); return false; }
      // 我的文档里的文件：直接存回去（不算新建，不占名额）
      if (!asNew && where && where.type === 'fs' && OS.fs.get(where.path)) { OS.fs.setText(where.path, text); dirty = false; return true; }
      const ext = '.txt';
      const pick = (!asNew && where && where.type === 'desk') ? { name, place: 'desk' } : await saveAs(new RegExp('\\' + ext + '$').test(name) ? name : name + ext);
      if (!pick || win.isClosed) return false;
      const fname = pick.name;
      if (pick.place === 'docs') {
        // 存进我的文档：羊吃不到，存档记着；同名的自己的文件直接覆盖
        const same = OS.fs.get(OS.fs.join(OS.fs.MYDOCS, fname));
        let node;
        if (same && same.user) { OS.fs.setText(same.path, text); node = same; }
        else node = OS.fs.createFile(OS.fs.MYDOCS, fname, 'txt', { text });
        if (!node) return false;
        name = node.name;
        where = { type: 'fs', path: node.path };
        dirty = false;
        win.setTitle(title());
        return true;
      }
      if (!(await toDesktop(fname, text, true))) return false;
      name = fname;
      where = { type: 'desk' };
      dirty = false;
      win.setTitle(title());
      return true;
    }
    // 字太多：(未响应) → XP 的“结束程序”框
    async function saveHang() {
      await hang(3000);
      if (win.isClosed) return;
      const v = await OS.ui.dialog({ title: L.hangTitle(name), icon: 'warn', text: L.hangText, buttons: L.hangBtns });
      if (win.isClosed) return;
      if (v === L.hangBtns[0]) { busy = false; dirty = false; win.close(); return; }
      unhang();
      await OS.ui.dialog({ title: NAME, icon: 'error', text: L.tooLong });
    }
    return win;
  }

  /* ================= 另存为：保存在 桌面 ／ 我的文档（点那一格选） ================= */
  function saveAs(fname) {
    return new Promise(resolve => {
      let place = 'desk';
      const row = (k, v, cls) => el('div', { class: 'np-sa-row' }, [el('span', { class: 'np-sa-k', text: k }), el('div', { class: 'np-sa-v' + (cls ? ' ' + cls : '') }, v)]);
      const ok = el('button', { class: 'xpbtn default', text: '保存' });
      const no = el('button', { class: 'xpbtn', text: '取消' });
      const placeIco = el('span', { class: 'np-sa-icowrap' }, [OS.iconEl('computer', 'np-sa-ico')]);
      const placeTxt = el('span', { text: '桌面' });
      const where = row('保存在：', [placeIco, placeTxt, el('i', { class: 'np-sa-arrow' })], 'drop');
      const setPlace = p => { place = p; placeTxt.textContent = p === 'docs' ? '我的文档' : '桌面'; placeIco.textContent = ''; placeIco.appendChild(OS.iconEl(p === 'docs' ? 'mydocs' : 'computer', 'np-sa-ico')); };
      where.querySelector('.np-sa-v').addEventListener('click', e => {
        e.stopPropagation();
        OS.sound.play('click');
        const r = OS.stage.rectOf(e.currentTarget), pt = { x: r.left, y: r.bottom };
        OS.ui.contextMenu([{ label: '桌面', icon: 'computer', checked: place === 'desk', action: () => setPlace('desk') }, { label: '我的文档', icon: 'mydocs', checked: place === 'docs', action: () => setPlace('docs') }], pt.x, pt.y);
      });
      const content = el('div', { class: 'np-sa' }, [
        where,
        row('文件名：', [el('span', { text: fname })]),
        row('保存类型：', [el('span', { text: '文本文档(*.txt)' }), el('i', { class: 'np-sa-arrow' })], 'drop'),
        el('div', { class: 'dlg-btns' }, [ok, no])
      ]);
      let v = null;
      const w = OS.wm.open({ title: '另存为', width: 260, content, modal: true, taskbar: false, minimizable: false, maximizable: false, onClose: () => resolve(v) });
      ok.addEventListener('click', () => { OS.sound.play('click'); v = { name: fname, place }; w.close(); });
      no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    });
  }

  /* ================= 存到桌面 → 羊来吃 ================= */
  const poopLevel = n => POOP_AT.filter(k => n >= k).length;
  // 再打开桌面上的文件：联通乱码
  const reopen = raw => (GARBLED[raw] != null ? GARBLED[raw] : raw);
  // 返回 Promise<bool>。羊不在：桌面上加回收站里一共最多一个 txt；记事本保存同名的直接覆盖（overwrite），别的第二个就“新建失败”
  // o：写字板存的 rtf / doc 用自己的打开方式、图标；文章里插了羊的，羊不吃
  async function toDesktop(fname, raw, overwrite, o) {
    o = o || {};
    const replacing = overwrite && !OS.desktop.sheepHere() && OS.desktop.tempFiles().some(x => x.name === fname);
    if (!replacing && !OS.fs.room()) { await OS.fs.capFail(); return false; }
    if (!OS.desktop.sheepHere()) {
      const left = OS.desktop.tempFiles();
      const same = overwrite && left.find(x => x.name === fname);
      if (same) OS.desktop.removeFile(same.id);
      else if (left.length) { await OS.ui.dialog({ title: L.newFailTitle, icon: 'warn', text: L.newFail }); return false; }
      else if (OS.desktop.tempFiles(true).length) { await OS.ui.dialog({ title: L.newFailTitle, icon: 'warn', text: L.binFail }); return false; }
    }
    OS.desktop.addFile({
      name: fname, icon: o.icon || 'txt', poop: poopLevel(raw.length), sheepInside: !!o.sheepInside,
      open: o.open || (() => open({ name: fname, text: reopen(raw), where: { type: 'desk' } })),
      menu: fid => {
        const P = OS.menus.iconParts(OS.apps.byId[fid]);
        return [P.open, '-', P.cut, P.copy, '-', P.shortcut, P.del, P.rename, '-',
          { label: '属性', action: say(fname + ' 属性', 'info', '类型：' + (o.typeName || '文本文档') + '\n大小：' + raw.length * 2 + ' 字节\n位置：桌面，羊的嘴边') }];
      }
    });
    return true;
  }

  app.open = () => open();
  OS.notepad = {
    open,
    garble: reopen,   // 联通乱码（我的文档里的文件再打开也用）
    toMars,           // 火星文（写字板的火星文字体也用）
    toDesktop,        // 存到桌面让羊吃（写字板也用）
    // 桌面右键 ▸ 新建 ▸ 文本文档：还没来得及打开就被羊吃了
    newOnDesktop: () => toDesktop('新建 文本文档.txt', '')
  };
})();

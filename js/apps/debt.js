/* 欠条打印专家 2003.xls（原名“塑料兄弟欠款单”；称呼都不分男女，用的人不一定是男生）
   一个 .xls（收在「新建文件夹(2)」最外面那层），双击用山寨表格软件「Excuse 2003」打开：一张做好的“欠款明细单”模板。
   表格日期、欠条上的还款期限和落款，都填打开那天（限今天还清）。
   - 欠款人从下拉框里选（不用打字）；也可以选“自己输入…”，弹个小框打名字。点［Σ 一键算账］：一格一格填出离谱的账，合计永远 250。
   - 点格子：左上角显示格子名，公式栏显示公式（比如 =SUM(D4:D10)）。
   - ［打印欠条］：打印机滋滋响，出一张欠条，盖个红手印。
   - 小算盘：仿 Office 小助手那种的原创角色（一把长着大眼睛的算盘，Codex 画的 13 帧），蹲在右下角，不请自来地插嘴；
     会眨眼、东张西望、拨算盘、挥手，没人理会睡着，账算爆了会晕。红手印也是 Codex 画的。
   - 蓝屏彩蛋：算完再狠狠点［一键算账］= 利滚利，每点一次金额翻倍；格子装不下变成 #####；
     翻到一百万蓝屏 DEBT_OVERFLOW。
   - ［发到群里］：发到抠抠2003 的班级群（koukou.js），被写在欠条上的人退群 / 拉黑你，记进“绝交名单”那页。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.debt;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const SOFT = 'Excuse 2003';
  const TITLE = 'Excuse 2003 - ' + app.name;
  // 菜单栏：每个都能点开（照真的表格软件）；[菜单名, [[项, 点了说的话] 或 特殊项 ...]]
  const MENU_JOKES = {
    '编辑(E)': [['撤销', '欠款不能撤销。'], ['查找…', '欠你钱的人一般找不到。']],
    '视图(V)': [['全屏显示', '这么点单元格还值得您全屏观看吗？']],
    '插入(I)': [['函数…', '本表格只有一个函数：\n=SUM(对方的良心)\n目前返回 0。']],
    '格式(O)': [['单元格…', '格式已经很正式了，\n对方看了会害怕的。']],
    '工具(T)': [['选项…', '没有“免除欠款”这个选项。']],
    '数据(D)': [['排序…', '已按“谁欠得多”排好了。']],
    '窗口(W)': [['新建窗口', '一张欠条一个窗口，\n够用了。']]
  };
  const MENU_ORDER = ['文件(F)', '编辑(E)', '视图(V)', '插入(I)', '格式(O)', '工具(T)', '数据(D)', '窗口(W)', '帮助(H)'];
  const M_PRINT = '打印欠条', M_QUIT = '退出', M_CLEAR = '清除内容';
  const M_HELP = 'Excuse 帮助', M_PAL_SHOW = '显示小算盘', M_PAL_HIDE = '隐藏小算盘', M_ABOUT = '关于 Excuse 2003';
  const ABOUT = 'Excuse 2003\n版本 2003.2.30\n专为要账设计。\n本产品授权给：被欠钱的你';
  const HEAD = '欠 款 明 细 单';
  // 日期都填打开那天（表格 D2、欠条上的还款期限和落款）：限今天还清
  const today = () => { const d = OS.clock.now(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; };
  const DATE = () => { const t = today(); return OS.YEAR + '/' + t.m + '/' + t.d; };
  const DATE_CN = () => { const t = today(); return OS.YEAR + ' 年 ' + t.m + ' 月 ' + t.d + ' 日'; };
  const COLS = ['A', 'B', 'C', 'D', 'E'];
  const COL_W = [28, 190, 52, 74, 58];
  const ROWS = 12;
  const DEBTORS = ['同桌', '上铺的室友', '发小', '隔壁班的', '班长', '网友“轻舞飞扬”', '楼下小卖部老板'];
  const CUSTOM = '自己输入…';
  const ASK_NAME = '欠款人的名字：';
  const NAME_MAX = 8;
  const PICK_ONE = '（请选择）';
  // 账目：[事由, 数量, 金额, 公式栏里显示的公式]
  const ITEMS = [
    ['2003 年借你一块橡皮（按复利算）', '1 块', 38.6, '=0.5*(1+15%)^31'],
    ['陪你等公交（误工费）', '15 分钟', 12, '=15*0.8'],
    ['听你讲失恋的事', '3 小时', 90, '=3*30'],
    ['借你抄作业（知识产权费）', '1 次', 20, '=知识产权费'],
    ['呼吸了你身边的空气', '3 口', 15, '=3*5'],
    ['你心里暗骂我一次（精神损失费）', '1 次', 50, '=50'],
    ['替你值日', '1 次', 12, '=12'],
    ['借你 MP3 听了一下午', '1 下午', 25, '=25'],
    ['你吃了我半包干脆面（还拿走了卡片）', '半包', 5.5, '=0.5*1.1*10'],
    ['你借我的 VCD 碟片还没还', '1 张', 35, '=35'],
    ['你用我的 IC 电话卡打了 10 分钟', '10 分钟', 6, '=10*0.6'],
    ['帮你给隔壁班的递纸条', '2 次', 16, '=2*8']
  ];
  const PICKS = 6;                  // 每次挑几条账，再加一行凑整
  const TOTAL = 250;
  const ROUND = ['四舍五入凑个整（不接受还价）', '1 次'];
  const BIG_MAX = 9;                // 金额超过这么多位，格子装不下，显示 #####
  const BSOD_AT = 1000000;          // 利滚利到一百万就蓝屏
  const BSOD = { id: 'debt', name: 'DEBT_OVERFLOW', text: '欠款金额超出了 Excuse 能表示的最大数字，建议直接绝交。' };

  // 欠条
  const SLIP_TITLE = '欠　条';
  const SLIP_TEXT = (to, big, num) => '今欠到　' + to + '　下列款项，共计人民币' + big + '（¥' + num + '），限 ' + DATE_CN() + '前还清。';
  const SLIP_LIST = '明细如下：';
  const SLIP_SUM = '合计';
  const SLIP_SIGN = who => '欠款人：' + who;
  const SLIP_NOTE = '（手印是你替对方按的）';
  const SLIP_POST = '发到群里';
  const SLIP_POSTED = '已经发过了。\n再发一次，全班就都看见两遍了。';
  // “绝交名单”那页：欠条发到抠抠群里之后，退群 / 拉黑你的人记在这（重启就和好）
  const GONE_NONE = '绝交名单是空的。\n你还有朋友。（暂时）';
  const GONE_LIST = list => '绝交名单：\n' + list.map(g => g.name + '（' + g.why + '）').join('\n');
  const SLIP_DATE = DATE_CN;

  // 小算盘说的话
  const PAL = {
    hello: '看起来你在写欠条。\n需要帮助吗？',
    helpYes: '帮我把账算狠一点',
    helpNo: '不用了，我自己来',
    didHelp: '已经帮你把账算到最狠了。',
    noHelp: '好的。\n（我会一直看着你的）',
    pickFirst: '先在 B2 选一个欠款人。',
    calcFirst: '先点「一键算账」，再打印。',
    back: '我又回来了。',
    wake: '我没睡！\n我在帮你算利息。',
    alone: '目前只有小算盘一个助手。\n它很孤独。',
    names: {
      '同桌': '同桌最好要了，抬头不见低头见。',
      '上铺的室友': '选得好，人家最近刚发了生活费。',
      '发小': '发小的账，从幼儿园算起。',
      '隔壁班的': '你们连话都没说过几句吧？',
      '班长': '班长的账你也敢算？\n（你班费交了吗）',
      '网友“轻舞飞扬”': '网友的账，等见了面再要。\n（你们见不到的）',
      '楼下小卖部老板': '……应该是你欠人家吧？'
    },
    custom: '这位我不认识，\n但账照算。',
    tips: [
      '小提示：借钱给朋友之前，\n请先打印好欠条。',
      '小提示：按 F1 没有用。',
      '小提示：本表格的合计永远是 250，\n这不是 bug。',
      '小提示：要账的最佳时机是\n对方刚发生活费的那天。'
    ],
    rolls: { 2: '利滚利模式已开启。', 5: '这账已经比你俩的友谊还长了。', 10: '格子装不下了，\n显示成 ##### 是正常的。', 12: '再点我就算不过来了！' }
  };
  const HIDE_MS = 20000;

  const TOOL_JOKES = {
    new: say(SOFT, 'info', '一张欠条还不够吗？'),
    open: say(SOFT, 'info', '已经打开了，就是这个。'),
    save: say(SOFT, 'info', '已保存。\n（存在你心里）')
  };

  /* ---------- 人民币大写 ---------- */
  function bigRMB(n) {
    const D = '零壹贰叁肆伍陆柒捌玖', U = ['', '拾', '佰', '仟'];
    n = Math.round(n);
    if (n === 0) return '零元整';
    const four = x => {   // 0..9999
      let s = '', zero = false;
      for (let i = 3; i >= 0; i--) {
        const d = Math.floor(x / Math.pow(10, i)) % 10;
        if (d === 0) { zero = s !== ''; continue; }
        if (zero) { s += '零'; zero = false; }
        s += D[d] + U[i];
      }
      return s;
    };
    const wan = Math.floor(n / 10000), rest = n % 10000;
    let s = '';
    if (wan) s += four(wan) + '万';
    if (rest) s += (wan && rest < 1000 ? '零' : '') + four(rest);
    return s + '元整';
  }
  const money = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  app.open = function () {
    let dead = false, rolls = 0, rows = null, total = 0, sel = null, who = '';
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => { if (!dead) fn(); }, ms));

    /* ---------- 窗口：菜单、工具栏、公式栏、表格、工作表标签、状态栏 ---------- */
    const tb = (icon, label, fn, cls) => {
      const b = el('button', { class: 'xl-tb' + (cls ? ' ' + cls : '') }, [icon ? OS.iconEl(icon, 'xl-tbico') : null, label ? el('span', { text: label }) : null]);
      b.addEventListener('click', () => { OS.sound.play('click'); fn(); });
      return b;
    };
    const sigma = el('span', { class: 'xl-sigma', text: 'Σ' });
    const calcBtn = el('button', { class: 'xl-tb xl-tb-main' }, [sigma, el('span', { text: '一键算账' })]);
    calcBtn.addEventListener('click', () => { OS.sound.play('click'); calc(); });
    const toolbar = el('div', { class: 'xl-tools' }, [
      tb('sheet', '', TOOL_JOKES.new), tb('folder', '', TOOL_JOKES.open), tb('floppy', '', TOOL_JOKES.save),
      el('span', { class: 'xl-sep' }), calcBtn, tb('exe', '打印欠条', printSlip, 'xl-tb-main')
    ]);
    const nameBox = el('div', { class: 'xl-name', text: 'A1' });
    const fx = el('div', { class: 'xl-fx-text' });
    const grid = el('table', { class: 'xl-grid' });
    const status = el('span', { text: '就绪' });
    const gridWrap = el('div', { class: 'xl-gridwrap' }, [grid]);
    const tabs = el('div', { class: 'xl-tabs' }, ['欠款单', '催款记录', '绝交名单'].map((n, i) => {
      const t = el('span', { class: 'xl-tab' + (i === 0 ? ' on' : ''), text: n });
      t.addEventListener('click', () => {
        OS.sound.play('click');
        if (i === 1) OS.ui.dialog({ title: SOFT, icon: 'info', text: '暂无催款记录。\n（催了也没用）' });
        if (i === 2) { const g = OS.koukou ? OS.koukou.gone() : []; OS.ui.dialog({ title: SOFT, icon: 'info', text: g.length ? GONE_LIST(g) : GONE_NONE }); }
      });
      return t;
    }));
    // 菜单栏：点哪个就在它下面弹出菜单
    const menuBar = OS.ui.menuBar(MENU_ORDER, menuItems, 'xl-menu');
    function menuItems(name) {
      if (name === '文件(F)') return [
        { label: '新建', action: TOOL_JOKES.new }, { label: '打开…', action: TOOL_JOKES.open }, { label: '保存', action: TOOL_JOKES.save },
        '-', { label: M_PRINT, action: printSlip }, '-', { label: M_QUIT, action: () => win.close() }
      ];
      if (name === '帮助(H)') return [
        { label: M_HELP, action: () => { pal.show(); pal.say(OS.pick(PAL.tips)); } },
        pal.hidden() ? { label: M_PAL_SHOW, action: () => pal.comeBack() } : { label: M_PAL_HIDE, action: () => pal.hide() },
        '-', { label: M_ABOUT, action: say(M_ABOUT, 'info', ABOUT) }
      ];
      const list = MENU_JOKES[name].map(([label, text]) => ({ label, action: say(SOFT, 'info', text) }));
      if (name === '编辑(E)') list.push('-', { label: M_CLEAR, action: () => { rows = null; rolls = 0; clearRows(); } });
      return list;
    }
    const content = el('div', { class: 'xl' }, [
      menuBar,
      toolbar,
      el('div', { class: 'xl-fx' }, [nameBox, el('span', { class: 'xl-fx-mark', text: 'fx' }), fx]),
      gridWrap,
      tabs,
      el('div', { class: 'xl-status' }, [status, el('span', { text: '数字' })])
    ]);
    /* ---------- 表格（先画好再开窗口，窗口才知道自己多高） ---------- */
    const cells = {};   // 'B4' -> { td, text, formula }
    const colgroup = el('colgroup', {}, [el('col', { style: { width: '22px' } })].concat(COL_W.map(w => el('col', { style: { width: w + 'px' } }))));
    grid.appendChild(colgroup);
    grid.appendChild(el('tr', {}, [el('th', { class: 'xl-corner' })].concat(COLS.map(c => el('th', { text: c })))));
    for (let r = 1; r <= ROWS; r++) {
      const tr = el('tr', {}, [el('th', { text: String(r) })]);
      COLS.forEach(c => {
        const td = el('td');
        const addr = c + r;
        cells[addr] = { td, text: '', formula: '' };
        td.addEventListener('click', () => select(addr));
        tr.appendChild(td);
      });
      grid.appendChild(tr);
    }
    // 合并单元格：A1 一整行、B12 后面几格
    const merge = (addr, span) => {
      const c = cells[addr];
      c.td.colSpan = span;
      let next = c.td.nextSibling;
      for (let i = 1; i < span; i++) { const n = next; next = n.nextSibling; n.remove(); }
    };
    merge('A1', 5);
    merge('B12', 4);
    const set = (addr, text, formula, cls) => {
      const c = cells[addr];
      c.text = text; c.formula = formula || '';
      c.td.textContent = text;
      c.td.className = cls || '';
      if (sel === addr) showSel();
    };
    set('A1', HEAD, '', 'xl-head');
    set('A2', '欠款人：', '', 'xl-b');
    set('C2', '日期：', '', 'xl-b xl-r');
    set('D2', DATE());
    ['序号', '事由', '数量', '金额（元）', '备注'].forEach((h, i) => set(COLS[i] + 3, h, '', 'xl-th'));
    // B2：下拉框选欠款人（不用打字）。自己画的下拉框，弹出来的是游戏里的菜单，跟着画面一起放大
    const pickText = el('span', { class: 'xl-pick-text', text: PICK_ONE });
    const pickBox = el('div', { class: 'xl-pick' }, [pickText, el('span', { class: 'xl-pick-arrow' })]);
    cells.B2.td.textContent = '';
    cells.B2.td.appendChild(pickBox);
    const customNames = [];
    let greeted = false;
    // 选好欠款人 = 开始写欠条了，小算盘这才冒出来问“需要帮助吗？”；之后再换人就点评一句
    const setWho = (name, comment) => {
      who = name;
      pickText.textContent = name;
      rolls = 0; rows = null;
      clearRows();
      if (!greeted) {
        greeted = pal.ask(PAL.hello, [PAL.helpYes, PAL.helpNo], i => { if (i === 0) pal.opts.help(); else pal.say(PAL.noHelp); });
        if (greeted) return;
      }
      pal.say(comment);
    };
    pickBox.addEventListener('click', e => {
      e.stopPropagation();
      OS.sound.play('click');
      select('B2');
      const r = OS.stage.rectOf(pickBox);
      const p = { x: r.left, y: r.bottom };
      const names = DEBTORS.concat(customNames);
      OS.ui.contextMenu(names.map(n => ({ label: n, checked: n === who, action: () => setWho(n, PAL.names[n] || PAL.custom) }))
        .concat(['-', { label: CUSTOM, action: askCustom }]), p.x, p.y);
    });
    // 自己输入：弹个小框打名字；打好了就加进下拉菜单里
    function askCustom() {
      askName(name => {
        if (!name) return;
        if (!DEBTORS.includes(name) && !customNames.includes(name)) customNames.push(name);
        setWho(name, PAL.names[name] || PAL.custom);
      });
    }
    function clearRows() {
      for (let r = 4; r <= 11; r++) COLS.forEach(c => set(c + r, ''));
      set('B12', '');
      total = 0;
      pal.setDizzy(false);
    }
    function select(addr) {
      if (sel && cells[sel]) cells[sel].td.classList.remove('xl-sel');
      sel = addr;
      cells[addr].td.classList.add('xl-sel');
      showSel();
    }
    function showSel() {
      const c = cells[sel];
      nameBox.textContent = sel;
      fx.textContent = sel === 'B2' ? (who || '') : (c.formula || c.text);
    }

    /* ---------- 一键算账 ---------- */
    function calc() {
      if (!who) { pal.say(PAL.pickFirst); return; }
      if (!rows) {
        // 第一次：挑几条账，最后一行凑整到 250
        let pick;
        do { pick = OS.shuffle(ITEMS.slice()).slice(0, PICKS); } while (pick.reduce((s, it) => s + it[2], 0) >= TOTAL - 1);
        const sum = pick.reduce((s, it) => s + it[2], 0);
        rows = pick.map(it => ({ what: it[0], qty: it[1], amt: it[2], f: it[3], note: '' }));
        rows.push({ what: ROUND[0], qty: ROUND[1], amt: Math.round((TOTAL - sum) * 100) / 100, f: '=250-SUM(D4:D9)', note: '' });
        rolls = 1;
        fill(true);
        return;
      }
      // 再点：利滚利，全部翻倍
      rolls++;
      rows.forEach(r => { r.amt *= 2; r.f = '=' + (r.f.replace(/^=/, '(') + ')*2').slice(0, 40); });
      fill(false);
      pal.setDizzy(money(total).length > BIG_MAX);   // 格子装不下了：小算盘也算晕了
      if (PAL.rolls[rolls]) pal.say(PAL.rolls[rolls]);
      if (total >= BSOD_AT) later(() => OS.ui.bsod(BSOD), 500);
    }
    // 填表：一格一格冒出来，像公式在算
    function fill(slow) {
      clearRows();
      total = rows.reduce((s, r) => s + r.amt, 0);
      const show = n => { const t = money(n); return t.length > BIG_MAX ? '#####' : t; };
      const steps = [];
      rows.forEach((r, i) => {
        const row = 4 + i;
        steps.push(() => {
          set('A' + row, String(i + 1), '', 'xl-c');
          set('B' + row, r.what);
          set('C' + row, r.qty, '', 'xl-c');
          set('D' + row, show(r.amt), r.f, 'xl-r' + (show(r.amt) === '#####' ? ' xl-hash' : ''));
          set('E' + row, r.note);
        });
      });
      steps.push(() => {
        set('B11', '合计', '', 'xl-b xl-r');
        set('D11', show(total), '=SUM(D4:D10)', 'xl-r xl-b' + (show(total) === '#####' ? ' xl-hash' : ''));
        set('B12', '大写：' + (total >= 1e8 ? '（数额太大，写不下）' : bigRMB(total)), '', 'xl-b');
        status.textContent = '就绪';
      });
      if (!slow) { steps.forEach(f => f()); OS.sound.play('beep'); return; }
      status.textContent = '正在计算……';
      steps.forEach((f, i) => later(() => { f(); OS.sound.play('beep'); }, 140 * (i + 1)));
    }

    /* ---------- 打印欠条 ---------- */
    function printSlip() {
      if (!rows) { pal.say(who ? PAL.calcFirst : PAL.pickFirst); return; }
      status.textContent = '正在打印……';
      // 打印那一刻的人和账（之后表格再改也不影响这张）
      const info = { to: '你', who, rows: rows.map(r => ({ what: r.what, qty: r.qty, amt: r.amt })), total, note: SLIP_NOTE, post: true };
      OS.printSlip(info, () => { if (!dead) status.textContent = '就绪'; });
    }

    const win = OS.wm.open({
      title: TITLE, icon: app.icon, width: 452, appId: app.id, content, maximizable: false, center: true,
      onClose: () => { dead = true; timers.forEach(clearTimeout); }
    });

    /* ---------- 小算盘 ---------- */
    const pal = palMake(gridWrap, later, () => dead, {
      help: () => { rows = null; calc(); later(() => pal.say(PAL.didHelp), 1300); }
    });

    select('A1');
    return win;
  };

  /* 打一张欠条（打印机滋滋响，1.2 秒后弹出来）。网上邻居里小卖部老板的账本也用它，反过来打“你欠老板的”。
     info: { to: 欠谁的, who: 欠款人, rows: [{ what, qty, amt }], total, note: 最下面小字, post: 要不要［发到群里］, title } */
  OS.printSlip = function (info, done) {
    [0, 300, 600, 900].forEach(t => setTimeout(() => OS.sound.play('printer'), t));
    setTimeout(() => { slipWindow(info); OS.sound.play('ding'); if (done) done(); }, 1200);
  };
  function slipWindow(info) {
    const big = info.total >= 1e8 ? '（数额太大，写不下）' : bigRMB(info.total);
    // 表格里算出来的每一笔都印上去（这张是给人截图的，账越离谱越好笑）；利滚利之后格子里是 #####，欠条上照样印出真数
    const line = (cells, cls) => el('tr', cls ? { class: cls } : null, cells.map(([t, c]) => el('td', { class: c || null, text: t })));
    const list = el('table', { class: 'qt-list' }, info.rows.map((r, i) => line([[(i + 1) + '.', 'qt-n'], [r.what], [r.qty, 'qt-q'], ['¥' + money(r.amt), 'qt-m']]))
      .concat([line([[''], [SLIP_SUM], [''], ['¥' + money(info.total), 'qt-m']], 'qt-sum')]));
    // 最下面一行：小字 +［发到群里］（发到抠抠的班级群，见 koukou.js）
    let postBtn = null;
    if (info.post) {
      const slipInfo = { who: info.who, total: money(info.total) };
      postBtn = el('button', { class: 'xpbtn qt-post', text: SLIP_POST });
      let posted = false;
      postBtn.addEventListener('click', () => {
        OS.sound.play('click');
        if (posted && OS.koukou.loggedIn()) { OS.ui.dialog({ title: SOFT, icon: 'info', text: SLIP_POSTED }); return; }
        if (OS.koukou.loggedIn()) posted = true;
        OS.koukou.postSlip(slipInfo);
      });
    }
    const slip = el('div', { class: 'qt' }, [
      el('div', { class: 'qt-title', text: SLIP_TITLE }),
      el('div', { class: 'qt-text', text: SLIP_TEXT(info.to, big, money(info.total)) }),
      el('div', { class: 'qt-cap', text: SLIP_LIST }),
      list,
      el('div', { class: 'qt-foot' }, [
        el('div', { class: 'qt-sign' }, [el('span', { text: SLIP_SIGN(info.who) }), el('img', { class: 'qt-thumb', src: THUMB_SRC, alt: '' })]),
        el('div', { class: 'qt-date', text: info.date || SLIP_DATE() })
      ]),
      el('div', { class: 'qt-last' }, [el('div', { class: 'qt-note', text: info.note || SLIP_NOTE }), postBtn])
    ]);
    if (info.elOnly) return slip;   // ABCSee 里看欠条.jpg：只要这张纸
    return OS.wm.open({ title: info.viewName ? info.viewName + ' - 图片和传真查看器' : '欠条 - ' + (info.title || app.name), icon: info.viewName ? 'paint' : 'sheet', width: 340, content: slip, maximizable: false });
  }
  // 我的图片里存的欠条：再打开看看（mydocs.js）
  OS.showSlip = (info, name) => slipWindow(Object.assign({}, info, { post: false, viewName: name }));
  OS.slipEl = info => slipWindow(Object.assign({}, info, { post: false, elOnly: true }));
  OS.slipDate = () => SLIP_DATE();

  // “自己输入…”：一个小输入框（这里可以打字，手机上会弹输入法）
  function askName(done) {
    const input = el('input', { class: 'xl-input', type: 'text', maxlength: String(NAME_MAX) });
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const no = el('button', { class: 'xpbtn', text: '取消' });
    let finished = false;
    const finish = v => { if (finished) return; finished = true; w.close(); done(v); };
    const w = OS.wm.open({
      title: SOFT, icon: 'sheet', width: 230, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'xl-ask' }, [el('div', { text: ASK_NAME }), input, el('div', { class: 'xl-ask-btns' }, [ok, no])]),
      onClose: () => { if (!finished) { finished = true; done(''); } }
    });
    const val = () => input.value.trim().slice(0, NAME_MAX);
    ok.addEventListener('click', () => { OS.sound.play('click'); finish(val()); });
    no.addEventListener('click', () => { OS.sound.play('click'); finish(''); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(val()); if (e.key === 'Escape') finish(''); });
    setTimeout(() => input.focus(), 50);
  }

  // 欠条上的红手印（Codex 画的，assets/debt/thumb.webp）
  const THUMB_SRC = 'assets/debt/thumb.webp';

  /* ---------- 小算盘：原创的 Office 小助手式角色（一把长着大眼睛、会挑眉毛的算盘） ---------- */
  // Codex 画的 13 帧（assets/debt/pal.webp，横排，每帧显示 48×48）。网页按状态换帧：
  // 平时站着、隔一会眨眼、东张西望；说话动嘴；点它拨算盘；藏起来 / 回来挥手；没人理就睡着；账算爆了就晕。
  const FR = { idle: 0, blink: 1, lookL: 2, lookR: 3, talk1: 4, talk2: 5, bead1: 6, bead2: 7, wave1: 8, wave2: 9, sleep1: 10, sleep2: 11, dizzy: 12 };
  const PAL_W = 48;
  const TICK = 160;            // 每 0.16 秒换一次帧（那几年 GIF 的感觉）
  const SLEEP_MS = 30000;      // 30 秒没人碰就睡着
  const TALK_MS = 1300;        // 冒一句话时动嘴的时间
  const SEQ = {
    bead: ['bead1', 'bead2', 'bead1', 'bead2', 'bead1', 'bead2'],
    wave: ['wave1', 'wave1', 'wave2', 'wave2', 'wave1', 'wave1', 'wave2', 'wave2', 'wave1', 'wave1', 'wave2', 'wave2']
  };

  function palMake(host, later, isDead, opts) {
    const bub = el('div', { class: 'pal-bub' });
    const body = el('div', { class: 'pal' });
    const box = el('div', { class: 'pal-box' }, [bub, body]);
    host.appendChild(box);
    let hideT = 0, hides = 0;
    // 换帧的小脑子
    let seq = null, talkUntil = 0, lastTouch = Date.now(), dizzy = false, tick = 0, lookDir = '', lookLeft = 0;
    const frame = n => { body.style.backgroundPosition = (-FR[n] * PAL_W) + 'px 0'; };
    const asleep = () => !seq && !bub.classList.contains('on') && Date.now() - lastTouch > SLEEP_MS;
    const play = name => { seq = SEQ[name].slice(); };
    const touch = () => { lastTouch = Date.now(); body.classList.remove('sleep'); };
    const loop = setInterval(() => {
      if (isDead() || !box.isConnected) { clearInterval(loop); return; }
      if (box.classList.contains('gone')) return;
      tick++;
      const now = Date.now();
      if (seq) { frame(seq.shift()); if (!seq.length) seq = null; return; }
      if (now < talkUntil) { frame(Math.floor(tick / 2) % 2 ? 'talk2' : 'talk1'); return; }
      if (dizzy) { frame('dizzy'); return; }
      if (asleep()) { body.classList.add('sleep'); frame(Math.floor(tick / 4) % 2 ? 'sleep2' : 'sleep1'); return; }
      // 气泡开着：看着自己的气泡
      if (bub.classList.contains('on')) { frame(box.classList.contains('left') ? 'lookR' : 'lookL'); return; }
      // 平时：站着，偶尔东张西望，偶尔眨眼
      if (lookLeft > 0) { lookLeft--; frame(lookDir); return; }
      if (Math.random() < 0.03) { lookDir = Math.random() < 0.5 ? 'lookL' : 'lookR'; lookLeft = 6 + Math.floor(Math.random() * 6); frame(lookDir); return; }
      frame(Math.random() < 0.06 ? 'blink' : 'idle');
    }, TICK);
    frame('idle');
    // 表格里随便点一下也算"有人理它"
    host.parentNode.addEventListener('pointerdown', e => { if (!body.contains(e.target)) touch(); }, true);

    const close = () => { bub.classList.remove('on'); };
    const talk = () => { touch(); talkUntil = Date.now() + TALK_MS; };
    const pal = {
      opts,
      hidden: () => box.classList.contains('gone'),
      show() { box.classList.remove('gone'); touch(); },
      // 藏起来：先挥挥手再走。帮助菜单里能叫回来；不叫的话，过一会儿它自己又回来了
      hide() {
        close();
        touch();
        play('wave');
        const n = ++hides;
        later(() => { if (n === hides) box.classList.add('gone'); }, SEQ.wave.length * TICK);
        later(() => { if (n === hides && pal.hidden()) pal.comeBack(); }, HIDE_MS);
      },
      // 回来：挥手打招呼
      comeBack() {
        hides++;
        pal.show();
        play('wave');
        pal.say(PAL.back, true);
      },
      // 账算爆了（格子装不下）：晕
      setDizzy(v) { dizzy = !!v; },
      say(text, keepSeq) {
        if (box.classList.contains('gone')) return;
        bub.textContent = '';
        bub.appendChild(el('div', { class: 'pal-text', text }));
        bub.classList.add('on');
        if (!keepSeq) seq = null;
        talk();
        OS.sound.play('pop');
        clearTimeout(hideT);
        hideT = setTimeout(close, 4200);
      },
      ask(text, choices, onPick) {
        if (box.classList.contains('gone')) return false;
        bub.textContent = '';
        bub.appendChild(el('div', { class: 'pal-text', text }));
        choices.forEach((c, i) => {
          const o = el('div', { class: 'pal-opt' }, [el('span', { class: 'pal-dot' }), el('span', { text: c })]);
          o.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); close(); onPick(i); });
          bub.appendChild(o);
        });
        bub.classList.add('on');
        seq = null;
        talk();
        OS.sound.play('pop');
        clearTimeout(hideT);
        return true;
      }
    };
    // 点它：拨一下算珠，说个小提示；睡着了点它，先嘴硬一句
    const poke = wasAsleep => {
      touch();
      play('bead');
      OS.sound.play('beep');
      pal.say(wasAsleep ? PAL.wake : OS.pick(PAL.tips), true);
    };
    // 按住拖：跟当年的 Office 小助手一样，挡着了可以拖到别处去（气泡跟着换边，别跑出表格）
    body.addEventListener('pointerdown', e => {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      const start = OS.stage.toLocal(e.clientX, e.clientY);
      const ox = box.offsetLeft, oy = box.offsetTop;
      const wasAsleep = asleep();
      touch();
      let drag = false;
      try { body.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const move = ev => {
        if (OS.ui.longPressed(ev.pointerId) && !drag) return;
        const q = OS.stage.toLocal(ev.clientX, ev.clientY);
        const dx = q.x - start.x, dy = q.y - start.y;
        if (!drag && dx * dx + dy * dy > 36) { drag = true; close(); }
        if (!drag) return;
        box.style.right = box.style.bottom = 'auto';
        box.style.left = OS.clamp(ox + dx, 0, host.clientWidth - box.offsetWidth) + 'px';
        box.style.top = OS.clamp(oy + dy, 0, host.clientHeight - box.offsetHeight) + 'px';
        box.classList.toggle('below', box.offsetTop < 90);
        box.classList.toggle('left', box.offsetLeft < 150);
      };
      const up = ev => {
        body.removeEventListener('pointermove', move);
        body.removeEventListener('pointerup', up);
        body.removeEventListener('pointercancel', up);
        if (!drag && ev.type === 'pointerup' && !OS.ui.longPressed(ev.pointerId)) poke(wasAsleep);
      };
      body.addEventListener('pointermove', move);
      body.addEventListener('pointerup', up);
      body.addEventListener('pointercancel', up);
    });
    // 右键（长按）：隐藏 / 选择助手 / 动画
    OS.ui.onContext(body, () => [
      { label: M_PAL_HIDE, action: () => pal.hide() },
      { label: '选择助手…', action: () => OS.ui.dialog({ title: '选择助手', icon: 'info', text: PAL.alone }) },
      '-',
      { label: '动画！', action: () => { touch(); play(Math.random() < 0.5 ? 'bead' : 'wave'); OS.sound.play('beep'); } }
    ]);
    return pal;
  }

  /* ---------- 图标右键（在新建文件夹(2) 里）：照真的 .xls 文件 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    return [
      P.open,
      { label: '新建', action: TOOL_JOKES.new },
      { label: '打印', action: say('打印', 'info', '请先打开表格把账算好，再打印。') },
      '-',
      {
        label: '发送到', sub: [
          { label: '3½ 英寸软盘 (A:)', action: say('发送到', 'info', '软盘装得下，但对方不会看的。') },
          { label: '邮件收件人', action: say('发送到', 'info', 'Outluck Excess 正在施工。') },
          { label: '桌面快捷方式', action: P.shortcut.action }
        ]
      },
      '-', P.cut, P.copy, '-', P.del, P.rename, '-',
      { label: '属性', action: say('「' + app.name + '」属性', 'info', '类型：Excuse 工作表\n大小：250 KB\n作者：你\n最后修改者：欠你钱的那位') }
    ];
  };
})();

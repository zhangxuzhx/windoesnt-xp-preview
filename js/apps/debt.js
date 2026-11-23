/* Excuse 2003（Offense 2003 三件套里做表格的；开始 ▸ 所有程序 ▸ Offense 2003 ▸ Excuse 2003）
   三种打开法：
   - 单独打开：空白工作簿 Book1——点空格子弹"填什么"（数、文字、公式、自己输入…）；［Σ 自动求和］是真加
   - 欠条打印专家 2003.xls（收在「新建文件夹(2)」最外面那层；原名"塑料兄弟欠款单"，称呼都不分男女）／
     文件 ▸ 新建 ▸ 本机上的模板 ▸ 欠款明细单：一张做好的"欠款明细单"，原来的功能全在：
     - 表格日期、欠条上的还款期限和落款，都填打开那天（限今天还清）
     - 欠款人从下拉框里选（不用打字）；也可以选"自己输入…"。点［Σ 一键算账］：一格一格填出离谱的账，合计永远 250
     - 点格子：左上角显示格子名，公式栏显示公式（比如 =SUM(D4:D10)）
     - ［打印欠条］：打印机滋滋响，出一张欠条，盖个红手印（Codex 画的）；同时存一张欠条.jpg 进我的图片（mydocs.js）
     - ［发到群里］：发到抠抠2003 的班级群（koukou.js），被写在欠条上的人退群 / 拉黑你，记进"绝交名单"那页
     - 蓝屏彩蛋：算完再狠狠点［一键算账］= 利滚利，每点一次金额翻倍；格子装不下变成 #####；翻到一百万蓝屏 DEBT_OVERFLOW
   - 网上邻居里的 账本.xls、投诉记录.xls：只读打开（OS.excuse.view），账本照样能打欠条
   插入 ▸ 图表…：图表向导一路下一步，出来的不是统计图，是一张真的饼（吃的那种）
   保存：存成 .xls 放进我的文档（算 80 个文件），双击再打开接着用
   小算盘：三件套共用的助手（offense.js），在这里说算账的话 */
(function () {
  'use strict';
  const el = OS.el;
  const FS = OS.fs;
  const app = OS.apps.byId.debt;      // 欠条打印专家 2003.xls 这个文件
  const xapp = OS.apps.byId.excuse;   // Excuse 2003 本体
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const SOFT = 'Excuse 2003';
  const TITLE = n => SOFT + ' - ' + n;
  // 菜单栏：每个都能点开（照真的表格软件）；[菜单名, [[项, 点了说的话] ...]]
  const MENU_JOKES = {
    '编辑(E)': [['撤销', '欠款不能撤销。'], ['查找…', '欠你钱的人一般找不到。']],
    '视图(V)': [['全屏显示', '这么点单元格还值得您全屏观看吗？']],
    '格式(O)': [['单元格…', '格式已经很正式了，\n对方看了会害怕的。']],
    '工具(T)': [['选项…', '没有"免除欠款"这个选项。']],
    '数据(D)': [['排序…', '已按"谁欠得多"排好了。']],
    '窗口(W)': [['新建窗口', '一张欠条一个窗口，\n够用了。']]
  };
  const MENU_ORDER = ['文件(F)', '编辑(E)', '视图(V)', '插入(I)', '格式(O)', '工具(T)', '数据(D)', '窗口(W)', '帮助(H)'];
  const M_PRINT = '打印欠条', M_QUIT = '退出', M_CLEAR = '清除内容';
  const M_HELP = 'Excuse 帮助', M_PAL_SHOW = '显示小算盘', M_PAL_HIDE = '隐藏小算盘', M_ABOUT = '关于 Excuse 2003';
  const ABOUT = 'Excuse 2003\n版本 2003.2.30\n专为要账设计。\n本产品授权给：被欠钱的你';
  const FUNC = '本表格只有一个函数：\n=SUM(对方的良心)\n目前返回 0。';
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
  const TOO_BIG = '数额太大，写不下';

  // 欠条
  const SLIP_TITLE = '欠　条';
  const SLIP_TEXT = (to, big, num) => '今欠到　' + to + '　下列款项，共计人民币' + big + '（¥' + num + '），限 ' + DATE_CN() + '前还清。';
  const SLIP_LIST = '明细如下：';
  const SLIP_SUM = '合计';
  const SLIP_SIGN = who => '欠款人：' + who;
  const SLIP_NOTE = '手印是你替对方按的。';
  const SLIP_POST = '发到群里';
  const SLIP_POSTED = '已经发过了。\n再发一次，全班就都看见两遍了。';
  // "绝交名单"那页：欠条发到抠抠群里之后，退群 / 拉黑你的人记在这（重启就和好）
  const GONE_NONE = '绝交名单是空的。\n你还有朋友，暂时。';
  const GONE_LIST = list => '绝交名单：\n' + list.map(g => g.name + '：' + g.why).join('\n');
  const NO_URGE = '暂无催款记录。\n催了也没用。';
  const SLIP_DATE = DATE_CN;

  // 小算盘说的话
  const PAL = {
    hello: '看起来你在写欠条。\n需要帮助吗？',
    helpYes: '帮我把账算狠一点',
    helpNo: '不用了，我自己来',
    didHelp: '已经帮你把账算到最狠了。',
    noHelp: '好的。\n我会一直看着你的。',
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
      '班长': '班长的账你也敢算？\n你班费交了吗？',
      '网友“轻舞飞扬”': '网友的账，等见了面再要。\n你们见不到的。',
      '楼下小卖部老板': '……应该是你欠人家吧？'
    },
    custom: '这位我不认识，\n但账照算。',
    tips: [
      '小提示：借钱给朋友之前，\n请先打印好欠条。',
      '小提示：按 F1 没有用。',
      '小提示：本表格的合计永远是 250，\n这不是 bug。',
      '小提示：要账的最佳时机是\n对方刚发生活费的那天。'
    ],
    rolls: { 2: '利滚利模式已开启。', 5: '这账已经比你俩的友谊还长了。', 10: '格子装不下了，\n显示成 ##### 是正常的。', 12: '再点我就算不过来了！' },
    // 空白工作簿 Book1
    bookHello: '看起来你在做表格。\n需要帮助吗？',
    bookYes: '帮我把每一列都加起来',
    bookDone: '加好了。\n钱是不会因为加起来就变多的。',
    pie: '这张饼看起来很好吃。'
  };

  // 空白工作簿：点空格子弹"填什么"
  const BOOK_COLS = ['A', 'B', 'C', 'D', 'E'];
  const BOOK_W = [76, 76, 76, 76, 76];
  const FILL = {
    nums: ['数字', [1, 2, 3, 5, 10, 50, 100, 250, 520, 9999]],
    words: ['文字', ['零花钱', '早饭', '辣条', '干脆面', '车费', '收入', '支出', '合计', '还剩']],
    sum: '=SUM(上面的格子)', today: '=TODAY()', heart: '=SUM(对方的良心)',
    self: '自己输入…', clear: '清除', ask: '填什么：'
  };
  const SHEETS = ['Sheet1', 'Sheet2', 'Sheet3'];
  const SHEET_EMPTY = n => n + ' 是空的。\n跟你的钱包一样。';
  // 文件
  const F = {
    newMenu: '新建', blank: '空白工作簿', local: '本机上的模板', tplDebt: '欠款明细单',
    open: '打开…', openText: '文件都在我的文档里，\n去那儿双击。',
    save: '保存', saveAs: '另存为…', fileName: '文件名：', saved: '已保存',
    ro: n => '“' + n + '”是只读文件。\n这是人家的表，你存不了。',
    ask: n => '是否保存对“' + n + '”的更改？', yes: '是', no: '否', cancel: '取消',
    print: '打印…'
  };
  // 图表向导：一路下一步，最后出来一张真的饼
  const CHART = {
    menu: '图表…', btn: '图表',
    title: n => '图表向导 - 4 步骤之 ' + n,
    steps: ['图表类型', '图表源数据', '图表选项', '图表位置'],
    types: ['柱形图', '条形图', '折线图', '饼图', 'XY 散点图', '面积图', '圆环图'],
    range: '数据区域：=Sheet1!$A$1:$E$12', label: '图表标题：', place: '作为其中的对象插入：Sheet1',
    prev: '< 上一步', next: '下一步 >', done: '完成', cancel: '取消',
    del: '删除', kind: '图表类型…', kindText: '已经是饼了。'
  };
  // 一张饼（吃的那种）：Codex 画的葱油饼
  const PIE_SRC = 'assets/office/pie.webp';

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

  /* ================= 一个 Excuse 窗口 =================
     o: { mode: 'debt' 欠款明细单 | 'book' 空白工作簿 | 'ro' 只读的表, name, path（存过的文件）, sheet（存过的内容）, appId,
          只读的：cap, cols, rows, widths, foot, total, tools } */
  let bookNo = 0;
  function openSheet(o) {
    const mode = o.mode, ro = mode === 'ro';
    let name = o.name, path = o.path || null, dirty = false;
    let dead = false, rolls = 0, rows = null, total = 0, sel = null, who = '';
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => { if (!dead) fn(); }, ms));
    const pies = [];
    let pal = null;
    // 欠款明细单才有的（下面 mode === 'debt' 那段里填上）
    let setWho = null, clearRows = () => {}, calc = () => {}, printSlip = () => {}, customNames = [];
    const touched = () => { if (mode !== 'debt' || path) dirty = true; };

    /* ---------- 窗口：菜单、工具栏、公式栏、表格、工作表标签、状态栏 ---------- */
    const tb = (icon, label, fn, cls) => {
      const b = el('button', { class: 'xl-tb' + (cls ? ' ' + cls : '') }, [icon ? OS.iconEl(icon, 'xl-tbico') : null, label ? el('span', { text: label }) : null]);
      b.addEventListener('click', () => { OS.sound.play('click'); fn(); });
      return b;
    };
    const sigmaBtn = label => { const b = el('button', { class: 'xl-tb xl-tb-main' }, [el('span', { class: 'xl-sigma', text: 'Σ' }), el('span', { text: label })]); return b; };
    let toolsMid = [];
    if (mode === 'debt') {
      const calcBtn = sigmaBtn('一键算账');
      calcBtn.addEventListener('click', () => { OS.sound.play('click'); calc(); });
      toolsMid = [calcBtn, tb('exe', '打印欠条', () => printSlip(), 'xl-tb-main')];
    } else if (mode === 'book') {
      const sumBtn = sigmaBtn('自动求和');
      sumBtn.addEventListener('click', () => { OS.sound.play('click'); autoSum(sel || 'A1'); });
      toolsMid = [sumBtn];
    } else toolsMid = o.tools || [];
    const toolbar = el('div', { class: 'xl-tools' }, [
      tb('sheet', '', () => blankBook()), tb('folder', '', say(SOFT, 'info', F.openText)), tb('floppy', '', () => save(false)),
      el('span', { class: 'xl-sep' })
    ].concat(toolsMid, ro ? [] : [tb('', CHART.btn, chartWizard)]));
    const nameBox = el('div', { class: 'xl-name', text: 'A1' });
    const fx = el('div', { class: 'xl-fx-text' });
    const grid = el('table', { class: 'xl-grid' + (ro ? ' xl-ro' : '') });
    const status = el('span', { text: '就绪' });
    const gridWrap = el('div', { class: 'xl-gridwrap' }, [grid]);
    const tabNames = mode === 'debt' ? ['欠款单', '催款记录', '绝交名单'] : ro ? ['Sheet1'] : SHEETS;
    const tabs = el('div', { class: 'xl-tabs' }, tabNames.map((n, i) => {
      const t = el('span', { class: 'xl-tab' + (i === 0 ? ' on' : ''), text: n });
      t.addEventListener('click', () => {
        OS.sound.play('click');
        if (i === 0) return;
        if (mode !== 'debt') { OS.ui.dialog({ title: SOFT, icon: 'info', text: SHEET_EMPTY(n) }); return; }
        if (i === 1) OS.ui.dialog({ title: SOFT, icon: 'info', text: NO_URGE });
        if (i === 2) { const g = OS.koukou ? OS.koukou.gone() : []; OS.ui.dialog({ title: SOFT, icon: 'info', text: g.length ? GONE_LIST(g) : GONE_NONE }); }
      });
      return t;
    }));
    // 菜单栏：点哪个就在它下面弹出菜单
    const menuBar = OS.ui.menuBar(MENU_ORDER, menuItems, 'xl-menu');
    function menuItems(m) {
      if (m === '文件(F)') return [
        { label: F.newMenu, sub: [{ label: F.blank, action: blankBook }, { label: F.local, sub: [{ label: F.tplDebt, action: newDebt }] }] },
        { label: F.open, action: say(SOFT, 'info', F.openText) },
        { label: F.save, action: () => save(false) },
        { label: F.saveAs, action: () => save(true) },
        '-', mode === 'debt' ? { label: M_PRINT, action: () => printSlip() } : { label: F.print, action: () => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }) },
        '-', { label: M_QUIT, action: () => OS.wm.requestClose(win) }
      ];
      if (m === '插入(I)') return [{ label: CHART.menu, disabled: ro, action: chartWizard }, { label: '函数…', action: say(SOFT, 'info', FUNC) }];
      if (m === '帮助(H)') return [
        { label: M_HELP, action: () => { if (pal) pal.tip(); } },
        !pal ? null : pal.hidden() ? { label: M_PAL_SHOW, action: () => pal.comeBack() } : { label: M_PAL_HIDE, action: () => pal.hide() },
        '-', { label: M_ABOUT, action: say(M_ABOUT, 'info', ABOUT) }
      ];
      const list = MENU_JOKES[m].map(([label, text]) => ({ label, action: say(SOFT, 'info', text) }));
      if (m === '编辑(E)' && mode === 'debt') list.push('-', { label: M_CLEAR, action: () => { rows = null; rolls = 0; clearRows(); } });
      if (m === '编辑(E)' && mode === 'book') list.push('-', { label: M_CLEAR, action: () => { Object.keys(book).forEach(a => setBook(a, '', '')); } });
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
    const cols = mode === 'debt' ? COLS : ro ? o.cols.map((_, i) => 'ABCDEF'[i]) : BOOK_COLS;
    const widths = mode === 'debt' ? COL_W : ro ? o.widths : BOOK_W;
    const nRows = mode === 'debt' ? ROWS : ro ? o.rows.length + 2 + (o.foot ? 1 : 0) : 12;
    const cells = {};   // 'B4' -> { td, text, formula }
    grid.appendChild(el('colgroup', {}, [el('col', { style: { width: '22px' } })].concat(widths.map(w => el('col', { style: { width: w + 'px' } })))));
    grid.appendChild(el('tr', {}, [el('th', { class: 'xl-corner' })].concat(cols.map(c => el('th', { text: c })))));
    for (let r = 1; r <= nRows; r++) {
      const tr = el('tr', {}, [el('th', { text: String(r) })]);
      cols.forEach(c => {
        const td = el('td');
        const addr = c + r;
        cells[addr] = { td, text: '', formula: '' };
        td.addEventListener('click', () => clickCell(addr));
        tr.appendChild(td);
      });
      grid.appendChild(tr);
    }
    // 合并单元格
    const merge = (addr, span) => {
      const c = cells[addr];
      c.td.colSpan = span;
      let next = c.td.nextSibling;
      for (let i = 1; i < span; i++) { const n = next; next = n.nextSibling; n.remove(); }
    };
    const set = (addr, text, formula, cls) => {
      const c = cells[addr];
      c.text = text; c.formula = formula || '';
      c.td.textContent = text;
      c.td.className = cls || '';
      if (sel === addr) showSel();
    };
    function clickCell(addr) {
      const again = sel === addr;
      select(addr);
      if (mode === 'book' && (again || book[addr] == null || book[addr].v === '')) fillMenu(addr);
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
      fx.textContent = mode === 'debt' && sel === 'B2' ? (who || '') : (c.formula || c.text);
    }

    /* ================= 欠款明细单 ================= */
    if (mode === 'debt') {
      merge('A1', 5);
      merge('B12', 4);
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
      let greeted = false;
      // 选好欠款人 = 开始写欠条了，小算盘这才冒出来问"需要帮助吗？"；之后再换人就点评一句
      setWho = (n, comment, quiet) => {
        who = n;
        pickText.textContent = n;
        rolls = 0; rows = null;
        clearRows();
        touched();
        if (quiet) return;
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
        const names = DEBTORS.concat(customNames);
        OS.ui.contextMenu(names.map(n => ({ label: n, checked: n === who, action: () => setWho(n, PAL.names[n] || PAL.custom) }))
          .concat(['-', { label: CUSTOM, action: askCustom }]), r.left, r.bottom);
      });
      // 自己输入：弹个小框打名字；打好了就加进下拉菜单里
      const askCustom = () => {
        askName(ASK_NAME, NAME_MAX, n => {
          if (!n) return;
          if (!DEBTORS.includes(n) && !customNames.includes(n)) customNames.push(n);
          setWho(n, PAL.names[n] || PAL.custom);
        });
      };
      clearRows = () => {
        for (let r = 4; r <= 11; r++) COLS.forEach(c => set(c + r, ''));
        set('B12', '');
        total = 0;
        if (pal) pal.setDizzy(false);
      };
      /* ---------- 一键算账 ---------- */
      calc = () => {
        if (!who) { pal.say(PAL.pickFirst); return; }
        touched();
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
      };
      /* ---------- 打印欠条 ---------- */
      printSlip = () => {
        if (!rows) { pal.say(who ? PAL.calcFirst : PAL.pickFirst); return; }
        status.textContent = '正在打印……';
        // 打印那一刻的人和账（之后表格再改也不影响这张）
        const info = { to: '你', who, rows: rows.map(r => ({ what: r.what, qty: r.qty, amt: r.amt })), total, note: SLIP_NOTE, post: true };
        OS.printSlip(info, () => { if (!dead) status.textContent = '就绪'; });
      };
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
        set('B12', '大写：' + (total >= 1e8 ? TOO_BIG : bigRMB(total)), '', 'xl-b');
        status.textContent = '就绪';
      });
      if (!slow) { steps.forEach(f => f()); OS.sound.play('beep'); return; }
      status.textContent = '正在计算……';
      steps.forEach((f, i) => later(() => { f(); OS.sound.play('beep'); }, 140 * (i + 1)));
    }

    /* ================= 空白工作簿：点空格子弹"填什么"；Σ 自动求和是真加 ================= */
    const book = {};   // 'B3' -> { v, f }
    const isNum = v => typeof v === 'number' && isFinite(v);
    const showNum = v => (Number.isInteger(v) ? String(v) : v.toFixed(2));
    let bookGreeted = false;
    function setBook(addr, v, f) {
      book[addr] = { v, f: f || '' };
      recalc();
      touched();
    }
    function paintBook() {
      Object.keys(book).forEach(a => { const c = book[a]; set(a, isNum(c.v) ? showNum(c.v) : String(c.v), c.f, isNum(c.v) ? 'xl-r' : ''); });
    }
    // 求和公式跟着格子重算
    function recalc() {
      Object.keys(book).forEach(a => {
        const m = /^=SUM\(([A-E])(\d+):([A-E])(\d+)\)$/.exec(book[a].f);
        if (!m) return;
        let s = 0;
        for (let c = m[1].charCodeAt(0); c <= m[3].charCodeAt(0); c++) for (let r = +m[2]; r <= +m[4]; r++) { const x = book[String.fromCharCode(c) + r]; if (x && isNum(x.v)) s += x.v; }
        book[a].v = Math.round(s * 100) / 100;
      });
      paintBook();
    }
    // Σ：上面一串数加起来；上面没有就加左边；都没有就 0
    function autoSum(addr) {
      const col = addr[0], row = +addr.slice(1);
      const num = a => book[a] && isNum(book[a].v);
      let top = row - 1;
      while (top >= 1 && !num(col + top)) top--;
      if (top >= 1) { let a = top; while (a - 1 >= 1 && num(col + (a - 1))) a--; setBook(addr, 0, '=SUM(' + col + a + ':' + col + top + ')'); }
      else {
        const ci = BOOK_COLS.indexOf(col);
        let l = ci - 1;
        while (l >= 0 && !num(BOOK_COLS[l] + row)) l--;
        if (l >= 0) { let a = l; while (a - 1 >= 0 && num(BOOK_COLS[a - 1] + row)) a--; setBook(addr, 0, '=SUM(' + BOOK_COLS[a] + row + ':' + BOOK_COLS[l] + row + ')'); }
        else setBook(addr, 0, '=SUM()');
      }
      select(addr);
      OS.sound.play('beep');
    }
    function fillMenu(addr) {
      const r = OS.stage.rectOf(cells[addr].td);
      const put = (v, f) => { setBook(addr, v, f); select(addr); greetBook(); };
      const items = [
        { label: FILL.nums[0], sub: FILL.nums[1].map(n => ({ label: String(n), action: () => put(n) })) },
        { label: FILL.words[0], sub: FILL.words[1].map(w => ({ label: w, action: () => put(w) })) },
        { label: '公式', sub: [
          { label: FILL.sum, action: () => { autoSum(addr); greetBook(); } },
          { label: FILL.today, action: () => put(DATE(), FILL.today) },
          { label: FILL.heart, action: () => put(0, FILL.heart) }
        ] },
        '-',
        { label: FILL.self, action: () => askName(FILL.ask, 12, t => { if (!t) return; const n = Number(t); put(t.trim() !== '' && isFinite(n) ? n : t); }) }
      ];
      if (book[addr] && book[addr].v !== '') items.push({ label: FILL.clear, action: () => put('', '') });
      OS.ui.contextMenu(items, r.left, r.bottom);
    }
    // 头一回填东西，小算盘来问要不要帮忙
    function greetBook() {
      if (bookGreeted || !pal) return;
      bookGreeted = pal.ask(PAL.bookHello, [PAL.bookYes, PAL.helpNo], i => {
        if (i === 1) { pal.say(PAL.noHelp); return; }
        // 每一列：最后一个数下面空一格放合计
        BOOK_COLS.forEach(c => {
          let last = 0;
          for (let r = 1; r <= 11; r++) if (book[c + r] && isNum(book[c + r].v)) last = r;
          if (last && !(book[c + (last + 1)] && book[c + (last + 1)].v !== '')) autoSum(c + (last + 1));
        });
        pal.say(PAL.bookDone);
      });
    }

    /* ================= 只读的表（网上邻居里别人的） ================= */
    if (ro) {
      merge('A1', cols.length);
      set('A1', o.cap, '', 'xl-head xl-cap');
      o.cols.forEach((h, i) => set(cols[i] + 2, h, '', 'xl-th'));
      o.rows.forEach((r, k) => r.forEach((t, i) => {
        const a = o.align && o.align[i] ? 'xl-' + o.align[i] : '';
        set(cols[i] + (k + 3), t, '', (a + (o.total && k === o.rows.length - 1 ? ' xl-b' : '')).trim());
      }));
      if (o.foot) { const fr = o.rows.length + 3; merge('A' + fr, cols.length); set('A' + fr, o.foot, '', 'xl-foot'); }
    }

    /* ================= 图表向导：出来一张真的饼 ================= */
    function chartWizard() {
      let step = 0, kind = 0, title = '';
      const body = el('div', { class: 'xl-cw-body' });
      const btns = el('div', { class: 'dlg-btns' });
      const w = OS.wm.open({ title: CHART.title(1) + ' - ' + CHART.steps[0], icon: 'sheet', width: 280, content: el('div', { class: 'xl-cw' }, [body, btns]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
      const B = (t, fn, dis) => { const b = el('button', { class: 'xpbtn', text: t }); b.disabled = !!dis; b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };
      const show = () => {
        w.setTitle(CHART.title(step + 1) + ' - ' + CHART.steps[step]);
        body.textContent = ''; btns.textContent = '';
        if (step === 0) {
          const list = el('div', { class: 'xl-cw-list' }, CHART.types.map((t, i) => {
            const r = el('div', { class: 'xl-cw-li' + (i === kind ? ' on' : ''), text: t });
            r.addEventListener('click', () => { kind = i; list.querySelectorAll('.xl-cw-li').forEach((x, k) => x.classList.toggle('on', k === i)); });
            return r;
          }));
          body.append(el('div', { text: CHART.steps[0] + '：' }), list);
        } else if (step === 1) body.append(el('div', { class: 'xl-cw-box', text: CHART.range }));
        else if (step === 2) {
          const input = el('input', { class: 'xl-input', type: 'text', maxlength: '12' });
          input.value = title;
          input.addEventListener('input', () => { title = input.value.trim(); });
          body.append(el('div', { text: CHART.label }), input);
        } else body.append(el('label', { class: 'xl-cw-opt' }, [el('input', { type: 'radio', checked: 'checked' }), el('span', { text: CHART.place })]));
        btns.append(B(CHART.cancel, () => w.close()), B(CHART.prev, () => { step--; show(); }, step === 0));
        btns.append(step < 3 ? B(CHART.next, () => { step++; show(); }) : B(CHART.done, () => { w.close(); addPie({ t: title }, true); }));
      };
      show();
    }
    // 饼放在表格上面，能拖；右键删掉
    function addPie(p, fresh) {
      const node = el('div', { class: 'xl-pie' + (fresh ? ' restored' : '') }, [p.t ? el('div', { class: 'xl-pie-t', text: p.t }) : null, el('img', { class: 'xl-pie-img', src: PIE_SRC, alt: '' })]);
      const pie = { node, t: p.t || '', x: p.x != null ? p.x : gridWrap.scrollLeft + 30 + Math.random() * 60, y: p.y != null ? p.y : gridWrap.scrollTop + 26 + Math.random() * 30 };
      const place = () => { node.style.left = pie.x + 'px'; node.style.top = pie.y + 'px'; };
      place();
      gridWrap.appendChild(node);
      pies.push(pie);
      if (fresh) { touched(); setTimeout(() => node.classList.remove('restored'), 400); if (pal) later(() => pal.say(PAL.pie), 500); }
      node.addEventListener('pointerdown', e => {
        if (e.button != null && e.button !== 0) return;
        e.stopPropagation(); e.preventDefault();
        const s = OS.stage.toLocal(e.clientX, e.clientY), ox = pie.x, oy = pie.y;
        try { node.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        const move = ev => { const q = OS.stage.toLocal(ev.clientX, ev.clientY); pie.x = Math.max(0, ox + q.x - s.x); pie.y = Math.max(0, oy + q.y - s.y); place(); };
        const up = () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); if (pie.x !== ox || pie.y !== oy) touched(); };
        node.addEventListener('pointermove', move);
        node.addEventListener('pointerup', up);
        node.addEventListener('pointercancel', up);
      });
      OS.ui.onContext(node, () => [
        { label: CHART.kind, action: say(SOFT, 'info', CHART.kindText) },
        '-',
        { label: CHART.del, action: () => { node.remove(); pies.splice(pies.indexOf(pie), 1); touched(); } }
      ]);
    }

    /* ================= 保存：存成 .xls 放进我的文档 ================= */
    const snapshot = () => ({
      mode, who, rolls, custom: customNames.slice(),
      rows: rows ? rows.map(r => Object.assign({}, r)) : null,
      cells: mode === 'book' ? JSON.parse(JSON.stringify(book)) : null,
      pies: pies.map(p => ({ x: Math.round(p.x), y: Math.round(p.y), t: p.t }))
    });
    function save(asNew) {
      return new Promise(res => {
        if (ro) { OS.ui.dialog({ title: SOFT, icon: 'warn', text: F.ro(name) }); res(false); return; }
        if (!asNew && path && FS.get(path)) { FS.setSheet(path, snapshot()); dirty = false; status.textContent = F.saved; res(true); return; }
        const base = name.replace(/\.xls$/i, '');
        OS.explorer.askText(F.saveAs.replace('…', ''), F.fileName, base + '.xls', v => {
          if (v == null || win.isClosed) { res(false); return; }
          let fname = v.trim().replace(/[\\/:*?"<>|]/g, '');
          if (!fname) { res(false); return; }
          if (!/\.xls$/i.test(fname)) fname += '.xls';
          const same = FS.get(FS.join(FS.MYDOCS, fname));
          let node;
          if (same && same.user) { FS.setSheet(same.path, snapshot()); node = same; }
          else node = FS.createFile(FS.MYDOCS, fname, 'xls', { sheet: snapshot() });
          if (!node) { res(false); return; }
          path = node.path; name = node.name; dirty = false;
          win.setTitle(TITLE(name));
          status.textContent = F.saved;
          res(true);
        });
      });
    }

    const win = OS.wm.open({
      title: TITLE(name) + (ro ? ' [只读]' : ''), icon: 'sheet', width: ro ? Math.max(400, Math.min(452, 22 + widths.reduce((a, b) => a + b, 0) + 26)) : 452,
      appId: o.appId || xapp.id, content, maximizable: false, center: true,
      beforeClose: () => {
        if (!dirty) return true;
        OS.ui.dialog({ title: SOFT, icon: 'warn', text: F.ask(name), buttons: [F.yes, F.no, F.cancel] }).then(v => {
          if (v === F.no) { dirty = false; win.close(); } else if (v === F.yes) save(false).then(ok => { if (ok) win.close(); });
        });
        return false;
      },
      onClose: () => { dead = true; timers.forEach(clearTimeout); }
    });
    win.filePath = () => path;   // 磁盘清理（cleanup.js）删了这个文件：窗口直接关掉

    /* ---------- 小算盘（offense.js；只读的表不放） ---------- */
    if (!ro) {
      pal = OS.offense.pal(gridWrap, later, () => dead, PAL, {
        help: () => { rows = null; calc(); later(() => pal.say(PAL.didHelp), 1300); }
      });
    }

    /* ---------- 存过的：接着上次的样子 ---------- */
    const sv = o.sheet;
    if (sv) {
      if (mode === 'debt') {
        customNames = (sv.custom || []).slice();
        if (sv.who) { setWho(sv.who, '', true); if (sv.rows) { rows = sv.rows.map(r => Object.assign({}, r)); rolls = sv.rolls || 1; fill(false); } }
      }
      if (mode === 'book' && sv.cells) { Object.assign(book, sv.cells); recalc(); }
      (sv.pies || []).forEach(p => addPie(p, false));
      dirty = false;
    }
    select('A1');
    return win;
  }

  /* ================= 打开法 ================= */
  // 新建一个空白工作簿 ／ 一张新的欠款明细单（不是那个文件，存的时候另起名字）
  function blankBook() { bookNo++; return openSheet({ mode: 'book', name: 'Book' + bookNo, appId: xapp.id }); }
  let debtNo = 0;
  function newDebt() { debtNo++; return openSheet({ mode: 'debt', name: '欠款明细单' + debtNo, appId: xapp.id }); }
  xapp.open = () => blankBook();
  app.open = () => openSheet({ mode: 'debt', name: app.name, appId: app.id });
  OS.excuse = {
    // 我的文档里存过的 .xls
    open: nd => {
      const sv = nd.sheet || { mode: 'book' };
      return openSheet({ mode: sv.mode === 'debt' ? 'debt' : 'book', name: nd.name, path: nd.path, sheet: sv, appId: xapp.id });
    },
    // 别人的表（网上邻居）：只读；tools = 额外的工具栏按钮
    view: o => openSheet(Object.assign({ mode: 'ro', appId: xapp.id }, o)),
    blank: blankBook
  };

  /* 打一张欠条（打印机滋滋响，1.2 秒后弹出来）。网上邻居里小卖部老板的账本也用它，反过来打"你欠老板的"。
     info: { to: 欠谁的, who: 欠款人, rows: [{ what, qty, amt }], total, note: 最下面小字, post: 要不要［发到群里］, title } */
  OS.printSlip = function (info, done) {
    [0, 300, 600, 900].forEach(t => setTimeout(() => OS.sound.play('printer'), t));
    setTimeout(() => { slipWindow(info); OS.sound.play('ding'); if (done) done(); }, 1200);
  };
  function slipWindow(info) {
    const big = info.total >= 1e8 ? TOO_BIG : bigRMB(info.total);
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
      el('div', { class: 'qt-last' }, [el('div', { class: 'qt-note', text: (info.note || SLIP_NOTE).replace(/^（(.*)）$/, '$1。') }), postBtn])
    ]);
    if (info.elOnly) return slip;   // ABCSee 里看欠条.jpg：只要这张纸
    return OS.wm.open({ title: info.viewName ? info.viewName + ' - 图片和传真查看器' : '欠条 - ' + (info.title || app.name), icon: info.viewName ? 'paint' : 'sheet', width: 340, content: slip, maximizable: false });
  }
  // 我的图片里存的欠条：再打开看看（mydocs.js）
  OS.showSlip = (info, name) => slipWindow(Object.assign({}, info, { post: false, viewName: name }));
  OS.slipEl = info => slipWindow(Object.assign({}, info, { post: false, elOnly: true }));
  OS.slipDate = () => SLIP_DATE();

  // "自己输入…"：一个小输入框（这里可以打字，手机上会弹输入法）
  function askName(label, max, done) {
    const input = el('input', { class: 'xl-input', type: 'text', maxlength: String(max) });
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const no = el('button', { class: 'xpbtn', text: '取消' });
    let finished = false;
    const finish = v => { if (finished) return; finished = true; w.close(); done(v); };
    const w = OS.wm.open({
      title: SOFT, icon: 'sheet', width: 230, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'xl-ask' }, [el('div', { text: label }), input, el('div', { class: 'xl-ask-btns' }, [ok, no])]),
      onClose: () => { if (!finished) { finished = true; done(''); } }
    });
    const val = () => input.value.trim().slice(0, max);
    ok.addEventListener('click', () => { OS.sound.play('click'); finish(val()); });
    no.addEventListener('click', () => { OS.sound.play('click'); finish(''); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(val()); if (e.key === 'Escape') finish(''); });
    setTimeout(() => input.focus(), 50);
  }

  // 欠条上的红手印（Codex 画的，assets/debt/thumb.webp）
  const THUMB_SRC = 'assets/debt/thumb.webp';

  /* ---------- 图标右键（在新建文件夹(2) 里）：照真的 .xls 文件 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    return [
      P.open,
      { label: '新建', action: say(SOFT, 'info', '一张欠条还不够吗？') },
      { label: '打印', action: say('打印', 'info', '请先打开表格把账算好，再打印。') },
      '-',
      {
        label: '发送到', sub: [
          { label: '3½ 英寸软盘 (A:)', action: say('发送到', 'info', '软盘装得下，但对方不会看的。') },
          { label: '邮件收件人', action: () => OS.mail.compose({ name: '欠条打印专家 2003.xls', icon: 'sheet' }) },
          { label: '桌面快捷方式', action: P.shortcut.action }
        ]
      },
      '-', P.cut, P.copy, '-', P.del, P.rename, '-',
      { label: '属性', action: say('「' + app.name + '」属性', 'info', '类型：Excuse 工作表\n大小：250 KB\n作者：你\n最后修改者：欠你钱的那位') }
    ];
  };
})();

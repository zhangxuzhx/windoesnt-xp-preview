/* Outluck Excess（开始菜单左栏"电子邮件"）——照那几年系统自带的邮件软件做，不用打字
   - 收件箱 ／ 发件箱 ／ 已发送邮件 ／ 已删除邮件 ／ 草稿；点一封下面就预览
   - 第一次打开先走"Internet 连接向导"（全都帮你填好了）
   - ［发送/接收］：56K 拨号（偶尔家里有人拿起电话就断了），发件箱的信发出去、新邮件一封封下下来；邮箱满了（2 MB）就收不了
   - 写信：从通讯簿挑人、挑一个模板，附件从我的文档挑；"发送"只是放进发件箱，点了［发送/接收］才真发出去
   - 别的软件"发送到 ▸ 邮件收件人"：OS.mail.compose({ attach }) 直接开一封带附件的新邮件
   - 王阿姨那封转发链：［转发］= 跟网上邻居里转发长寿文章一样，发给抠抠好友（network.js）
   - 蓝屏：物业群发给全楼的停水通知点［全部答复］并发出去 → 全楼都点了全部答复 → REPLY_ALL_STORM
   - 管理员只是占位：通讯簿里没有他，也没有他的信 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.mail;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = 'Outluck Excess';
  const MY_ADDR = '8008208820@koukou.com';
  const L = {
    menus: ['文件(F)', '工具(T)', '帮助(H)'],
    tools: ['创建邮件', '答复', '全部答复', '转发', '打印', '删除', '发送/接收', '地址'],
    folders: [['inbox', '收件箱'], ['outbox', '发件箱'], ['sent', '已发送邮件'], ['deleted', '已删除邮件'], ['drafts', '草稿']],
    cols: ['发件人', '主题', '接收时间'], colsTo: ['收件人', '主题', '发送时间'],
    status: (n, u) => n + ' 封邮件，' + u + ' 封未读',
    offline: '正在工作（离线）', online: '已连接',
    empty: '此视图中没有可显示的项目。',
    pickOne: '请先选中一封邮件。',
    from: '发件人：', to: '收件人：', subject: '主题：', attach: '附件：',
    // 连接向导
    wizTitle: 'Internet 连接向导',
    wiz: [
      ['您的姓名', '发送电子邮件时，您的姓名将出现在外发邮件的"发件人"字段。', '显示名：', '你'],
      ['Internet 电子邮件地址', '您的电子邮件地址是别人用来给您发送电子邮件的地址。', '电子邮件地址：', MY_ADDR],
      ['电子邮件服务器名', '我的接收邮件服务器是 POP3 服务器。', '接收邮件服务器：', 'pop.不知道.com']
    ],
    wizDone: '完成！\n向导也不知道这些设置对不对。',
    back: '< 上一步', next: '下一步 >', finish: '完成',
    // 发送/接收
    srTitle: '正在发送和接收', dialing: '正在拨号……', verifying: '正在验证用户名和密码……',
    sending: (i, n) => '正在发送第 ' + i + ' 封，共 ' + n + ' 封……', receiving: (i, n) => '正在下载第 ' + i + ' 封，共 ' + n + ' 封……',
    nothing: '没有新邮件。', srDone: '完成。',
    phone: '连接失败：家里有人拿起了电话。',
    full: '您的邮箱已满（2 MB）。\n请删除一些邮件。',
    // 写信
    newMail: '新邮件', send: '发送', cancel: '取消', addAttach: '添加附件…', pickTo: '选择收件人', pickTpl: '选一个模板：',
    noTo: '请至少选择一个收件人。', noBody: '请先选一个模板。',
    saveAsk: '要保存这封邮件吗？\n保存后可以在"草稿"里找到它。',
    noAttach: '我的文档里没有能当附件的文件。',
    tpls: [
      ['问候', '最近好吗', '好久不见，最近怎么样？\n有空出来玩。'],
      ['借钱', '江湖救急', '能先借我 50 块吗？\n下个月一定还。'],
      ['道歉', '对不起', '上次的事是我不对。\n别生气了。'],
      ['请假条', '请假条', '因身体不适，明天请假一天。\n望批准。'],
      ['情书', '有句话想对你说', '其实我一直……\n算了，当面说吧。']
    ],
    replyTpls: [['收到', '收到。'], ['好的', '好的，知道了。'], ['谢谢', '谢谢。']],
    // 其他
    delForever: '确定要永久删除这封邮件吗？',
    book: '通讯簿', bookNew: '新建联系人', bookNewFail: '新建失败：你认识的人都在这儿了。',
    account: '帐户', accountText: '邮件帐户：' + MY_ADDR + '\n接收邮件服务器：pop.不知道.com\n发送邮件服务器：smtp.不知道.com',
    about: '关于 ' + NAME, aboutText: NAME + '\n版本 6.0\n(C) ' + OS.YEAR + ' 无聊科技\n祝你好运。',
    card: '贺卡正在加载……\n请安装最新版播放插件。',
    broken: '附件已损坏，无法打开。'
  };
  const BSOD = { id: 'mail', name: 'REPLY_ALL_STORM', text: '你点了全部答复，全楼都点了全部答复。' };
  const FULL_KB = 2048;
  const SENT_MAX = 20;

  // 通讯簿：抠抠好友 + 楼里的人（没有管理员：他只是占位）
  const BOOK = [
    ['同桌', '12345678@koukou.com'], ['发小', '23456789@koukou.com'], ['上铺的室友', '34567890@koukou.com'],
    ['楼下小卖部老板', '10000001@koukou.com'], ['隔壁班的', '45678901@koukou.com'], ['班长', '56789012@koukou.com'],
    ['轻舞飞扬', '52013140@koukou.com'], ['╰☆ゞ寂寞の烟花ゞ☆╮', '13141314@koukou.com'], ['≮踏雪无痕≯', '66666666@koukou.com'],
    ['对门王阿姨', 'wangayi1958@koukou.com'], ['幸福小区物业', 'wuye@xingfuxiaoqu.com'], ['隔壁大学生', 'gebi_daxuesheng@koukou.com']
  ];
  const ALL_BUILDING = '全楼住户（168 人）';
  // 王阿姨的转发链：二十层"转发："
  const CHAIN = Array.from({ length: 20 }, () => '转发：').join('') + '\n转发给 10 个人就能长寿，不转的话……';
  // 一开始收件箱里就有的
  const SEED = [
    { from: '隔壁大学生', subject: '种子', body: '你要的都在我共享里，自己拿。\n顺便放了个海葵抠抠，装上能看见谁把你拉黑了。', kb: 6, ago: 26 },
    { from: '发小', subject: '你妈让我问你', body: '什么时候回家吃饭？', kb: 3, ago: 9 },
    { from: '幸福小区物业', to: ALL_BUILDING, subject: '停水通知', body: '明天停水。', kb: 4, ago: 3, building: true }
  ];
  // ［发送/接收］时陆续来的
  const POOL = [
    { from: '对门王阿姨', subject: '转给你看看', body: CHAIN, kb: 120, chain: true, attach: { name: '转发给10个人就能长寿.doc', icon: 'doc', chain: true } },
    { from: '抠抠官方', subject: '余额提醒', body: '您的抠币余额为 0。', kb: 5 },
    { from: '幸运抽奖中心', subject: '恭喜您！', body: null, kb: 18, lucky: true },
    { from: '考试服务中心', subject: '四六级包过', body: '四六级包过，不过退款。\n退款请先交 200 元手续费。', kb: 9 },
    { from: '健康养生网', subject: '祖传秘方', body: '祖传秘方，一周长高 10 厘米。', kb: 11 },
    { from: '电子贺卡中心', subject: '你的好友给你寄了一张电子贺卡', body: L.card, kb: 240, card: true },
    { from: '邮件系统', subject: '邮件被退回', body: '邮件被退回：对方邮箱已满。', kb: 7 }
  ];
  const luckyText = n => '恭喜您成为本站第 ' + n + ' 位幸运访客！\n您获得笔记本电脑一台。';
  // 全部答复风暴：全楼一封接一封回
  const STORM_WHO = ['101 张大爷', '102 李阿姨', '201 王叔', '202 刘奶奶', '301 小陈', '302 赵老师', '401 同桌他妈', '402 孙姐', '501 周哥', '502 吴婶', '601 郑大爷', '602 小冯'];
  const STORM_SAY = ['收到', '收到+1', '收到！', '+1', '我也收到了', '请不要点全部答复', '你们别回了', '谁拉我进来的', '楼上的别刷了', '请问几点停？', '退订', '收到，谢谢物业', '别回了！！！', '我手机响个不停'];

  /* ================= 存档 ================= */
  // { seq, mails: [{ id, folder, from, to, subject, body, at, read, kb, attach, chain, card, building, replyAll }], pool, lucky, wiz }
  let db = OS.save.get('mail', null);
  function fresh() {
    const now = OS.clock.now().getTime();
    let seq = 0;
    return {
      seq: 0, pool: 0, lucky: 10000, wiz: false,
      mails: SEED.map(m => Object.assign({ id: ++seq, folder: 'inbox', to: '你', at: now - m.ago * 3600e3, read: false, attach: null }, m, { ago: undefined }))
    };
  }
  if (!db) { db = fresh(); db.seq = db.mails.length; }
  const save = () => OS.save.set('mail', db);
  const newId = () => ++db.seq;
  const inFolder = f => db.mails.filter(m => m.folder === f).sort((a, b) => b.at - a.at);
  const inboxKB = () => db.mails.filter(m => m.folder === 'inbox').reduce((s, m) => s + (m.kb || 4), 0);
  const fmtTime = t => {
    const d = new Date(t), n = OS.clock.now();
    const same = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    return same ? OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()) : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes());
  };

  /* ================= 主窗口 ================= */
  let win = null, ui = null, folder = 'inbox', selId = null, busy = false, storm = null;
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    ui = build();
    win = OS.wm.open({
      title: '收件箱 - ' + NAME, icon: 'mail', width: 476, height: 296, appId: app.id, content: ui.box, maximizable: false, center: true,
      onClose: () => { win = null; ui = null; }
    });
    render();
    if (!db.wiz) wizard();
    return win;
  };

  function build() {
    const bar = OS.ui.menuBar(L.menus, menuFor, 'ml-mbar');
    const tools = el('div', { class: 'ml-tools' }, L.tools.map((t, i) => {
      const b = el('button', { class: 'ml-tb', text: t });
      b.addEventListener('click', () => { OS.sound.play('click'); toolAct(i); });
      return b;
    }));
    const tree = el('div', { class: 'ml-tree' });
    const head = el('div', { class: 'ml-row ml-head' });
    const rows = el('div', { class: 'ml-rows' });
    const list = el('div', { class: 'ml-list' }, [head, rows]);
    const prev = el('div', { class: 'ml-prev' });
    OS.ui.scrollable(list);
    OS.ui.scrollable(prev);
    const status = el('div', { class: 'ml-status' }, [el('span'), el('span')]);
    const box = el('div', { class: 'ml' }, [bar, tools, el('div', { class: 'ml-main' }, [tree, el('div', { class: 'ml-right' }, [list, prev])]), status]);
    return { box, tree, head, rows, list, prev, status };
  }

  function render() {
    if (!ui || !win || win.isClosed) return;
    const fname = L.folders.find(f => f[0] === folder)[1];
    win.setTitle(fname + ' - ' + NAME);
    // 左边文件夹
    ui.tree.textContent = '';
    ui.tree.appendChild(el('div', { class: 'ml-tcap', text: '本地文件夹' }));
    L.folders.forEach(([k, label]) => {
      const n = k === 'inbox' ? db.mails.filter(m => m.folder === k && !m.read).length : k === 'outbox' ? inFolder(k).length : 0;
      const it = el('div', { class: 'ml-ti' + (k === folder ? ' sel' : '') + (n ? ' bold' : '') }, [OS.iconEl('folder', 'ml-tico'), el('span', { text: label + (n ? ' (' + n + ')' : '') })]);
      it.addEventListener('click', () => { OS.sound.play('click'); folder = k; selId = null; render(); });
      ui.tree.appendChild(it);
    });
    // 邮件列表
    const outgoing = folder === 'outbox' || folder === 'sent' || folder === 'drafts';
    ui.head.textContent = '';
    (outgoing ? L.colsTo : L.cols).forEach((c, i) => ui.head.appendChild(el('span', { class: 'ml-c ml-c' + i, text: c })));
    const list = inFolder(folder);
    const top = ui.list.scrollTop;
    ui.rows.textContent = '';
    if (!list.length) ui.rows.appendChild(el('div', { class: 'ml-none', text: L.empty }));
    list.forEach(m => {
      const row = el('div', { class: 'ml-row' + (m.id === selId ? ' sel' : '') + (!m.read && folder === 'inbox' ? ' unread' : '') }, [
        el('span', { class: 'ml-c ml-c0' }, [m.attach ? el('i', { class: 'ml-clip' }) : null, el('span', { text: outgoing ? m.to : m.from })]),
        el('span', { class: 'ml-c ml-c1', text: m.subject }),
        el('span', { class: 'ml-c ml-c2', text: fmtTime(m.at) })
      ]);
      let last = 0;
      row.addEventListener('click', () => {
        const now = Date.now();
        selId = m.id;
        if (!m.read) { m.read = true; save(); }
        render();
        if (now - last < OS.dblMs() && folder === 'drafts') compose({ draft: m });
        last = now;
      });
      ui.rows.appendChild(row);
    });
    ui.list.scrollTop = top;
    // 预览
    const m = db.mails.find(x => x.id === selId);
    ui.prev.textContent = '';
    if (m) {
      ui.prev.appendChild(el('div', { class: 'ml-ph' }, [
        el('div', {}, [el('b', { text: L.from }), el('span', { text: m.from })]),
        el('div', {}, [el('b', { text: L.to }), el('span', { text: m.to })]),
        el('div', {}, [el('b', { text: L.subject }), el('span', { text: m.subject })])
      ]));
      if (m.attach) {
        const a = el('div', { class: 'ml-att' }, [OS.iconEl(m.attach.icon || 'doc', 'ml-aico'), el('span', { text: m.attach.name })]);
        a.addEventListener('click', () => { OS.sound.play('click'); openAttach(m.attach); });
        ui.prev.appendChild(el('div', { class: 'ml-atrow' }, [el('b', { text: L.attach }), a]));
      }
      ui.prev.appendChild(el('div', { class: 'ml-body' + (m.card ? ' card' : ''), text: m.body }));
    }
    // 状态栏
    const inbox = db.mails.filter(x => x.folder === folder);
    ui.status.children[0].textContent = L.status(inbox.length, inbox.filter(x => !x.read).length);
    ui.status.children[1].textContent = busy ? L.online : L.offline;
  }

  function openAttach(a) {
    if (a.chain && OS.netShared && OS.netShared.longevity) { OS.netShared.longevity(); return; }
    // 自己从我的文档挂上的：还在就打开
    const n = a.path && OS.fs.get(a.path);
    if (n && OS.explorer && OS.explorer.openFile) { OS.explorer.openFile(n); return; }
    OS.ui.dialog({ title: NAME, icon: 'error', text: L.broken });
  }

  /* ---------- 工具栏 ---------- */
  function selected() { return db.mails.find(x => x.id === selId) || null; }
  function toolAct(i) {
    const m = selected();
    const need = fn => () => (m ? fn(m) : OS.ui.dialog({ title: NAME, icon: 'info', text: L.pickOne }));
    [
      () => compose({}),
      need(x => compose({ reply: x })),
      need(x => compose({ reply: x, all: true })),
      need(x => (x.chain && OS.netShared && OS.netShared.forwardChain ? OS.netShared.forwardChain() : compose({ fwd: x }))),
      need(() => { OS.sound.play('printer'); setTimeout(() => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }), 900); }),
      need(del),
      sendReceive,
      addressBook
    ][i]();
  }
  function del(m) {
    if (m.folder !== 'deleted') { m.folder = 'deleted'; selId = null; save(); render(); return; }
    OS.ui.dialog({ title: NAME, icon: 'warn', text: L.delForever, buttons: ['是', '否'] }).then(v => {
      if (v !== '是') return;
      db.mails = db.mails.filter(x => x !== m);
      selId = null; save(); render();
    });
  }
  function addressBook() {
    const list = el('div', { class: 'ml-book' }, BOOK.map(([n, a]) => el('div', { class: 'ml-brow' }, [el('b', { text: n }), el('span', { text: a })])));
    OS.ui.scrollable(list);
    const add = el('button', { class: 'xpbtn', text: L.bookNew });
    const close = el('button', { class: 'xpbtn default', text: '关闭' });
    const w = OS.wm.open({ title: L.book, icon: 'mail', width: 280, height: 220, content: el('div', { class: 'ml-bookw' }, [list, el('div', { class: 'dlg-btns' }, [add, close])]), maximizable: false, center: true });
    add.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: L.book, icon: 'info', text: L.bookNewFail }); });
    close.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  }

  /* ---------- 菜单 ---------- */
  function menuFor(name) {
    if (name === L.menus[0]) return [
      { label: '新建 ▸ 邮件', action: () => compose({}) },
      { label: '打印…', action: () => toolAct(4) },
      '-',
      { label: '退出', action: () => win && win.close() }
    ];
    if (name === L.menus[1]) return [
      { label: '发送和接收', action: sendReceive },
      { label: L.book + '…', action: addressBook },
      '-',
      { label: L.account + '…', action: say(L.account, 'info', L.accountText) }
    ];
    if (name === L.menus[2]) return [{ label: L.about, action: say(L.about, 'info', L.aboutText) }];
    return null;
  }

  /* ---------- 第一次打开：Internet 连接向导 ---------- */
  function wizard() {
    let page = 0;
    const main = el('div', { class: 'ml-wiz' });
    const btns = el('div', { class: 'dlg-btns' });
    const w = OS.wm.open({ title: L.wizTitle, icon: 'mail', width: 300, content: el('div', {}, [main, btns]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      onClose: () => { db.wiz = true; save(); } });
    const b = (t, fn, dis) => { const x = el('button', { class: 'xpbtn', text: t }); x.disabled = !!dis; x.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return x; };
    function show() {
      main.textContent = ''; btns.textContent = '';
      if (page < L.wiz.length) {
        const [cap, tip, label, val] = L.wiz[page];
        const input = el('input', { class: 'ml-win', type: 'text', value: val, readonly: 'readonly' });
        main.append(el('div', { class: 'ml-wcap', text: cap }), el('div', { class: 'ml-wtip', text: tip }), el('div', { class: 'ml-wrow' }, [el('span', { text: label }), input]));
        btns.append(b(L.back, () => { page--; show(); }, page === 0), b(L.next, () => { page++; show(); }));
      } else {
        main.appendChild(el('div', { class: 'ml-wcap', text: L.wizDone }));
        btns.append(b(L.back, () => { page--; show(); }), b(L.finish, () => w.close()));
      }
    }
    show();
  }

  /* ---------- 写信 ---------- */
  // o: { reply, all, fwd, attach, draft }
  function compose(o) {
    o = o || {};
    if (!db.wiz && !(win && !win.isClosed)) { app.open(); }
    const src = o.reply || o.fwd || o.draft || null;
    const st = {
      to: o.draft ? o.draft.to : o.reply ? (o.all && src.building ? ALL_BUILDING : src.from) : '',
      subject: o.draft ? o.draft.subject : o.reply ? 'Re: ' + src.subject : o.fwd ? 'Fw: ' + src.subject : '',
      body: o.draft ? o.draft.body : o.fwd ? '-----原始邮件-----\n' + L.from + src.from + '\n\n' + src.body : '',
      attach: o.draft ? o.draft.attach : o.attach || (o.fwd ? src.attach : null),
      replyAll: !!(o.reply && o.all && src.building) || !!(o.draft && o.draft.replyAll)
    };
    let sent = false;
    const toEl = el('span', { class: 'ml-cto' });
    const subjEl = el('span', { class: 'ml-csubj' });
    const attEl = el('div', { class: 'ml-catt' });
    const bodyEl = el('div', { class: 'ml-cbody' });
    const tplRow = el('div', { class: 'ml-ctpl' });
    const pickTo = el('button', { class: 'xpbtn ml-csm', text: L.pickTo + ' ▼' });
    const addAtt = el('button', { class: 'xpbtn ml-csm', text: L.addAttach });
    const sendB = el('button', { class: 'xpbtn default', text: L.send });
    const cancelB = el('button', { class: 'xpbtn', text: L.cancel });
    const content = el('div', { class: 'ml-comp' }, [
      el('div', { class: 'ml-cf' }, [el('b', { text: L.to }), toEl, o.reply ? null : pickTo]),
      el('div', { class: 'ml-cf' }, [el('b', { text: L.subject }), subjEl]),
      el('div', { class: 'ml-cf' }, [el('b', { text: L.attach }), attEl, addAtt]),
      el('div', { class: 'ml-ccap', text: L.pickTpl }), tplRow, bodyEl,
      el('div', { class: 'dlg-btns' }, [sendB, cancelB])
    ]);
    const cw = OS.wm.open({ title: st.subject || L.newMail, icon: 'mail', width: 300, content, maximizable: false, center: true,
      beforeClose: () => { if (sent || !(st.to || st.body)) return true; askSave(); return false; } });
    function paint() {
      toEl.textContent = st.to || '';
      subjEl.textContent = st.subject || '';
      attEl.textContent = '';
      if (st.attach) attEl.append(OS.iconEl(st.attach.icon || 'doc', 'ml-aico'), el('span', { text: st.attach.name }));
      bodyEl.textContent = st.body || '';
      cw.setTitle(st.subject || L.newMail);
    }
    // 模板：写新信 = 五个模板；答复 = 收到 ／ 好的 ／ 谢谢；转发 = 原文不动
    const tpls = o.reply ? L.replyTpls.map(([n, t]) => [n, null, t]) : o.fwd ? [] : L.tpls;
    tpls.forEach(([n, subj, text]) => {
      const c = el('span', { class: 'ml-chip', text: n });
      c.addEventListener('click', () => { OS.sound.play('click'); if (subj) st.subject = subj; st.body = text + (o.reply ? '\n\n-----原始邮件-----\n' + src.body : ''); paint(); });
      tplRow.appendChild(c);
    });
    pickTo.addEventListener('click', e => {
      e.stopPropagation(); OS.sound.play('click');
      const r = OS.stage.rectOf(pickTo);
      OS.ui.contextMenu(BOOK.map(([n]) => ({ label: n, action: () => { st.to = n; paint(); } })), r.left, r.bottom);
    });
    addAtt.addEventListener('click', e => {
      e.stopPropagation(); OS.sound.play('click');
      const files = OS.fs.list(OS.fs.MYDOCS).filter(n => !n.folder);
      if (!files.length) { OS.ui.dialog({ title: L.newMail, icon: 'info', text: L.noAttach }); return; }
      const r = OS.stage.rectOf(addAtt);
      OS.ui.contextMenu(files.map(n => ({ label: n.name, action: () => { st.attach = { name: n.name, icon: n.icon, path: n.path }; paint(); } })), r.left, r.bottom);
    });
    sendB.addEventListener('click', () => {
      OS.sound.play('click');
      if (!st.to) { OS.ui.dialog({ title: L.newMail, icon: 'warn', text: L.noTo }); return; }
      if (!st.body) { OS.ui.dialog({ title: L.newMail, icon: 'warn', text: L.noBody }); return; }
      put('outbox');
      sent = true;
      cw.close();
    });
    cancelB.addEventListener('click', () => { OS.sound.play('click'); OS.wm.requestClose(cw); });
    function put(f) {
      if (o.draft) db.mails = db.mails.filter(x => x !== o.draft);
      db.mails.push({ id: newId(), folder: f, from: '你', to: st.to, subject: st.subject || '（无主题）', body: st.body, at: OS.clock.now().getTime(), read: true, kb: 4 + (st.attach ? 60 : 0), attach: st.attach, replyAll: st.replyAll });
      save(); render();
    }
    function askSave() {
      OS.ui.dialog({ title: L.newMail, icon: 'help', text: L.saveAsk, buttons: ['是', '否', '取消'] }).then(v => {
        if (v === '取消' || v === null) return;
        if (v === '是') put('drafts');
        sent = true;
        cw.close();
      });
    }
    paint();
    return cw;
  }

  /* ---------- 发送/接收：56K 拨号 ---------- */
  async function sendReceive() {
    if (busy || storm) return;
    busy = true; render();
    const line = el('div', { class: 'ml-srl' });
    const fill = el('div', { class: 'ml-srf' });
    const w = OS.wm.open({ title: L.srTitle, icon: 'mail', width: 260, content: el('div', { class: 'ml-sr' }, [line, el('div', { class: 'ml-srb' }, [fill])]), modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog', noClose: true });
    const step = async (text, p, ms) => { line.textContent = text; fill.style.width = p + '%'; await OS.wait(ms); return !w.isClosed; };
    const done = () => { busy = false; if (!w.isClosed) w.close(); render(); };
    OS.sound.play('dialup');
    if (!await step(L.dialing, 15, 1500)) return done();
    // 偶尔家里有人拿起电话（第一次不会）
    if (db.srCount && Math.random() < 0.15) { done(); OS.ui.dialog({ title: NAME, icon: 'error', text: L.phone }); return; }
    db.srCount = (db.srCount || 0) + 1;
    if (!await step(L.verifying, 30, 700)) return done();
    const out = inFolder('outbox');
    let stormNow = false;
    for (let i = 0; i < out.length; i++) {
      if (!await step(L.sending(i + 1, out.length), 30 + 30 * (i + 1) / out.length, 500)) return done();
      out[i].folder = 'sent';
      out[i].at = OS.clock.now().getTime();
      if (out[i].replyAll) stormNow = true;
    }
    // 已发送邮件最多留 20 封
    const sentList = inFolder('sent');
    if (sentList.length > SENT_MAX) { const drop = new Set(sentList.slice(SENT_MAX)); db.mails = db.mails.filter(x => !drop.has(x)); }
    save();
    if (stormNow) { done(); startStorm(); return; }
    if (inboxKB() >= FULL_KB) { done(); OS.ui.dialog({ title: NAME, icon: 'warn', text: L.full }); return; }
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      if (!await step(L.receiving(i + 1, n), 60 + 40 * (i + 1) / n, 600)) return done();
      arrive();
    }
    await step(L.srDone, 100, 300);
    done();
    OS.sound.play('ding');
  }
  // 来一封新的：先按顺序来那几封，来完了就一直来"幸运访客"
  function arrive() {
    const now = OS.clock.now().getTime();
    let m;
    if (db.pool < POOL.length) m = Object.assign({}, POOL[db.pool++]);
    else m = Object.assign({}, POOL.find(x => x.lucky));
    if (m.lucky) m.body = luckyText(db.lucky++);
    db.mails.push(Object.assign({ id: newId(), folder: 'inbox', to: '你', at: now, read: false, attach: null }, m));
    save(); render();
  }

  /* ---------- 蓝屏：全部答复风暴 ---------- */
  function startStorm() {
    if (!win || win.isClosed) app.open();
    folder = 'inbox'; selId = null;
    let k = 0;
    storm = setInterval(() => {
      if (OS.boot.state !== 'desktop') { clearInterval(storm); storm = null; return; }   // 窗口关了也照样涌进来
      const who = OS.pick(STORM_WHO), said = STORM_SAY[k % STORM_SAY.length];
      // 风暴的信不存档（重启以后都没了）
      db.mails.push({ id: newId(), folder: 'inbox', from: who, to: ALL_BUILDING, subject: 'Re: 停水通知', body: said, at: OS.clock.now().getTime(), read: false, kb: 3, storm: true });
      k++;
      render();
      if (k % 3 === 0) OS.sound.play('notify');
      if (k >= 36) {
        clearInterval(storm); storm = null;
        db.mails = db.mails.filter(x => !x.storm);
        OS.ui.bsod(BSOD);
      }
    }, 220);
  }
  OS.on('desktop:reset', () => { if (storm) { clearInterval(storm); storm = null; } db.mails = db.mails.filter(x => !x.storm); busy = false; });

  // 别的软件"发送到 ▸ 邮件收件人"：开一封带附件的新邮件
  OS.mail = { compose: attach => compose({ attach }) };
})();

/* 命令提示符 + 系统关机倒计时
   - 系统关机：网上邻居里隔壁大学生的「千万别点.exe」、命令提示符里的 shutdown -s -t 60 都会弹出 XP 那个
     《系统关机》60 秒倒计时（压在所有窗口上面，× 关不掉，最后 10 秒变红、每秒“滴”一声）。走完就关机。
   - 解除：物业电脑里的转帖（network.js）教你 shutdown -a。点了那一行才算学会，存档记着，重启不忘；
     学会以后命令提示符的选单里才有 shutdown -a。
   - 命令提示符不用打字：点黑窗口（电脑上也能按回车）弹出选单选指令，选了就一个字一个字自己“打”出来；
     复合指令（ping 127.0.0.1）一段一段选。选到一半点外面 = 放弃，那一行后面打个 ^C。
   - 蓝屏彩蛋：format C: → Y → FORMAT_C_WHILE_SITTING_ON_C */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.cmd;

  /* ================= 文案：系统关机 ================= */
  const SD = {
    title: '系统关机',
    text: '此系统即将关机。请保存所有正在运行的工作并注销。未保存的改动将会丢失。',
    // XP 原版是“关机是由 XX 初始化的”，太绕，换成一眼能看懂的
    by: { dont: '关机发起人：隔壁大学生', self: '关机发起人：你' },
    left: '距离关机还有：',
    msgCap: '消息',
    // by：dont = 千万别点.exe；self = 自己在命令提示符里敲的
    msg: { dont: '叫你千万别点偏要点！快去拔电源插头吧哈哈哈哈！', self: '这次是你自己点的。' },
    again: '已经在关了，你还嫌不够快？',
    // 倒计时走完的黑屏（自己敲的用系统默认那句）
    off: { dont: { msg: '叫你千万别点。', sub: '（点一下屏幕重新开机）' } },
    fix: '正在把冲击波从网线里赶出去',
    // shutdown -a 成功
    cancelTitle: '系统关机已取消',
    cancelText: { dont: '隔壁大学生：切，居然会解。', self: '你把自己救了回来。' }
  };
  const SECONDS = 59, URGENT = 10;   // 跟 XP 一样从 00:00:59 开始倒数

  /* ================= 系统关机倒计时 ================= */
  let sd = null;   // { win, by, end, timer, numEl }
  const fmt = s => '00:' + OS.pad2(Math.floor(s / 60)) + ':' + OS.pad2(s % 60);
  function sdStart(by) {
    if (sd) return false;
    const numEl = el('span', { class: 'sd-num', text: fmt(SECONDS) });
    const content = el('div', { class: 'sd' }, [
      el('div', { class: 'sd-main' }, [OS.iconEl('error', 'sd-ico'), el('div', {}, [el('div', { class: 'sd-text', text: SD.text }), el('div', { class: 'sd-by', text: SD.by[by] })])]),
      el('div', { class: 'sd-left' }, [el('span', { text: SD.left }), numEl]),
      el('div', { class: 'sd-cap', text: SD.msgCap }),
      el('div', { class: 'sd-msg', text: SD.msg[by] })
    ]);
    const me = { by, end: Date.now() + SECONDS * 1000, numEl, last: SECONDS, timer: 0, win: null };
    sd = me;
    me.win = OS.wm.open({
      title: SD.title, icon: 'power', width: 290, content, center: true, topmost: true, noClose: true,
      minimizable: false, maximizable: false, taskbar: false, className: 'sd-win',
      onClose: () => { clearInterval(me.timer); if (sd === me) sd = null; }
    });
    OS.sound.play('error');
    me.timer = setInterval(() => tick(me), 200);
    return true;
  }
  function tick(me) {
    if (sd !== me) { clearInterval(me.timer); return; }
    const left = Math.max(0, Math.ceil((me.end - Date.now()) / 1000));
    if (left === me.last) return;
    me.last = left;
    me.numEl.textContent = fmt(left);
    if (left <= URGENT) {
      me.numEl.classList.add('urgent');
      if (left > 0) OS.sound.play('beep');
    }
    if (left > 0) return;
    // 走完了：关机
    clearInterval(me.timer);
    me.win.close();
    if (me.by === 'dont') OS.bootFix.add('blaster', SD.fix);
    OS.boot.turnOff(SD.off[me.by]);
  }
  function sdCancel() {
    if (!sd) return false;
    const by = sd.by;
    sd.win.close();
    OS.ui.notify({ title: SD.cancelTitle, text: SD.cancelText[by], icon: 'info' });
    return true;
  }
  OS.shutdown = {
    // 千万别点.exe：已经在倒计时就吐槽一句
    dont() { if (!sdStart('dont')) OS.ui.dialog({ title: '千万别点.exe', icon: 'warn', text: SD.again }); },
    start: sdStart,
    cancel: sdCancel,
    running: () => !!sd
  };

  /* ================= 学指令 ================= */
  const LEARN_KEY = 'cmdLearned';
  OS.cmd = {
    knows: c => OS.save.get(LEARN_KEY, []).indexOf(c) >= 0,
    learn(c) {
      if (OS.cmd.knows(c)) { OS.ui.notify({ title: '命令提示符', text: '这条你已经学会了。', icon: 'info', replace: true }); return; }
      OS.save.set(LEARN_KEY, OS.save.get(LEARN_KEY, []).concat(c));
      OS.ui.notify({ title: '命令提示符', text: '学到新指令：' + c, icon: 'info', replace: true });
    }
  };

  /* ================= 文案：命令提示符 ================= */
  const PROMPT = 'C:\\Documents and Settings\\你>';
  const HEAD = ["Windoesn't XP [版本 5.1.2600]", '(C) 版权所有 1985-2003 没有任何公司。', ''];
  const HELP = [
    'CLS        清屏。看不见就等于没发生。',
    'COLOR      换颜色。换完也不会变成黑客。',
    'DIR        看看文件夹里有什么。',
    'ECHO       把你说的话再说一遍。',
    'EXIT       关掉这个黑窗口。',
    'FORMAT     格式化磁盘。',
    'IPCONFIG   查看你的 IP 地址。',
    'PING       看看对方还在不在。',
    'SHUTDOWN   关机。',
    'TRACERT    看看网线通到哪了。',
    '',
    '有关某个命令的详细信息，请键入 HELP 命令名。'
  ];
  const SYS32 = ['很重要.dll', '千万别删.dll', '删了你试试.dll', '真的很重要.dll', '也很重要.dll', '比上一个还重要.dll',
    '不知道干嘛的.dll', '但是很重要.dll', '别看了.dll', '看了也不懂.dll', '系统本体.dll', '系统本体2.dll',
    '系统本体最终版.dll', '系统本体最终最终版.dll', '开机要用.dll', '关机也要用.dll', '蓝屏专用.dll',
    '冲击波假补丁.dll', '别动.sys', '动了就完.sys'];
  OS.cmd.SYS32 = SYS32;   // 我的电脑 ▸ C: ▸ WINDOWS ▸ system32 里也是这一串
  const SYS32_END = ['               ……', '            9999 个文件，个个都很重要。'];
  const IPCONFIG = [
    "Windoesn't IP 配置", '',
    '以太网适配器 本地连接:', '',
    '    IP 地址 . . . . : 192.168.1.250',
    '    子网掩码  . . . : 255.255.255.0',
    '    默认网关  . . . : 192.168.1.1'
  ];
  // 显示在 ping 里的“对方”：ip 是假装的局域网地址；last = 第 4 次的回复换成这句
  const PING = {
    '127.0.0.1': { ip: '127.0.0.1', end: '自己 ping 自己，你是有多寂寞。' },
    '白度.com': { lost: true, end: '拨号猫的灯不亮了。' },
    '前任': { none: 'Ping 请求找不到主机 前任。请检查该名称，然后重试。' },
    '楼下小卖部老板': { ip: '192.168.1.4', last: '来自 楼下小卖部老板 的回复：先把账结了。' },
    '你 (2)': { ip: '192.168.1.250', last: '来自 你 (2) 的回复：别 ping 了，我知道你在。' }
  };
  const TRACERT = [
    ['  1    <1 ms    <1 ms    <1 ms  你家的猫'],
    ['  2     3 ms     2 ms     3 ms  楼道里的交换机'],
    ['  3    15 ms    14 ms    16 ms  物业'],
    ['  4   120 ms   131 ms   125 ms  小区门口的电线杆'],
    ['  5     *        *        *     请求超时。'],
    ['  6     *        *        *     请求超时。']
  ];
  const TRACERT_END = '跟踪完成。网线在电线杆那断了。';
  // color：cls 是窗口的样子，say 是打完后冒出来的一句
  // 界面上的字不加（……）这种括号旁白：作者看着像备注，放到界面上很怪（2026-11-22）
  const COLORS = [
    { t: '0A', cls: 'c-0a', say: '你现在看起来很像黑客了。' },
    { t: '1F', cls: 'c-1f', say: '放心，这不是蓝屏。' },
    { t: 'FC', cls: 'c-fc', say: '辣眼睛。' },
    { t: '07', cls: '', say: '' }
  ];
  const ECHO = ['我爱学习', '我是黑客', '妈我错了'];
  const SD_ALREADY = '已经计划了系统关机。(1190)';
  const SD_NONE = '无法中止系统关机，因为没有进行中的关机。(1116)';
  const FMT = {
    'A:': ['驱动器 A: 中没有软盘。'],
    'D:': ['D: 是光驱。你想格式化一张盗版光盘？'],
    warn: ['文件系统的类型是 NTFS。', '', '警告，非可移动磁盘驱动器 C: 上的所有数据将会丢失！'],
    ask: '是否继续进行格式化 (Y/N)? ',
    no: '你怂了。',
    doing: p => '正在格式化…… ' + p + '%'
  };
  const BSOD = { id: 'cmd', name: 'FORMAT_C_WHILE_SITTING_ON_C', text: '你在 C 盘上格式化 C 盘，\n相当于坐在树枝上锯这根树枝。' };
  // dir 桌面：桌面上真有的图标（我的电脑、网上邻居、回收站真 dir 也看不到，不列）
  const NOT_FILES = ['mycomputer', 'network', 'recycle', 'mydocs'];
  const DIRS = ['folder2'];

  /* ================= 窗口 ================= */
  app.open = function () {
    const scr = el('div', { class: 'cmd-scr' });
    const box = el('div', { class: 'cmd' }, [scr]);
    let cur = null, busy = false, menuClosedAt = 0;
    const win = OS.wm.open({
      title: '命令提示符', icon: 'cmd', width: 456, height: 272, appId: app.id, content: box, maximizable: false,
      onClose: () => document.removeEventListener('keydown', onKey, true)
    });
    OS.ui.scrollable(box);

    const scrollEnd = () => { box.scrollTop = box.scrollHeight; };
    function line(text) { const d = el('div', { class: 'cmd-l', text: text || ' ' }); scr.appendChild(d); scrollEnd(); return d; }
    // 带光标的一行（提示符那行，或者 format 问你 Y/N 那行）
    function inputLine(lead) {
      if (cur) cur.caret.remove();
      const typed = el('span');
      const caret = el('span', { class: 'cmd-caret', text: '_' });
      scr.appendChild(el('div', { class: 'cmd-l' }, [el('span', { text: lead }), typed, caret]));
      scrollEnd();
      cur = { typed, caret };
    }
    const prompt = () => inputLine(PROMPT);
    const endInput = () => { if (cur) { cur.caret.remove(); cur = null; } };
    async function type(s) {
      for (const ch of s) {
        if (win.isClosed) return;
        cur.typed.textContent += ch;
        if (ch !== ' ') OS.sound.play('key');
        await OS.wait(ch === ' ' ? 30 : 55);
      }
    }
    async function out(lines, gap) {
      endInput();
      for (const l of lines) {
        if (win.isClosed) return;
        line(l);
        if (gap) await OS.wait(gap);
      }
    }
    // 在光标下面弹出选单；选了返回那一项，点外面 / Esc 返回 null
    function choose(nodes) {
      return new Promise(resolve => {
        let picked = false;
        const r = cur.caret.getBoundingClientRect();
        const p = OS.stage.toLocal(r.left, r.bottom);
        const items = nodes.map(n => ({ label: n.label || n.t, action: () => { picked = true; resolve(n); } }));
        OS.ui.contextMenu(items, p.x, p.y + 2, false, {
          onClose: () => setTimeout(() => { if (!picked) { menuClosedAt = Date.now(); resolve(null); } }, 0)
        });
      });
    }

    HEAD.forEach(l => line(l));
    prompt();

    /* ---------- 指令 ---------- */
    const TREE = () => [
      { t: 'help', run: () => out(HELP, 25) },
      { t: 'dir', next: [{ t: '桌面', run: dirDesktop }, { t: 'C:\\WINDOWS\\system32', run: dirSys32 }] },
      { t: 'cls', run: async () => { endInput(); scr.textContent = ''; }, quiet: true },
      { t: 'ipconfig', run: () => out(IPCONFIG, 60) },
      { t: 'ping', next: Object.keys(PING).map(k => ({ t: k, run: () => ping(k) })) },
      { t: 'tracert', next: [{ t: '白度.com', run: tracert }] },
      { t: 'color', next: COLORS.map(c => ({ t: c.t, run: () => color(c) })) },
      { t: 'echo', next: ECHO.map(s => ({ t: s, run: () => out([s]) })) },
      { t: 'shutdown', next: () => [
        { t: '-s -t 60', run: async () => { if (!OS.shutdown.start('self')) await out([SD_ALREADY]); else endInput(); } },
        { t: '-r', run: async () => { endInput(); await OS.wait(400); if (!win.isClosed) OS.boot.restart(); }, quiet: true }
      ].concat(OS.cmd.knows('shutdown -a') ? [{ t: '-a', run: async () => { if (!OS.shutdown.cancel()) await out([SD_NONE]); else endInput(); } }] : []) },
      { t: 'format', next: [{ t: 'C:', run: formatC }, { t: 'D:', run: () => out(FMT['D:']) }, { t: 'A:', run: () => out(FMT['A:'], 300) }] },
      { t: 'exit', run: async () => { endInput(); win.close(); }, quiet: true }
    ];

    async function dirDesktop() {
      const icons = [...OS.desktop.root().querySelectorAll('.dicon:not(.binned)')]
        .map(n => ({ id: n.getAttribute('data-app'), name: (n.querySelector('.di-label') || n).textContent }))
        .filter(x => NOT_FILES.indexOf(x.id) < 0);
      const dirs = icons.filter(x => DIRS.indexOf(x.id) >= 0), files = icons.filter(x => DIRS.indexOf(x.id) < 0);
      const lines = [' 驱动器 C 中的卷没有标签。', '', ' ' + PROMPT.slice(0, -1) + '\\桌面 的目录', '',
        '2003-04-01  <DIR>       .', '2003-04-01  <DIR>       ..']
        .concat(dirs.map(x => '2003-04-01  <DIR>       ' + x.name))
        .concat(files.map(x => '2003-04-01        1 KB  ' + x.name + (/^file-/.test(x.id) ? '' : '.lnk')))
        .concat(['', '       ' + files.length + ' 个文件　　' + (dirs.length + 2) + ' 个目录', '       可用字节：15,032,385,536']);
      await out(lines, 40);
    }
    async function dirSys32() {
      await out([' C:\\WINDOWS\\system32 的目录', ''], 40);
      for (let i = 0; i < 3; i++) await out(SYS32.map(n => '2003-04-01      66 KB  ' + n), 18);
      await out(SYS32_END, 200);
    }
    async function ping(k) {
      const p = PING[k];
      if (p.none) { await out([p.none]); return; }
      await out(['', '正在 Ping ' + k + (p.ip && p.ip !== k ? ' [' + p.ip + ']' : '') + ' 具有 32 字节的数据:', ''], 0);
      for (let i = 0; i < 4; i++) {
        await OS.wait(p.lost ? 1000 : 450);
        if (win.isClosed) return;
        line(p.lost ? '请求超时。' : (i === 3 && p.last) ? p.last : '来自 ' + p.ip + ' 的回复: 字节=32 时间<1ms TTL=128');
      }
      const got = p.lost ? 0 : 4;
      await out(['', k + ' 的 Ping 统计信息:', '    数据包: 已发送 = 4，已接收 = ' + got + '，丢失 = ' + (4 - got) + ' (' + (p.lost ? 100 : 0) + '% 丢失)'].concat(p.end ? ['', p.end] : []), 40);
    }
    async function tracert() {
      await out(['', '通过最多 30 个跃点跟踪', '到 白度.com 的路由:', ''], 40);
      for (const [l] of TRACERT) { await OS.wait(650); if (win.isClosed) return; line(l); }
      await out(['', TRACERT_END], 300);
    }
    async function color(c) {
      box.classList.remove('c-0a', 'c-1f', 'c-fc');
      if (c.cls) box.classList.add(c.cls);
      if (c.say) await out([c.say]); else endInput();
    }
    async function formatC() {
      await out(FMT.warn, 120);
      inputLine(FMT.ask);
      const a = await choose([{ t: 'Y' }, { t: 'N' }]);
      if (win.isClosed) return;
      if (!a) { cur.typed.textContent += '^C'; endInput(); return; }
      await type(a.t);
      if (a.t === 'N') { await out([FMT.no]); return; }
      endInput();
      const pl = line(FMT.doing(1));
      for (let p = 1; p <= 3; p++) {
        pl.textContent = FMT.doing(p);
        await OS.wait(1100);
        if (win.isClosed) return;
      }
      OS.ui.bsod(BSOD);
    }

    /* ---------- 选指令：一段一段选，选完自动回车 ---------- */
    async function go() {
      if (busy || win.isClosed || !cur) return;
      busy = true;
      let nodes = TREE(), n = null, said = 0;
      while (true) {
        n = await choose(nodes);
        if (!n || win.isClosed) break;
        await type((said ? ' ' : '') + n.t);
        said++;
        if (!n.next) break;
        nodes = typeof n.next === 'function' ? n.next() : n.next;
      }
      if (win.isClosed) return;
      if (!n) {
        // 选到一半放弃：^C 换一行
        if (said) { cur.typed.textContent += '^C'; endInput(); prompt(); }
        busy = false;
        return;
      }
      await n.run();
      if (win.isClosed) return;
      if (!n.quiet) line('');
      prompt();
      busy = false;
    }
    box.addEventListener('click', () => {
      if (Date.now() - menuClosedAt < 350) return;   // 刚点外面收起选单的那一下，不算又点了一次
      go();
    });
    // 电脑上：这个窗口在最前面时按回车也能弹选单
    function onKey(e) {
      if (e.key !== 'Enter' || win.isClosed || OS.wm.active !== win || OS.ui.menuOpen()) return;
      e.preventDefault();
      go();
    }
    document.addEventListener('keydown', onKey, true);
    return win;
  };
})();

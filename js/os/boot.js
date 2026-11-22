/* 开机 → 登录 → 桌面；关机 / 重启 / 待机 / 注销 */
(function () {
  'use strict';
  const el = OS.el;
  const B = OS.boot = { state: 'off' };
  let screens = null;
  let runId = 0; // 每开始一段新流程就+1，旧流程自动作废

  const BIOS = [
    { t: "Windoesn't BIOS v4.04    (C) 2003 无聊科技有限公司", hi: true },
    { t: '' },
    { t: 'CPU：不奔腾 III    0.5 GHz' },
    { t: '内存检测：640 KB …… 也许？' },
    { t: '检测硬盘 …… 找到 1 块，或者 2 块？' },
    { t: '检测鼠标 …… 推理应该是被拨号上网的猫吃了' },
    { t: '检测键盘 …… 未找到。按键盘任意键以继续' },
    { t: '' },
    { t: "正在启动 Windoesn't XP ……", hi: true }
  ];

  /* ---------- 开机要修的东西 ----------
     玩的时候弄坏了什么（羊炸了 / 吓跑了、木牌被砍断、蓝屏……）就记一笔；
     下次开机，自检下面一行行“正在修”，同时桌面恢复原样（各软件听 desktop:reset 自己复位）。
     以后再有这种大的改变，也照这个办：OS.bootFix.add('名字', '正在……')；自己恢复了就 remove。 */
  OS.bootFix = {
    add(key, line) { const m = OS.save.get('bootFixes', {}); m[key] = line; OS.save.set('bootFixes', m); },
    remove(key) { const m = OS.save.get('bootFixes', {}); if (key in m) { delete m[key]; OS.save.set('bootFixes', m); } },
    take() { const m = OS.save.get('bootFixes', {}); OS.save.remove('bootFixes'); return Object.keys(m).map(k => m[k]); }
  };
  const FIX_HEAD = n => '检测桌面 …… 发现 ' + n + ' 处异常，正在处理';
  const FIX_DONE = ' 完成';
  // 各种蓝屏之后，下次开机要修的
  const BSOD_FIX = {
    lifespan: '地府正在给系统补办阳寿',
    bootcheck: '开机检测器正在接受心理疏导',
    rich: '大屁股显示器工伤痊愈，正在重新上岗',
    folder2: '物业正在安抚邻居情绪',
    pulse: '正在给打印机灭火',
    swatter: '正在给不奔腾泼凉水降温',
    recycle: '清洁部门正在换上新垃圾桶',
    coil: '正在开窗给电脑通风',
    activator: '电信师傅正在给你家重新接网线',
    debt: '正在帮你和欠款人重归于好',
    koukou: '正在把抖散的窗口一个个拼回去',
    network: '正在把另一个你赶出局域网',
    cmd: '正在把格式化掉的 C 盘一个字节一个字节捡回来',
    notepad: '正在把记事本里多出来的 1023 句话删掉',
    qianqian: '正在把震歪的桌面图标一个个扶正',
    mycomputer: '正在给很重要.dll 补办身份证',
    mydocs: '正在把套娃文件夹一层层拆掉'
  };
  OS.on('bsod', o => { if (BSOD_FIX[o.id]) OS.bootFix.add('bsod-' + o.id, BSOD_FIX[o.id]); });

  B.init = function (layer) { screens = layer; };

  function show(node) {
    screens.innerHTML = '';
    screens.appendChild(node);
    screens.classList.add('show');
  }
  function hide() {
    screens.classList.remove('show');
    screens.innerHTML = '';
  }
  function logoMark(size) {
    return el('div', { class: 'logo-mark' + (size ? ' ' + size : '') }, [
      OS.iconEl('logo', 'lm-ico'),
      el('div', { class: 'lm-words' }, [
        el('div', { class: 'logo-word', html: 'Windoesn\'t<sup>XP</sup>' }),
        el('div', { class: 'logo-sub', text: '无聊版' })
      ])
    ]);
  }
  function resetDesktop() {
    OS.wm.closeAll();
    OS.ui.clearNotify();
    OS.taskbar.toggleMenu(false);
    OS.ticker.stop();
    OS.ui.closeMenus();
    OS.desktop.reset();
    OS.stage.el.classList.remove('gray-out');
    const ov = document.getElementById('overlay');
    if (ov) ov.innerHTML = '';
  }

  /* ---------- 开机 ---------- */
  B.start = async function (o) {
    o = o || {};
    const my = ++runId;
    B.state = 'boot';
    resetDesktop();
    const count = OS.save.get('bootCount', 0);
    OS.save.set('bootCount', count + 1);
    const fast = !!o.fast || count > 0;

    let skip = false;
    const skipper = () => { skip = true; };

    const bios = el('div', { class: 'scr scr-bios' });
    bios.addEventListener('pointerdown', skipper);
    show(bios);
    const fixes = OS.bootFix.take();
    for (let i = 0; i < BIOS.length; i++) {
      if (my !== runId) return;
      if (skip) break;
      // 上次弄坏了什么：在“正在启动”前面一行行修
      if (i === BIOS.length - 1 && fixes.length) {
        bios.appendChild(el('div', { text: FIX_HEAD(fixes.length) }));
        for (const f of fixes) {
          if (my !== runId) return;
          const fl = el('div', { class: 'b-fix', text: '　' + f + ' ……' });
          bios.appendChild(fl);
          await OS.wait(fast ? 320 : 480);
          fl.textContent += FIX_DONE;
        }
        bios.appendChild(el('div', { text: ' ' }));
        await OS.wait(fast ? 200 : 300);
      }
      const ln = BIOS[i];
      bios.appendChild(el('div', { class: ln.hi ? 'b-hi' : '', text: ln.t || ' ' }));
      await OS.wait(fast ? 80 : 220);
    }
    if (!skip) await OS.wait(fast ? 700 : 1000);   // 自检完多停一会儿，让人看清楚上面写了啥
    if (my !== runId) return;

    skip = false;
    const logo = el('div', { class: 'scr scr-logo' }, [
      logoMark(),
      el('div', { class: 'boot-bar' }, el('div', { class: 'bb-run' }, [el('i'), el('i'), el('i')])),
      el('div', { class: 'copy', text: 'Copyright © 2003 无聊科技' })
    ]);
    logo.addEventListener('pointerdown', skipper);
    show(logo);
    const until = Date.now() + (fast ? 1500 : 3000);
    while (Date.now() < until && !skip) {
      await OS.wait(100);
      if (my !== runId) return;
    }
    if (my !== runId) return;
    B.login();
  };

  /* ---------- 登录 ---------- */
  B.login = function () {
    const my = ++runId;
    B.state = 'login';
    resetDesktop();
    const users = [
      { name: '你', ava: 'duck', go: true },
      { name: '管理员', stat: '已跑路', ava: 'runner', msg: '管理员已跑路。\n最后一次登录：在他跑路之前。' },
      { name: 'Guest', stat: '已停用', ava: 'lock', msg: '访客账户已停用，\n因为没有人来看你。' }
    ];
    const msg = el('div', { class: 'lg-msg' });
    let msgTimer = 0;
    const right = el('div', { class: 'lg-right' });
    users.forEach(u => {
      const row = el('div', { class: 'lg-user' }, [
        OS.iconEl(u.ava, 'lg-ava'),
        el('div', {}, [el('div', { class: 'lg-name', text: u.name }), u.stat ? el('div', { class: 'lg-stat', text: u.stat }) : null])
      ]);
      row.addEventListener('click', () => {
        if (my !== runId) return;
        if (u.go) { row.classList.add('sel'); OS.sound.play('click'); enter(my); return; }
        OS.sound.play('error');
        msg.textContent = u.msg;
        msg.classList.add('show');
        clearTimeout(msgTimer);
        msgTimer = setTimeout(() => msg.classList.remove('show'), 3000);
      });
      right.appendChild(row);
    });
    right.appendChild(msg);

    const offBtn = el('button', { class: 'lg-off' }, [OS.iconEl('power', 'lg-off-ico'), el('span', { text: '关闭计算机' })]);
    offBtn.addEventListener('click', () => { OS.sound.play('click'); B.turnOff(); });

    show(el('div', { class: 'scr scr-login' }, [
      el('div', { class: 'lg-top' }),
      el('div', { class: 'lg-mid' }, [
        el('div', { class: 'lg-left' }, [logoMark('small'), el('div', { class: 'lg-hint', text: '要开始，请点击你的用户名。\n如果不想开始，请不要点击。' })]),
        el('div', { class: 'lg-divider' }),
        right
      ]),
      el('div', { class: 'lg-bottom' }, [offBtn, el('div', { class: 'lg-tip', text: '登录之后，你将处于已登录状态。' })])
    ]));
  };

  async function enter(my) {
    OS.sound.unlock();
    await OS.wait(250);
    if (my !== runId) return;
    show(el('div', { class: 'scr scr-welcome' }, [
      el('div', { class: 'wel-big', text: '欢迎' }),
      el('div', { class: 'wel-sub', text: '正在加载你尚未设置的个人设置……（其实什么也没设置）' })
    ]));
    await OS.wait(1200);
    if (my !== runId) return;
    B.desktop();
  }

  B.desktop = function () {
    const my = ++runId;
    B.state = 'desktop';
    hide();
    OS.sound.play('startup');
    OS.ticker.start();
    setTimeout(() => {
      if (my !== runId) return;
      OS.ui.notify({ title: "欢迎使用 Windoesn't XP", text: '如果你看到了这条消息，\n说明你的眼睛目前是睁开的。', icon: 'info', timeout: 7000 });
    }, 1600);
    OS.emit('desktop:ready');
  };

  /* ---------- 关闭计算机对话框 ---------- */
  B.offDialog = function () {
    const ov = document.getElementById('overlay');
    if (ov.querySelector('.offwrap')) return;
    OS.taskbar.toggleMenu(false);
    const wrap = el('div', { class: 'offwrap layer' });
    const close = () => { wrap.remove(); OS.stage.el.classList.remove('gray-out'); };
    const opt = (cls, icon, label, fn) => {
      const b = el('button', { class: 'od-opt' }, [el('span', { class: 'ob ' + cls, html: OS.icon(icon) }), el('span', { text: label })]);
      b.addEventListener('click', () => { OS.sound.play('click'); close(); fn(); });
      return b;
    };
    const cancel = el('button', { class: 'xpbtn', text: '取消' });
    cancel.addEventListener('click', () => { OS.sound.play('click'); close(); });
    wrap.appendChild(el('div', { class: 'offdlg' }, [
      el('div', { class: 'od-head' }, [el('span', { text: '关闭计算机' }), OS.iconEl('logo', 'od-logo')]),
      el('div', { class: 'od-body' }, [
        opt('yellow', 'moonGlyph', '待机', B.standby),
        opt('red', 'powerGlyph', '关闭', B.turnOff),
        opt('green', 'restartGlyph', '重新启动', B.restart)
      ]),
      el('div', { class: 'od-foot' }, [cancel])
    ]));
    wrap.addEventListener('pointerdown', e => { if (e.target === wrap) OS.sound.play('ding'); });
    ov.appendChild(wrap);
    OS.stage.el.classList.add('gray-out');
  };

  function busyScreen(text) {
    show(el('div', { class: 'scr scr-busy' }, [logoMark('small'), el('div', { class: 'busy-text', text })]));
  }

  // o：{ msg, sub } 黑屏上的大字、小字（千万别点.exe 倒计时走完：叫你千万别点。）
  B.turnOff = async function (o) {
    o = o && o.msg ? o : {};
    const my = ++runId;
    B.state = 'off';
    OS.ticker.stop();
    OS.ui.clearNotify();
    busyScreen('正在关机……');
    OS.sound.play('shutdown');
    await OS.wait(1600);
    if (my !== runId) return;
    resetDesktop();
    const off = el('div', { class: 'scr scr-off' }, [
      el('div', { class: 'off-msg', text: o.msg || '现在可以安全地关闭计算机了。' }),
      el('div', { class: 'off-sub', text: o.sub || '（其实关不掉。点一下屏幕重新开机）' })
    ]);
    show(off);
    setTimeout(() => {
      if (my !== runId) return;
      off.addEventListener('pointerdown', () => B.start(), { once: true });
    }, 600);
  };

  B.restart = async function () {
    const my = ++runId;
    B.state = 'off';
    OS.ticker.stop();
    OS.ui.clearNotify();
    busyScreen('正在重新启动……');
    OS.sound.play('shutdown');
    await OS.wait(1400);
    if (my !== runId) return;
    B.start({ fast: true });
  };

  B.logoff = async function () {
    const my = ++runId;
    B.state = 'off';
    OS.ticker.stop();
    OS.ui.clearNotify();
    busyScreen('正在注销……');
    OS.sound.play('shutdown');
    await OS.wait(1200);
    if (my !== runId) return;
    B.login();
  };

  B.standby = function () {
    const my = ++runId;
    B.state = 'standby';
    OS.ticker.stop();
    const sb = el('div', { class: 'scr scr-standby' }, [el('div', { class: 'sb-text', text: '待机中……点一下唤醒' })]);
    show(sb);
    setTimeout(() => {
      if (my !== runId) return;
      sb.addEventListener('pointerdown', () => {
        if (my !== runId) return;
        ++runId;
        B.state = 'desktop';
        hide();
        OS.ticker.start();
        OS.sound.play('ding');
      }, { once: true });
    }, 400);
  };
})();

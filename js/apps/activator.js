/* Windoesn't 激活器（开始 ▸ 所有程序 ▸ 实用小程序）
   仿 XP 激活：输 25 位产品密钥 XXXXX-XXXXX-XXXXX-XXXXX-XXXXX。
   - 屏幕上一块只有 XP 密钥会用到的 24 个字的键盘（手机上不弹输入法）；电脑上也能直接敲键盘。
   - ［自动输入］一开始是灰的；蓝屏图鉴集齐 12 个之后才亮，点了密钥一个字一个字自己打进去。
   - 标题栏右上角有 XP 对话框那种“？”，点了给线索：去 UP 主视频评论区找。
   - 蓝屏彩蛋：没解锁时去戳灰的［自动输入］，每戳一下窗口抖一下（像 QQ 窗口抖动），
     第 4、8、11 下按钮底下冒字，第 11 下按钮裂开，第 12 下蓝屏（按钮把你拉黑了）。
   - 密钥是编的（长得像 XP 密钥，不是真的）。输对了：拨号连激活服务器 → 激活成功。
   - 激活之后（存档记着，重启不会掉）：开始菜单里「Windoesn't XP 专业版」的程序从灰变彩色，
     右下角“未激活”盾牌消失，桌面水印和系统属性都变成已激活。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.activator;

  const KEY = 'YQWQY-YTVTY-YXWXY-Y8V8Y-Y7W7Y';          // 编的，不是真的密钥：5 组颜文字（YQWQY、YTVTY……）
  const CHARS = 'BCDFGHJKMPQRTVWXY2346789';              // XP 密钥只用这 24 个字（没有 0 O 1 I S 这些容易看错的）
  const NEED = () => OS.BSOD_NEED || 12;                 // 集齐几个蓝屏才能自动输入（还是 12 个，跟图鉴总数没关系）
  const HEAD = "激活 Windoesn't XP";
  const SUB = '让我们开始吧';
  const ASK = '请输入 25 位产品密钥：';
  const LABEL_TIP = '产品密钥通常印在光盘盒背面的黄色标签上。\n（盗版光盘盒背面印的是另一张光盘的密钥）';
  const HELP = '去 UP 主相应视频的评论区看看，\n说不定有自动输入的线索呢';
  const NOT_FULL = '请输入完整的 25 位产品密钥。';
  const BAD_TITLE = '产品密钥无效';
  const BAD = '您键入的产品密钥无效。';
  const BAD_JOKES = [
    '这个密钥已经被 300 万人用过了。',
    '你是不是从光盘盒上抄错了一位？',
    '提示：本系统的密钥里没有 0、O、1、I、S 这些容易看错的字。',
    '这个密钥是正版的。本系统不收正版。'
  ];
  const CONNECT = ['正在拨号连接激活服务器……', '正在验证产品密钥……', '正在向激活服务器解释你为什么要激活……'];
  const OK_TITLE = '激活成功！';
  const OK_TEXT = "您的 Windoesn't XP 现在是正版的盗版。\n「Windoesn't XP 专业版」里的程序已全部解锁。";
  const DONE = "您的 Windoesn't XP 已经激活。（大概）";
  // 戳灰按钮：戳到第几下冒哪句；第 POKE_CRACK 下按钮裂开，第 POKE_BSOD 下蓝屏
  const POKE_SAY = {
    4: '对方已对你隐身，请勿频繁发送窗口抖动。',
    8: '您的 抠抠 等级不足，请先挂满三个太阳再来点。',
    11: '再点一下明天你家就停电。（今天是我生日，我是马寿星）'
  };
  const POKE_CRACK = 11, POKE_BSOD = 12;
  const BSOD = { id: 'activator', name: 'BUTTON_BLOCKED_YOU', text: '该按钮已将你拉黑，并顺手拔了你家网线。' };
  const NEWS = "本台消息：一名用户成功激活了 Windoesn't XP，本系统的开发者表示也很意外。";

  const activated = () => !!OS.save.get('activated', false);
  const bsodCount = () => (OS.bsodSeen ? OS.bsodSeen() : OS.save.get('bsods', []).length);

  app.open = function () {
    const body = el('div', { class: 'av-body' });
    const content = el('div', { class: 'av' }, [
      el('div', { class: 'av-head' }, [
        el('div', {}, [el('div', { class: 'av-title', text: HEAD }), el('div', { class: 'av-sub', text: SUB })]),
        OS.iconEl('key', 'av-logo')
      ]),
      body
    ]);
    let onKey = null, timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const win = OS.wm.open({
      title: app.name, icon: app.icon, width: 330, appId: app.id, content,
      minimizable: false, maximizable: false,
      help: () => OS.ui.dialog({ title: '帮助', icon: 'help', text: HELP }),
      onClose: () => { timers.forEach(clearTimeout); if (onKey) document.removeEventListener('keydown', onKey); }
    });
    const show = nodes => { body.textContent = ''; nodes.forEach(n => n && body.appendChild(n)); OS.wm.keepInside(win); };
    const btn = (text, fn, cls) => { const b = el('button', { class: 'xpbtn' + (cls ? ' ' + cls : ''), text }); b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };

    /* ---------- 输密钥 ---------- */
    function entry() {
      let val = '', busy = false;
      const boxes = [0, 1, 2, 3, 4].map(() => el('span', { class: 'av-box' }));
      const row = el('div', { class: 'av-boxes' });
      boxes.forEach((b, i) => { if (i) row.appendChild(el('span', { class: 'av-dash', text: '-' })); row.appendChild(b); });
      const render = () => {
        const cur = Math.min(4, Math.floor(val.length / 5));
        boxes.forEach((b, i) => {
          const part = val.slice(i * 5, i * 5 + 5);
          b.textContent = part + '·'.repeat(5 - part.length);
          b.classList.toggle('cur', i === cur && val.length < 25);
        });
      };
      const press = k => {
        if (busy) return;
        if (k === '←') val = val.slice(0, -1);
        else if (k === '清空') val = '';
        else if (val.length < 25) val += k;
        OS.sound.play('click');
        render();
      };
      const keys = el('div', { class: 'av-keys' }, CHARS.split('').concat(['←', '清空']).map(k => {
        const b = el('button', { class: 'xpbtn av-key' + (k.length > 1 || k === '←' ? ' fn' : ''), text: k });
        b.addEventListener('click', () => press(k));
        return b;
      }));
      // 自动输入：集齐蓝屏才亮；点了一个字一个字自己打进去
      const auto = el('button', { class: 'xpbtn av-auto', text: '自动输入' });
      const locked = bsodCount() < NEED();
      auto.classList.toggle('is-off', locked);   // 看着是灰的，但还能被戳（真 disabled 的按钮点了没反应，就戳不出彩蛋了）
      const pokeSay = el('div', { class: 'av-poke' });
      let pokes = 0;
      const poke = () => {
        pokes++;
        OS.sound.play('thud');
        win.el.classList.remove('av-nudge'); void win.el.offsetWidth; win.el.classList.add('av-nudge');
        if (POKE_SAY[pokes]) { pokeSay.textContent = POKE_SAY[pokes]; pokeSay.classList.remove('flash'); void pokeSay.offsetWidth; pokeSay.classList.add('flash'); }
        if (pokes >= POKE_CRACK) auto.classList.add('cracked');
        if (pokes >= POKE_BSOD) setTimeout(() => OS.ui.bsod(BSOD), 350);
      };
      auto.addEventListener('click', () => {
        if (locked) { poke(); return; }
        if (busy) return;
        busy = true;
        val = '';
        render();
        const plain = KEY.replace(/-/g, '');
        plain.split('').forEach((c, i) => later(() => {
          val += c;
          OS.sound.play('click');
          render();
          if (i === plain.length - 1) busy = false;
        }, 120 + i * 75));
      });
      const confirm = () => {
        if (busy) return;
        if (val.length < 25) { OS.ui.dialog({ title: HEAD, icon: 'warn', text: NOT_FULL }); return; }
        const typed = val.match(/.{5}/g).join('-');
        if (typed !== KEY) { OS.ui.dialog({ title: BAD_TITLE, icon: 'error', text: BAD + '\n\n' + OS.pick(BAD_JOKES) }); return; }
        document.removeEventListener('keydown', onKey);
        onKey = null;
        connect();
      };
      // 电脑上直接敲键盘也行
      onKey = e => {
        if (OS.wm.active !== win) return;
        const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        if (CHARS.indexOf(k) >= 0 && k.length === 1) press(k);
        else if (/^[A-Z0-9]$/.test(k)) OS.sound.play('error');   // 密钥里没有这个字
        else if (k === 'Backspace') press('←');
        else if (k === 'Enter') confirm();
        else return;
        e.preventDefault();
      };
      document.addEventListener('keydown', onKey);
      render();
      show([
        el('div', { class: 'av-ask', text: ASK }),
        row,
        el('div', { class: 'av-tip', text: LABEL_TIP }),
        keys,
        pokeSay,
        el('div', { class: 'av-btns' }, [auto, el('span', { class: 'av-gap' }), btn('确定', confirm, 'default'), btn('取消', () => win.close())])
      ]);
    }

    /* ---------- 输对了：拨号连激活服务器 ---------- */
    function connect() {
      const line = el('div', { class: 'av-ask', text: CONNECT[0] });
      const fill = el('div', { class: 'av-fill' });
      show([line, el('div', { class: 'av-bar' }, [fill]), el('div', { class: 'av-tip', text: '请不要在激活过程中接听家里的座机。' })]);
      OS.sound.play('dialup');
      later(() => { fill.style.width = '30%'; }, 200);
      later(() => { line.textContent = CONNECT[1]; fill.style.width = '62%'; }, 1300);
      later(() => { line.textContent = CONNECT[2]; fill.style.width = '88%'; }, 2500);
      later(() => { fill.style.width = '100%'; }, 3400);
      later(() => {
        OS.save.set('activated', true);
        OS.emit('system:activated');
        OS.sound.play('ding');
        later(() => OS.ticker.interrupt(NEWS), 800);
        ok();
      }, 3800);
    }
    function ok() {
      show([
        el('div', { class: 'av-ok' }, [OS.iconEl('info', 'av-ok-ico'), el('div', {}, [el('div', { class: 'av-ok-title', text: OK_TITLE }), el('div', { class: 'av-ok-text', text: OK_TEXT })])]),
        el('div', { class: 'av-btns' }, [el('span', { class: 'av-gap' }), btn('确定', () => win.close(), 'default')])
      ]);
    }
    // 已经激活过
    function done() {
      show([
        el('div', { class: 'av-ok' }, [OS.iconEl('info', 'av-ok-ico'), el('div', { class: 'av-ok-text', text: DONE })]),
        el('div', { class: 'av-btns' }, [el('span', { class: 'av-gap' }), btn('确定', () => win.close(), 'default')])
      ]);
    }

    if (activated()) done(); else entry();
    return win;
  };
})();

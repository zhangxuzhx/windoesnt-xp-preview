/* 开机检测器 Pro
   点“开始检测”→ 假装认真查 5 秒 → 红叉：你的设备没开机。
   不服就一直“放屁”，它一直跟你抬杠，报错框越叠越多；
   第 10 次不服，屏幕直接黑掉：“你看，我就说没开机吧。”
   蓝屏彩蛋：黑屏后玩家点屏幕“开机”了，这时再测一次 → 测出开机 →
   检测器接受不了自己错了 → 蓝屏。之后恢复正常，又只会测出关机。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.bootcheck;

  // 检测时一行行换的状态（[文字, 进度到多少]）
  const STEPS = [
    ['正在检测电源……', 18],
    ['正在检测屏幕亮度……', 36],
    ['正在检测你是否在看屏幕……', 55],
    ['正在询问显卡……显卡说它不知道。', 74],
    ['正在综合分析……', 99]
  ];
  const RESULT = '检测完成。\n你的设备目前处于【关机】状态。';
  const FIRST_NO = '放屁，我明明看着呢';
  // 抬杠：[检测器说的话, 下一次反驳按钮上的字]。第 10 次反驳直接黑屏
  const ARGUE = [
    ['你看到的桌面，是大脑根据记忆自动补全的画面。', '我真的看着呢'],
    ['你正在点的不是屏幕，是空气。', '我点到了啊'],
    ['屏幕亮着，只能说明屏幕亮着。', '那不就是开着吗'],
    ['经检测，你现在摸的是床板。', '你瞎猜的吧'],
    ['本检测器连续三年准确率 100%，从未检测出过开机。', '那是你坏了'],
    ['检测器又查了一遍，结果一样。\n两次都一样，说明非常准。', '我不信'],
    ['检测器问了你的电脑，你的电脑说：“我关着呢。”', '它在撒谎'],
    ['你再犟一次，检测器就要哭了。', '哭吧'],
    ['好，既然你不信，我证明给你看。', '你证明啊']
  ];
  const CRY_AT = 8;   // 第 8 次反驳后（“你再犟一次，检测器就要哭了”）检测器哭了
  const BLACK_TEXT = '你看，我就说没开机吧。';
  const BLACK_HINT = '（点一下屏幕开机）';
  const NEWS = '本台消息：一名用户刚刚被开机检测器证实没有开机。';
  // 蓝屏彩蛋
  const ON_RESULT = '检测完成。\n你的设备目前处于【开机】状态。';
  const ON_WAIT = ['……等等。\n本检测器三年来从未检测出过开机。', '啊？'];
  const ON_WAIT_AGAIN = ['……又来！\n本检测器坚决不承认这种结果！', '至于吗？'];   // 不是第一次测出开机时
  const BSOD = { id: 'bootcheck', name: 'DETECTOR_EXISTENTIAL_CRISIS', text: '检测器发现自己错了，无法接受，已自行关机。' };

  app.open = function () {
    // runs 检测次数，proved 被证实没开机几次，on 测出开机几次，armed 玩家刚亲手开过机（下次检测会测出开机）
    const stats = Object.assign({ runs: 0, proved: 0, on: 0, armed: false }, OS.save.get('bootcheck', {}));
    let busy = false, dead = false, timers = [], boxes = [];

    const status = el('div', { class: 'bc-status', text: '状态：等待检测' });
    const pct = el('div', { class: 'bc-pct', text: '' });
    const fill = el('div', { class: 'bc-fill' });
    const stat = el('div', { class: 'bc-stat' });
    const startBtn = el('button', { class: 'xpbtn default', text: '开始检测' });
    const closeBtn = el('button', { class: 'xpbtn', text: '关闭' });
    const content = el('div', { class: 'bc' }, [
      el('div', { class: 'bc-head' }, [
        OS.iconEl('detector', 'bc-logo'),
        el('div', {}, [el('div', { class: 'bc-name', text: '开机检测器 Pro' }), el('div', { class: 'bc-ver', text: '专业检测设备是否开机 · v2.0 专业版' })])
      ]),
      el('div', { class: 'bc-desc', text: '本软件将对你的设备进行全面检测，判断它此刻是否处于开机状态。' }),
      el('div', { class: 'bc-panel' }, [
        el('div', { class: 'bc-row' }, [status, pct]),
        el('div', { class: 'bc-bar' }, [fill])
      ]),
      stat,
      el('div', { class: 'bc-btns' }, [startBtn, closeBtn])
    ]);
    const renderStat = () => { stat.textContent = '累计检测 ' + stats.runs + ' 次　检测到开机 ' + stats.on + ' 次'; };
    renderStat();

    const win = OS.wm.open({
      title: app.name, icon: app.icon, width: 300, appId: app.id, content, maximizable: false,
      onClose: () => { dead = true; timers.forEach(clearTimeout); closeBoxes(); }
    });
    const later = (fn, ms) => { timers.push(setTimeout(() => { if (!dead) fn(); }, ms)); };

    closeBtn.addEventListener('click', () => { OS.sound.play('click'); win.close(); });
    startBtn.addEventListener('click', () => {
      if (busy) return;
      OS.sound.play('click');
      scan();
    });

    /* ---------- 检测 ---------- */
    function setBar(p) { fill.style.width = p + '%'; pct.textContent = p + '%'; }
    function scan() {
      busy = true;
      startBtn.disabled = true;
      startBtn.textContent = '检测中…';
      setBar(0);
      let t = 0;
      STEPS.forEach(([text, p]) => {
        later(() => { status.textContent = text; setBar(p); }, t);
        t += 1000;
      });
      // 卡在 99% 一会儿
      later(() => { status.textContent = '检测完成。'; setBar(100); }, t + 1200);
      later(() => {
        stats.runs++;
        OS.save.set('bootcheck', stats);
        renderStat();
        if (stats.armed) paradox();
        else argue(0);
      }, t + 1600);
    }

    /* ---------- 蓝屏彩蛋：终于测出开机了，然后崩了 ---------- */
    function paradox() {
      stats.armed = false;
      stats.on++;
      OS.save.set('bootcheck', stats);
      renderStat();
      status.textContent = '检测结果：开机';
      const shut = (v, w) => w.close();
      const first = errorBox(ON_RESULT, ['哦'], null, shut, 'info');
      boxes.push(first);
      const wait = stats.on > 1 ? ON_WAIT_AGAIN : ON_WAIT;
      later(() => boxes.push(errorBox(wait[0], [wait[1]], { x: first.x + 10, y: first.y + 8 }, shut, 'warn')), 1800);
      later(() => OS.ui.bsod(BSOD), 4300);
    }

    /* ---------- 报错框：越叠越多 ---------- */
    function closeBoxes() { const all = boxes; boxes = []; all.forEach(b => { b.mute = true; b.close(); }); }
    function finish(text) {
      closeBoxes();
      busy = false;
      startBtn.disabled = false;
      startBtn.textContent = '重新检测';
      status.textContent = text;
    }
    // n = 已经反驳了几次
    function argue(n) {
      const text = n === 0 ? RESULT : ARGUE[n - 1][0];
      const no = n === 0 ? FIRST_NO : ARGUE[n - 1][1];
      boxes.forEach(b => b.el.querySelectorAll('button').forEach(x => { x.disabled = true; }));
      const prev = boxes[boxes.length - 1];
      // “你再犟一次，检测器就要哭了”那一框：红叉变成 T_T 哭脸，窗口抖两下，“呜呜”
      const cry = n === CRY_AT;
      const box = errorBox(text, ['哦', no], prev ? { x: prev.x + 10, y: prev.y + 8 } : null, v => {
        if (v === '哦') finish(n === 0 ? '检测结果：关机' : '检测结果：关机（你已认可）');
        else if (v === no) {
          if (n + 1 >= 10) blackout();
          else argue(n + 1);
        } else finish(n === 0 ? '检测结果：关机' : '检测结果：关机（你已认可）');   // 点了右上角 ×：跟点“哦”一样，所有框一起清掉
      }, cry ? 'cry' : null);
      boxes.push(box);
      if (cry) later(() => box.el.classList.add('sob'), 220);
    }
    function errorBox(text, buttons, at, done, icon) {
      icon = icon || 'error';
      let answered = false;
      const row = el('div', { class: 'dlg-btns' });
      const body = el('div', { class: 'dlg' }, [
        el('div', { class: 'dlg-main' }, [OS.iconEl(icon, 'dlg-icon'), el('div', { class: 'dlg-text', text })]),
        row
      ]);
      const w = OS.wm.open(Object.assign({
        title: '检测结果', width: 290, content: body, modal: true, taskbar: false,
        minimizable: false, maximizable: false, className: 'is-dialog',
        onClose: () => { if (!answered && !dead && !w.mute) { answered = true; done(null, w); } }
      }, at || {}));
      buttons.forEach((label, i) => {
        const b = el('button', { class: 'xpbtn' + (i === 0 ? ' default' : ''), text: label });
        b.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          OS.sound.play('click');
          done(label, w);
        });
        row.appendChild(b);
      });
      OS.sound.play(icon === 'info' ? 'ding' : icon === 'cry' ? 'sob' : 'error');
      return w;
    }

    /* ---------- 第 10 次：黑屏 ---------- */
    function blackout() {
      closeBoxes();
      stats.proved++;
      OS.save.set('bootcheck', stats);
      OS.taskbar.toggleMenu(false);
      OS.ui.closeMenus();
      OS.sound.play('crtOff');
      const line = el('div', { class: 'crt-line' });
      const msg = el('div', { class: 'bo-text', text: BLACK_TEXT });
      const hint = el('div', { class: 'bo-hint', text: BLACK_HINT });
      const scr = el('div', { class: 'blackout' }, [line, el('div', { class: 'bo-msg' }, [msg, hint])]);
      document.getElementById('overlay').appendChild(scr);
      setTimeout(() => msg.classList.add('show'), 2000);
      setTimeout(() => {
        hint.classList.add('show');
        scr.addEventListener('pointerdown', wake, { once: true });
      }, 3000);
      function wake() {
        // 玩家亲手“开机”了：下次检测会真的测出开机
        stats.armed = true;
        OS.save.set('bootcheck', stats);
        OS.sound.play('crtOn');
        scr.classList.add('waking');
        setTimeout(() => {
          scr.remove();
          if (!dead) finish('检测结果：关机（已证实）');
          OS.ticker.interrupt(NEWS);
        }, 450);
      }
    }

    return win;
  };
})();

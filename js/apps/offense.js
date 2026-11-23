/* Offense 2003：那几年的办公三件套（开始 ▸ 所有程序 ▸ Offense 2003）
   - Wordy 2003（写文章，wordpad.js 里的 wordy 那一套）／ Excuse 2003（做表格，debt.js）／ PowerPointless 2003（做幻灯片，pptless.js）
   - 添加或删除程序 里是一整行"Offense 2003"：［更改］勾要哪几个，［删除］全删（addremove.js）
   - .doc：装着 Wordy 就用 Wordy 开，删了回到写字板；.rtf 还是写字板（OS.docEditor）
   - 小算盘：三件套共用的助手（原来只在欠条里），这里是它本体：OS.offense.pal(放在哪, later, 窗口关了没, 说的话, 选项) */
(function () {
  'use strict';
  const el = OS.el;

  /* ================= .doc 用谁开 ================= */
  OS.docEditor = () => (OS.wordy && (!OS.soft || OS.soft.has('wordy')) ? OS.wordy : OS.wordpad);

  /* ================= 小算盘：原创的 Office 小助手式角色（一把长着大眼睛、会挑眉毛的算盘） =================
     Codex 画的 13 帧（assets/debt/pal.webp，横排，每帧显示 48×48）。网页按状态换帧：
     平时站着、隔一会眨眼、东张西望；说话动嘴；点它拨算盘；藏起来 / 回来挥手；没人理就睡着；账算爆了就晕。
     lines：{ back, wake, tips: [], alone, hide } —— 每个软件说自己的话 */
  const FR = { idle: 0, blink: 1, lookL: 2, lookR: 3, talk1: 4, talk2: 5, bead1: 6, bead2: 7, wave1: 8, wave2: 9, sleep1: 10, sleep2: 11, dizzy: 12 };
  const PAL_W = 48;
  const TICK = 160;            // 每 0.16 秒换一次帧（那几年 GIF 的感觉）
  const SLEEP_MS = 30000;      // 30 秒没人碰就睡着
  const TALK_MS = 1300;        // 冒一句话时动嘴的时间
  const HIDE_MS = 20000;       // 藏起来以后过这么久自己回来
  const SEQ = {
    bead: ['bead1', 'bead2', 'bead1', 'bead2', 'bead1', 'bead2'],
    wave: ['wave1', 'wave1', 'wave2', 'wave2', 'wave1', 'wave1', 'wave2', 'wave2', 'wave1', 'wave1', 'wave2', 'wave2']
  };
  const LINES = { back: '我又回来了。', alone: '目前只有小算盘一个助手。\n它很孤独。', hide: '隐藏小算盘', pick: '选择助手…', anim: '动画！' };

  function pal(host, later, isDead, lines, opts) {
    lines = Object.assign({}, LINES, lines);
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
    // 在软件里随便点一下也算"有人理它"
    host.parentNode.addEventListener('pointerdown', e => { if (!body.contains(e.target)) touch(); }, true);

    const close = () => { bub.classList.remove('on'); };
    const talk = () => { touch(); talkUntil = Date.now() + TALK_MS; };
    const p = {
      opts: opts || {},
      hidden: () => box.classList.contains('gone'),
      show() { box.classList.remove('gone'); touch(); },
      // 藏起来：先挥挥手再走。帮助菜单里能叫回来；不叫的话，过一会儿它自己又回来了
      hide() {
        close();
        touch();
        play('wave');
        const n = ++hides;
        later(() => { if (n === hides) box.classList.add('gone'); }, SEQ.wave.length * TICK);
        later(() => { if (n === hides && p.hidden()) p.comeBack(); }, HIDE_MS);
      },
      // 回来：挥手打招呼
      comeBack() {
        hides++;
        p.show();
        play('wave');
        p.say(lines.back, true);
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
      },
      tip() { p.show(); p.say(OS.pick(lines.tips)); }
    };
    // 点它：拨一下算珠，说个小提示；睡着了点它，先嘴硬一句
    const poke = wasAsleep => {
      touch();
      play('bead');
      OS.sound.play('beep');
      p.say(wasAsleep ? lines.wake : OS.pick(lines.tips), true);
    };
    // 按住拖：跟当年的 Office 小助手一样，挡着了可以拖到别处去（气泡跟着换边，别跑出软件）
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
      { label: lines.hide, action: () => p.hide() },
      { label: lines.pick, action: () => OS.ui.dialog({ title: '选择助手', icon: 'info', text: lines.alone }) },
      '-',
      { label: lines.anim, action: () => { touch(); play(Math.random() < 0.5 ? 'bead' : 'wave'); OS.sound.play('beep'); } }
    ]);
    return p;
  }

  OS.offense = { pal, NAME: 'Offense 2003' };
})();

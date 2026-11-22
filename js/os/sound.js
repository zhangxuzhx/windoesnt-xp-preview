/* 声音：全部用代码现场合成，不占体积，也不用别人的音效 */
(function () {
  'use strict';
  let ctx = null, master = null, noiseBuf = null;
  const VOL = 0.6;
  const S = OS.sound = { muted: !!OS.save.get('muted', false) };

  // 浏览器要求第一次点屏幕之后才能出声
  S.unlock = function () {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = S.muted ? 0 : VOL;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* 没声音也能玩 */ }
  };

  S.setMuted = function (m) {
    S.muted = !!m;
    OS.save.set('muted', S.muted);
    if (master) master.gain.value = S.muted ? 0 : VOL;
    OS.emit('sound:muted', S.muted);
  };

  function osc(type, f, t0, dur, vol, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  function noise(t0, dur, vol, cutoff) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    flt.type = 'lowpass'; flt.frequency.value = cutoff || 1200;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.03);
  }

  const SOUNDS = {
    click(t) { osc('square', 1800, t, 0.03, 0.04); },
    pop(t) { osc('sine', 500, t, 0.09, 0.25, 1100); },
    // 报错的“咚”
    error(t) { osc('sine', 210, t, 0.4, 0.55, 150); osc('triangle', 630, t, 0.22, 0.12); noise(t, 0.05, 0.25, 700); },
    ding(t) { osc('sine', 1046, t, 0.5, 0.22); osc('sine', 1568, t + 0.08, 0.6, 0.16); },
    notify(t) { osc('sine', 880, t, 0.2, 0.2); osc('sine', 1318, t + 0.1, 0.35, 0.18); },
    // 开机：先“噔噔噔噔~”很隆重，然后泄气地滑下来
    startup(t) {
      [523, 659, 784, 1046].forEach((f, i) => osc('triangle', f, t + i * 0.11, 0.55, 0.2));
      osc('sine', 1046, t + 0.44, 0.9, 0.14);
      osc('triangle', 392, t + 1.2, 0.32, 0.22, 370);
      osc('triangle', 370, t + 1.55, 0.32, 0.22, 349);
      osc('triangle', 349, t + 1.9, 1.0, 0.22, 262);
    },
    shutdown(t) { [784, 659, 523, 392].forEach((f, i) => osc('triangle', f, t + i * 0.16, 0.5, 0.2)); },
    bsod(t) { osc('square', 110, t, 0.7, 0.1); noise(t, 0.5, 0.18, 3000); },
    // 羊叫“咩~”：点得越多叫得越高
    baa(t, n) {
      const base = 290 + (n || 0) * 22 + Math.random() * 20;
      const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      const flt = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(base, t);
      o.frequency.linearRampToValueAtTime(base * 0.9, t + 0.42);
      lfo.frequency.value = 24;
      lg.gain.value = base * 0.05;
      lfo.connect(lg); lg.connect(o.frequency);
      flt.type = 'bandpass'; flt.frequency.value = 1150; flt.Q.value = 1.6;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
      g.gain.setValueAtTime(0.22, t + 0.24);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(flt); flt.connect(g); g.connect(master);
      o.start(t); lfo.start(t); o.stop(t + 0.5); lfo.stop(t + 0.5);
    },
    // 气球“砰”
    burst(t) { noise(t, 0.16, 0.7, 6000); osc('sine', 190, t, 0.2, 0.45, 55); },
    // 老显示器关掉的“啪——嗞”、打开的“嗡”
    crtOff(t) { noise(t, 0.06, 0.4, 4000); osc('sine', 900, t, 0.45, 0.12, 40); },
    crtOn(t) { osc('sine', 55, t, 0.5, 0.35, 110); noise(t, 0.25, 0.15, 2500); osc('sine', 4200, t + 0.05, 0.6, 0.03); },
    // 逆天改命中：一段 3 秒的 8-bit 小调（像当年闪图网页自动播放的背景音乐）
    fateJingle(t) {
      const prog = [[523, 659, 784, 1047], [440, 523, 659, 880], [349, 440, 523, 698], [392, 494, 587, 784]];
      let k = 0;
      prog.forEach(ch => [0, 1, 2, 3, 2, 1].forEach(j => { osc('square', ch[j], t + k * 0.12, 0.1, 0.05); k++; }));
    },
    // 监护仪“嘀”、针式打印机“滋滋”
    beep(t) { osc('square', 1180, t, 0.07, 0.05); },
    // 软驱找盘“咔啦咔啦”、光驱转起来“嗡——”、光驱托盘“咔哒”
    floppy(t) { for (let i = 0; i < 6; i++) { osc('square', 90 + (i % 2) * 40, t + i * 0.09, 0.06, 0.12); noise(t + i * 0.09, 0.04, 0.2, 1800); } },
    cdSpin(t) { osc('sawtooth', 120, t, 1.6, 0.04, 420); osc('sine', 240, t, 1.6, 0.05, 840); noise(t, 1.4, 0.05, 1200); },
    eject(t) { noise(t, 0.08, 0.35, 2500); osc('square', 160, t, 0.08, 0.15, 90); noise(t + 0.25, 0.06, 0.25, 2000); },
    // 羊嚼纸“咔嚓”、拉羊粪“噗”、点羊粪“噗叽”
    munch(t) { noise(t, 0.05, 0.4, 2600); noise(t + 0.08, 0.05, 0.3, 2200); },
    poop(t) { osc('sine', 170, t, 0.16, 0.35, 70); noise(t, 0.07, 0.2, 500); },
    squish(t) { noise(t, 0.12, 0.3, 900); osc('sine', 320, t, 0.1, 0.12, 110); },
    // 命令提示符里一个字一个字“打”出来的哒哒声
    key(t) { noise(t, 0.025, 0.12, 3500); osc('square', 520 + Math.random() * 160, t, 0.02, 0.025); },
    printer(t) {
      for (let i = 0; i < 4; i++) osc('square', 260 + (i % 2) * 90, t + i * 0.05, 0.045, 0.05);
      noise(t, 0.2, 0.08, 2400);
    },
    // 检测器哭了：“呜~呜~”两声往下滑
    sob(t) {
      [0, 0.42].forEach((d, i) => {
        osc('triangle', 640 - i * 70, t + d, 0.38, 0.2, 430 - i * 70);
        osc('square', 640 - i * 70, t + d, 0.3, 0.035, 430 - i * 70);
      });
    },
    // 给拨号猫磕头的“咚”、拍显示器的“啪”
    thud(t) { osc('sine', 120, t, 0.2, 0.5, 55); noise(t, 0.06, 0.25, 600); },
    slap(t) { noise(t, 0.14, 0.8, 5000); osc('square', 180, t, 0.09, 0.2, 80); },
    // 蚊子“嗡——”：由远到近再远（arg = 持续几秒）
    buzz(t, dur) {
      dur = dur || 1.8;
      const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 560;
      lfo.frequency.value = 23; lg.gain.value = 18;
      lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + dur * 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); lfo.start(t);
      o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    },
    // 蚊子被熏晕：“嗡~~”一路往下掉
    dizzy(t) { osc('sawtooth', 640, t, 0.8, 0.035, 150); },
    // 划火柴点蚊香、扇一扇的风声
    match(t) { noise(t, 0.28, 0.25, 5000); osc('sine', 900, t, 0.16, 0.05, 300); },
    fan(t) { noise(t, 0.22, 0.3, 900); },
    // 一剑劈下去：“唰——锵”
    slash(t) { noise(t, 0.14, 0.45, 9000); osc('triangle', 2600, t + 0.04, 0.25, 0.07, 700); osc('square', 1400, t + 0.06, 0.12, 0.03, 500); },
    // 56K 拨号：嘀嘀嘀按号码 → 嘟—— → 嘀嘟嘀嘟 → 嘶啦啦
    // 抠抠：来消息“咚咚”（自己合成的，不用当年那个真的提示音）、登录成功铁公鸡打鸣、窗口抖动“哗啦啦”
    kkMsg(t) { osc('sine', 523, t, 0.13, 0.28, 440); osc('sine', 523, t + 0.17, 0.13, 0.28, 440); },
    kkCrow(t) {
      osc('sawtooth', 520, t, 0.13, 0.06, 760);
      osc('sawtooth', 760, t + 0.15, 0.13, 0.06, 980);
      osc('sawtooth', 980, t + 0.3, 0.55, 0.06, 620);
      osc('triangle', 1960, t + 0.3, 0.5, 0.05, 1240);
    },
    kkShake(t) { for (let i = 0; i < 6; i++) noise(t + i * 0.06, 0.05, 0.22, 900 + (i % 2) * 600); },
    dialup(t) {
      [[697, 1209], [770, 1336], [852, 1477], [941, 1336], [697, 1336], [770, 1209], [852, 1336]].forEach((d, i) => {
        osc('sine', d[0], t + i * 0.1, 0.07, 0.1);
        osc('sine', d[1], t + i * 0.1, 0.07, 0.1);
      });
      const t2 = t + 0.85;
      osc('sine', 2100, t2, 0.5, 0.08);
      [980, 1180, 980, 1180, 1650, 1850, 1650, 1850].forEach((f, i) => osc('square', f, t2 + 0.55 + i * 0.1, 0.09, 0.035));
      noise(t2 + 1.4, 0.7, 0.16, 3500);
    }
  };

  S.play = function (name, arg) {
    if (!ctx || S.muted) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const fn = SOUNDS[name];
      if (fn) fn(ctx.currentTime + 0.01, arg);
    } catch (e) { /* ignore */ }
  };

  window.addEventListener('pointerdown', S.unlock, true);
})();

/* 千千不听（桌面 + 开始 ▸ 所有程序 ▸ 千千不听）：那几年人人电脑里都有的音乐播放器，名字反着叫；同时是全游戏的背景音乐
   - 歌是 Suno 出的 5 首（assets/music/，点播放才下载）。
   - 主面板（歌名、时间、频谱、进度条、按钮、音量）+ 均衡器 + 播放列表 + 歌词秀；后三块能收起。
   - 换肤（经典银 / 非主流粉 / 黑色酷炫）、桌面歌词、迷你模式、开机自动播放（默认不勾）。
   - 联动：放歌时抠抠个性签名变“♪ 正在听”，好友来一句；音量太大放 DJ，新建文件夹(2) 的住户敲门、物业投诉记录 +1。
   - 蓝屏：音量最大 + 重低音 + DJ 劲爆版放满 30 秒 → SUBWOOFER_OVERLOAD */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.qianqian;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = '千千不听', NAME_MARS = '芊芊鈈聽';
  const L = {
    pure: '纯音乐，请欣赏',
    searching: '正在搜索歌词……',
    notFound: '未找到歌词：连谁唱的都不知道，我上哪给你找。',
    serverTry: '正在连接歌词服务器……',
    serverFail: '歌词服务器在楼下，网线被老鼠咬了。',
    uninstall: '卸载失败：千千不听不听你的。',
    about: NAME + '　版本 5.1\n(C) ' + OS.YEAR + ' 无聊科技\n你说什么？听不见。',
    knock: '楼上的，小点声！',
    toEarth: '翻译成地球文', toMars: '变回火星文',
    autoplay: '开机自动播放',
    props: t => '文件名：' + t.name + '\n时长：' + clock(t.dur) + '\n比特率：48 kbps\n来源：网上下的，忘了哪个网站',
    noDelete: '删不掉：这首歌跟千千不听是一起装的。'
  };
  const MODES = ['列表循环', '单曲循环', '随机播放', '顺序播放'];
  // 皮肤：Y2K 风（液态金属、透明果冻塑料、镭射幻彩），都用代码画
  const SKINS = [['silver', '液态银'], ['jelly', '果冻蓝'], ['pink', '非主流粉']];
  // 均衡器：5 段（低到高），预设单位 dB
  const EQ_FREQ = [60, 230, 910, 3600, 14000];
  const EQ_LABEL = ['60', '230', '910', '3.6K', '14K'];
  const PRESETS = { '默认': [0, 0, 0, 0, 0], '流行': [-1, 2, 4, 2, -1], '摇滚': [5, 2, -2, 2, 5], '古典': [4, 2, 0, 2, 3], '重低音': [12, 8, 2, 0, 0] };
  const BASS = '重低音';

  /* ================= 歌 =================
     lrc：[[开始秒数, 歌词, 火星文写法（可选）], ...]；'pure' = 纯音乐；'search' = 找不到歌词那首 */
  const TRACKS = [
    { file: 'm01', name: '群星 - 宝贝我爱你爱你爱你（DJ 劲爆版）.mp3', title: '宝贝我爱你爱你爱你（DJ 劲爆版）', dur: 99.6, dj: true,
      friend: ['deskmate', '你品味好土。'],
      // 时间是用语音识别听出来的（Suno 把主歌唱了两遍，跟写的词不完全一样，以实际唱的为准）
      lrc: [[1.3, '宝贝我爱你爱你爱你'], [5, '爱到网速都变慢'], [9.5, '宝贝你等我等我等我'], [14.8, '等我把这首歌下完'],
        [17.6, '宝贝我爱你爱你爱你'], [21.2, '爱到网速都变慢'], [24, '宝贝你等我等我等我'], [28, '等我把这首歌下完'],
        [31.6, '拨号猫在闪'], [35.3, '心跳在加班'],
        [41.2, '动次打次 动次打次'], [45.6, '楼下的人在敲暖气片'], [49.2, '动次打次 动次打次'], [52.5, '宝贝我爱你 爱到断电那一天'],
        [55.7, '动次打次 动次打次'], [59.5, '楼下的人在敲暖气片'], [63, '动次打次 动次打次'], [66.3, '宝贝我爱你 爱到断电那一天'],
        [70, '♪ ♪ ♪'], [90, '动次打次 动次打次'], [94.8, '宝贝我爱你 爱到断电那一天']] },
    { file: 'm02', name: '未知歌手 - 下雨天记得收衣服（伴奏）.mp3', title: '下雨天记得收衣服（伴奏）', dur: 90, lrc: 'pure' },
    { file: 'm03', name: '不知道谁唱的.mp3', title: '不知道谁唱的', dur: 89.5, lrc: 'search' },
    { file: 'm04', name: '╰☆ゞ寂寞の烟花ゞ☆╮ - 莪們哋噯.mp3', title: '莪們哋噯', dur: 99.4, mars: true,
      friend: ['yanhua', '伱竾聽莪哋謌？'],
      // 时间是用语音识别听出来的；后半段 Suno 自己加了一句“你却不说我爱你”
      lrc: [[15, '你说过爱我', '伱說過噯莪'], [18, '我当真了', '莪噹嫃孒'], [21.6, '回忆是一把刀', '囬憶媞①紦刀'], [24.6, '刺得我心疼', '刺嘚莪惢疼'],
        [28.7, '你在线却不回我', '伱茬線卻鈈囬莪'], [33.9, '我把签名改了又改', '莪紦簽洺改孒叒改'],
        [40.2, '烟花再美也会散', '煙蘤侢媄吔浍散'], [43.9, '寂寞的人不说晚安', '寂寞哋亽鈈說晚安'], [47.4, '我把你拉进黑名单', '莪紦伱拉進嫼洺單'], [50.8, '又偷偷把你放出来', '叒偸偸紦伱放絀唻'],
        [53.4, '烟花再美也会散', '煙蘤侢媄吔浍散'], [57.5, '寂寞的人不说晚安', '寂寞哋亽鈈說晚安'],
        [67.3, '你却不说我爱你', '伱卻鈈說莪噯伱'], [71.5, '我把你拉进黑名单', '莪紦伱拉進嫼洺單'], [79, '又偷偷把你放出来', '叒偸偸紦伱放絀唻'],
        [84.2, '烟花再美也会散', '煙蘤侢媄吔浍散'], [88.3, '我把你拉进黑名单', '莪紦伱拉進嫼洺單'], [92, '♪ ♪ ♪']] },
    { file: 'm05', name: '无聊科技 - 桌面背景音乐.mp3', title: '桌面背景音乐', dur: 56, lrc: 'pure', bgm: true }
  ];
  const BGM = TRACKS.findIndex(t => t.bgm);

  /* ================= 蓝屏、敲门 ================= */
  const BSOD = { id: 'qianqian', name: 'SUBWOOFER_OVERLOAD', text: '低音炮太猛，把不奔腾从主板上震下来了。' };
  const BINS = 100;                       // 频谱只看前 100 个频段（再往上基本没声音）
  const BSOD_SEC = 30, QUAKE_SEC = 10;    // 满足条件放满 30 秒蓝屏；10 秒起桌面图标开始跳
  const KNOCK_VOL = 90, KNOCK_SEC = 5, KNOCK_GAP = 60000;

  /* ================= 状态 ================= */
  const clock = s => { s = Math.max(0, Math.floor(s || 0)); return OS.pad2(Math.floor(s / 60)) + ':' + OS.pad2(s % 60); };
  const AUTO_KEY = 'qqAuto';
  let win = null, ui = null, tray = null, deskEl = null, timer = 0;
  let cur = 0, playing = false, mode = 0, vol = OS.save.get('qqVol', 70), eq = PRESETS['默认'].slice(), preset = '默认';
  let skin = OS.save.get('qqSkin', 'silver'), showEq = false, showList = true, showLrc = true, mini = false;
  let desk = false, deskLocked = false, earth = false, startedAt = 0, hidden = false;
  let audio = null, actx = null, gainNode = null, filters = [], analyser = null, freq = null;
  let loudSince = 0, bassSince = 0, knockAt = 0, lastLow = 0, lastThump = 0;
  const commented = new Set();

  /* ================= 声音 ================= */
  // 任务管理器里改优先级：低 = 又慢又低像没电了，实时 = 又快又尖（换歌也保持）
  let rate = 1;
  function applyRate() {
    if (!audio) return;
    audio.preservesPitch = audio.mozPreservesPitch = audio.webkitPreservesPitch = false;
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
  }
  function ensureAudio() {
    if (audio) return;
    audio = new Audio();
    audio.preload = 'auto';
    applyRate();
    audio.addEventListener('ended', onEnded);
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      actx = new AC();
      const src = actx.createMediaElementSource(audio);
      filters = EQ_FREQ.map((f, i) => {
        const b = actx.createBiquadFilter();
        b.type = i === 0 ? 'lowshelf' : i === EQ_FREQ.length - 1 ? 'highshelf' : 'peaking';
        b.frequency.value = f;
        b.Q.value = 1;
        return b;
      });
      gainNode = actx.createGain();
      analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.55;
      analyser.minDecibels = -85;   // 调低灵敏度：不然歌一响 14 根柱子全顶满
      analyser.maxDecibels = -12;
      let n = src;
      filters.forEach(b => { n.connect(b); n = b; });
      n.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(actx.destination);
      freq = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) { actx = null; gainNode = null; analyser = null; }   // 不支持就只出声，没有频谱和均衡器
    applyVol();
    applyEq();
  }
  function applyVol() {
    if (!audio) return;
    const v = OS.sound.muted ? 0 : vol / 100 * OS.sound.level;
    if (gainNode) { gainNode.gain.value = v; audio.volume = 1; } else audio.volume = v;
  }
  function applyEq() { filters.forEach((b, i) => { b.gain.value = eq[i]; }); }
  OS.on('sound:muted', applyVol);   // 右下角喇叭静音，千千不听也没声
  OS.on('sound:level', applyVol);   // 控制面板调了总音量

  function playTrack(i) {
    const t = TRACKS[i];
    ensureAudio();
    if (cur !== i || !audio.getAttribute('src')) {
      cur = i;
      audio.setAttribute('src', 'assets/music/' + t.file + '.mp3');
      startedAt = Date.now();
      earth = false;
      loudSince = 0; bassSince = 0;
    }
    if (actx && actx.state === 'suspended') actx.resume();
    playing = true;
    const p = audio.play();
    if (p && p.catch) p.catch(() => { playing = false; render(); });
    onStart();
    render();
  }
  function pause() { if (audio) audio.pause(); playing = false; onStop(); render(); }
  function stop() {
    if (audio) { audio.pause(); try { audio.currentTime = 0; } catch (_) { /* ignore */ } }
    playing = false; onStop(); render();
  }
  function toggle() { if (playing) pause(); else playTrack(cur); }
  // 下一首 / 上一首（随机播放：换一首不一样的）
  function step(dir) {
    if (mode === 2) return OS.pick(TRACKS.map((_, i) => i).filter(i => i !== cur));
    return (cur + dir + TRACKS.length) % TRACKS.length;
  }
  function onEnded() {
    if (mode === 1) { audio.currentTime = 0; audio.play(); return; }
    if (mode === 3 && cur === TRACKS.length - 1) { stop(); return; }
    playTrack(step(1));
  }
  function onStart() {
    const t = TRACKS[cur];
    if (OS.koukou && OS.koukou.setListening) OS.koukou.setListening(t.title);
    // 抠抠好友来一句（每首歌每次开机只说一次）
    if (t.friend && !commented.has(cur) && OS.koukou && OS.koukou.loggedIn && OS.koukou.loggedIn()) {
      commented.add(cur);
      const [id, line] = t.friend;
      setTimeout(() => { if (playing) OS.koukou.receive(id, line); }, 8000);
    }
    trayRefresh();
  }
  function onStop() {
    if (OS.koukou && OS.koukou.setListening) OS.koukou.setListening(null);
    quake(false);
    trayRefresh();
  }

  /* ================= 歌词 ================= */
  // 现在唱到哪一句：{ i, p }，p = 这一句唱了多少（0~1，卡拉 OK 扫色用）
  function lrcAt(t) {
    const lrc = TRACKS[cur].lrc;
    if (!Array.isArray(lrc)) return null;
    let i = -1;
    for (let k = 0; k < lrc.length; k++) if (t >= lrc[k][0]) i = k;
    if (i < 0) return { i: -1, p: 0 };
    const end = i + 1 < lrc.length ? lrc[i + 1][0] : (TRACKS[cur].dur || t + 4);
    return { i, p: Math.min(1, (t - lrc[i][0]) / Math.max(0.5, Math.min(end - lrc[i][0], 5))) };
  }
  const lineText = line => (TRACKS[cur].mars && !earth && line[2] ? line[2] : line[1]);
  // 卡拉 OK：底下一层原色，上面一层亮色按进度露出来
  function karaoke(text, p) {
    return el('span', { class: 'qq-k' }, [el('span', { class: 'qq-k-base', text }), el('span', { class: 'qq-k-fill', text, style: { width: (p * 100).toFixed(1) + '%' } })]);
  }
  // 现在歌词秀该显示什么：{ rows: [上一句, 这一句, 下一句], p } 或 { msg }
  function lrcView(t) {
    const tr = TRACKS[cur], lrc = tr.lrc;
    if (lrc === 'pure') return { msg: L.pure };
    if (lrc === 'search') return { msg: Date.now() - startedAt < 3000 || !playing && t < 0.5 ? L.searching : L.notFound };
    const a = lrcAt(t);
    if (!a) return { msg: '' };
    return { rows: [a.i > 0 ? lineText(lrc[a.i - 1]) : '', a.i >= 0 ? lineText(lrc[a.i]) : tr.title, a.i + 1 < lrc.length ? lineText(lrc[a.i + 1]) : ''], p: a.i >= 0 ? a.p : 0 };
  }

  /* ================= 窗口 ================= */
  function open() {
    if (win && !win.isClosed) { showMain(); return win; }
    ui = build();
    win = OS.wm.open({
      title: NAME, icon: 'music', width: 300, content: ui.box, appId: app.id, maximizable: false, className: 'qq-win',
      onClose: () => {
        stop();
        rate = 1; applyRate();   // 进程结束了，优先级跟着没了
        clearInterval(timer); timer = 0;
        if (tray) { tray.remove(); tray = null; }
        if (deskEl) { deskEl.remove(); deskEl = null; }
        quake(false);
        hidden = false;
        win = null; ui = null;
      }
    });
    if (!tray) {
      tray = OS.taskbar.trayAdd(el('span', { class: 'tray-btn qq-tray', title: NAME }, [OS.iconEl('music', 'tray-ico')]));
      tray.addEventListener('click', () => { OS.sound.play('click'); showMain(); });
      OS.ui.onContext(tray, () => menuItems(true));
    }
    applySkin();
    render();
    refit();
    clearInterval(timer);
    timer = setInterval(tick, 90);
    return win;
  }
  app.open = open;

  function build() {
    const r = {};
    const btn = (cls, title, fn) => { const b = el('button', { class: 'qq-btn ' + cls, title }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(); }); return b; };
    const small = (text, fn) => { const b = el('button', { class: 'qq-sm', text }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(b); }); return b; };
    // 显示屏：滚动歌名、时间、频谱
    r.marq = el('span', { class: 'qq-marq' });
    r.time = el('div', { class: 'qq-time' });
    r.mode = el('div', { class: 'qq-modetxt' });
    r.bars = [];
    for (let i = 0; i < 14; i++) r.bars.push(el('i'));
    r.spec = el('div', { class: 'qq-spec' }, r.bars);
    const lcd = el('div', { class: 'qq-lcd' }, [el('div', { class: 'qq-name' }, [r.marq]), el('div', { class: 'qq-lcd2' }, [r.spec, el('div', {}, [r.time, r.mode])])]);
    // 进度条（能点能拖）
    r.fill = el('div', { class: 'qq-prog-fill' });
    r.prog = el('div', { class: 'qq-prog' }, [r.fill]);
    drag(r.prog, p => { if (audio && audio.duration) audio.currentTime = p * audio.duration; });
    // 按钮
    r.play = btn('qq-play', '播放 / 暂停', toggle);
    const ctrls = el('div', { class: 'qq-ctrls' }, [
      btn('qq-prev', '上一首', () => playTrack(step(-1))), r.play, btn('qq-stop', '停止', stop), btn('qq-next', '下一首', () => playTrack(step(1))),
      btn('qq-modebtn', '播放模式', () => { mode = (mode + 1) % MODES.length; render(); })
    ]);
    // 音量
    r.volFill = el('div', { class: 'qq-vol-fill' });
    r.vol = el('div', { class: 'qq-vol', title: '音量' }, [r.volFill]);
    drag(r.vol, p => { vol = Math.round(p * 100); OS.save.set('qqVol', vol); applyVol(); render(); });
    const row = el('div', { class: 'qq-row' }, [ctrls, el('span', { class: 'qq-volico' }), r.vol]);
    // 小按钮一排
    const smalls = el('div', { class: 'qq-smalls' }, [
      small('均衡', () => { showEq = !showEq; render(); refit(); }),
      small('列表', () => { showList = !showList; render(); refit(); }),
      small('歌词', () => { showLrc = !showLrc; render(); refit(); }),
      small('换肤', b => { const rc = OS.stage.rectOf(b), p = { x: rc.left, y: rc.bottom }; OS.ui.contextMenu(skinItems(), p.x, p.y); }),
      small('桌面歌词', () => { setDesk(!desk); }),
      small('迷你', () => setMini(true))
    ]);
    r.main = el('div', { class: 'qq-main' }, [lcd, r.prog, row, smalls]);
    // 迷你模式：一小条
    r.miniName = el('span', { class: 'qq-mini-name' });
    r.miniPlay = btn('qq-play', '播放 / 暂停', toggle);
    r.mini = el('div', { class: 'qq-mini' }, [r.miniPlay, btn('qq-next', '下一首', () => playTrack(step(1))), r.miniName, small('还原', () => setMini(false))]);
    // 均衡器
    r.eqKnobs = [];
    const sliders = EQ_FREQ.map((f, i) => {
      const knob = el('div', { class: 'qq-eq-knob' });
      const track = el('div', { class: 'qq-eq-track' }, [knob]);
      drag(track, (p, py) => { eq[i] = Math.round((0.5 - py) * 24); preset = '自定义'; applyEq(); render(); }, true);
      r.eqKnobs.push(knob);
      return el('div', { class: 'qq-eq-band' }, [track, el('div', { class: 'qq-eq-lab', text: EQ_LABEL[i] })]);
    });
    r.presetBtns = Object.keys(PRESETS).map(name => {
      const b = small(name, () => { preset = name; eq = PRESETS[name].slice(); applyEq(); render(); });
      b.dataset.name = name;
      return b;
    });
    r.eq = el('div', { class: 'qq-eq' }, [el('div', { class: 'qq-eq-bands' }, sliders), el('div', { class: 'qq-eq-presets' }, r.presetBtns)]);
    // 播放列表
    r.list = el('div', { class: 'qq-list' });
    let lastTap = -1, lastT = 0;
    r.rows = TRACKS.map((t, i) => {
      const row = el('div', { class: 'qq-li' }, [el('span', { class: 'qq-li-n', text: (i + 1) + '.' }), el('span', { class: 'qq-li-name', text: t.name.replace(/\.mp3$/, '') }), el('span', { class: 'qq-li-t', text: clock(t.dur) })]);
      row.addEventListener('click', () => { const now = Date.now(); if (lastTap === i && now - lastT < OS.dblMs()) { lastTap = -1; playTrack(i); } else { lastTap = i; lastT = now; } });
      OS.ui.onContext(row, () => [
        { label: '播放', bold: true, action: () => playTrack(i) },
        { label: '文件属性', action: say('文件属性', 'info', L.props(t)) },
        '-',
        { label: '从列表中删除', action: say(NAME, 'info', L.noDelete) }
      ]);
      r.list.appendChild(row);
      return row;
    });
    OS.ui.scrollable(r.list);
    // 歌词秀
    r.lrc = el('div', { class: 'qq-lrc' });
    OS.ui.onContext(r.lrc, () => lrcMenu());
    const stars = ['s1', 's2', 's3'].map(c => el('i', { class: 'qq-star ' + c, text: '✦' }));
    r.box = el('div', { class: 'qq' }, stars.concat([r.main, r.mini, r.eq, r.list, r.lrc]));
    OS.ui.onContext(r.main, () => menuItems(false));
    return r;
  }
  // 按住拖：p = 横向位置 0~1；vertical 时第二个参数是纵向位置 0~1
  function drag(node, fn, vertical) {
    node.addEventListener('pointerdown', e => {
      e.stopPropagation();
      e.preventDefault();
      const at = ev => {
        const r = OS.stage.rectOf(node), q = OS.stage.toLocal(ev.clientX, ev.clientY);
        const px = OS.clamp((q.x - r.left) / r.width, 0, 1), py = OS.clamp((q.y - r.top) / r.height, 0, 1);
        fn(px, py);
      };
      at(e);
      try { node.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const move = ev => at(ev);
      const up = () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }
  // 窗口高度跟着收起 / 展开的几块变
  function refit() {
    if (!win || win.isClosed) return;
    const W = OS.stage.work;
    win.el.style.height = 'auto';
    const natural = win.el.offsetHeight;
    win.h = Math.min(natural, W.h - 2);
    win.hStyle = natural > win.h ? win.h + 'px' : 'auto';
    win.el.style.height = win.hStyle;
    if (win.y + win.h > W.y + W.h) { win.y = Math.max(W.y, W.y + W.h - win.h); win.el.style.top = win.y + 'px'; }
  }
  function setMini(on) {
    mini = on;
    win.opts.topmost = on;   // 迷你模式永远在最上面
    render();
    refit();
    OS.wm.focus(win);
  }
  function applySkin() {
    if (!ui) return;
    if (!SKINS.some(([k]) => k === skin)) skin = 'silver';   // 旧存档里的皮肤名
    SKINS.forEach(([k]) => { ui.box.classList.toggle('skin-' + k, k === skin); if (win) win.el.classList.toggle('skin-' + k, k === skin); });
    if (win) win.setTitle(skin === 'pink' ? NAME_MARS : NAME);
  }
  function skinItems() {
    return SKINS.map(([k, label]) => ({ label, checked: skin === k, action: () => { skin = k; OS.save.set('qqSkin', k); applySkin(); } }));
  }
  function lrcMenu() {
    const items = [{ label: '搜索歌词', action: searchLrc }];
    if (TRACKS[cur].mars) items.push({ label: earth ? L.toMars : L.toEarth, action: () => { earth = !earth; render(); } });
    items.push('-', { label: '桌面歌词', checked: desk, action: () => setDesk(!desk) });
    return items;
  }
  function searchLrc() {
    OS.ui.notify({ title: NAME, text: L.serverTry, icon: 'info', replace: true, timeout: 2500 });
    setTimeout(() => OS.ui.dialog({ title: NAME, icon: 'error', text: L.serverFail }), 2600);
  }
  function menuItems(fromTray) {
    const items = [
      { label: playing ? '暂停' : '播放', bold: true, action: toggle },
      { label: '停止', action: stop },
      { label: '上一首', action: () => playTrack(step(-1)) },
      { label: '下一首', action: () => playTrack(step(1)) },
      '-',
      hidden ? { label: '显示主界面', action: showMain } : { label: '隐藏主界面', action: hideMain },
      '-'
    ];
    if (!fromTray) items.push(
      { label: '播放模式', sub: MODES.map((m, i) => ({ label: m, checked: mode === i, action: () => { mode = i; render(); } })) },
      { label: '换肤', sub: skinItems },
      { label: '均衡器', checked: showEq, action: () => { showEq = !showEq; render(); refit(); } },
      { label: '歌词秀', checked: showLrc, action: () => { showLrc = !showLrc; render(); refit(); } },
      { label: '桌面歌词', checked: desk, action: () => setDesk(!desk) },
      desk && deskLocked ? { label: '解锁桌面歌词', action: () => { deskLocked = false; if (deskEl) deskEl.classList.remove('locked'); } } : null,
      { label: '迷你模式', checked: mini, action: () => setMini(!mini) },
      '-');
    items.push({ label: L.autoplay, checked: !!OS.save.get(AUTO_KEY, false), action: () => OS.save.set(AUTO_KEY, !OS.save.get(AUTO_KEY, false)) });
    items.push('-', fromTray ? { label: '退出', action: () => win && win.close() } : { label: '关于千千不听', action: say('关于千千不听', 'info', L.about) });
    return items;
  }

  /* ================= 隐藏主界面：窗口和任务栏按钮都不见，歌接着放；点右下角托盘的耳机叫回来 ================= */
  function hideMain() {
    if (!win || win.isClosed) return;
    hidden = true;
    OS.wm.minimize(win);
    OS.emit('win:hide', win);
  }
  function showMain() {
    if (!win || win.isClosed) return;
    if (hidden) { hidden = false; OS.emit('win:show', win); }
    OS.wm.focus(win);
  }

  /* ================= 桌面歌词：屏幕下方飘一行大字，能拖、能锁 ================= */
  function setDesk(on) {
    desk = on;
    if (!on) { if (deskEl) { deskEl.remove(); deskEl = null; } render(); return; }
    if (!deskEl) {
      deskEl = el('div', { class: 'qq-desk' });
      document.getElementById('balloons').appendChild(deskEl);
      const st = OS.stage;
      deskEl.style.left = '20px';
      deskEl.style.top = (st.H - st.TASKBAR_H - 44) + 'px';
      deskEl.addEventListener('pointerdown', e => {
        if (deskLocked || (e.button != null && e.button !== 0)) return;
        e.preventDefault();
        const s = OS.stage.toLocal(e.clientX, e.clientY), ox = parseFloat(deskEl.style.left), oy = parseFloat(deskEl.style.top);
        try { deskEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        const move = ev => { if (OS.ui.longPressed(ev.pointerId)) return; const p = OS.stage.toLocal(ev.clientX, ev.clientY); deskEl.style.left = (ox + p.x - s.x) + 'px'; deskEl.style.top = (oy + p.y - s.y) + 'px'; };
        const up = () => { deskEl.removeEventListener('pointermove', move); deskEl.removeEventListener('pointerup', up); };
        deskEl.addEventListener('pointermove', move);
        deskEl.addEventListener('pointerup', up);
      });
      OS.ui.onContext(deskEl, () => [
        { label: deskLocked ? '解锁桌面歌词' : '锁定桌面歌词', action: () => { deskLocked = !deskLocked; deskEl.classList.toggle('locked', deskLocked); } },
        { label: '关闭桌面歌词', action: () => setDesk(false) }
      ]);
    }
    render();
  }

  /* ================= 每 0.09 秒刷新一次：时间、进度、频谱、歌词、低音、敲门、蓝屏 ================= */
  function tick() {
    if (!ui) return;
    const t = audio ? audio.currentTime : 0, d = (audio && audio.duration) || TRACKS[cur].dur || 0;
    ui.time.textContent = clock(t) + ' / ' + clock(d);
    ui.fill.style.width = (d ? t / d * 100 : 0) + '%';
    // 频谱
    let low = 0;
    if (analyser && playing) {
      analyser.getByteFrequencyData(freq);
      // 14 根柱子从低音排到高音，越往右管的频段越宽（跟耳朵听的差不多）
      ui.bars.forEach((b, i) => {
        const a = Math.round(Math.pow(BINS, i / 14)), z = Math.max(a + 1, Math.round(Math.pow(BINS, (i + 1) / 14)));
        let m = 0;
        for (let k = a; k < z && k < freq.length; k++) m = Math.max(m, freq[k]);
        b.style.height = Math.max(4, m / 255 * 100) + '%';
      });
      low = (freq[0] + freq[1] + freq[2]) / 3;   // 最低的几个频段 = 鼓点
    } else ui.bars.forEach(b => { b.style.height = playing ? (10 + Math.random() * 70) + '%' : '4%'; });
    // 歌词
    const v = lrcView(t);
    drawLrc(ui.lrc, v);
    if (deskEl) drawDesk(v);
    if (!playing) return;
    const tr = TRACKS[cur], now = Date.now();
    // 重低音：鼓点一响，窗口抖一下
    if (preset === BASS && low > 150 && low - lastLow > 18 && now - lastThump > 220) {
      lastThump = now;
      win.el.classList.remove('qq-thump'); void win.el.offsetWidth; win.el.classList.add('qq-thump');
    }
    lastLow = low;
    // 音量大放 DJ：楼下（新建文件夹(2)）来敲门，物业记一笔
    if (tr.dj && vol >= KNOCK_VOL) {
      if (!loudSince) loudSince = now;
      if (now - loudSince > KNOCK_SEC * 1000 && now - knockAt > KNOCK_GAP) {
        knockAt = now;
        OS.save.set('qqNoise', OS.save.get('qqNoise', 0) + 1);
        OS.sound.play('thud');
        setTimeout(() => OS.sound.play('thud'), 180);
        OS.desktop.iconSay('folder2', L.knock, 3500);
      }
    } else loudSince = 0;
    // 蓝屏：音量最大 + 重低音 + DJ 劲爆版，放满 30 秒
    if (tr.dj && vol >= 100 && preset === BASS) {
      if (!bassSince) bassSince = now;
      const sec = (now - bassSince) / 1000;
      quake(sec >= QUAKE_SEC);
      if (sec >= BSOD_SEC) { bassSince = 0; OS.ui.bsod(BSOD); }
    } else { bassSince = 0; quake(false); }
  }
  function drawLrc(node, v) {
    node.textContent = '';
    if (v.msg != null) { node.appendChild(el('div', { class: 'qq-lrc-msg' + (v.msg === L.searching ? ' searching' : ''), text: v.msg })); return; }
    node.appendChild(el('div', { class: 'qq-lrc-l dim', text: v.rows[0] || ' ' }));
    node.appendChild(el('div', { class: 'qq-lrc-l cur' }, [karaoke(v.rows[1] || ' ', v.p)]));
    node.appendChild(el('div', { class: 'qq-lrc-l dim', text: v.rows[2] || ' ' }));
  }
  function drawDesk(v) {
    deskEl.textContent = '';
    const text = v.msg != null ? (v.msg || TRACKS[cur].title) : (v.rows[1] || TRACKS[cur].title);
    deskEl.appendChild(karaoke(text, v.msg != null ? 0 : v.p));
  }
  // 桌面图标跟着震（蓝屏前 20 秒）
  function quake(on) { const n = document.getElementById('icons'); if (n) n.classList.toggle('qq-quake', !!on); }

  /* ================= 界面跟着状态变 ================= */
  function render() {
    if (!ui) return;
    const t = TRACKS[cur];
    const name = (cur + 1) + '. ' + t.name.replace(/\.mp3$/, '');
    if (ui.marq.dataset.n !== name) { ui.marq.dataset.n = name; ui.marq.textContent = name; }
    ui.miniName.textContent = t.title;
    ui.mode.textContent = MODES[mode] + (preset !== '默认' ? '　' + preset : '');
    ui.play.classList.toggle('on', playing);
    ui.miniPlay.classList.toggle('on', playing);
    ui.volFill.style.width = vol + '%';
    ui.rows.forEach((r, i) => r.classList.toggle('cur', i === cur));
    ui.eqKnobs.forEach((k, i) => { k.style.top = (50 - eq[i] / 24 * 100) + '%'; });
    ui.presetBtns.forEach(b => b.classList.toggle('on', b.dataset.name === preset));
    ui.box.classList.toggle('mini', mini);
    ui.eq.style.display = showEq && !mini ? '' : 'none';
    ui.list.style.display = showList && !mini ? '' : 'none';
    ui.lrc.style.display = showLrc && !mini ? '' : 'none';
    ui.box.classList.toggle('playing', playing);
  }
  function trayRefresh() { if (tray) tray.classList.toggle('on', playing); }

  /* ================= 开机自动播放、重启 ================= */
  OS.on('desktop:ready', () => {
    setTimeout(() => {
      if (OS.boot.state !== 'desktop' || !OS.save.get(AUTO_KEY, false) || (win && !win.isClosed)) return;
      open();
      OS.wm.minimize(win);
      playTrack(BGM);
    }, 3200);
  });
  OS.on('desktop:reset', () => { commented.clear(); knockAt = 0; mini = false; desk = false; deskLocked = false; });

  OS.qianqian = {
    uninstall: say('卸载 千千不听', 'warn', L.uninstall),
    // 我的文档 ▸ 我的音乐 里双击：打开千千不听放那一首
    play: i => { if (!TRACKS[i]) return; open(); showMain(); playTrack(i); },
    // 任务管理器：千千不听.exe 在不在、在不在放歌、结束它、改优先级、现在鼓点多响（0~1，CPU 跟着跳）
    running: () => !!(win && !win.isClosed),
    playing: () => playing,
    kill: () => { if (win && !win.isClosed) win.close(); },
    setRate: r => { rate = r || 1; applyRate(); },
    level: () => {
      if (!playing || !analyser || !freq) return 0;
      analyser.getByteFrequencyData(freq);
      let s = 0; for (let i = 0; i < 24; i++) s += freq[i];
      return s / 24 / 255;
    }
  };
})();

/* 一键还原小精灵（开始 ▸ 所有程序 ▸ 启动；开始菜单右栏最下面）
   作用就一个：把这个游戏的存档全部清空，回到第一次打开的样子。
   - 主窗口仿那几年的“一键还原 / 一键 GHOST”：左边大图标，右边几个单选项，下面［还原］［取消］。
     窗口里用大白话写清楚：会清空什么、撤销不了。点还原还要再确认一次。
   - 确认后：整屏变成那几年 GHOST 还原的蓝色画面（进度条、统计、详细信息、底下状态栏；名字和小精灵是自己的），
     走完清空存档，重新开机（像第一次打开那样）。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.restore;

  const NAME = '一键还原小精灵';
  const VER = NAME + ' 8.8';
  const SUB = '硬盘版　(C) 2003 无聊科技';
  const PICK = '请选择要做的事：';
  const OPTIONS = [
    { label: '一键还原（清空全部存档，从头开始）', btn: '还原' },
    { label: '一键备份', btn: '备份', joke: '本精灵只会还原，不会备份。\n就像人生一样。' },
    { label: '中文向导', btn: '向导', joke: '向导已下班，你呢？' }
  ];
  const WARN_TITLE = '注意';
  const WARN = '会清空这个游戏的全部存档（蓝屏图鉴、系统激活、战利品、回收站、桌面摆放……），回到第一次打开的样子，撤销不了。';
  const ASK = '最后确认一次：\n真的要清空全部存档、从头开始吗？\n清空后找不回来。';
  const ASK_YES = '确定还原', ASK_NO = '算了';
  // 还原画面（仿那几年 GHOST 还原时的蓝色界面）
  const G_TOP = NAME + ' 8.8　　Copyright (C) 2003 Wuliao Tech. All rights reserved.';
  const G_SRC = 'from Local file D:\\WINDOESNT\\SAVE.GHO';
  const G_DST = 'Local drive [1], 640 KB';
  const G_FILES = ['羊.dat', '木牌.dat', '蓝屏图鉴.dat', '回收站.dat', '战利品.dat', '激活码.key', '阳寿.dat', '桌面摆放.ini', '拨号猫.sys'];
  const G_STATUS = f => 'Restoring... 游戏存档 ' + f;
  const G_DONE = '还原完成！即将重新启动……';
  const RESTORE_MS = 5600;
  // 右边那只白线条的小精灵（自己画的，不是别家的吉祥物）：一团往上冒的烟变出来的
  const SPRITE_SVG = '<svg viewBox="0 0 64 74" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M32 10 C46 10 52 22 50 33 C48 44 41 47 39 53 C37 59 45 62 41 67 C37 72 26 68 31 61 C34 56 24 53 20 47 C14 39 12 27 17 18 C20 12 25 10 32 10Z"/>' +
    '<circle cx="26" cy="26" r="2.2" fill="#fff"/><circle cx="38" cy="26" r="2.2" fill="#fff"/><path d="M27 34 Q32 38 37 34"/>' +
    '<path d="M18 36 C12 34 9 30 10 26 M46 36 C52 33 55 28 53 24"/>' +
    '<path d="M50 4 L51.5 8.5 L56 10 L51.5 11.5 L50 16 L48.5 11.5 L44 10 L48.5 8.5Z" fill="#fff" stroke-width="1"/></svg>';

  app.open = function () {
    let pick = 0;
    const radios = OPTIONS.map((o, i) => {
      const dot = el('span', { class: 'gh-dot' + (i === 0 ? ' on' : '') });
      const row = el('div', { class: 'gh-opt' }, [dot, el('span', { text: o.label })]);
      row.addEventListener('click', () => {
        OS.sound.play('click');
        pick = i;
        radios.forEach((r, k) => r.querySelector('.gh-dot').classList.toggle('on', k === i));
        go.textContent = o.btn;
        warn.classList.toggle('dim', i !== 0);
      });
      return row;
    });
    const go = el('button', { class: 'xpbtn default', text: OPTIONS[0].btn });
    const cancel = el('button', { class: 'xpbtn', text: '取消' });
    const warn = el('div', { class: 'gh-warn' }, [OS.iconEl('warn', 'gh-warn-ico'), el('div', {}, [el('b', { text: WARN_TITLE }), el('div', { text: WARN })])]);
    const content = el('div', { class: 'gh' }, [
      el('div', { class: 'gh-top' }, [
        OS.iconEl('genie', 'gh-logo'),
        el('div', {}, [el('div', { class: 'gh-name', text: VER }), el('div', { class: 'gh-sub', text: SUB })])
      ]),
      el('div', { class: 'gh-box' }, [el('div', { class: 'gh-cap', text: PICK })].concat(radios)),
      warn,
      el('div', { class: 'gh-btns' }, [go, cancel])
    ]);
    const win = OS.wm.open({ title: NAME, icon: app.icon, width: 330, appId: app.id, content, maximizable: false });
    cancel.addEventListener('click', () => { OS.sound.play('click'); win.close(); });
    go.addEventListener('click', () => {
      OS.sound.play('click');
      const o = OPTIONS[pick];
      if (o.joke) { OS.ui.dialog({ title: NAME, icon: 'info', text: o.joke }); return; }
      OS.ui.dialog({ title: NAME, icon: 'warn', text: ASK, buttons: [ASK_YES, ASK_NO] }).then(v => {
        if (v !== ASK_YES) return;
        win.close();
        ghost();
      });
    });
    return win;
  };

  // 还原画面：进度条走完 → 清空存档 → 重新开机
  function ghost() {
    OS.ui.clearNotify();
    OS.ui.closeMenus();
    OS.taskbar.toggleMenu(false);
    const fill = el('div', { class: 'gs-fill' });
    const val = () => el('span', { class: 'gs-val', text: '0' });
    const v = { pct: val(), speed: val(), done: val(), left: val(), used: val(), rem: val() };
    const row = (label, node) => el('div', { class: 'gs-row' }, [el('span', { text: label }), node]);
    const cur = el('span', { text: G_FILES[0] });
    const status = el('div', { class: 'gs-status', text: G_STATUS(G_FILES[0]) });
    const sec = (title, kids, cls) => el('div', { class: 'gs-sec' + (cls ? ' ' + cls : '') }, [el('div', { class: 'gs-cap', text: title })].concat(kids));
    const scr = el('div', { class: 'ghost-scr' }, [
      el('div', { class: 'gs-top', text: G_TOP }),
      el('div', { class: 'gs-main' }, [
        sec('Progress Indicator', [
          el('div', { class: 'gs-bar' }, [fill]),
          el('div', { class: 'gs-scale' }, ['0%', '25%', '50%', '75%', '100%'].map(s => el('span', { text: s })))
        ]),
        sec('Statistics', [
          el('div', { class: 'gs-stats' }, [
            row('Percent complete', v.pct), row('Speed (KB/min)', v.speed), row('KB copied', v.done),
            row('KB remaining', v.left), row('Time elapsed', v.used), row('Time remaining', v.rem)
          ]),
          el('div', { class: 'gs-sprite', html: SPRITE_SVG })
        ], 'gs-two'),
        sec('Details', [
          el('div', { class: 'gs-det' }, [
            row('Connection type', el('span', { text: 'Local' })),
            row('Source Partition', el('span', { text: G_SRC })),
            row('Target Partition', el('span', { text: G_DST })),
            row('Current file', cur)
          ]),
          el('div', { class: 'gs-logo' }, [el('span', { class: 'gs-logo-mark', text: '无' }), el('span', { text: '无聊科技' })])
        ])
      ]),
      status
    ]);
    document.getElementById('overlay').appendChild(scr);
    const t0 = Date.now(), mmss = s => '0:' + String(Math.max(0, Math.round(s))).padStart(2, '0');
    const tick = setInterval(() => {
      const ms = Date.now() - t0, k = Math.min(1, ms / RESTORE_MS);
      const f = G_FILES[Math.min(G_FILES.length - 1, Math.floor(k * G_FILES.length))];
      fill.style.width = (k * 100) + '%';
      v.pct.textContent = Math.floor(k * 100);
      v.speed.textContent = 50 + Math.floor(Math.random() * 12);
      v.done.textContent = Math.round(k * 640);
      v.left.textContent = 640 - Math.round(k * 640);
      v.used.textContent = mmss(ms / 1000);
      v.rem.textContent = mmss((RESTORE_MS - ms) / 1000);
      cur.textContent = f;
      status.textContent = G_STATUS(f);
      OS.sound.play('click');   // 硬盘“咔咔”响
      if (k < 1) return;
      clearInterval(tick);
      status.textContent = G_DONE;
      OS.sound.play('ding');
      setTimeout(() => {
        OS.save.clearAll();
        location.reload();
      }, 1400);
    }, 180);
  }
})();

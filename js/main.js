/* 启动：把各层摆好，然后开机 */
(function () {
  'use strict';
  const st = document.getElementById('stage');
  const layer = id => OS.el('div', { id, class: 'layer' });

  OS.stage.layout(true);
  if (OS.stage.touch) st.classList.add('touch');

  OS.desktop.init(st);                       // 壁纸 + 图标
  const wins = layer('windows'); st.appendChild(wins); OS.wm.init(wins);
  OS.ticker.init(st);                        // 顶部新闻条
  OS.taskbar.init(st);                       // 任务栏 + 开始菜单
  st.appendChild(layer('balloons'));         // 右下角气泡
  const menus = layer('menus'); st.appendChild(menus); OS.ui.initMenus(menus); // 右键菜单
  st.appendChild(layer('overlay'));          // 蓝屏、关机对话框
  const screens = layer('screens'); st.appendChild(screens); OS.boot.init(screens);
  st.appendChild(layer('glass'));            // 显像管玻璃的一点点暗角
  OS.ui.initLongPress();                     // 手机长按 = 右键
  OS.filler.init();                          // 画面外的滚动装饰

  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault()); // iOS 双指缩放

  // 调试面板：网址后面加 ?dev 才出现，玩家看不到
  if (/[?&]dev\b/.test(location.search)) {
    const p = OS.el('div', { id: 'devpanel' });
    const b = (t, fn) => { const x = OS.el('button', { text: t }); x.addEventListener('click', fn); p.appendChild(x); };
    b('报错框', () => OS.ui.dialog({ title: '错误', icon: 'error', text: '这是一个测试报错。\n什么都没坏，放心。', buttons: ['确定', '取消'] }));
    b('气泡', () => OS.ui.notify({ title: '测试气泡', text: '右下角弹出来的就是我。', icon: 'info' }));
    b('插播快讯', () => OS.ticker.interrupt('【插播】这是一条插播测试新闻。'));
    b('蓝屏', () => OS.ui.bsod({ id: 'test', name: 'TEST_BLUE_SCREEN_OF_NOTHING', text: '这是测试蓝屏。' }));
    b('直接进桌面', () => OS.boot.desktop());
    b('清存档', () => { OS.save.clearAll(); location.reload(); });
    st.appendChild(p);
  }

  OS.boot.start();
})();

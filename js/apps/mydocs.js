/* 我的文档（桌面 + 开始菜单右栏）：C:\Documents and Settings\你\我的文档
   - 日记.txt：XP 记事本真有的“.LOG”，每打开一次最后自动记一行时间（以后主线可以往里加新的一篇）
   - 检讨书.doc、作文：我的理想.doc：写字板打开
   - 我的图片：示例图片 4 张（以后换 Codex 画的）、每打一张欠条多一张 欠条.jpg、暴富秘籍解压过就有 想得美.jpg
   - 我的音乐：千千不听里的那几首，双击就放；我的视频：空的；新建文件夹：空的
   - 记事本可以存进来（羊吃不到），联通乱码在这终于看得到
   - 这里能新建、复制、删除（直接扔外太空）；新建文件夹一层套一层，路径超过 260 → 蓝屏 PATH_TOO_LONG（explorer.js） */
(function () {
  'use strict';
  const FS = OS.fs, EX = OS.explorer;
  const app = OS.apps.byId.mydocs;
  const D = FS.MYDOCS, PICS = FS.PICS;

  app.open = () => EX.open(D, { appId: app.id });
  FS.add(D, { kind: 'folder', label: '我的文档', icon: 'mydocs', writable: true, noDelete: '删不掉：删了我的文档，你就没有文档了。', noRename: '重命名失败：它就叫我的文档。' });
  ['我的图片', '我的音乐', '我的视频', '新建文件夹'].forEach((n, i) => FS.add(D + '\\' + n, { kind: 'folder', order: i < 3 ? i - 3 : 0, noDelete: i < 3 ? '删不掉：这是系统给你建的。' : null }));
  FS.add(D + '\\desktop.ini', { hidden: true, roMsg: '保存失败：别改了，它自己都不知道自己长什么样。', text: '[.ShellClassInfo]\n这个文件管着这个文件夹长什么样。\n别看了，它也不知道自己长什么样。', noDelete: '删不掉：它管着这个文件夹长什么样。' });

  /* ---------- 日记（.LOG） ---------- */
  FS.add(D + '\\日记.txt', { log: true, noDelete: '删不掉：日记删了，回忆就没了。', noRename: '重命名失败：日记就叫日记。',
    text: '.LOG\n\n今天新装了 Windoesn\'t XP，开机就说我盗版。我又没说它是正版。\n\n同桌借了我的数学作业，还回来的时候多了一块油。\n\n楼下小卖部的雪糕涨价了，我决定少吃一块，攒钱买光盘。\n\n买到了幻觉游戏 V3.0，老板说是正版，我信了。\n\n日记写到这里，我妈喊我吃饭了。\n' });

  /* ---------- 两个 .doc（写字板） ---------- */
  FS.add(D + '\\检讨书.doc', { noDelete: '删不掉：老师说要留底。',
    text: '检讨书\n\n尊敬的老师：\n今天上课我在电脑课上偷偷玩扫雪，被您当场抓住。\n我深刻认识到，扫雪不应该在上课时间扫，应该在下课时间扫。\n今后我一定改正，绝不再被您抓住。\n\n此致　敬礼\n检讨人：你' });
  FS.add(D + '\\作文：我的理想.doc', { redLast: true, noDelete: '删不掉：这是你的理想。',
    text: '我的理想\n\n我的理想是当一名程序员，因为程序员每天都可以光明正大地玩电脑。\n妈妈说程序员会掉头发。我说没关系，我先长一点。\n\n老师批语：字太丑，电脑打的也丑。' });

  /* ---------- 我的图片 ---------- */
  FS.add(PICS + '\\示例图片', { kind: 'folder', noDelete: '删不掉：这是系统送的。' });
  // 四张示例图片：先用代码画，Codex 画好了换成 assets/pics/ 下的图
  const scene = (top, bottom, extra) => (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, top); sky.addColorStop(1, bottom);
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    extra(g, w, h);
  };
  const SAMPLES = {
    '蓝色的山.jpg': scene('#7fb2ff', '#dbe9ff', (g, w, h) => { g.fillStyle = '#5a8a3c'; g.beginPath(); g.moveTo(0, h * .7); g.lineTo(w * .3, h * .35); g.lineTo(w * .55, h * .62); g.lineTo(w * .8, h * .3); g.lineTo(w, h * .6); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.fillStyle = '#fff'; g.font = '11px SimSun'; g.fillText('其实是绿的', 8, h - 8); }),
    '日落.jpg': scene('#ff8a3d', '#ffd36b', (g, w, h) => { g.fillStyle = '#ffef9a'; g.beginPath(); g.arc(w * .5, h * .7, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3b2a4a'; g.fillRect(0, h * .72, w, h * .28); }),
    '冬天.jpg': scene('#cfe3ff', '#ffffff', (g, w, h) => { g.fillStyle = '#e9f2ff'; g.fillRect(0, h * .65, w, h); g.fillStyle = '#2d5a2d'; [[.25, .4], [.6, .3], [.8, .45]].forEach(([x, y]) => { g.beginPath(); g.moveTo(w * x, h * y); g.lineTo(w * x - 16, h * .68); g.lineTo(w * x + 16, h * .68); g.fill(); }); }),
    '睡莲.jpg': scene('#1f5f7a', '#6ec0d6', (g, w, h) => { g.fillStyle = '#3c8a3c'; [[.3, .6], [.65, .7], [.5, .45]].forEach(([x, y]) => { g.beginPath(); g.ellipse(w * x, h * y, 22, 9, 0, 0, Math.PI * 2); g.fill(); }); g.fillStyle = '#ff9ad5'; g.beginPath(); g.arc(w * .5, h * .42, 7, 0, Math.PI * 2); g.fill(); })
  };
  Object.keys(SAMPLES).forEach(n => FS.add(PICS + '\\示例图片\\' + n, { kind: 'jpg', draw: SAMPLES[n], noDelete: '删不掉：这是系统送的。' }));
  // 暴富秘籍解压过：多一张“想得美”
  FS.add(PICS + '\\想得美.jpg', { kind: 'jpg', when: () => (OS.save.get('rich', {}).done || 0) > 0, open: () => OS.richViewer && OS.richViewer('想得美.jpg'), noDelete: '删不掉：这是你暴富的唯一证据。' });
  // 每打一张欠条，我的图片里多一张 欠条.jpg（算玩家自己的，占 80 个名额；满了就只打印不存）
  const print = OS.printSlip;
  if (print) OS.printSlip = function (info, done) {
    print(info, done);
    const slip = Object.assign({}, info, { post: false, date: OS.slipDate ? OS.slipDate() : '' });
    if (!FS.createFile(PICS, '欠条.jpg', 'jpg', { slip }, true)) setTimeout(FS.capNotify, 1300);
  };

  /* ---------- 我的音乐：千千不听那几首，双击就放 ---------- */
  const SONGS = ['宝贝我爱你爱你爱你（DJ 劲爆版）.mp3', '下雨天记得收衣服（伴奏）.mp3', '不知道谁唱的.mp3', '莪們哋噯.mp3', '桌面背景音乐.mp3', '新建 MP3.mp3'];
  SONGS.forEach((n, i) => FS.add(D + '\\我的音乐\\' + n, { kind: 'mp3', track: i, size: i === 5 ? '0 KB' : '560 KB', noDelete: '删不掉：千千不听舍不得。' }));
})();

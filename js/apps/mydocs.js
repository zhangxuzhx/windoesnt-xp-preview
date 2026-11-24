/* 我的文档（桌面 + 开始菜单右栏）：C:\Documents and Settings\你\我的文档
   - 日记.txt：XP 记事本真有的“.LOG”，每打开一次最后自动记一行时间（以后主线可以往里加新的一篇）
   - 检讨书.doc、作文：我的理想.doc：写字板打开
   - 我的图片：示例图片 4 张（Codex 画的）、每打一张欠条多一张 欠条.jpg、暴富秘籍解压过就有 想得美.jpg
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
  const P = (text, o) => Object.assign({ text, font: '宋体', size: 10 }, o || {});
  FS.add(D + '\\检讨书.doc', { noDelete: '删不掉：老师说要留底。',
    doc: [P('检讨书', { align: 'center', b: true, size: 16 }), P(''), P('尊敬的老师：'), P('今天上课我在电脑课上偷偷玩排雷，被您当场抓住。', { indent: 2 }),
      P('我深刻认识到，雷不应该在上课时间排，应该在下课时间排。', { indent: 2 }), P('今后我一定改正，绝不再被您抓住。', { indent: 2 }), P(''),
      P('此致', { indent: 2 }), P('敬礼'), P('检讨人：你', { align: 'right' })],
    text: '检讨书\n\n尊敬的老师：\n今天上课我在电脑课上偷偷玩排雷，被您当场抓住。\n我深刻认识到，雷不应该在上课时间排，应该在下课时间排。\n今后我一定改正，绝不再被您抓住。\n\n此致　敬礼\n检讨人：你' });
  FS.add(D + '\\作文：我的理想.doc', { noDelete: '删不掉：这是你的理想。',
    doc: [P('我的理想', { align: 'center', b: true, size: 16 }), P(''), P('我的理想是当一名程序员，因为程序员每天都可以光明正大地玩电脑。', { indent: 2 }),
      P('妈妈说程序员会掉头发。我说没关系，我先长一点。', { indent: 2 }), P(''), P('老师批语：字太丑，电脑打的也丑。', { color: '#ff0000', font: '楷体', size: 12 })],
    text: '我的理想\n\n我的理想是当一名程序员，因为程序员每天都可以光明正大地玩电脑。\n妈妈说程序员会掉头发。我说没关系，我先长一点。\n\n老师批语：字太丑，电脑打的也丑。' });

  /* ---------- 我的图片 ---------- */
  FS.add(PICS + '\\示例图片', { kind: 'folder', noDelete: '删不掉：这是系统送的。' });
  // 四张示例图片：Codex 画的 assets/pics/*.webp（480×320）；第一次打开才下载，没下完先铺一层底色
  const pic = (file, base) => {
    let img = null;
    return (g, w, h) => {
      if (!img) { img = new Image(); img.src = 'assets/pics/' + file; }
      const put = () => g.drawImage(img, 0, 0, w, h);
      if (img.complete && img.naturalWidth) { put(); return; }
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      img.addEventListener('load', put, { once: true });
    };
  };
  const SRC = { '蓝色的山.jpg': 'blue-hills.webp', '日落.jpg': 'sunset.webp', '冬天.jpg': 'winter.webp', '睡莲.jpg': 'lilies.webp' };   // ABCSee 设为墙纸直接用原图
  const SAMPLES = {
    '蓝色的山.jpg': pic('blue-hills.webp', '#9fd0ff'),   // 笑点：叫蓝色的山，画的是绿的
    '日落.jpg': pic('sunset.webp', '#ff9a5a'),
    '冬天.jpg': pic('winter.webp', '#e6f0ff'),
    '睡莲.jpg': pic('lilies.webp', '#5fb3b0')
  };
  Object.keys(SAMPLES).forEach(n => FS.add(PICS + '\\示例图片\\' + n, { kind: 'jpg', draw: SAMPLES[n], src: 'assets/pics/' + SRC[n], noDelete: '删不掉：这是系统送的。' }));
  // 暴富秘籍解压过：多一张“想得美”
  FS.add(PICS + '\\想得美.jpg', { kind: 'jpg', when: () => (OS.save.get('rich', {}).done || 0) > 0, canvas: () => OS.richPic(), noDelete: '删不掉：这是你暴富的唯一证据。' });
  // 每打一张欠条，我的图片里多一张 欠条.jpg（算玩家自己的，占 200 个名额；满了就只打印不存）
  const print = OS.printSlip;
  if (print) OS.printSlip = function (info, done) {
    print(info, done);
    const slip = Object.assign({}, info, { post: false, date: OS.slipDate ? OS.slipDate() : '' });
    if (!FS.createFile(PICS, '欠条.jpg', 'jpg', { slip }, true)) setTimeout(FS.capNotify, 1300);
  };

  /* ---------- 我的音乐：千千不听那几首，双击就放 ---------- */
  const SONGS = ['宝贝我爱你爱你爱你（DJ 劲爆版）.mp3', '下雨天记得收衣服（伴奏）.mp3', '不知道谁唱的.mp3', '莪們哋噯.mp3', '桌面背景音乐.mp3'];
  SONGS.forEach((n, i) => FS.add(D + '\\我的音乐\\' + n, { kind: 'mp3', track: i, size: '560 KB', noDelete: '删不掉：千千不听舍不得。' }));
})();

/* 图标：全部自己画的 SVG（不用微软/腾讯等任何人的图）
   用法：OS.icon('名字') 得到 SVG 文本；OS.iconEl('名字', '额外class') 得到元素 */
(function () {
  'use strict';
  const BLUE_BALL = '<defs><radialGradient id="bb_U" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#8cc4ff"/><stop offset="1" stop-color="#0a4fbf"/></radialGradient></defs><circle cx="24" cy="24" r="20" fill="url(#bb_U)" stroke="#06378a" stroke-width="1.5"/>';

  const RAW = {
    /* 系统标志：一扇被木板钉死的窗户 —— Windoesn't */
    logo: '<svg viewBox="0 0 48 48"><defs><linearGradient id="gl_U" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8ecff"/><stop offset="1" stop-color="#3d8be8"/></linearGradient></defs>' +
      '<rect x="6" y="5" width="36" height="38" rx="3" fill="#f4f1e6" stroke="#6b5233" stroke-width="2"/>' +
      '<rect x="10" y="9" width="12.5" height="14" fill="url(#gl_U)"/><rect x="25.5" y="9" width="12.5" height="14" fill="url(#gl_U)"/>' +
      '<rect x="10" y="25" width="12.5" height="14" fill="url(#gl_U)"/><rect x="25.5" y="25" width="12.5" height="14" fill="url(#gl_U)"/>' +
      '<g transform="rotate(-18 24 24)"><rect x="1" y="16" width="46" height="7" rx="1" fill="#c98a45" stroke="#7a4a1c"/><circle cx="6" cy="19.5" r="1.2" fill="#444"/><circle cx="42" cy="19.5" r="1.2" fill="#444"/></g>' +
      '<g transform="rotate(14 24 24)"><rect x="2" y="27" width="44" height="7" rx="1" fill="#dba05a" stroke="#7a4a1c"/><circle cx="7" cy="30.5" r="1.2" fill="#444"/><circle cx="41" cy="30.5" r="1.2" fill="#444"/></g></svg>',

    computer: '<svg viewBox="0 0 48 48"><defs><linearGradient id="cs_U" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fb3ff"/><stop offset="1" stop-color="#0b4fc7"/></linearGradient></defs>' +
      '<rect x="3" y="6" width="32" height="25" rx="2" fill="#e8e4d6" stroke="#6d6a60"/><rect x="6" y="9" width="26" height="18" fill="url(#cs_U)"/>' +
      '<path d="M8 23 Q17 16 30 21 L30 27 L8 27Z" fill="#5fb83a" opacity=".9"/>' +
      '<rect x="14" y="31" width="10" height="4" fill="#cfcabb"/><rect x="9" y="35" width="20" height="3" rx="1" fill="#d9d5c7" stroke="#6d6a60" stroke-width=".8"/>' +
      '<rect x="34" y="15" width="11" height="27" rx="1.5" fill="#efebde" stroke="#6d6a60"/><rect x="36" y="18" width="7" height="2" fill="#9a968a"/><rect x="36" y="22" width="7" height="2" fill="#9a968a"/><circle cx="39.5" cy="37" r="1.4" fill="#3c3"/>' +
      '<rect x="5" y="40" width="24" height="5" rx="1" fill="#e2dece" stroke="#6d6a60" stroke-width=".8"/></svg>',

    recycle: '<svg viewBox="0 0 48 48"><defs><linearGradient id="rb_U" x1="0" x2="1"><stop offset="0" stop-color="#c3daf0"/><stop offset=".5" stop-color="#f7fbff"/><stop offset="1" stop-color="#9dbcdc"/></linearGradient></defs>' +
      '<path d="M11 14 L37 14 L34 44 L14 44Z" fill="url(#rb_U)" stroke="#5b7a99" stroke-width="1.2"/>' +
      '<path d="M17 18 L18 40 M24 18 L24 40 M31 18 L30 40" stroke="#8fb0cf" stroke-width="1.6"/>' +
      '<rect x="9" y="9" width="30" height="5" rx="2" fill="#dbe9f7" stroke="#5b7a99" stroke-width="1.2"/><rect x="20" y="6" width="8" height="3" rx="1" fill="#dbe9f7" stroke="#5b7a99"/></svg>',

    /* 回收站（有东西）：桶里冒出几张揉皱的纸 */
    recycleFull: '<svg viewBox="0 0 48 48"><defs><linearGradient id="rf_U" x1="0" x2="1"><stop offset="0" stop-color="#c3daf0"/><stop offset=".5" stop-color="#f7fbff"/><stop offset="1" stop-color="#9dbcdc"/></linearGradient></defs>' +
      '<path d="M13 15 L20 4 L27 12Z" fill="#fff" stroke="#888" stroke-width="1"/><path d="M22 13 L33 3 L36 14Z" fill="#fffbe0" stroke="#999" stroke-width="1"/><path d="M15 14 C17 8 25 9 26 14Z" fill="#e8eef5" stroke="#8a9aaa"/>' +
      '<path d="M11 14 L37 14 L34 44 L14 44Z" fill="url(#rf_U)" stroke="#5b7a99" stroke-width="1.2"/>' +
      '<path d="M17 18 L18 40 M24 18 L24 40 M31 18 L30 40" stroke="#8fb0cf" stroke-width="1.6"/>' +
      '<rect x="9" y="12" width="30" height="4" rx="2" fill="#dbe9f7" stroke="#5b7a99" stroke-width="1.2"/></svg>',

    detector: '<svg viewBox="0 0 48 48"><defs><radialGradient id="dp_U" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9dffa0"/><stop offset="1" stop-color="#1f9a2e"/></radialGradient></defs>' +
      '<circle cx="20" cy="20" r="15" fill="url(#dp_U)" stroke="#156b20" stroke-width="1.5"/>' +
      '<path d="M14.5 14.5 A8 8 0 1 0 25.5 14.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="10" x2="20" y2="20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="39" y1="39" x2="45" y2="45" stroke="#7a4a1c" stroke-width="4.5" stroke-linecap="round"/>' +
      '<circle cx="33" cy="33" r="8" fill="#e8f6ff" fill-opacity=".85" stroke="#444" stroke-width="2.5"/>' +
      '<path d="M30.5 30.5 C30.5 27.5 35.5 27.5 35.5 30.5 C35.5 32.5 33 32.5 33 35" fill="none" stroke="#d22" stroke-width="1.8" stroke-linecap="round"/><circle cx="33" cy="37.5" r="1" fill="#d22"/></svg>',

    hourglass: '<svg viewBox="0 0 48 48"><defs><linearGradient id="hg_U" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#c98a00"/></linearGradient></defs>' +
      '<path d="M13 9 H35 C35 18 27 21 25 24 C27 27 35 30 35 39 H13 C13 30 21 27 23 24 C21 21 13 18 13 9Z" fill="#e9f6ff" fill-opacity=".9" stroke="#6b8aa6" stroke-width="1.3"/>' +
      '<path d="M17 13 H31 C30 18 26 20 24 22 C22 20 18 18 17 13Z" fill="url(#hg_U)"/><path d="M24 24 L24 33" stroke="#e0a800" stroke-width="1.2"/>' +
      '<path d="M16 38 C18 33 30 33 32 38Z" fill="url(#hg_U)"/>' +
      '<rect x="9" y="4" width="30" height="5" rx="2" fill="#8a5a2b"/><rect x="9" y="39" width="30" height="5" rx="2" fill="#8a5a2b"/></svg>',

    rar: '<svg viewBox="0 0 48 48"><path d="M9 3 H30 L39 12 V45 H9Z" fill="#fff" stroke="#7d7d7d" stroke-width="1.2"/><path d="M30 3 V12 H39" fill="#e6e6e6" stroke="#7d7d7d" stroke-width="1.2"/>' +
      '<g fill="#666"><rect x="20" y="5" width="4" height="2"/><rect x="24" y="8" width="4" height="2"/><rect x="20" y="11" width="4" height="2"/><rect x="24" y="14" width="4" height="2"/><rect x="20" y="17" width="4" height="2"/></g>' +
      '<rect x="20" y="20" width="8" height="7" rx="1" fill="#999" stroke="#555"/>' +
      '<circle cx="31" cy="35" r="10" fill="#ffd23f" stroke="#b8860b" stroke-width="1.5"/><circle cx="31" cy="35" r="7" fill="none" stroke="#e0a800"/>' +
      '<path d="M27.5 30 L31 34 L34.5 30 M31 34 V41 M28 35.5 H34 M28 38 H34" fill="none" stroke="#9a6a00" stroke-width="1.6" stroke-linecap="round"/></svg>',

    pulse: '<svg viewBox="0 0 48 48"><defs><radialGradient id="hp_U" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ff8a8a"/><stop offset="1" stop-color="#c4121a"/></radialGradient></defs>' +
      '<path d="M24 42 C10 32 4 25 4 16 C4 9 9 5 15 5 C19 5 22 7 24 11 C26 7 29 5 33 5 C39 5 44 9 44 16 C44 25 38 32 24 42Z" fill="url(#hp_U)" stroke="#8c0d12" stroke-width="1.2"/>' +
      '<polyline points="6,22 15,22 18,15 22,30 26,12 29,25 32,22 42,22" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>',

    sheet: '<svg viewBox="0 0 48 48"><path d="M8 3 H31 L40 12 V45 H8Z" fill="#fff" stroke="#3b7d3b" stroke-width="1.2"/><path d="M31 3 V12 H40" fill="#d8ecd8" stroke="#3b7d3b" stroke-width="1.2"/>' +
      '<rect x="11" y="15" width="26" height="5" fill="#3f9b3f"/><path d="M11 25 H37 M11 30 H37 M11 35 H37 M19 20 V40 M28 20 V40" stroke="#9cc79c"/>' +
      '<rect x="11" y="15" width="26" height="25" fill="none" stroke="#3b7d3b"/>' +
      '<circle cx="35" cy="38" r="8" fill="#e2392b" stroke="#fff" stroke-width="1.5"/><path d="M31.8 33.5 L35 37 L38.2 33.5 M35 37 V43 M32.3 38.5 H37.7 M32.3 40.8 H37.7" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>',

    swatter: '<svg viewBox="0 0 48 48"><rect x="3" y="5" width="23" height="17" rx="1" fill="#fff" stroke="#888"/><rect x="3" y="5" width="23" height="4.5" fill="#d33"/>' +
      '<path d="M7 13 H22 M7 16.5 H18" stroke="#e66" stroke-width="2"/>' +
      '<g transform="rotate(35 30 26)"><rect x="20" y="5" width="20" height="22" rx="4" fill="#ffcf2e" stroke="#b98a00" stroke-width="1.2"/>' +
      '<path d="M24 5 V27 M28 5 V27 M32 5 V27 M36 5 V27 M20 10 H40 M20 15 H40 M20 20 H40" stroke="#d9a800"/>' +
      '<rect x="28.5" y="27" width="3" height="19" rx="1.5" fill="#2f7fd8" stroke="#1a5aa6"/></g></svg>',

    folder: '<svg viewBox="0 0 48 48"><defs><linearGradient id="fd_U" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#f2b92e"/></linearGradient></defs>' +
      '<path d="M4 10 H18 L22 14 H44 V40 H4Z" fill="#e2a72a" stroke="#a87414" stroke-width="1.2"/><rect x="8" y="12" width="30" height="20" fill="#fff" stroke="#bbb"/>' +
      '<path d="M3 18 H45 L42 41 H6Z" fill="url(#fd_U)" stroke="#a87414" stroke-width="1.2"/></svg>',

    /* 网上邻居里别人共享的文件夹：黄文件夹 + 底下一只托着的手（那几年“共享”就是这个样子） */
    share: '<svg viewBox="0 0 48 48"><defs><linearGradient id="sh_U" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#f2b92e"/></linearGradient></defs>' +
      '<path d="M8 6 H20 L24 10 H44 V32 H8Z" fill="#e2a72a" stroke="#a87414" stroke-width="1.2"/>' +
      '<path d="M7 13 H45 L42 33 H10Z" fill="url(#sh_U)" stroke="#a87414" stroke-width="1.2"/>' +
      '<path d="M3 36 C8 33 14 33 19 35 L27 35 C30 35 30 39 27 39 L20 39 L29 39 L39 34 C42 33 44 36 41 38 L30 45 L12 45 L3 43Z" fill="#ffd9b0" stroke="#9a6a3a" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M3 36 L3 45" stroke="#2d6fd6" stroke-width="4"/></svg>',

    /* 纸：文本文件（.txt）、文档（.doc）、视频（.avi / .rmvb） */
    txt: '<svg viewBox="0 0 48 48"><path d="M10 4 H32 L40 12 V44 H10Z" fill="#fff" stroke="#6b7a8f" stroke-width="1.4"/><path d="M32 4 V12 H40" fill="#e3e8ef" stroke="#6b7a8f" stroke-width="1.2"/>' +
      '<path d="M15 18 H35 M15 23 H35 M15 28 H35 M15 33 H29 M15 38 H33" stroke="#9aa6b8" stroke-width="1.6"/></svg>',
    doc: '<svg viewBox="0 0 48 48"><path d="M10 4 H32 L40 12 V44 H10Z" fill="#fff" stroke="#3b5ea8" stroke-width="1.4"/><path d="M32 4 V12 H40" fill="#dfe7f7" stroke="#3b5ea8" stroke-width="1.2"/>' +
      '<rect x="14" y="15" width="22" height="6" fill="#2d5fc2"/><path d="M15 26 H35 M15 31 H35 M15 36 H28" stroke="#8fa6d6" stroke-width="1.8"/><circle cx="35" cy="37" r="5" fill="#f2c14e" stroke="#b07d10"/></svg>',
    video: '<svg viewBox="0 0 48 48"><rect x="6" y="9" width="36" height="30" rx="2" fill="#2b2f3a" stroke="#111"/>' +
      '<path d="M6 15 H42 M6 33 H42" stroke="#111" stroke-width="1"/><g fill="#d8dbe2"><rect x="9" y="11" width="3" height="2.5"/><rect x="16" y="11" width="3" height="2.5"/><rect x="23" y="11" width="3" height="2.5"/><rect x="30" y="11" width="3" height="2.5"/><rect x="37" y="11" width="3" height="2.5"/>' +
      '<rect x="9" y="34.5" width="3" height="2.5"/><rect x="16" y="34.5" width="3" height="2.5"/><rect x="23" y="34.5" width="3" height="2.5"/><rect x="30" y="34.5" width="3" height="2.5"/><rect x="37" y="34.5" width="3" height="2.5"/></g>' +
      '<path d="M20 18 L31 24 L20 30Z" fill="#4fc35a"/></svg>',

    /* 我的文档：黄文件夹里斜插着一张写了字的纸 */
    mydocs: '<svg viewBox="0 0 48 48"><defs><linearGradient id="md_U" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#f2b92e"/></linearGradient></defs>' +
      '<path d="M4 12 H17 L21 16 H40 V40 H4Z" fill="#e2a72a" stroke="#a87414" stroke-width="1.2"/>' +
      '<g transform="rotate(12 30 18)"><path d="M17 3 H35 L41 9 V34 H17Z" fill="#fff" stroke="#5b7a99" stroke-width="1.2"/><path d="M35 3 V9 H41" fill="#dbe9f7" stroke="#5b7a99"/>' +
      '<path d="M21 13 H36 M21 17 H37 M21 21 H33 M21 25 H37" stroke="#3d7be0" stroke-width="1.8"/></g>' +
      '<path d="M3 21 H45 L42 43 H6Z" fill="url(#md_U)" stroke="#a87414" stroke-width="1.2"/></svg>',

    /* 网上邻居：一个地球，前面两台用网线连着的电脑 */
    network: '<svg viewBox="0 0 48 48"><defs><radialGradient id="nw_U" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#a6dcff"/><stop offset="1" stop-color="#1663c7"/></radialGradient></defs>' +
      '<circle cx="29" cy="15" r="12.5" fill="url(#nw_U)" stroke="#0d4a96" stroke-width="1.2"/>' +
      '<path d="M21 9 C24 8 25 12 29 12 C32 12 32 8 36 9 M20 18 C23 17 25 21 29 21 C32 21 34 18 39 19" fill="none" stroke="#5fb83a" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M10 41 Q22 47 36 42" fill="none" stroke="#555" stroke-width="1.6"/>' +
      '<rect x="2" y="23" width="17" height="13" rx="1.5" fill="#e8e4d6" stroke="#6d6a60"/><rect x="4.3" y="25.3" width="12.4" height="8.4" fill="#3d8be8"/>' +
      '<rect x="8" y="36" width="5" height="3" fill="#cfcabb"/><rect x="5" y="39" width="11" height="2.6" rx="1" fill="#d9d5c7" stroke="#6d6a60" stroke-width=".8"/>' +
      '<rect x="27" y="26" width="17" height="13" rx="1.5" fill="#e8e4d6" stroke="#6d6a60"/><rect x="29.3" y="28.3" width="12.4" height="8.4" fill="#3d8be8"/>' +
      '<rect x="33" y="39" width="5" height="2.5" fill="#cfcabb"/><rect x="30" y="41.5" width="11" height="2.6" rx="1" fill="#d9d5c7" stroke="#6d6a60" stroke-width=".8"/></svg>',

    /* 一键还原精灵：一块硬盘，上面一个绿色的“转回去”箭头，旁边闪一颗星 */
    genie: '<svg viewBox="0 0 48 48"><rect x="5" y="24" width="38" height="18" rx="3" fill="#cfd4dc" stroke="#6b7280" stroke-width="1.2"/><rect x="5" y="24" width="38" height="5" rx="2" fill="#e8ebf0"/>' +
      '<circle cx="36" cy="35" r="2" fill="#3c3"/><path d="M10 36 H26" stroke="#9aa1ab" stroke-width="2"/>' +
      '<path d="M15 18 A10 10 0 1 1 25 22" fill="none" stroke="#1f9a2e" stroke-width="4.5" stroke-linecap="round"/><path d="M8 13 L15 20 L20 12Z" fill="#1f9a2e"/>' +
      '<path d="M38 3 L39.6 7.4 L44 9 L39.6 10.6 L38 15 L36.4 10.6 L32 9 L36.4 7.4Z" fill="#ffd23f" stroke="#c99a00" stroke-width=".6"/></svg>',

    /* 激活器：一把金钥匙 */
    key: '<svg viewBox="0 0 48 48"><defs><linearGradient id="ky_U" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset="1" stop-color="#d49a10"/></linearGradient></defs>' +
      '<circle cx="15" cy="17" r="11" fill="url(#ky_U)" stroke="#8a6200" stroke-width="1.5"/><circle cx="12" cy="14" r="3.6" fill="#fff" stroke="#8a6200" stroke-width="1.2"/>' +
      '<path d="M22 24 L41 43 M33 35 L37 31 M37 39 L41 35" fill="none" stroke="#8a6200" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M22 24 L41 43 M33 35 L37 31 M37 39 L41 35" fill="none" stroke="url(#ky_U)" stroke-width="3.6" stroke-linecap="round"/></svg>',

    /* Internot Explorer：一个地球，外面一圈红色禁止符号（上不去网） */
    ie: '<svg viewBox="0 0 48 48"><defs><radialGradient id="ie_U" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#1663c7"/></radialGradient></defs>' +
      '<circle cx="24" cy="24" r="17" fill="url(#ie_U)" stroke="#0d4a96" stroke-width="1.2"/>' +
      '<path d="M12 18 C16 16 18 21 23 20 C27 19 27 14 32 15 M11 28 C15 27 19 31 24 30 C29 29 31 26 37 27" fill="none" stroke="#5fb83a" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="24" cy="24" r="20.5" fill="none" stroke="#e02020" stroke-width="4"/><path d="M10 38 L38 10" stroke="#e02020" stroke-width="4" stroke-linecap="round"/></svg>',

    /* Outluck Excess：一封信，头顶一朵打雷的乌云（运气不好） */
    mail: '<svg viewBox="0 0 48 48"><rect x="4" y="18" width="34" height="24" rx="2" fill="#fff6d8" stroke="#a08a50" stroke-width="1.2"/><path d="M4 19 L21 32 L38 19" fill="none" stroke="#a08a50" stroke-width="1.4"/>' +
      '<path d="M27 14 C25 8 32 5 35 9 C37 5 44 7 43 12 C46 13 45 18 41 18 H29 C25 18 24 15 27 14Z" fill="#6b7280" stroke="#3f4650"/>' +
      '<path d="M36 18 L33 24 H37 L34 30" fill="none" stroke="#ffd000" stroke-width="2" stroke-linejoin="round"/></svg>',

    /* 扫雪：一块浅蓝格子上一片雪花，旁边一把扫帚 */
    sweep: '<svg viewBox="0 0 48 48"><rect x="5" y="5" width="38" height="38" rx="3" fill="#cfe3fb" stroke="#6f8fb8" stroke-width="1.2"/>' +
      '<g stroke-linecap="round"><path d="M18 10 V30 M9.3 15 L26.7 25 M9.3 25 L26.7 15" stroke="#5c8fd6" stroke-width="4"/><path d="M18 10 V30 M9.3 15 L26.7 25 M9.3 25 L26.7 15" stroke="#fff" stroke-width="2"/></g>' +
      '<path d="M42 8 L28 30" stroke="#9a6b2f" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M24 29 L32 34 L27 43 L17 38Z" fill="#e8b84a" stroke="#9a6b2f" stroke-width="1.2"/><path d="M20 39 L25 31 M23 41 L28 33" stroke="#9a6b2f" stroke-width=".8"/></svg>',

    /* 命令提示符：黑窗口里一行 C:\> */
    cmd: '<svg viewBox="0 0 48 48"><rect x="4" y="7" width="40" height="34" rx="2" fill="#111" stroke="#666" stroke-width="1.2"/><rect x="4" y="7" width="40" height="7" fill="#2d6fd6"/>' +
      '<text x="8" y="30" font-size="10" font-family="Courier New, monospace" font-weight="bold" fill="#c0c0c0">C:\\&gt;_</text></svg>',

    calc: '<svg viewBox="0 0 48 48"><rect x="9" y="3" width="30" height="42" rx="4" fill="#d9d6cb" stroke="#6b6a63" stroke-width="1.2"/><rect x="13" y="7" width="22" height="11" rx="1" fill="#c6dcb4" stroke="#6b6a63"/>' +
      '<path d="M17 10 L21 12 M31 10 L27 12" stroke="#333" stroke-width="1.5" stroke-linecap="round"/><path d="M21 16.2 Q24 14 27 16.2" stroke="#333" stroke-width="1.3" fill="none"/>' +
      '<g fill="#fff" stroke="#8a887f" stroke-width=".8"><rect x="13" y="22" width="6" height="5" rx="1"/><rect x="21" y="22" width="6" height="5" rx="1"/><rect x="13" y="29" width="6" height="5" rx="1"/><rect x="21" y="29" width="6" height="5" rx="1"/><rect x="13" y="36" width="6" height="5" rx="1"/><rect x="21" y="36" width="6" height="5" rx="1"/></g>' +
      '<rect x="29" y="22" width="6" height="5" rx="1" fill="#f6a04d" stroke="#b46a1c" stroke-width=".8"/><rect x="29" y="29" width="6" height="12" rx="1" fill="#e5533d" stroke="#a5301f" stroke-width=".8"/></svg>',

    paint: '<svg viewBox="0 0 48 48"><path d="M24 5 C12 5 4 13 4 23 C4 33 12 41 21 41 C25 41 25 37 23 35 C21 32 23 29 27 29 H33 C40 29 44 25 44 20 C44 11 35 5 24 5Z" fill="#f3dcb2" stroke="#9a7444" stroke-width="1.2"/>' +
      '<circle cx="14" cy="21" r="3.2" fill="#e33"/><circle cx="19" cy="13" r="3.2" fill="#fc3"/><circle cx="28" cy="11" r="3.2" fill="#3b3"/><circle cx="36" cy="16" r="3.2" fill="#39f"/>' +
      '<g transform="rotate(40 34 34)"><rect x="32" y="15" width="4" height="22" rx="1.5" fill="#b5651d"/><rect x="31.5" y="35" width="5" height="4" fill="#bbb"/><path d="M31.5 39 Q34 47 36.5 39Z" fill="#222"/></g>' +
      '<rect x="2" y="33" width="17" height="12" rx="2.5" fill="#2d6fd6" stroke="#fff"/><path d="M5.5 42 L8 36 L10.5 42 M6.5 40 H9.5 M14 36 V42" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    /* 抠抠2003：铁公鸡（一毛不拔 = 抠门），Codex 画的图 */
    koukou: '<svg viewBox="0 0 48 48"><image href="assets/koukou/logo.webp" x="0" y="0" width="48" height="48"/></svg>',
    /* 幻觉游戏 V3.0 里的 6 个游戏：先用代码画的临时图标，Codex 画好再换 */
    'game-zhuma': '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#3a2a12"/><circle cx="24" cy="24" r="9" fill="#c98a3a" stroke="#5a3a12" stroke-width="2"/>' + ['#e33','#3b6','#36e','#ec2','#e3e','#3cc'].map((c, i) => '<circle cx="' + (24 + 15 * Math.cos(i)) + '" cy="' + (24 + 15 * Math.sin(i)) + '" r="4.5" fill="' + c + '"/>').join('') + '</svg>',
    'game-miner': '<svg viewBox="0 0 48 48"><rect x="4" y="30" width="40" height="14" rx="2" fill="#7a4f25"/><path d="M24 4 V24" stroke="#555" stroke-width="2"/><path d="M17 24 L24 30 L31 24" fill="none" stroke="#777" stroke-width="3"/><path d="M10 36 l5 -3 5 3 -2 4 h-6z" fill="#9aa4b2"/><path d="M30 34 l6 -2 4 4 -5 4 -5 -2z" fill="#c0c8d4"/></svg>',
    'game-tank': '<svg viewBox="0 0 48 48"><rect x="4" y="8" width="40" height="34" rx="3" fill="#5ec8f0" stroke="#1c6f99" stroke-width="2"/><path d="M14 26 q6 -6 12 0 q-6 6 -12 0z M26 26 l6 -4 v8z" fill="#ff9a2e"/><circle cx="34" cy="14" r="2" fill="#fff"/><circle cx="38" cy="20" r="1.5" fill="#fff"/><path d="M4 36 h40" stroke="#e2c27a" stroke-width="6"/></svg>',
    'game-tea': '<svg viewBox="0 0 48 48"><rect x="3" y="8" width="19" height="28" fill="#fff" stroke="#888"/><rect x="26" y="8" width="19" height="28" fill="#fff" stroke="#888"/><path d="M7 18 h11 v10 q0 4 -5.5 4 q-5.5 0 -5.5 -4z M30 18 h11 v10 q0 4 -5.5 4 q-5.5 0 -5.5 -4z" fill="#6ab04c"/><circle cx="36" cy="14" r="6" fill="none" stroke="#e22" stroke-width="2"/></svg>',
    'game-sticky': '<svg viewBox="0 0 48 48"><rect x="5" y="9" width="16" height="16" rx="2" fill="#ffd84d" stroke="#b08a00"/><rect x="27" y="23" width="16" height="16" rx="2" fill="#ffd84d" stroke="#b08a00"/><path d="M13 25 V31 H35 V25" fill="none" stroke="#e33" stroke-width="2.5"/><circle cx="13" cy="17" r="4" fill="#e33"/><circle cx="35" cy="31" r="4" fill="#e33"/></svg>',
    'game-stone': '<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="3" fill="#2b1a40"/>' + [[12,12,'#e33'],[24,12,'#3b6'],[36,12,'#36e'],[12,24,'#ec2'],[24,24,'#e3e'],[36,24,'#e33'],[12,36,'#3cc'],[24,36,'#ec2'],[36,36,'#3b6']].map(([x, y, c]) => '<path d="M' + x + ' ' + (y - 5) + ' L' + (x + 5) + ' ' + y + ' L' + x + ' ' + (y + 5) + ' L' + (x - 5) + ' ' + y + 'Z" fill="' + c + '"/>').join('') + '</svg>',
    /* 千千不听：一副耳机 + 中间一个音符 */
    music: '<svg viewBox="0 0 48 48"><defs><linearGradient id="mu_U" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff9ad5"/><stop offset="1" stop-color="#d0247f"/></linearGradient></defs>' +
      '<path d="M9 27 C9 12 39 12 39 27" fill="none" stroke="#3b3f57" stroke-width="4" stroke-linecap="round"/>' +
      '<rect x="4" y="25" width="9" height="15" rx="4" fill="#3b3f57"/><rect x="35" y="25" width="9" height="15" rx="4" fill="#3b3f57"/>' +
      '<rect x="6" y="28" width="5" height="9" rx="2.5" fill="#8e95c4"/><rect x="37" y="28" width="5" height="9" rx="2.5" fill="#8e95c4"/>' +
      '<path d="M27 17 V33" stroke="url(#mu_U)" stroke-width="3"/><path d="M27 17 L34 19 V23 L27 21Z" fill="url(#mu_U)"/>' +
      '<ellipse cx="23.5" cy="34" rx="5" ry="3.8" fill="url(#mu_U)" stroke="#9b145c" stroke-width="1"/></svg>',

    coil: '<svg viewBox="0 0 48 48"><g transform="translate(2 4)" fill="none" stroke-linecap="round">' +
      '<path d="M24 24 A2 2 0 0 1 28 24 A4 4 0 0 1 20 24 A6 6 0 0 1 32 24 A8 8 0 0 1 16 24 A10 10 0 0 1 36 24 A12 12 0 0 1 12 24 A14 14 0 0 1 40 24 A16 16 0 0 1 8 24" stroke="#1f5e22" stroke-width="4.4"/>' +
      '<path d="M24 24 A2 2 0 0 1 28 24 A4 4 0 0 1 20 24 A6 6 0 0 1 32 24 A8 8 0 0 1 16 24 A10 10 0 0 1 36 24 A12 12 0 0 1 12 24 A14 14 0 0 1 40 24 A16 16 0 0 1 8 24" stroke="#56c25c" stroke-width="2.4"/></g>' +
      '<circle cx="10" cy="28" r="3.6" fill="#ffb347" opacity=".6"/><circle cx="10" cy="28" r="2.2" fill="#ff4a10"/>' +
      '<path d="M10 24 C6 20 13 17 9 12 C6 8 11 6 9 2" fill="none" stroke="#bdbdbd" stroke-width="2" stroke-linecap="round"/></svg>',

    exe: '<svg viewBox="0 0 48 48"><rect x="5" y="8" width="38" height="32" rx="2" fill="#fff" stroke="#4a6fa5" stroke-width="2"/><rect x="5" y="8" width="38" height="8" fill="#2d6fd6"/><circle cx="38" cy="12" r="2" fill="#fff"/>' +
      '<rect x="10" y="21" width="16" height="3" fill="#b5c4da"/><rect x="10" y="27" width="24" height="3" fill="#b5c4da"/><rect x="10" y="33" width="12" height="3" fill="#b5c4da"/></svg>',

    diary: '<svg viewBox="0 0 48 48"><rect x="9" y="4" width="30" height="40" rx="2" fill="#2a2a2a" stroke="#000"/><rect x="9" y="4" width="5" height="40" fill="#111"/>' +
      '<rect x="18" y="12" width="16" height="9" rx="1" fill="#444"/><rect x="34" y="20" width="9" height="8" rx="1.5" fill="#d4a017" stroke="#6b4e00"/><circle cx="38.5" cy="24" r="1.3" fill="#6b4e00"/></svg>',

    control: '<svg viewBox="0 0 48 48"><rect x="5" y="6" width="38" height="36" rx="3" fill="#e9eef7" stroke="#55657d" stroke-width="2"/><path d="M14 12 V36 M24 12 V36 M34 12 V36" stroke="#8a98ad" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="9" y="25" width="10" height="6" rx="1.5" fill="#3d7de0"/><rect x="19" y="14" width="10" height="6" rx="1.5" fill="#e04b3d"/><rect x="29" y="20" width="10" height="6" rx="1.5" fill="#3db04a"/></svg>',

    help: '<svg viewBox="0 0 48 48">' + BLUE_BALL + '<path d="M17.5 18 C17.5 10.5 30.5 10.5 30.5 18 C30.5 23 24 23.5 24 29" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="36" r="3.2" fill="#fff"/></svg>',
    info: '<svg viewBox="0 0 48 48">' + BLUE_BALL + '<circle cx="24" cy="14" r="3.4" fill="#fff"/><rect x="21" y="20" width="6" height="17" rx="2" fill="#fff"/></svg>',
    warn: '<svg viewBox="0 0 48 48"><defs><linearGradient id="wg_U" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#f5c400"/></linearGradient></defs><path d="M24 4 L45 42 H3Z" fill="url(#wg_U)" stroke="#8a6d00" stroke-width="2" stroke-linejoin="round"/><rect x="21.5" y="16" width="5" height="15" rx="2" fill="#222"/><circle cx="24" cy="36.5" r="2.8" fill="#222"/></svg>',
    error: '<svg viewBox="0 0 48 48"><defs><radialGradient id="eg_U" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#ff8f7a"/><stop offset="1" stop-color="#c41a0a"/></radialGradient></defs><circle cx="24" cy="24" r="20" fill="url(#eg_U)" stroke="#7d0e04" stroke-width="1.5"/><path d="M16 16 L32 32 M32 16 L16 32" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>',

    search: '<svg viewBox="0 0 48 48"><path d="M30 30 L43 43" stroke="#7a4a1c" stroke-width="7" stroke-linecap="round"/><circle cx="20" cy="20" r="13" fill="#e3f3ff" stroke="#3a3a3a" stroke-width="4"/><path d="M14 15 Q17 11 22 11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',

    run: '<svg viewBox="0 0 48 48"><circle cx="30" cy="8" r="5" fill="#2f9a3a"/><path d="M27 15 L21 27 L28 31 L24 43 M23 19 L32 22 L38 18 M21 27 L11 30 M26 15 L15 18 L11 24" fill="none" stroke="#2f9a3a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M37 34 H46 M35 40 H43 M39 28 H46" stroke="#9ad49f" stroke-width="2.5" stroke-linecap="round"/></svg>',

    logout: '<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="7" fill="#f4a21b" stroke="#fff" stroke-width="2.5"/><path d="M20 14 H13 V34 H20" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M19 24 H36 M30 17 L37 24 L30 31" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    power: '<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="7" fill="#e2451f" stroke="#fff" stroke-width="2.5"/><path d="M17 15 A11 11 0 1 0 31 15" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M24 10 V24" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
    powerGlyph: '<svg viewBox="0 0 48 48"><path d="M15 13 A14 14 0 1 0 33 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M24 6 V24" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>',
    moonGlyph: '<svg viewBox="0 0 48 48"><path d="M28 5 A19 19 0 1 0 43 31 A15 15 0 1 1 28 5Z" fill="#fff"/></svg>',
    restartGlyph: '<svg viewBox="0 0 48 48"><path d="M38 26 A14 14 0 1 1 31 12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M26 4 L39 11 L28 19Z" fill="#fff"/></svg>',

    volume: '<svg viewBox="0 0 48 48"><path d="M6 18 H15 L27 8 V40 L15 30 H6Z" fill="#f5f5f5" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/><path d="M33 17 Q38 24 33 31 M37 12 Q45 24 37 36" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 48 48"><path d="M6 18 H15 L27 8 V40 L15 30 H6Z" fill="#f5f5f5" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 17 L44 31 M44 17 L32 31" stroke="#ff3b30" stroke-width="5" stroke-linecap="round"/></svg>',
    shieldWarn: '<svg viewBox="0 0 48 48"><path d="M24 4 L41 10 V22 C41 33 33 41 24 44 C15 41 7 33 7 22 V10Z" fill="#ffcc00" stroke="#7a5f00" stroke-width="2.5"/><rect x="21.5" y="13" width="5" height="16" rx="2" fill="#5a4500"/><circle cx="24" cy="35" r="3" fill="#5a4500"/></svg>',
    speaker: '<svg viewBox="0 0 48 48"><path d="M5 19 V29 H12 L33 40 V8 L12 19Z" fill="#fff"/><rect x="12" y="29" width="6" height="11" rx="1.5" fill="#fff"/><path d="M38 18 Q42 24 38 30" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',

    /* 千禧年小物件（画面两边滚动装饰用） */
    floppy: '<svg viewBox="0 0 48 48"><path d="M6 6 H36 L42 12 V42 H6Z" fill="#2c5fd0" stroke="#173a85" stroke-width="1.5"/><rect x="13" y="6" width="20" height="13" fill="#cfd6df" stroke="#8a95a3"/><rect x="26" y="8" width="4" height="9" fill="#2c5fd0"/><rect x="11" y="25" width="26" height="17" rx="1" fill="#f4f4ee"/><path d="M14 30 H34 M14 34 H34 M14 38 H28" stroke="#9aa" stroke-width="1"/></svg>',
    cd: '<svg viewBox="0 0 48 48"><defs><linearGradient id="cdg_U" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f3ff"/><stop offset=".3" stop-color="#ffd1f0"/><stop offset=".5" stop-color="#d4fff0"/><stop offset=".7" stop-color="#fff3c4"/><stop offset="1" stop-color="#cfd8ff"/></linearGradient></defs><circle cx="24" cy="24" r="20" fill="url(#cdg_U)" stroke="#9aa3b5" stroke-width="1.2"/><circle cx="24" cy="24" r="7" fill="#eef1f6" stroke="#9aa3b5"/><circle cx="24" cy="24" r="3" fill="#2b2b44"/><path d="M12 14 A16 16 0 0 1 22 8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".9"/></svg>',
    flipphone: '<svg viewBox="0 0 48 48"><rect x="14" y="3" width="20" height="20" rx="4" fill="#b9c3d1" stroke="#5d6676" stroke-width="1.2"/><rect x="17" y="6" width="14" height="12" rx="1.5" fill="#7fd6ff" stroke="#3a6d8a"/><rect x="13" y="24" width="22" height="21" rx="4" fill="#a9b4c4" stroke="#5d6676" stroke-width="1.2"/><g fill="#eef2f7"><rect x="16" y="28" width="4" height="3" rx="1"/><rect x="22" y="28" width="4" height="3" rx="1"/><rect x="28" y="28" width="4" height="3" rx="1"/><rect x="16" y="33" width="4" height="3" rx="1"/><rect x="22" y="33" width="4" height="3" rx="1"/><rect x="28" y="33" width="4" height="3" rx="1"/><rect x="16" y="38" width="4" height="3" rx="1"/><rect x="22" y="38" width="4" height="3" rx="1"/><rect x="28" y="38" width="4" height="3" rx="1"/></g><rect x="13" y="22" width="22" height="3" fill="#8e99a9"/></svg>',
    brickphone: '<svg viewBox="0 0 48 48"><rect x="27" y="2" width="4" height="10" rx="2" fill="#333"/><rect x="15" y="9" width="18" height="37" rx="5" fill="#3a4a5c" stroke="#1d2631" stroke-width="1.2"/><rect x="18" y="13" width="12" height="10" rx="1" fill="#9fd36b" stroke="#2d4a1a"/><path d="M20 17 H28 M20 20 H25" stroke="#2d4a1a"/><g fill="#c9d3de"><circle cx="20" cy="28" r="1.6"/><circle cx="24" cy="28" r="1.6"/><circle cx="28" cy="28" r="1.6"/><circle cx="20" cy="33" r="1.6"/><circle cx="24" cy="33" r="1.6"/><circle cx="28" cy="33" r="1.6"/><circle cx="20" cy="38" r="1.6"/><circle cx="24" cy="38" r="1.6"/><circle cx="28" cy="38" r="1.6"/></g></svg>',
    pager: '<svg viewBox="0 0 48 48"><rect x="5" y="13" width="38" height="24" rx="5" fill="#2d2d36" stroke="#111" stroke-width="1.2"/><rect x="9" y="17" width="24" height="12" rx="1.5" fill="#a7d88a" stroke="#3e5a2a"/><text x="21" y="26.5" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle" fill="#24381a">520</text><circle cx="38" cy="21" r="2.5" fill="#e33"/><rect x="34" y="27" width="6" height="4" rx="1" fill="#666"/><rect x="9" y="31" width="8" height="3" rx="1" fill="#555"/></svg>',
    cassette: '<svg viewBox="0 0 48 48"><rect x="3" y="11" width="42" height="27" rx="3" fill="#2f2f38" stroke="#111"/><rect x="7" y="14" width="34" height="13" rx="1.5" fill="#f3d36a"/><rect x="13" y="18" width="22" height="7" rx="3.5" fill="#2f2f38"/><circle cx="17" cy="21.5" r="2.4" fill="#ddd"/><circle cx="31" cy="21.5" r="2.4" fill="#ddd"/><path d="M12 38 L15 31 H33 L36 38" fill="#45454f"/><circle cx="19" cy="34.5" r="1.3" fill="#111"/><circle cx="29" cy="34.5" r="1.3" fill="#111"/></svg>',
    mp3: '<svg viewBox="0 0 48 48"><rect x="15" y="6" width="18" height="30" rx="4" fill="#e9ecf2" stroke="#8a93a3" stroke-width="1.2"/><rect x="18" y="9" width="12" height="9" rx="1" fill="#5aa9e6"/><circle cx="24" cy="27" r="5.5" fill="#cfd5df" stroke="#8a93a3"/><circle cx="24" cy="27" r="2" fill="#e9ecf2"/><path d="M24 36 C24 42 14 40 12 44 M24 36 C24 42 34 40 36 44" stroke="#fff" stroke-width="1.5" fill="none"/><circle cx="12" cy="44" r="2.5" fill="#fff" stroke="#999"/><circle cx="36" cy="44" r="2.5" fill="#fff" stroke="#999"/></svg>',
    eggpet: '<svg viewBox="0 0 48 48"><rect x="21" y="1" width="6" height="4" rx="2" fill="#b3427a"/><path d="M24 3 C35 3 42 15 42 27 C42 38 34 45 24 45 C14 45 6 38 6 27 C6 15 13 3 24 3Z" fill="#ff8ac2" stroke="#b3427a" stroke-width="1.3"/><rect x="14" y="15" width="20" height="16" rx="2" fill="#cfe3b8" stroke="#56704a"/><g fill="#2b3a24"><rect x="21" y="19" width="2" height="2"/><rect x="25" y="19" width="2" height="2"/><rect x="20" y="22" width="8" height="2"/><rect x="21" y="24" width="2" height="3"/><rect x="25" y="24" width="2" height="3"/></g><circle cx="17" cy="37" r="2.6" fill="#fff3a8" stroke="#b3427a"/><circle cx="24" cy="39" r="2.6" fill="#fff3a8" stroke="#b3427a"/><circle cx="31" cy="37" r="2.6" fill="#fff3a8" stroke="#b3427a"/></svg>',
    ballmouse: '<svg viewBox="0 0 48 48"><path d="M24 14 C24 6 30 4 36 3" stroke="#888" stroke-width="2" fill="none"/><path d="M14 22 C14 15 18 13 24 13 C30 13 34 15 34 22 V34 C34 41 30 45 24 45 C18 45 14 41 14 34Z" fill="#ece8dc" stroke="#8a867a" stroke-width="1.3"/><path d="M14 25 H34 M24 13 V25" stroke="#8a867a" stroke-width="1.2"/></svg>',
    modem: '<svg viewBox="0 0 48 48"><path d="M4 22 L10 14 H38 L44 22Z" fill="#dcd8cb" stroke="#77736a"/><rect x="4" y="22" width="40" height="12" rx="1.5" fill="#cbc6b6" stroke="#77736a"/><circle cx="10" cy="28" r="1.6" fill="#3f3"/><circle cx="15" cy="28" r="1.6" fill="#3f3"/><circle cx="20" cy="28" r="1.6" fill="#fc3"/><circle cx="25" cy="28" r="1.6" fill="#3f3"/><circle cx="30" cy="28" r="1.6" fill="#555"/><text x="38.5" y="30" font-size="6" text-anchor="middle" fill="#555" font-weight="bold" font-family="Arial">56K</text></svg>',
    gamepad: '<svg viewBox="0 0 48 48"><path d="M10 16 H38 C44 16 46 24 46 30 C46 36 42 38 38 34 L34 30 H14 L10 34 C6 38 2 36 2 30 C2 24 4 16 10 16Z" fill="#7d7d8c" stroke="#3b3b47" stroke-width="1.3"/><path d="M12 21 V29 M8 25 H16" stroke="#222" stroke-width="3"/><circle cx="33" cy="21.5" r="2.4" fill="#e33"/><circle cx="38" cy="25.5" r="2.4" fill="#fc3"/><circle cx="33" cy="29.5" r="2.4" fill="#3b3"/><circle cx="28" cy="25.5" r="2.4" fill="#39f"/></svg>',
    sparkle: '<svg viewBox="0 0 48 48"><path d="M24 2 C26 18 30 22 46 24 C30 26 26 30 24 46 C22 30 18 26 2 24 C18 22 22 18 24 2Z" fill="#fff4b0"/><path d="M24 12 C25 21 27 23 36 24 C27 25 25 27 24 36 C23 27 21 25 12 24 C21 23 23 21 24 12Z" fill="#fff"/></svg>',
    smiley: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#ffd93b" stroke="#c99a00" stroke-width="1.5"/><ellipse cx="17" cy="19" rx="2.5" ry="4" fill="#3a2a00"/><ellipse cx="31" cy="19" rx="2.5" ry="4" fill="#3a2a00"/><path d="M13 28 Q24 40 35 28" stroke="#3a2a00" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',

    /* 登录界面头像 */
    duck: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#9fd3ff"/><rect y="42" width="48" height="6" fill="#4fa3e0"/>' +
      '<ellipse cx="26" cy="35" rx="16" ry="10" fill="#ffd400" stroke="#c9a000" stroke-width="1.2"/><circle cx="21" cy="20" r="10" fill="#ffd400" stroke="#c9a000" stroke-width="1.2"/>' +
      '<path d="M11.5 21 Q4 21.5 6 25 Q10 26.5 13.5 24Z" fill="#ff8c1a" stroke="#c96200"/><circle cx="18" cy="17" r="2" fill="#222"/><circle cx="18.6" cy="16.4" r=".6" fill="#fff"/>' +
      '<path d="M30 32 Q36 29 38 35" fill="none" stroke="#c9a000" stroke-width="1.5"/></svg>',
    runner: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#e8f4e8"/><circle cx="30" cy="9" r="5" fill="#2f9a3a"/><path d="M27 16 L21 28 L28 32 L24 44 M23 20 L32 23 L38 19 M21 28 L11 31 M26 16 L15 19 L11 25" fill="none" stroke="#2f9a3a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#d8d8d8"/><path d="M16 22 V16 C16 6 32 6 32 16 V22" fill="none" stroke="#777" stroke-width="4"/><rect x="11" y="21" width="26" height="20" rx="3" fill="#f0b400" stroke="#8a6d00" stroke-width="2"/><circle cx="24" cy="29" r="3" fill="#5a4500"/><rect x="22.5" y="30" width="3" height="6" fill="#5a4500"/></svg>'
  };

  /* 像素小图：用字符画一格一格拼出来（o 深红描边、r 红、w 白、b 蓝眼泪） */
  function pixelSvg(rows, colors) {
    const w = Math.max.apply(null, rows.map(r => r.length));
    let s = '<svg viewBox="0 0 ' + w + ' ' + rows.length + '" shape-rendering="crispEdges">';
    rows.forEach((row, y) => row.split('').forEach((c, x) => {
      if (colors[c]) s += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + colors[c] + '"/>';
    }));
    return s + '</svg>';
  }
  // 开机检测器要哭了：报错框的红叉变成 T_T 哭脸
  RAW.cry = pixelSvg([
    '.....oooooo.....',
    '...oorrrrrroo...',
    '..orrrrrrrrrro..',
    '.orrrrrrrrrrrro.',
    '.orwwwrrrrwwwro.',
    'orrrwrrrrrrwrrro',
    'orrrwrrrrrrwrrro',
    'orrrbrrrrrrbrrro',
    'orrrbrrrrrrbrrro',
    'orrbbrrrrrrbbrro',
    'orrbrrwwwwrrbrro',
    '.orbrwrrrrwrbro.',
    '.orrrrrrrrrrrro.',
    '..orrrrrrrrrro..',
    '...oorrrrrroo...',
    '.....oooooo.....'
  ], { o: '#7a0c0c', r: '#e0302a', w: '#ffffff', b: '#3aa0ff' });

  OS.pixelSvg = pixelSvg;   // 小软件自己画像素小图也用它

  let uid = 0;
  OS.icon = function (name) {
    const raw = RAW[name] || RAW.exe;
    const u = ++uid;
    return raw.replace(/_U/g, '_' + u); // 每次给渐变一个新编号，防止串色
  };
  OS.iconEl = function (name, cls) {
    const s = document.createElement('span');
    s.className = 'ico' + (cls ? ' ' + cls : '');
    s.innerHTML = OS.icon(name);
    return s;
  };
})();

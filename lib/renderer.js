"use strict";

const path = require("path");

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const CSS_STRUCTURE = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap");
:root{--topnav-h:56px;--sidebar-w:224px;--toc-w:220px;--accent:#7382FF;--accent-hover:#4D5BFF;--accent-press:#3442F0;--accent-bg:rgba(115,130,255,.13);--text:#F4F5F7;--text2:#C2C7D0;--text3:#8A909A;--text4:#717680;--border:#2B2F36;--bg:#0F1115;--surface:#171A20;--surface-hover:#1D2128;--sidebar-bg:#171A20;--sidebar-section:#535862;--sidebar-text:#8A909A;--sidebar-text-hover:#F4F5F7;--sidebar-hover-bg:#1D2128;--topnav-bg:#171A20;--code-bg:#0F1115;--code-text:#8A909A;--success:#34D399;--warning:#FBBF24;--danger:#F87171;--info:#38BDF8;--success-bg:#064E3B33;--warning-bg:#78350F33;--danger-bg:#7F1D1D33;--info-bg:#0C4A6E33;--black:#0F1115;--black-soft:#12151B;--gray-900:#171A20;--gray-700:#3A4048;--gray-500:#717680;--gray-300:#8A909A;--gray-200:#2B2F36;--gray-100:#1D2128;--border-on-dark:rgba(244,245,247,0.12);--border-on-light:rgba(15,17,21,0.10);--text-inverse:#0F1115;--font-display:"Geist","Inter",-apple-system,sans-serif;--font-body:"IBM Plex Sans","Geist","Inter",-apple-system,sans-serif;--font-mono:"JetBrains Mono","Fira Code",ui-monospace,monospace;--tracking-display:-0.02em;--text-mono-label:500 11px/1.2 var(--font-mono);--text-mono-badge:600 10px/1 var(--font-mono);--tracking-mono-label:0.08em;--text-button:500 13px/1 var(--font-body);--text-body-sm:400 14px/1.5 var(--font-body);--radius-sm:4px;--radius-md:6px;--radius-lg:8px;--radius-xl:12px;--radius-pill:999px;--ease:cubic-bezier(0.215,0.610,0.355,1.000);--dur-fast:120ms;--dur-normal:180ms;--dur-complex:240ms;--shadow-card:0 2px 8px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.28);--shadow-inset-dark:inset 0 1px 0 rgba(255,255,255,0.04)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.icon{flex-shrink:0;display:inline-block;vertical-align:middle}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);font-size:14px;line-height:1.5;color:var(--text);background:var(--bg);font-variant-numeric:tabular-nums}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code,pre{font-family:var(--font-mono)}
.topnav{position:sticky;top:0;z-index:200;background:var(--topnav-bg);border-bottom:1px solid var(--border);height:var(--topnav-h)}
.topnav-inner{display:flex;align-items:center;gap:16px;height:100%;padding:0 24px;justify-content:flex-start}
.topnav-logo{font-size:13px;font-weight:600;color:var(--text);text-decoration:none;white-space:nowrap;flex-shrink:0;font-family:var(--font-display)}
.topnav-logo:hover{color:var(--accent)}
.topnav-version{font-size:11px;font-weight:400;color:var(--text3);font-family:var(--font-mono);margin-left:4px}
.topnav-search{flex:1;max-width:280px;margin:0;position:relative}
.search-box{width:100%;background:var(--surface-hover);border:1px solid var(--border);border-radius:var(--radius-md);padding:7px 32px 7px 32px;color:var(--text2);font-size:12px;font-family:var(--font-body);outline:none;transition:border-color var(--dur-fast) var(--ease)}
.search-box:focus{border-color:var(--accent);background:var(--surface-hover)}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:13px;height:13px;color:var(--text3);opacity:1;pointer-events:none}
.search-kbd{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--surface);border:1px solid var(--border);border-radius:3px;padding:1px 5px;font-size:9px;color:var(--text3);font-family:var(--font-mono);pointer-events:none}
.search-results{display:none;position:absolute;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:320px;overflow-y:auto;z-index:300;margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,.12)}
.search-results.visible{display:block}
.search-result-item{display:block;padding:9px 14px;cursor:pointer;border-bottom:1px solid var(--border);text-decoration:none}
.search-result-item:hover{background:var(--bg)}
.sr-name{font-size:13px;font-weight:600;color:var(--text);font-family:var(--font-mono)}
.sr-kind{font-size:10px;color:var(--text3);margin-left:6px;text-transform:uppercase;letter-spacing:.05em}
.sr-module{font-size:11px;color:var(--text3);display:block;margin-top:2px}
.sr-preview{font-size:11px;color:var(--text2);font-style:italic;display:block;margin-top:1px}
.search-no-results{padding:10px 14px;color:var(--text3);font-size:13px}
.layout{display:grid;grid-template-columns:var(--sidebar-w) 1fr;min-height:calc(100vh - var(--topnav-h))}
.layout-toc{grid-template-columns:var(--sidebar-w) 1fr var(--toc-w)}
.sidebar{grid-column:1;background:var(--sidebar-bg);border-right:1px solid var(--border);position:sticky;top:var(--topnav-h);height:calc(100vh - var(--topnav-h));overflow-y:auto}
.sidebar-inner{padding:0 0 32px}
.sidebar-inner[role="tree"]{}
.sidebar-section-title{padding:16px 16px 4px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:var(--sidebar-section);font-family:var(--font-mono);position:sticky;top:0;z-index:2;background:var(--sidebar-bg);}
.sidebar-link{display:block;padding:6px 16px;font-size:13px;color:var(--sidebar-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .1s,background .1s;border-radius:6px}
.sidebar-link:hover{color:var(--sidebar-text-hover);background:var(--sidebar-hover-bg);text-decoration:none}
.sidebar-link.active{color:#fff;font-weight:600;background:var(--accent);border-left:2px solid var(--accent);padding-left:14px;border-radius:6px}
.sidebar-dir-toggle{display:flex;align-items:center;gap:5px;cursor:pointer;list-style:none;padding:6px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sidebar-section);user-select:none;position:sticky;z-index:1;background:var(--sidebar-bg);}
.sidebar-dir-toggle::-webkit-details-marker{display:none}
.sidebar-dir-toggle::before{content:'';width:6px;height:6px;border-right:1.75px solid var(--sidebar-section);border-bottom:1.75px solid var(--sidebar-section);transform:rotate(-45deg);transition:transform var(--dur-fast) var(--ease);flex-shrink:0;display:inline-block}
details[open] .sidebar-dir-toggle::before{transform:rotate(45deg)}
.sidebar-link-indent{padding-left:28px}
.sidebar-link-indent.active{padding-left:26px}
.sidebar-dir-toggle,.sidebar-link{padding-left:calc(16px + (var(--depth,0) * 14px))}
.sidebar-link.active{padding-left:calc(14px + (var(--depth,0) * 14px))}
.sidebar-dir-toggle{top:calc(24px + (min(var(--depth,0),3) * 26px))}
.sidebar-link:focus-visible,.sidebar-dir-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:-1px}
.toc{grid-column:3;position:sticky;top:var(--topnav-h);height:calc(100vh - var(--topnav-h));overflow-y:auto;padding:32px 16px 32px 20px;border-left:1px solid var(--border);background:var(--bg)}
.toc-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:12px}
.toc-section{margin-bottom:12px}
.toc-section-label{font-size:11px;font-weight:600;color:var(--text2);margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid var(--border)}
.toc-item{display:block;font-size:12px;color:var(--text3);text-decoration:none;padding:3px 0 3px 8px;border-left:2px solid transparent;transition:color .1s,border-color .1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.toc-item:hover{color:var(--text);border-left-color:var(--border);text-decoration:none}
.toc-item.active{color:var(--accent);border-left-color:var(--accent);font-weight:600}
.sym-rows{padding:2px 0 6px}
.sym-row{display:flex;align-items:center;gap:5px;padding:2px 10px 2px 38px;min-width:0}
.sym-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;display:inline-block}
.sym-kind-abbr{font-size:9px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--sidebar-section);width:16px;flex-shrink:0;display:inline-block}
.sym-fn{background:var(--success)}
.sym-cls{background:var(--accent)}
.sym-iface{background:var(--info)}
.sym-enum{background:var(--danger)}
.sym-type{background:var(--sidebar-text)}
.sym-var{background:var(--warning)}
.sym-link{font-size:12px;color:var(--sidebar-text);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.sym-link:hover{color:var(--sidebar-text-hover);text-decoration:none}
.sym-link.active{color:#fff;font-weight:600}
.main{min-width:0;overflow-x:hidden}
.page-header{padding:26px 32px 24px;border-bottom:1px solid var(--border)}
.page-title{font-size:22px;font-weight:600;color:var(--text);margin-bottom:4px;letter-spacing:-.02em;font-family:var(--font-display)}
.page-subtitle{color:var(--text3);font-size:12px;margin-bottom:0;font-family:var(--font-mono)}
.module-desc{color:var(--text2);font-size:14px;line-height:1.7;margin-top:10px;max-width:600px}
.breadcrumb{font-size:13px;color:var(--text3);margin-bottom:12px}
.breadcrumb a{color:var(--accent)}
.section{margin-bottom:0}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--sidebar-section);font-family:var(--font-mono);padding:20px 32px 10px;display:flex;align-items:center;gap:8px;border-top:1px solid var(--border);background:var(--surface)}
.section:first-child .section-title{border-top:none}
.index-content .section-title{border-top:none}
.section-count{font-size:10px;font-weight:400;color:var(--text3);font-family:var(--font-mono)}
.card{display:grid;grid-template-columns:1fr 380px;background:var(--surface);border-bottom:1px solid var(--border);scroll-margin-top:calc(var(--topnav-h) + 8px)}
.card-prose{padding:26px 32px;border-right:1px solid var(--border);min-width:0}
.card-code{background:var(--black-soft);padding:24px 22px;min-width:0;overflow:hidden}
.card-header{display:flex;align-items:flex-start;gap:8px;margin-bottom:4px}
.card-name{font-size:14px;font-weight:700;color:var(--text);font-family:var(--font-mono);flex:1;min-width:0;word-break:break-all}
.card-sig{font-size:12px;color:var(--text2);font-family:var(--font-mono);margin-top:4px;word-break:break-word;line-height:1.5}
.card-desc{font-size:13px;color:var(--text2);margin-top:10px;line-height:1.6;max-width:520px}
.card-anchor{color:var(--text3);opacity:0;font-size:12px;margin-left:3px;transition:opacity var(--dur-fast) var(--ease);text-decoration:none;flex-shrink:0}
.card:hover .card-anchor{opacity:.6}
.card-anchor:hover{opacity:1;text-decoration:none}
.code-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--info);font-family:var(--font-mono);margin-bottom:8px}
.card-code pre{margin:0;font-size:12px;line-height:1.65;color:var(--code-text);overflow-x:auto;white-space:pre-wrap;word-break:break-word;tab-size:2;font-family:var(--font-mono)}
.copy-btn{float:right;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius-sm);padding:3px 8px;font-size:10px;color:var(--text3);cursor:pointer;transition:all var(--dur-fast) var(--ease);margin:-2px 0 6px 6px;font-family:var(--font-mono)}
.copy-btn:hover{background:rgba(255,255,255,.12);color:var(--text2)}
.copy-btn.copied{background:var(--success-bg);border-color:var(--success);color:var(--success)}
.badge{display:inline-block;padding:2px 7px;border-radius:var(--radius-pill);font-size:10px;font-weight:600;letter-spacing:.02em;margin-right:3px;margin-top:4px;vertical-align:middle;font-family:var(--font-mono);text-transform:uppercase}
.badge-exported{background:var(--success-bg);color:var(--success)}
.badge-async{background:var(--info-bg);color:var(--info)}
.badge-abstract{background:var(--accent-bg);color:var(--accent)}
.badge-static{background:var(--warning-bg);color:var(--warning)}
.badge-readonly{background:var(--accent-bg);color:var(--accent)}
.badge-generator{background:var(--success-bg);color:var(--success)}
.badge-deprecated{background:var(--danger-bg);color:var(--danger)}
.badge-since{background:var(--success-bg);color:var(--success)}
.badge-optional{background:var(--accent-bg);color:var(--accent)}
.badge-const{background:var(--accent-bg);color:var(--accent)}
.badge-var{background:var(--warning-bg);color:var(--warning)}
.badge-private{background:var(--surface-hover);color:var(--text3);border:1px solid var(--border)}
.badge-protected{background:var(--warning-bg);color:var(--warning)}
.badge-public{background:var(--success-bg);color:var(--success)}
.deprecated-notice{display:flex;align-items:center;gap:6px;background:var(--danger-bg);color:var(--danger);border-radius:var(--radius-md);padding:8px 14px;font-size:13px;margin-top:10px;border:1px solid var(--danger)}
.since-label{font-size:11px;color:var(--text3);margin-top:4px}
.params-table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
.params-table th{text-align:left;padding:7px 12px;background:var(--surface-hover);color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);font-family:var(--font-mono)}
.params-table td{padding:9px 12px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:top;line-height:1.5}
.params-table td code{background:var(--surface-hover);padding:1px 5px;border-radius:3px;font-size:12px;color:var(--text2)}
.params-table td:first-child code{color:var(--text);font-weight:600}
.returns{margin-top:12px;font-size:13px;color:var(--text2);padding-top:10px;border-top:1px solid var(--border)}
.returns code{background:var(--surface-hover);padding:1px 6px;border-radius:3px;font-family:var(--font-mono);font-size:12px}
.throws-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
.throws-table th{text-align:left;padding:7px 12px;background:var(--danger-bg);color:var(--danger);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--danger);font-family:var(--font-mono)}
.throws-table td{padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:top}
.throws-table td code{font-size:12px;color:var(--danger)}
.collapse-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;list-style:none;margin-top:16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);padding:0;font-family:var(--font-mono)}
.collapse-toggle::-webkit-details-marker{display:none}
.collapse-toggle::before{content:'';width:6px;height:6px;border-right:1.75px solid var(--text3);border-bottom:1.75px solid var(--text3);transform:rotate(-45deg);transition:transform var(--dur-fast) var(--ease);display:inline-block}
details[open] .collapse-toggle::before{transform:rotate(45deg)}
.collapse-body{margin-top:6px}
.method-row{margin-top:8px;padding:10px 0;border-top:1px solid var(--border)}
.method-sig{font-family:var(--font-mono);font-size:13px;color:var(--text)}
.method-desc{font-size:12px;color:var(--text3);margin-top:4px}
.source-link{font-size:11px;color:var(--text3);font-family:var(--font-mono);text-decoration:none;flex-shrink:0}
.source-link:hover{color:var(--accent);text-decoration:none}
.link-ref{color:var(--accent);text-decoration:none}
.link-ref:hover{text-decoration:underline}
.anchor-link{color:var(--text3);opacity:0;font-size:13px;margin-left:6px;transition:opacity var(--dur-fast) var(--ease)}
.card:hover .anchor-link{opacity:.6}
.anchor-link:hover{opacity:1;text-decoration:none}
.empty{color:var(--text3);font-size:13px;font-style:italic;padding:24px 32px}
.index-content{padding:36px 52px 80px}
.module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:8px}
.module-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px 20px;display:block;transition:border-color .15s,box-shadow .15s}
.module-card:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(115,130,255,.18);text-decoration:none}
.module-card-path{font-size:11px;font-weight:500;color:var(--text2);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.01em}
.module-card-path-sep{color:var(--text3);margin:0 3px;font-weight:400}
.module-card-name{font-size:14px;font-weight:700;color:var(--text);font-family:var(--font-mono);margin-bottom:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.module-card-stats{font-size:12px;color:var(--text3)}
.module-card-desc{font-size:12px;color:var(--text3);margin-top:6px;line-height:1.4}
.tok-kw{color:#79b8ff;font-weight:500}
.tok-str{color:#9ecbff}
.tok-cmt{color:#4a6f8a;font-style:italic}
.tok-num{color:#f8b26a}
.tok-type{color:#c792ea}
.hamburger{display:none;flex-direction:column;gap:5px;background:transparent;border:none;padding:6px 8px;cursor:pointer;border-radius:6px}
.hamburger span{width:20px;height:2px;background:var(--text2);border-radius:2px;display:block;transition:all .2s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
@media(max-width:1100px){.card{grid-template-columns:1fr 300px}.layout-toc{grid-template-columns:var(--sidebar-w) 1fr}.toc{display:none}}
@media(max-width:860px){.card{grid-template-columns:1fr}.card-prose{border-right:none;border-bottom:1px solid var(--border)}.page-header,.index-content{padding-left:24px;padding-right:24px}.section-title{padding-left:24px;padding-right:24px}.card-prose{padding-left:24px;padding-right:24px}}
@media(max-width:720px){.layout{grid-template-columns:1fr}.sidebar{position:fixed;top:var(--topnav-h);left:0;height:calc(100vh - var(--topnav-h));z-index:100;transform:translateX(-100%);transition:transform .25s ease;width:var(--sidebar-w)}.sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,.15)}.hamburger{display:flex}}
@media print{.sidebar,.topnav,.hamburger,.copy-btn,.toc{display:none!important}.layout{grid-template-columns:1fr!important;display:block}.card{display:block;break-inside:avoid;border:1px solid #ccc;margin-bottom:16px}.card-code{background:#f5f5f5;color:#333}}
.topnav-quality-link{font-size:13px;font-weight:600;color:var(--text2);text-decoration:none;white-space:nowrap;flex-shrink:0;margin-left:-8px}
.topnav-quality-link:hover{color:var(--accent);text-decoration:none}
.qstat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin:8px 0 24px}
.qstat-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;text-align:center}
.qstat-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:4px}
.qstat-value{font-size:22px;font-weight:700;color:var(--text)}
.qsub-title{font-size:13px;font-weight:700;color:var(--text2);margin:22px 0 8px}
.qtable-wrap{overflow-x:auto}
.qtable{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px}
.qtable th{text-align:left;padding:6px 10px;background:var(--surface-hover);color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);font-family:var(--font-mono)}
.qtable td{padding:7px 10px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:top}
.qtable tbody tr:nth-child(even){background:rgba(255,255,255,.02)}
.qtable td code{background:var(--surface-hover);padding:1px 5px;border-radius:3px;font-size:12px}
.qempty{color:var(--text3);font-size:13px;font-style:italic;padding:4px 0 16px}
.qcard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:16px 0 24px}
.qcard{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.qcard-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;font-family:var(--font-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qcard-statline{font-size:12px;color:var(--text3);margin-top:2px;padding:0 16px}
.arch-tree>details{margin-bottom:2px}
.arch-tree .collapse-toggle{margin-top:10px;flex-wrap:wrap;row-gap:4px}
.arch-tree .collapse-body{margin-top:4px;margin-left:2px;padding-left:16px;border-left:1px solid var(--border)}
.arch-node-name{font-weight:700}
.arch-badges{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px;margin-left:10px}
.arch-badge{display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;font-family:var(--font-mono);padding:2px 8px;border-radius:var(--radius-pill);border:1px solid transparent;line-height:1.5;white-space:nowrap}
@media(max-width:720px){.arch-badges{margin-left:22px;width:100%;margin-top:2px}}
.qcard-preview{display:flex;flex-direction:column}
.qcard-row{display:flex;justify-content:space-between;gap:8px;padding:5px 0;font-size:12.5px;border-bottom:1px solid var(--border);color:var(--text2);font-family:var(--font-mono)}
.qcard-row:last-child{border-bottom:none}
.qcard-row a{color:var(--accent);text-decoration:none}
.qcard-row a:hover{text-decoration:underline}
.qcard-more{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-family:var(--font-mono);text-decoration:none;display:inline-flex;align-items:center;gap:4px;transition:opacity var(--dur-fast) var(--ease)}
.qcard-more:hover{opacity:.7}
.focus-btn{display:flex;justify-content:center;font:var(--text-mono-badge);letter-spacing:var(--tracking-mono-label);text-transform:uppercase;border-radius:var(--radius-pill);padding:10px 16px;margin-top:6px;text-decoration:none;transition:filter .15s ease}
.focus-btn:hover{filter:brightness(0.92);text-decoration:none}
.focus-btn:active{filter:brightness(0.85)}
.qback{display:inline-block;font-size:13px;color:var(--accent);text-decoration:none;margin-bottom:16px}
.qback:hover{text-decoration:underline}
.qstrip{margin:0 32px 16px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;display:flex;flex-wrap:wrap}
.qchip{display:flex;flex-direction:column;padding:4px 14px;border-right:1px solid var(--border);min-width:84px}
.qchip:last-child{border-right:none}
.qchip-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text3)}
.qchip-value{font-size:14px;font-weight:700;color:var(--text);font-family:var(--font-mono);margin-top:1px}
.qchip-value a{text-decoration:none}
.qchip-value a:hover{text-decoration:underline}
.qchip-empty{padding:6px 14px;font-size:12.5px;color:var(--text3);font-style:italic}
.qcard-row a:focus-visible,.qcard-more:focus-visible,.qback:focus-visible,.qchip-value a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:2px}
@media(max-width:720px){.qstrip{margin-left:24px;margin-right:24px}.qchip{border-right:none;border-bottom:1px solid var(--border);width:50%}.qchip:nth-child(odd){border-right:1px solid var(--border)}}
.qhero{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:24px 28px;display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin:8px 0 20px}
.qhero-gauge{position:relative;width:168px;height:168px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center}
.qhero-gauge-svg{position:absolute;inset:0;transform:rotate(0deg)}
.qhero-gauge-inner{position:absolute;inset:13px;border-radius:50%;background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.qhero-grade{font-size:44px;font-weight:800;line-height:1}
.qhero-score{font-size:21px;font-weight:700;color:#fff;margin-top:3px}
.qhero-score-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--code-text);margin-top:3px}
.qhero-divider{width:1px;align-self:stretch;background:rgba(255,255,255,.14);flex:none}
.qhero-metrics{display:flex;flex-direction:column;gap:7px;flex:none;min-width:180px}
.qhero-metric{display:flex;align-items:center;gap:8px;font-size:11.5px}
.qhero-metric-dot{width:7px;height:7px;border-radius:50%;flex:none}
.qhero-metric-label{text-transform:uppercase;letter-spacing:.05em;font-size:10.5px;color:var(--code-text);flex:1}
.qhero-metric-value{font-weight:700;color:#fff;font-family:var(--font-mono);font-size:12.5px}
.qhero-trend{flex:1;min-width:200px}
.qhero-trend-badge{display:inline-block;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:4px 10px;border-radius:99px;margin-bottom:8px}
.qhero-sparkline{display:block}
.qhero-trend-caption{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--code-text);margin-top:4px}
.qhero-trend-empty{font-size:12.5px;line-height:1.5;color:var(--code-text);max-width:340px}
.qhero-trend-empty code{color:#fff;font-size:11.5px}
@media(max-width:720px){.qhero{flex-direction:column;align-items:stretch}.qhero-divider{display:none}}
.qcard2{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden;display:flex;flex-direction:column}
.qcard2-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)}
.qcard2-head-left{display:flex;align-items:center;gap:8px;min-width:0}
.qcard2-body{padding:6px 16px 14px;display:flex;flex-direction:column;gap:2px;flex:1}
.qcard2-bigvalue{font-size:20px;font-weight:600;font-family:var(--font-display);line-height:1;font-variant-numeric:tabular-nums;flex-shrink:0}
.qcard2-foot{padding:10px 16px;border-top:1px solid var(--border)}
.tag-chip{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)}
.badge-pill{display:flex;align-items:stretch;border-radius:var(--radius-pill);overflow:hidden;flex:none;border:1.5px solid #fff}
.badge-label{font:var(--text-mono-badge);letter-spacing:var(--tracking-mono-label);text-transform:uppercase;background:var(--black);color:var(--gray-300);padding:7px 13px;display:flex;align-items:center}
.badge-value{font:700 12px var(--font-mono);padding:7px 13px;display:flex;align-items:center;justify-content:flex-end;flex:1}
.insight-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--border-on-light)}
.insight-row:last-child{border-bottom:none}
.insight-primary{font:13px/1.4 var(--font-mono);color:var(--black);word-break:break-all}
.insight-secondary{font:12px/1.4 var(--font-mono);color:var(--gray-500);word-break:break-all;margin-top:2px}
.qcard-expand{margin-top:2px}
.qcard-expand-toggle{cursor:pointer;list-style:none;font-size:12px;font-weight:600;color:var(--accent);padding:2px 0;user-select:none;display:flex;align-items:center;gap:5px}
.qcard-expand-toggle::-webkit-details-marker{display:none}
.qcard-expand-toggle::before{content:'';width:5px;height:5px;border-right:1.75px solid var(--accent);border-bottom:1.75px solid var(--accent);transform:rotate(-45deg);transition:transform var(--dur-fast) var(--ease);display:inline-block}
details[open]>.qcard-expand-toggle::before{transform:rotate(45deg)}
.qcard-expand-body{padding-top:4px}
.qcard-expand-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:2px}
.qhero-file{margin:0 32px 24px}
.qhero-gauge-sm{width:104px;height:104px}
.qhero-gauge-inner-sm{inset:9px}
.qhero-score-sm{font-size:15px;margin-top:2px}
.qhero-grade-sm{font-size:24px}
.qhero-metrics-grid{display:grid;grid-template-columns:repeat(3,auto);gap:6px 22px}
.qhero-file-side{display:flex;flex-direction:column;gap:8px}
.qhero-file-chips{display:flex;flex-wrap:wrap;gap:8px}
.qhero-file-chip{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#fff;padding:4px 10px;border-radius:99px}
.qhero-file-chip-muted{background:rgba(255,255,255,.12);color:var(--code-text)}
.qhero-file-narrative{font-size:13px;line-height:1.5;color:#fff}
@media(max-width:720px){.qhero-file{margin-left:24px;margin-right:24px}.qhero-metrics-grid{grid-template-columns:1fr 1fr}}
.qfn-chip-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:8px 0;padding:6px 10px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm,6px)}
.qfn-grade{font-family:var(--font-mono,monospace);font-weight:700;font-size:12px}
.qfn-metric-dots{display:inline-flex;align-items:center;gap:4px}
.qfn-metric-dot{width:6px;height:6px}
.qfn-smells{font-size:11px;color:var(--text3);font-style:italic}
.todo-badge{display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;background:var(--warning-bg);color:var(--warning);padding:2px 7px;border-radius:99px;margin-right:6px;vertical-align:middle;font-family:var(--font-mono)}
.todo-text{font-style:italic;color:var(--text3)}
.sidebar-brand{padding:0 16px;display:flex;align-items:center;gap:9px;height:56px;border-bottom:1px solid var(--border)}
.sidebar-mark{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:var(--radius-md);background:var(--accent);color:var(--bg);flex-shrink:0}
.sidebar-logo{font-size:13px;font-weight:600;color:var(--sidebar-text-hover);letter-spacing:-.01em;font-family:var(--font-display)}
.sidebar-version{padding:8px 16px 4px;font-size:10px;font-weight:600;letter-spacing:.05em;color:var(--text3);font-family:var(--font-mono)}
.navbtn{display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:0;border:none;border-left:2px solid transparent;cursor:pointer;background:transparent;color:var(--sidebar-text);font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:none;font-family:var(--font-body);width:100%;text-align:left;box-sizing:border-box;text-decoration:none;margin-bottom:1px;transition:background var(--dur-fast) var(--ease),color var(--dur-fast) var(--ease)}
.navbtn:hover{background:var(--sidebar-hover-bg);color:var(--sidebar-text-hover);text-decoration:none}
.navbtn.active{background:var(--surface-hover);color:var(--sidebar-text-hover);border-left-color:var(--accent)}
.sidebar-nav-section{padding:16px 16px 4px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:var(--sidebar-section);font-family:var(--font-mono)}
.topnav-crumb{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topnav-crumb a{color:var(--text3)}
.topnav-crumb a:hover{color:var(--accent)}
.topnav-crumb-sep{color:var(--border);margin:0 2px}
.version-switcher{position:relative;flex:none;margin-left:auto}
.version-switcher-trigger{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--radius-pill);border:1px solid var(--border);background:var(--gray-100);cursor:pointer;list-style:none;font:var(--text-mono-label);letter-spacing:var(--tracking-mono-label);text-transform:uppercase;color:var(--text2)}
.version-switcher-trigger::-webkit-details-marker{display:none}
.version-switcher-trigger:hover{background:var(--surface-hover)}
details.version-switcher[open]>.version-switcher-trigger{background:var(--surface-hover)}
.version-switcher-trigger:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.version-switcher-chevron{transition:transform var(--dur-normal) var(--ease)}
details.version-switcher[open]>.version-switcher-trigger .version-switcher-chevron{transform:rotate(180deg)}
.version-switcher-menu{position:absolute;right:0;top:calc(100% + 8px);background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-card);border:1px solid var(--border);min-width:220px;max-height:320px;overflow-y:auto;padding:6px;z-index:250}
.version-switcher-item{display:block;padding:9px 12px;border-radius:var(--radius-sm);font:13px var(--font-body);color:var(--text2);text-decoration:none;margin-bottom:2px}
.version-switcher-item:last-child{margin-bottom:0}
.version-switcher-item:hover{background:var(--surface-hover);text-decoration:none}
.version-switcher-item:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.version-switcher-item.is-current{color:var(--accent);font-weight:600;background:var(--surface-hover)}
.version-switcher-static{display:inline-flex;align-items:center;padding:6px 14px;border-radius:var(--radius-pill);background:var(--gray-100);font:var(--text-mono-label);letter-spacing:var(--tracking-mono-label);text-transform:uppercase;color:var(--text2);flex:none;margin-left:auto}
`;

// ---------------------------------------------------------------------------
// App JS (written to assets/app.js)
// ---------------------------------------------------------------------------

const CLIENT_JS = `
(function(){
  var _pfx=window.location.pathname.indexOf('/modules/')!==-1?'../':'';
  // Copy
  document.addEventListener('click',function(e){
    var b=e.target.closest('.copy-btn');
    if(!b) return;
    var pre=b.closest('.card-code')&&b.closest('.card-code').querySelector('pre');
    var text=b.dataset.sig||(pre&&pre.textContent)||'';
    navigator.clipboard.writeText(text).then(function(){
      var orig=b.textContent;b.textContent='Copied!';b.classList.add('copied');
      setTimeout(function(){b.textContent=orig;b.classList.remove('copied');},1500);
    });
  });
  // Search
  var INDEX=(window.__SEARCH_INDEX__||[]).map(function(r){return{name:r.name,kind:r.kind,module:r.module,body:r.body,url:_pfx+r.url};});
  var box=document.getElementById('search-box');
  var panel=document.getElementById('search-results');
  if(box&&panel){
    function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
    function render(items){
      panel.innerHTML=items.length?items.slice(0,20).map(function(r){return'<a class="search-result-item" href="'+r.url+'"><span class="sr-name">'+esc(r.name)+'</span><span class="sr-kind">'+esc(r.kind)+'</span><span class="sr-module">'+esc(r.module)+'</span>'+(r.body?'<span class="sr-preview">'+esc(r.body.slice(0,80))+'</span>':'')+'</a>';}).join(''):'<div class="search-no-results">No results</div>';
      panel.classList.add('visible');
    }
    function search(q){
      q=q.trim().toLowerCase();
      if(!q){panel.classList.remove('visible');return;}
      render(INDEX.filter(function(r){return r.name.toLowerCase().includes(q)||r.module.toLowerCase().includes(q)||(r.body&&r.body.toLowerCase().includes(q));}));
    }
    box.addEventListener('input',function(){search(box.value);});
    box.addEventListener('focus',function(){if(box.value.trim())search(box.value);});
    document.addEventListener('click',function(e){if(!box.contains(e.target)&&!panel.contains(e.target))panel.classList.remove('visible');});
    document.addEventListener('keydown',function(e){
      if(e.key==='/'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();box.focus();box.select();}
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();box.focus();box.select();}
      if(e.key==='Escape')panel.classList.remove('visible');
    });
  }
  // TOC scroll-spy
  var tocItems=document.querySelectorAll('.toc-item[data-anchor]');
  if(tocItems.length){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var id=entry.target.id;
          tocItems.forEach(function(a){
            a.classList.toggle('active',a.dataset.anchor===id);
          });
        }
      });
    },{rootMargin:'-56px 0px -60% 0px',threshold:0});
    tocItems.forEach(function(a){
      var el=document.getElementById(a.dataset.anchor);
      if(el) io.observe(el);
    });
  }
  // Hamburger (overlay sidebar)
  var hamburger=document.getElementById('hamburger');
  var sidebar=document.querySelector('.sidebar');
  if(hamburger&&sidebar){
    hamburger.addEventListener('click',function(){var open=sidebar.classList.toggle('open');hamburger.classList.toggle('open',open);});
    document.addEventListener('click',function(e){if(sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&!hamburger.contains(e.target)){sidebar.classList.remove('open');hamburger.classList.remove('open');}});
  }
  // Sidebar tree: roving tabindex + arrow-key navigation (design-spec §3 Part 1)
  var tree=document.querySelector('.sidebar-inner[role="tree"]');
  if(tree){
    function visibleItems(){
      // offsetParent is null for elements inside a closed <details> (no layout box),
      // so this naturally skips children of collapsed directories.
      return Array.prototype.slice.call(tree.querySelectorAll('[role="treeitem"]')).filter(function(el){
        return el.offsetParent!==null;
      });
    }
    function setActiveTabIndex(el){
      Array.prototype.forEach.call(tree.querySelectorAll('[role="treeitem"]'),function(it){it.setAttribute('tabindex','-1');});
      el.setAttribute('tabindex','0');
    }
    // Initialize: focus lands on the aria-selected item, else the first visible treeitem
    var initial=tree.querySelector('[role="treeitem"][aria-selected="true"]')||visibleItems()[0];
    if(initial) setActiveTabIndex(initial);
    function isDir(el){return el.tagName==='SUMMARY';}
    function parentDetails(el){return el.closest('details');}
    function focusItem(el){if(el){setActiveTabIndex(el);el.focus();}}
    tree.addEventListener('keydown',function(e){
      var el=e.target;
      if(!el||el.getAttribute('role')!=='treeitem') return;
      var items=visibleItems();
      var idx=items.indexOf(el);
      if(e.key==='ArrowDown'){
        e.preventDefault();
        if(idx<items.length-1) focusItem(items[idx+1]);
      } else if(e.key==='ArrowUp'){
        e.preventDefault();
        if(idx>0) focusItem(items[idx-1]);
      } else if(e.key==='ArrowRight'){
        e.preventDefault();
        if(isDir(el)){
          var det=parentDetails(el);
          if(det&&!det.open){ det.open=true; el.setAttribute('aria-expanded','true'); }
          else {
            var next=items[idx+1];
            if(next) focusItem(next);
          }
        }
      } else if(e.key==='ArrowLeft'){
        e.preventDefault();
        if(isDir(el)){
          var det2=parentDetails(el);
          if(det2&&det2.open){ det2.open=false; el.setAttribute('aria-expanded','false'); return; }
        }
        // Move focus to the parent dir's <summary> (file, or already-collapsed dir)
        var ownerDetails=el.parentElement&&el.parentElement.tagName==='DETAILS'?el.parentElement:parentDetails(el);
        var grandParentDetails=ownerDetails&&ownerDetails.parentElement&&ownerDetails.parentElement.closest('details');
        if(grandParentDetails){
          var gpSummary=grandParentDetails.querySelector(':scope > summary');
          if(gpSummary) focusItem(gpSummary);
        }
      } else if(e.key==='Home'){
        e.preventDefault();
        if(items[0]) focusItem(items[0]);
      } else if(e.key==='End'){
        e.preventDefault();
        if(items.length) focusItem(items[items.length-1]);
      }
    });
  }
})();
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function badge(label, cls) {
    return '<span class="badge badge-' + cls + '">' + esc(label) + "</span>";
}
function anchorId(kind, name) {
    return kind + "-" + name.replace(/[^a-zA-Z0-9_]/g, "_");
}
function copyBtn(sig) {
    return '<button class="copy-btn" data-sig="' + esc(sig) + '" title="Copy">Copy</button>';
}

// ---------------------------------------------------------------------------
// Icons -- pure line SVGs (lucide paths, stroke-width 1.75), per design-system
// §6.1 ("zero filled variations, no emojis, visual cohesion with Lucide").
// Replaces the old unicode-glyph icons (▶, &#9888;) site-wide.
// ---------------------------------------------------------------------------

var ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "alert-triangle":
        '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "arrow-up-right": '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
    "file-x":
        '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="9.5" y1="12.5" x2="14.5" y2="17.5"/><line x1="14.5" y1="12.5" x2="9.5" y2="17.5"/>',
    "external-link":
        '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
};

/**
 * Renders a named lucide-style line icon as inline SVG (design-system
 * §6.1: pure SVG, `stroke-width:1.75`, rounded caps/joins, 24x24 default
 * bounding box). Unknown names render nothing rather than throwing --
 * callers pass a literal string, so a typo should degrade silently, not
 * break page render.
 * @param {string} name - one of ICON_PATHS's keys.
 * @param {number} [size] - width/height in px, default 16.
 * @param {string} [cls] - optional extra CSS class on the <svg>.
 * @returns {string}
 */
function icon(name, size, cls) {
    var d = ICON_PATHS[name];
    if (!d) return "";
    return (
        '<svg class="icon' +
        (cls ? " " + cls : "") +
        '" width="' +
        (size || 16) +
        '" height="' +
        (size || 16) +
        '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        d +
        "</svg>"
    );
}

/**
 * True when `s` is a `--fix`-generated placeholder, per `lib/fix.js`'s own
 * literal templates (`TODO_DESCRIPTION`, `TODO_RETURNS_DESCRIPTION`, the
 * per-param `TODO: describe parameter "x".` template) -- all start with
 * "TODO:" by design (see `lib/fix.js`'s own comment: "Every one is
 * prefixed 'TODO:' on purpose"). Matches that exact, existing convention;
 * invents nothing new (story-file-detail-redesign, ADR Decision 2).
 * @param {string} s
 * @returns {boolean}
 */
function isTodoText(s) {
    // Param descriptions keep a leading "- " separator from the raw JSDoc
    // (`@param {T} name - description`) even when the description itself is
    // a --fix-generated TODO -- match with or without that prefix rather
    // than assuming TODO: always starts at position 0.
    return typeof s === "string" && /^-?\s*TODO:/.test(s);
}

/**
 * Renders a description string, flagging `--fix`-generated TODO
 * placeholders with a distinct badge + muted italic text instead of
 * rendering them identically to real authored prose. The underlying text
 * is unchanged either way -- this is presentation-only.
 * @param {string} s
 * @returns {string}
 */
function descText(s) {
    if (!s) return "";
    if (isTodoText(s)) {
        return '<span class="todo-badge">todo</span><span class="todo-text">' + esc(s.replace(/^-?\s*TODO:\s*/, "")) + "</span>";
    }
    return esc(s);
}

function metaHtml(item) {
    var out = "";
    if (item.deprecated != null)
        out +=
            '<div class="deprecated-notice">' + icon("alert-triangle", 13) + " Deprecated" +
            (item.deprecated ? ": " + esc(item.deprecated) : "") +
            "</div>";
    if (item.since) out += '<div class="since-label">Since v' + esc(item.since) + "</div>";
    return out;
}

/**
 * Server-side tokenizer for JS/TS @example blocks.
 * Returns HTML with tok-* spans. Processes strings, comments, numbers, keywords.
 */
function highlightCode(raw) {
    if (!raw) return "";
    var out = "";
    var KW =
        /\b(function|class|const|let|var|return|new|if|else|for|while|import|export|from|async|await|try|catch|throw|extends|implements|type|interface|enum|this|super|null|undefined|true|false|typeof|instanceof|of|in|do|switch|case|default|break|continue|static|readonly|abstract|private|protected|public|override|declare|namespace|as|satisfies)\b/g;
    var re = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(["'`])(?:(?!\3)[^\\]|\\.)*\3|\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g;
    var last = 0;
    var m;
    while ((m = re.exec(raw)) !== null) {
        if (m.index > last) {
            // Tokenize the plain segment for keywords
            out += esc(raw.slice(last, m.index)).replace(KW, function (kw) {
                return '<span class="tok-kw">' + kw + "</span>";
            });
        }
        if (m[1] || m[2]) out += '<span class="tok-cmt">' + esc(m[0]) + "</span>";
        else if (m[3]) out += '<span class="tok-str">' + esc(m[0]) + "</span>";
        else if (m[4]) out += '<span class="tok-num">' + esc(m[0]) + "</span>";
        else out += esc(m[0]);
        last = m.index + m[0].length;
    }
    if (last < raw.length) {
        out += esc(raw.slice(last)).replace(KW, function (kw) {
            return '<span class="tok-kw">' + kw + "</span>";
        });
    }
    return out;
}

function descHtml(item, symbolMap, filePath) {
    var out = "";
    if (item.description) {
        var body = isTodoText(item.description)
            ? descText(item.description)
            : symbolMap
              ? resolveLinks(item.description, symbolMap, filePath)
              : esc(item.description);
        out += '<div class="card-desc">' + body + "</div>";
    }
    out += metaHtml(item);
    return out;
}

function renderParams(params, jsdocParams) {
    if (!params || !params.length) return "";
    var jmap = {};
    (jsdocParams || []).forEach(function (p) {
        jmap[p.name] = p;
    });
    var html =
        '<table class="params-table"><thead><tr><th>Parameter</th><th>Type</th><th>Optional</th><th>Description</th></tr></thead><tbody>';
    params.forEach(function (p) {
        var jp = jmap[p.name] || {};
        var type = jp.type && jp.type !== "any" ? jp.type : p.type;
        html +=
            "<tr><td><code>" +
            esc(p.name) +
            "</code></td><td><code>" +
            esc(type) +
            "</code></td><td>" +
            (p.optional || jp.optional ? "yes" : "") +
            "</td><td>" +
            (jp.description ? descText(jp.description) : "") +
            "</td></tr>";
    });
    return html + "</tbody></table>";
}

function renderReturns(returnType, returnsTag) {
    var type = returnsTag && returnsTag.type && returnsTag.type !== "any" ? returnsTag.type : returnType;
    var desc = returnsTag && returnsTag.description ? "&mdash; " + descText(returnsTag.description) : "";
    return '<div class="returns">Returns: <code>' + esc(type) + "</code> " + desc + "</div>";
}

function renderThrows(throws) {
    if (!throws || !throws.length) return "";
    var html = '<table class="throws-table"><thead><tr><th>Throws</th><th>Description</th></tr></thead><tbody>';
    throws.forEach(function (t) {
        html +=
            "<tr><td><code>" + esc(t.type || "Error") + "</code></td><td>" + esc(t.description || "") + "</td></tr>";
    });
    return html + "</tbody></table>";
}

function resolveLinks(text, symbolMap, filePath, moduleHtmlPathFn, modules) {
    if (!text || !symbolMap) return esc(text);
    return esc(text).replace(/\{@link ([^}]+)\}/g, function (_, ref) {
        var parts = ref.trim().split("#");
        var sym = parts[0].trim();
        var method = parts[1] ? parts[1].trim() : null;
        var entry = symbolMap[sym];
        if (!entry) return "<code>" + esc(ref) + "</code>";
        var targetPath = entry.modulePath;
        var href = targetPath === filePath ? "" : targetPath || "";
        if (method) href += "#meth-" + sym + "_" + method;
        else href += "#" + entry.anchorId;
        return (
            '<a href="' + href + '" class="link-ref"><code>' + esc(sym + (method ? "." + method : "")) + "</code></a>"
        );
    });
}

function sourceLink(item, filePath, sourceUrl) {
    if (item.line == null) return "";
    var label = "line " + item.line;
    // Defensive: filePath should always be the owning module's mod.filePath,
    // but a malformed/synthetic module entry (e.g. from an upstream
    // extraction edge case) could theoretically omit it -- degrade to a
    // filePath-less line label rather than throwing and aborting the whole
    // site build over one bad item (found during phase-o visual QA; not
    // this pass's scope to root-cause the upstream data gap, see lessons.md).
    if (!filePath) return '<span class="source-link">' + esc(label) + "</span>";
    if (sourceUrl) {
        var base = sourceUrl.replace(/\/$/, "");
        var rel = filePath.replace(/\\/g, "/");
        var href = base + "/" + rel + "#L" + item.line;
        return '<a class="source-link" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + "</a>";
    }
    return '<span class="source-link">' + esc(filePath.replace(/\\/g, "/")) + ":" + item.line + "</span>";
}

function collapsible(label, html, open) {
    return (
        "<details" +
        (open ? " open" : "") +
        '><summary class="collapse-toggle">' +
        esc(label) +
        '</summary><div class="collapse-body">' +
        html +
        "</div></details>"
    );
}

// ---------------------------------------------------------------------------
// Card / render helpers
// ---------------------------------------------------------------------------

function buildFnSig(fn) {
    var ps = (fn.params || [])
        .map(function (p) {
            return p.name + (p.optional ? "?" : "") + ": " + p.type;
        })
        .join(", ");
    var ret = fn.returnType && fn.returnType !== "void" ? ": " + fn.returnType : "";
    return (fn.isAsync ? "async " : "") + fn.name + "(" + ps + ")" + ret;
}

function buildClassSig(cls) {
    var ext = cls.extends && cls.extends.length ? " extends " + cls.extends.join(", ") : "";
    var impl = cls.implements && cls.implements.length ? " implements " + cls.implements.join(", ") : "";
    var base = (cls.isAbstract ? "abstract " : "") + "class " + cls.name + ext + impl + " {";
    if (cls.constructor) {
        var cp = (cls.constructor.params || [])
            .map(function (p) {
                return p.name + ": " + p.type;
            })
            .join(", ");
        base += "\n  constructor(" + cp + ")";
    }
    return base + "\n}";
}

function buildIfaceSig(iface) {
    var props = (iface.properties || []).slice(0, 8).map(function (p) {
        return "  " + p.name + (p.optional ? "?" : "") + ": " + p.type;
    });
    if ((iface.properties || []).length > 8) props.push("  // ...");
    return "interface " + iface.name + " {\n" + props.join("\n") + "\n}";
}

function card(id, kindClass, proseHtml, codeHtml) {
    return (
        '<div class="card ' +
        kindClass +
        '" id="' +
        id +
        '"><div class="card-prose">' +
        proseHtml +
        '</div><div class="card-code">' +
        codeHtml +
        "</div></div>"
    );
}

function codePanel(item, sigText) {
    var label = item.example ? "Example" : "Signature";
    var code = item.example ? highlightCode(item.example) : esc(sigText);
    return (
        '<div class="code-label">' +
        label +
        '</div><button class="copy-btn" data-sig="' +
        esc(sigText || "") +
        '">Copy</button><pre>' +
        code +
        "</pre>"
    );
}

function renderFunction(fn, filePath, sourceUrl, symbolMap, functionHealthLookup) {
    var id = anchorId("fn", fn.name);
    var sig = buildFnSig(fn);
    var badges = [
        fn.isAsync && badge("async", "async"),
        fn.isGenerator && badge("generator", "generator"),
        fn.deprecated != null && badge("deprecated", "deprecated"),
        fn.since && badge("since v" + fn.since, "since"),
    ]
        .filter(Boolean)
        .join("");
    var prose =
        '<div class="card-header"><div class="card-name"><a class="anchor-link" href="#' +
        id +
        '">#</a>' +
        esc(fn.name) +
        "</div>" +
        sourceLink(fn, filePath, sourceUrl) +
        "</div>" +
        (badges ? '<div style="margin-top:4px">' + badges + "</div>" : "") +
        (functionHealthLookup ? functionHealthChip(fn.name, fn.line, functionHealthLookup) : "") +
        descHtml(fn, symbolMap, filePath) +
        renderParams(fn.params, fn.jsdocParams) +
        (fn.returnType && fn.returnType !== "void" ? renderReturns(fn.returnType, fn.returns) : "") +
        renderThrows(fn.throws);
    return card(id, "card-fn", prose, codePanel(fn, sig));
}

function renderClass(cls, filePath, sourceUrl, symbolMap, functionHealthLookup) {
    var id = anchorId("cls", cls.name);
    var sig = buildClassSig(cls);
    var badges = [
        cls.isAbstract && badge("abstract", "abstract"),
        cls.deprecated != null && badge("deprecated", "deprecated"),
        cls.since && badge("since v" + cls.since, "since"),
    ]
        .filter(Boolean)
        .join("");
    var prose =
        '<div class="card-header"><div class="card-name"><a class="anchor-link" href="#' +
        id +
        '">#</a>' +
        esc(cls.name) +
        "</div>" +
        sourceLink(cls, filePath, sourceUrl) +
        "</div>" +
        (badges ? '<div style="margin-top:4px">' + badges + "</div>" : "") +
        descHtml(cls, symbolMap, filePath);
    if (cls.constructor) {
        var ctorSig =
            "new " +
            cls.name +
            "(" +
            (cls.constructor.params || [])
                .map(function (p) {
                    return p.name + ": " + p.type;
                })
                .join(", ") +
            ")";
        prose += collapsible(
            "Constructor",
            '<div class="method-row"><div class="method-sig">' +
                esc(ctorSig) +
                "</div>" +
                (functionHealthLookup ? functionHealthChip("constructor", cls.constructor.line, functionHealthLookup) : "") +
                (cls.constructor.description
                    ? '<div class="method-desc">' + descText(cls.constructor.description) + "</div>"
                    : "") +
                renderParams(cls.constructor.params, cls.constructor.jsdocParams) +
                renderThrows(cls.constructor.throws) +
                "</div>",
            true,
        );
    }
    if (cls.properties && cls.properties.length) {
        var propBody =
            '<table class="params-table"><thead><tr><th>Name</th><th>Type</th><th>Visibility</th><th>Flags</th><th>Description</th></tr></thead><tbody>';
        cls.properties.forEach(function (p) {
            var flags = [
                p.isStatic && badge("static", "static"),
                p.isReadonly && badge("readonly", "readonly"),
                p.isAbstract && badge("abstract", "abstract"),
                p.deprecated != null && badge("deprecated", "deprecated"),
            ]
                .filter(Boolean)
                .join("");
            propBody +=
                "<tr><td><code>" +
                esc(p.name) +
                "</code></td><td><code>" +
                esc(p.type) +
                "</code></td><td>" +
                badge(p.visibility, p.visibility) +
                "</td><td>" +
                flags +
                "</td><td>" +
                (p.description ? esc(p.description) : "") +
                "</td></tr>";
        });
        prose += collapsible("Properties (" + cls.properties.length + ")", propBody + "</tbody></table>", true);
    }
    if (cls.methods && cls.methods.length) {
        var methBody = "";
        cls.methods.forEach(function (m) {
            var ps = (m.params || [])
                .map(function (p) {
                    return p.name + ": " + p.type;
                })
                .join(", ");
            var mSig = m.name + "(" + ps + "): " + m.returnType;
            var mb = [
                badge(m.visibility, m.visibility),
                m.isStatic && badge("static", "static"),
                m.isAbstract && badge("abstract", "abstract"),
                m.isAsync && badge("async", "async"),
                m.deprecated != null && badge("deprecated", "deprecated"),
            ]
                .filter(Boolean)
                .join("");
            methBody +=
                '<div class="method-row"><div class="card-header" style="margin-bottom:4px"><code class="method-sig">' +
                esc(mSig) +
                "</code>" +
                copyBtn(mSig) +
                "</div><div>" +
                mb +
                "</div>" +
                (functionHealthLookup ? functionHealthChip(m.name, m.line, functionHealthLookup) : "") +
                (m.description ? '<div class="method-desc">' + descText(m.description) + "</div>" : "") +
                metaHtml(m) +
                renderParams(m.params, m.jsdocParams) +
                renderReturns(m.returnType, m.returns) +
                renderThrows(m.throws) +
                "</div>";
        });
        prose += collapsible("Methods (" + cls.methods.length + ")", methBody, true);
    }
    if (cls.getters && (cls.getters.length || (cls.setters || []).length)) {
        var accBody = "";
        cls.getters.forEach(function (g) {
            accBody +=
                '<div class="method-row"><code class="method-sig">get ' +
                esc(g.name) +
                "(): " +
                esc(g.returnType) +
                "</code>" +
                (g.isStatic ? badge("static", "static") : "") +
                (g.deprecated != null ? badge("deprecated", "deprecated") : "") +
                (functionHealthLookup ? functionHealthChip(g.name, g.line, functionHealthLookup) : "") +
                (g.description ? '<div class="method-desc">' + descText(g.description) + "</div>" : "") +
                "</div>";
        });
        (cls.setters || []).forEach(function (s) {
            var ps = (s.params || [])
                .map(function (p) {
                    return p.name + ": " + p.type;
                })
                .join(", ");
            accBody +=
                '<div class="method-row"><code class="method-sig">set ' +
                esc(s.name) +
                "(" +
                esc(ps) +
                ")</code>" +
                (s.isStatic ? badge("static", "static") : "") +
                (s.deprecated != null ? badge("deprecated", "deprecated") : "") +
                (functionHealthLookup ? functionHealthChip(s.name, s.line, functionHealthLookup) : "") +
                (s.description ? '<div class="method-desc">' + descText(s.description) + "</div>" : "") +
                "</div>";
        });
        prose += collapsible("Accessors (" + (cls.getters.length + (cls.setters || []).length) + ")", accBody, false);
    }
    return card(id, "card-cls", prose, codePanel(cls, sig));
}

function renderInterface(iface, filePath, sourceUrl, symbolMap) {
    var id = anchorId("iface", iface.name);
    var sig = buildIfaceSig(iface);
    var prose =
        '<div class="card-header"><div class="card-name"><a class="anchor-link" href="#' +
        id +
        '">#</a>' +
        esc(iface.name) +
        "</div>" +
        sourceLink(iface, filePath, sourceUrl) +
        "</div>" +
        (iface.deprecated != null ? badge("deprecated", "deprecated") : "") +
        descHtml(iface, symbolMap, filePath);
    if (iface.properties && iface.properties.length) {
        prose +=
            '<table class="params-table" style="margin-top:12px"><thead><tr><th>Property</th><th>Type</th><th>Optional</th></tr></thead><tbody>';
        iface.properties.forEach(function (p) {
            prose +=
                "<tr><td><code>" +
                esc(p.name) +
                "</code></td><td><code>" +
                esc(p.type) +
                "</code></td><td>" +
                (p.optional ? "yes" : "") +
                "</td></tr>";
        });
        prose += "</tbody></table>";
    }
    if (iface.methods && iface.methods.length) {
        var mb = "";
        iface.methods.forEach(function (m) {
            var ps = m.params
                .map(function (p) {
                    return p.name + ": " + p.type;
                })
                .join(", ");
            mb +=
                '<div class="method-row"><code class="method-sig">' +
                esc(m.name) +
                "(" +
                esc(ps) +
                "): " +
                esc(m.returnType) +
                "</code>" +
                (m.optional ? badge("optional", "optional") : "") +
                "</div>";
        });
        prose += collapsible("Methods (" + iface.methods.length + ")", mb, true);
    }
    return card(id, "card-iface", prose, codePanel(iface, sig));
}

function renderEnum(enm, filePath, sourceUrl, symbolMap) {
    var id = anchorId("enum", enm.name);
    var sig =
        "enum " +
        enm.name +
        " {\n" +
        (enm.members || [])
            .slice(0, 8)
            .map(function (m) {
                return "  " + m.name + (m.value !== null ? " = " + m.value : "");
            })
            .join(",\n") +
        ((enm.members || []).length > 8 ? ",\n  // ..." : "") +
        "\n}";
    var prose =
        '<div class="card-header"><div class="card-name"><a class="anchor-link" href="#' +
        id +
        '">#</a>' +
        esc(enm.name) +
        "</div>" +
        sourceLink(enm, filePath, sourceUrl) +
        "</div>" +
        (enm.deprecated != null ? badge("deprecated", "deprecated") : "") +
        descHtml(enm, symbolMap, filePath) +
        '<table class="params-table" style="margin-top:12px"><thead><tr><th>Member</th><th>Value</th></tr></thead><tbody>' +
        (enm.members || [])
            .map(function (m) {
                return (
                    "<tr><td><code>" +
                    esc(m.name) +
                    "</code></td><td>" +
                    (m.value !== null ? "<code>" + esc(m.value) + "</code>" : "") +
                    "</td></tr>"
                );
            })
            .join("") +
        "</tbody></table>";
    return card(id, "card-enum", prose, codePanel(enm, sig));
}

function renderTypeAlias(ta, filePath, sourceUrl, symbolMap) {
    var id = anchorId("type", ta.name);
    var sig = "type " + ta.name + " = " + ta.type;
    var prose =
        '<div class="card-header"><div class="card-name"><a class="anchor-link" href="#' +
        id +
        '">#</a>' +
        esc(ta.name) +
        "</div>" +
        sourceLink(ta, filePath, sourceUrl) +
        '</div><div class="card-sig">' +
        esc(sig) +
        "</div>" +
        (ta.deprecated != null ? badge("deprecated", "deprecated") : "") +
        descHtml(ta, symbolMap, filePath);
    return card(id, "card-type", prose, codePanel(ta, sig));
}

function renderVariable(v, filePath, sourceUrl, symbolMap) {
    var id = anchorId("var", v.name);
    var decl = (v.isConst ? "const" : "let") + " " + v.name + ": " + v.type;
    var prose =
        '<div class="card-header"><div class="card-name"><a class="anchor-link" href="#' +
        id +
        '">#</a>' +
        esc(v.name) +
        "</div>" +
        sourceLink(v, filePath, sourceUrl) +
        '</div><div class="card-sig">' +
        esc(decl) +
        "</div>" +
        badge(v.isConst ? "const" : "var", v.isConst ? "const" : "var") +
        (v.deprecated != null ? badge("deprecated", "deprecated") : "") +
        descHtml(v, symbolMap, filePath);
    return card(id, "card-var", prose, codePanel(v, decl));
}

function section(title, items, renderFn, filePath, sourceUrl, symbolMap, functionHealthLookup) {
    if (!items || !items.length) return "";
    return (
        '<div class="section"><div class="section-title">' +
        esc(title) +
        '<span class="section-count">(' +
        items.length +
        ")</span></div>" +
        items
            .map(function (item) {
                return renderFn(item, filePath, sourceUrl, symbolMap, functionHealthLookup);
            })
            .join("") +
        "</div>"
    );
}

// ---------------------------------------------------------------------------
// Module label helpers
// ---------------------------------------------------------------------------

// task-ls-03: commonRoot(modules) used to re-walk every module's split file
// path on every call. It's reached via moduleLabel/moduleHtmlPath once per
// sidebar tree leaf, on every buildSidebar() call (i.e. once per page) --
// see adr-linear-scaling-fix.md for the full O(N^3) call chain this closes
// off. Cache is keyed on the `modules` ARRAY REFERENCE, not on any string
// derived from it -- string-keying was considered and rejected (ADR
// Alternatives): two independent buildSite() calls could contain modules
// with identical filePath strings but a different shared root, and a
// string-keyed cache would leak/bleed a stale label between those calls.
// A WeakMap keyed on the array reference is call-scoped by construction
// (each buildSite() call builds its own `modules` array) and gives that
// isolation for free, with no manual invalidation and no memory-leak risk
// (WeakMap entries are GC'd once the modules array itself is unreachable).
var commonRootCache = new WeakMap();

function commonRoot(modules) {
    if (!modules.length) return "";
    if (commonRootCache.has(modules)) return commonRootCache.get(modules);
    var parts = modules.map(function (m) {
        return m.filePath.replace(/\\/g, "/").split("/");
    });
    var min =
        Math.min.apply(
            null,
            parts.map(function (p) {
                return p.length;
            }),
        ) - 1;
    var i = 0;
    while (
        i < min &&
        parts.every(function (p) {
            return p[i] === parts[0][i];
        })
    )
        i++;
    var root = parts[0].slice(0, i).join("/");
    commonRootCache.set(modules, root);
    return root;
}

function moduleLabel(filePath, modules) {
    var root = commonRoot(modules);
    var rel = filePath.replace(/\\/g, "/");
    if (root) rel = rel.slice(root.length).replace(/^\//, "");
    return rel.replace(/\.[jt]sx?$/, "");
}

function moduleHtmlPath(filePath, modules) {
    return "modules/" + moduleLabel(filePath, modules).replace(/\//g, "__") + ".html";
}
function deeperCommonRoot(labels) {
    if (!labels || !labels.length) return "";
    var parts = labels.map(function (l) {
        return l.split("/");
    });
    var min =
        Math.min.apply(
            null,
            parts.map(function (p) {
                return p.length;
            }),
        ) - 1;
    var i = 0;
    while (
        i < min &&
        parts.every(function (p) {
            return p[i] === parts[0][i];
        })
    )
        i++;
    return i > 0 ? parts[0].slice(0, i).join("/") : "";
}
function hasExports(mod) {
    return (
        (mod.functions && mod.functions.length) ||
        (mod.classes && mod.classes.length) ||
        (mod.interfaces && mod.interfaces.length) ||
        (mod.typeAliases && mod.typeAliases.length) ||
        (mod.enums && mod.enums.length) ||
        (mod.variables && mod.variables.length)
    );
}

// ---------------------------------------------------------------------------
// Path tree (shared data layer — sidebar + index cards, task-pi-05)
// ---------------------------------------------------------------------------

/**
 * Builds a synthetic-root N-level tree from module file paths, reusing
 * deeperCommonRoot as a pre-pass. Single source of truth for buildSidebar
 * and buildIndexBody (adr-phase-i-tree-nav.md).
 * @param {object[]} modules
 * @returns {object} synthetic root TreeNode { name, type, children }
 */
function pathTree(modules) {
    var allLabels = modules.map(function (m) { return moduleLabel(m.filePath, modules); });
    var deepRoot = deeperCommonRoot(allLabels); // reuse existing helper, unchanged
    function shortLabelFor(label) {
        return deepRoot ? label.slice(deepRoot.length).replace(/^\//, "") : label;
    }
    var root = { name: "", type: "dir", children: [] };
    modules.forEach(function (mod) {
        var label = moduleLabel(mod.filePath, modules);
        var sl = shortLabelFor(label);
        var segs = sl.split("/");
        var node = root;
        for (var i = 0; i < segs.length - 1; i++) {
            var seg = segs[i];
            var dir = node.children.filter(function (c) { return c.type === "dir" && c.name === seg; })[0];
            if (!dir) {
                dir = { name: seg, type: "dir", children: [] };
                node.children.push(dir);
            }
            node = dir;
        }
        node.children.push({ name: segs[segs.length - 1], type: "file", mod: mod, sl: sl });
    });
    sortTree(root);
    return root;
}

function sortTree(node) {
    node.children.sort(function (a, b) {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1; // dirs before files
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    node.children.forEach(function (c) {
        if (c.type === "dir") sortTree(c);
    });
}

/**
 * Returns the array of ancestor dir TreeNodes (root to, not including, the
 * leaf) for the given module reference within the given tree.
 * @param {object} root
 * @param {object} targetMod
 * @returns {object[]}
 */
function ancestorChain(root, targetMod) {
    var chain = [];
    function walk(node, path) {
        for (var i = 0; i < node.children.length; i++) {
            var c = node.children[i];
            if (c.type === "file" && c.mod === targetMod) {
                chain = path.slice();
                return true;
            }
            if (c.type === "dir" && walk(c, path.concat([c]))) return true;
        }
        return false;
    }
    walk(root, []);
    return chain; // array of dir TreeNodes from root to (not including) the leaf
}

// ---------------------------------------------------------------------------
// Search index
// ---------------------------------------------------------------------------

function buildBody(item) {
    var parts = [];
    if (item.description) parts.push(item.description);
    (item.jsdocParams || []).forEach(function (p) {
        if (p.description) parts.push(p.name + ": " + p.description);
    });
    if (item.returns && item.returns.description) parts.push("returns: " + item.returns.description);
    (item.throws || []).forEach(function (t) {
        if (t.description) parts.push("throws: " + t.description);
    });
    return parts.join(" | ").slice(0, 300) || null;
}

function buildSearchIndex(modules, prefix) {
    prefix = prefix || "";
    var index = [];
    modules.forEach(function (mod) {
        var rel = moduleHtmlPath(mod.filePath, modules);
        var label = moduleLabel(mod.filePath, modules);
        function url(a) {
            return prefix + rel + "#" + a;
        }
        function push(name, kind, anchor, item) {
            index.push({ name: name, kind: kind, module: label, url: url(anchor), body: buildBody(item || {}) });
        }
        mod.functions.forEach(function (f) {
            push(f.name, "function", anchorId("fn", f.name), f);
        });
        mod.classes.forEach(function (c) {
            push(c.name, "class", anchorId("cls", c.name), c);
            c.methods.forEach(function (m) {
                push(c.name + "." + m.name, "method", anchorId("cls", c.name), m);
            });
        });
        mod.interfaces.forEach(function (i) {
            push(i.name, "interface", anchorId("iface", i.name), i);
        });
        mod.typeAliases.forEach(function (t) {
            push(t.name, "type", anchorId("type", t.name), t);
        });
        mod.enums.forEach(function (e) {
            push(e.name, "enum", anchorId("enum", e.name), e);
        });
        mod.variables.forEach(function (v) {
            push(v.name, v.isConst ? "const" : "var", anchorId("var", v.name), v);
        });
    });
    return index;
}

// ---------------------------------------------------------------------------
// Topnav
// ---------------------------------------------------------------------------

function buildTopnav(crumbHtml, versionSwitcherHtml) {
    return (
        '<header class="topnav"><div class="topnav-inner">' +
        '<button id="hamburger" class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>' +
        '<span class="topnav-crumb">' + (crumbHtml || "") + '</span>' +
        '<div class="topnav-search">' +
        icon("search", 13, "search-icon") +
        '<input id="search-box" class="search-box" type="search" placeholder="Search modules, symbols&hellip;" autocomplete="off">' +
        '<kbd class="search-kbd">/</kbd>' +
        '<div id="search-results" class="search-results"></div>' +
        "</div>" +
        (versionSwitcherHtml || "") +
        "</div></header>"
    );
}

/**
 * Parses a site-data version-id (the ISO-timestamp segment
 * `site-data.js`'s `writeSiteData()` already bakes into
 * `site-data-history/site-data-<id>.json` filenames, dashes standing in for
 * the colons/dot a raw ISO string can't use in a filename) back into a
 * fixed, literal locale label -- never an invented relative-time phrase
 * ("2 days ago" is not a preserved fact; story-doc-version-switcher AC4).
 * Falls back to the raw id string (still a real fact, just less pretty) if
 * the id doesn't match the expected shape or produces an invalid Date --
 * e.g. a rare collision-suffixed id like `<ts>-1`.
 * @param {string} versionId
 * @returns {string}
 */
function formatVersionLabel(versionId) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/.exec(versionId);
    if (!m) return versionId;
    var iso = m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":" + m[6] + "." + m[7] + "Z";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return versionId;
    try {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        }).format(d);
    } catch (e) {
        return versionId;
    }
}

/**
 * Version-switcher control (story-doc-version-switcher): native
 * `<details>/<summary>` disclosure per ui-ux-designer's spec -- explicitly
 * NOT a `<select>` (rejected in the spec: needs a JS onchange handler to
 * navigate, breaking this project's zero/near-zero-script precedent).
 * Zero-history case renders a plain, non-interactive `<span>` instead of a
 * `<details>` with an empty menu -- a disclosure that opens to reveal
 * nothing-new-to-pick is a broken affordance (handoff notes, explicit).
 * @param {string|null} currentVersionId - null when rendering the live site;
 *   the version-id being viewed when rendering inside a `site-versions/<id>/` snapshot.
 * @param {string[]} versionIds - `site-versions/` directory names, most-recent-first.
 * @param {string} prefixToOutDirRoot - relative path prefix from the page being
 *   rendered back to the output root where `site-versions/` and the live
 *   `index.html` both live (differs from the page's own same-site asset
 *   prefix when the page itself is inside a snapshot -- see buildSite()).
 * @returns {string}
 */
function buildVersionSwitcher(currentVersionId, versionIds, prefixToOutDirRoot) {
    var prefix = prefixToOutDirRoot || "";
    var ids = versionIds || [];
    if (!ids.length) {
        return '<span class="version-switcher-static">Current</span>';
    }
    var isCurrentLive = !currentVersionId;
    var triggerLabel = isCurrentLive ? "Current" : formatVersionLabel(currentVersionId);
    var items =
        '<a class="version-switcher-item' +
        (isCurrentLive ? " is-current" : "") +
        '" href="' +
        esc(prefix + "index.html") +
        '" role="menuitem"' +
        (isCurrentLive ? ' aria-current="page"' : "") +
        ">Current</a>";
    ids.forEach(function (id) {
        var isThis = currentVersionId === id;
        items +=
            '<a class="version-switcher-item' +
            (isThis ? " is-current" : "") +
            '" href="' +
            esc(prefix + "site-versions/" + id + "/index.html") +
            '" role="menuitem"' +
            (isThis ? ' aria-current="page"' : "") +
            ">" +
            esc(formatVersionLabel(id)) +
            "</a>";
    });
    return (
        '<details class="version-switcher">' +
        '<summary class="version-switcher-trigger">' +
        '<span class="version-switcher-label">' +
        esc(triggerLabel) +
        '</span>' +
        '<svg class="version-switcher-chevron" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M2 3l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>' +
        "</summary>" +
        '<div class="version-switcher-menu" role="menu">' +
        items +
        "</div>" +
        "</details>"
    );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function symRows(mod) {
    var rows = '<div class="sym-rows">';
    var specs = [
        { list: mod.functions, kind: "fn", label: "fn" },
        { list: mod.classes, kind: "cls", label: "cls" },
        { list: mod.interfaces, kind: "iface", label: "if" },
        { list: mod.typeAliases, kind: "type", label: "ty" },
        { list: mod.enums, kind: "enum", label: "en" },
        { list: mod.variables, kind: "var", label: "$" },
    ];
    specs.forEach(function (s) {
        (s.list || []).forEach(function (item) {
            var anchor = anchorId(s.kind, item.name);
            rows +=
                '<div class="sym-row"><span class="sym-dot sym-' +
                s.kind +
                '"></span><span class="sym-kind-abbr">' +
                esc(s.label) +
                '</span><a class="sym-link" href="#' +
                anchor +
                '">' +
                esc(item.name) +
                "</a></div>";
        });
    });
    return rows + "</div>";
}

function dirTitle(node) {
    var segs = [];
    var n = node;
    while (n && n.name) {
        segs.unshift(n.name);
        n = n.__parent;
    }
    return segs.join("/");
}

// task-ls-04: precomputes and memoizes the DEFAULT (fully closed, no
// active file/dir highlighted) rendering of every non-root tree node's own
// sidebar block -- see adr-linear-scaling-fix.md. Bottom-up: a dir's cached
// block reuses its children's already-cached blocks, so this whole pass is
// O(N) total (each node's own markup computed exactly once), not O(N) PER
// PAGE. renderTreeLevel then only needs to render fresh markup for nodes on
// the active ancestor/active-leaf path (O(depth) of them per page) and can
// pull every sibling subtree from this cache in O(1) -- meeting AC2's "each
// page does an O(depth) lookup, not an O(total files) walk" bar.
//
// Cache key is the tree NODE itself (object identity) -- cache is a plain
// Map built fresh per buildSite() call (see buildSite()), so it's call-scoped
// by construction and doesn't need WeakMap cross-call isolation (task-ls-03's
// concern doesn't apply here: a new tree, and a new cache, is built every
// buildSite() call).
//
// Only two distinct `prefix` values exist within a single buildSite() call
// (root/index-style pages use "", module pages use "../"), so buildSite()
// precomputes exactly two caches -- see buildSite().
function precomputeDefaultTree(node, depth, modules, prefix, cache) {
    var count = node.children.length;
    node.children.forEach(function (child, idx) {
        var setsize = count;
        var posinset = idx + 1;
        var vDepth = Math.min(depth, 5);
        var html;
        if (child.type === "dir") {
            precomputeDefaultTree(child, depth + 1, modules, prefix, cache);
            var childrenHtml = child.children
                .map(function (gc) {
                    return cache.get(gc);
                })
                .join("");
            html =
                '<details class="sidebar-item-details" data-depth="' +
                depth +
                '">' +
                '<summary class="sidebar-dir-toggle" style="--depth:' +
                vDepth +
                '" title="' +
                esc(dirTitle(child)) +
                '" role="treeitem" aria-expanded="false" aria-level="' +
                (depth + 1) +
                '" aria-setsize="' +
                setsize +
                '" aria-posinset="' +
                posinset +
                '" tabindex="-1">' +
                esc(child.name) +
                "</summary>" +
                childrenHtml +
                "</details>";
        } else {
            var rel = moduleHtmlPath(child.mod.filePath, modules);
            html =
                '<a class="sidebar-link" style="--depth:' +
                vDepth +
                '" href="' +
                esc(prefix + rel) +
                '" title="' +
                esc(child.sl) +
                '" role="treeitem" aria-level="' +
                (depth + 1) +
                '" aria-setsize="' +
                setsize +
                '" aria-posinset="' +
                posinset +
                '" tabindex="-1">' +
                esc(child.name) +
                "</a>";
        }
        cache.set(child, html);
    });
}

function renderTreeLevel(node, depth, modules, activePath, prefix, activeModule, ancestorsOfActive, defaultCache) {
    var html = "";
    var count = node.children.length;
    node.children.forEach(function (child, idx) {
        var setsize = count;
        var posinset = idx + 1;
        if (child.type === "dir") {
            var isAncestor = ancestorsOfActive.indexOf(child) !== -1;
            if (!isAncestor && defaultCache && defaultCache.has(child)) {
                html += defaultCache.get(child);
                return;
            }
            var vDepth = Math.min(depth, 5);
            html +=
                '<details class="sidebar-item-details" data-depth="' +
                depth +
                '"' +
                (isAncestor ? " open" : "") +
                ">" +
                '<summary class="sidebar-dir-toggle" style="--depth:' +
                vDepth +
                '" title="' +
                esc(dirTitle(child)) +
                '" role="treeitem" aria-expanded="' +
                (isAncestor ? "true" : "false") +
                '" aria-level="' +
                (depth + 1) +
                '" aria-setsize="' +
                setsize +
                '" aria-posinset="' +
                posinset +
                '" tabindex="-1">' +
                esc(child.name) +
                "</summary>" +
                renderTreeLevel(child, depth + 1, modules, activePath, prefix, activeModule, ancestorsOfActive, defaultCache) +
                "</details>";
        } else {
            var rel = moduleHtmlPath(child.mod.filePath, modules);
            var isActive = activePath === rel;
            if (!isActive && defaultCache && defaultCache.has(child)) {
                html += defaultCache.get(child);
                return;
            }
            var vDepth2 = Math.min(depth, 5);
            html +=
                '<a class="sidebar-link' +
                (isActive ? " active" : "") +
                '" style="--depth:' +
                vDepth2 +
                '" href="' +
                esc(prefix + rel) +
                '" title="' +
                esc(child.sl) +
                '" role="treeitem" aria-level="' +
                (depth + 1) +
                '" aria-setsize="' +
                setsize +
                '" aria-posinset="' +
                posinset +
                '"' +
                (isActive ? ' aria-selected="true"' : "") +
                ' tabindex="-1">' +
                esc(child.name) +
                "</a>";
            if (isActive && activeModule) html += symRows(activeModule);
        }
    });
    return html;
}

function buildSidebar(modules, projectName, version, activePath, rootPrefix, activeModule, precomputedTree, opts) {
    opts = opts || {};
    var prefix = rootPrefix || "";
    var tree = precomputedTree || pathTree(modules);
    // Attach __parent links (non-enumerable-ish, used only for dirTitle tooltip text).
    // task-ls-04: guarded -- when buildSite() passes a precomputedTree, it has
    // already linked parents once for the whole buildSite() call (see
    // buildSite()); re-walking here on every page would reintroduce an O(N)
    // per-page cost. Standalone callers that don't pass a precomputedTree (no
    // opts.parentsLinked) still get it computed, just scoped to their own call.
    if (!opts.parentsLinked) {
        (function linkParents(node) {
            node.children.forEach(function (c) {
                c.__parent = node;
                if (c.type === "dir") linkParents(c);
            });
        })(tree);
    }
    var ancestorsOfActive = activeModule ? ancestorChain(tree, activeModule) : [];
    var brand = '<div class="sidebar-brand">'
        + '<span class="sidebar-mark" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2h3v3H2zM7 2h3v3H7zM2 7h3v3H2z" fill="currentColor"/><path d="M7 7h3v3H7z" fill="currentColor" opacity="0.4"/></svg></span>'
        + '<span class="sidebar-logo">' + esc(projectName) + '</span></div>'
        + (version ? '<div class="sidebar-version">v' + esc(version) + ' &middot; npm</div>' : "");
    var navButtons = '<a class="navbtn' + (opts.activeSection === "overview" ? " active" : "") + '" href="' + esc(prefix + "index.html") + '">Overview</a>'
        // task-arch-04: inserted directly after Overview, before Code Health (UX
        // \u00a72.0 "directly under Overview" -- concatenation order == DOM order here).
        // Gated on opts.architectureHref, same presence-gate pattern as qualityHref.
        + (opts.architectureHref ? '<a class="navbtn' + (opts.activeSection === "architecture" ? " active" : "") + '" href="' + esc(opts.architectureHref) + '">Architecture</a>' : "")
        + (opts.qualityHref ? '<a class="navbtn sidebar-quality-link' + (opts.activeSection === "quality" ? " active" : "") + '" href="' + esc(opts.qualityHref) + '">\u2733 Code Health</a>' : "");
    var html = '<div class="sidebar-inner" role="tree" aria-label="Modules">' + brand + navButtons + '<div class="sidebar-section-title">Modules</div>';
    html += renderTreeLevel(tree, 0, modules, activePath, prefix, activeModule, ancestorsOfActive, opts.defaultCache);
    return html + "</div>";
}

// ---------------------------------------------------------------------------
// TOC builder
// ---------------------------------------------------------------------------

function buildToc(mod) {
    var specs = [
        { title: "Functions", list: mod.functions, kind: "fn" },
        { title: "Classes", list: mod.classes, kind: "cls" },
        { title: "Interfaces", list: mod.interfaces, kind: "iface" },
        { title: "Type Aliases", list: mod.typeAliases, kind: "type" },
        { title: "Enums", list: mod.enums, kind: "enum" },
        { title: "Variables", list: mod.variables, kind: "var" },
    ].filter(function (s) {
        return s.list && s.list.length;
    });
    if (!specs.length) return "";
    var html = '<div class="toc-title">On this page</div>';
    specs.forEach(function (s) {
        html += '<div class="toc-section"><div class="toc-section-label">' + esc(s.title) + "</div>";
        s.list.forEach(function (item) {
            var anchor = anchorId(s.kind, item.name);
            html +=
                '<a class="toc-item" href="#' + anchor + '" data-anchor="' + anchor + '">' + esc(item.name) + "</a>";
        });
        html += "</div>";
    });
    return html;
}

// ---------------------------------------------------------------------------
// Site builder helpers
// ---------------------------------------------------------------------------

function buildSymbolMap(modules) {
    var map = {};
    modules.forEach(function (mod) {
        var rel = moduleHtmlPath(mod.filePath, modules);
        function reg(name, aid) { map[name] = { anchorId: aid, modulePath: rel }; }
        mod.functions.forEach(function (f) { reg(f.name, anchorId('fn', f.name)); });
        mod.classes.forEach(function (c) {
            reg(c.name, anchorId('cls', c.name));
            c.methods.forEach(function (m) { reg(c.name + '.' + m.name, anchorId('cls', c.name)); });
        });
        mod.interfaces.forEach(function (i) { reg(i.name, anchorId('iface', i.name)); });
        mod.typeAliases.forEach(function (t) { reg(t.name, anchorId('type', t.name)); });
        mod.enums.forEach(function (e) { reg(e.name, anchorId('enum', e.name)); });
        mod.variables.forEach(function (v) { reg(v.name, anchorId('var', v.name)); });
    });
    return map;
}

/**
 * Bounded breadcrumb segments for an index card (task-pi-05c): drops the
 * filename, keeps at most the last 2 directory segments, prefixing an
 * ellipsis when the path is deeper than that.
 * @param {string} sl
 * @returns {string[]|null}
 */
function cardBreadcrumb(sl) {
    var segs = sl.split("/").slice(0, -1); // drop filename
    if (!segs.length) return null;
    if (segs.length > 2) return ["…"].concat(segs.slice(-2)); // ellipsis + last 2 segments
    return segs;
}

function buildIndexBody(modules) {
    var allLabels = modules.map(function (m) { return moduleLabel(m.filePath, modules); });
    var _deepRoot = deeperCommonRoot(allLabels);
    function _short(label) { return _deepRoot ? label.slice(_deepRoot.length).replace(/^\//, '') : label; }
    var body = '<div class="section"><div class="section-title">Modules</div><div class="module-grid">';
    modules.forEach(function (mod) {
        var rel = moduleHtmlPath(mod.filePath, modules);
        var sl = _short(moduleLabel(mod.filePath, modules));
        var crumb = cardBreadcrumb(sl);
        var crumbHtml = crumb
            ? '<div class="module-card-path">' + crumb.map(esc).join(' <span class="module-card-path-sep">/</span> ') + '</div>'
            : '';
        var parts = [
            mod.functions.length && mod.functions.length + ' fn',
            mod.classes.length && mod.classes.length + ' class',
            mod.interfaces.length && mod.interfaces.length + ' iface',
            mod.enums.length && mod.enums.length + ' enum',
            mod.variables.length && mod.variables.length + ' const',
        ].filter(Boolean);
        var allItems = [].concat(mod.functions, mod.classes, mod.interfaces, mod.typeAliases, mod.enums, mod.variables);
        var depCount = allItems.filter(function (i) { return i.deprecated != null; }).length;
        var sinces = allItems.map(function (i) { return i.since; }).filter(Boolean).sort();
        var sinceStr = sinces.length
            ? (' · since v' + sinces[0] + (sinces.length > 1 && sinces[sinces.length - 1] !== sinces[0] ? '-v' + sinces[sinces.length - 1] : ''))
            : '';
        var depBadge = depCount ? '<span class="badge badge-deprecated" style="font-size:10px;padding:1px 5px">' + depCount + ' dep</span>' : '';
        var descHtml = mod.description ? '<div class="module-card-desc">' + esc(mod.description.slice(0, 100)) + (mod.description.length > 100 ? '...' : '') + '</div>' : '';
        var emptyNote = hasExports(mod) ? '' : '<div class="module-card-desc" style="color:var(--text3);font-style:italic">No exported items</div>';
        body += '<a class="module-card" href="' + esc(rel) + '" title="' + esc(sl) + '">';
        body += crumbHtml;
        body += '<div class="module-card-name">' + esc(sl.split('/').pop()) + depBadge + '</div>';
        body += '<div class="module-card-stats">' + (parts.join(' · ') || 'no exported items') + esc(sinceStr) + '</div>';
        body += descHtml + emptyNote + '</a>';
    });
    return body + '</div></div>';
}

// ---------------------------------------------------------------------------
// Code Health section (code-multivitals, embedded directly into index.html --
// no separate dashboard file. See docs/backlog/adr-phase-j-project-dashboard.md
// "single-artifact" revision.)
// ---------------------------------------------------------------------------

function qColor(score, kind) {
    if (kind === "mi") { if (score >= 65) return "#1a7f37"; if (score >= 20) return "#9a6700"; return "#cf222e"; }
    if (score >= 75) return "#1a7f37";
    if (score >= 50) return "#9a6700";
    return "#cf222e";
}
function qCountColor(n) { return n > 0 ? "#cf222e" : "#1a7f37"; }
function qWarnColor(n) { return n > 0 ? "#9a6700" : "#1a7f37"; }
function qSeverityColor(sev) {
    if (sev === "error") return "#cf222e";
    if (sev === "warn") return "#9a6700";
    return "#1a7f37";
}

/**
 * Display-only letter grade for the Code Health hero gauge
 * (story-code-health-redesign, ADR Decision 5). This is a purely cosmetic,
 * finer-grained scale layered ON TOP OF `qColor`'s existing 3-band
 * thresholds -- it does NOT replace or compete with them. The gauge's arc
 * color and score text color must still come from `qColor(score, "health")`;
 * a "B+" and a "B" can legitimately render in the same color, same as two
 * scores in the same qColor band always have.
 * @param {number} score - 0-100 health score (result.averageHealthScore).
 * @returns {string} a letter grade, or "—" if score isn't a finite number.
 */
function scoreToGrade(score) {
    if (typeof score !== "number" || isNaN(score)) return "—";
    if (score >= 97) return "A+";
    if (score >= 93) return "A";
    if (score >= 90) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 60) return "D";
    return "F";
}

/**
 * Renders the Code Health gauge ring as an inline SVG arc (270° sweep
 * starting at 135°/bottom-left) instead of a CSS `conic-gradient` circle --
 * matches the jsdoc-scribe design-system reference (`GradeGauge`) exactly,
 * and gives the filled arc a real drop-shadow glow that `conic-gradient`
 * can't produce. Purely a ring; grade/score text stays as separate HTML
 * (`.qhero-grade`/`.qhero-score`) absolutely centered over it via
 * `.qhero-gauge-inner`, unchanged from before -- only the ring-drawing
 * mechanism changed.
 * @param {string} color - stroke color for the filled portion (a qColor() result).
 * @param {number} pct - 0-1 fraction filled.
 * @param {number} size - SVG width/height in px, matches the CSS ring's own diameter.
 * @returns {string}
 */
function gaugeArcSvg(color, pct, size) {
    var stroke = size >= 140 ? 7 : 5;
    var r = size / 2 - stroke / 2 - 3;
    var cx = size / 2,
        cy = size / 2;
    function polar(angleDeg) {
        var rad = ((angleDeg - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }
    function arc(startAngle, endAngle) {
        var s = polar(startAngle),
            e = polar(endAngle);
        var large = endAngle - startAngle > 180 ? 1 : 0;
        return (
            "M " + s.x.toFixed(2) + " " + s.y.toFixed(2) + " A " + r.toFixed(2) + " " + r.toFixed(2) + " 0 " + large + " 1 " + e.x.toFixed(2) + " " + e.y.toFixed(2)
        );
    }
    var startAngle = 135,
        total = 270;
    var p = Math.max(0, Math.min(1, pct || 0));
    var filledAngle = startAngle + total * p;
    return (
        '<svg class="qhero-gauge-svg" width="' +
        size +
        '" height="' +
        size +
        '" viewBox="0 0 ' +
        size +
        " " +
        size +
        '" aria-hidden="true">' +
        '<path d="' +
        arc(startAngle, startAngle + total) +
        '" fill="none" stroke="var(--border)" stroke-width="' +
        stroke +
        '" stroke-linecap="round"/>' +
        (p > 0
            ? '<path d="' +
              arc(startAngle, filledAngle) +
              '" fill="none" stroke="' +
              color +
              '" stroke-width="' +
              stroke +
              '" stroke-linecap="round" style="filter:drop-shadow(0 0 6px ' +
              color +
              '88)"/>'
            : "") +
        "</svg>"
    );
}

function qStatCard(label, value, color) {
    return (
        '<div class="qstat-card"><div class="qstat-label">' +
        esc(label) +
        '</div><div class="qstat-value"' +
        (color ? ' style="color:' + color + '"' : "") +
        ">" +
        esc(value) +
        "</div></div>"
    );
}

/**
 * Renders one qcard-row (shared between a card's always-visible preview and
 * its inline "view more" expansion — same lightweight [label, value, color?]
 * shape used since story-code-health-drilldown, deliberately NOT the richer
 * detail-page `<table>` row shape, so smell ids etc. stay detail-page-only,
 * see story-code-health-redesign's requirement #6).
 * @param {[string, string|number|null, string|null]} r
 * @returns {string}
 */
function qCardRow(r) {
    return (
        '<div class="qcard-row"><span>' +
        esc(r[0]) +
        "</span>" +
        (r[1] != null ? '<span' + (r[2] ? ' style="color:' + r[2] + '"' : "") + ">" + esc(r[1]) + "</span>" : "") +
        "</div>"
    );
}

/**
 * Renders one focus-area card for the index page's Code Health section
 * (story-code-health-redesign, restyling story-code-health-drilldown's
 * original card). Shows up to 5 rows inline; any remaining rows are
 * reachable via a native `<details>` expand (zero client JS — see ADR
 * Decision 3) rather than only via the standalone detail page. The
 * standalone detail-page link ("open full page") remains, unconditionally,
 * per requirement #6 — this is additive, not a replacement.
 * @param {{title: string, statLineHtml?: string, rows: Array<[string, string|number|null, string|null]>, moreHref: string, moreLabel: string, tag: string, tagBg: string, tagText: string, tagColor: string, bigValue: string, bigCaption: string}} opts
 * @returns {string}
 */
function qCard(opts) {
    var rows = opts.rows || [];
    var preview = rows.slice(0, 5);
    var remainder = rows.slice(5);

    var previewHtml = preview.length
        ? preview.map(qCardRow).join("")
        : '<div class="qcard-row" style="font-style:italic;color:var(--text3)">None found.</div>';

    var expandHtml = remainder.length
        ? '<details class="qcard-expand"><summary class="qcard-expand-toggle">View ' +
          remainder.length +
          " more &rarr;</summary><div class=\"qcard-expand-body\">" +
          remainder.map(qCardRow).join("") +
          "</div></details>"
        : "";

    var iconHtml = opts.icon ? icon(opts.icon, 13, "qcard2-icon") : "";
    return (
        '<div class="qcard2" style="border-color:' +
        opts.tagColor +
        '33">' +
        '<div class="qcard2-head" style="background:' +
        opts.tagColor +
        "1A;border-color:" +
        opts.tagColor +
        '33">' +
        '<div class="qcard2-head-left">' +
        iconHtml +
        '<span class="qcard-title" style="color:' +
        opts.tagColor +
        '">' +
        esc(opts.title) +
        "</span>" +
        "</div>" +
        '<span class="qcard2-bigvalue" style="color:' +
        opts.tagColor +
        '">' +
        esc(opts.bigValue) +
        "</span>" +
        "</div>" +
        '<div class="qcard2-body">' +
        (opts.statLineHtml ? '<div class="qcard-statline">' + opts.statLineHtml + "</div>" : "") +
        '<div class="qcard-preview">' +
        previewHtml +
        "</div>" +
        expandHtml +
        "</div>" +
        '<div class="qcard2-foot">' +
        '<a class="qcard-more" style="color:' +
        opts.tagColor +
        '" href="' +
        esc(opts.moreHref) +
        '">' +
        esc(opts.moreLabel) +
        "</a>" +
        "</div>" +
        "</div>"
    );
}

/**
 * Score-of helper for a code-multivitals Snapshot (story-code-health-redesign
 * ADR Decision 6). Snapshot shape per `node_modules/code-multivitals/dist/snapshots.d.ts`:
 * `{path, timestamp, result}` — `result` is a full AnalysisResult, same shape
 * runQuality() returns, so `.averageHealthScore` is already there, no new field.
 * @param {{result?: {averageHealthScore?: number}}} snapshot
 * @returns {number|null}
 */
function qSnapshotScore(snapshot) {
    return snapshot && snapshot.result && typeof snapshot.result.averageHealthScore === "number"
        ? snapshot.result.averageHealthScore
        : null;
}

/**
 * Renders the hero panel's trend sparkline + delta badge (story-code-health-redesign,
 * ADR Decision 6). `loadQualitySnapshots()` returns snapshots sorted oldest-first;
 * this renders up to the last 6. Fewer than 2 usable snapshots -> an honest
 * "not enough history yet" message, never a fabricated/flat line.
 * @param {Array<object>} snapshots - `quality.snapshots` (may be empty/undefined).
 * @returns {string}
 */
function buildHealthSparkline(snapshots) {
    var scored = (snapshots || [])
        .map(function (s) { return { score: qSnapshotScore(s) }; })
        .filter(function (s) { return s.score !== null; });

    if (scored.length < 2) {
        return (
            '<div class="qhero-trend-empty">Not enough scan history yet — run with ' +
            "<code>--quality-snapshot &lt;dir&gt;</code> and <code>--quality-trend &lt;dir&gt;</code> " +
            "on successive scans to start tracking a trend.</div>"
        );
    }

    var recent = scored.slice(-6);
    var values = recent.map(function (s) { return s.score; });
    var latest = values[values.length - 1];
    var prev = values[values.length - 2];
    var delta = latest - prev;
    var color = qColor(latest, "health");
    var deltaText = (delta >= 0 ? "&#9650; +" : "&#9660; ") + Math.abs(delta).toFixed(1) + " vs last scan";

    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var range = max - min || 1;
    var w = 100, h = 28;
    var points = values
        .map(function (v, i) {
            var x = values.length > 1 ? (i / (values.length - 1)) * w : 0;
            var y = h - ((v - min) / range) * (h - 4) - 2;
            return x.toFixed(1) + "," + y.toFixed(1);
        })
        .join(" ");

    return (
        '<div class="qhero-trend-badge" style="background:' +
        color +
        '">' +
        deltaText +
        "</div>" +
        '<svg width="200" height="34" viewBox="0 0 ' +
        w +
        " " +
        h +
        '" class="qhero-sparkline" role="img" aria-label="Health score trend, last ' +
        recent.length +
        ' scans"><polyline points="' +
        points +
        '" fill="none" stroke="' +
        color +
        '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>' +
        '<div class="qhero-trend-caption">last ' +
        recent.length +
        " scan" +
        (recent.length === 1 ? "" : "s") +
        "</div>"
    );
}

/**
 * Renders the Code Health hero panel (story-code-health-redesign): a
 * circular CSS `conic-gradient` gauge (grade + score, both derived from
 * `result.averageHealthScore` and colored via the existing `qColor` bands —
 * ADR Decision 5), the 6 non-gauge stat entries previously shown as separate
 * `.qstat-card`s, and the trend sparkline/delta badge (ADR Decision 6).
 * @param {object} result - runQuality() AnalysisResult.
 * @param {Array<object>} snapshots - `quality.snapshots`, may be empty/undefined.
 * @returns {string}
 */
function buildHealthHero(result, snapshots) {
    var score = result.averageHealthScore;
    var color = qColor(score, "health");
    var grade = scoreToGrade(score);
    var pct = Math.max(0, Math.min(100, typeof score === "number" ? score : 0));
    var deg = (pct * 3.6).toFixed(1);

    var metrics = [
        { label: "Maintainability", value: result.averageMI, color: qColor(result.averageMI, "mi") },
        { label: "Files", value: result.totalFiles, color: null },
        { label: "Functions", value: result.totalFunctions, color: null },
        { label: "Errors", value: result.errorCount, color: qCountColor(result.errorCount) },
        { label: "Warnings", value: result.warnCount, color: qWarnColor(result.warnCount) },
        { label: "Clone pairs", value: (result.clones || []).length, color: qCountColor((result.clones || []).length) },
    ];
    var metricsHtml = metrics
        .map(function (m) {
            return (
                '<div class="qhero-metric"><span class="qhero-metric-dot" style="background:' +
                (m.color || "var(--border)") +
                '"></span><span class="qhero-metric-label">' +
                esc(m.label) +
                '</span><span class="qhero-metric-value">' +
                esc(m.value) +
                "</span></div>"
            );
        })
        .join("");

    return (
        '<div class="qhero">' +
        '<div class="qhero-gauge">' +
        gaugeArcSvg(color, pct / 100, 168) +
        '<div class="qhero-gauge-inner">' +
        '<div class="qhero-grade" style="color:' +
        color +
        '">' +
        esc(grade) +
        '</div><div class="qhero-score">' +
        esc(result.averageHealthScore) +
        '</div><div class="qhero-score-label">health score</div>' +
        "</div></div>" +
        '<div class="qhero-divider"></div>' +
        '<div class="qhero-metrics">' +
        metricsHtml +
        "</div>" +
        '<div class="qhero-divider"></div>' +
        '<div class="qhero-trend">' +
        buildHealthSparkline(snapshots) +
        "</div>" +
        "</div>"
    );
}

// ---- Full-list row renderers, shared between the index cards' preview data
// and the uncapped detail-page tables (story-code-health-drilldown AC3). ----

function attentionList(result) {
    return (result.files || [])
        .filter(function (f) { return f.summary && typeof f.summary.weightedHealthScore === "number"; })
        .sort(function (a, b) { return a.summary.weightedHealthScore - b.summary.weightedHealthScore; });
}

function attentionRowsHtml(list) {
    return list.length
        ? list
              .map(function (f) {
                  var s = f.summary;
                  return (
                      "<tr><td><code>" +
                      esc(f.filePath) +
                      '</code></td><td style="color:' +
                      qColor(s.weightedHealthScore, "health") +
                      '">' +
                      Math.round(s.weightedHealthScore) +
                      '</td><td style="color:' +
                      qColor(s.weightedMI, "mi") +
                      '">' +
                      Math.round(s.weightedMI) +
                      "</td><td>" +
                      esc(s.worstSeverity || "ok") +
                      "</td><td>" +
                      ((s.smellIds || []).map(esc).join(", ") || "&mdash;") +
                      "</td></tr>"
                  );
              })
              .join("")
        : '<tr><td colspan="5" class="qempty">No files analyzed.</td></tr>';
}

function cloneRowsHtml(clones) {
    return clones.length
        ? clones
              .map(function (c) {
                  return (
                      "<tr><td><code>" +
                      esc(c.blockA.filePath) +
                      ":" +
                      c.blockA.startLine +
                      "-" +
                      c.blockA.endLine +
                      " (" +
                      esc(c.blockA.functionName) +
                      ')</code></td><td><code>' +
                      esc(c.blockB.filePath) +
                      ":" +
                      c.blockB.startLine +
                      "-" +
                      c.blockB.endLine +
                      " (" +
                      esc(c.blockB.functionName) +
                      ")</code></td><td>" +
                      Math.round(c.similarity * 100) +
                      "%</td></tr>"
                  );
              })
              .join("")
        : '<tr><td colspan="3" class="qempty">No duplicate code found.</td></tr>';
}

function importRowsHtml(entries) {
    return entries.length
        ? entries.map(function (e) { return "<tr><td><code>" + esc(e[0]) + "</code></td><td>" + e[1] + "</td></tr>"; }).join("")
        : '<tr><td colspan="2" class="qempty">No internal import edges found.</td></tr>';
}

function orphanRowsHtml(orphans) {
    return orphans.length
        ? orphans.map(function (f) { return "<tr><td><code>" + esc(f) + "</code></td></tr>"; }).join("")
        : '<tr><td class="qempty">None found.</td></tr>';
}

/**
 * Renders the code-multivitals health summary as an inline section for the
 * doc site's index page (story-code-health-drilldown, 2026-07-06): 7 stat
 * cards unchanged, followed by 4 summary cards (previously 4 full inline
 * tables) each linking to its own uncapped detail page — see
 * buildHealthDetailPages(). Detail-page hrefs are plain root-relative
 * filenames, valid whether this section renders on index.html directly or
 * is exercised standalone in tests.
 * @param {{result: object, graph?: object, orphans?: string[]}} quality
 * @returns {string} HTML for a <div class="section"> block.
 */
function buildQualitySection(quality) {
    if (!quality || !quality.result) return "";
    var result = quality.result;
    var graph = quality.graph;
    var orphans = quality.orphans || [];

    var hero = buildHealthHero(result, quality.snapshots || []);

    var attn = attentionList(result);
    var worst = attn[0];
    var attentionCard = qCard({
        title: "Files needing attention",
        statLineHtml: worst
            ? "Worst: <strong>" + esc(worst.filePath) + "</strong> (health " + Math.round(worst.summary.weightedHealthScore) + ")"
            : "",
        rows: attn.map(function (f) { return [f.filePath, Math.round(f.summary.weightedHealthScore), qColor(f.summary.weightedHealthScore, "health")]; }),
        moreHref: "health-attention.html",
        moreLabel: attn.length ? "Open full page &rarr;" : "View details &rarr;",
        tag: "NEEDS ATTENTION", tagBg: "#cf222e", tagText: "#fff", tagColor: "#F87171", icon: "alert-triangle",
        bigValue: String(attn.length), bigCaption: "file" + (attn.length === 1 ? "" : "s") + " flagged",
    });

    var clones = result.clones || [];
    var cloneCard = qCard({
        title: "Duplicate code",
        statLineHtml: "",
        rows: clones.map(function (c) { return [c.blockA.filePath + " ↔ " + c.blockB.filePath, Math.round(c.similarity * 100) + "%", null]; }),
        moreHref: "health-duplicates.html",
        moreLabel: clones.length ? "Open full page &rarr;" : "View details &rarr;",
        tag: "DUPLICATION", tagBg: "var(--accent)", tagText: "#fff", tagColor: "#FBBF24", icon: "copy",
        bigValue: String(clones.length), bigCaption: "clone pair" + (clones.length === 1 ? "" : "s"),
    });

    var importsCard = "";
    var orphansCard = "";
    if (graph) {
        var inDegreeEntries = Object.keys(graph.inDegree || {})
            .map(function (f) { return [f, graph.inDegree[f]]; })
            .sort(function (a, b) { return b[1] - a[1]; });
        importsCard = qCard({
            title: "Most-imported files",
            statLineHtml: "",
            rows: inDegreeEntries.map(function (e) { return [e[0], e[1] + "x", null]; }),
            moreHref: "health-imports.html",
            moreLabel: "Open full page &rarr;",
            tag: "STRUCTURE", tagBg: "var(--bg)", tagText: "var(--text2)", tagColor: "#38BDF8", icon: "arrow-up-right",
            bigValue: inDegreeEntries.length ? inDegreeEntries[0][1] + "x" : "0", bigCaption: "top import count",
        });
        orphansCard = qCard({
            title: "Orphan files",
            statLineHtml: "",
            rows: orphans.map(function (f) { return [f, null, null]; }),
            moreHref: "health-orphans.html",
            moreLabel: orphans.length ? "Open full page &rarr;" : "View details &rarr;",
            tag: "CLEANUP", tagBg: "var(--bg)", tagText: "#9a6700", tagColor: "#8A909A", icon: "file-x",
            bigValue: String(orphans.length), bigCaption: "orphaned",
        });
    }

    return (
        '<div class="section" id="code-health"><div class="section-title">Code Health<span class="section-count">(code-multivitals)</span></div>' +
        '<div style="padding:20px 32px 32px">' +
        hero +
        '<div class="qcard-grid">' +
        attentionCard +
        cloneCard +
        importsCard +
        orphansCard +
        "</div>" +
        "</div></div>"
    );
}

/**
 * Builds the 4 full-list Code Health detail pages (story-code-health-drilldown
 * AC3). Placed at the OUTPUT ROOT, sibling to index.html — NOT inside
 * modules/ (see docs/backlog/story-code-health-drilldown.md's "Correction
 * caught during verification": module pages live in modules/, these are
 * extensions of the index page's Code Health section, not per-module
 * content). Only called when options.quality is present.
 * @param {{result: object, graph?: object, orphans?: string[]}} quality
 * @param {object[]} modules
 * @param {string} projectName
 * @param {string} version
 * @param {object} tree - precomputed pathTree(modules), reused from buildSite.
 * @param {string} [architectureHref] - task-arch-04: root-relative href to
 *   architecture.html ("architecture.html") when it was rendered this run, so
 *   these pages carry the same sidebar navbutton as every other page; falsy/
 *   omitted (every pre-task-arch-04 caller) omits the navbutton, unchanged.
 * @returns {{path: string, html: string}[]}
 */
function buildHealthDetailPages(quality, modules, projectName, version, tree, switcherHtml, defaultCache, parentsLinked, architectureHref) {
    var result = quality.result;
    var graph = quality.graph;
    var orphans = quality.orphans || [];
    var pages = [];

    function wrap(slug, title, tableHtml) {
        var back = '<a class="qback" href="index.html#code-health">&larr; Back to index</a>';
        var body =
            '<div class="index-content"><div class="page-header"><div class="page-title">' +
            esc(title) +
            "</div></div>" +
            '<div style="padding:0 32px 32px">' +
            back +
            tableHtml +
            back +
            "</div></div>";
        var topnav = buildTopnav(esc(title), switcherHtml);
        // task-ls-04: these pages use the same prefix ("") as index.html, so
        // they share buildSite()'s root-prefix default cache when called from
        // buildSite() (defaultCache/parentsLinked undefined -> falls back to
        // uncached behavior for any standalone caller, unchanged from before).
        var sidebar = buildSidebar(modules, projectName, version, slug, "", null, tree, { qualityHref: "index.html#code-health", architectureHref: architectureHref || null, activeSection: "quality", defaultCache: defaultCache, parentsLinked: parentsLinked });
        pages.push({ path: slug, html: page(title + " - " + projectName, sidebar, body, "", topnav, null) });
    }

    wrap(
        "health-attention.html",
        "Files needing attention",
        '<div class="qtable-wrap"><table class="qtable"><thead><tr><th>File</th><th>Health</th><th>MI</th><th>Worst</th><th>Smells</th></tr></thead><tbody>' +
            attentionRowsHtml(attentionList(result)) +
            "</tbody></table></div>",
    );

    var clones = result.clones || [];
    wrap(
        "health-duplicates.html",
        "Duplicate code (" + clones.length + " pair" + (clones.length === 1 ? "" : "s") + ")",
        '<div class="qtable-wrap"><table class="qtable"><thead><tr><th>Block A</th><th>Block B</th><th>Similarity</th></tr></thead><tbody>' +
            cloneRowsHtml(clones) +
            "</tbody></table></div>",
    );

    var inDegreeEntries = graph
        ? Object.keys(graph.inDegree || {})
              .map(function (f) { return [f, graph.inDegree[f]]; })
              .sort(function (a, b) { return b[1] - a[1]; })
        : [];
    wrap(
        "health-imports.html",
        "Most-imported files",
        '<div class="qtable-wrap"><table class="qtable"><thead><tr><th>File</th><th>Times imported</th></tr></thead><tbody>' +
            importRowsHtml(inDegreeEntries) +
            "</tbody></table></div>",
    );

    wrap(
        "health-orphans.html",
        "Orphan files (" + orphans.length + " found)",
        '<div class="qtable-wrap"><table class="qtable"><thead><tr><th>File</th></tr></thead><tbody>' +
            orphanRowsHtml(orphans) +
            "</tbody></table></div>",
    );

    return pages;
}

// ---------------------------------------------------------------------------
// Architecture page (task-arch-04, adr-architecture-render-phase4.md,
// ux-architecture-render-phase4.md). Wires the already-shipped
// getAllFacts(rootDir) (lib/project-facts.js) into a standalone
// architecture.html page, parallel to buildHealthDetailPages() above. Every
// helper here is presentation-only: it reads facts already computed
// upstream, never touches the filesystem itself.
// ---------------------------------------------------------------------------

// Sentinel fallback description project-facts.js's describeDirectory() emits
// when a directory name has no entry in its KNOWN_DIR_DESCRIPTIONS map
// (lib/project-facts.js:154) -- a debug placeholder, never real copy. UX §2.6
// requires this never render verbatim; the description line is omitted
// entirely for a node whose description matches this string.
var NO_DIR_DESCRIPTION_SENTINEL = "(no description on file -- inspect directly)";

// Reverse of lib/project-facts.js's FRAMEWORK_MARKERS (dependency-name ->
// display-name), presentation-only. A file-heuristic framework signal's
// sentence (UX §2.5) needs to name the npm dependency key that was NOT
// found (e.g. "no `react` dependency found") -- that key isn't itself part
// of the file-heuristic evidence string (only the matched extension is), and
// project-facts.js doesn't export FRAMEWORK_MARKERS, so it's restated here.
// Keep in sync if lib/project-facts.js's FRAMEWORK_MARKERS ever changes.
var FRAMEWORK_DEP_MARKER_BY_NAME = {
    "React": "react",
    "Next.js": "next",
    "Angular": "@angular/core",
    "Vue": "vue",
    "Express": "express",
    "NestJS": "@nestjs/core",
};

/**
 * Wraps `s` in an escaped `<code>` span -- the lightweight "code voice" used
 * throughout the phrasing table in UX §2.5 for file/dir/dependency names.
 * @param {string} s
 * @returns {string}
 */
function codeSpan(s) {
    return "<code>" + esc(s) + "</code>";
}

/**
 * UX §2.5's first phrasing table: one row per named architecture-pattern
 * signal, each pairing the exact evidence-string shape
 * `getArchitectureSignals()` produces for that signal with the sentence
 * template to render for it. Kept as data (rather than inline `if` chains)
 * so `architectureSignalSentence()` stays a thin dispatcher — see that
 * function's own doc comment for the fallback behavior when a signal's name
 * isn't in this table, or its evidence doesn't match the row's pattern.
 * @type {Array<{name: string, pattern: RegExp, render: function(RegExpExecArray): string}>}
 */
var ARCHITECTURE_SIGNAL_SENTENCES = [
    {
        name: "CLI tool",
        pattern: /^package\.json "bin": (.+)$/,
        render: function (m) {
            var bins = m[1].split(", ").map(codeSpan).join(", ");
            return "package.json declares a " + codeSpan("bin") + " entry (" + bins + ") — this can be run as a command from the terminal.";
        }
    },
    {
        name: "Publishable library",
        pattern: /^package\.json has a "(\w+)" field$/,
        render: function (m) {
            var article = /^[aeiou]/i.test(m[1]) ? "an" : "a";
            return "package.json defines " + article + " " + codeSpan(m[1]) + " field — that's how a package exposes its public API to whoever installs it.";
        }
    },
    {
        name: "Monorepo (npm workspaces)",
        pattern: /^(\d+) workspace package\(s\): (.+)$/,
        render: function (m) {
            var names = m[2].split(", ").map(codeSpan).join(", ");
            var pkgCount = parseInt(m[1], 10);
            return "this repo hosts " + m[1] + " workspace package" + (pkgCount === 1 ? "" : "s") + " (" + names + ") under one root, managed via npm workspaces.";
        }
    },
    {
        name: "Backend/API service",
        pattern: /^framework dependency: (.+)$/,
        render: function (m) {
            return "depends on server frameworks (" + esc(m[1]) + ") — typically used to build an API or backend.";
        }
    },
    {
        name: "MVC-influenced layout",
        pattern: /^directories present: (.+)$/,
        render: function (m) {
            var mvcDirs = m[1].split(", ").map(function (d) { return codeSpan(d + "/"); });
            var mvcJoined = mvcDirs.length > 1
                ? mvcDirs.slice(0, -1).join(", ") + ", and " + mvcDirs[mvcDirs.length - 1]
                : mvcDirs[0];
            return "has " + mvcJoined + " directories — a naming convention commonly associated with MVC.";
        }
    },
    {
        name: "Layered/service-oriented layout",
        pattern: /^directories present: (.+)$/,
        render: function (m) {
            var flat = m[1].split(" / ").join(", ").split(", ").map(function (d) { return d.trim(); }).filter(Boolean);
            var sample = flat.slice(0, 2).map(function (d) { return codeSpan(d + "/"); }).join(", ");
            return "directory names like " + sample + " suggest the code is organized by responsibility, in layers.";
        }
    }
];

/**
 * UX §2.5's general rule: evidence shapes with no named row in
 * `ARCHITECTURE_SIGNAL_SENTENCES` (a future signal, or a named signal whose
 * evidence didn't match its own row's pattern) still get a sentence built
 * from the actual evidence shape, keyed only on that shape — never on
 * signal name, and never a bare/un-wrapped fallback.
 * @type {Array<{pattern: RegExp, render: function(RegExpExecArray): string}>}
 */
var ARCHITECTURE_SIGNAL_FALLBACKS = [
    {
        pattern: /^framework dependency: (.+)$/,
        render: function (m) { return "depends on " + esc(m[1]) + " (per package.json dependencies)."; }
    },
    {
        pattern: /^directories present: (.+)$/,
        render: function (m) { return "has directories matching: " + esc(m[1]) + "."; }
    }
];

/**
 * Builds the one-sentence, evidence-backed body copy for an architecture-
 * pattern-signal `.qcard` (UX §2.5's first phrasing table), keyed off the
 * exact evidence-string shapes `getArchitectureSignals()` produces today.
 * Evidence not matching any table row (a future signal shape, e.g. this
 * repo's own "Frontend application" signal, which shares the "framework
 * dependency: ..." shape with "Backend/API service" but has no table row of
 * its own) falls back to UX §2.5's general rule: name the actual evidence,
 * never paraphrase away specifics, never show it raw/un-wrapped.
 * @param {{name: string, evidence: string}} signal
 * @returns {string} HTML (already escaped where needed).
 */
function architectureSignalSentence(signal) {
    var name = signal.name;
    var evidence = signal.evidence || "";

    for (var i = 0; i < ARCHITECTURE_SIGNAL_SENTENCES.length; i++) {
        var row = ARCHITECTURE_SIGNAL_SENTENCES[i];
        if (name !== row.name) continue;
        var match = row.pattern.exec(evidence);
        if (match) return row.render(match);
    }

    for (var j = 0; j < ARCHITECTURE_SIGNAL_FALLBACKS.length; j++) {
        var fallback = ARCHITECTURE_SIGNAL_FALLBACKS[j];
        var fallbackMatch = fallback.pattern.exec(evidence);
        if (fallbackMatch) return fallback.render(fallbackMatch);
    }

    return esc(name) + " — " + esc(evidence) + ".";
}

/**
 * Builds the one-sentence, evidence-backed body copy for a framework-signal
 * `.qcard` (UX §2.5's second phrasing table), covering both confidence
 * shapes `getFrameworkSignals()` produces.
 * @param {{name: string, confidence: ("dependency"|"file-heuristic"), evidence: string}} signal
 * @returns {string} HTML (already escaped where needed).
 */
function frameworkSignalSentence(signal) {
    var evidence = signal.evidence || "";
    var m;
    if (signal.confidence === "dependency" && (m = /^"([^"]+)" in (.+) dependencies$/.exec(evidence))) {
        // Deliberately not codeSpan(): codeSpan() esc()'s its whole argument,
        // which would turn the surrounding literal quote marks into &quot;
        // entities -- valid HTML, but not the literal `"react"` this phrasing
        // wants inside the <code> span. Only the dependency name itself needs
        // escaping (it's untrusted package.json content); the quote marks are
        // our own literal punctuation, not user data.
        return esc(m[2]) + ' lists it as a dependency (<code>"' + esc(m[1]) + '"</code>).';
    }
    if (signal.confidence === "file-heuristic" && (m = /^(\.[\w.]+) files present, no matching dependency found in any package\.json$/.exec(evidence))) {
        var marker = FRAMEWORK_DEP_MARKER_BY_NAME[signal.name] || signal.name.toLowerCase();
        return "no " + codeSpan(marker) + " dependency found, but the codebase has " + codeSpan(m[1]) + " files, which is a common signal for " + esc(signal.name) + ".";
    }
    // Fallback for an unmatched future evidence shape -- named, not raw.
    return esc(signal.name) + " — " + esc(evidence) + ".";
}

function archSignalCard(signal) {
    return (
        '<div class="qcard"><div class="qcard-title">' + esc(signal.name) + "</div>" +
        "<div>" + architectureSignalSentence(signal) + "</div></div>"
    );
}

/**
 * Renders one getArchitecturePatterns() entry as a card: name, the
 * concrete evidence that matched, a 3-4 line plain-language description,
 * and a "Learn more" link out to the pattern's canonical external
 * reference (Wikipedia or its originating/official source). Distinct from
 * archSignalCard() above -- architectureSignals answers "what kind of
 * project is this" (CLI tool, monorepo, ...); architecturePatterns answers
 * the deeper "which architecture style does this codebase's own folder
 * structure actually look like" question, so it always carries a
 * description + reference link even though both reuse the same .qcard shell.
 * @param {{name: string, description: string, link: string, evidence: string}} pattern
 * @returns {string}
 */
function archPatternCard(pattern) {
    return (
        '<div class="qcard">' +
        '<div class="qcard-title">' + esc(pattern.name) + "</div>" +
        '<div class="qcard-statline" style="padding:0">' + esc(pattern.evidence) + "</div>" +
        '<div style="font-size:13px;line-height:1.6;color:var(--text2)">' + esc(pattern.description) + "</div>" +
        '<a class="qcard-more" href="' + esc(pattern.link) + '" target="_blank" rel="noopener">Learn more ' + icon("arrow-up-right", 11) + "</a>" +
        "</div>"
    );
}

function frameworkSignalCard(signal) {
    var isDependency = signal.confidence === "dependency";
    var chipText = isDependency ? "DEPENDENCY MATCH" : "FILE PATTERN";
    var chipBg = isDependency ? "var(--accent)" : "var(--bg)";
    var chipColor = isDependency ? "#fff" : "var(--text2)";
    return (
        '<div class="qcard">' +
        '<span class="tag-chip" style="background:' + chipBg + ";color:" + chipColor + '">' + esc(chipText) + "</span>" +
        '<div class="qcard-title">' + esc(signal.name) + "</div>" +
        "<div>" + frameworkSignalSentence(signal) + "</div>" +
        "</div>"
    );
}

/**
 * Renders a `getWorkspacePackages()` result as the "Workspace packages"
 * sub-heading (UX §2.6), reusing `.module-grid`/`.module-card` -- plain
 * `<div>` cards, not `<a>` links, since there's no per-package page to link
 * to (unlike the index page's module cards).
 * @param {{name: string, path: string, description: (string|null)}[]} workspacePackages
 * @returns {string}
 */
function buildWorkspacePackagesSubsection(workspacePackages) {
    var cards = workspacePackages.map(function (pkg) {
        var descHtml = pkg.description ? '<div class="module-card-desc">' + esc(pkg.description) + "</div>" : "";
        return (
            '<div class="module-card">' +
            '<div class="module-card-name">' + esc(pkg.name) + "</div>" +
            '<div class="module-card-path">' + esc(pkg.path) + "</div>" +
            descHtml +
            "</div>"
        );
    }).join("");
    return '<div class="qsub-title">Workspace packages</div><div class="module-grid">' + cards + "</div>";
}

// Category buckets for the Architecture "HOW IT'S ORGANIZED" folder-tree
// badges (tech-lead-requested tree/badge redesign, 2026-07-15 -- see
// docs/backlog/adr-architecture-tree-badges.md). Colors are literal hex
// (the same values as --chart-1..5) rather than var() references because
// structBadge() appends alpha-channel hex suffixes directly onto the color
// string -- the same convention qCard() already established, since
// "var(--chart-4)" + "1A" is not valid CSS but "#38BDF81A" is.
var STRUCTURE_BADGE_CATEGORIES = [
    { key: "ts", label: "TypeScript", test: /\.tsx?$/i, color: "#38BDF8" },
    { key: "js", label: "JavaScript", test: /\.(m|c)?jsx?$/i, color: "#FBBF24" },
    { key: "css", label: "CSS", test: /\.(css|scss|sass|less)$/i, color: "#F87171" },
    { key: "json", label: "JSON", test: /\.json$/i, color: "#34D399" },
];
var STRUCTURE_BADGE_FOLDER_COLOR = "#7382FF";
var STRUCTURE_BADGE_OTHER_COLOR = "#8A909A";

/**
 * Buckets a directory node's own (non-recursive) per-extension file counts
 * -- project-facts.js's summarizeFileExtensions() only counts a directory's
 * own immediate files, never descendants -- into the 4 headline categories
 * above, plus a catch-all "other" total for every extension that doesn't
 * match any of them (.md/.html/.yml/.svg/etc).
 */
function categorizeStructureFiles(filesMap) {
    var totals = { ts: 0, js: 0, css: 0, json: 0 };
    var other = 0;
    Object.keys(filesMap || {}).forEach(function (ext) {
        var count = filesMap[ext];
        var cat = STRUCTURE_BADGE_CATEGORIES.filter(function (c) { return c.test.test(ext); })[0];
        if (cat) totals[cat.key] += count;
        else other += count;
    });
    return { totals: totals, other: other };
}

function structBadge(color, text) {
    return '<span class="arch-badge" style="color:' + color + ";background:" + color + '1A;border-color:' + color + '33">' + esc(text) + "</span>";
}

/**
 * Renders one directory node's own badge row: a folder-count badge (if it
 * has subdirectories) followed by one colored badge per non-zero file
 * category, plus a muted "other" badge for anything uncategorized. Every
 * level of the tree gets its own row computed the same way, since
 * renderStructureNode below calls this once per recursive invocation --
 * that's what makes the badges recursive down every subtree, not just the
 * top level.
 */
function structureBadgesHtml(node) {
    var folderCount = (node.children || []).length;
    var cat = categorizeStructureFiles(node.files);
    var chips = [];
    if (folderCount > 0) {
        chips.push(structBadge(STRUCTURE_BADGE_FOLDER_COLOR, folderCount + " folder" + (folderCount === 1 ? "" : "s")));
    }
    STRUCTURE_BADGE_CATEGORIES.forEach(function (c) {
        var n = cat.totals[c.key];
        if (n > 0) chips.push(structBadge(c.color, n + " " + c.label));
    });
    if (cat.other > 0) {
        chips.push(structBadge(STRUCTURE_BADGE_OTHER_COLOR, cat.other + " other"));
    }
    if (chips.length === 0) return "";
    return '<span class="arch-badges">' + chips.join("") + "</span>";
}

/**
 * Recursively renders one `getProjectStructure()` node as a native
 * `<details>`/`<summary>` using the already-shipped `.collapse-toggle`/
 * `.collapse-body` classes (Consolidation note's binding correction over
 * the ADR's own superseded `sidebar-item-details` parenthetical -- this
 * lives in `.main` page content, not the sidebar nav, so it carries the
 * light card-internal treatment, not sidebar chrome). Depth-0 (top-level)
 * nodes render open; every nested level renders collapsed by default (UX
 * §2.6). A `children` array beyond 40 entries renders only the first 40
 * (already alphabetical, matching `getProjectStructure()`'s own sort) plus
 * a static "+N more" line -- no expand-more JS.
 * @param {{name: string, description: string, files: object, children: (Array|undefined)}} node
 * @param {number} depth - 0 for a top-level directory.
 * @returns {string}
 */
function renderStructureNode(node, depth) {
    var open = depth === 0;
    var summaryHtml = '<code class="arch-node-name">' + esc(node.name) + "</code>" + structureBadgesHtml(node);

    var bodyHtml = "";
    if (node.description && node.description !== NO_DIR_DESCRIPTION_SENTINEL) {
        bodyHtml += '<div class="qcard-statline">' + esc(node.description) + "</div>";
    }
    var children = node.children || [];
    if (children.length > 0) {
        var shown = children.slice(0, 40);
        bodyHtml += shown.map(function (c) { return renderStructureNode(c, depth + 1); }).join("");
        if (children.length > 40) {
            bodyHtml += '<div class="qempty">+' + (children.length - 40) + " more</div>";
        }
    }

    return (
        "<details" + (open ? " open" : "") + '><summary class="collapse-toggle">' + summaryHtml + "</summary>" +
        '<div class="collapse-body">' + bodyHtml + "</div></details>"
    );
}

/**
 * "{N} pattern signal(s) · {P} architecture pattern(s) · {M} framework
 * signal(s) · {D} top-level director{y|ies}" (UX §2.1, extended
 * 2026-07-15 for architecturePatterns) -- omits any segment whose count is 0.
 * @param {object} facts
 * @returns {string}
 */
function buildArchitectureSubtitle(facts) {
    var n = (facts.architectureSignals || []).length;
    var p = (facts.architecturePatterns || []).length;
    var m = (facts.frameworkSignals || []).length;
    var d = (facts.structure || []).length;
    var segs = [];
    if (n > 0) segs.push(n + " pattern signal" + (n === 1 ? "" : "s"));
    if (p > 0) segs.push(p + " architecture pattern" + (p === 1 ? "" : "s"));
    if (m > 0) segs.push(m + " framework signal" + (m === 1 ? "" : "s"));
    if (d > 0) segs.push(d + " top-level director" + (d === 1 ? "y" : "ies"));
    return segs.join(" &middot; ");
}

/**
 * "WHAT KIND OF PROJECT IS THIS" section (architecture-pattern signals),
 * or "" when there are no signals to show. Split out of
 * `buildArchitectureSection()` (GitHub code-scanning alert: that function's
 * combined Halstead volume/cyclomatic complexity crossed threshold) --
 * output is unchanged, just relocated.
 * @param {object[]} architectureSignals
 * @returns {string}
 */
function buildArchitectureSignalsSection(architectureSignals) {
    if (architectureSignals.length === 0) return "";
    return (
        '<div class="section"><h2 class="section-title">WHAT KIND OF PROJECT IS THIS' +
        '<span class="section-count">(' + architectureSignals.length + " signal" + (architectureSignals.length === 1 ? "" : "s") + ")</span></h2>" +
        '<div style="padding:0 32px 32px">' +
        '<p class="module-desc">These aren\'t mutually exclusive — real repos usually match more than one pattern at once. That\'s expected, not a contradiction.</p>' +
        '<div class="qcard-grid">' + architectureSignals.map(archSignalCard).join("") + "</div>" +
        "</div></div>"
    );
}

/**
 * "ARCHITECTURAL PATTERN(S)" section, or "" when none were detected. See
 * `buildArchitectureSignalsSection()`'s doc comment for why this was split
 * out of `buildArchitectureSection()`.
 * @param {object[]} architecturePatterns
 * @returns {string}
 */
function buildArchitecturePatternsSection(architecturePatterns) {
    if (architecturePatterns.length === 0) return "";
    return (
        '<div class="section"><h2 class="section-title">ARCHITECTURAL PATTERN' + (architecturePatterns.length === 1 ? "" : "S") +
        '<span class="section-count">(' + architecturePatterns.length + " detected)</span></h2>" +
        '<div style="padding:0 32px 32px">' +
        '<p class="module-desc">Detected from this project\'s own folder names, dependencies, and root-level config files — not mutually exclusive, and not a judgement of code quality. Each one links out to further reading.</p>' +
        '<div class="qcard-grid">' + architecturePatterns.map(archPatternCard).join("") + "</div>" +
        "</div></div>"
    );
}

/**
 * "WHAT IT'S BUILT WITH" section (framework signals), or "" when none
 * were detected. See `buildArchitectureSignalsSection()`'s doc comment for
 * why this was split out of `buildArchitectureSection()`.
 * @param {object[]} frameworkSignals
 * @returns {string}
 */
function buildFrameworkSignalsSection(frameworkSignals) {
    if (frameworkSignals.length === 0) return "";
    return (
        '<div class="section"><h2 class="section-title">WHAT IT\'S BUILT WITH' +
        '<span class="section-count">(' + frameworkSignals.length + " signal" + (frameworkSignals.length === 1 ? "" : "s") + ")</span></h2>" +
        '<div style="padding:0 32px 32px">' +
        '<div class="qcard-grid">' + frameworkSignals.map(frameworkSignalCard).join("") + "</div>" +
        "</div></div>"
    );
}

/**
 * The structure section's tree body: either the rendered nodes (capped at
 * 40, "+N more" beyond that, per UX §2.6) or the "no subdirectories" empty
 * state. Structure is the one section with no presence guard -- an empty
 * `[]` is a legitimate result to show, not an absent-data state.
 * @param {object[]} structure
 * @returns {string}
 */
function buildStructureBodyHtml(structure) {
    if (structure.length === 0) {
        return '<div class="qempty">No subdirectories found at the top level of this project.</div>';
    }
    var shown = structure.slice(0, 40);
    var html = shown.map(function (n) { return renderStructureNode(n, 0); }).join("");
    if (structure.length > 40) {
        html += '<div class="qempty">+' + (structure.length - 40) + " more</div>";
    }
    return html;
}

/**
 * "HOW IT'S ORGANIZED" section -- always rendered (never gated on an
 * empty-check) once `buildArchitectureSection()` has already decided the
 * page as a whole has something to show. See
 * `buildArchitectureSignalsSection()`'s doc comment for why this was split
 * out of `buildArchitectureSection()`.
 * @param {object[]} structure
 * @param {object[]} workspacePackages
 * @returns {string}
 */
function buildStructureSection(structure, workspacePackages) {
    return (
        '<div class="section"><h2 class="section-title">HOW IT\'S ORGANIZED' +
        '<span class="section-count">(' + structure.length + " top-level director" + (structure.length === 1 ? "y" : "ies") + ")</span></h2>" +
        '<div style="padding:0 32px 32px">' +
        (workspacePackages.length > 0 ? buildWorkspacePackagesSubsection(workspacePackages) : "") +
        '<div class="arch-tree">' + buildStructureBodyHtml(structure) + "</div>" +
        "</div></div>"
    );
}

/**
 * Builds the three content sections of the Architecture page (pattern
 * signals -> framework signals -> structure, UX §1/§3's mandated DOM order)
 * from `getAllFacts()` output. Returns "" when `facts` is absent or every
 * relevant field is empty -- the single presence-check this ticket's "no
 * page on empty/absent facts" AC hangs off (mirrors `buildQualitySection`'s
 * `if (!quality || !quality.result) return "";` guard).
 *
 * The pattern-signal and framework-signal sections are themselves omitted
 * when their own signal list is empty (no card grid with zero cards) --
 * the structure section is the one documented exception (UX §2.6): a
 * `getProjectStructure()` of `[]` is "a legitimate, correct result to show,
 * not an absent-data state," so that section always renders once this
 * function doesn't early-return, with a `.qempty` message in place of a
 * tree.
 *
 * Each of the four sections' own markup lives in its own
 * `build*Section()` helper above (GitHub code-scanning alert: this
 * function's combined Halstead volume/cyclomatic complexity crossed
 * threshold when all four were inlined) -- this function is now just the
 * presence-guard plus a fixed-order concatenation, with identical output
 * to before.
 * @param {object} facts - getAllFacts() output.
 * @returns {string}
 */
function buildArchitectureSection(facts) {
    if (!facts) return "";
    var structure = facts.structure || [];
    var workspacePackages = facts.workspacePackages || [];
    var frameworkSignals = facts.frameworkSignals || [];
    var architectureSignals = facts.architectureSignals || [];
    var architecturePatterns = facts.architecturePatterns || [];

    if (structure.length === 0 && workspacePackages.length === 0 && frameworkSignals.length === 0 && architectureSignals.length === 0 && architecturePatterns.length === 0) {
        return "";
    }

    return (
        buildArchitectureSignalsSection(architectureSignals) +
        buildArchitecturePatternsSection(architecturePatterns) +
        buildFrameworkSignalsSection(frameworkSignals) +
        buildStructureSection(structure, workspacePackages)
    );
}

// UX §2.2's orientation paragraph, verbatim.
var ARCHITECTURE_ORIENTATION_PARAGRAPH =
    "Here's what jsdoc-scribe found by reading your <code>package.json</code> and folder structure — " +
    "no guessing beyond what's actually on disk. Every line below says what it saw and where.";

/**
 * Assembles the standalone architecture.html page (task-arch-04, ADR
 * Decisions 1-4/6) via the existing `page()`/`buildTopnav()`/`buildSidebar()`
 * helpers, parallel to `buildHealthDetailPages()`'s `wrap()` pattern. Only
 * meaningful to call when `buildArchitectureSection(facts)` is non-empty;
 * returns `null` otherwise so callers (buildSite()) skip pushing a page and
 * skip wiring the sidebar navbutton -- no page/section/navbutton at all on
 * absent/empty facts, per ADR Decision 3.
 *
 * Deviation from the ticket's literal signature, disclosed: the ticket text
 * lists `buildArchitecturePage(facts, projectName, version, tree,
 * switcherHtml, defaultCache)` with no `modules` parameter. `buildSidebar()`
 * requires `modules` (its first argument, used inside `renderTreeLevel()` to
 * resolve each module's href) for every other page in the site, including
 * the structurally-parallel `buildHealthDetailPages()`; omitting it here
 * would render an empty/broken Modules tree in this one page's sidebar,
 * inconsistent with every other generated page. `modules` and `parentsLinked`
 * (mirroring `buildHealthDetailPages()`'s own trailing param, so this page
 * reuses `buildSite()`'s already-linked `__parent` pointers instead of
 * re-walking them) are added to the signature below.
 * @param {object} facts - getAllFacts() output.
 * @param {object[]} modules
 * @param {string} projectName
 * @param {string} version
 * @param {object} tree - precomputed pathTree(modules), reused from buildSite.
 * @param {string} switcherHtml
 * @param {Map} defaultCache
 * @param {boolean} [parentsLinked]
 * @returns {{path: string, html: string}|null}
 */
function buildArchitecturePage(facts, modules, projectName, version, tree, switcherHtml, defaultCache, parentsLinked) {
    var sectionsHtml = buildArchitectureSection(facts);
    if (!sectionsHtml) return null;

    var subtitle = buildArchitectureSubtitle(facts);
    var body =
        '<div class="index-content"><div class="page-header"><div class="page-title">Architecture</div>' +
        (subtitle ? '<div class="page-subtitle">' + subtitle + "</div>" : "") +
        '<p class="module-desc">' + ARCHITECTURE_ORIENTATION_PARAGRAPH + "</p>" +
        "</div>" +
        sectionsHtml +
        "</div>";

    var topnav = buildTopnav("Architecture", switcherHtml);
    var sidebar = buildSidebar(modules, projectName, version, "architecture.html", "", null, tree, {
        architectureHref: "architecture.html",
        activeSection: "architecture",
        defaultCache: defaultCache,
        parentsLinked: parentsLinked,
    });
    return { path: "architecture.html", html: page("Architecture - " + projectName, sidebar, body, "", topnav, null) };
}

/**
 * Precomputes a filePath-keyed lookup of per-file health data for the
 * module-page strip (story-code-health-drilldown AC4/AC8). Built once per
 * buildSite() call, not per module page. Join key is path.resolve(filePath)
 * — code-multivitals's FileReport.filePath and this project's own
 * mod.filePath are both whatever string was in the `files` array passed to
 * extractModule()/runQuality() (same array, same run), so they already
 * match string-for-string in the common case; resolving both sides is a
 * defensive normalization, not a fix for a known mismatch.
 * Per-file error/warning counts and function count are not provided
 * directly by code-multivitals's FileSummary — they're derived here by
 * counting existing FunctionReport.metrics[].severity entries and
 * FileReport.functions.length, reusing data already present in the
 * analyse() result (no new metrics).
 * @param {{result: object}} quality
 * @returns {Object<string, object>}
 */
function buildFileHealthLookup(quality) {
    var map = {};
    if (!quality || !quality.result) return map;
    var cloneCounts = {};
    (quality.result.clones || []).forEach(function (c) {
        [c.blockA, c.blockB].forEach(function (b) {
            var k = path.resolve(b.filePath);
            cloneCounts[k] = (cloneCounts[k] || 0) + 1;
        });
    });
    (quality.result.files || []).forEach(function (f) {
        var key = path.resolve(f.filePath);
        var errors = 0;
        var warnings = 0;
        (f.functions || []).forEach(function (fn) {
            (fn.metrics || []).forEach(function (m) {
                if (m.severity === "error") errors++;
                else if (m.severity === "warn") warnings++;
            });
        });
        map[key] = {
            healthScore: f.summary ? Math.round(f.summary.weightedHealthScore) : null,
            mi: f.summary ? Math.round(f.summary.weightedMI) : null,
            functions: (f.functions || []).length,
            errors: errors,
            warnings: warnings,
            worst: f.summary ? f.summary.worstSeverity || "ok" : null,
            smells: f.summary ? f.summary.smellIds || [] : [],
            clones: cloneCounts[key] || 0,
        };
    });
    return map;
}

/**
 * Per-function/method Code Health matching (story-function-level-health-drilldown).
 *
 * Empirical finding (TICKET-1, checked live against sample/container.ts via
 * runQuality()): code-multivitals emits BARE method names for class members
 * ("constructor", "resolve", "debug", ...) -- never a "ClassName.methodName"
 * composite, even when multiple classes in the same file share a method name
 * (three unrelated classes in that fixture each have their own "constructor"
 * entry at different line ranges). Point-in-range matching against
 * startLine/endLine is what actually disambiguates same-named methods across
 * classes, not the name alone -- so no composite-name fallback path is
 * implemented; it would never be reached.
 *
 * Matching strategy (solutions-architect decision): name + point-in-range
 * (extracted.line within [fn.startLine, fn.endLine] inclusive), tightest
 * (smallest) range wins on ambiguous/nested matches. Returns an object with
 * a `match(name, line)` method rather than a plain map, since resolution
 * needs a computed range-containment check per lookup, not a static key --
 * callers can always call `.match()` safely, never need to null-check the
 * lookup object itself.
 * @param {{result: object}} quality
 * @param {string} filePath
 * @returns {{match: function(string, number): (object|null)}}
 */
function buildFunctionHealthLookup(quality, filePath) {
    var noMatch = { match: function () { return null; } };
    if (!quality || !quality.result) return noMatch;
    var key = path.resolve(filePath);
    var fileReport = (quality.result.files || []).find(function (f) {
        return path.resolve(f.filePath) === key;
    });
    if (!fileReport || !fileReport.functions || !fileReport.functions.length) return noMatch;
    var entries = fileReport.functions;
    return {
        match: function (name, line) {
            if (line == null) return null;
            var candidates = entries.filter(function (fn) {
                return (
                    fn.name === name &&
                    typeof fn.startLine === "number" &&
                    typeof fn.endLine === "number" &&
                    line >= fn.startLine &&
                    line <= fn.endLine
                );
            });
            if (!candidates.length) return null;
            candidates.sort(function (a, b) {
                return (a.endLine - a.startLine) - (b.endLine - b.startLine);
            });
            return candidates[0];
        },
    };
}

/**
 * Compact inline per-function/method health chip row (story-function-level-
 * health-drilldown). Reuses scoreToGrade()/qColor()/qSeverityColor() verbatim
 * at a smaller, inline scale -- deliberately not a second full gauge (AC2:
 * must read as subordinate to the per-file hero above it on the same page).
 * Graceful fallback (AC3/architect Decision 4): no matching FunctionReport ->
 * a single muted qchip-empty span, never a broken/NaN render, never a silent
 * fall-back to file-level aggregate data.
 * @param {string} name
 * @param {number|null} line
 * @param {{match: function}} healthLookup
 * @returns {string}
 */
function functionHealthChip(name, line, healthLookup) {
    var entry = healthLookup && healthLookup.match ? healthLookup.match(name, line) : null;
    if (!entry) {
        return '<div class="qfn-chip-row"><span class="qchip-empty">No health data for this function.</span></div>';
    }
    var score = entry.healthScore;
    var grade = scoreToGrade(score);
    var color = qColor(score, "health");
    var dots = (entry.metrics || [])
        .map(function (m) {
            return (
                '<span class="qhero-metric-dot qfn-metric-dot" title="' +
                esc(m.name + ": " + m.value + (m.severity ? " (" + m.severity + ")" : "")) +
                '" style="background:' +
                qSeverityColor(m.severity) +
                '"></span>'
            );
        })
        .join("");
    var smellsHtml = (entry.smells || []).length
        ? '<span class="qfn-smells" title="' +
          esc(
              entry.smells
                  .map(function (s) {
                      return s.label + ": " + s.reason;
                  })
                  .join(" | "),
          ) +
          '">smells: ' +
          esc(
              entry.smells
                  .map(function (s) {
                      return s.label;
                  })
                  .join(", "),
          ) +
          "</span>"
        : "";
    return (
        '<div class="qfn-chip-row">' +
        '<span class="qfn-grade" style="color:' +
        color +
        '">' +
        esc(grade) +
        " " +
        esc(score == null ? "—" : score) +
        "</span>" +
        (dots ? '<span class="qfn-metric-dots">' + dots + "</span>" : "") +
        smellsHtml +
        "</div>"
    );
}

function qChip(label, value, color, href) {
    var v = value == null ? "—" : value;
    var valHtml = href
        ? '<a href="' + esc(href) + '" style="color:' + (color || "var(--text)") + '">' + esc(v) + "</a>"
        : '<span style="color:' + (color || "var(--text)") + '">' + esc(v) + "</span>";
    return '<div class="qchip"><div class="qchip-label">' + esc(label) + '</div><div class="qchip-value">' + valHtml + "</div></div>";
}

/**
 * Renders the per-module-page health strip (story-code-health-drilldown
 * AC4-AC6). Always renders the <aside> container — falls back to a single
 * muted row when the module has no code-multivitals entry, per
 * ui-ux-designer's spec (never omitted, never throws).
 * @param {object} mod
 * @param {Object<string, object>} healthLookup - buildFileHealthLookup() output.
 * @param {string} cloneHref - relative href to health-duplicates.html from a module page (e.g. "../health-duplicates.html").
 * @returns {string}
 */
/**
 * Short, factual one-line summary built purely from real per-file counts
 * (story-file-detail-redesign AC1). Deliberately NOT the File Detail
 * mockup's stylized "encouraging" copy ("Nearly there -- clear the 2
 * clones and this file ships clean.") -- that would be invented,
 * un-derivable prose, the same category story-code-health-redesign
 * already declined to build for the index-page hero. Every clause here is
 * a literal count already in `d`.
 * @param {object} d - buildFileHealthLookup() entry for one file.
 * @returns {string}
 */
function fileHeroNarrative(d) {
    var parts = [];
    if (d.errors > 0) parts.push(d.errors + " error" + (d.errors === 1 ? "" : "s"));
    if (d.warnings > 0) parts.push(d.warnings + " warning" + (d.warnings === 1 ? "" : "s"));
    if (d.clones > 0) parts.push(d.clones + " clone pair" + (d.clones === 1 ? "" : "s"));
    if (!parts.length) return "No issues found for this file.";
    return parts.join(", ") + " to resolve.";
}

/**
 * Per-file hero panel for module pages (story-file-detail-redesign,
 * replacing the old flat `.qstrip` chip row -- ADR Decision 1). Reuses
 * story-code-health-redesign's gauge/grade primitives (`scoreToGrade()`,
 * `qColor()` bands) verbatim, scoped to this one file's
 * `weightedHealthScore`/`weightedMI` instead of the project-wide average.
 * Files with no code-multivitals entry keep the same graceful fallback
 * `buildHealthStrip()` always had -- one muted row, never a broken/zero
 * gauge.
 * @param {object} mod
 * @param {Object<string, object>} healthLookup - buildFileHealthLookup() output.
 * @param {string} cloneHref - relative href to health-duplicates.html from a module page.
 * @returns {string}
 */
function buildFileHero(mod, healthLookup, cloneHref) {
    var key = path.resolve(mod.filePath);
    var d = healthLookup[key];
    if (!d) {
        return '<aside class="qhero qhero-file" aria-label="Code health summary"><span class="qchip-empty">No code health data for this file.</span></aside>';
    }

    var score = d.healthScore;
    var color = qColor(score, "health");
    var grade = scoreToGrade(score);
    var pct = Math.max(0, Math.min(100, typeof score === "number" ? score : 0));
    var deg = (pct * 3.6).toFixed(1);
    var smellsText = (d.smells || []).length ? d.smells.join(", ") : "none";
    var worstColor = qSeverityColor(d.worst);

    var metrics = [
        { key: "mi", label: "Maintainability", value: d.mi, color: qColor(d.mi, "mi") },
        { key: "fns", label: "Functions", value: d.functions, color: null },
        { key: "err", label: "Errors", value: d.errors, color: qCountColor(d.errors) },
        { key: "warn", label: "Warnings", value: d.warnings, color: qWarnColor(d.warnings) },
        { key: "clones", label: "Clones", value: d.clones, color: qCountColor(d.clones) },
    ];
    var metricsHtml = metrics
        .map(function (m) {
            var raw = m.value == null ? "—" : m.value;
            var valueHtml =
                m.key === "clones" && d.clones > 0 && cloneHref
                    ? '<a href="' + esc(cloneHref) + '" style="color:' + (m.color || "var(--text)") + '">' + esc(raw) + "</a>"
                    : esc(raw);
            return (
                '<div class="qhero-metric"><span class="qhero-metric-dot" style="background:' +
                (m.color || "var(--border)") +
                '"></span><span class="qhero-metric-label">' +
                esc(m.label) +
                '</span><span class="qhero-metric-value">' +
                valueHtml +
                "</span></div>"
            );
        })
        .join("");

    var chips =
        '<span class="qhero-file-chip" style="background:' +
        worstColor +
        '">worst: ' +
        esc(d.worst || "ok") +
        "</span>" +
        '<span class="qhero-file-chip qhero-file-chip-muted">smells: ' +
        esc(smellsText) +
        "</span>";

    return (
        '<aside class="qhero qhero-file" aria-label="Code health summary">' +
        '<div class="qhero-gauge qhero-gauge-sm">' +
        gaugeArcSvg(color, pct / 100, 104) +
        '<div class="qhero-gauge-inner qhero-gauge-inner-sm">' +
        '<div class="qhero-grade qhero-grade-sm" style="color:' +
        color +
        '">' +
        esc(grade) +
        '</div><div class="qhero-score qhero-score-sm">' +
        esc(score == null ? "—" : score) +
        "</div></div></div>" +
        '<div class="qhero-divider"></div>' +
        '<div class="qhero-metrics qhero-metrics-grid">' +
        metricsHtml +
        "</div>" +
        '<div class="qhero-divider"></div>' +
        '<div class="qhero-trend qhero-file-side">' +
        '<div class="qhero-file-chips">' +
        chips +
        "</div>" +
        '<div class="qhero-file-narrative">' +
        esc(fileHeroNarrative(d)) +
        "</div>" +
        "</div>" +
        "</aside>"
    );
}

function buildModuleBody(mod, sourceUrl, symbolMap, functionHealthLookup) {
    if (!hasExports(mod)) {
        return '<div class="empty" style="padding:32px 40px;font-size:14px;color:var(--text3)">No exported items in this module.</div>';
    }
    var body = '';
    body += section('Functions', mod.functions, renderFunction, mod.filePath, sourceUrl, symbolMap, functionHealthLookup);
    body += section('Classes', mod.classes, renderClass, mod.filePath, sourceUrl, symbolMap, functionHealthLookup);
    body += section('Interfaces', mod.interfaces, renderInterface, mod.filePath, sourceUrl, symbolMap);
    body += section('Type Aliases', mod.typeAliases, renderTypeAlias, mod.ilePath, sourceUrl, symbolMap);
    body += section('Enums', mod.enums, renderEnum, mod.filePath, sourceUrl, symbolMap);
    body += section('Variables & Constants', mod.variables, renderVariable, mod.filePath, sourceUrl, symbolMap);
    return body;
}

function buildCss() {
    return CSS_STRUCTURE;
}

function page(title, sidebarHtml, bodyHtml, assetPrefix, topnavHtml, tocHtml) {
    var p = assetPrefix || '';
    var hasToc = !!tocHtml;
    var tocCol = hasToc ? '<aside class="toc" id="toc">' + tocHtml + '</aside>' : '';
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + esc(title) + '</title>\n<link rel="stylesheet" href="' + p + 'assets/style.css">\n</head>\n<body>\n'
        + (topnavHtml || '')
        + '\n<div class="layout' + (hasToc ? ' layout-toc' : '') + '">\n'
        + '<nav class="sidebar">' + sidebarHtml + '</nav>\n'
        + '<main class="main">' + bodyHtml + '</main>\n'
        + tocCol + '\n'
        + '</div>\n'
        + '<script src="' + p + 'search-index.js"></script>\n'
        + '<script src="' + p + 'assets/app.js"></script>\n'
        + '</body>\n</html>';
}

function buildSite(modules, options) {
    options = options || {};
    var projectName = options.projectName || 'Documentation';
    var version = options.version || '';
    var sourceUrl = options.sourceUrl || null;
    var symbolMap = buildSymbolMap(modules);
    var tree = pathTree(modules);
    var pages = [];

    // task-ls-04: link __parent pointers and precompute the default
    // (fully-closed, non-active) sidebar HTML ONCE per buildSite() call,
    // instead of once per PAGE (the O(N) linkParents walk and the O(N)
    // default-tree render were both previously repeated inside every
    // buildSidebar() call -- see adr-linear-scaling-fix.md). Only two
    // distinct sidebar prefixes exist within a single buildSite() call:
    // "" (index.html + health-detail pages, all at the output root) and
    // "../" (every module page, one level down) -- so exactly two caches.
    (function linkParentsOnce(node) {
        node.children.forEach(function (c) {
            c.__parent = node;
            if (c.type === "dir") linkParentsOnce(c);
        });
    })(tree);
    var defaultCacheRoot = new Map();
    var defaultCacheMod = new Map();
    precomputeDefaultTree(tree, 0, modules, "", defaultCacheRoot);
    precomputeDefaultTree(tree, 0, modules, "../", defaultCacheMod);

    var versions = options.versions || [];
    var currentVersionId = options.currentVersionId || null;
    var isSnapshot = !!options.isSnapshot;
    var toOutDirRootFromIndex = isSnapshot ? "../../" : "";
    var toOutDirRootFromModule = isSnapshot ? "../../../" : "../";
    var switcherRoot = buildVersionSwitcher(currentVersionId, versions, toOutDirRootFromIndex);
    var switcherMod = buildVersionSwitcher(currentVersionId, versions, toOutDirRootFromModule);

    // task-arch-04: architecture.html -- live/main build only, never for a
    // historical site-versions/ snapshot render (ADR Decision 6 reuses the
    // existing isSnapshot signal rather than adding a second flag), and only
    // when getAllFacts() produced at least one real signal
    // (buildArchitecturePage() returns null via buildArchitectureSection()'s
    // own empty-facts guard, in which case no page is pushed and no
    // sidebar navbutton is wired on any page).
    var archPage = (options.facts && !isSnapshot)
        ? buildArchitecturePage(options.facts, modules, projectName, version, tree, switcherRoot, defaultCacheRoot, true)
        : null;
    var architectureHrefIdx = archPage ? "architecture.html" : null;
    var architectureHrefMod = archPage ? "../architecture.html" : null;

    pages.push({ path: 'assets/style.css', html: buildCss() });
    pages.push({ path: 'assets/app.js',    html: CLIENT_JS });
    pages.push({ path: 'search-index.js',  html: 'window.__SEARCH_INDEX__=' + JSON.stringify(buildSearchIndex(modules, '')) + ';' });

    var totalFns = modules.reduce(function (s, m) { return s + m.functions.length; }, 0);
    var totalCls = modules.reduce(function (s, m) { return s + m.classes.length; }, 0);
    var idxBody = '<div class="index-content"><div class="page-header"><div class="page-title">' + esc(projectName) + '</div>'
        + '<div class="page-subtitle">' + modules.length + ' module(s) &middot; ' + totalFns + ' function(s) &middot; ' + totalCls + ' class(es)</div></div>'
        + (options.quality ? '' : buildIndexBody(modules))
        + buildQualitySection(options.quality)
        + '</div>';
    var qualityHrefIdx = options.quality ? '#code-health' : null;
    var topnavIdx = buildTopnav('Overview', switcherRoot);
    var sidebarIdx = buildSidebar(modules, projectName, version, 'index.html', '', null, tree, { qualityHref: qualityHrefIdx, architectureHref: architectureHrefIdx, activeSection: 'overview', defaultCache: defaultCacheRoot, parentsLinked: true });
    pages.push({ path: 'index.html', html: page(projectName, sidebarIdx, idxBody, '', topnavIdx, null) });

    if (archPage) pages.push(archPage);

    var fileHealthLookup = options.quality ? buildFileHealthLookup(options.quality) : {};
    if (options.quality) {
        pages = pages.concat(buildHealthDetailPages(options.quality, modules, projectName, version, tree, switcherRoot, defaultCacheRoot, true, architectureHrefIdx));
    }

    modules.forEach(function (mod) {
        var rel = moduleHtmlPath(mod.filePath, modules);
        var label = moduleLabel(mod.filePath, modules);
        var modHeader = '<div class="page-header">'
            + '<div class="breadcrumb"><a href="../index.html">' + esc(projectName) + '</a> / ' + esc(label) + '</div>'
            + '<div class="page-title">' + esc(label) + '</div>'
            + '<div class="page-subtitle">' + esc(mod.filePath) + '</div>'
            + (mod.description ? '<p class="module-desc">' + esc(mod.description) + '</p>' : '')
            + '</div>';
        var qualityHrefMod = options.quality ? '../index.html#code-health' : null;
        var crumbMod = '<a href="../index.html">' + esc(projectName) + '</a><span class="topnav-crumb-sep">/</span>' + esc(label);
        var topnavMod = buildTopnav(crumbMod, switcherMod);
        var tocHtml = buildToc(mod);
        var healthStripHtml = options.quality ? buildFileHero(mod, fileHealthLookup, '../health-duplicates.html') : '';
        var functionHealthLookup = options.quality ? buildFunctionHealthLookup(options.quality, mod.filePath) : null;
        pages.push({
            path: rel,
            html: page(
                label + ' - ' + projectName,
                        buildSidebar(modules, projectName, version, rel, '../', mod, tree, { qualityHref: qualityHrefMod, architectureHref: architectureHrefMod, activeSection: null, defaultCache: defaultCacheMod, parentsLinked: true }),
                '<div class="index-content">' + modHeader + healthStripHtml + buildModuleBody(mod, sourceUrl, symbolMap, functionHealthLookup) + '</div>',
                '../',
                topnavMod,
                tocHtml
            )
        });
    });

    return pages;
}

module.exports = {
    buildSite, moduleLabel, moduleHtmlPath, buildTopnav, buildQualitySection, CSS_STRUCTURE,
    pathTree, ancestorChain, cardBreadcrumb, buildFileHealthLookup, buildFileHero, buildHealthDetailPages,
    scoreToGrade, buildHealthSparkline, isTodoText, descText, buildFunctionHealthLookup, functionHealthChip,
    buildVersionSwitcher, formatVersionLabel,
    buildArchitectureSection, renderStructureNode, buildArchitecturePage,
};


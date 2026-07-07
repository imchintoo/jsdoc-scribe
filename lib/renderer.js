"use strict";

const path = require("path");

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const CSS_STRUCTURE = `
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap");
:root{--topnav-h:64px;--sidebar-w:224px;--toc-w:220px;--accent:#5B4FE8;--accent-hover:#4A3FD1;--accent-bg:rgba(91,79,232,.12);--text:#0D0D0D;--text2:#3A3A3A;--text3:#8A8A8A;--border:rgba(13,13,13,.10);--bg:#F5F4F0;--surface:#ffffff;--sidebar-bg:#0E0E10;--sidebar-section:#8C8981;--sidebar-text:#B7B4AC;--sidebar-text-hover:#F5F4F0;--sidebar-hover-bg:rgba(245,244,240,.06);--topnav-bg:#ffffff;--code-bg:#0E0E10;--code-text:#B7B4AC;--lime:#C6FF3D;--coral:#FF4B2E;--gold:#F5C518;--black:#0D0D0D;--black-soft:#161616;--offwhite:#F5F4F0;--offwhite-soft:#FAF9F5;--gray-900:#1A1A1A;--gray-700:#3A3A3A;--gray-500:#8A8A8A;--gray-300:#C7C5BE;--gray-200:#DEDCD4;--gray-100:#EAE8E1;--purple:#5B4FE8;--purple-hover:#4A3FD1;--purple-press:#3E34B8;--lime-hover:#B8F02A;--lime-press:#A6DC1E;--coral-hover:#E83E22;--coral-press:#D03418;--border-on-dark:rgba(245,244,240,0.12);--border-on-light:rgba(13,13,13,0.10);--text-on-lime:#0D0D0D;--font-display:"Space Grotesk","Inter Tight",-apple-system,sans-serif;--font-body:"Space Grotesk","Inter Tight",-apple-system,sans-serif;--font-mono:"JetBrains Mono","Fira Code",ui-monospace,monospace;--tracking-display:-0.02em;--text-mono-label:500 11px/1.2 var(--font-mono);--text-mono-badge:600 10px/1 var(--font-mono);--tracking-mono-label:0.08em;--text-button:500 15px/1 var(--font-body);--text-body-sm:400 14px/1.5 var(--font-body);--radius-sm:10px;--radius-md:16px;--radius-lg:24px;--radius-xl:28px;--radius-pill:999px;--shadow-card:0 2px 8px rgba(13,13,13,0.05), 0 8px 24px rgba(13,13,13,0.06);--shadow-inset-dark:inset 0 1px 0 rgba(255,255,255,0.04)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);font-size:15px;line-height:1.6;color:var(--text);background:var(--bg)}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code,pre{font-family:var(--font-mono)}
.topnav{position:sticky;top:0;z-index:200;background:var(--topnav-bg);border-bottom:1px solid var(--border);height:var(--topnav-h)}
.topnav-inner{display:flex;align-items:center;gap:24px;height:100%;padding:0 28px;justify-content:space-between}
.topnav-logo{font-size:15px;font-weight:700;color:var(--text);text-decoration:none;white-space:nowrap;flex-shrink:0}
.topnav-logo:hover{color:var(--accent)}
.topnav-version{font-size:11px;font-weight:400;color:var(--text3);font-family:monospace;margin-left:4px}
.topnav-search{flex:none;max-width:360px;margin:0;position:relative}
.search-box{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:999px;padding:7px 32px 7px 32px;color:var(--text);font-size:13px;outline:none}
.search-box:focus{border-color:var(--accent);background:var(--surface)}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;opacity:.5;pointer-events:none}
.search-kbd{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--border);border-radius:3px;padding:1px 5px;font-size:11px;color:var(--text3);font-family:monospace;pointer-events:none}
.search-results{display:none;position:absolute;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:320px;overflow-y:auto;z-index:300;margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,.12)}
.search-results.visible{display:block}
.search-result-item{display:block;padding:9px 14px;cursor:pointer;border-bottom:1px solid var(--border);text-decoration:none}
.search-result-item:hover{background:var(--bg)}
.sr-name{font-size:13px;font-weight:600;color:var(--text);font-family:monospace}
.sr-kind{font-size:10px;color:var(--text3);margin-left:6px;text-transform:uppercase;letter-spacing:.05em}
.sr-module{font-size:11px;color:var(--text3);display:block;margin-top:2px}
.sr-preview{font-size:11px;color:var(--text2);font-style:italic;display:block;margin-top:1px}
.search-no-results{padding:10px 14px;color:var(--text3);font-size:13px}
.layout{display:grid;grid-template-columns:var(--sidebar-w) 1fr;min-height:calc(100vh - var(--topnav-h))}
.layout-toc{grid-template-columns:var(--sidebar-w) 1fr var(--toc-w)}
.sidebar{grid-column:1;background:var(--sidebar-bg);border-right:1px solid var(--border);position:sticky;top:var(--topnav-h);height:calc(100vh - var(--topnav-h));overflow-y:auto}
.sidebar-inner{padding:16px 0 32px}
.sidebar-inner[role="tree"]{}
.sidebar-section-title{padding:16px 16px 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sidebar-section);position:sticky;top:0;z-index:2;background:var(--sidebar-bg);}
.sidebar-link{display:block;padding:6px 16px;font-size:13px;color:var(--sidebar-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .1s,background .1s;border-radius:6px}
.sidebar-link:hover{color:var(--sidebar-text-hover);background:var(--sidebar-hover-bg);text-decoration:none}
.sidebar-link.active{color:#fff;font-weight:600;background:var(--accent);border-left:2px solid var(--accent);padding-left:14px;border-radius:6px}
.sidebar-dir-toggle{display:flex;align-items:center;gap:5px;cursor:pointer;list-style:none;padding:6px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sidebar-section);user-select:none;position:sticky;z-index:1;background:var(--sidebar-bg);}
.sidebar-dir-toggle::-webkit-details-marker{display:none}
.sidebar-dir-toggle::before{content:'▶';font-size:8px;transition:transform .15s;flex-shrink:0}
details[open] .sidebar-dir-toggle::before{transform:rotate(90deg)}
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
.sym-fn{background:var(--lime)}
.sym-cls{background:var(--accent)}
.sym-iface{background:var(--coral)}
.sym-enum{background:var(--coral)}
.sym-type{background:var(--sidebar-text)}
.sym-var{background:var(--gold)}
.sym-link{font-size:12px;color:var(--sidebar-text);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.sym-link:hover{color:var(--sidebar-text-hover);text-decoration:none}
.sym-link.active{color:#fff;font-weight:600}
.main{min-width:0;overflow-x:hidden}
.page-header{padding:32px 48px 24px;border-bottom:1px solid var(--border)}
.page-title{font-size:26px;font-weight:700;color:var(--text);margin-bottom:4px;letter-spacing:-.02em}
.page-subtitle{color:var(--text3);font-size:12px;margin-bottom:0;font-family:monospace}
.module-desc{color:var(--text2);font-size:14px;line-height:1.7;margin-top:10px;max-width:600px}
.breadcrumb{font-size:13px;color:var(--text3);margin-bottom:12px}
.breadcrumb a{color:var(--accent)}
.section{margin-bottom:0}
.section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);padding:20px 32px 10px;display:flex;align-items:center;gap:8px;border-top:1px solid var(--border);background:#f9fbfd}
.section:first-child .section-title{border-top:none}
.index-content .section-title{border-top:none}
.section-count{font-size:10px;font-weight:400;color:#b0bec8;font-family:monospace}
.card{display:grid;grid-template-columns:1fr 380px;background:var(--surface);border-bottom:1px solid var(--border);scroll-margin-top:calc(var(--topnav-h) + 8px)}
.card-prose{padding:24px 32px;border-right:1px solid var(--border);min-width:0}
.card-code{background:var(--black-soft);padding:22px 20px;min-width:0;overflow:hidden}
.card-header{display:flex;align-items:flex-start;gap:8px;margin-bottom:4px}
.card-name{font-size:14px;font-weight:700;color:var(--text);font-family:monospace;flex:1;min-width:0;word-break:break-all}
.card-sig{font-size:12px;color:var(--text2);font-family:monospace;margin-top:4px;word-break:break-word;line-height:1.5}
.card-desc{font-size:13px;color:var(--text2);margin-top:10px;line-height:1.6;max-width:520px}
.card-anchor{color:#b0bec8;opacity:0;font-size:12px;margin-left:3px;transition:opacity .15s;text-decoration:none;flex-shrink:0}
.card:hover .card-anchor{opacity:.6}
.card-anchor:hover{opacity:1;text-decoration:none}
.code-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#4a6f8a;margin-bottom:8px}
.card-code pre{margin:0;font-size:12px;line-height:1.65;color:var(--code-text);overflow-x:auto;white-space:pre-wrap;word-break:break-word;tab-size:2}
.copy-btn{float:right;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:4px;padding:3px 8px;font-size:10px;color:#7a95b0;cursor:pointer;transition:all .15s;margin:-2px 0 6px 6px}
.copy-btn:hover{background:rgba(255,255,255,.13);color:#c8daea}
.copy-btn.copied{background:rgba(74,222,128,.15);border-color:rgba(74,222,128,.3);color:#4ade80}
.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:.02em;margin-right:3px;margin-top:4px;vertical-align:middle}
.badge-exported{background:#dcfce7;color:#166534}
.badge-async{background:#eff6ff;color:#1e40af}
.badge-abstract{background:#fce7f3;color:#9d174d}
.badge-static{background:#fefce8;color:#854d0e}
.badge-readonly{background:#f5f3ff;color:#5b21b6}
.badge-generator{background:#ecfdf5;color:#065f46}
.badge-deprecated{background:#fef2f2;color:#991b1b}
.badge-since{background:#f0fdf4;color:#166534}
.badge-optional{background:#f5f3ff;color:#5b21b6}
.badge-const{background:#ede9fe;color:#4c1d95}
.badge-var{background:#fff7ed;color:#9a3412}
.badge-private{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
.badge-protected{background:#fefce8;color:#92400e}
.badge-public{background:#f0fdf4;color:#166534}
.deprecated-notice{background:#fef2f2;color:#991b1b;border-radius:5px;padding:8px 14px;font-size:13px;margin-top:10px;border:1px solid #fecaca}
.since-label{font-size:11px;color:var(--text3);margin-top:4px}
.params-table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
.params-table th{text-align:left;padding:6px 10px;background:#f8fafc;color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)}
.params-table td{padding:8px 10px;border-bottom:1px solid #f1f5f9;color:var(--text);vertical-align:top;line-height:1.5}
.params-table td code{background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:12px;color:var(--text2)}
.params-table td:first-child code{color:var(--text);font-weight:600}
.returns{margin-top:12px;font-size:13px;color:var(--text2);padding-top:10px;border-top:1px solid #f1f5f9}
.returns code{background:#f1f5f9;padding:1px 6px;border-radius:3px;font-family:monospace;font-size:12px}
.throws-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
.throws-table th{text-align:left;padding:6px 10px;background:#fef2f2;color:#991b1b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #fecaca}
.throws-table td{padding:7px 10px;border-bottom:1px solid #fff5f5;color:var(--text);vertical-align:top}
.throws-table td code{font-size:12px;color:#991b1b}
.collapse-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;list-style:none;margin-top:16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);padding:0}
.collapse-toggle::-webkit-details-marker{display:none}
.collapse-toggle::before{content:'▶';font-size:8px;transition:transform .15s;color:#b0bec8}
details[open] .collapse-toggle::before{transform:rotate(90deg)}
.collapse-body{margin-top:6px}
.method-row{margin-top:8px;padding:10px 0;border-top:1px solid #f1f5f9}
.method-sig{font-family:monospace;font-size:13px;color:var(--text)}
.method-desc{font-size:12px;color:var(--text3);margin-top:4px}
.source-link{font-size:11px;color:var(--text3);font-family:monospace;text-decoration:none;flex-shrink:0}
.source-link:hover{color:var(--accent);text-decoration:none}
.link-ref{color:var(--accent);text-decoration:none}
.link-ref:hover{text-decoration:underline}
.anchor-link{color:#b0bec8;opacity:0;font-size:13px;margin-left:6px;transition:opacity .15s}
.card:hover .anchor-link{opacity:.6}
.anchor-link:hover{opacity:1;text-decoration:none}
.empty{color:var(--text3);font-size:13px;font-style:italic;padding:24px 32px}
.index-content{padding:32px 48px 80px}
.module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:8px}
.module-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px 20px;display:block;transition:border-color .15s,box-shadow .15s}
.module-card:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(98,91,246,.1);text-decoration:none}
.module-card-path{font-size:11px;font-weight:500;color:var(--text2);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.01em}
.module-card-path-sep{color:#c8d3dc;margin:0 3px;font-weight:400}
.module-card-name{font-size:14px;font-weight:700;color:var(--text);font-family:monospace;margin-bottom:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
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
.qtable th{text-align:left;padding:6px 10px;background:#f8fafc;color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)}
.qtable td{padding:7px 10px;border-bottom:1px solid #f1f5f9;color:var(--text);vertical-align:top}
.qtable tbody tr:nth-child(even){background:#f9fbfd}
.qtable td code{background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:12px}
.qempty{color:var(--text3);font-size:13px;font-style:italic;padding:4px 0 16px}
.qcard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:16px 0 24px}
.qcard{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.qcard-title{font-size:13px;font-weight:700;color:var(--text)}
.qcard-statline{font-size:12px;color:var(--text3);margin-top:2px}
.qcard-preview{display:flex;flex-direction:column}
.qcard-row{display:flex;justify-content:space-between;gap:8px;padding:5px 0;font-size:12.5px;border-bottom:1px solid #f1f5f9;color:var(--text2)}
.qcard-row:last-child{border-bottom:none}
.qcard-row a{color:var(--accent);text-decoration:none}
.qcard-row a:hover{text-decoration:underline}
.qcard-more{margin-top:2px;font-size:12px;font-weight:600;color:var(--accent);text-decoration:none;display:inline-flex;align-items:center;gap:4px}
.focus-btn{display:flex;justify-content:center;font:var(--text-mono-badge);letter-spacing:var(--tracking-mono-label);text-transform:uppercase;border-radius:var(--radius-pill);padding:10px 16px;margin-top:6px;text-decoration:none;transition:filter .15s ease}
.focus-btn:hover{filter:brightness(0.92);text-decoration:none}
.focus-btn:active{filter:brightness(0.85)}
.qcard-more:hover{text-decoration:underline}
.qback{display:inline-block;font-size:13px;color:var(--accent);text-decoration:none;margin-bottom:16px}
.qback:hover{text-decoration:underline}
.qstrip{margin:0 32px 16px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;display:flex;flex-wrap:wrap}
.qchip{display:flex;flex-direction:column;padding:4px 14px;border-right:1px solid var(--border);min-width:84px}
.qchip:last-child{border-right:none}
.qchip-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text3)}
.qchip-value{font-size:14px;font-weight:700;color:var(--text);font-family:monospace;margin-top:1px}
.qchip-value a{text-decoration:none}
.qchip-value a:hover{text-decoration:underline}
.qchip-empty{padding:6px 14px;font-size:12.5px;color:var(--text3);font-style:italic}
.qcard-row a:focus-visible,.qcard-more:focus-visible,.qback:focus-visible,.qchip-value a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:2px}
@media(max-width:720px){.qstrip{margin-left:24px;margin-right:24px}.qchip{border-right:none;border-bottom:1px solid var(--border);width:50%}.qchip:nth-child(odd){border-right:1px solid var(--border)}}
.qhero{background:var(--code-bg);border-radius:10px;padding:24px 28px;display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin:8px 0 20px}
.qhero-gauge{position:relative;width:168px;height:168px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center}
.qhero-gauge-inner{position:absolute;inset:13px;border-radius:50%;background:var(--code-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.qhero-grade{font-size:44px;font-weight:800;line-height:1}
.qhero-score{font-size:21px;font-weight:700;color:#fff;margin-top:3px}
.qhero-score-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--code-text);margin-top:3px}
.qhero-divider{width:1px;align-self:stretch;background:rgba(255,255,255,.14);flex:none}
.qhero-metrics{display:flex;flex-direction:column;gap:7px;flex:none;min-width:180px}
.qhero-metric{display:flex;align-items:center;gap:8px;font-size:11.5px}
.qhero-metric-dot{width:7px;height:7px;border-radius:50%;flex:none}
.qhero-metric-label{text-transform:uppercase;letter-spacing:.05em;font-size:10.5px;color:var(--code-text);flex:1}
.qhero-metric-value{font-weight:700;color:#fff;font-family:monospace;font-size:12.5px}
.qhero-trend{flex:1;min-width:200px}
.qhero-trend-badge{display:inline-block;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:4px 10px;border-radius:99px;margin-bottom:8px}
.qhero-sparkline{display:block}
.qhero-trend-caption{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--code-text);margin-top:4px}
.qhero-trend-empty{font-size:12.5px;line-height:1.5;color:var(--code-text);max-width:340px}
.qhero-trend-empty code{color:#fff;font-size:11.5px}
@media(max-width:720px){.qhero{flex-direction:column;align-items:stretch}.qhero-divider{display:none}}
.qcard2{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;display:flex;flex-direction:column}
.qcard2-bar{height:4px}
.qcard2-body{padding:16px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.qcard2-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.qcard2-big{text-align:right;flex:none;padding-left:8px}
.qcard2-bigvalue{font-size:22px;font-weight:700;font-family:monospace;line-height:1}
.qcard2-bigcaption{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text3);white-space:nowrap;margin-top:3px}
.tag-chip{display:inline-block;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:5px 11px;border-radius:99px;margin-bottom:7px;border:1.5px solid #fff}
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
.qcard-expand-toggle::before{content:'\u25B8';font-size:9px;transition:transform .15s}
details[open]>.qcard-expand-toggle::before{transform:rotate(90deg)}
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
.todo-badge{display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;background:#FFF3CF;color:#8A6400;padding:2px 7px;border-radius:99px;margin-right:6px;vertical-align:middle}
.todo-text{font-style:italic;color:var(--text3)}
.sidebar-brand{padding:2px 10px 4px;display:flex;align-items:baseline;gap:8px}
.sidebar-logo{font-size:19px;font-weight:700;color:var(--sidebar-text-hover);letter-spacing:-.01em}
.sidebar-version{padding:0 10px 18px;font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--text3)}
.navbtn{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;border:none;cursor:pointer;background:transparent;color:var(--sidebar-text);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;width:100%;text-align:left;box-sizing:border-box;text-decoration:none;margin-bottom:2px}
.navbtn:hover{background:var(--sidebar-hover-bg);color:var(--sidebar-text-hover);text-decoration:none}
.navbtn.active{background:var(--accent);color:#fff}
.sidebar-nav-section{padding:20px 12px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)}
.topnav-crumb{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topnav-crumb a{color:var(--text3)}
.topnav-crumb a:hover{color:var(--accent)}
.topnav-crumb-sep{color:var(--border);margin:0 2px}
.version-switcher{position:relative;flex:none;margin-left:auto}
.version-switcher-trigger{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--radius-pill);border:1px solid var(--border-on-light);background:var(--gray-100);cursor:pointer;list-style:none;font:var(--text-mono-label);letter-spacing:var(--tracking-mono-label);text-transform:uppercase;color:var(--gray-700)}
.version-switcher-trigger::-webkit-details-marker{display:none}
.version-switcher-trigger:hover{background:var(--gray-200)}
details.version-switcher[open]>.version-switcher-trigger{background:var(--gray-200)}
.version-switcher-trigger:focus-visible{outline:2px solid var(--purple);outline-offset:2px}
.version-switcher-chevron{transition:transform .15s ease}
details.version-switcher[open]>.version-switcher-trigger .version-switcher-chevron{transform:rotate(180deg)}
.version-switcher-menu{position:absolute;right:0;top:calc(100% + 8px);background:#fff;border-radius:var(--radius-md);box-shadow:var(--shadow-card);border:1px solid var(--border-on-light);min-width:220px;max-height:320px;overflow-y:auto;padding:6px;z-index:250}
.version-switcher-item{display:block;padding:9px 12px;border-radius:var(--radius-sm);font:13px var(--font-body);color:var(--gray-700);text-decoration:none;margin-bottom:2px}
.version-switcher-item:last-child{margin-bottom:0}
.version-switcher-item:hover{background:var(--gray-100);text-decoration:none}
.version-switcher-item:focus-visible{outline:2px solid var(--purple);outline-offset:-2px}
.version-switcher-item.is-current{color:var(--purple);font-weight:600;background:var(--gray-100)}
.version-switcher-static{display:inline-flex;align-items:center;padding:6px 14px;border-radius:var(--radius-pill);background:var(--gray-100);font:var(--text-mono-label);letter-spacing:var(--tracking-mono-label);text-transform:uppercase;color:var(--gray-700);flex:none;margin-left:auto}
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
            '<div class="deprecated-notice">&#9888; Deprecated' +
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

function commonRoot(modules) {
    if (!modules.length) return "";
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
    return parts[0].slice(0, i).join("/");
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
        '<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
        '<input id="search-box" class="search-box" type="search" placeholder="Search... (Ctrl+K)" autocomplete="off">' +
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

function renderTreeLevel(node, depth, modules, activePath, prefix, activeModule, ancestorsOfActive) {
    var html = "";
    var count = node.children.length;
    node.children.forEach(function (child, idx) {
        var setsize = count;
        var posinset = idx + 1;
        if (child.type === "dir") {
            var isAncestor = ancestorsOfActive.indexOf(child) !== -1;
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
                renderTreeLevel(child, depth + 1, modules, activePath, prefix, activeModule, ancestorsOfActive) +
                "</details>";
        } else {
            var rel = moduleHtmlPath(child.mod.filePath, modules);
            var isActive = activePath === rel;
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
    // Attach __parent links (non-enumerable-ish, used only for dirTitle tooltip text)
    (function linkParents(node) {
        node.children.forEach(function (c) {
            c.__parent = node;
            if (c.type === "dir") linkParents(c);
        });
    })(tree);
    var ancestorsOfActive = activeModule ? ancestorChain(tree, activeModule) : [];
    var brand = '<div class="sidebar-brand"><span class="sidebar-logo">' + esc(projectName) + '</span></div>'
        + (version ? '<div class="sidebar-version">v' + esc(version) + ' &middot; npm</div>' : "");
    var navButtons = '<a class="navbtn' + (opts.activeSection === "overview" ? " active" : "") + '" href="' + esc(prefix + "index.html") + '">Overview</a>'
        + (opts.qualityHref ? '<a class="navbtn sidebar-quality-link' + (opts.activeSection === "quality" ? " active" : "") + '" href="' + esc(opts.qualityHref) + '">\u2733 Code Health</a>' : "");
    var html = '<div class="sidebar-inner" role="tree" aria-label="Modules">' + brand + navButtons + '<div class="sidebar-section-title">Modules</div>';
    html += renderTreeLevel(tree, 0, modules, activePath, prefix, activeModule, ancestorsOfActive);
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

    return (
        '<div class="qcard2"><div class="qcard2-bar" style="background:' +
        opts.tagColor +
        '"></div><div class="qcard2-body">' +
        '<div class="qcard2-head"><div>' +
        '<span class="tag-chip" style="background:' +
        opts.tagBg +
        ";color:" +
        opts.tagText +
        '">' +
        esc(opts.tag) +
        "</span>" +
        '<div class="qcard-title">' +
        esc(opts.title) +
        "</div>" +
        (opts.statLineHtml ? '<div class="qcard-statline">' + opts.statLineHtml + "</div>" : "") +
        "</div>" +
        '<div class="qcard2-big"><div class="qcard2-bigvalue" style="color:' +
        opts.tagColor +
        '">' +
        esc(opts.bigValue) +
        '</div><div class="qcard2-bigcaption">' +
        esc(opts.bigCaption) +
        "</div></div>" +
        "</div>" +
        '<div class="qcard-preview">' +
        previewHtml +
        "</div>" +
        expandHtml +
        '<a class="qcard-more focus-btn" style="background:' +
        opts.tagBg +
        ';color:' +
        opts.tagText +
        '" href="' +
        esc(opts.moreHref) +
        '">' +
        esc(opts.moreLabel) +
        "</a>" +
        "</div></div>"
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
        '<div class="qhero-gauge" style="background:conic-gradient(' +
        color +
        " 0deg " +
        deg +
        "deg, var(--border) " +
        deg +
        'deg 360deg)"><div class="qhero-gauge-inner">' +
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
        tag: "NEEDS ATTENTION", tagBg: "#cf222e", tagText: "#fff", tagColor: "#cf222e",
        bigValue: String(attn.length), bigCaption: "file" + (attn.length === 1 ? "" : "s") + " flagged",
    });

    var clones = result.clones || [];
    var cloneCard = qCard({
        title: "Duplicate code",
        statLineHtml: "",
        rows: clones.map(function (c) { return [c.blockA.filePath + " ↔ " + c.blockB.filePath, Math.round(c.similarity * 100) + "%", null]; }),
        moreHref: "health-duplicates.html",
        moreLabel: clones.length ? "Open full page &rarr;" : "View details &rarr;",
        tag: "DUPLICATION", tagBg: "var(--accent)", tagText: "#fff", tagColor: "var(--accent)",
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
            tag: "STRUCTURE", tagBg: "var(--bg)", tagText: "var(--text2)", tagColor: "var(--text3)",
            bigValue: inDegreeEntries.length ? inDegreeEntries[0][1] + "x" : "0", bigCaption: "top import count",
        });
        orphansCard = qCard({
            title: "Orphan files",
            statLineHtml: "",
            rows: orphans.map(function (f) { return [f, null, null]; }),
            moreHref: "health-orphans.html",
            moreLabel: orphans.length ? "Open full page &rarr;" : "View details &rarr;",
            tag: "CLEANUP", tagBg: "var(--bg)", tagText: "#9a6700", tagColor: "#9a6700",
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
 * @returns {{path: string, html: string}[]}
 */
function buildHealthDetailPages(quality, modules, projectName, version, tree, switcherHtml) {
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
        var sidebar = buildSidebar(modules, projectName, version, slug, "", null, tree, { qualityHref: "index.html#code-health", activeSection: "quality" });
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
            var raw = m.value == null ? "\u2014" : m.value;
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
        '<div class="qhero-gauge qhero-gauge-sm" style="background:conic-gradient(' +
        color +
        " 0deg " +
        deg +
        "deg, var(--border) " +
        deg +
        'deg 360deg)"><div class="qhero-gauge-inner qhero-gauge-inner-sm">' +
        '<div class="qhero-grade qhero-grade-sm" style="color:' +
        color +
        '">' +
        esc(grade) +
        '</div><div class="qhero-score qhero-score-sm">' +
        esc(score == null ? "\u2014" : score) +
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
    body += section('Type Aliases', mod.typeAliases, renderTypeAlias, mod.filePath, sourceUrl, symbolMap);
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

    var versions = options.versions || [];
    var currentVersionId = options.currentVersionId || null;
    var isSnapshot = !!options.isSnapshot;
    var toOutDirRootFromIndex = isSnapshot ? "../../" : "";
    var toOutDirRootFromModule = isSnapshot ? "../../../" : "../";
    var switcherRoot = buildVersionSwitcher(currentVersionId, versions, toOutDirRootFromIndex);
    var switcherMod = buildVersionSwitcher(currentVersionId, versions, toOutDirRootFromModule);

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
    var sidebarIdx = buildSidebar(modules, projectName, version, 'index.html', '', null, tree, { qualityHref: qualityHrefIdx, activeSection: 'overview' });
    pages.push({ path: 'index.html', html: page(projectName, sidebarIdx, idxBody, '', topnavIdx, null) });

    var fileHealthLookup = options.quality ? buildFileHealthLookup(options.quality) : {};
    if (options.quality) {
        pages = pages.concat(buildHealthDetailPages(options.quality, modules, projectName, version, tree, switcherRoot));
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
                        buildSidebar(modules, projectName, version, rel, '../', mod, tree, { qualityHref: qualityHrefMod, activeSection: null }),
                modHeader + healthStripHtml + buildModuleBody(mod, sourceUrl, symbolMap, functionHealthLookup),
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
};

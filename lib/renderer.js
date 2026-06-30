"use strict";

const path = require("path");

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

const THEMES = {
    default: {
        light: `:root{--bg:#f8f9fc;--surface:#fff;--border:#e0e4f0;--text:#1a1a2e;--text2:#555;--text3:#888;--sidebar-bg:#1a1a2e;--sidebar-text:#c8d3f0;--sidebar-active:#2d2d4e;--sidebar-title:#7986cb;--accent:#4361ee;--accent2:#e8eaf6;--search-bg:#2d2d4e;--search-border:#3a3a5e;--search-text:#e0e4f8;--search-panel:#252543;--th-bg:#f5f6fa;--code-bg:#f5f6fa;--sub-label:#7986cb;--method-border:#f0f0f0;--dep-bg:#fff8e1;--dep-text:#e65100;--throws-bg:#fce4ec;--throws-text:#c62828}`,
        dark: `[data-theme=dark]{--bg:#0f0f1a;--surface:#1a1a2e;--border:#2d2d4e;--text:#e0e4f8;--text2:#9aa5c8;--text3:#5a6494;--sidebar-bg:#0a0a14;--sidebar-text:#9aa5c8;--sidebar-active:#1a1a2e;--sidebar-title:#5a6494;--accent:#6b8cff;--accent2:#1a1f3a;--search-bg:#1a1a2e;--search-border:#2d2d4e;--search-text:#c8d3f0;--search-panel:#0f0f1a;--th-bg:#1a1a2e;--code-bg:#1a1a2e;--sub-label:#5a6494;--method-border:#2d2d4e;--dep-bg:#2d2000;--dep-text:#ffb300;--throws-bg:#2d0a14;--throws-text:#ef9a9a}`,
        toggleBtn: true,
    },
    minimal: {
        light: `:root{--bg:#fff;--surface:#fafafa;--border:#e8e8e8;--text:#222;--text2:#555;--text3:#888;--sidebar-bg:#f5f5f5;--sidebar-text:#444;--sidebar-active:#e8e8e8;--sidebar-title:#888;--accent:#0066cc;--accent2:#e8f0fe;--search-bg:#fff;--search-border:#ddd;--search-text:#222;--search-panel:#fff;--th-bg:#f5f5f5;--code-bg:#f5f5f5;--sub-label:#888;--method-border:#efefef;--dep-bg:#fff8e1;--dep-text:#b36b00;--throws-bg:#fff0f0;--throws-text:#c00}`,
        dark: ``,
        toggleBtn: false,
    },
    dark: {
        light: `:root{--bg:#0f0f1a;--surface:#1a1a2e;--border:#2d2d4e;--text:#e0e4f8;--text2:#9aa5c8;--text3:#5a6494;--sidebar-bg:#0a0a14;--sidebar-text:#9aa5c8;--sidebar-active:#1a1a2e;--sidebar-title:#5a6494;--accent:#6b8cff;--accent2:#1a1f3a;--search-bg:#1a1a2e;--search-border:#2d2d4e;--search-text:#c8d3f0;--search-panel:#0f0f1a;--th-bg:#1a1a2e;--code-bg:#1a1a2e;--sub-label:#5a6494;--method-border:#2d2d4e;--dep-bg:#2d2000;--dep-text:#ffb300;--throws-bg:#2d0a14;--throws-text:#ef9a9a}`,
        dark: ``,
        toggleBtn: false,
    },
};

// ---------------------------------------------------------------------------
// CSS — layout, components, responsive, print
// ---------------------------------------------------------------------------

const CSS_STRUCTURE = `
/* == Reset & base == */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:var(--text);background:var(--bg);transition:background .2s,color .2s}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code,pre{font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace}

/* == Three-column layout == */
.layout{display:grid;grid-template-columns:272px 1fr;min-height:100vh}
.layout.has-toc{grid-template-columns:272px 1fr 224px}

/* == Left sidebar == */
.sidebar{grid-column:1;background:var(--sidebar-bg);color:var(--sidebar-text);position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.06)}
.sidebar-header{padding:16px 14px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-bottom:1px solid var(--search-border);flex-shrink:0}
.sidebar-header a{color:var(--sidebar-text);font-size:14px;font-weight:700;letter-spacing:-.01em}
.sidebar-header .version{display:block;font-size:11px;color:var(--sidebar-title);margin-top:2px;font-family:monospace}
.theme-btn{background:none;border:1px solid var(--search-border);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--sidebar-text);cursor:pointer;white-space:nowrap;flex-shrink:0;margin-top:2px}
.theme-btn:hover{background:var(--sidebar-active)}

/* == Search == */
.search-wrap{position:relative;padding:10px 12px;border-bottom:1px solid var(--search-border);flex-shrink:0}
.search-icon{position:absolute;left:20px;top:50%;transform:translateY(-50%);width:14px;height:14px;opacity:.5;pointer-events:none}
.search-box{width:100%;background:var(--search-bg);border:1px solid var(--search-border);border-radius:6px;padding:6px 10px 6px 30px;color:var(--search-text);font-size:13px;outline:none}
.search-box::placeholder{color:var(--sidebar-title)}
.search-box:focus{border-color:var(--accent)}
.search-results{display:none;position:absolute;left:12px;right:12px;background:var(--search-panel);border:1px solid var(--search-border);border-radius:6px;max-height:320px;overflow-y:auto;z-index:100;margin-top:2px;box-shadow:0 4px 20px rgba(0,0,0,.18)}
.search-results.visible{display:block}
.search-result-item{display:block;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--search-border);text-decoration:none}
.search-result-item:hover{background:var(--sidebar-active)}
.sr-name{font-size:13px;font-weight:600;color:var(--search-text);font-family:monospace}
.sr-kind{font-size:11px;color:var(--sidebar-title);margin-left:6px}
.sr-module{font-size:11px;color:var(--sidebar-title);display:block;margin-top:1px;opacity:.7}
.search-no-results{padding:10px 12px;color:var(--sidebar-title);font-size:13px}
.sr-preview{font-size:11px;color:var(--text3);font-style:italic;display:block;margin-top:2px}

/* == Sidebar tree == */
.sidebar-section{padding:4px 0 12px;flex:1;overflow-y:auto}
.sidebar-section-title{padding:10px 14px 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sidebar-title)}
.sidebar-link{display:block;padding:4px 14px;font-size:13px;color:var(--sidebar-text);transition:background .1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sidebar-link:hover{background:var(--sidebar-active);color:var(--text);text-decoration:none}
.sidebar-link.active{background:var(--sidebar-active);color:var(--text);text-decoration:none;border-left:2px solid var(--accent);padding-left:12px}
.sidebar-dir-toggle{display:flex;align-items:center;gap:5px;cursor:pointer;list-style:none;padding:4px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sidebar-title);user-select:none}
.sidebar-dir-toggle::-webkit-details-marker{display:none}
.sidebar-dir-toggle::before{content:'▶';font-size:8px;transition:transform .15s;flex-shrink:0}
details[open] .sidebar-dir-toggle::before{transform:rotate(90deg)}
.sidebar-link-indent{padding-left:26px}
.sidebar-link-indent.active{padding-left:24px}

/* Symbol rows under active module */
.sym-rows{padding:2px 0 6px}
.sym-row{display:flex;align-items:center;gap:5px;padding:2px 12px 2px 36px;min-width:0}
.sym-pill{font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;font-family:monospace;flex-shrink:0;letter-spacing:.01em;line-height:1.4}
.sym-fn{background:#1b3a1e;color:#81c784}
.sym-cls{background:#0d2137;color:#64b5f6}
.sym-iface{background:#1a0a2e;color:#ce93d8}
.sym-enum{background:#2d1500;color:#ffb74d}
.sym-type{background:#00211f;color:#4db6ac}
.sym-var{background:#1f1f1f;color:#9e9e9e}
[data-theme=light] .sym-fn,[data-theme=default] .sym-fn,.sym-fn{background:#1b3a1e;color:#81c784}
.sym-link{font-size:12px;color:var(--sidebar-text);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;opacity:.85}
.sym-link:hover{color:var(--text);opacity:1;text-decoration:none}
.sym-link.active{color:var(--accent);opacity:1;font-weight:600}

/* == Main content area == */
.main{padding:40px 48px 80px;min-width:0;overflow-x:hidden}
.page-title{font-size:26px;font-weight:700;color:var(--text);margin-bottom:4px;letter-spacing:-.02em}
.page-subtitle{color:var(--text2);font-size:12px;margin-bottom:16px;font-family:monospace}
.module-desc{color:var(--text2);font-size:14px;line-height:1.7;margin-bottom:28px;max-width:700px}
.section{margin-bottom:44px}
.section-title{font-size:16px;font-weight:700;color:var(--text);margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid var(--accent2);display:flex;align-items:center;gap:8px}
.section-count{font-size:12px;font-weight:400;color:var(--text3);font-family:monospace}

/* == Cards == */
.card{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--border);border-radius:8px;padding:18px 20px 16px;margin-bottom:10px;scroll-margin-top:24px;transition:box-shadow .15s,border-left-color .15s}
.card:hover{box-shadow:0 2px 12px rgba(0,0,0,.08)}
.card-fn{border-left-color:#43a047}
.card-cls{border-left-color:#1e88e5}
.card-iface{border-left-color:#8e24aa}
.card-enum{border-left-color:#fb8c00}
.card-type{border-left-color:#00897b}
.card-var{border-left-color:#757575}
.card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:2px}
.card-name{font-size:15px;font-weight:700;color:var(--text);font-family:monospace;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.card-sig{font-size:12px;color:var(--text2);margin-top:3px;font-family:monospace;word-break:break-all;line-height:1.5}
.card-desc{font-size:13px;color:var(--text2);margin-top:8px;line-height:1.6}
.card-example{margin-top:12px}
.card-example pre{background:var(--code-bg);border:1px solid var(--border);border-radius:6px;padding:12px 16px;font-size:12px;overflow-x:auto;color:var(--text);line-height:1.6;tab-size:2}
.copy-btn{flex-shrink:0;background:none;border:1px solid var(--border);border-radius:5px;padding:3px 8px;font-size:11px;color:var(--text3);cursor:pointer;transition:all .15s;white-space:nowrap}
.copy-btn:hover{background:var(--accent2);border-color:var(--accent);color:var(--accent)}
.copy-btn.copied{background:#e8f5e9;border-color:#43a047;color:#2e7d32}

/* == Badges == */
.badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600;margin-right:3px;margin-top:5px}
.badge-exported{background:#e8f5e9;color:#2e7d32}
.badge-async{background:#e3f2fd;color:#1565c0}
.badge-abstract{background:#fce4ec;color:#c62828}
.badge-static{background:#fff3e0;color:#e65100}
.badge-readonly{background:#f3e5f5;color:#6a1b9a}
.badge-generator{background:#e0f2f1;color:#00695c}
.badge-private{background:#fafafa;color:#666;border:1px solid #ddd}
.badge-protected{background:#fff8e1;color:#f57f17}
.badge-public{background:#f5f5f5;color:#555}
.badge-optional{background:#f3e5f5;color:#6a1b9a}
.badge-const{background:#ede7f6;color:#4527a0}
.badge-var{background:#fff3e0;color:#e65100}
.badge-deprecated{background:var(--dep-bg);color:var(--dep-text)}
.badge-since{background:#e8f5e9;color:#2e7d32}
.deprecated-notice{background:var(--dep-bg);color:var(--dep-text);border-radius:5px;padding:6px 12px;font-size:12px;margin-top:8px}
.since-label{font-size:11px;color:var(--text3);margin-top:4px}

/* == Tables == */
.throws-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;border:1px solid var(--throws-bg)}
.throws-table th{text-align:left;padding:5px 10px;background:var(--throws-bg);color:var(--throws-text);font-weight:600;font-size:12px}
.throws-table td{padding:5px 10px;border-top:1px solid var(--border);color:var(--text);vertical-align:top}
.throws-table td code{font-size:12px}
.params-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
.params-table th{text-align:left;padding:6px 10px;background:var(--th-bg);color:var(--text2);font-weight:600;border-bottom:2px solid var(--border)}
.params-table td{padding:6px 10px;border-bottom:1px solid var(--method-border);vertical-align:top;color:var(--text)}
.params-table td code{background:var(--code-bg);padding:1px 5px;border-radius:3px;font-size:12px}
.returns{margin-top:8px;font-size:13px;color:var(--text2)}
.returns code{background:var(--code-bg);padding:1px 6px;border-radius:3px;font-family:monospace}

/* == Collapsible sections == */
.collapse-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;list-style:none;margin-top:14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sub-label);padding:0}
.collapse-toggle::-webkit-details-marker{display:none}
.collapse-toggle::before{content:'▶';font-size:9px;display:inline-block;transition:transform .15s;color:var(--sub-label)}
details[open] .collapse-toggle::before{transform:rotate(90deg)}
.collapse-body{margin-top:4px}
.method-row{margin-top:8px;padding:10px 0;border-top:1px solid var(--method-border)}
.method-sig{font-family:monospace;font-size:13px;color:var(--text)}
.method-desc{font-size:12px;color:var(--text2);margin-top:4px}

/* == Module index grid == */
.module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:4px}
.module-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px 20px;transition:border-color .15s,box-shadow .15s;display:block}
.module-card:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(67,97,238,.1);text-decoration:none}
.module-card-name{font-size:14px;font-weight:700;color:var(--text);font-family:monospace;display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px}
.module-card-stats{font-size:12px;color:var(--text3)}
.module-card-desc{font-size:12px;color:var(--text3);margin-top:6px;line-height:1.4}

/* == Breadcrumb == */
.breadcrumb{font-size:13px;color:var(--text3);margin-bottom:20px}
.breadcrumb a{color:var(--accent)}

/* == Misc == */
.anchor-link{color:var(--sidebar-title);opacity:0;font-size:13px;margin-left:6px;transition:opacity .15s}
.card:hover .anchor-link{opacity:.6}
.anchor-link:hover{opacity:1;text-decoration:none}
.empty{color:var(--text3);font-size:13px;font-style:italic}
.link-ref{color:var(--accent);text-decoration:none;font-size:inherit}
.link-ref:hover{text-decoration:underline}
.source-link{font-size:11px;color:var(--text3);font-family:monospace;text-decoration:none;margin-left:6px;opacity:.7}
.source-link:hover{opacity:1;text-decoration:underline;color:var(--accent)}

/* == Right TOC == */
.toc{grid-column:3;position:sticky;top:0;height:100vh;overflow-y:auto;padding:40px 16px 40px 20px;border-left:1px solid var(--border);background:var(--bg)}
.toc-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:14px}
.toc-section{margin-bottom:14px}
.toc-section-label{font-size:11px;font-weight:600;color:var(--text2);margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid var(--border)}
.toc-item{display:block;font-size:12px;color:var(--text3);text-decoration:none;padding:3px 0 3px 8px;border-left:2px solid transparent;transition:color .1s,border-left-color .1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.5}
.toc-item:hover{color:var(--text);border-left-color:var(--border);text-decoration:none}
.toc-item.active{color:var(--accent);border-left-color:var(--accent);font-weight:600}
.toc-dep{font-size:9px;color:var(--dep-text);margin-left:3px;font-weight:700;vertical-align:middle}

/* == Hamburger (mobile only) == */
.hamburger{display:none;flex-direction:column;gap:5px;background:var(--sidebar-bg);border:none;padding:8px 10px;cursor:pointer;position:fixed;top:10px;left:10px;z-index:300;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.hamburger span{width:20px;height:2px;background:var(--sidebar-text);border-radius:2px;display:block;transition:all .2s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}

/* == Code token highlighting == */
.tok-kw{color:#6b8cff;font-weight:600}
.tok-str{color:#2e7d32}
.tok-cmt{color:#888;font-style:italic}
.tok-num{color:#e65100}
.tok-type{color:#6a1b9a}
[data-theme=dark] .tok-kw{color:#89b4ff}
[data-theme=dark] .tok-str{color:#a8d5a2}
[data-theme=dark] .tok-cmt{color:#5a6494}
[data-theme=dark] .tok-num{color:#ffb74d}
[data-theme=dark] .tok-type{color:#ce93d8}

/* == Responsive == */
@media (max-width:1280px){
  .toc{display:none}
  .layout.has-toc{grid-template-columns:272px 1fr}
}
@media (max-width:860px){
  .layout,.layout.has-toc{grid-template-columns:1fr}
  .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:200;transform:translateX(-100%);transition:transform .25s ease}
  .sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,.28)}
  .hamburger{display:flex}
  .main{padding:56px 20px 60px}
}

/* == Print == */
@media print{
  .sidebar,.toc,.hamburger,.copy-btn,.theme-btn,.search-wrap,.anchor-link{display:none!important}
  .layout,.layout.has-toc{grid-template-columns:1fr!important;display:block}
  .main{padding:0}
  .card{break-inside:avoid;border:1px solid #ccc;border-left:3px solid #999!important;margin-bottom:16px;box-shadow:none}
}
`;

// ---------------------------------------------------------------------------
// App JS (written to assets/app.js)
// ---------------------------------------------------------------------------

const CLIENT_JS = `
(function(){
  var _pfx=(window.location.pathname.replace(/\\/g,'/').indexOf('/modules/')!==-1)?'../':'';
  // Theme
  var THEME_KEY='jsdoc-scribe-theme';
  var saved=localStorage.getItem(THEME_KEY);
  if(saved) document.documentElement.setAttribute('data-theme',saved);
  var btn=document.getElementById('theme-btn');
  if(btn){
    btn.textContent=(saved==='dark')?'Light':'Dark';
    btn.addEventListener('click',function(){
      var cur=document.documentElement.getAttribute('data-theme');
      var next=cur==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',next);
      localStorage.setItem(THEME_KEY,next);
      btn.textContent=next==='dark'?'Light':'Dark';
    });
  }
  // Copy button
  document.addEventListener('click',function(e){
    var b=e.target.closest('.copy-btn');
    if(!b) return;
    navigator.clipboard.writeText(b.dataset.sig||'').then(function(){
      b.textContent='Copied!';b.classList.add('copied');
      setTimeout(function(){b.textContent='Copy';b.classList.remove('copied');},1500);
    });
  });
  // Search
  var INDEX=(window.__SEARCH_INDEX__||[]).map(function(r){return{name:r.name,kind:r.kind,module:r.module,body:r.body,url:_pfx+r.url};});
  var box=document.getElementById('search-box');
  var panel=document.getElementById('search-results');
  if(box&&panel){
    function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
    function render(items){
      panel.innerHTML=items.length
        ?items.slice(0,20).map(function(r){return'<a class="search-result-item" href="'+r.url+'"><span class="sr-name">'+esc(r.name)+'</span><span class="sr-kind">'+esc(r.kind)+'</span><span class="sr-module">'+esc(r.module)+'</span>'+(r.body?'<span class="sr-preview">'+esc(r.body.slice(0,80))+'</span>':'')+'</a>';}).join('')
        :'<div class="search-no-results">No results</div>';
      panel.classList.add('visible');
    }
    function search(q){
      q=q.trim().toLowerCase();
      if(!q){panel.classList.remove('visible');return;}
      render(INDEX.filter(function(r){
        return r.name.toLowerCase().includes(q)||r.module.toLowerCase().includes(q)||(r.body&&r.body.toLowerCase().includes(q));
      }));
    }
    box.addEventListener('input',function(){search(box.value);});
    box.addEventListener('focus',function(){if(box.value.trim())search(box.value);});
    document.addEventListener('click',function(e){if(!box.contains(e.target)&&!panel.contains(e.target))panel.classList.remove('visible');});
    document.addEventListener('keydown',function(e){
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();box.focus();box.select();}
      if(e.key==='Escape')panel.classList.remove('visible');
    });
  }
  // Right TOC scroll spy via IntersectionObserver
  var toc=document.getElementById('toc');
  if(toc&&typeof IntersectionObserver!=='undefined'){
    var cards=document.querySelectorAll('.card[id]');
    var tocLinks={};
    toc.querySelectorAll('[data-anchor]').forEach(function(a){tocLinks[a.dataset.anchor]=a;});
    var current='';
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          if(current&&tocLinks[current])tocLinks[current].classList.remove('active');
          current=e.target.id;
          if(tocLinks[current])tocLinks[current].classList.add('active');
        }
      });
    },{rootMargin:'-10% 0px -70% 0px',threshold:0});
    cards.forEach(function(c){obs.observe(c);});
  }
  // Mobile hamburger
  var hamburger=document.getElementById('hamburger');
  var sidebar=document.querySelector('.sidebar');
  if(hamburger&&sidebar){
    hamburger.addEventListener('click',function(){
      var open=sidebar.classList.toggle('open');
      hamburger.classList.toggle('open',open);
    });
    document.addEventListener('click',function(e){
      if(sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&!hamburger.contains(e.target)){
        sidebar.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }
})();
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function badge(label,cls){return'<span class="badge badge-'+cls+'">'+esc(label)+'</span>';}
function anchorId(kind,name){return kind+'-'+name.replace(/[^a-zA-Z0-9_]/g,'_');}
function copyBtn(sig){return'<button class="copy-btn" data-sig="'+esc(sig)+'" title="Copy">Copy</button>';}

function metaHtml(item){
    var out='';
    if(item.deprecated!=null) out+='<div class="deprecated-notice">&#9888; Deprecated'+(item.deprecated?': '+esc(item.deprecated):'')+'</div>';
    if(item.since) out+='<div class="since-label">Since v'+esc(item.since)+'</div>';
    return out;
}

/**
 * Server-side tokenizer for JS/TS @example blocks.
 * Returns HTML with tok-* spans. Processes strings, comments, numbers, keywords.
 */
function highlightCode(raw){
    if(!raw) return '';
    var out='';
    var KW=/\b(function|class|const|let|var|return|new|if|else|for|while|import|export|from|async|await|try|catch|throw|extends|implements|type|interface|enum|this|super|null|undefined|true|false|typeof|instanceof|of|in|do|switch|case|default|break|continue|static|readonly|abstract|private|protected|public|override|declare|namespace|as|satisfies)\b/g;
    var re=/(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(["'`])(?:(?!\3)[^\\]|\\.)*\3|\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g;
    var last=0;
    var m;
    while((m=re.exec(raw))!==null){
        if(m.index>last){
            // Tokenize the plain segment for keywords
            out+=esc(raw.slice(last,m.index)).replace(KW,function(kw){return'<span class="tok-kw">'+kw+'</span>';});
        }
        if(m[1]||m[2]) out+='<span class="tok-cmt">'+esc(m[0])+'</span>';
        else if(m[3]) out+='<span class="tok-str">'+esc(m[0])+'</span>';
        else if(m[4]) out+='<span class="tok-num">'+esc(m[0])+'</span>';
        else out+=esc(m[0]);
        last=m.index+m[0].length;
    }
    if(last<raw.length){
        out+=esc(raw.slice(last)).replace(KW,function(kw){return'<span class="tok-kw">'+kw+'</span>';});
    }
    return out;
}

function descHtml(item,symbolMap,filePath){
    var out='';
    if(item.description) out+='<div class="card-desc">'+(symbolMap?resolveLinks(item.description,symbolMap,filePath):esc(item.description))+'</div>';
    out+=metaHtml(item);
    if(item.example) out+='<div class="card-example"><pre>'+highlightCode(item.example)+'</pre></div>';
    return out;
}

function renderParams(params, jsdocParams){
    if(!params||!params.length) return '';
    var jmap={};
    (jsdocParams||[]).forEach(function(p){jmap[p.name]=p;});
    var html='<table class="params-table"><thead><tr><th>Parameter</th><th>Type</th><th>Optional</th><th>Description</th></tr></thead><tbody>';
    params.forEach(function(p){
        var jp=jmap[p.name]||{};
        var type=jp.type&&jp.type!=='any'?jp.type:p.type;
        html+='<tr><td><code>'+esc(p.name)+'</code></td><td><code>'+esc(type)+'</code></td><td>'+(p.optional||jp.optional?'yes':'')+'</td><td>'+(jp.description?esc(jp.description):'')+'</td></tr>';
    });
    return html+'</tbody></table>';
}

function renderReturns(returnType, returnsTag){
    var type=returnsTag&&returnsTag.type&&returnsTag.type!=='any'?returnsTag.type:returnType;
    var desc=returnsTag&&returnsTag.description?'&mdash; '+esc(returnsTag.description):'';
    return'<div class="returns">Returns: <code>'+esc(type)+'</code> '+desc+'</div>';
}

function renderThrows(throws){
    if(!throws||!throws.length) return '';
    var html='<table class="throws-table"><thead><tr><th>Throws</th><th>Description</th></tr></thead><tbody>';
    throws.forEach(function(t){html+='<tr><td><code>'+esc(t.type||'Error')+'</code></td><td>'+esc(t.description||'')+'</td></tr>';});
    return html+'</tbody></table>';
}

function resolveLinks(text, symbolMap, filePath, moduleHtmlPathFn, modules){
    if(!text||!symbolMap) return esc(text);
    return esc(text).replace(/\{@link ([^}]+)\}/g, function(_, ref){
        var parts=ref.trim().split('#');
        var sym=parts[0].trim();
        var method=parts[1]?parts[1].trim():null;
        var entry=symbolMap[sym];
        if(!entry) return'<code>'+esc(ref)+'</code>';
        var targetPath=entry.modulePath;
        var href=targetPath===filePath?'':(targetPath||'');
        if(method) href+='#meth-'+sym+'_'+method;
        else href+=('#'+entry.anchorId);
        return'<a href="'+href+'" class="link-ref"><code>'+esc(sym+(method?'.'+method:''))+'</code></a>';
    });
}

function sourceLink(item, filePath, sourceUrl){
    if(item.line==null) return '';
    var label='line '+item.line;
    if(sourceUrl){
        var base=sourceUrl.replace(/\/$/,'');
        var rel=filePath.replace(/\\/g,'/');
        var href=base+'/'+rel+'#L'+item.line;
        return'<a class="source-link" href="'+esc(href)+'" target="_blank" rel="noopener">'+esc(label)+'</a>';
    }
    return'<span class="source-link">'+esc(filePath.replace(/\\/g,'/'))+':'+item.line+'</span>';
}

function collapsible(label,html,open){
    return'<details'+(open?' open':'')+'><summary class="collapse-toggle">'+esc(label)+'</summary><div class="collapse-body">'+html+'</div></details>';
}

function buildCss(theme){
    var t=THEMES[theme]||THEMES.default;
    return t.light+(t.dark||'')+CSS_STRUCTURE;
}

function page(title,sidebarHtml,bodyHtml,theme,assetPrefix,tocHtml){
    var p=assetPrefix||'';
    var hasToc=!!tocHtml;
    return'<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+esc(title)+'</title>\n<link rel="stylesheet" href="'+p+'assets/style.css">\n</head>\n<body>\n<button id="hamburger" class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>\n<div class="layout'+(hasToc?' has-toc':'')+'">\n<nav class="sidebar">'+sidebarHtml+'</nav>\n<main class="main">'+bodyHtml+'</main>\n'+(hasToc?'<aside class="toc" id="toc">'+tocHtml+'</aside>\n':'')+'</div>\n<script src="'+p+'search-index.js"></script>\n<script src="'+p+'assets/app.js"></script>\n</body>\n</html>';
}

// ---------------------------------------------------------------------------
// Module label helpers
// ---------------------------------------------------------------------------

function commonRoot(modules){
    if(!modules.length) return '';
    var parts=modules.map(function(m){return m.filePath.replace(/\\/g,'/').split('/');});
    var min=Math.min.apply(null,parts.map(function(p){return p.length;}))-1;
    var i=0;
    while(i<min&&parts.every(function(p){return p[i]===parts[0][i];})) i++;
    return parts[0].slice(0,i).join('/');
}

function moduleLabel(filePath,modules){
    var root=commonRoot(modules);
    var rel=filePath.replace(/\\/g,'/');
    if(root) rel=rel.slice(root.length).replace(/^\//,'');
    return rel.replace(/\.[jt]sx?$/,'');
}

function moduleHtmlPath(filePath,modules){return'modules/'+moduleLabel(filePath,modules).replace(/\//g,'__')+'.html';}

// ---------------------------------------------------------------------------
// Search index
// ---------------------------------------------------------------------------

function buildBody(item){
    var parts=[];
    if(item.description) parts.push(item.description);
    (item.jsdocParams||[]).forEach(function(p){if(p.description)parts.push(p.name+': '+p.description);});
    if(item.returns&&item.returns.description) parts.push('returns: '+item.returns.description);
    (item.throws||[]).forEach(function(t){if(t.description)parts.push('throws: '+t.description);});
    return parts.join(' | ').slice(0,300)||null;
}

function buildSearchIndex(modules,prefix){
    prefix=prefix||'';
    var index=[];
    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        var label=moduleLabel(mod.filePath,modules);
        function url(a){return prefix+rel+'#'+a;}
        function push(name,kind,anchor,item){index.push({name:name,kind:kind,module:label,url:url(anchor),body:buildBody(item||{})});}
        mod.functions.forEach(function(f){push(f.name,'function',anchorId('fn',f.name),f);});
        mod.classes.forEach(function(c){
            push(c.name,'class',anchorId('cls',c.name),c);
            c.methods.forEach(function(m){push(c.name+'.'+m.name,'method',anchorId('cls',c.name),m);});
        });
        mod.interfaces.forEach(function(i){push(i.name,'interface',anchorId('iface',i.name),i);});
        mod.typeAliases.forEach(function(t){push(t.name,'type',anchorId('type',t.name),t);});
        mod.enums.forEach(function(e){push(e.name,'enum',anchorId('enum',e.name),e);});
        mod.variables.forEach(function(v){push(v.name,v.isConst?'const':'var',anchorId('var',v.name),v);});
    });
    return index;
}

// ---------------------------------------------------------------------------
// Sidebar (with symbol tree under active module)
// ---------------------------------------------------------------------------

function buildSidebar(modules,projectName,version,activePath,rootPrefix,showToggle,activeModule){
    var prefix=rootPrefix||'';
    var html='<div class="sidebar-header">'
        +'<div><a href="'+prefix+'index.html">'+esc(projectName)+'</a>'+(version?'<span class="version">v'+esc(version)+'</span>':'')+'</div>'
        +(showToggle!==false?'<button id="theme-btn" class="theme-btn">Dark</button>':'')
        +'</div>'
        +'<div class="search-wrap"><input id="search-box" class="search-box" type="search" placeholder="Search... (Ctrl+K)" autocomplete="off"><div id="search-results" class="search-results"></div></div>'
        +'<div class="sidebar-section"><div class="sidebar-section-title">Modules</div>';

    var groups={},order=[];
    modules.forEach(function(mod){
        var label=moduleLabel(mod.filePath,modules);
        var slash=label.lastIndexOf('/');
        var dir=slash===-1?'':label.slice(0,slash);
        if(!groups[dir]){groups[dir]=[];order.push(dir);}
        groups[dir].push(mod);
    });
    var hasGroups=order.some(function(d){return d!=='';});

    function symRows(mod){
        var rows='<div class="sym-rows">';
        var specs=[
            {list:mod.functions,kind:'fn',label:'fn'},
            {list:mod.classes,kind:'cls',label:'cls'},
            {list:mod.interfaces,kind:'iface',label:'if'},
            {list:mod.typeAliases,kind:'type',label:'ty'},
            {list:mod.enums,kind:'enum',label:'en'},
            {list:mod.variables,kind:'var',label:'$'},
        ];
        specs.forEach(function(s){
            (s.list||[]).forEach(function(item){
                var anchor=anchorId(s.kind,item.name);
                rows+='<div class="sym-row"><span class="sym-pill sym-'+s.kind+'">'+s.label+'</span>'
                    +'<a class="sym-link" href="#'+anchor+'">'+esc(item.name)+'</a></div>';
            });
        });
        return rows+'</div>';
    }

    order.forEach(function(dir){
        var mods=groups[dir];
        if(hasGroups&&dir){
            var anyActive=mods.some(function(m){return moduleHtmlPath(m.filePath,modules)===activePath;});
            html+='<details'+(anyActive?' open':'')+'><summary class="sidebar-dir-toggle">'+esc(dir)+'/</summary>';
            mods.forEach(function(mod){
                var rel=moduleHtmlPath(mod.filePath,modules);
                var label=moduleLabel(mod.filePath,modules);
                var name=label.slice(dir.length+1);
                var isActive=activePath===rel;
                html+='<a class="sidebar-link sidebar-link-indent'+(isActive?' active':'')+'" href="'+esc(prefix+rel)+'">'+esc(name)+'</a>';
                if(isActive&&activeModule) html+=symRows(activeModule);
            });
            html+='</details>';
        } else {
            mods.forEach(function(mod){
                var rel=moduleHtmlPath(mod.filePath,modules);
                var label=moduleLabel(mod.filePath,modules);
                var name=dir?label.slice(dir.length+1):label;
                var isActive=activePath===rel;
                html+='<a class="sidebar-link'+(isActive?' active':'')+'" href="'+esc(prefix+rel)+'">'+esc(name)+'</a>';
                if(isActive&&activeModule) html+=symRows(activeModule);
            });
        }
    });
    return html+'</div>';
}

// ---------------------------------------------------------------------------
// Right TOC builder
// ---------------------------------------------------------------------------

function buildToc(mod){
    var specs=[
        {title:'Functions',list:mod.functions,kind:'fn'},
        {title:'Classes',list:mod.classes,kind:'cls'},
        {title:'Interfaces',list:mod.interfaces,kind:'iface'},
        {title:'Type Aliases',list:mod.typeAliases,kind:'type'},
        {title:'Enums',list:mod.enums,kind:'enum'},
        {title:'Variables',list:mod.variables,kind:'var'},
    ].filter(function(s){return s.list&&s.list.length;});
    if(!specs.length) return '';
    var html='<div class="toc-title">On this page</div>';
    specs.forEach(function(s){
        html+='<div class="toc-section"><div class="toc-section-label">'+esc(s.title)+'</div>';
        s.list.forEach(function(item){
            var anchor=anchorId(s.kind,item.name);
            var dep=item.deprecated!=null?'<span class="toc-dep">dep</span>':'';
            html+='<a class="toc-item" href="#'+anchor+'" data-anchor="'+anchor+'">'+esc(item.name)+dep+'</a>';
        });
        html+='</div>';
    });
    return html;
}

// ---------------------------------------------------------------------------
// Item renderers
// ---------------------------------------------------------------------------

function renderFunction(fn,filePath,sourceUrl,symbolMap){
    var paramStr=(fn.params||[]).map(function(p){return(p.optional?'[':'')+p.name+': '+p.type+(p.optional?']':'');}).join(', ');
    var sig=fn.name+'('+paramStr+'): '+fn.returnType;
    var id=anchorId('fn',fn.name);
    var badges=[fn.isExported&&badge('exported','exported'),fn.isAsync&&badge('async','async'),fn.isGenerator&&badge('generator','generator'),fn.deprecated!=null&&badge('deprecated','deprecated')].filter(Boolean).join('');
    return'<div class="card card-fn" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(fn.name)+sourceLink(fn,filePath,sourceUrl)+'</div><div class="card-sig">'+esc(sig)+'</div></div>'+copyBtn(sig)+'</div>'
        +'<div>'+badges+'</div>'+descHtml(fn,symbolMap,filePath)
        +renderParams(fn.params,fn.jsdocParams)
        +renderReturns(fn.returnType,fn.returns)
        +renderThrows(fn.throws)
        +'</div>';
}

function renderClass(cls,filePath,sourceUrl,symbolMap){
    var id=anchorId('cls',cls.name);
    var badges=[cls.isExported&&badge('exported','exported'),cls.isAbstract&&badge('abstract','abstract'),cls.extends.length&&badge('extends '+cls.extends.join(', '),'exported'),cls.implements.length&&badge('implements '+cls.implements.join(', '),'async'),cls.deprecated!=null&&badge('deprecated','deprecated')].filter(Boolean).join('');
    var inner='<div class="card card-cls" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(cls.name)+sourceLink(cls,filePath,sourceUrl)+'</div></div>'
        +copyBtn('class '+cls.name+(cls.extends.length?' extends '+cls.extends.join(', '):''))+'</div>'
        +'<div>'+badges+'</div>'+descHtml(cls,symbolMap,filePath);

    if(cls.constructor){
        var ctorSig='new '+cls.name+'('+(cls.constructor.params||[]).map(function(p){return p.name+': '+p.type;}).join(', ')+')';
        var ctorBody='<div class="method-row"><div class="method-sig">'+esc(ctorSig)+'</div>'+(cls.constructor.description?'<div class="method-desc">'+esc(cls.constructor.description)+'</div>':'')+renderParams(cls.constructor.params,cls.constructor.jsdocParams)+renderThrows(cls.constructor.throws)+'</div>';
        inner+=collapsible('Constructor',ctorBody,true);
    }
    if(cls.properties.length){
        var propBody='<table class="params-table"><thead><tr><th>Name</th><th>Type</th><th>Visibility</th><th>Flags</th><th>Description</th></tr></thead><tbody>';
        cls.properties.forEach(function(p){
            var flags=[p.isStatic&&badge('static','static'),p.isReadonly&&badge('readonly','readonly'),p.isAbstract&&badge('abstract','abstract'),p.deprecated!=null&&badge('deprecated','deprecated')].filter(Boolean).join('');
            propBody+='<tr><td><code>'+esc(p.name)+'</code></td><td><code>'+esc(p.type)+'</code></td><td>'+badge(p.visibility,p.visibility)+'</td><td>'+flags+'</td><td>'+(p.description?esc(p.description):'')+'</td></tr>';
        });
        inner+=collapsible('Properties ('+cls.properties.length+')',propBody+'</tbody></table>',true);
    }
    if(cls.methods.length){
        var methBody='';
        cls.methods.forEach(function(m){
            var ps=(m.params||[]).map(function(p){return p.name+': '+p.type;}).join(', ');
            var mSig=m.name+'('+ps+'): '+m.returnType;
            var mb=[badge(m.visibility,m.visibility),m.isStatic&&badge('static','static'),m.isAbstract&&badge('abstract','abstract'),m.isAsync&&badge('async','async'),m.isGenerator&&badge('generator','generator'),m.deprecated!=null&&badge('deprecated','deprecated')].filter(Boolean).join('');
            methBody+='<div class="method-row"><div class="card-header" style="margin-bottom:4px"><code class="method-sig">'+esc(mSig)+'</code>'+copyBtn(mSig)+'</div><div>'+mb+'</div>'+(m.description?'<div class="method-desc">'+esc(m.description)+'</div>':'')+metaHtml(m)+renderParams(m.params,m.jsdocParams)+renderReturns(m.returnType,m.returns)+renderThrows(m.throws)+'</div>';
        });
        inner+=collapsible('Methods ('+cls.methods.length+')',methBody,true);
    }
    if(cls.getters.length||cls.setters.length){
        var accBody='';
        cls.getters.forEach(function(g){accBody+='<div class="method-row"><code class="method-sig">get '+esc(g.name)+'(): '+esc(g.returnType)+'</code>'+(g.isStatic?badge('static','static'):'')+(g.deprecated!=null?badge('deprecated','deprecated'):'')+(g.description?'<div class="method-desc">'+esc(g.description)+'</div>':'')+'</div>';});
        cls.setters.forEach(function(s){var ps=(s.params||[]).map(function(p){return p.name+': '+p.type;}).join(', ');accBody+='<div class="method-row"><code class="method-sig">set '+esc(s.name)+'('+esc(ps)+')</code>'+(s.isStatic?badge('static','static'):'')+(s.deprecated!=null?badge('deprecated','deprecated'):'')+(s.description?'<div class="method-desc">'+esc(s.description)+'</div>':'')+'</div>';});
        inner+=collapsible('Accessors ('+(cls.getters.length+cls.setters.length)+')',accBody,false);
    }
    return inner+'</div>';
}

function renderInterface(iface,filePath,sourceUrl,symbolMap){
    var id=anchorId('iface',iface.name);
    var html='<div class="card card-iface" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(iface.name)+sourceLink(iface,filePath,sourceUrl)+'</div></div>'+copyBtn('interface '+iface.name)+'</div>'
        +(iface.isExported?badge('exported','exported'):'')+descHtml(iface,symbolMap,filePath);
    if(iface.properties.length){
        html+='<table class="params-table" style="margin-top:10px"><thead><tr><th>Property</th><th>Type</th><th>Optional</th></tr></thead><tbody>';
        iface.properties.forEach(function(p){html+='<tr><td><code>'+esc(p.name)+'</code></td><td><code>'+esc(p.type)+'</code></td><td>'+(p.optional?'yes':'')+'</td></tr>';});
        html+='</tbody></table>';
    }
    if(iface.methods.length){
        var mb='';
        iface.methods.forEach(function(m){var ps=m.params.map(function(p){return p.name+': '+p.type;}).join(', ');mb+='<div class="method-row"><code class="method-sig">'+esc(m.name)+'('+esc(ps)+'): '+esc(m.returnType)+'</code>'+(m.optional?badge('optional','optional'):'')+'</div>';});
        html+=collapsible('Methods ('+iface.methods.length+')',mb,true);
    }
    return html+'</div>';
}

function renderEnum(enm,filePath,sourceUrl,symbolMap){
    var id=anchorId('enum',enm.name);
    var html='<div class="card card-enum" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(enm.name)+sourceLink(enm,filePath,sourceUrl)+'</div></div>'+copyBtn('enum '+enm.name)+'</div>'
        +(enm.isExported?badge('exported','exported'):'')+descHtml(enm,symbolMap,filePath)
        +'<table class="params-table" style="margin-top:10px"><thead><tr><th>Member</th><th>Value</th></tr></thead><tbody>';
    enm.members.forEach(function(m){html+='<tr><td><code>'+esc(m.name)+'</code></td><td>'+(m.value!==null?'<code>'+esc(m.value)+'</code>':'')+'</td></tr>';});
    return html+'</tbody></table></div>';
}

function renderTypeAlias(ta,filePath,sourceUrl,symbolMap){
    var id=anchorId('type',ta.name);
    return'<div class="card card-type" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(ta.name)+sourceLink(ta,filePath,sourceUrl)+'</div><div class="card-sig">type '+esc(ta.name)+' = '+esc(ta.type)+'</div></div>'+copyBtn('type '+ta.name+' = '+ta.type)+'</div>'
        +(ta.isExported?badge('exported','exported'):'')+descHtml(ta,symbolMap,filePath)+'</div>';
}

function renderVariable(v,filePath,sourceUrl,symbolMap){
    var id=anchorId('var',v.name);
    var decl=(v.isConst?'const':'let')+' '+v.name+': '+v.type;
    return'<div class="card card-var" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(v.name)+sourceLink(v,filePath,sourceUrl)+'</div><div class="card-sig">'+esc(decl)+'</div></div>'+copyBtn(decl)+'</div>'
        +(v.isExported?badge('exported','exported'):'')+badge(v.isConst?'const':'var',v.isConst?'const':'var')+(v.deprecated!=null?badge('deprecated','deprecated'):'')+descHtml(v,symbolMap,filePath)+'</div>';
}

function section(title,items,renderFn,filePath,sourceUrl,symbolMap){
    if(!items||!items.length) return '';
    var count='<span class="section-count">('+items.length+')</span>';
    return'<div class="section"><div class="section-title">'+esc(title)+count+'</div>'+items.map(function(item){return renderFn(item,filePath,sourceUrl,symbolMap);}).join('\n')+'</div>';
}

// ---------------------------------------------------------------------------
// Site builder — helpers
// ---------------------------------------------------------------------------

/** Build the symbol map for @link cross-reference resolution. */
function buildSymbolMap(modules){
    var map={};
    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        function reg(name,aid){map[name]={anchorId:aid,modulePath:rel};}
        mod.functions.forEach(function(f){reg(f.name,anchorId('fn',f.name));});
        mod.classes.forEach(function(c){
            reg(c.name,anchorId('cls',c.name));
            c.methods.forEach(function(m){reg(c.name+'.'+m.name,anchorId('cls',c.name));});
        });
        mod.interfaces.forEach(function(i){reg(i.name,anchorId('iface',i.name));});
        mod.typeAliases.forEach(function(t){reg(t.name,anchorId('type',t.name));});
        mod.enums.forEach(function(e){reg(e.name,anchorId('enum',e.name));});
        mod.variables.forEach(function(v){reg(v.name,anchorId('var',v.name));});
    });
    return map;
}

/** Build the module-grid HTML for the index page. */
function buildIndexBody(modules){
    var body='<div class="section"><div class="section-title">Modules</div><div class="module-grid">';
    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        var label=moduleLabel(mod.filePath,modules);
        var parts=[
            mod.functions.length&&mod.functions.length+' fn',
            mod.classes.length&&mod.classes.length+' class',
            mod.interfaces.length&&mod.interfaces.length+' iface',
            mod.enums.length&&mod.enums.length+' enum',
            mod.variables.length&&mod.variables.length+' const',
        ].filter(Boolean);
        var allItems=[].concat(mod.functions,mod.classes,mod.interfaces,mod.typeAliases,mod.enums,mod.variables);
        var depCount=allItems.filter(function(i){return i.deprecated!=null;}).length;
        var sinces=allItems.map(function(i){return i.since;}).filter(Boolean).sort();
        var sinceStr=sinces.length
            ? (' · since v'+sinces[0]+(sinces.length>1&&sinces[sinces.length-1]!==sinces[0]?'–v'+sinces[sinces.length-1]:''))
            : '';
        var depBadge=depCount?'<span class="badge badge-deprecated" style="font-size:10px;padding:1px 5px">'+depCount+' dep</span>':'';
        var descHtml=mod.description?'<div class="module-card-desc">'+esc(mod.description.slice(0,100))+(mod.description.length>100?'…':'')+'</div>':'';
        body+='<a class="module-card" href="'+esc(rel)+'">';
        body+='<div class="module-card-name">'+esc(label)+depBadge+'</div>';
        body+='<div class="module-card-stats">'+(parts.join(' · ')||'no exported items')+esc(sinceStr)+'</div>';
        body+=descHtml+'</a>';
    });
    return body+'</div></div>';
}

/** Build a single module page body (sections only, no header). */
function buildModuleBody(mod,sourceUrl,symbolMap){
    var isEmpty=!mod.functions.length&&!mod.classes.length&&!mod.interfaces.length
        &&!mod.typeAliases.length&&!mod.enums.length&&!mod.variables.length;
    if(isEmpty) return '<p class="empty" style="margin-top:24px">No documented items found.</p>';
    var body='';
    body+=section('Functions',mod.functions,renderFunction,mod.filePath,sourceUrl,symbolMap);
    body+=section('Classes',mod.classes,renderClass,mod.filePath,sourceUrl,symbolMap);
    body+=section('Interfaces',mod.interfaces,renderInterface,mod.filePath,sourceUrl,symbolMap);
    body+=section('Type Aliases',mod.typeAliases,renderTypeAlias,mod.filePath,sourceUrl,symbolMap);
    body+=section('Enums',mod.enums,renderEnum,mod.filePath,sourceUrl,symbolMap);
    body+=section('Variables & Constants',mod.variables,renderVariable,mod.filePath,sourceUrl,symbolMap);
    return body;
}

// ---------------------------------------------------------------------------
// Site builder
// ---------------------------------------------------------------------------

function buildSite(modules,options){
    options=options||{};
    var projectName=options.projectName||'Documentation';
    var version=options.version||'';
    var theme=options.theme||'default';
    var sourceUrl=options.sourceUrl||null;
    var symbolMap=buildSymbolMap(modules);
    var showToggle=(THEMES[theme]||THEMES.default).toggleBtn;
    var pages=[];

    // Shared static assets
    pages.push({path:'assets/style.css', html:buildCss(theme)});
    pages.push({path:'assets/app.js',    html:CLIENT_JS});
    pages.push({path:'search-index.js',  html:'window.__SEARCH_INDEX__='+JSON.stringify(buildSearchIndex(modules,''))+';'});

    // Index page
    var totalFns=modules.reduce(function(s,m){return s+m.functions.length;},0);
    var totalCls=modules.reduce(function(s,m){return s+m.classes.length;},0);
    var idxHeader='<div class="page-title">'+esc(projectName)+'</div>'
        +'<div class="page-subtitle">'+modules.length+' module(s) &middot; '+totalFns+' function(s) &middot; '+totalCls+' class(es)</div>';
    pages.push({
        path:'index.html',
        html:page(projectName,buildSidebar(modules,projectName,version,'index.html','',showToggle,null),idxHeader+buildIndexBody(modules),theme,'',null),
    });

    // Per-module pages
    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        var label=moduleLabel(mod.filePath,modules);
        var modHeader='<div class="breadcrumb"><a href="../index.html">'+esc(projectName)+'</a> / '+esc(label)+'</div>'
            +'<div class="page-title">'+esc(label)+'</div>'
            +'<div class="page-subtitle">'+esc(mod.filePath)+'</div>'
            +(mod.description?'<p class="module-desc">'+esc(mod.description)+'</p>':'');
        pages.push({
            path:rel,
            html:page(
                label+' - '+projectName,
                buildSidebar(modules,projectName,version,rel,'../',showToggle,mod),
                modHeader+buildModuleBody(mod,sourceUrl,symbolMap),
                theme,'../',buildToc(mod)
            ),
        });
    });

    return pages;
}
module.exports = { buildSite, moduleLabel, moduleHtmlPath };

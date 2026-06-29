"use strict";

const path = require("path");

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

const THEMES = {
    default: {
        light: `:root{--bg:#f8f9fc;--surface:#fff;--border:#e0e4f0;--text:#1a1a2e;--text2:#666;--text3:#888;--sidebar-bg:#1a1a2e;--sidebar-text:#c8d3f0;--sidebar-active:#2d2d4e;--sidebar-title:#7986cb;--accent:#4361ee;--accent2:#e8eaf6;--search-bg:#2d2d4e;--search-border:#3a3a5e;--search-text:#e0e4f8;--search-panel:#252543;--th-bg:#f5f6fa;--code-bg:#f5f6fa;--sub-label:#7986cb;--method-border:#f0f0f0;--dep-bg:#fff8e1;--dep-text:#e65100;--throws-bg:#fce4ec;--throws-text:#c62828}`,
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
// CSS (shared structural rules; colors come from theme vars above)
// ---------------------------------------------------------------------------

const CSS_STRUCTURE = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:var(--text);background:var(--bg);transition:background .2s,color .2s}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
code,pre{font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace}
.layout{display:flex;min-height:100vh}
.sidebar{width:272px;min-width:272px;background:var(--sidebar-bg);color:var(--sidebar-text);padding:0;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar-header{padding:18px 20px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.sidebar-header a{color:var(--text);font-size:15px;font-weight:700}
.sidebar-header .version{display:block;font-size:11px;color:var(--sidebar-title);margin-top:2px}
.theme-btn{background:none;border:1px solid var(--search-border);border-radius:5px;padding:3px 8px;font-size:12px;color:var(--sidebar-text);cursor:pointer;white-space:nowrap;flex-shrink:0;margin-top:2px}
.theme-btn:hover{background:var(--sidebar-active)}
.search-wrap{position:relative;padding:0 14px 12px;border-bottom:1px solid var(--search-border)}
.search-box{width:100%;background:var(--search-bg);border:1px solid var(--search-border);border-radius:6px;padding:7px 10px 7px 32px;color:var(--search-text);font-size:13px;outline:none}
.search-box::placeholder{color:var(--sidebar-title)}
.search-box:focus{border-color:var(--accent)}
.search-results{display:none;position:absolute;left:14px;right:14px;background:var(--search-panel);border:1px solid var(--search-border);border-radius:6px;max-height:320px;overflow-y:auto;z-index:100;margin-top:2px}
.search-results.visible{display:block}
.search-result-item{display:block;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--search-border);text-decoration:none}
.search-result-item:hover{background:var(--sidebar-active)}
.sr-name{font-size:13px;font-weight:600;color:var(--search-text);font-family:monospace}
.sr-kind{font-size:11px;color:var(--sidebar-title);margin-left:6px}
.sr-module{font-size:11px;color:var(--sidebar-title);display:block;margin-top:1px;opacity:.7}
.search-no-results{padding:10px 12px;color:var(--sidebar-title);font-size:13px}
.sidebar-section{padding:10px 0 4px}
.sidebar-section-title{padding:4px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--sidebar-title)}
.sidebar-link{display:block;padding:5px 20px;font-size:13px;color:var(--sidebar-text);transition:background .1s}
.sidebar-link:hover,.sidebar-link.active{background:var(--sidebar-active);color:var(--text);text-decoration:none}
.sidebar-dir-toggle{display:flex;align-items:center;gap:4px;cursor:pointer;list-style:none;padding:5px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sidebar-title);user-select:none}
.sidebar-dir-toggle::-webkit-details-marker{display:none}
.sidebar-dir-toggle::before{content:'▶';font-size:8px;transition:transform .15s}
details[open] .sidebar-dir-toggle::before{transform:rotate(90deg)}
.sidebar-link-indent{padding-left:32px}
.main{flex:1;padding:40px 48px;max-width:960px}
.page-title{font-size:28px;font-weight:700;color:var(--text);margin-bottom:4px}
.page-subtitle{color:var(--text2);font-size:13px;margin-bottom:12px}
.module-desc{color:var(--text2);font-size:14px;line-height:1.6;margin-bottom:28px;max-width:700px}
.section{margin-bottom:40px}
.section-title{font-size:18px;font-weight:700;color:var(--text);margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid var(--accent2)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px 22px;margin-bottom:10px;scroll-margin-top:24px}
.card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.card-name{font-size:15px;font-weight:700;color:var(--text);font-family:monospace}
.card-sig{font-size:12px;color:var(--text2);margin-top:3px;font-family:monospace;word-break:break-all}
.card-desc{font-size:13px;color:var(--text2);margin-top:8px;line-height:1.5}
.card-example{margin-top:10px}
.card-example pre{background:var(--code-bg);border:1px solid var(--border);border-radius:6px;padding:10px 14px;font-size:12px;overflow-x:auto;color:var(--text)}
.copy-btn{flex-shrink:0;background:none;border:1px solid var(--border);border-radius:5px;padding:3px 8px;font-size:11px;color:var(--text3);cursor:pointer;transition:all .15s;white-space:nowrap}
.copy-btn:hover{background:var(--accent2);border-color:var(--accent);color:var(--accent)}
.copy-btn.copied{background:#e8f5e9;border-color:#43a047;color:#2e7d32}
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
.collapse-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;list-style:none;margin-top:14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sub-label);padding:0}
.collapse-toggle::-webkit-details-marker{display:none}
.collapse-toggle::before{content:'▶';font-size:9px;display:inline-block;transition:transform .15s;color:var(--sub-label)}
details[open] .collapse-toggle::before{transform:rotate(90deg)}
.collapse-body{margin-top:4px}
.method-row{margin-top:8px;padding:10px 0;border-top:1px solid var(--method-border)}
.method-sig{font-family:monospace;font-size:13px;color:var(--text)}
.method-desc{font-size:12px;color:var(--text2);margin-top:4px}
.module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:4px}
.module-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px 20px;transition:border-color .15s,box-shadow .15s}
.module-card:hover{border-color:var(--accent);box-shadow:0 2px 8px rgba(67,97,238,.1);text-decoration:none}
.module-card-name{font-size:14px;font-weight:700;color:var(--text);font-family:monospace}
.module-card-stats{font-size:12px;color:var(--text3);margin-top:4px}
.module-card-desc{font-size:12px;color:var(--text3);margin-top:6px;line-height:1.4}
.breadcrumb{font-size:13px;color:var(--text3);margin-bottom:20px}
.breadcrumb a{color:var(--accent)}
.anchor-link{color:var(--sidebar-title);opacity:0;font-size:13px;margin-left:6px;transition:opacity .15s}
.card:hover .anchor-link{opacity:.6}
.anchor-link:hover{opacity:1;text-decoration:none}
.empty{color:var(--text3);font-size:13px;font-style:italic}
.link-ref{color:var(--accent);text-decoration:none;font-size:inherit}
.link-ref:hover{text-decoration:underline}
.sr-body{font-size:11px;color:var(--sidebar-title);display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.sr-preview{font-size:11px;color:var(--text3);font-style:italic;display:block;margin-top:2px}

.source-link{font-size:11px;color:var(--text3);font-family:monospace;text-decoration:none;margin-left:6px;opacity:.7}
.source-link:hover{opacity:1;text-decoration:underline;color:var(--accent)}

`;

const CLIENT_JS = `
(function(){
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
  document.addEventListener('click',function(e){
    var b=e.target.closest('.copy-btn');
    if(!b) return;
    navigator.clipboard.writeText(b.dataset.sig||'').then(function(){
      b.textContent='Copied!';b.classList.add('copied');
      setTimeout(function(){b.textContent='Copy';b.classList.remove('copied');},1500);
    });
  });
  var INDEX=window.__SEARCH_INDEX__||[];
  var box=document.getElementById('search-box');
  var panel=document.getElementById('search-results');
  if(!box||!panel) return;
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function render(items){
    panel.innerHTML=items.length
      ?items.slice(0,20).map(function(r){return'<a class="search-result-item" href="'+r.url+'"><span class="sr-name">'+esc(r.name)+'</span><span class="sr-kind">'+esc(r.kind)+'</span><span class="sr-module">'+esc(r.module)+'</span>+(r.body?'<span class="sr-preview">'+esc(r.body.slice(0,80))+'</span>':'')+'</a>';}).join('')
      :'<div class="search-no-results">No results</div>';
    panel.classList.add('visible');
  }
  function search(q){
    q=q.trim().toLowerCase();
    if(!q){panel.classList.remove('visible');return;}
    render(INDEX.filter(function(r){
      return r.name.toLowerCase().includes(q)
        ||r.module.toLowerCase().includes(q)
        ||(r.body&&r.body.toLowerCase().includes(q));
    }));
  }
  box.addEventListener('input',function(){search(box.value);});
  box.addEventListener('focus',function(){if(box.value.trim())search(box.value);});
  document.addEventListener('click',function(e){if(!box.contains(e.target)&&!panel.contains(e.target))panel.classList.remove('visible');});
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();box.focus();box.select();}
    if(e.key==='Escape')panel.classList.remove('visible');
  });
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

function descHtml(item,symbolMap,filePath){
    var out='';
    if(item.description) out+='<div class="card-desc">'+(symbolMap?resolveLinks(item.description,symbolMap,filePath):esc(item.description))+'</div>';
    out+=metaHtml(item);
    if(item.example) out+='<div class="card-example"><pre>'+esc(item.example)+'</pre></div>';
    return out;
}

function renderParams(params, jsdocParams){
    if(!params||!params.length) return '';
    // Build a lookup of JSDoc @param enrichments keyed by name
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
    var desc=returnsTag&&returnsTag.description?'— '+esc(returnsTag.description):'';
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
    // Replace {@link Symbol} and {@link Symbol#method} with anchor tags
    return esc(text).replace(/\{@link ([^}]+)\}/g, function(_, ref){
        var parts=ref.trim().split('#');
        var sym=parts[0].trim();
        var method=parts[1]?parts[1].trim():null;
        var entry=symbolMap[sym];
        if(!entry) return'<code>'+esc(ref)+'</code>';
        // Are we on the same module page?
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

function page(title,sidebarHtml,bodyHtml,searchIndex,theme){
    var t=THEMES[theme]||THEMES.default;
    var themeJs=t.toggleBtn?CLIENT_JS:'(function(){var INDEX=window.__SEARCH_INDEX__||[];var box=document.getElementById("search-box");var panel=document.getElementById("search-results");if(!box||!panel)return;function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}function render(items){panel.innerHTML=items.length?items.slice(0,20).map(function(r){return\'<a class="search-result-item" href="\'+r.url+\'"><span class="sr-name">\'+esc(r.name)+\'</span><span class="sr-kind">\'+esc(r.kind)+\'</span><span class="sr-module">\'+esc(r.module)+\'</span></a>\';}).join(""):\'<div class="search-no-results">No results</div>\';panel.classList.add("visible");}function search(q){q=q.trim().toLowerCase();if(!q){panel.classList.remove("visible");return;}render(INDEX.filter(function(r){return r.name.toLowerCase().includes(q)||r.module.toLowerCase().includes(q);}));}box.addEventListener("input",function(){search(box.value);});box.addEventListener("focus",function(){if(box.value.trim())search(box.value);});document.addEventListener("click",function(e){if(!box.contains(e.target)&&!panel.contains(e.target))panel.classList.remove("visible");});document.addEventListener("keydown",function(e){if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();box.focus();box.select();}if(e.key==="Escape")panel.classList.remove("visible");});document.addEventListener("click",function(e){var b=e.target.closest(".copy-btn");if(!b)return;navigator.clipboard.writeText(b.dataset.sig||"").then(function(){b.textContent="Copied!";b.classList.add("copied");setTimeout(function(){b.textContent="Copy";b.classList.remove("copied");},1500);});});})();';
    return'<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+esc(title)+'</title>\n<style>'+buildCss(theme)+'</style>\n</head>\n<body>\n<div class="layout">\n<nav class="sidebar">'+sidebarHtml+'</nav>\n<main class="main">'+bodyHtml+'</main>\n</div>\n<script>window.__SEARCH_INDEX__='+JSON.stringify(searchIndex)+';</script>\n<script>'+themeJs+'</script>\n</body>\n</html>';
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
// Sidebar
// ---------------------------------------------------------------------------

function buildSidebar(modules,projectName,version,activePath,rootPrefix,showToggle){
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

    order.forEach(function(dir){
        var mods=groups[dir];
        if(hasGroups&&dir){
            var anyActive=mods.some(function(m){return moduleHtmlPath(m.filePath,modules)===activePath;});
            html+='<details'+(anyActive?' open':'')+'><summary class="sidebar-dir-toggle">'+esc(dir)+'/</summary>';
            mods.forEach(function(mod){
                var rel=moduleHtmlPath(mod.filePath,modules);
                var label=moduleLabel(mod.filePath,modules);
                var name=label.slice(dir.length+1);
                var active=activePath===rel?' active':'';
                html+='<a class="sidebar-link sidebar-link-indent'+active+'" href="'+esc(prefix+rel)+'">'+esc(name)+'</a>';
            });
            html+='</details>';
        } else {
            mods.forEach(function(mod){
                var rel=moduleHtmlPath(mod.filePath,modules);
                var label=moduleLabel(mod.filePath,modules);
                var name=dir?label.slice(dir.length+1):label;
                var active=activePath===rel?' active':'';
                html+='<a class="sidebar-link'+active+'" href="'+esc(prefix+rel)+'">'+esc(name)+'</a>';
            });
        }
    });
    return html+'</div>';
}

// ---------------------------------------------------------------------------
// Item renderers
// ---------------------------------------------------------------------------

function renderFunction(fn,filePath,sourceUrl,symbolMap){
    var paramStr=(fn.params||[]).map(function(p){return(p.optional?'[':'')+p.name+': '+p.type+(p.optional?']':'');}).join(', ');
    var sig=fn.name+'('+paramStr+'): '+fn.returnType;
    var id=anchorId('fn',fn.name);
    var badges=[fn.isExported&&badge('exported','exported'),fn.isAsync&&badge('async','async'),fn.isGenerator&&badge('generator','generator'),fn.deprecated!=null&&badge('deprecated','deprecated')].filter(Boolean).join('');
    return'<div class="card" id="'+id+'">'
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
    var inner='<div class="card" id="'+id+'">'
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
    var html='<div class="card" id="'+id+'">'
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
    var html='<div class="card" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(enm.name)+sourceLink(enm,filePath,sourceUrl)+'</div></div>'+copyBtn('enum '+enm.name)+'</div>'
        +(enm.isExported?badge('exported','exported'):'')+descHtml(enm,symbolMap,filePath)
        +'<table class="params-table" style="margin-top:10px"><thead><tr><th>Member</th><th>Value</th></tr></thead><tbody>';
    enm.members.forEach(function(m){html+='<tr><td><code>'+esc(m.name)+'</code></td><td>'+(m.value!==null?'<code>'+esc(m.value)+'</code>':'')+'</td></tr>';});
    return html+'</tbody></table></div>';
}

function renderTypeAlias(ta,filePath,sourceUrl,symbolMap){
    var id=anchorId('type',ta.name);
    return'<div class="card" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(ta.name)+sourceLink(ta,filePath,sourceUrl)+'</div><div class="card-sig">type '+esc(ta.name)+' = '+esc(ta.type)+'</div></div>'+copyBtn('type '+ta.name+' = '+ta.type)+'</div>'
        +(ta.isExported?badge('exported','exported'):'')+descHtml(ta,symbolMap,filePath)+'</div>';
}

function renderVariable(v,filePath,sourceUrl,symbolMap){
    var id=anchorId('var',v.name);
    var decl=(v.isConst?'const':'let')+' '+v.name+': '+v.type;
    return'<div class="card" id="'+id+'">'
        +'<div class="card-header"><div><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(v.name)+sourceLink(v,filePath,sourceUrl)+'</div><div class="card-sig">'+esc(decl)+'</div></div>'+copyBtn(decl)+'</div>'
        +(v.isExported?badge('exported','exported'):'')+badge(v.isConst?'const':'var',v.isConst?'const':'var')+(v.deprecated!=null?badge('deprecated','deprecated'):'')+descHtml(v,symbolMap,filePath)+'</div>';
}

function section(title,items,renderFn,filePath,sourceUrl,symbolMap){
    if(!items||!items.length) return '';
    return'<div class="section"><div class="section-title">'+esc(title)+'</div>'+items.map(function(item){return renderFn(item,filePath,sourceUrl,symbolMap);}).join('\n')+'</div>';
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
    // Build a symbol → {anchorId, modulePath} map for @link resolution
    var symbolMap={};
    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        function reg(name,aid){symbolMap[name]={anchorId:aid,modulePath:rel};}
        mod.functions.forEach(function(f){reg(f.name,anchorId('fn',f.name));});
        mod.classes.forEach(function(c){reg(c.name,anchorId('cls',c.name));c.methods.forEach(function(m){reg(c.name+'.'+m.name,anchorId('cls',c.name));});});
        mod.interfaces.forEach(function(i){reg(i.name,anchorId('iface',i.name));});
        mod.typeAliases.forEach(function(t){reg(t.name,anchorId('type',t.name));});
        mod.enums.forEach(function(e){reg(e.name,anchorId('enum',e.name));});
        mod.variables.forEach(function(v){reg(v.name,anchorId('var',v.name));});
    });
    var showToggle=(THEMES[theme]||THEMES.default).toggleBtn;
    var pages=[];
    var idxIdx=buildSearchIndex(modules,'');
    var modIdx=buildSearchIndex(modules,'../');

    // index.html
    var sidebar=buildSidebar(modules,projectName,version,'index.html','',showToggle);
    var totalFns=modules.reduce(function(s,m){return s+m.functions.length;},0);
    var totalCls=modules.reduce(function(s,m){return s+m.classes.length;},0);
    var body='<div class="page-title">'+esc(projectName)+'</div>'
        +'<div class="page-subtitle">'+modules.length+' module(s) &middot; '+totalFns+' function(s) &middot; '+totalCls+' class(es)</div>'
        +'<div class="section"><div class="section-title">Modules</div><div class="module-grid">';
    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        var label=moduleLabel(mod.filePath,modules);
        var total=mod.functions.length+mod.classes.length+mod.interfaces.length+mod.typeAliases.length+mod.enums.length+mod.variables.length;
        var parts=[mod.functions.length&&mod.functions.length+' fn',mod.classes.length&&mod.classes.length+' class',mod.interfaces.length&&mod.interfaces.length+' iface',mod.enums.length&&mod.enums.length+' enum',mod.variables.length&&mod.variables.length+' const'].filter(Boolean);
        // deprecated count across all items
        var depCount=[].concat(mod.functions,mod.classes,mod.interfaces,mod.typeAliases,mod.enums,mod.variables).filter(function(i){return i.deprecated!=null;}).length;
        // @since version range
        var sinces=[].concat(mod.functions,mod.classes,mod.interfaces,mod.typeAliases,mod.enums,mod.variables).map(function(i){return i.since;}).filter(Boolean);
        var sinceStr=sinces.length?(' · since v'+sinces.sort()[0])+(sinces.length>1&&sinces[sinces.length-1]!==sinces[0]?'–v'+sinces[sinces.length-1]:''):''
        var depStr=depCount?'<span class="badge badge-deprecated" style="font-size:10px;padding:1px 5px;vertical-align:middle">'+depCount+' deprecated</span>':'';
        var desc=mod.description?'<div class="module-card-desc">'+esc(mod.description.slice(0,100))+(mod.description.length>100?'…':'')+'</div>':'';
        body+='<a class="module-card" href="'+esc(rel)+'"><div class="module-card-name">'+esc(label)+depStr+'</div><div class="module-card-stats">'+(parts.join(' · ')||'no exported items')+esc(sinceStr)+'</div>'+desc+'</a>';
    });
    body+='</div></div>';
    pages.push({path:'index.html',html:page(projectName,sidebar,body,idxIdx,theme)});

    // per-module pages
    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        var label=moduleLabel(mod.filePath,modules);
        var modSidebar=buildSidebar(modules,projectName,version,rel,'../',showToggle);
        var mbody='<div class="breadcrumb"><a href="../index.html">'+esc(projectName)+'</a> / '+esc(label)+'</div>'
            +'<div class="page-title">'+esc(label)+'</div>'
            +'<div class="page-subtitle" style="font-family:monospace;font-size:12px">'+esc(mod.filePath)+'</div>'
            +(mod.description?'<p class="module-desc">'+esc(mod.description)+'</p>':'');
        var isEmpty=!mod.functions.length&&!mod.classes.length&&!mod.interfaces.length&&!mod.typeAliases.length&&!mod.enums.length&&!mod.variables.length;
        if(isEmpty){
            mbody+='<p class="empty" style="margin-top:24px">No documented items found.</p>';
        } else {
            mbody+=section('Functions',mod.functions,renderFunction,mod.filePath,sourceUrl,symbolMap);
            mbody+=section('Classes',mod.classes,renderClass,mod.filePath,sourceUrl,symbolMap);
            mbody+=section('Interfaces',mod.interfaces,renderInterface,mod.filePath,sourceUrl,symbolMap);
            mbody+=section('Type Aliases',mod.typeAliases,renderTypeAlias,mod.filePath,sourceUrl,symbolMap);
            mbody+=section('Enums',mod.enums,renderEnum,mod.filePath,sourceUrl,symbolMap);
            mbody+=section('Variables & Constants',mod.variables,renderVariable,mod.filePath,sourceUrl,symbolMap);
        }
        pages.push({path:rel,html:page(label+' - '+projectName,modSidebar,mbody,modIdx,theme)});
    });

    return pages;
}

module.exports = { buildSite, moduleLabel, moduleHtmlPath };

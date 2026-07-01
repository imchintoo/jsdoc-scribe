"use strict";

const path = require("path");

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const CSS_STRUCTURE = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#0a2540;background:#f6f9fc}
a{color:#625bf6;text-decoration:none}
a:hover{text-decoration:underline}
code,pre{font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace}
.layout{display:grid;grid-template-columns:260px 1fr;min-height:100vh}
.sidebar{background:#0a2540;color:#adbdd4;position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column}
.sidebar-header{padding:20px 16px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
.sidebar-title{color:#fff;font-size:14px;font-weight:700;letter-spacing:-.01em;display:block;text-decoration:none}
.sidebar-title:hover{text-decoration:none;color:#fff}
.sidebar-version{font-size:11px;color:#5a7fa8;font-family:monospace;margin-top:2px;display:block}
.search-wrap{position:relative;padding:12px}
.search-box{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:7px 10px 7px 32px;color:#d6e4f0;font-size:13px;outline:none}
.search-box::placeholder{color:#5a7fa8}
.search-box:focus{border-color:rgba(98,91,246,.6)}
.search-icon{position:absolute;left:20px;top:50%;transform:translateY(-50%);width:13px;height:13px;opacity:.4;pointer-events:none}
.search-results{display:none;position:absolute;left:12px;right:12px;background:#0d1e30;border:1px solid rgba(255,255,255,.1);border-radius:8px;max-height:320px;overflow-y:auto;z-index:100;margin-top:2px;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.search-results.visible{display:block}
.search-result-item{display:block;padding:9px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06);text-decoration:none}
.search-result-item:hover{background:rgba(255,255,255,.06)}
.sr-name{font-size:13px;font-weight:600;color:#d6e4f0;font-family:monospace}
.sr-kind{font-size:10px;color:#5a7fa8;margin-left:6px;text-transform:uppercase;letter-spacing:.05em}
.sr-module{font-size:11px;color:#5a7fa8;display:block;margin-top:2px}
.sr-preview{font-size:11px;color:#7a95b0;font-style:italic;display:block;margin-top:1px}
.search-no-results{padding:10px 14px;color:#5a7fa8;font-size:13px}
.sidebar-section{padding:8px 0 16px;flex:1;overflow-y:auto}
.sidebar-section-title{padding:12px 14px 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#3d6080}
.sidebar-link{display:block;padding:5px 14px;font-size:13px;color:#adbdd4;transition:color .1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sidebar-link:hover{color:#d6e4f0;text-decoration:none}
.sidebar-link.active{color:#00d4ff;border-left:2px solid #00d4ff;padding-left:12px}
.sidebar-dir-toggle{display:flex;align-items:center;gap:5px;cursor:pointer;list-style:none;padding:5px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3d6080;user-select:none}
.sidebar-dir-toggle::-webkit-details-marker{display:none}
.sidebar-dir-toggle::before{content:'\\25B6';font-size:8px;transition:transform .15s;flex-shrink:0}
details[open] .sidebar-dir-toggle::before{transform:rotate(90deg)}
.sidebar-link-indent{padding-left:28px}
.sidebar-link-indent.active{padding-left:26px}
.sym-rows{padding:2px 0 6px}
.sym-row{display:flex;align-items:center;gap:5px;padding:2px 10px 2px 38px;min-width:0}
.sym-pill{font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;font-family:monospace;flex-shrink:0;letter-spacing:.01em;line-height:1.4}
.sym-fn{background:#0d2b10;color:#4ade80}
.sym-cls{background:#0a1e35;color:#60a5fa}
.sym-iface{background:#170d2a;color:#c084fc}
.sym-enum{background:#291100;color:#fb923c}
.sym-type{background:#001f1a;color:#34d399}
.sym-var{background:#1a1a1a;color:#94a3b8}
.sym-link{font-size:12px;color:#7a95b0;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.sym-link:hover{color:#d6e4f0;text-decoration:none}
.sym-link.active{color:#00d4ff;font-weight:600}
.main{min-width:0;overflow-x:hidden}
.page-header{padding:32px 48px 24px;border-bottom:1px solid #e8ecf0}
.page-title{font-size:26px;font-weight:700;color:#0a2540;margin-bottom:4px;letter-spacing:-.02em}
.page-subtitle{color:#7a95b0;font-size:12px;margin-bottom:0;font-family:monospace}
.module-desc{color:#425466;font-size:14px;line-height:1.7;margin-top:10px;max-width:600px}
.breadcrumb{font-size:13px;color:#7a95b0;margin-bottom:12px}
.breadcrumb a{color:#625bf6}
.section{margin-bottom:0}
.section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7a95b0;padding:20px 32px 10px;display:flex;align-items:center;gap:8px;border-top:1px solid #e8ecf0;background:#f9fbfd}
.section:first-child .section-title{border-top:none}
.index-content .section-title{border-top:none}
.section-count{font-size:10px;font-weight:400;color:#b0bec8;font-family:monospace}
.card{display:grid;grid-template-columns:1fr 380px;background:#fff;border-bottom:1px solid #e8ecf0;scroll-margin-top:24px}
.card-prose{padding:24px 32px;border-right:1px solid #e8ecf0;min-width:0}
.card-code{background:#1a2e44;padding:22px 20px;min-width:0;overflow:hidden}
.card-header{display:flex;align-items:flex-start;gap:8px;margin-bottom:4px}
.card-name{font-size:14px;font-weight:700;color:#0a2540;font-family:monospace;flex:1;min-width:0;word-break:break-all}
.card-sig{font-size:12px;color:#425466;font-family:monospace;margin-top:4px;word-break:break-word;line-height:1.5}
.card-desc{font-size:13px;color:#425466;margin-top:10px;line-height:1.6;max-width:520px}
.card-anchor{color:#b0bec8;opacity:0;font-size:12px;margin-left:3px;transition:opacity .15s;text-decoration:none;flex-shrink:0}
.card:hover .card-anchor{opacity:.6}
.card-anchor:hover{opacity:1;text-decoration:none}
.code-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#4a6f8a;margin-bottom:8px}
.card-code pre{margin:0;font-size:12px;line-height:1.65;color:#c8daea;overflow-x:auto;white-space:pre-wrap;word-break:break-word;tab-size:2}
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
.since-label{font-size:11px;color:#7a95b0;margin-top:4px}
.params-table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
.params-table th{text-align:left;padding:6px 10px;background:#f8fafc;color:#7a95b0;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e8ecf0}
.params-table td{padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#0a2540;vertical-align:top;line-height:1.5}
.params-table td code{background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:12px;color:#425466}
.params-table td:first-child code{color:#0a2540;font-weight:600}
.returns{margin-top:12px;font-size:13px;color:#425466;padding-top:10px;border-top:1px solid #f1f5f9}
.returns code{background:#f1f5f9;padding:1px 6px;border-radius:3px;font-family:monospace;font-size:12px}
.throws-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
.throws-table th{text-align:left;padding:6px 10px;background:#fef2f2;color:#991b1b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #fecaca}
.throws-table td{padding:7px 10px;border-bottom:1px solid #fff5f5;color:#0a2540;vertical-align:top}
.throws-table td code{font-size:12px;color:#991b1b}
.collapse-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;list-style:none;margin-top:16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7a95b0;padding:0}
.collapse-toggle::-webkit-details-marker{display:none}
.collapse-toggle::before{content:'\\25B6';font-size:8px;transition:transform .15s;color:#b0bec8}
details[open] .collapse-toggle::before{transform:rotate(90deg)}
.collapse-body{margin-top:6px}
.method-row{margin-top:8px;padding:10px 0;border-top:1px solid #f1f5f9}
.method-sig{font-family:monospace;font-size:13px;color:#0a2540}
.method-desc{font-size:12px;color:#7a95b0;margin-top:4px}
.source-link{font-size:11px;color:#7a95b0;font-family:monospace;text-decoration:none;flex-shrink:0}
.source-link:hover{color:#625bf6;text-decoration:none}
.link-ref{color:#625bf6;text-decoration:none}
.link-ref:hover{text-decoration:underline}
.anchor-link{color:#b0bec8;opacity:0;font-size:13px;margin-left:6px;transition:opacity .15s}
.card:hover .anchor-link{opacity:.6}
.anchor-link:hover{opacity:1;text-decoration:none}
.empty{color:#7a95b0;font-size:13px;font-style:italic;padding:24px 32px}
.index-content{padding:32px 48px 80px}
.module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:8px}
.module-card{background:#fff;border:1px solid #e8ecf0;border-radius:8px;padding:18px 20px;display:block;transition:border-color .15s,box-shadow .15s}
.module-card:hover{border-color:#625bf6;box-shadow:0 2px 12px rgba(98,91,246,.1);text-decoration:none}
.module-card-name{font-size:14px;font-weight:700;color:#0a2540;font-family:monospace;margin-bottom:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.module-card-stats{font-size:12px;color:#7a95b0}
.module-card-desc{font-size:12px;color:#7a95b0;margin-top:6px;line-height:1.4}
.tok-kw{color:#79b8ff;font-weight:500}
.tok-str{color:#9ecbff}
.tok-cmt{color:#4a6f8a;font-style:italic}
.tok-num{color:#f8b26a}
.tok-type{color:#c792ea}
.hamburger{display:none;flex-direction:column;gap:5px;background:#0a2540;border:none;padding:8px 10px;cursor:pointer;position:fixed;top:12px;left:12px;z-index:300;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.hamburger span{width:20px;height:2px;background:#adbdd4;border-radius:2px;display:block;transition:all .2s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
@media(max-width:1100px){.card{grid-template-columns:1fr 300px}}
@media(max-width:860px){.card{grid-template-columns:1fr}.card-prose{border-right:none;border-bottom:1px solid #e8ecf0}.page-header,.index-content{padding-left:24px;padding-right:24px}.section-title{padding-left:24px;padding-right:24px}.card-prose{padding-left:24px;padding-right:24px}}
@media(max-width:720px){.layout{grid-template-columns:1fr}.sidebar{position:fixed;top:0;left:0;height:100vh;z-index:200;transform:translateX(-100%);transition:transform .25s ease;width:260px}.sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,.4)}.hamburger{display:flex}.page-header{padding-top:64px}.index-content{padding-top:64px}}
@media print{.sidebar,.hamburger,.copy-btn{display:none!important}.layout{grid-template-columns:1fr!important;display:block}.card{display:block;break-inside:avoid;border:1px solid #ccc;margin-bottom:16px}.card-code{background:#f5f5f5;color:#333}}
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
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();box.focus();box.select();}
      if(e.key==='Escape')panel.classList.remove('visible');
    });
  }
  // Hamburger
  var hamburger=document.getElementById('hamburger');
  var sidebar=document.querySelector('.sidebar');
  if(hamburger&&sidebar){
    hamburger.addEventListener('click',function(){var open=sidebar.classList.toggle('open');hamburger.classList.toggle('open',open);});
    document.addEventListener('click',function(e){if(sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&!hamburger.contains(e.target)){sidebar.classList.remove('open');hamburger.classList.remove('open');}});
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

// ---------------------------------------------------------------------------
// Card / render helpers
// ---------------------------------------------------------------------------

function buildFnSig(fn){
    var ps=(fn.params||[]).map(function(p){return p.name+(p.optional?'?':'')+': '+p.type;}).join(', ');
    var ret=fn.returnType&&fn.returnType!=='void'?': '+fn.returnType:'';
    return(fn.isAsync?'async ':'')+fn.name+'('+ps+')'+ret;
}

function buildClassSig(cls){
    var ext=cls.extends&&cls.extends.length?' extends '+cls.extends.join(', '):'';
    var impl=cls.implements&&cls.implements.length?' implements '+cls.implements.join(', '):'';
    var base=(cls.isAbstract?'abstract ':'')+'class '+cls.name+ext+impl+' {';
    if(cls.constructor){
        var cp=(cls.constructor.params||[]).map(function(p){return p.name+': '+p.type;}).join(', ');
        base+='\n  constructor('+cp+')';
    }
    return base+'\n}';
}

function buildIfaceSig(iface){
    var props=(iface.properties||[]).slice(0,8).map(function(p){return'  '+p.name+(p.optional?'?':'')+': '+p.type;});
    if((iface.properties||[]).length>8) props.push('  // ...');
    return'interface '+iface.name+' {\n'+props.join('\n')+'\n}';
}

function card(id,kindClass,proseHtml,codeHtml){
    return'<div class="card '+kindClass+'" id="'+id+'"><div class="card-prose">'+proseHtml+'</div><div class="card-code">'+codeHtml+'</div></div>';
}

function codePanel(item,sigText){
    var label=item.example?'Example':'Signature';
    var code=item.example?highlightCode(item.example):esc(sigText);
    return'<div class="code-label">'+label+'</div><button class="copy-btn" data-sig="'+esc(sigText||'')+'">Copy</button><pre>'+code+'</pre>';
}

function renderFunction(fn,filePath,sourceUrl,symbolMap){
    var id=anchorId('fn',fn.name);
    var sig=buildFnSig(fn);
    var badges=[fn.isAsync&&badge('async','async'),fn.isGenerator&&badge('generator','generator'),fn.deprecated!=null&&badge('deprecated','deprecated'),fn.since&&badge('since v'+fn.since,'since')].filter(Boolean).join('');
    var prose='<div class="card-header"><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(fn.name)+'</div>'+sourceLink(fn,filePath,sourceUrl)+'</div>'+(badges?'<div style="margin-top:4px">'+badges+'</div>':'')+descHtml(fn,symbolMap,filePath)+renderParams(fn.params,fn.jsdocParams)+(fn.returnType&&fn.returnType!=='void'?renderReturns(fn.returnType,fn.returns):'')+renderThrows(fn.throws);
    return card(id,'card-fn',prose,codePanel(fn,sig));
}

function renderClass(cls,filePath,sourceUrl,symbolMap){
    var id=anchorId('cls',cls.name);
    var sig=buildClassSig(cls);
    var badges=[cls.isAbstract&&badge('abstract','abstract'),cls.deprecated!=null&&badge('deprecated','deprecated'),cls.since&&badge('since v'+cls.since,'since')].filter(Boolean).join('');
    var prose='<div class="card-header"><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(cls.name)+'</div>'+sourceLink(cls,filePath,sourceUrl)+'</div>'+(badges?'<div style="margin-top:4px">'+badges+'</div>':'')+descHtml(cls,symbolMap,filePath);
    if(cls.constructor){
        var ctorSig='new '+cls.name+'('+(cls.constructor.params||[]).map(function(p){return p.name+': '+p.type;}).join(', ')+')';
        prose+=collapsible('Constructor','<div class="method-row"><div class="method-sig">'+esc(ctorSig)+'</div>'+(cls.constructor.description?'<div class="method-desc">'+esc(cls.constructor.description)+'</div>':'')+renderParams(cls.constructor.params,cls.constructor.jsdocParams)+renderThrows(cls.constructor.throws)+'</div>',true);
    }
    if(cls.properties&&cls.properties.length){
        var propBody='<table class="params-table"><thead><tr><th>Name</th><th>Type</th><th>Visibility</th><th>Flags</th><th>Description</th></tr></thead><tbody>';
        cls.properties.forEach(function(p){var flags=[p.isStatic&&badge('static','static'),p.isReadonly&&badge('readonly','readonly'),p.isAbstract&&badge('abstract','abstract'),p.deprecated!=null&&badge('deprecated','deprecated')].filter(Boolean).join('');propBody+='<tr><td><code>'+esc(p.name)+'</code></td><td><code>'+esc(p.type)+'</code></td><td>'+badge(p.visibility,p.visibility)+'</td><td>'+flags+'</td><td>'+(p.description?esc(p.description):'')+'</td></tr>';});
        prose+=collapsible('Properties ('+cls.properties.length+')',propBody+'</tbody></table>',true);
    }
    if(cls.methods&&cls.methods.length){
        var methBody='';
        cls.methods.forEach(function(m){var ps=(m.params||[]).map(function(p){return p.name+': '+p.type;}).join(', ');var mSig=m.name+'('+ps+'): '+m.returnType;var mb=[badge(m.visibility,m.visibility),m.isStatic&&badge('static','static'),m.isAbstract&&badge('abstract','abstract'),m.isAsync&&badge('async','async'),m.deprecated!=null&&badge('deprecated','deprecated')].filter(Boolean).join('');methBody+='<div class="method-row"><div class="card-header" style="margin-bottom:4px"><code class="method-sig">'+esc(mSig)+'</code>'+copyBtn(mSig)+'</div><div>'+mb+'</div>'+(m.description?'<div class="method-desc">'+esc(m.description)+'</div>':'')+metaHtml(m)+renderParams(m.params,m.jsdocParams)+renderReturns(m.returnType,m.returns)+renderThrows(m.throws)+'</div>';});
        prose+=collapsible('Methods ('+cls.methods.length+')',methBody,true);
    }
    if(cls.getters&&(cls.getters.length||(cls.setters||[]).length)){
        var accBody='';
        cls.getters.forEach(function(g){accBody+='<div class="method-row"><code class="method-sig">get '+esc(g.name)+'(): '+esc(g.returnType)+'</code>'+(g.isStatic?badge('static','static'):'')+(g.deprecated!=null?badge('deprecated','deprecated'):'')+(g.description?'<div class="method-desc">'+esc(g.description)+'</div>':'')+'</div>';});
        (cls.setters||[]).forEach(function(s){var ps=(s.params||[]).map(function(p){return p.name+': '+p.type;}).join(', ');accBody+='<div class="method-row"><code class="method-sig">set '+esc(s.name)+'('+esc(ps)+')</code>'+(s.isStatic?badge('static','static'):'')+(s.deprecated!=null?badge('deprecated','deprecated'):'')+(s.description?'<div class="method-desc">'+esc(s.description)+'</div>':'')+'</div>';});
        prose+=collapsible('Accessors ('+(cls.getters.length+(cls.setters||[]).length)+')',accBody,false);
    }
    return card(id,'card-cls',prose,codePanel(cls,sig));
}

function renderInterface(iface,filePath,sourceUrl,symbolMap){
    var id=anchorId('iface',iface.name);
    var sig=buildIfaceSig(iface);
    var prose='<div class="card-header"><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(iface.name)+'</div>'+sourceLink(iface,filePath,sourceUrl)+'</div>'+(iface.deprecated!=null?badge('deprecated','deprecated'):'')+descHtml(iface,symbolMap,filePath);
    if(iface.properties&&iface.properties.length){prose+='<table class="params-table" style="margin-top:12px"><thead><tr><th>Property</th><th>Type</th><th>Optional</th></tr></thead><tbody>';iface.properties.forEach(function(p){prose+='<tr><td><code>'+esc(p.name)+'</code></td><td><code>'+esc(p.type)+'</code></td><td>'+(p.optional?'yes':'')+'</td></tr>';});prose+='</tbody></table>';}
    if(iface.methods&&iface.methods.length){var mb='';iface.methods.forEach(function(m){var ps=m.params.map(function(p){return p.name+': '+p.type;}).join(', ');mb+='<div class="method-row"><code class="method-sig">'+esc(m.name)+'('+esc(ps)+'): '+esc(m.returnType)+'</code>'+(m.optional?badge('optional','optional'):'')+'</div>';});prose+=collapsible('Methods ('+iface.methods.length+')',mb,true);}
    return card(id,'card-iface',prose,codePanel(iface,sig));
}

function renderEnum(enm,filePath,sourceUrl,symbolMap){
    var id=anchorId('enum',enm.name);
    var sig='enum '+enm.name+' {\n'+(enm.members||[]).slice(0,8).map(function(m){return'  '+m.name+(m.value!==null?' = '+m.value:'');}).join(',\n')+((enm.members||[]).length>8?',\n  // ...':'')+'\n}';
    var prose='<div class="card-header"><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(enm.name)+'</div>'+sourceLink(enm,filePath,sourceUrl)+'</div>'+(enm.deprecated!=null?badge('deprecated','deprecated'):'')+descHtml(enm,symbolMap,filePath)+'<table class="params-table" style="margin-top:12px"><thead><tr><th>Member</th><th>Value</th></tr></thead><tbody>'+(enm.members||[]).map(function(m){return'<tr><td><code>'+esc(m.name)+'</code></td><td>'+(m.value!==null?'<code>'+esc(m.value)+'</code>':'')+'</td></tr>';}).join('')+'</tbody></table>';
    return card(id,'card-enum',prose,codePanel(enm,sig));
}

function renderTypeAlias(ta,filePath,sourceUrl,symbolMap){
    var id=anchorId('type',ta.name);
    var sig='type '+ta.name+' = '+ta.type;
    var prose='<div class="card-header"><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(ta.name)+'</div>'+sourceLink(ta,filePath,sourceUrl)+'</div><div class="card-sig">'+esc(sig)+'</div>'+(ta.deprecated!=null?badge('deprecated','deprecated'):'')+descHtml(ta,symbolMap,filePath);
    return card(id,'card-type',prose,codePanel(ta,sig));
}

function renderVariable(v,filePath,sourceUrl,symbolMap){
    var id=anchorId('var',v.name);
    var decl=(v.isConst?'const':'let')+' '+v.name+': '+v.type;
    var prose='<div class="card-header"><div class="card-name"><a class="anchor-link" href="#'+id+'">#</a>'+esc(v.name)+'</div>'+sourceLink(v,filePath,sourceUrl)+'</div><div class="card-sig">'+esc(decl)+'</div>'+badge(v.isConst?'const':'var',v.isConst?'const':'var')+(v.deprecated!=null?badge('deprecated','deprecated'):'')+descHtml(v,symbolMap,filePath);
    return card(id,'card-var',prose,codePanel(v,decl));
}

function section(title,items,renderFn,filePath,sourceUrl,symbolMap){
    if(!items||!items.length) return '';
    return'<div class="section"><div class="section-title">'+esc(title)+'<span class="section-count">('+items.length+')</span></div>'+items.map(function(item){return renderFn(item,filePath,sourceUrl,symbolMap);}).join('')+'</div>';
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

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function buildSidebar(modules,projectName,version,activePath,rootPrefix,activeModule){
    var prefix=rootPrefix||'';
    var html='<div class="sidebar-header"><a class="sidebar-title" href="'+prefix+'index.html">'+esc(projectName)+'</a>'+(version?'<span class="sidebar-version">v'+esc(version)+'</span>':'')+'</div>'
        +'<div class="search-wrap"><svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input id="search-box" class="search-box" type="search" placeholder="Search... (Ctrl+K)" autocomplete="off"><div id="search-results" class="search-results"></div></div>'
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
        var specs=[{list:mod.functions,kind:'fn',label:'fn'},{list:mod.classes,kind:'cls',label:'cls'},{list:mod.interfaces,kind:'iface',label:'if'},{list:mod.typeAliases,kind:'type',label:'ty'},{list:mod.enums,kind:'enum',label:'en'},{list:mod.variables,kind:'var',label:'$'}];
        specs.forEach(function(s){(s.list||[]).forEach(function(item){var anchor=anchorId(s.kind,item.name);rows+='<div class="sym-row"><span class="sym-pill sym-'+s.kind+'">'+s.label+'</span><a class="sym-link" href="#'+anchor+'">'+esc(item.name)+'</a></div>';});});
        return rows+'</div>';
    }
    order.forEach(function(dir){
        var mods=groups[dir];
        if(hasGroups&&dir){
            var anyActive=mods.some(function(m){return moduleHtmlPath(m.filePath,modules)===activePath;});
            html+='<details'+(anyActive?' open':'')+'><summary class="sidebar-dir-toggle">'+esc(dir)+'/</summary>';
            mods.forEach(function(mod){var rel=moduleHtmlPath(mod.filePath,modules);var label=moduleLabel(mod.filePath,modules);var name=label.slice(dir.length+1);var isActive=activePath===rel;html+='<a class="sidebar-link sidebar-link-indent'+(isActive?' active':'')+'" href="'+esc(prefix+rel)+'">'+esc(name)+'</a>';if(isActive&&activeModule)html+=symRows(activeModule);});
            html+='</details>';
        } else {
            mods.forEach(function(mod){var rel=moduleHtmlPath(mod.filePath,modules);var label=moduleLabel(mod.filePath,modules);var name=dir?label.slice(dir.length+1):label;var isActive=activePath===rel;html+='<a class="sidebar-link'+(isActive?' active':'')+'" href="'+esc(prefix+rel)+'">'+esc(name)+'</a>';if(isActive&&activeModule)html+=symRows(activeModule);});
        }
    });
    return html+'</div>';
}

// ---------------------------------------------------------------------------
// Site builder helpers
// ---------------------------------------------------------------------------

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

function buildCss(){
    return CSS_STRUCTURE;
}

function page(title,sidebarHtml,bodyHtml,assetPrefix){
    var p=assetPrefix||'';
    return'<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+esc(title)+'</title>\n<link rel="stylesheet" href="'+p+'assets/style.css">\n</head>\n<body>\n<button id="hamburger" class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>\n<div class="layout">\n<nav class="sidebar">'+sidebarHtml+'</nav>\n<main class="main">'+bodyHtml+'</main>\n</div>\n<script src="'+p+'search-index.js"></script>\n<script src="'+p+'assets/app.js"></script>\n</body>\n</html>';
}

// ---------------------------------------------------------------------------
// Site builder
// ---------------------------------------------------------------------------

function buildSite(modules,options){
    options=options||{};
    var projectName=options.projectName||'Documentation';
    var version=options.version||'';
    var sourceUrl=options.sourceUrl||null;
    var symbolMap=buildSymbolMap(modules);
    var pages=[];

    pages.push({path:'assets/style.css', html:buildCss()});
    pages.push({path:'assets/app.js',    html:CLIENT_JS});
    pages.push({path:'search-index.js',  html:'window.__SEARCH_INDEX__='+JSON.stringify(buildSearchIndex(modules,''))+';'});

    var totalFns=modules.reduce(function(s,m){return s+m.functions.length;},0);
    var totalCls=modules.reduce(function(s,m){return s+m.classes.length;},0);
    var idxBody='<div class="index-content"><div class="page-title">'+esc(projectName)+'</div><div class="page-subtitle">'+modules.length+' module(s) &middot; '+totalFns+' function(s) &middot; '+totalCls+' class(es)</div>'+buildIndexBody(modules)+'</div>';
    pages.push({path:'index.html',html:page(projectName,buildSidebar(modules,projectName,version,'index.html','',null),idxBody,'')});

    modules.forEach(function(mod){
        var rel=moduleHtmlPath(mod.filePath,modules);
        var label=moduleLabel(mod.filePath,modules);
        var modHeader='<div class="page-header"><div class="breadcrumb"><a href="../index.html">'+esc(projectName)+'</a> / '+esc(label)+'</div><div class="page-title">'+esc(label)+'</div><div class="page-subtitle">'+esc(mod.filePath)+'</div>'+(mod.description?'<p class="module-desc">'+esc(mod.description)+'</p>':'')+'</div>';
        pages.push({path:rel,html:page(label+' - '+projectName,buildSidebar(modules,projectName,version,rel,'../',mod),modHeader+buildModuleBody(mod,sourceUrl,symbolMap),'../')});
    });

    return pages;
}
module.exports = { buildSite, moduleLabel, moduleHtmlPath };

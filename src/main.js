import { createIcons, Spline, Shapes, BookOpen, Sun, Moon, Github, ArrowUpRight, ChartSpline, Table2, GitFork, Sparkles, RotateCcw, WandSparkles, ArrowRight, Plus, SlidersHorizontal, Eye, CodeXml, ScanLine, Copy, CheckCheck, Download, Save, FolderOpen, X, Play } from 'lucide';
import { expression, autoVariation, tableWarnings } from './math.js';
import { buildScene, initialTable, initialTree } from './project.js';
import { toSVG, toTypst } from './drawing.js';
import { GitHubCompiler, BrokerCompiler } from './github.js';
import { compilePDF } from './local-compiler.js';
import './style.css';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=n=>`<i data-lucide="${n}"></i>`;
const icons={Spline,Shapes,BookOpen,Sun,Moon,Github,ArrowUpRight,ChartSpline,Table2,GitFork,Sparkles,RotateCcw,WandSparkles,ArrowRight,Plus,SlidersHorizontal,Eye,CodeXml,ScanLine,Copy,CheckCheck,Download,Save,FolderOpen,X,Play};
const state={mode:'graph',formula:'x^3 - 3*x + 1',table:initialTable(),tree:initialTree,manual:false,view:'preview',theme:'light',options:{xmin:-4,xmax:4,ymin:-4,ymax:6,color:'#2755df',showGrid:true,showPoints:true,title:''}};
let lastScene=null,lastSource='',currentProject=null,busy=false,pdfBusy=false,pollTimer,broker=false;
try{state.theme=localStorage.getItem('dothi-theme')||'light';}catch{}
document.documentElement.dataset.theme=state.theme;
const presets=[['Bậc hai','x^2 - 2*x - 3'],['Bậc ba','x^3 - 3*x + 1'],['Trùng phương','x^4 - 2*x^2'],['Phân thức','(2*x + 1)/(x - 1)'],['Lượng giác','sin(x)'],['Logarit','ln(x)'],['Hàm mũ','exp(x)'],['Căn thức','sqrt(x)']];
$('#app').innerHTML=`
  <aside class="rail"><a class="brand-mark" href="./" aria-label="Đồ Thị Studio">${icon('spline')}</a><div class="rail-middle"><button class="rail-button active" title="Xưởng hình vẽ" aria-label="Xưởng hình vẽ">${icon('shapes')}</button><button class="rail-button" id="help-rail" title="Hướng dẫn" aria-label="Hướng dẫn">${icon('book-open')}</button></div><span class="rail-bottom">β</span></aside>
  <div class="shell"><header class="topbar"><a class="wordmark" href="./">CHĐ<span>math studio</span><span class="version">BETA 1.0</span></a><div class="top-actions"><span class="local-badge"><span></span> Không gian soạn hình</span><button class="icon-button" id="theme" aria-label="Đổi giao diện sáng tối">${icon(state.theme==='dark'?'sun':'moon')}</button><button class="secondary small" id="github-open">${icon('github')}<span>GitHub Actions</span></button></div></header>
  <main><div class="page-heading"><div><div class="eyebrow">TỪ Ý TƯỞNG ĐẾN TRANG GIÁO ÁN</div><h1>Toán học, vẽ thật đẹp<span>.</span></h1><p>Một công thức. Những hình vẽ chỉn chu. Sẵn sàng cho bài giảng tiếp theo.</p></div><button class="text-button" id="help">Hướng dẫn nhanh ${icon('arrow-up-right')}</button></div>
  <nav class="mode-tabs" aria-label="Loại hình vẽ"><button data-mode="graph" class="selected">${icon('chart-spline')} Đồ thị hàm số</button><button data-mode="variation">${icon('table-2')} Bảng biến thiên</button><button data-mode="tree">${icon('git-fork')} Sơ đồ cây</button><span class="typst-tag">Được tạo bằng <b>Typst</b> ${icon('sparkles')}</span></nav>
  <div class="workspace"><section class="controls"><div class="panel-heading"><span class="section-number">01</span><h2>Thiết lập hình vẽ</h2><button class="icon-button" id="reset" title="Khôi phục mẫu" aria-label="Khôi phục mẫu">${icon('rotate-ccw')}</button></div>
    <div id="formula-section"><label class="field-label" for="formula">Hàm số của bạn <span>f(x)</span></label><form id="formula-form"><div class="formula-input"><span>y =</span><input id="formula" value="${e(state.formula)}" autocomplete="off" spellcheck="false" aria-label="Công thức hàm số" maxlength="240"/></div><p class="hint">Dùng ^ cho lũy thừa, * cho phép nhân, ln(x), sin(x)…</p><div class="field-label preset-label">BẮT ĐẦU TỪ MỘT DẠNG QUEN THUỘC</div><div class="presets">${presets.map(([name,f])=>`<button type="button" data-preset="${e(f)}" class="${f===state.formula?'chosen':''}">${name}</button>`).join('')}</div><button class="primary generate" type="submit">${icon('wand-sparkles')} Cập nhật hình vẽ ${icon('arrow-right')}</button></form><div class="analysis-card"><span class="status-dot"></span><div><strong id="function-kind">Đa thức bậc 3</strong><p id="derivative"></p><p id="domain"></p></div></div></div>
    <div id="table-section" hidden><div class="segmented"><button id="auto-table" class="selected">Từ công thức</button><button id="manual-table">Tùy chỉnh từng ô</button></div><p class="hint" id="table-hint">Các mốc và dấu được phân tích tự động.</p><div id="table-editor"></div><div class="table-actions"><button class="secondary small" id="add-point">${icon('plus')} Thêm mốc</button><button class="secondary small" id="illustrate">${icon('chart-spline')} Phác họa</button></div><div id="table-warning" class="notice" hidden></div></div>
    <div id="tree-section" hidden><label class="field-label" for="tree-input">Nút và nhánh</label><textarea id="tree-input" rows="12" spellcheck="false">${state.tree}</textarea><p class="hint">Mỗi cấp thụt 2 dấu cách.<br><code>Tên nút | nhãn nhánh</code><br>Tối đa 31 nút, 6 cấp.</p><button class="primary generate" id="tree-update">${icon('wand-sparkles')} Cập nhật sơ đồ</button></div>
    <details open class="settings"><summary>Tùy chỉnh trình bày ${icon('sliders-horizontal')}</summary><div class="settings-content"><label class="field-label" for="figure-title">Tiêu đề hình <span>Không bắt buộc</span></label><input id="figure-title" maxlength="100" placeholder="Ví dụ: Khảo sát hàm số"/><div id="axis-settings"><div class="axis-grid"><label>x nhỏ nhất<input type="number" id="xmin" value="-4" step="any"/></label><label>x lớn nhất<input type="number" id="xmax" value="4" step="any"/></label><label>y nhỏ nhất<input type="number" id="ymin" value="-4" step="any"/></label><label>y lớn nhất<input type="number" id="ymax" value="6" step="any"/></label></div><label class="check"><input type="checkbox" id="showGrid" checked/> Lưới tọa độ</label><label class="check"><input type="checkbox" id="showPoints" checked/> Đánh dấu điểm dừng</label></div><div class="color-row"><span>Màu nét vẽ</span><div class="swatches">${['#2755df','#188779','#9b51bd','#d06b38','#24334b'].map((c,i)=>`<button data-color="${c}" style="--swatch:${c}" class="swatch ${i===0?'selected':''}" aria-label="Màu ${c}"></button>`).join('')}<input type="color" id="custom-color" value="#2755df" aria-label="Chọn màu khác"/></div></div></div></details>
  </section>
  <section class="result-panel"><div class="result-toolbar"><div class="preview-tabs"><button id="preview-tab" class="selected">${icon('eye')} Bản xem trước</button><button id="code-tab">${icon('code-xml')} Mã Typst</button></div><div class="paper-label">${icon('scan-line')} VECTOR · SẮC NÉT MỌI KÍCH THƯỚC</div></div><div class="canvas-area"><div class="canvas-topline"><span id="figure-label">HÌNH 01 / ĐỒ THỊ HÀM SỐ</span><div class="zoom-tools"><button id="zoom-out" aria-label="Thu nhỏ">−</button><span id="zoom-label">100%</span><button id="zoom-in" aria-label="Phóng to">+</button></div></div><div id="error" role="alert" hidden></div><div id="preview-wrap"><div class="paper" id="preview"></div></div><div id="code-wrap" hidden><div class="code-heading"><span>figure.typ</span><button class="secondary small" id="copy-code">${icon('copy')} Sao chép</button></div><pre><code id="source"></code></pre></div><div class="canvas-note">${icon('check-check')} <span id="preview-note">Xem trước tức thì · Hình xuất luôn có nền trắng</span></div></div>
  <div class="export-bar"><div><strong>Sẵn sàng đưa vào bài giảng</strong><p>Biên dịch ngay tại đây · Không cần tài khoản.</p></div><div class="export-actions"><select id="format" aria-label="Định dạng xuất"><option value="pdf">PDF · Typst trực tiếp</option><option value="svg">SVG · vector</option><option value="png">PNG · 3×</option><option value="typ">Typst · mã nguồn</option></select><button class="primary" id="download">${icon('download')} Tải xuống</button></div></div><p id="export-status" class="hint" role="status" aria-live="polite" style="padding:0 24px">PDF được biên dịch trên thiết bị của bạn. Lần đầu tải bộ Typst khoảng 28 MB.</p><div class="project-actions"><button class="text-button" id="save-project">${icon('save')} Lưu dự án</button><button class="text-button" id="load-project">${icon('folder-open')} Mở dự án</button><input type="file" id="project-file" accept=".json" hidden/><span id="size-label">900 × 540</span></div></section></div>
  <footer><span><b>CHĐ Math Studio</b> &nbsp; / &nbsp; Dành cho người dạy Toán.</span><span>Thiết kế bởi Chân Đức.</span></footer></main></div>
  <dialog id="github-dialog"><form method="dialog" class="dialog-head"><div><span class="eyebrow">BIÊN DỊCH TRỰC TUYẾN</span><h2>Xuất bản với Typst</h2></div><button class="icon-button" aria-label="Đóng">${icon('x')}</button></form><p>GitHub Actions biên dịch hình hiện tại thành <b>PDF, PNG và SVG</b>. Sau khi hoàn thành, tải gói kết quả tại trang lần chạy.</p><div class="notice">Tùy chọn nâng cao dành cho chủ repository. Người dùng thông thường chọn PDF ở nút tải xuống. Token chỉ giữ trong bộ nhớ trang, không được lưu vào dự án.</div><label class="field-label" for="repo">Repository GitHub</label><input id="repo" placeholder="tai-khoan/math-typst-studio"/><label class="field-label" for="branch">Nhánh</label><input id="branch" value="main"/><label class="field-label" for="token">Fine-grained token · Actions: read and write</label><input id="token" type="password" autocomplete="off" placeholder="github_pat_…"/><p class="hint">Chế độ này dành cho repository của bạn. Dịch vụ công cộng có thể dùng máy chủ trung gian đi kèm dự án.</p><button class="primary generate" id="compile">${icon('play')} Biên dịch hình hiện tại</button><div id="compile-status" role="status" aria-live="polite"></div><a id="run-link" target="_blank" rel="noopener" hidden>Xem kết quả và tải tệp trên GitHub ↗</a></dialog>
  <dialog id="help-dialog"><form method="dialog" class="dialog-head"><h2>Từ công thức đến hình vẽ</h2><button class="icon-button" aria-label="Đóng">${icon('x')}</button></form><ol><li><b>Chọn loại hình.</b> Nhập công thức hoặc chọn một mẫu.</li><li><b>Chỉnh hình.</b> Đổi khung tọa độ, màu và tiêu đề; kết quả cập nhật ngay.</li><li><b>Bảng biến thiên.</b> Tự động cho đa thức bậc ≤ 4, phân thức bậc nhất/bậc nhất, exp(x), ln(x), sqrt(x). Các dạng khác dùng chế độ tùy chỉnh.</li><li><b>Sửa từng ô.</b> Nhập x, y; chọn dấu y′ và ký hiệu tại mốc. Với ||, nhập riêng giới hạn trái/phải. Phân số dùng 1/2, căn dùng sqrt(2); ký hiệu tự do vẫn hiển thị nguyên văn.</li><li><b>Xuất hình.</b> SVG/PNG nhanh từ bản xem trước. Mã .typ là vector Typst thực. Chọn PDF để biên dịch Typst ngay trên trình duyệt, không cần đăng nhập. GitHub Actions là tùy chọn nâng cao.</li></ol><div class="notice">Bảng biến thiên không xác định duy nhất đồ thị. Phác họa từ bảng chỉ minh họa xu hướng, không phải phép khôi phục công thức hay tiệm cận chính xác. Đồ thị công thức được lấy mẫu số; hàm dao động rất nhanh có thể cần thu hẹp miền xem.</div><p>Dự án được lưu thành JSON ngay trên máy. Không tự động gửi công thức lên mạng.</p></dialog><div id="toast" role="status" aria-live="polite"></div>`;

function refreshIcons(){createIcons({icons,attrs:{'stroke-width':1.7}});}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3300);}
function syncOptions(){for(const k of ['xmin','xmax','ymin','ymax'])state.options[k]=Number($('#'+k).value);for(const k of ['showGrid','showPoints'])state.options[k]=$('#'+k).checked;state.options.title=$('#figure-title').value;}
function getProject(){return {version:1,mode:state.mode,formula:state.formula,table:structuredClone(state.table),tree:state.tree,options:{...state.options}};}
function renderEditor(){
  $('#auto-table').classList.toggle('selected',!state.manual);$('#manual-table').classList.toggle('selected',state.manual);
  $('#table-hint').textContent=state.manual?'Nhập từ trái sang phải. ±∞, phân số, căn thức hoặc nhãn tự do.':'Các mốc và dấu được phân tích tự động. Chọn tùy chỉnh để sửa.';
  $('#table-editor').innerHTML=state.table.points.map((p,i)=>`<div class="point-card"><div class="point-head"><b>Mốc ${i+1}</b><button class="remove-point" data-remove="${i}" aria-label="Xóa mốc ${i+1}" ${!state.manual||state.table.points.length<=2?'disabled':''}>×</button></div><div class="point-fields"><label>x<input data-point="${i}" data-key="x" value="${e(p.x)}" maxlength="40" ${!state.manual?'disabled':''}/></label><label>y′ tại mốc<select data-point="${i}" data-key="mark" ${!state.manual?'disabled':''}>${['','0','||'].map(v=>`<option value="${v}" ${v===p.mark?'selected':''}>${v||'Trống'}</option>`).join('')}</select></label><label>${p.mark==='||'?'y trái':'y'}<input data-point="${i}" data-key="y" value="${e(p.y)}" maxlength="40" ${!state.manual?'disabled':''}/></label>${p.mark==='||'?`<label>y phải<input data-point="${i}" data-key="right" value="${e(p.right??p.y)}" maxlength="40" ${!state.manual?'disabled':''}/></label>`:''}</div>${i<state.table.signs.length?`<label class="interval">Khoảng ${i+1} → ${i+2}<select data-sign="${i}" ${!state.manual?'disabled':''}>${['+','−','0','||'].map(v=>`<option ${v===state.table.signs[i]?'selected':''}>${v}</option>`).join('')}</select></label>`:''}</div>`).join('');
  $$('.point-fields').forEach((fields,i)=>{
    const p=state.table.points[i],split=p.split??(p.mark==='||');
    if(!split)fields.querySelector('[data-key="right"]')?.closest('label').remove();
    fields.insertAdjacentHTML('beforeend',`<label>Dòng y<select data-split="${i}" ${!state.manual?'disabled':''}><option value="no" ${!split?'selected':''}>Liền</option><option value="yes" ${split?'selected':''}>|| · Ngắt</option></select></label>`);
    if(split&&p.mark!=='||')fields.insertAdjacentHTML('beforeend',`<label>y phải<input data-point="${i}" data-key="right" value="${e(p.right??p.y)}" maxlength="40" ${!state.manual?'disabled':''}/></label>`);
  });
  $$('[data-point][data-key="x"], [data-point][data-key="y"], [data-point][data-key="right"]').forEach(input=>input.setAttribute('list','math-symbols'));
  $$('[data-split]').forEach(el=>el.onchange=()=>{state.table.points[+el.dataset.split].split=el.value==='yes';renderEditor();render();});
  $('#add-point').disabled=!state.manual||state.table.points.length>=10;
  $$('[data-point]').forEach(el=>el.addEventListener('change',()=>{state.table.points[+el.dataset.point][el.dataset.key]=el.value;renderEditor();render();}));
  $$('[data-sign]').forEach(el=>el.addEventListener('change',()=>{state.table.signs[+el.dataset.sign]=el.value;render();}));
  $$('[data-remove]').forEach(el=>el.addEventListener('click',()=>{const i=+el.dataset.remove;state.table.points.splice(i,1);state.table.signs.splice(Math.min(i,state.table.signs.length-1),1);renderEditor();render();}));
}
function render(){
  syncOptions();state.formula=$('#formula').value;state.tree=$('#tree-input').value;
  $('#formula-section').hidden=state.mode==='tree'||state.mode==='illustration';$('#table-section').hidden=!['variation','illustration'].includes(state.mode);$('#tree-section').hidden=state.mode!=='tree';$('#axis-settings').hidden=!['graph','illustration'].includes(state.mode);
  $$('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===(state.mode==='illustration'?'variation':state.mode)));
  try{
    if(state.mode==='graph'||(state.mode==='variation'&&!state.manual)){
      const ex=expression(state.formula),t=autoVariation(ex);$('#derivative').textContent=`y′ = ${ex.diff}`;$('#function-kind').textContent=t?.kind||'Đồ thị theo công thức';$('#domain').textContent=t?`Tập xác định: ${t.domain}`:'Bảng tự động chưa hỗ trợ dạng này.';
      if(state.mode==='variation'){if(!t)throw new Error('Chưa hỗ trợ bảng tự động cho hàm này. Chọn “Tùy chỉnh từng ô” để nhập bảng.');state.table=t;renderEditor();}
    }
    const warnings=['variation','illustration'].includes(state.mode)?tableWarnings(state.table):[];$('#table-warning').hidden=!warnings.length;$('#table-warning').textContent=warnings.join(' ');
    currentProject=getProject();lastScene=buildScene(currentProject);lastSource=toTypst(lastScene);$('#preview').innerHTML=toSVG(lastScene);$('#source').textContent=lastSource;
    $('#error').hidden=true;$('#download').disabled=pdfBusy;$('#compile').disabled=busy;$('#size-label').textContent=`${lastScene.width} × ${lastScene.height}`;
    $('#figure-label').textContent={graph:'HÌNH 01 / ĐỒ THỊ HÀM SỐ',variation:'HÌNH 02 / BẢNG BIẾN THIÊN',tree:'HÌNH 03 / SƠ ĐỒ CÂY',illustration:'PHÁC HỌA / TỪ BẢNG BIẾN THIÊN'}[state.mode];
    $('#preview-note').textContent=state.mode==='illustration'?'Chỉ minh họa xu hướng · Không xác định duy nhất đồ thị':'Xem trước tức thì · Hình xuất luôn có nền trắng';
  }catch(err){lastScene=null;currentProject=null;lastSource='';$('#source').textContent='';$('#preview').innerHTML='<div class="empty-result">Chỉnh lại dữ liệu để tạo hình vẽ.</div>';$('#error').textContent=err.message;$('#error').hidden=false;$('#download').disabled=true;$('#compile').disabled=true;}
  refreshIcons();
}
function setMode(mode){state.mode=mode;render();if(mode==='variation')renderEditor();}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function exportImage(){
  if(!lastScene)return;const format=$('#format').value;
  if(format==='pdf'){
    if(pdfBusy)return;pdfBusy=true;$('#download').disabled=true;
    const source=lastSource;
    try{
      const bytes=await compilePDF(source,status=>{$('#export-status').textContent=status==='loading'?'Đang tải Typst lần đầu (khoảng 28 MB)…':'Typst đang biên dịch trên thiết bị của bạn…';});
      download(bytes,'figure.pdf','application/pdf');$('#export-status').textContent='Biên dịch thành công · PDF đã sẵn sàng trong thư mục tải xuống.';
    }catch(err){$('#export-status').textContent=err.message;}
    finally{pdfBusy=false;$('#download').disabled=!lastScene;}
    return;
  }
  if(format==='typ'){download(lastSource,'figure.typ','text/plain;charset=utf-8');return;}
  const svg=toSVG(lastScene);if(format==='svg'){download(svg,'figure.svg','image/svg+xml;charset=utf-8');return;}
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=lastScene.width*3;canvas.height=lastScene.height*3;const ctx=canvas.getContext('2d');ctx.scale(3,3);ctx.drawImage(image,0,0);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw new Error('Không thể tạo ảnh PNG.');download(blob,'figure.png','image/png');}catch(err){toast(err.message);}finally{URL.revokeObjectURL(url);}
}
$$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$$('[data-preset]').forEach(b=>b.onclick=()=>{$('#formula').value=b.dataset.preset;state.manual=false;$$('[data-preset]').forEach(p=>p.classList.toggle('chosen',p===b));render();});
$('#formula-form').onsubmit=event=>{event.preventDefault();render();};
let debounce;$('#formula').oninput=()=>{clearTimeout(debounce);debounce=setTimeout(render,400);};
$('#theme').onclick=()=>{state.theme=state.theme==='light'?'dark':'light';document.documentElement.dataset.theme=state.theme;try{localStorage.setItem('dothi-theme',state.theme);}catch{}$('#theme').innerHTML=icon(state.theme==='dark'?'sun':'moon');refreshIcons();};
for(const id of ['help','help-rail'])$('#'+id).onclick=()=>$('#help-dialog').showModal();
$('#github-open').onclick=()=>$('#github-dialog').showModal();
$('#github-open').setAttribute('aria-label','GitHub Actions');
$('#auto-table').onclick=()=>{state.manual=false;state.mode='variation';render();renderEditor();};$('#manual-table').onclick=()=>{state.manual=true;state.mode='variation';renderEditor();render();};
$('#add-point').onclick=()=>{if(state.table.points.length>=10)return;state.table.points.splice(-1,0,{x:'2',y:'0',mark:'0'});state.table.signs.push('+');renderEditor();render();};
$('#illustrate').onclick=()=>{state.manual=true;state.mode='illustration';render();};
$('#tree-update').onclick=render;
$('#reset').onclick=()=>{state.manual=false;state.table=initialTable();$('#formula').value='x^3 - 3*x + 1';$('#tree-input').value=initialTree;$('#figure-title').value='';for(const [k,v]of Object.entries({xmin:-4,xmax:4,ymin:-4,ymax:6}))$('#'+k).value=v;if(state.mode==='illustration')state.mode='variation';render();renderEditor();toast('Đã khôi phục mẫu.');};
for(const id of ['xmin','xmax','ymin','ymax','showGrid','showPoints','figure-title'])$('#'+id).onchange=render;
function setColor(c){state.options.color=c;$$('[data-color]').forEach(b=>b.classList.toggle('selected',b.dataset.color===c));$('#custom-color').value=c;render();}
$$('[data-color]').forEach(b=>b.onclick=()=>setColor(b.dataset.color));$('#custom-color').oninput=event=>setColor(event.target.value);
function view(code){$('#preview-wrap').hidden=code;$('#code-wrap').hidden=!code;$('#code-tab').classList.toggle('selected',code);$('#preview-tab').classList.toggle('selected',!code);}
$('#code-tab').onclick=()=>view(true);$('#preview-tab').onclick=()=>view(false);
$('#copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(lastSource);toast('Đã sao chép mã Typst.');}catch{toast('Trình duyệt chặn sao chép. Bạn có thể tải tệp .typ.');}};
let zoom=100;function changeZoom(d){zoom=Math.max(50,Math.min(160,zoom+d));$('#preview').style.width=`${zoom}%`;$('#zoom-label').textContent=zoom+'%';}$('#zoom-in').onclick=()=>changeZoom(10);$('#zoom-out').onclick=()=>changeZoom(-10);
$('#download').onclick=exportImage;
$('#save-project').onclick=()=>{if(!currentProject){toast('Sửa dữ liệu trước khi lưu.');return;}download(JSON.stringify(currentProject,null,2),'do-thi-project.json','application/json');};
$('#load-project').onclick=()=>$('#project-file').click();$('#project-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>50000)throw new Error('Tệp dự án tối đa 50 KB.');const p=JSON.parse(await file.text());buildScene(p);state.mode=p.mode;state.manual=true;state.table=p.table||initialTable();$('#formula').value=p.formula||'x';$('#tree-input').value=p.tree||initialTree;Object.assign(state.options,p.options);for(const k of ['xmin','xmax','ymin','ymax'])$('#'+k).value=state.options[k];for(const k of ['showGrid','showPoints'])$('#'+k).checked=state.options[k];$('#figure-title').value=state.options.title;renderEditor();render();toast('Đã mở dự án.');}catch(err){toast(`Không mở được: ${err.message}`);}event.target.value='';};
$('#compile').onclick=async()=>{
  if(busy||!currentProject)return;busy=true;$('#compile').disabled=true;$('#run-link').hidden=true;$('#compile-status').textContent='Đang gửi yêu cầu…';
  try{
    const client=broker?new BrokerCompiler():new GitHubCompiler({repo:$('#repo').value.trim(),branch:$('#branch').value.trim(),token:$('#token').value.trim()});const id=await client.dispatch(currentProject);const start=Date.now();
    $('#token').value='';$('#compile-status').textContent='Đã gửi. Đang đợi GitHub cấp máy biên dịch…';
    async function poll(){try{const run=await client.status(id);if(run.url){$('#run-link').href=run.url;$('#run-link').hidden=false;}if(run.status==='completed'){$('#compile-status').textContent=run.conclusion==='success'?'Biên dịch thành công. Mở lần chạy → Artifacts → tải “figure-'+id+'”.':`Biên dịch kết thúc: ${run.conclusion}. Mở lần chạy để xem lỗi.`;busy=false;$('#compile').disabled=!lastScene;return;}if(Date.now()-start>12*60*1000){$('#compile-status').textContent='Đã dừng theo dõi sau 12 phút. Tác vụ trên GitHub có thể vẫn chạy; xem trong Actions.';busy=false;$('#compile').disabled=!lastScene;return;}$('#compile-status').textContent=run.status==='in_progress'?'Typst đang biên dịch PDF, PNG và SVG…':'Đang chờ GitHub Actions…';pollTimer=setTimeout(poll,6000);}catch(err){$('#compile-status').textContent=err.message;busy=false;$('#compile').disabled=!lastScene;}}
    pollTimer=setTimeout(poll,4000);
  }catch(err){$('#compile-status').textContent=err.message;busy=false;$('#compile').disabled=!lastScene;}
};
window.addEventListener('beforeunload',()=>clearTimeout(pollTimer));
document.body.insertAdjacentHTML('beforeend','<datalist id="math-symbols"><option value="−∞"></option><option value="+∞"></option><option value="0"></option><option value="1/2"></option><option value="sqrt(2)"></option></datalist>');
renderEditor();render();
// Static GitHub Pages keeps personal-repository mode. The optional same-origin server enables public mode.
fetch(new URL('api/config',location.href)).then(r=>r.ok&&r.headers.get('content-type')?.includes('application/json')?r.json():null).then(config=>{
  if(!config?.broker)return;broker=true;
  for(const id of ['repo','branch','token']){$('#'+id).hidden=true;$(`label[for="${id}"]`).hidden=true;}
  $('#github-dialog .notice').textContent='Dịch vụ biên dịch đã kết nối. Không cần token cá nhân. Công thức được gửi tới GitHub khi bạn bấm biên dịch.';
  $('#github-dialog .hint').textContent='Sau khi hoàn thành, tải trực tiếp gói ZIP gồm PDF, PNG, SVG và mã nguồn.';
  $('#run-link').textContent='Tải gói PDF, PNG, SVG và mã Typst ↗';
}).catch(()=>{});

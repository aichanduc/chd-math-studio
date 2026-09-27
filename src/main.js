import { initialInequalities } from './inequalities.js';
import { formulaSVG } from './math-typeset.js';
import { panRange, zoomRange, validRange } from './viewport.js';
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
const state={mode:'graph',formula:'x^3 - 3*x + 1',table:initialTable(),tree:initialTree,manual:false,customTable:initialTable(),standardTable:initialTable(),standardManual:false,tableTab:'variation',inequalities:initialInequalities(),reverse:false,previewSize:50,multi:false,curves:[{formula:'x^2',color:'#d06b38',enabled:true}],view:'preview',theme:'light',options:{xmin:-4,xmax:4,ymin:-4,ymax:6,color:'#2755df',showGrid:true,showPoints:true,showIntersections:false,title:''}};
let lastScene=null,lastSource='',currentProject=null,busy=false,pdfBusy=false,pollTimer,broker=false,zoom=100;
try{state.theme=localStorage.getItem('dothi-theme')||'light';}catch{}
document.documentElement.dataset.theme=state.theme;
const presets=[['Bậc hai','x^2 - 2*x - 3'],['Bậc ba','x^3 - 3*x + 1'],['Trùng phương','x^4 - 2*x^2'],['Phân thức','(2*x + 1)/(x - 1)'],['Lượng giác','sin(x)'],['Logarit','ln(x)'],['Hàm mũ','exp(x)'],['Căn thức','sqrt(x)']];
$('#app').innerHTML=`
  <aside class="rail"><a class="brand-mark" href="./" aria-label="Đồ Thị Studio">${icon('spline')}</a><div class="rail-middle"><button class="rail-button active" title="Xưởng hình vẽ" aria-label="Xưởng hình vẽ">${icon('shapes')}</button><button class="rail-button" id="help-rail" title="Hướng dẫn" aria-label="Hướng dẫn">${icon('book-open')}</button></div><span class="rail-bottom">β</span></aside>
  <div class="shell"><header class="topbar"><a class="wordmark" href="./">CHĐ<span>math studio</span><span class="version">1.4</span></a><div class="top-actions"><span class="local-badge"><span></span> Không gian soạn hình</span><button class="icon-button" id="theme" aria-label="Đổi giao diện sáng tối">${icon(state.theme==='dark'?'sun':'moon')}</button><button class="secondary small" id="github-open">${icon('github')}<span>GitHub Actions</span></button></div></header>
  <main><div class="page-heading"><div><div class="eyebrow">TỪ Ý TƯỞNG ĐẾN TRANG GIÁO ÁN</div><h1>Toán học, vẽ thật đẹp<span>.</span></h1><p>Một công thức. Những hình vẽ chỉn chu. Sẵn sàng cho bài giảng tiếp theo.</p></div><button class="text-button" id="help">Hướng dẫn nhanh ${icon('arrow-up-right')}</button></div>
  <nav class="mode-tabs" aria-label="Loại hình vẽ"><button data-mode="graph" class="selected">${icon('chart-spline')} Đồ thị hàm số</button><button data-mode="variation">${icon('table-2')} Bảng biến thiên</button><button data-mode="custom">${icon('table-2')} Bảng biến thiên tùy chỉnh</button><button data-mode="inequalities">${icon('shapes')} Miền nghiệm hệ BPT</button><button data-mode="tree">${icon('git-fork')} Sơ đồ cây</button><span class="typst-tag">Được tạo bằng <b>Typst</b> ${icon('sparkles')}</span></nav>
  <div class="workspace"><section class="controls"><div class="panel-heading"><span class="section-number">01</span><h2>Thiết lập hình vẽ</h2><button class="icon-button" id="reset" title="Khôi phục mẫu" aria-label="Khôi phục mẫu">${icon('rotate-ccw')}</button></div>
    <div id="formula-section"><label class="field-label" for="formula">Hàm số của bạn <span>f(x)</span></label><form id="formula-form"><div class="formula-input"><span>y =</span><input id="formula" value="${e(state.formula)}" autocomplete="off" spellcheck="false" aria-label="Công thức hàm số" maxlength="240"/></div><div id="formula-typeset" class="formula-typeset"></div><p class="hint">Dùng ^ cho lũy thừa, * cho phép nhân, ln(x), sin(x)…</p><div class="field-label preset-label">BẮT ĐẦU TỪ MỘT DẠNG QUEN THUỘC</div><div class="presets">${presets.map(([name,f])=>`<button type="button" data-preset="${e(f)}" class="${f===state.formula?'chosen':''}">${name}</button>`).join('')}</div><button class="primary generate" type="submit">${icon('wand-sparkles')} Cập nhật hình vẽ ${icon('arrow-right')}</button></form><div class="analysis-card"><span class="status-dot"></span><div><strong id="function-kind">Đa thức bậc 3</strong><p id="derivative"></p><p id="domain"></p></div></div></div>
    <div id="multi-section"><label class="check"><input type="checkbox" id="multi-enabled"/> Vẽ nhiều đồ thị trên một hình</label><div id="curves-editor" hidden></div><button class="secondary small" id="add-curve" hidden>+ Thêm hàm số</button></div>
    <div id="table-section" hidden><div class="segmented"><button id="auto-table" class="selected">Từ công thức</button><button id="manual-table">Tùy chỉnh từng ô</button></div><p class="hint" id="table-hint">Các mốc và dấu được phân tích tự động.</p><div id="table-editor"></div><div class="table-actions"><button class="secondary small" id="add-point">${icon('plus')} Thêm mốc</button></div><div id="table-warning" class="notice" hidden></div></div>
    <div id="inequality-section" hidden><p class="hint">Nhập mỗi dòng một bất phương trình. Dùng &lt;, &gt;, &lt;=, &gt;= hoặc ≤, ≥. Ví dụ: <code>2x + y &lt;= 4</code>.</p><label class="check"><input type="checkbox" id="showIntersections"/> Hiển thị tọa độ giao điểm</label><p class="hint">Giao điểm các đường biên đang bật, kể cả ngoài miền nghiệm chung.</p><div id="inequality-editor"></div><button class="secondary small" id="add-inequality">+ Thêm bất phương trình</button><button class="primary generate" id="inequality-update">${icon('wand-sparkles')} Vẽ miền nghiệm</button><button class="secondary generate" id="reverse-region" aria-pressed="false">⇄ Reverse · Đảo vùng gạch</button><p class="hint" id="region-hint">Vùng trắng là miền nghiệm chung. Nét liền: ≤, ≥; nét đứt: &lt;, &gt;.</p></div>
    <div id="tree-section" hidden><label class="field-label" for="tree-input">Nút và nhánh</label><textarea id="tree-input" rows="12" spellcheck="false">${state.tree}</textarea><p class="hint">Mỗi cấp thụt 2 dấu cách.<br><code>Tên nút | nhãn nhánh</code><br>Tối đa 31 nút, 6 cấp.</p><button class="primary generate" id="tree-update">${icon('wand-sparkles')} Cập nhật sơ đồ</button></div>
    <details class="settings"><summary>Tùy chỉnh trình bày ${icon('sliders-horizontal')}</summary><div class="settings-content"><label class="field-label" for="figure-title">Tiêu đề hình <span>Không bắt buộc</span></label><input id="figure-title" maxlength="100" placeholder="Ví dụ: Khảo sát hàm số"/><div id="axis-settings"><div class="axis-grid"><label>x nhỏ nhất<input type="number" id="xmin" value="-4" step="any"/></label><label>x lớn nhất<input type="number" id="xmax" value="4" step="any"/></label><label>y nhỏ nhất<input type="number" id="ymin" value="-4" step="any"/></label><label>y lớn nhất<input type="number" id="ymax" value="6" step="any"/></label></div><label class="check"><input type="checkbox" id="showGrid" checked/> Lưới tọa độ</label><label class="check"><input type="checkbox" id="showPoints" checked/> Đánh dấu điểm dừng</label></div><div class="color-row"><span>Màu nét vẽ</span><div class="swatches">${['#2755df','#188779','#9b51bd','#d06b38','#24334b'].map((c,i)=>`<button data-color="${c}" style="--swatch:${c}" class="swatch ${i===0?'selected':''}" aria-label="Màu ${c}"></button>`).join('')}<input type="color" id="custom-color" value="#2755df" aria-label="Chọn màu khác"/></div></div></div></details>
  </section>
  <section class="result-panel"><div class="result-toolbar"><div class="preview-tabs"><button id="preview-tab" class="selected">${icon('eye')} Bản xem trước</button><button id="illustrate" hidden>${icon('chart-spline')} Phác họa</button><button id="code-tab">${icon('code-xml')} Mã Typst</button></div><div class="paper-label">${icon('scan-line')} VECTOR · SẮC NÉT MỌI KÍCH THƯỚC</div></div><div class="canvas-area"><div class="canvas-topline"><span id="figure-label">HÌNH 01 / ĐỒ THỊ HÀM SỐ</span><div class="zoom-tools"><button id="zoom-out" aria-label="Thu nhỏ">−</button><span id="zoom-label">100%</span><button id="home-view" aria-label="Đưa khung nhìn về ban đầu" title="Khung nhìn ban đầu">⌂</button><button id="zoom-in" aria-label="Phóng to">+</button></div></div><div id="preview-sizing" class="preview-sizing"><label for="preview-size">Kích thước khung</label><input type="range" id="preview-size" min="40" max="150" value="50" step="5"/><output id="preview-size-label" for="preview-size">50%</output><button class="text-button" id="fit-preview">Vừa màn hình</button></div><div id="error" role="alert" hidden></div><div id="preview-wrap"><div class="paper" id="preview"></div></div><div id="code-wrap" hidden><div class="code-heading"><span>figure.typ</span><button class="secondary small" id="copy-code">${icon('copy')} Sao chép</button></div><pre><code id="source"></code></pre></div><div class="canvas-note">${icon('check-check')} <span id="preview-note">Xem trước tức thì · Hình xuất luôn có nền trắng</span></div></div>
  <div class="export-bar"><div><strong>Sẵn sàng đưa vào bài giảng</strong><p>Biên dịch ngay tại đây · Không cần tài khoản.</p></div><div class="export-actions"><select id="format" aria-label="Định dạng xuất"><option value="pdf">PDF · Typst trực tiếp</option><option value="svg">SVG · vector</option><option value="png" selected>PNG · 3×</option><option value="typ">Typst · mã nguồn</option></select><button class="primary" id="download">${icon('download')} Tải xuống</button></div></div><p id="export-status" class="hint" role="status" aria-live="polite" style="padding:0 24px">PNG độ phân giải 3× · Nền trắng, sẵn sàng chèn vào bài giảng.</p><div class="project-actions"><button class="text-button" id="save-project">${icon('save')} Lưu dự án</button><button class="text-button" id="load-project">${icon('folder-open')} Mở dự án</button><input type="file" id="project-file" accept=".json" hidden/><span id="size-label">900 × 540</span></div></section></div>
  <footer><span><b>CHĐ Math Studio</b> &nbsp; / &nbsp; Dành cho người dạy Toán.</span><span>Thiết kế bởi Chân Đức.</span></footer></main></div>
  <dialog id="github-dialog"><form method="dialog" class="dialog-head"><div><span class="eyebrow">BIÊN DỊCH TRỰC TUYẾN</span><h2>Xuất bản với Typst</h2></div><button class="icon-button" aria-label="Đóng">${icon('x')}</button></form><p>GitHub Actions biên dịch hình hiện tại thành <b>PDF, PNG và SVG</b>. Sau khi hoàn thành, tải gói kết quả tại trang lần chạy.</p><div class="notice">Tùy chọn nâng cao dành cho chủ repository. Người dùng thông thường chọn PDF ở nút tải xuống. Token chỉ giữ trong bộ nhớ trang, không được lưu vào dự án.</div><label class="field-label" for="repo">Repository GitHub</label><input id="repo" placeholder="tai-khoan/math-typst-studio"/><label class="field-label" for="branch">Nhánh</label><input id="branch" value="main"/><label class="field-label" for="token">Fine-grained token · Actions: read and write</label><input id="token" type="password" autocomplete="off" placeholder="github_pat_…"/><p class="hint">Chế độ này dành cho repository của bạn. Dịch vụ công cộng có thể dùng máy chủ trung gian đi kèm dự án.</p><button class="primary generate" id="compile">${icon('play')} Biên dịch hình hiện tại</button><div id="compile-status" role="status" aria-live="polite"></div><a id="run-link" target="_blank" rel="noopener" hidden>Xem kết quả và tải tệp trên GitHub ↗</a></dialog>
  <dialog id="help-dialog"><form method="dialog" class="dialog-head"><h2>Từ công thức đến hình vẽ</h2><button class="icon-button" aria-label="Đóng">${icon('x')}</button></form><ol><li><b>Chọn loại hình.</b> Nhập công thức hoặc chọn một mẫu.</li><li><b>Chỉnh hình.</b> Kéo đồ thị để rê khung nhìn, cuộn để thu/phóng theo con trỏ; nút ⌂ đưa về khung ban đầu. Có thể dùng phím mũi tên khi chọn đồ thị.</li><li><b>Bảng biến thiên.</b> Tự động cho đa thức bậc ≤ 4, phân thức bậc nhất/bậc nhất, exp(x), ln(x), sqrt(x). Các dạng khác dùng chế độ tùy chỉnh.</li><li><b>Sửa từng ô.</b> Bấm giá trị hoặc dấu trực tiếp trên bảng; bấm ⋮ để ngắt dòng y.  Nhập x, y; chọn dấu y′ và ký hiệu tại mốc. Với ||, nhập riêng giới hạn trái/phải. Phân số dùng 1/2, căn dùng sqrt(2); ký hiệu tự do vẫn hiển thị nguyên văn.</li><li><b>Bảng tùy chỉnh riêng.</b> Mở tab Bảng biến thiên tùy chỉnh để soạn bảng độc lập; Phác họa nằm cạnh Bản xem trước. Tab Bảng biến thiên vẫn có Tùy chỉnh từng ô.</li><li><b>Nhiều đồ thị.</b> Bật Vẽ nhiều đồ thị trên một hình, thêm tối đa 5 hàm bên cạnh hàm chính; chọn màu và ẩn/hiện từng hàm. Hai trục luôn cùng đơn vị, khung vẽ thay đổi theo miền tọa độ.</li><li><b>Miền nghiệm hệ BPT.</b> Nhập tối đa 8 bất phương trình bậc nhất theo x, y, bật/tắt từng dòng. Vùng trắng là giao các miền nghiệm; Reverse đổi sang gạch miền chung. Nét đứt không thuộc miền nghiệm. Chỉ phần trong khung tọa độ được hiển thị.</li><li><b>Kích thước khung.</b> Kéo thanh trượt để xem gọn hoặc rộng hơn; không thay đổi miền tọa độ hay kích thước tệp xuất.</li><li><b>Xuất hình.</b> SVG/PNG nhanh từ bản xem trước. Mã .typ là vector Typst thực. Chọn PDF để biên dịch Typst ngay trên trình duyệt, không cần đăng nhập. GitHub Actions là tùy chọn nâng cao.</li></ol><div class="notice">Bảng biến thiên không xác định duy nhất đồ thị. Phác họa từ bảng chỉ minh họa xu hướng, không phải phép khôi phục công thức hay tiệm cận chính xác. Đồ thị công thức được lấy mẫu số; hàm dao động rất nhanh có thể cần thu hẹp miền xem.</div><p>Dự án được lưu thành JSON ngay trên máy. Không tự động gửi công thức lên mạng.</p></dialog><div id="toast" role="status" aria-live="polite"></div>`;

function refreshIcons(){createIcons({icons,attrs:{'stroke-width':1.7}});}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3300);}
function syncOptions(){for(const k of ['xmin','xmax','ymin','ymax'])state.options[k]=Number($('#'+k).value);for(const k of ['showGrid','showPoints','showIntersections'])state.options[k]=$('#'+k).checked;state.options.title=$('#figure-title').value;}
function getProject(){return {version:1,mode:state.mode,tableTab:state.tableTab,inequalities:structuredClone(state.inequalities),reverse:state.reverse,multi:state.multi,curves:structuredClone(state.curves),formula:state.formula,table:structuredClone(state.table),tree:state.tree,options:{...state.options}};}
function renderEditor(){
  $('#auto-table').classList.toggle('selected',!state.manual);$('#manual-table').classList.toggle('selected',state.manual);
  $('#table-hint').textContent=state.manual?'Bấm trực tiếp ô trên hình để sửa, hoặc nhập bên dưới. Dấu ⋮ dùng để ngắt dòng y.':'Các mốc và dấu được phân tích tự động. Chọn tùy chỉnh để sửa.';
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
  $('#formula-section').hidden=['tree','illustration','custom','inequalities'].includes(state.mode);$('#table-section').hidden=!['variation','custom','illustration'].includes(state.mode);$('#tree-section').hidden=state.mode!=='tree';$('#axis-settings').hidden=!['graph','illustration','inequalities'].includes(state.mode);
  $$('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===(state.mode==='illustration'?state.tableTab:state.mode)));
  $('#inequality-section').hidden=state.mode!=='inequalities';$('#preview-sizing').hidden=!isPlot();$('#showPoints').closest('label').hidden=state.mode==='inequalities';
  $('#multi-section').hidden=state.mode!=='graph';$('#table-section .segmented').hidden=state.tableTab==='custom';$('#illustrate').hidden=!['variation','custom','illustration'].includes(state.mode);$('#illustrate').classList.toggle('selected',state.mode==='illustration');
  try{
    if(state.mode==='graph'||(state.mode==='variation'&&!state.manual)){
      const ex=expression(state.formula),t=autoVariation(ex);$('#derivative').textContent=`y′ = ${ex.diff}`;$('#function-kind').textContent=t?.kind||'Đồ thị theo công thức';$('#domain').textContent=t?`Tập xác định: ${t.domain}`:'Bảng tự động chưa hỗ trợ dạng này.';
      if(state.mode==='variation'){if(!t)throw new Error('Chưa hỗ trợ bảng tự động cho hàm này. Chọn “Tùy chỉnh từng ô” để nhập bảng.');state.table=t;renderEditor();}
    }
    const warnings=['variation','custom','illustration'].includes(state.mode)?tableWarnings(state.table):[];$('#table-warning').hidden=!warnings.length;$('#table-warning').textContent=warnings.join(' ');
    currentProject=getProject();lastScene=buildScene(currentProject);lastSource=toTypst(lastScene);$('#preview').innerHTML=toSVG(lastScene);$('#source').textContent=lastSource;
    $('#formula-typeset').innerHTML=formulaSVG('y = '+state.formula);
    installSceneControls();
    $('#zoom-label').textContent=isPlot()?Math.round(800/(state.options.xmax-state.options.xmin))+'%':zoom+'%';
    $('#preview-tab').classList.toggle('selected',!$('#preview-wrap').hidden&&state.mode!=='illustration');$('#error').hidden=true;$('#download').disabled=pdfBusy;$('#compile').disabled=busy;$('#size-label').textContent=`${Math.round(lastScene.width)} × ${Math.round(lastScene.height)}`;
    $('#figure-label').textContent={graph:'HÌNH 01 / ĐỒ THỊ HÀM SỐ',variation:'HÌNH 02 / BẢNG BIẾN THIÊN',custom:'BẢNG BIẾN THIÊN TÙY CHỈNH',inequalities:'MIỀN NGHIỆM / HỆ BẤT PHƯƠNG TRÌNH',tree:'HÌNH 03 / SƠ ĐỒ CÂY',illustration:'PHÁC HỌA / TỪ BẢNG BIẾN THIÊN'}[state.mode];
    $('#preview-note').textContent=state.mode==='illustration'?'Kéo để rê · Cuộn để thu/phóng · Chỉ minh họa xu hướng':state.mode==='inequalities'?(state.reverse?'Vùng gạch là miền nghiệm chung · Kéo để rê, cuộn để thu/phóng':'Vùng trắng là miền nghiệm chung · Kéo để rê, cuộn để thu/phóng'):state.mode==='graph'?'Hai trục cùng tỉ lệ 1:1 · Kéo để rê · Cuộn để thu/phóng':['variation','custom'].includes(state.mode)?'Bấm vào giá trị hoặc dấu trên bảng để chỉnh sửa':'Xem trước tức thì · Hình xuất luôn có nền trắng';
  }catch(err){lastScene=null;currentProject=null;lastSource='';$('#source').textContent='';$('#preview').innerHTML='<div class="empty-result">Chỉnh lại dữ liệu để tạo hình vẽ.</div>';$('#error').textContent=err.message;$('#error').hidden=false;$('#download').disabled=true;$('#compile').disabled=true;}
  refreshIcons();
}
function setMode(mode){
  if(['variation','custom','illustration'].includes(state.mode)){
    if(state.tableTab==='custom')state.customTable=structuredClone(state.table);
    else {state.standardTable=structuredClone(state.table);state.standardManual=state.manual;}
  }
  if(mode==='custom'||mode==='variation'){
    state.tableTab=mode;state.table=structuredClone(mode==='custom'?state.customTable:state.standardTable);state.manual=mode==='custom'||state.standardManual;
  }
  state.mode=mode;view(false);render();if(mode==='variation'||mode==='custom')renderEditor();
}
function isPlot(){return ['graph','inequalities','illustration'].includes(state.mode);}
function applyPreviewSize(){const paper=$('#preview');paper.style.setProperty('--paper-height',state.previewSize+'vh');if(isPlot())paper.style.width='100%';$('#preview-size').value=state.previewSize;$('#preview-size-label').textContent=state.previewSize+'%';}
function applyRange(range){if(!validRange(range))return;for(const [k,v] of Object.entries(range))$('#'+k).value=Number(v.toPrecision(12));render();}
function installSceneControls(){
  const paper=$('#preview');paper.style.setProperty('--scene-ratio',lastScene.width/lastScene.height);paper.classList.toggle('pannable',isPlot());applyPreviewSize();paper.classList.toggle('editable',['variation','custom'].includes(state.mode)&&state.manual);
  paper.tabIndex=isPlot()?0:-1;paper.setAttribute('aria-label',isPlot()?'Đồ thị tương tác: kéo, cuộn hoặc dùng phím mũi tên':'Hình vẽ');
  if(!['variation','custom'].includes(state.mode))return;
  for(const h of lastScene.hits||[]){
    const b=document.createElement('button');b.className='table-hit';b.dataset.key=h.key;b.setAttribute('aria-label',h.label);b.title=h.label;b.textContent=h.key==='split'?'⋮':'';
    Object.assign(b.style,{left:h.x/lastScene.width*100+'%',top:h.y/lastScene.height*100+'%',width:h.w/lastScene.width*100+'%',height:h.h/lastScene.height*100+'%'});
    b.onclick=()=>editCell(h);paper.append(b);
  }
}
function editCell(hit){
  let dialog=$('#cell-dialog');if(!dialog){document.body.insertAdjacentHTML('beforeend',`<dialog id="cell-dialog"><form id="cell-form"><h2 id="cell-heading"></h2><p class="hint">Sửa ô sẽ chuyển bảng sang chế độ tùy chỉnh.</p><input id="cell-value" maxlength="40" list="math-symbols" aria-label="Giá trị ô"/><select id="cell-choice" aria-label="Ký hiệu ô"></select><p class="hint">Nhập 1/2, sqrt(2), pi, −∞ hoặc +∞. Mũi tên cập nhật theo dấu và giá trị.</p><div class="cell-actions"><button type="button" class="secondary" id="cell-cancel">Hủy</button><button type="submit" class="primary">Áp dụng</button></div></form></dialog>`);dialog=$('#cell-dialog');$('#cell-cancel').onclick=()=>dialog.close();}
  const p=state.table.points[hit.index],choices={mark:['','0','||'],sign:['+','−','0','||'],split:['Liền','|| · Ngắt']}[hit.key];
  $('#cell-heading').textContent=hit.label;$('#cell-value').hidden=!!choices;$('#cell-choice').hidden=!choices;
  if(choices){$('#cell-choice').innerHTML=choices.map(v=>`<option value="${e(v)}">${e(v||'Trống')}</option>`).join('');$('#cell-choice').value=hit.key==='sign'?state.table.signs[hit.index]:hit.key==='split'?(p.split??(p.mark==='||'))?'|| · Ngắt':'Liền':p.mark;}
  else $('#cell-value').value=p[hit.key]??p.y;
  $('#cell-form').onsubmit=event=>{event.preventDefault();state.manual=true;if(hit.key==='sign')state.table.signs[hit.index]=$('#cell-choice').value;else if(hit.key==='split')p.split=$('#cell-choice').value!=='Liền';else p[hit.key]=choices?$('#cell-choice').value:$('#cell-value').value;dialog.close();renderEditor();render();};
  dialog.showModal();(choices?$('#cell-choice'):$('#cell-value')).focus();if(!choices)$('#cell-value').select();
}
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
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=lastScene.width*3;canvas.height=lastScene.height*3;const ctx=canvas.getContext('2d');ctx.scale(3,3);ctx.drawImage(image,0,0);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw new Error('Không thể tạo ảnh PNG.');download(blob,'figure.png','image/png');$('#export-status').textContent='PNG 3× đã sẵn sàng trong thư mục tải xuống.';}catch(err){toast(err.message);}finally{URL.revokeObjectURL(url);}
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
$('#illustrate').onclick=()=>{state.manual=true;state.mode='illustration';view(false);render();};
$('#tree-update').onclick=render;
$('#reset').onclick=()=>{if(state.mode==='inequalities'){state.inequalities=initialInequalities();state.reverse=false;renderInequalities();}state.manual=state.tableTab==='custom';state.table=initialTable();$('#formula').value='x^3 - 3*x + 1';$('#tree-input').value=initialTree;$('#figure-title').value='';for(const [k,v]of Object.entries({xmin:-4,xmax:4,ymin:-4,ymax:6}))$('#'+k).value=v;if(state.mode==='illustration')state.mode=state.tableTab;render();renderEditor();toast('Đã khôi phục mẫu.');};
for(const id of ['xmin','xmax','ymin','ymax','showGrid','showPoints','showIntersections','figure-title'])$('#'+id).onchange=render;
$('#figure-title').oninput=render;
function setColor(c){state.options.color=c;$$('[data-color]').forEach(b=>b.classList.toggle('selected',b.dataset.color===c));$('#custom-color').value=c;render();}
$$('[data-color]').forEach(b=>b.onclick=()=>setColor(b.dataset.color));$('#custom-color').oninput=event=>setColor(event.target.value);
function view(code){$('#preview-wrap').hidden=code;$('#code-wrap').hidden=!code;$('#code-tab').classList.toggle('selected',code);$('#preview-tab').classList.toggle('selected',!code&&state.mode!=='illustration');}
$('#code-tab').onclick=()=>view(true);$('#preview-tab').onclick=()=>{if(state.mode==='illustration'){state.mode=state.tableTab;render();renderEditor();}view(false);};
$('#copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(lastSource);toast('Đã sao chép mã Typst.');}catch{toast('Trình duyệt chặn sao chép. Bạn có thể tải tệp .typ.');}};
function changeZoom(d){if(isPlot()){applyRange(zoomRange(state.options,d>0?.8:1.25));return;}zoom=Math.max(50,Math.min(160,zoom+d));$('#preview').style.width=`${zoom}%`;$('#zoom-label').textContent=zoom+'%';}$('#home-view').onclick=()=>{applyRange({xmin:-4,xmax:4,ymin:-4,ymax:6});zoom=100;$('#preview').style.width='100%';$('#zoom-label').textContent='100%';};$('#zoom-in').onclick=()=>changeZoom(10);$('#zoom-out').onclick=()=>changeZoom(-10);
$('#download').onclick=exportImage;
$('#format').onchange=()=>{$('#export-status').textContent={png:'PNG độ phân giải 3× · Nền trắng, sẵn sàng chèn vào bài giảng.',pdf:'PDF vector bằng Typst trên thiết bị. Lần đầu tải bộ biên dịch khoảng 28 MB.',svg:'SVG vector · Sắc nét khi thay đổi kích thước.',typ:'Mã Typst tự chứa · Có thể chỉnh sửa và biên dịch tiếp.'}[$('#format').value];};
$('#save-project').onclick=()=>{if(!currentProject){toast('Sửa dữ liệu trước khi lưu.');return;}download(JSON.stringify(currentProject,null,2),'do-thi-project.json','application/json');};
$('#load-project').onclick=()=>$('#project-file').click();$('#project-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>50000)throw new Error('Tệp dự án tối đa 50 KB.');const p=JSON.parse(await file.text());buildScene(p);state.mode=p.mode;state.inequalities=p.inequalities||initialInequalities();state.reverse=p.reverse??false;renderInequalities();state.tableTab=p.mode==='custom'||p.tableTab==='custom'?'custom':'variation';state.manual=true;state.multi=!!p.multi;state.curves=p.curves||[];$('#multi-enabled').checked=state.multi;renderCurves();state.table=p.table||initialTable();$('#formula').value=p.formula||'x';$('#tree-input').value=p.tree||initialTree;Object.assign(state.options,p.options);for(const k of ['xmin','xmax','ymin','ymax'])$('#'+k).value=state.options[k];for(const k of ['showGrid','showPoints','showIntersections'])$('#'+k).checked=state.options[k];$('#figure-title').value=state.options.title;renderEditor();render();toast('Đã mở dự án.');}catch(err){toast(`Không mở được: ${err.message}`);}event.target.value='';};
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
// Keep pointer capture on the persistent paper while replacing only its children.
let drag=null,panFrame=0;
$('#preview').addEventListener('pointerdown',ev=>{
 if(!isPlot()||!lastScene?.plot||ev.button!==0||drag)return;
 const rect=$('#preview').getBoundingClientRect();
 drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,options:{...state.options},width:rect.width*lastScene.plot.width/lastScene.width,height:rect.height*lastScene.plot.height/lastScene.height};
 $('#preview').setPointerCapture(ev.pointerId);$('#preview').classList.add('dragging');ev.preventDefault();
});
$('#preview').addEventListener('pointermove',ev=>{
 if(!drag||ev.pointerId!==drag.id)return;
 const range=panRange(drag.options,ev.clientX-drag.x,ev.clientY-drag.y,drag.width,drag.height);
 cancelAnimationFrame(panFrame);panFrame=requestAnimationFrame(()=>applyRange(range));
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('#preview').addEventListener(name,()=>{drag=null;$('#preview').classList.remove('dragging');});
$('#preview').addEventListener('wheel',ev=>{
 if(!isPlot()||!lastScene?.plot)return;ev.preventDefault();const r=$('#preview').getBoundingClientRect(),o=state.options;
 const p=lastScene.plot,px=r.width/lastScene.width,py=r.height/lastScene.height;const u=Math.max(0,Math.min(1,(ev.clientX-r.left-p.left*px)/(p.width*px))),v=Math.max(0,Math.min(1,(ev.clientY-r.top-p.top*py)/(p.height*py)));
 applyRange(zoomRange(o,ev.deltaY>0?1.12:1/1.12,o.xmin+u*(o.xmax-o.xmin),o.ymax-v*(o.ymax-o.ymin)));
},{passive:false});
$('#preview').addEventListener('keydown',ev=>{
 if(!isPlot()||!lastScene?.plot)return;const deltas={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
 if(deltas[ev.key]){ev.preventDefault();applyRange(panRange(state.options,...deltas[ev.key],lastScene.plot.width,lastScene.plot.height));}
 if(ev.key==='Home'){ev.preventDefault();$('#home-view').click();}
});
function renderCurves(){
 $('#curves-editor').hidden=!state.multi;$('#add-curve').hidden=!state.multi;$('#add-curve').disabled=state.curves.length>=5;
 $('#curves-editor').innerHTML=state.curves.map((c,i)=>`<div class="curve-row"><label class="check"><input type="checkbox" data-curve-enabled="${i}" ${c.enabled!==false?'checked':''}/> Hàm ${i+2}</label><input type="color" data-curve-color="${i}" value="${e(c.color)}" aria-label="Màu hàm ${i+2}"/><button type="button" data-curve-remove="${i}" aria-label="Xóa hàm ${i+2}">×</button><input class="curve-formula" data-curve-formula="${i}" value="${e(c.formula)}" maxlength="240" aria-label="Công thức hàm ${i+2}" placeholder="Ví dụ: sin(x)"/></div>`).join('');
 $$('[data-curve-formula]').forEach(el=>el.onchange=()=>{state.curves[+el.dataset.curveFormula].formula=el.value;render();});
 $$('[data-curve-enabled]').forEach(el=>el.onchange=()=>{state.curves[+el.dataset.curveEnabled].enabled=el.checked;render();});
 $$('[data-curve-color]').forEach(el=>el.oninput=()=>{state.curves[+el.dataset.curveColor].color=el.value;render();});
 $$('[data-curve-remove]').forEach(el=>el.onclick=()=>{state.curves.splice(+el.dataset.curveRemove,1);renderCurves();render();});
}
$('#multi-enabled').onchange=event=>{state.multi=event.target.checked;renderCurves();render();};
$('#add-curve').onclick=()=>{if(state.curves.length>=5)return;state.curves.push({formula:'sin(x)',color:['#d06b38','#188779','#9b51bd','#db3f6b','#566573'][state.curves.length],enabled:true});renderCurves();render();};
renderCurves();

function renderInequalities(){
 clearTimeout(debounce);
 $('#inequality-editor').innerHTML=state.inequalities.map((c,i)=>`<div class="curve-row"><label class="check"><input type="checkbox" data-bpt-enabled="${i}" ${c.enabled!==false?'checked':''}/> BPT ${i+1}</label><input type="color" data-bpt-color="${i}" value="${e(c.color)}" aria-label="Màu BPT ${i+1}"/><button type="button" data-bpt-remove="${i}" aria-label="Xóa BPT ${i+1}" ${state.inequalities.length===1?'disabled':''}>×</button><input class="curve-formula" data-bpt-formula="${i}" value="${e(c.formula)}" maxlength="160" aria-label="Bất phương trình ${i+1}" placeholder="2x + y <= 4"/><div class="bpt-typeset" data-bpt-preview="${i}">${formulaSVG(c.formula,19)}</div></div>`).join('');
 $('#add-inequality').disabled=state.inequalities.length>=8;
 $('#reverse-region').setAttribute('aria-pressed',String(state.reverse));
 $('#region-hint').textContent=(state.reverse?'Vùng gạch là miền nghiệm chung.':'Vùng trắng là miền nghiệm chung.')+' Nét liền: ≤, ≥; nét đứt: <, >. Chỉ xét các BPT đang bật.';
 $$('[data-bpt-formula]').forEach(el=>el.oninput=()=>{state.inequalities[+el.dataset.bptFormula].formula=el.value;clearTimeout(debounce);debounce=setTimeout(()=>{$(`[data-bpt-preview="${el.dataset.bptFormula}"]`).innerHTML=formulaSVG(el.value,19);render();},350);});
 $$('[data-bpt-enabled]').forEach(el=>el.onchange=()=>{state.inequalities[+el.dataset.bptEnabled].enabled=el.checked;render();});
 $$('[data-bpt-color]').forEach(el=>el.oninput=()=>{state.inequalities[+el.dataset.bptColor].color=el.value;render();});
 $$('[data-bpt-remove]').forEach(el=>el.onclick=()=>{if(state.inequalities.length<=1)return;clearTimeout(debounce);state.inequalities.splice(+el.dataset.bptRemove,1);renderInequalities();render();});
}
$('#add-inequality').onclick=()=>{if(state.inequalities.length>=8)return;state.inequalities.push({formula:'x - y < 2',color:['#2755df','#188779','#d06b38','#9b51bd','#db3f6b','#566573','#138ca5','#a18320'][state.inequalities.length],enabled:true});renderInequalities();render();};
$('#inequality-update').onclick=render;
$('#reverse-region').onclick=()=>{state.reverse=!state.reverse;renderInequalities();render();};
$('#preview-size').oninput=event=>{state.previewSize=Number(event.target.value);applyPreviewSize();};
$('#fit-preview').onclick=()=>{state.previewSize=50;applyPreviewSize();};
renderInequalities();

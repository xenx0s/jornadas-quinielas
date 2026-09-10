(function() {
  if(typeof qrcode === 'undefined'){
    console.error('Librería QR no cargada. Asegúrate de incluir el script de qrcode en el HTML.');
    return;
  }
  
  const SYSTEMS = {
  const SYSTEMS = {
    '0T7D12': { name: '0 triples · 7 dobles al 12 · 7 columnas · 5,25€', cols: 7, nDobles: 7, nTriples: 0, guaranteeLevel: 12, price: '5,25 €', patternDobles: [['A','A','B','B','B','B','A'],['A','B','A','B','B','B','A'],['A','B','A','B','B','B','A'],['B','A','B','A','A','A','B'],['A','B','A','B','A','A','B'],['A','B','A','A','B','B','A'],['A','A','A','B','B','B','A']], patternTriples: [], garantias: { headers:['14','13','12','11','10'], rows:[{pct:'5,47 %', vals:['1-1','—','0-1','0-2','0-3']},{pct:'38,28 %', vals:['—','1-2','0-2','0-2','0-4']},{pct:'100,00 %', vals:['—','—','1-3','1-4','0-3']}] } },
    '1T6D12': { name: '1 triple · 6 dobles al 12 · 8 columnas · 6€', cols: 8, nDobles: 6, nTriples: 1, guaranteeLevel: 12, price: '6 €', patternDobles: [['A','B','B','A','A','B','A','B'],['A','B','A','A','B','A','B','B'],['A','A','B','B','B','A','A','B'],['A','A','A','B','A','B','B','B'],['A','A','A','A','B','B','B','B'],['A','A','A','A','B','B','B','B']], patternTriples: [['A','B','C','B','A','B','C','A']], garantias: { headers:['14','13','12','11','10'], rows:[{pct:'4,17 %', vals:['1-1','0-0','0-1','2-3','0-1']},{pct:'35,42 %', vals:['—','1-2','0-2','0-2','0-6']},{pct:'100,00 %', vals:['—','—','1-3','2-3','0-4']}] } },
    '8D1T11': { name: '8 dobles · 1 triple al 11 · 8 columnas · 6€', cols: 8, nDobles: 8, nTriples: 1, guaranteeLevel: 11, price: '6 €', patternDobles: [['A','B','B','A','A','B','A','B'],['A','A','B','B','B','A','A','B'],['B','B','A','A','A','B','B','A'],['A','A','B','B','B','A','A','B'],['B','B','A','A','B','A','A','B'],['B','A','A','B','A','B','A','B'],['B','A','A','B','A','B','A','B'],['B','A','A','B','A','B','A','B']], patternTriples: [['A','A','A','B','B','B','C','C']], garantias: { type: 'stats', stats: [{ value:'100 %', label:'Entre 1 y 3 premios de 11', color:'gold' },{ value:'50 %', label:'Opción de llegar al 12', color:'blue' },{ value:'11,46 %', label:'Opción de enganchar el 13', color:'pink' },{ value:'1,04 %', label:'Opción de reventar con el 14', color:'red' }] } },
    '1T9D11': { name: '1 triple · 9 dobles al 11 · 12 columnas · 9€', cols: 12, nDobles: 9, nTriples: 1, guaranteeLevel: 11, price: '9 €', patternDobles: [['A','A','B','B','A','A','B','B','A','A','B','B'],['A','B','A','B','A','B','A','B','A','B','A','B'],['A','B','B','A','A','B','A','B','A','B','B','A'],['B','A','A','B','B','A','A','B','A','B','B','A'],['A','B','A','B','B','A','A','B','B','A','B','A'],['B','A','A','B','A','B','A','B','B','A','B','A'],['A','B','A','B','A','B','B','A','A','B','B','A'],['A','B','A','B','A','B','B','A','A','B','B','A'],['A','B','A','B','A','B','B','A','A','B','B','B']], patternTriples: [['A','A','A','A','B','B','B','B','C','C','C','C']], garantias: { headers:['14','13','12','11','10'], rows:[{pct:'0,78 %', vals:['1-1','0-0','0-0','0-2','1-1']},{pct:'9,38 %', vals:['—','1-1','0-2','0-1','0-4']},{pct:'45,44 %', vals:['—','—','1-2','0-4','0-3']},{pct:'100,00 %', vals:['—','—','—','1-4','2-4']}] } }
  };

  const JORNADAS = {};
  const JORNADAS_URL = 'https://raw.githubusercontent.com/xenx0s/jornadas-quinielas/main/jornadas.json';

  function loadRemoteJornadas(){
    if(!JORNADAS_URL || JORNADAS_URL.indexOf('TU-USUARIO') !== -1) return;
    fetch(JORNADAS_URL + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function(res){
        if(!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data){
        if(!data || typeof data !== 'object') return;
        Object.keys(data).forEach(function(key){
          const j = data[key];
          if(j && j.name && Array.isArray(j.partidos) && j.partidos.length === 14){
            JORNADAS[key] = j;
          }
        });
        populateJornadaSelect();
      })
      .catch(function(err){
        console.error('Error jornadas:', err);
      });
  }

  const N_MATCHES = 14;
  const DOBLE_MAP = { '1X':['1','X'], '12':['1','2'], 'X2':['X','2'] };
  const TRIPLE_MAP = { 'A':'1', 'B':'X', 'C':'2' };

  const state = {
    systemKey: '0T7D12',
    jornadaKey: '',
    tipos: [],
    signs: Array(14).fill('1'),
    doubleTypes: Array(14).fill('1X'),
    checks: Array(14).fill(''),
    plenoLocal: '0',
    plenoVisitante: '0',
  };

  function currentSystem(){ return SYSTEMS[state.systemKey]; }

  function matchLabel(i){
    const j = JORNADAS[state.jornadaKey];
    if(j && j.partidos && j.partidos[i]){
      return (i+1) + '. ' + j.partidos[i].local + ' - ' + j.partidos[i].visitante;
    }
    return 'Partido ' + (i+1);
  }

  function defaultTipos(sys){
    const t = Array(14).fill('fijo');
    let i = 0;
    for(let k=0; k<sys.nTriples; k++){ t[i]='triple'; i++; }
    for(let k=0; k<sys.nDobles; k++){ t[i]='doble'; i++; }
    return t;
  }

  function populateSystemSelect(){
    const sel = document.getElementById('systemSelect');
    if(!sel) return;
    sel.innerHTML = '';
    Object.keys(SYSTEMS).forEach(key=>{
      const o = document.createElement('option');
      o.value = key;
      o.textContent = SYSTEMS[key].name;
      if(key===state.systemKey) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', e=>{
      state.systemKey = e.target.value;
      state.tipos = defaultTipos(currentSystem());
      state.checks = Array(14).fill('');
      fullRender();
    });
  }

  function populateJornadaSelect(){
    const sel = document.getElementById('jornadaSelect');
    if(!sel) return;
    sel.innerHTML = '';
    const optNone = document.createElement('option');
    optNone.value = '';
    optNone.textContent = 'Jornada Nº —';
    if(state.jornadaKey==='') optNone.selected = true;
    sel.appendChild(optNone);
    Object.keys(JORNADAS).forEach(key=>{
      const o = document.createElement('option');
      o.value = key;
      o.textContent = JORNADAS[key].name;
      if(key===state.jornadaKey) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', e=>{
      state.jornadaKey = e.target.value;
      renderMatches();
      updatePleno15Label();
    });
  }

  function updateSubtitle() {
    const sys = currentSystem();
    const sub = document.getElementById("subtitleText");
    const hint = document.getElementById("matchesHint");
    if (sub) {
      sub.innerHTML = sys.nTriples
        ? '<span style="color:#5B9BD5 !important;font-weight:700;">' + sys.nTriples + " triple" + (sys.nTriples > 1 ? "s" : "") + '</span> · <span style="color:#48E500 !important;font-weight:700;">' + sys.nDobles + " dobles" + '</span> · garantía mínima de ' + sys.guaranteeLevel + " aciertos · " + sys.price + " €"
        : '<span style="color:#48E500 !important;font-weight:700;">' + sys.nDobles + " dobles" + '</span> · garantía mínima de ' + sys.guaranteeLevel + " aciertos · " + sys.price + " €";
    }
    if (hint) {
      hint.textContent = "Marca cada partido como Fijo, Doble" + (sys.nTriples ? " o Triple" : "") + ". Esta reducción necesita exactamente " + sys.nDobles + " dobles" + (sys.nTriples ? " y " + sys.nTriples + " triple" : "") + ".";
    }
  }

  function updateCounters(){
    const sys = currentSystem();
    const nD = state.tipos.filter(t=>t==='doble').length;
    const nT = state.tipos.filter(t=>t==='triple').length;
    const wrap = document.getElementById('countersWrap');
    if(!wrap) return;
    wrap.innerHTML = '';
    const dC = document.createElement('span');
    dC.className = 'counter ' + (nD===sys.nDobles ? 'ok':'bad');
    dC.textContent = 'Dobles: ' + nD + '/' + sys.nDobles;
    wrap.appendChild(dC);
    if (sys.nTriples > 0) {
      const tC = document.createElement("span");
      tC.className = "counter " + (nT === sys.nTriples ? "triple-ok" : "bad");
      tC.textContent = "Triples " + nT + "/" + sys.nTriples;
      wrap.appendChild(tC);
    }
  }

  function renderMatches(){
    const sys = currentSystem();
    const grid = document.getElementById('matchesGrid');
    if(!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<14; i++){
      const card = document.createElement('div');
      card.className = 'match-card' + (state.tipos[i]==='doble' ? ' is-doble' : '') + (state.tipos[i]==='triple' ? ' is-triple' : '');
      const head = document.createElement('div');
      head.className = 'match-card-head';
      const no = document.createElement('span');
      no.className = 'no';
      no.textContent = matchLabel(i);
      no.title = matchLabel(i);
      const toggle = document.createElement('div');
      toggle.className = 'toggle';
      const btnFijo = document.createElement('button');
      btnFijo.type = 'button';
      btnFijo.textContent = 'FIJO';
      btnFijo.className = state.tipos[i]==='fijo' ? 'active' : '';
      btnFijo.addEventListener('click', ()=>{ state.tipos[i]='fijo'; fullRender(); });
      const btnDoble = document.createElement('button');
      btnDoble.type = 'button';
      btnDoble.textContent = 'DOBLE';
      btnDoble.className = state.tipos[i]==='doble' ? 'active' : '';
      btnDoble.addEventListener('click', ()=>{ state.tipos[i]='doble'; fullRender(); });
      toggle.appendChild(btnFijo);
      toggle.appendChild(btnDoble);
      if(sys.nTriples>0){
        const btnTriple = document.createElement('button');
        btnTriple.type = 'button';
        btnTriple.textContent = 'TRIPLE';
        btnTriple.className = state.tipos[i]==='triple' ? 'active triple-active' : '';
        btnTriple.addEventListener('click', ()=>{ state.tipos[i]='triple'; fullRender(); });
        toggle.appendChild(btnTriple);
      }
      head.appendChild(no);
      head.appendChild(toggle);
      card.appendChild(head);
      if(state.tipos[i]==='fijo'){
        const sel = document.createElement('select');
        [['1','1'],['X','X'],['2','2']].forEach(([v,t])=>{
          const o = document.createElement('option');
          o.value=v; o.textContent=t;
          if(v===state.signs[i]) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener('change', e=>{ state.signs[i]=e.target.value; renderBoleto(); });
        card.appendChild(sel);
      } else if(state.tipos[i]==='doble'){
        const sel = document.createElement('select');
        [['1X','1X'],['12','12'],['X2','X2']].forEach(([v,t])=>{
          const o = document.createElement('option');
          o.value=v; o.textContent=t;
          if(v===state.doubleTypes[i]) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener('change', e=>{ state.doubleTypes[i]=e.target.value; renderBoleto(); });
        card.appendChild(sel);
      } else {
        const badge = document.createElement('span');
        badge.className = 'triple-badge';
        badge.textContent = '1 · X · 2';
        card.appendChild(badge);
      }
      grid.appendChild(card);
    }
    updateCounters();
    renderBoleto();
    renderCheckGrid();
  }

  function renderCheckGrid(){
    const cGrid = document.getElementById('checkGrid');
    if(!cGrid) return;
    cGrid.innerHTML = '';
    for(let i=0; i<14; i++){
      const wrap = document.createElement('div');
      wrap.className = 'check-cell';
      const label = document.createElement('label');
      label.textContent = matchLabel(i);
      const sel = document.createElement('select');
      [['','—'],['1','1'],['X','X'],['2','2']].forEach(([v,t])=>{
        const o = document.createElement('option');
        o.value=v; o.textContent=t;
        if(v===state.checks[i]) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', e=>{ state.checks[i]=e.target.value; });
      wrap.appendChild(label);
      wrap.appendChild(sel);
      cGrid.appendChild(wrap);
    }
  }

  function getOrders(){
    const dobleOrder = [], tripleOrder = [];
    for(let i=0; i<14; i++){
      if(state.tipos[i]==='doble') dobleOrder.push(i);
      if(state.tipos[i]==='triple') tripleOrder.push(i);
    }
    return { dobleOrder, tripleOrder };
  }

  function signFor(row, col, orders){
    const sys = currentSystem();
    const tipo = state.tipos[row];
    if(tipo==='doble' && sys.patternDobles.length){
      const idx = orders.dobleOrder.indexOf(row) % sys.patternDobles.length;
      const ab = sys.patternDobles[idx][col];
      const pair = DOBLE_MAP[state.doubleTypes[row]];
      return { sign: ab==='A' ? pair[0] : pair[1], kind:'doble' };
    }
    if(tipo==='triple' && sys.patternTriples.length){
      const idx = orders.tripleOrder.indexOf(row) % sys.patternTriples.length;
      const abc = sys.patternTriples[idx][col];
      return { sign: TRIPLE_MAP[abc], kind:'triple' };
    }
    return { sign: state.signs[row], kind:'fijo' };
  }

  function renderBoleto(hits){
    const sys = currentSystem();
    const orders = getOrders();
    const table = document.getElementById('boletoTable');
    if(!table) return;
    table.innerHTML = '';
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    trh.innerHTML = '<th class="col-n">Nº</th>' + Array.from({length:sys.cols},(_,c)=>'<th>'+String(c+1).padStart(2,'0')+'</th>').join('');
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for(let r=0; r<14; r++){
      const tr = document.createElement('tr');
      let rowHtml = '<td class="match-no">'+String(r+1).padStart(2,'0')+'</td>';
      for(let c=0; c<sys.cols; c++){
        const {sign,kind} = signFor(r,c,orders);
        let cls = 'sign' + (kind!=='fijo' ? ' '+kind : '');
        if(hits){
          const real = state.checks[r];
          if(real){ cls += (real===sign ? ' hit' : ' miss'); }
        }
        rowHtml += '<td class="'+cls+'">'+sign+'</td>';
      }
      tr.innerHTML = rowHtml;
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    if(hits){
      const tfoot = document.createElement('tfoot');
      const tr = document.createElement('tr');
      const max = Math.max(...hits);
      let rowHtml = '<td class="label">Aciertos</td>';
      hits.forEach(h=>{ rowHtml += '<td class="'+(h===max?'best':'')+'">'+h+'/14</td>'; });
      tr.innerHTML = rowHtml;
      tfoot.appendChild(tr);
      table.appendChild(tfoot);
    }
  }

  function renderRefTable(){
    const sys = currentSystem();
    const t = document.getElementById('refTable');
    const note = document.getElementById('refNote');
    if(!t) return;
    t.innerHTML = '';
    t.style.display = '';
    if(sys.garantias.type === 'stats'){
      t.style.display = 'none';
      let statsGrid = document.getElementById('refStatsGrid');
      if(!statsGrid){
        statsGrid = document.createElement('div');
        statsGrid.id = 'refStatsGrid';
        statsGrid.className = 'stats-grid';
        t.parentNode.insertBefore(statsGrid, t);
      }
      statsGrid.style.display = '';
      statsGrid.innerHTML = '';
      sys.garantias.stats.forEach(s=>{
        const card = document.createElement('div');
        card.className = 'stat-card c-' + (s.color || 'gold');
        card.innerHTML = '<div class="stat-value">'+s.value+'</div><div class="stat-label">'+s.label+'</div>';
        statsGrid.appendChild(card);
      });
      if(note){
        note.textContent = 'Lectura: el '+sys.garantias.stats[0].value+' es la garantía dura. Válido con '+sys.nDobles+' dobles'+(sys.nTriples? ' y '+sys.nTriples+' triple':'')+'.';
      }
      return;
    }
    const existingStatsGrid = document.getElementById('refStatsGrid');
    if(existingStatsGrid) existingStatsGrid.style.display = 'none';
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    trh.innerHTML = '<th class="pct">Porcentaje</th>' + sys.garantias.headers.map(h=>'<th>'+h+'</th>').join('');
    thead.appendChild(trh);
    t.appendChild(thead);
    const tbody = document.createElement('tbody');
    sys.garantias.rows.forEach(row=>{
      const tr = document.createElement('tr');
      tr.innerHTML = '<td class="pct">'+row.pct+'</td>' + row.vals.map(v=>'<td>'+v+'</td>').join('');
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    if(note){
      note.textContent = 'Lectura: en el 100% de los casos, al menos una columna acierta el rango de la fila "'+sys.guaranteeLevel+'" de 14.';
    }
  }

  const calcBtn = document.getElementById('calcBtn');
  if(calcBtn){
    calcBtn.type = 'button';
    calcBtn.addEventListener('click', ()=>{
      const sys = currentSystem();
      const orders = getOrders();
      const anyFilled = state.checks.some(v=>v);
      if(!anyFilled){ renderBoleto(); return; }
      const hits = Array(sys.cols).fill(0);
      for(let r=0; r<14; r++){
        const real = state.checks[r];
        if(!real) continue;
        for(let c=0; c<sys.cols; c++){
          const {sign} = signFor(r,c,orders);
          if(sign===real) hits[c]++;
        }
      }
      renderBoleto(hits);
    });
  }

  function flashMsg(text){
    const el = document.getElementById('saveMsg');
    if(!el) return;
    el.textContent = text;
    setTimeout(()=>{ if(el.textContent===text) el.textContent=''; }, 3000);
  }

  function wireSaveLoad(){
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const loadInput = document.getElementById('loadInput');
    if(saveBtn){
      saveBtn.addEventListener('click', ()=>{
        const payload = { app: 'quiniela-reductorq', version: 1, savedAt: new Date().toISOString(), systemKey: state.systemKey, jornadaKey: state.jornadaKey, tipos: state.tipos, signs: state.signs, doubleTypes: state.doubleTypes, checks: state.checks, plenoLocal: state.plenoLocal, plenoVisitante: state.plenoVisitante };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pronostico-quiniela-' + new Date().toISOString().slice(0,10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        flashMsg('Pronóstico guardado ✓');
      });
    }
    if(loadBtn && loadInput){
      loadBtn.addEventListener('click', ()=> loadInput.click());
      loadInput.addEventListener('change', (e)=>{
        const file = e.target.files && e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev)=>{
          try{
            const data = JSON.parse(ev.target.result);
            if(!data || !data.systemKey || !SYSTEMS[data.systemKey]) throw new Error('Archivo no reconocido');
            state.systemKey = data.systemKey;
            state.jornadaKey = (typeof data.jornadaKey === 'string' && JORNADAS[data.jornadaKey]) ? data.jornadaKey : '';
            const n = 14;
            state.tipos = Array.isArray(data.tipos) && data.tipos.length===n ? data.tipos : defaultTipos(currentSystem());
            state.signs = Array.isArray(data.signs) && data.signs.length===n ? data.signs : Array(n).fill('1');
            state.doubleTypes = Array.isArray(data.doubleTypes) && data.doubleTypes.length===n ? data.doubleTypes : Array(n).fill('1X');
            state.checks = Array.isArray(data.checks) && data.checks.length===n ? data.checks : Array(n).fill('');
            state.plenoLocal = ['0','1','2','M'].includes(data.plenoLocal) ? data.plenoLocal : '0';
            state.plenoVisitante = ['0','1','2','M'].includes(data.plenoVisitante) ? data.plenoVisitante : '0';
            fullRender();
            const jornadaSel = document.getElementById('jornadaSelect');
            if(jornadaSel) jornadaSel.value = state.jornadaKey;
            const localSel = document.getElementById('plenoLocal');
            const visSel = document.getElementById('plenoVisitante');
            if(localSel) localSel.value = state.plenoLocal;
            if(visSel) visSel.value = state.plenoVisitante;
            flashMsg('Pronóstico cargado ✓');
          }catch(err){
            flashMsg('No se pudo leer el archivo');
          } finally {
            loadInput.value = '';
          }
        };
        reader.readAsText(file);
      });
    }
  }

  function fullRender(){
    updateSubtitle();
    updateCounters();
    renderMatches();
    renderBoleto();
    renderRefTable();
    updatePleno15Label();
  }

  function updatePleno15Label(){
    const label = document.getElementById('pleno15Label');
    const localLabel = document.getElementById('plenoLocalLabel');
    const visitanteLabel = document.getElementById('plenoVisitanteLabel');
    if(!label || !localLabel || !visitanteLabel) return;
    const j = JORNADAS[state.jornadaKey];
    label.textContent = 'Pleno al 15';
    if(j && j.partido15){
      localLabel.textContent = j.partido15.local;
      visitanteLabel.textContent = j.partido15.visitante;
    } else {
      localLabel.textContent = 'Local';
      visitanteLabel.textContent = 'Visitante';
    }
  }

  function buildAdminLines(){
    const sys = currentSystem();
    const orders = getOrders();
    const lines = [];
    for(let col=0; col<sys.cols; col++){
      let signos = '';
      for(let r=0; r<14; r++){
        const {sign} = signFor(r, col, orders);
        signos += sign;
      }
      const jornadaNum = state.jornadaKey ? state.jornadaKey.replace('jornada-', 'J').toUpperCase() : 'X';
      const pleno15 = state.plenoLocal + '-' + state.plenoVisitante;
      lines.push('PRONÓSTICO;' + jornadaNum + ';' + signos + ';' + pleno15);
    }
    return lines;
  }

  function buildPrintHTML(){
    const sys = currentSystem();
    const lines = buildAdminLines();
    const text = lines.join('\n');
    const stamp = new Date().toLocaleDateString('es-ES');
    let qrHtml = '';
    try{
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      const qrDataUrl = qr.createDataURL(6, 4);
      qrHtml = '<img class="qr" src="' + qrDataUrl + '" alt="QR">';
    }catch(e){ qrHtml = ''; }
    let linesHtml = '';
    lines.forEach(function(line, i){
      linesHtml += '<div class="columna"><span class="numero">' + (i+1) + '</span> ' + line + '</div>';
    });
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pronóstico</title><style>body{font-family:Arial,sans-serif;padding:20px}.qr{width:160px;height:160px;float:right;margin:0 0 20px 20px}h1{font-size:18px;margin:0 0 10px}.meta{color:#555;font-size:12px;margin-bottom:15px}.columna{font-family:"Courier New",monospace;font-size:14px;padding:4px 0;border-bottom:1px solid #eee}.numero{font-weight:bold;color:#48e500;margin-right:10px}</style></head><body><h1>Pronóstico Quiniela</h1><div class="meta">Generado: '+stamp+'</div>'+qrHtml+'<div style="clear:both"></div><h2>Columnas ('+lines.length+')</h2>'+linesHtml+'</body></html>';
  }

  const printBtn = document.getElementById('printBtn');
  if(printBtn){
    printBtn.addEventListener('click', ()=>{
      const html = buildPrintHTML();
      const w = window.open('', '_blank');
      if(w){
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(()=>{ w.print(); }, 300);
      }
    });
  }

  const plenoLocal = document.getElementById('plenoLocal');
  const plenoVisitante = document.getElementById('plenoVisitante');
  if(plenoLocal){ plenoLocal.addEventListener('change', e=>{ state.plenoLocal = e.target.value; }); }
  if(plenoVisitante){ plenoVisitante.addEventListener('change', e=>{ state.plenoVisitante = e.target.value; }); }

  populateSystemSelect();
  populateJornadaSelect();
  state.tipos = defaultTipos(currentSystem());
  fullRender();
  wireSaveLoad();
  loadRemoteJornadas();
})();

/* ANP Puerto Lobos PWA - v0.9.0
   - Nombres de archivos ASCII (sin tildes) para evitar 404 en GitHub Pages
   - Router por hash (#) para que el refresh no rompa
   - Service Worker con cache versionado
*/
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

const STATE = {
  data: null,
  map: null,
  markers: []
};

function setActivePage(id){
  $$('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if(page) page.classList.add('active');
  // mapa: inicializar/ajustar cuando se entra
  if(id === 'puntos') {
    initMapOnce();
    setTimeout(()=>STATE.map && STATE.map.invalidateSize(), 180);
  }
  if(id === 'mareas') {
    renderMareasPage();
  }
}

function navTo(id){
  // usa hash para conservar estado y permitir link directo
  location.hash = `#${id}`;
}

function handleHash(){
  const id = (location.hash || '#home').replace('#','') || 'home';
  setActivePage(id);
}

function bindNav(){
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-nav]');
    if(!t) return;
    const dest = t.getAttribute('data-nav');
    if(dest) navTo(dest);
  });
  // accesibilidad con Enter en brand
  const brand = document.querySelector('.brand');
  brand && brand.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') navTo('home');
  });
  window.addEventListener('hashchange', handleHash);
}

// ===== Modals =====
function openModal(id){
  const m = document.getElementById(id);
  if(!m) return;
  // close others
  document.querySelectorAll('.modal[aria-hidden="false"]').forEach(x=>x.setAttribute('aria-hidden','true'));
  m.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}

function closeModal(id){
  const m = document.getElementById(id);
  if(!m) return;
  m.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}

function bindModals(){
  document.addEventListener('click', (e)=>{
    const open = e.target.closest('[data-open]');
    if(open){
      openModal(open.getAttribute('data-open'));
      return;
    }
    const close = e.target.closest('[data-close]');
    if(close){
      closeModal(close.getAttribute('data-close'));
    }
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key !== 'Escape') return;
    document.querySelectorAll('.modal[aria-hidden="false"]').forEach(x=>x.setAttribute('aria-hidden','true'));
    document.body.classList.remove('modal-open');
  });
}

function fmtPhone(n){
  if(!n) return '';
  // whatsapp / tel: sin espacios ni guiones
  return n.replace(/[^\d+]/g,'');
}

function renderEmergencias(){
  const wrap = $('#emerList');
  wrap.innerHTML = '';
  (STATE.data.emergencias || []).forEach(e=>{
    const tel = fmtPhone(e.numero);
    const alt = fmtPhone(e.alternativo);
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="t">${e.nombre}</div>
      <div class="m">
        <div>Oficial: <a href="tel:${tel}">${e.numero}</a></div>
        ${e.alternativo ? `<div>Alternativo: <a href="tel:${alt}">${e.alternativo}</a></div>` : ``}
      </div>
    `;
    wrap.appendChild(div);
  });
}

function renderFauna(){
  const wrap = $('#faunaList');
  wrap.innerHTML = '';
  (STATE.data.fauna || []).forEach(s=>{
    if(!s) return;
    // Compatibilidad: aceptar claves en español o inglés (evita "undefined")
    const nombre = s.nombre ?? s.name ?? 'Sin nombre';
    const cientifico = s.cientifico ?? s.scientific ?? s.nombre_cientifico ?? '';
    const descripcion = s.descripcion ?? s.description ?? '';
    const grupo = s.grupo ?? s.group ?? '-';
    const estado = s.estado ?? s.status ?? '-';
    const div = document.createElement('div');
    const img = s.imagen || s.image || 'images/placeholder.png';
    div.className = 'item item-media';
    div.innerHTML = `
      <div class="media-row">
        <img class="card-img" src="${img}" alt="${nombre}" loading="lazy" onerror="this.src='images/placeholder.png'">
        <div class="media-body">
          <div class="t">${nombre}${cientifico ? ` <span class="small" style="opacity:.9">(${cientifico})</span>` : ''}</div>
          <div class="m">${descripcion}</div>
          <div class="small" style="margin-top:6px">Grupo: ${grupo} · Estado: ${estado}${s.frecuencia ? " · Frecuencia: " + s.frecuencia : ""}</div>
        </div>
      </div>
    `;
    wrap.appendChild(div);
});
}

function renderChecklist(){
  const wrap = $('#checkList');
  wrap.innerHTML = '';
  (STATE.data.checklist || []).forEach(c=>{
    const id = `ck_${c.id}`;
    const div = document.createElement('label');
    div.className = 'item';
    div.style.display = 'block';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start">
        <input type="checkbox" id="${id}" style="margin-top:4px;transform:scale(1.2)">
        <div>
          <div class="t">${c.texto}</div>
          <div class="m">${c.categoria || ''}</div>
        </div>
      </div>
    `;
    wrap.appendChild(div);
  });
}

function renderPuntos(){
  const wrap = $('#puntosList');
  wrap.innerHTML = '';
  (STATE.data.puntosInteres || []).forEach(p=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="t">${p.nombre}</div>
      <div class="m">${p.tipo ? `${p.tipo} · ` : ''}${p.descripcion || ''}</div>
      <div class="small" style="margin-top:6px">${p.lat?.toFixed?.(4) ?? ''} ${p.lng?.toFixed?.(4) ?? ''}</div>
    `;
    wrap.appendChild(div);
  });
}

function initMapOnce(){
  if(STATE.map) return;
  const el = $('#map');
  if(!el) return;

  // Centro aproximado (placeholder)
  const pts = STATE.data.puntosInteres || [];
  const first = pts.find(p=>isFinite(p.lat) && isFinite(p.lng));
  const center = first ? [first.lat, first.lng] : [-41.0, -65.0];

  STATE.map = L.map(el, { zoomControl: true }).setView(center, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap'
  }).addTo(STATE.map);

  // markers
  pts.filter(p=>isFinite(p.lat) && isFinite(p.lng)).forEach(p=>{
    const m = L.marker([p.lat, p.lng]).addTo(STATE.map);
    m.bindPopup(`<b>${p.nombre}</b><br>${p.tipo || ''}`);
    STATE.markers.push(m);
  });

  if(STATE.markers.length){
    const group = new L.featureGroup(STATE.markers);
    STATE.map.fitBounds(group.getBounds().pad(0.2));
  }
}

function initTheme(){
  const KEY = 'anp_theme';
  const btn = $('#themeToggle');

  const apply = (mode)=>{
    // por ahora cambiamos solo el icono (UI ya es oscura)
    btn.textContent = (mode === 'light') ? '🌙' : '☀️';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(KEY, mode);
  };

  const saved = localStorage.getItem(KEY) || 'dark';
  apply(saved);

  btn.addEventListener('click', ()=>{
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    apply(current === 'dark' ? 'light' : 'dark');
  });
}

async function loadData(){
  const res = await fetch('data.json', {cache:'no-store'});
  if(!res.ok) throw new Error('No se pudo cargar data.json');
  STATE.data = await res.json();
  $('#versionLabel').textContent = `v${STATE.data.version || '0.8'} · Secretaría de Ambiente y Cambio Climático · Río Negro`;
}

function initServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./service-worker.js', { scope: './' })
    .catch(()=>{ /*silencio*/ });
}

async function boot(){
  try{
    bindNav();
    initTheme();
    bindModals();
    await loadData();
    renderEmergencias();
    renderFauna();
    renderChecklist();
    renderPuntos();
    handleHash();
    initServiceWorker();
  }catch(err){
    console.error(err);
    document.body.innerHTML = `<div style="padding:18px;font-family:system-ui;color:#fff">
      <b>Error cargando la app.</b><br/>
      <div style="opacity:.8;margin-top:8px">${String(err)}</div>
      <div style="opacity:.75;margin-top:10px">Tip: asegurate que exista <code>index.html</code> en la raíz y que los archivos NO tengan tildes.</div>
    </div>`;
  }
}
boot();


// ===== Mareas (SHN) =====
function fmtDateES(iso){
  try{
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }catch(e){ return iso; }
}

function getTidesForDate(iso){
  const m = STATE.data && STATE.data.mareas;
  return (m && m.datos && m.datos[iso]) ? m.datos[iso] : null;
}

function getNextTideEvent(iso){
  const events = getTidesForDate(iso);
  if(!events || !events.length) return null;
  const now = new Date();
  const d0 = new Date(iso + 'T00:00:00');
  const todayIso = now.toISOString().slice(0,10);
  // si es otro día, devolver el primero
  if(todayIso !== iso) return events[0];
  for(const ev of events){
    const t = ev.time.split(':');
    const dtEv = new Date(d0);
    dtEv.setHours(parseInt(t[0],10), parseInt(t[1],10), 0, 0);
    if(dtEv.getTime() >= now.getTime()) return ev;
  }
  return events[0]; // ya pasó todo: mostrar la primera del día (o podrías mostrar mañana)
}

function renderMareasHome(){
  const el = document.getElementById('marea-next-home');
  if(!el) return;
  const iso = new Date().toISOString().slice(0,10);
  const next = getNextTideEvent(iso);
  if(!next){
    el.textContent = 'Próxima marea: —';
    return;
  }
  el.textContent = `Próxima marea: ${next.time} · ${next.height_m.toFixed(2)} m`;
}

function renderMareasPage(){
  const isoToday = new Date().toISOString().slice(0,10);
  const input = document.getElementById('marea-date');
  if(input && !input.value) input.value = isoToday;

  const iso = (input && input.value) ? input.value : isoToday;

  const sub = document.getElementById('marea-today-sub');
  if(sub) sub.textContent = fmtDateES(iso);

  const note = document.getElementById('marea-day-note');
  const src = document.getElementById('marea-source-note');
  const m = STATE.data && STATE.data.mareas;

  const events = getTidesForDate(iso);

  if(src && m){
    src.textContent = `${m.ubicacion} · ${m.fuente}. ${m.nota || ''}`.trim();
  }

  const nextBox = document.getElementById('marea-next');
  if(!events){
    if(note) note.textContent = 'Sin datos cargados para esta fecha.';
    if(nextBox) nextBox.textContent = '—';
    const tbody = document.querySelector('#marea-table tbody');
    if(tbody) tbody.innerHTML = '';
    return;
  }

  if(note) note.textContent = `${events.length} evento(s) cargado(s)`;

  const next = getNextTideEvent(iso);
  if(nextBox && next){
    nextBox.textContent = `Próxima marea: ${next.time} · ${next.height_m.toFixed(2)} m`;
  }else if(nextBox){
    nextBox.textContent = '—';
  }

  const tbody = document.querySelector('#marea-table tbody');
  if(tbody){
    tbody.innerHTML = events.map(ev => `<tr><td>${ev.time}</td><td>${ev.height_m.toFixed(2)}</td></tr>`).join('');
  }
}

function wireMareas(){
  const input = document.getElementById('marea-date');
  if(!input) return;
  input.addEventListener('change', () => renderMareasPage());
}

// enganchar al init
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    renderMareasHome();
    wireMareas();
    // refrescar cada minuto para el "próxima marea"
    setInterval(renderMareasHome, 60*1000);
  }, 300);
});

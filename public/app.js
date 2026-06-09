/* ═══════════════════════════════════════════
   BAJIYA PROPERTIES — Application Logic
   ═══════════════════════════════════════════ */

let props = [], contact = {}, activeFilter = 'all', editId = null, uploadFile = null;
let hsFilterStatus = '';
let visibleCount = 6;       // Cards shown before "Load More"
let currentSlide = 0;
let slideInterval;
let testiOffset = 0;

const PASS = 'bajiyaproperties';
const SK   = 'kp_admin_session';
const $    = id => document.getElementById(id);
const esc  = s  => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ══════════════════════════════
   INIT
══════════════════════════════ */
async function initApp() {
  try {
    props   = await fetch('/api/properties').then(r => r.json());
    contact = await fetch('/api/contact').then(r => r.json());
  } catch(e) {
    console.warn('Server unavailable, using demo data.');
    props   = getDemoProps();
    contact = getDemoContact();
  }
  render();
  updateWaLinks();
}

/* Demo data so the site looks great standalone */
function getDemoProps() {
  return [
    { id:1, title:'Luxury 4BHK Villa',          location:'Bani Park, Jaipur',       price:'₹3.2 Cr',  status:'For Sale', type:'Villa',       beds:4, baths:4, area:'4500', agent:'Sunil Bajiya',  phone:'+91 98765 43210', desc:'Sprawling villa with a private pool, landscaped garden, and premium Italian marble flooring. Minutes from the walled city.', img:'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80', featured:true },
    { id:2, title:'Modern 3BHK Apartment',       location:'Vaishali Nagar, Jaipur',  price:'₹95 Lakh', status:'For Sale', type:'Apartment',   beds:3, baths:2, area:'1850', agent:'Priya Mehta',   phone:'+91 98765 43211', desc:'Contemporary apartment in a gated society with 24/7 security, clubhouse, and rooftop terrace with city views.',           img:'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', featured:false },
    { id:3, title:'Commercial Shop — C-Scheme',  location:'C-Scheme, Jaipur',        price:'₹45K/mo',  status:'For Rent', type:'Commercial',  beds:0, baths:1, area:'800',  agent:'Sunil Bajiya',  phone:'+91 98765 43210', desc:'Prime commercial space on the main C-Scheme road with excellent footfall, glass frontage, and ample parking.',             img:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', featured:false },
    { id:4, title:'Residential Plot — Jagatpura', location:'Jagatpura, Jaipur',      price:'₹68 Lakh', status:'For Sale', type:'Plot',        beds:0, baths:0, area:'2400', agent:'Ravi Sharma',   phone:'+91 98765 43212', desc:'Corner residential plot in a developing locality with wide road access. RERA approved layout. Ready for construction.',       img:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80', featured:false },
    { id:5, title:'Furnished 2BHK — Malviya Nagar', location:'Malviya Nagar, Jaipur', price:'₹22K/mo', status:'For Rent', type:'Apartment',  beds:2, baths:2, area:'1100', agent:'Priya Mehta',   phone:'+91 98765 43211', desc:'Tastefully furnished apartment in a quiet lane. Modular kitchen, wardrobes, and 24/7 power backup included in rent.',         img:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', featured:false },
    { id:6, title:'Heritage Haveli Restoration',  location:'Old City, Jaipur',       price:'₹1.8 Cr',  status:'For Sale', type:'Residential', beds:6, baths:5, area:'6200', agent:'Sunil Bajiya',  phone:'+91 98765 43210', desc:'Rare opportunity to own a 19th-century haveli with original frescoes and courtyards. Ideal for a boutique heritage hotel or luxury residence.', img:'https://images.unsplash.com/photo-1582541573977-5e53f8e56ade?w=800&q=80', featured:true },
    { id:7, title:'Penthouse — Sodala',           location:'Sodala, Jaipur',         price:'₹1.45 Cr', status:'For Sale', type:'Apartment',   beds:4, baths:3, area:'3200', agent:'Ravi Sharma',   phone:'+91 98765 43212', desc:'Stunning duplex penthouse with 360° city views, private terrace, and a rooftop jacuzzi. Premium fixtures throughout.',         img:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', featured:false },
    { id:8, title:'Office Space — Tonk Road',     location:'Tonk Road, Jaipur',      price:'₹85K/mo',  status:'For Rent', type:'Commercial',  beds:0, baths:3, area:'4000', agent:'Priya Mehta',   phone:'+91 98765 43211', desc:'Grade-A office space with open floor plan, conference rooms, cafeteria, and ample covered parking. Suitable for 50+ employees.', img:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', featured:false },
  ];
}
function getDemoContact() {
  return {
    name: 'Bajiya Properties',
    phone: '+91 98765 43210',
    email: 'info@bajiyaproperties.com',
    address: '42, Bani Park, Near Central Bank, Jaipur — 302016',
    whatsapp: '+919876543210',
    hours: 'Mon–Sat: 9am–7pm'
  };
}

/* ══════════════════════════════
   RENDER
══════════════════════════════ */
function render() {
  let list = [...props];
  if (activeFilter !== 'all') list = list.filter(p => p.status === activeFilter);
  const kw = ($('s-kw').value || '').trim().toLowerCase();
  const st = $('s-status').value, ty = $('s-type').value;
  if (kw) list = list.filter(p => (p.title+p.location+p.type+(p.desc||'')).toLowerCase().includes(kw));
  if (st) list = list.filter(p => p.status === st);
  if (ty) list = list.filter(p => p.type === ty);

  $('s-total').textContent = props.length;
  $('s-sale').textContent  = props.filter(p => p.status === 'For Sale').length;
  $('s-rent').textContent  = props.filter(p => p.status === 'For Rent').length;
  $('count-badge').textContent = list.length + ' propert' + (list.length === 1 ? 'y' : 'ies');

  const showing = list.slice(0, visibleCount);
  $('props-grid').innerHTML = showing.length
    ? showing.map(cardHTML).join('')
    : '<div class="empty"><h3>No Properties Found</h3><p>Try adjusting your filters or search term.</p></div>';

  const lmw = $('load-more-wrap');
  lmw.style.display = list.length > visibleCount ? 'block' : 'none';

  renderContact();
  updateStatsCounters();
}

function loadMore() {
  visibleCount += 6;
  render();
}

/* ── Card HTML ── */
function cardHTML(p) {
  const img    = p.img || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
  const badge  = p.status === 'For Sale' ? 'b-sale' : p.status === 'For Rent' ? 'b-rent' : 'b-sold';
  const beds   = (p.type !== 'Plot' && p.beds)  ? `<div class="spec"><span class="spec-v">${esc(p.beds)}</span><span class="spec-l">Beds</span></div>` : '';
  const baths  = (p.type !== 'Plot' && p.baths) ? `<div class="spec"><span class="spec-v">${esc(p.baths)}</span><span class="spec-l">Baths</span></div>` : '';
  const featured = p.featured ? '<div class="card-featured-tag">Featured</div>' : '';
  const adminBtns = `<div class="card-btns"><button class="cbtn cbtn-edit" onclick="event.stopPropagation();openEdit(${p.id})">Edit</button><button class="cbtn cbtn-del" onclick="event.stopPropagation();delProp(${p.id})">Delete</button></div>`;

  return `
  <div class="card" onclick="openDetail(${p.id})">
    <div class="card-img">
      ${featured}
      <img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'"/>
      <span class="card-badge ${badge}">${esc(p.status)}</span>
      <div class="card-price">${esc(p.price)}</div>
      <button class="card-wish" onclick="event.stopPropagation();wishlist(this)" title="Save property">♡</button>
    </div>
    <div class="card-body">
      <div class="card-type">${esc(p.type)}</div>
      <h3 class="card-title">${esc(p.title)}</h3>
      <div class="card-loc">
        <svg width="9" height="12" viewBox="0 0 9 12" fill="none"><path d="M4.5 0C2.29 0 .5 1.79.5 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="#c9a84c"/></svg>
        ${esc(p.location)}
      </div>
      <div class="card-specs">
        ${beds}${baths}
        <div class="spec"><span class="spec-v">${esc(p.area)||'–'}</span><span class="spec-l">Sq Ft</span></div>
        <div class="spec"><span class="spec-v">${esc(p.type)}</span><span class="spec-l">Type</span></div>
      </div>
      <p class="card-desc">${esc(p.desc)}</p>
      <div class="card-foot">
        <div class="agent-info">
          <span class="agent-name">${esc(p.agent)}</span>
          <span class="agent-ph">${esc(p.phone)}</span>
        </div>
        ${adminBtns}
      </div>
    </div>
  </div>`;
}

/* ── Detail Modal ── */
function openDetail(id) {
  const p = props.find(x => x.id === id); if (!p) return;
  const img   = p.img || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
  const badge = p.status === 'For Sale' ? 'b-sale' : p.status === 'For Rent' ? 'b-rent' : 'b-sold';

  $('det-img').src   = img;
  $('det-badge').className = `card-badge ${badge}`;
  $('det-badge').textContent = p.status;
  $('det-type').textContent  = p.type;
  $('det-title').textContent = p.title;
  $('det-loc').textContent   = '📍 ' + p.location;
  $('det-price').textContent = p.price;
  $('det-desc').textContent  = p.desc || 'No description provided.';

  const beds  = (p.type !== 'Plot' && p.beds)  ? `<div class="spec"><span class="spec-v">${esc(p.beds)}</span><span class="spec-l">Beds</span></div>` : '';
  const baths = (p.type !== 'Plot' && p.baths) ? `<div class="spec"><span class="spec-v">${esc(p.baths)}</span><span class="spec-l">Baths</span></div>` : '';
  $('det-specs').innerHTML = `${beds}${baths}<div class="spec"><span class="spec-v">${esc(p.area)||'–'}</span><span class="spec-l">Sq Ft</span></div>`;

  $('det-agent').innerHTML = `
    <div class="testi-avatar" style="border-radius:50%;margin-right:4px">${esc(p.agent||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()}</div>
    <div class="det-agent-info">
      <div class="det-agent-name">${esc(p.agent)}</div>
      <div class="det-agent-ph">${esc(p.phone)}</div>
    </div>`;

  const waMsg = `Hi! I'm interested in "${p.title}" (${p.price}) at ${p.location}. Please share more details.`;
  const waNum = (contact.whatsapp || '').replace(/\D/g,'');
  $('det-wa').href = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}` : '#';

  openModal('detail-modal');
}

/* ── Wishlist toggle ── */
function wishlist(btn) {
  const saved = btn.textContent === '♥';
  btn.textContent = saved ? '♡' : '♥';
  btn.style.color = saved ? '' : '#c9a84c';
  showToast(saved ? 'Removed from saved.' : 'Saved to your list!');
}

/* ── Contact section render ── */
function renderContact() {
  const c = contact;
  const icons  = { phone:'📞', email:'✉️', address:'📍', whatsapp:'💬', hours:'🕐' };
  const labels = { phone:'Phone', email:'Email', address:'Address', whatsapp:'WhatsApp', hours:'Hours' };
  $('contact-rows').innerHTML = Object.keys(icons).filter(k => c[k]).map(k =>
    `<div class="c-row"><div class="c-icon">${icons[k]}</div><div><div class="c-lbl">${labels[k]}</div><div class="c-val">${esc(c[k])}</div></div></div>`
  ).join('');

  // Footer
  if ($('footer-email')) $('footer-email').textContent = c.email || '';
  if ($('footer-phone')) $('footer-phone').textContent = c.phone || '';
}

function updateWaLinks() {
  const waNum = (contact.whatsapp || '').replace(/\D/g,'');
  const waUrl = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent('Hello! I\'m interested in your properties.')}` : '#';
  const waEl  = $('fab-wa');
  const waLink = $('wa-link');
  if (waEl)   waEl.href   = waUrl;
  if (waLink) waLink.href = waUrl;
}

/* ══════════════════════════════
   HERO SLIDER
══════════════════════════════ */
function goSlide(n) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.slide-dot');
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (n + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}
function startSlider() {
  slideInterval = setInterval(() => goSlide(currentSlide + 1), 5000);
}
startSlider();

/* ══════════════════════════════
   HERO SEARCH
══════════════════════════════ */
let _hsStatus = '';
function setHsTab(btn, status) {
  document.querySelectorAll('.hs-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _hsStatus = status;
}
function heroSearch() {
  const kw   = $('hs-kw').value.trim();
  const type = $('hs-type').value;
  $('s-kw').value     = kw;
  $('s-type').value   = type;
  $('s-status').value = _hsStatus;
  if (_hsStatus) {
    activeFilter = _hsStatus;
    document.querySelectorAll('.ftab').forEach(b => {
      b.classList.toggle('active', b.textContent.trim() === _hsStatus);
    });
  } else {
    activeFilter = 'all';
    document.querySelectorAll('.ftab').forEach((b,i) => b.classList.toggle('active', i===0));
  }
  visibleCount = 6;
  render();
  smoothNav(null, 'listings');
}

/* ══════════════════════════════
   FILTERS & NAVIGATION
══════════════════════════════ */
function setFilter(v, el) {
  activeFilter = v; visibleCount = 6;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['s-status','s-type','s-kw'].forEach(id => $(id).value = '');
  render();
}

function filterByType(type) {
  $('s-type').value = type; activeFilter = 'all'; visibleCount = 6;
  document.querySelectorAll('.ftab').forEach((b,i) => b.classList.toggle('active', i===0));
  render();
  smoothNav(null, 'listings');
}

function smoothNav(e, id) {
  if (e) e.preventDefault();
  const el = $(id) || document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ══════════════════════════════
   STATS COUNTER ANIMATION
══════════════════════════════ */
function updateStatsCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target ?? el.textContent);
    if (isNaN(target)) return;
    el.dataset.target = target;
    animateCount(el, target);
  });
  // Set live targets from API data
  const tEl = $('s-total'), sEl = $('s-sale'), rEl = $('s-rent');
  if (tEl) { tEl.dataset.target = props.length; animateCount(tEl, props.length); }
  if (sEl) { const n = props.filter(p=>p.status==='For Sale').length; sEl.dataset.target=n; animateCount(sEl,n); }
  if (rEl) { const n = props.filter(p=>p.status==='For Rent').length; rEl.dataset.target=n; animateCount(rEl,n); }
}
function animateCount(el, target) {
  let start = 0, duration = 1200;
  const step = ts => {
    if (!start) start = ts;
    const pct = Math.min((ts - start) / duration, 1);
    el.textContent = Math.round(pct * target) + (target >= 100 ? '+' : '');
    if (pct < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ══════════════════════════════
   MOBILE MENU
══════════════════════════════ */
function toggleMenu() {
  const drawer   = $('mobile-drawer');
  const backdrop = $('drawer-backdrop');
  const isOpen   = drawer.classList.toggle('open');
  backdrop.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/* ══════════════════════════════
   NAVBAR SCROLL
══════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ══════════════════════════════
   SCROLL REVEAL
══════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ══════════════════════════════
   TESTIMONIALS SLIDER
══════════════════════════════ */
function moveTestimonials(dir) {
  const track  = $('testi-track');
  const cards  = track.querySelectorAll('.testi-card');
  const width  = cards[0].offsetWidth + 24;
  const maxOff = -(cards.length - getVisibleTestis()) * width;
  testiOffset  = Math.max(maxOff, Math.min(0, testiOffset - dir * width));
  track.style.transform = `translateX(${testiOffset}px)`;
}
function getVisibleTestis() {
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 960) return 2;
  return 3;
}

/* ══════════════════════════════
   MODALS
══════════════════════════════ */
function openModal(id)  { $(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { $(id).classList.remove('open'); document.body.style.overflow=''; if(id==='prop-modal') resetForm(); }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(o => closeModal(o.id));
});

/* ══════════════════════════════
   ADD / EDIT PROPERTY
══════════════════════════════ */
function openAddModal() {
  editId = null; uploadFile = null; resetForm();
  $('modal-title').textContent = 'Add Property';
  openModal('prop-modal');
}
function openEdit(id) {
  const p = props.find(x => x.id === id); if (!p) return;
  editId = id; uploadFile = null;
  $('modal-title').textContent = 'Edit Property';
  const map = {title:'f-title',location:'f-location',price:'f-price',status:'f-status',type:'f-type',beds:'f-beds',baths:'f-baths',area:'f-area',agent:'f-agent',phone:'f-phone',desc:'f-desc'};
  Object.entries(map).forEach(([k,v]) => $(v).value = p[k] ?? '');
  $('f-imgurl').value = p.img || '';
  if (p.img) { $('img-prev').src=p.img; $('img-prev').style.display='block'; $('img-icon').style.display=$('img-txt').style.display='none'; }
  openModal('prop-modal');
}
function resetForm() {
  ['f-title','f-location','f-price','f-area','f-agent','f-phone','f-desc','f-imgurl','f-beds','f-baths'].forEach(id => $(id).value='');
  $('f-status').value='For Sale'; $('f-type').value='Villa';
  $('img-prev').style.display='none';
  $('img-icon').style.display=$('img-txt').style.display='block';
  $('f-file').value=''; uploadFile=null;
}

async function saveProp() {
  const title = $('f-title').value.trim();
  if (!title) { showToast('Please enter a property title.'); return; }
  const data = {
    id:editId, title,
    location:$('f-location').value.trim(), price:$('f-price').value.trim(),
    status:$('f-status').value, type:$('f-type').value,
    beds:parseInt($('f-beds').value)||0, baths:parseInt($('f-baths').value)||0,
    area:$('f-area').value.trim(), agent:$('f-agent').value.trim(),
    phone:$('f-phone').value.trim(), desc:$('f-desc').value.trim(),
    img:$('f-imgurl').value.trim()||(editId?(props.find(p=>p.id===editId)||{}).img:'')
  };
  const fd = new FormData();
  fd.append('propertyData', JSON.stringify(data));
  if (uploadFile) fd.append('imageFile', uploadFile);
  try {
    const r = await fetch('/api/properties',{method:'POST',body:fd}).then(r=>r.json());
    if (r.success) { showToast(editId?'Property updated!':'Property added!'); closeModal('prop-modal'); initApp(); }
  } catch(e) {
    // Demo mode: update local array
    if (editId) {
      const idx = props.findIndex(p=>p.id===editId);
      if (idx >= 0) props[idx] = {...props[idx],...data};
    } else {
      data.id = Date.now();
      props.push(data);
    }
    showToast(editId?'Property updated!':'Property added!');
    closeModal('prop-modal'); render();
  }
}

async function delProp(id) {
  if (!confirm('Remove this property permanently?')) return;
  try {
    const r = await fetch(`/api/properties/${id}`,{method:'DELETE'}).then(r=>r.json());
    if (r.success) { showToast('Property removed.'); initApp(); }
  } catch(e) {
    props = props.filter(p=>p.id!==id);
    showToast('Property removed.'); render();
  }
}

/* Image preview */
function previewUrl() {
  const url = $('f-imgurl').value.trim(), prev = $('img-prev');
  prev.style.display = url ? 'block' : 'none';
  $('img-icon').style.display = $('img-txt').style.display = url ? 'none' : 'block';
  if (url) { prev.src=url; uploadFile=null; }
}
function handleUpload(e) {
  const f = e.target.files[0]; if (!f) return;
  uploadFile = f;
  const r = new FileReader();
  r.onload = ev => {
    $('img-prev').src=ev.target.result; $('img-prev').style.display='block';
    $('img-icon').style.display=$('img-txt').style.display='none';
    $('f-imgurl').value='';
  };
  r.readAsDataURL(f);
}

/* ══════════════════════════════
   CONTACT MODAL
══════════════════════════════ */
function openContactModal() {
  ['name','phone','email','address','whatsapp','hours'].forEach(k => $('c-'+k).value = contact[k]||'');
  openModal('contact-modal');
}
async function saveContact() {
  const data = {};
  ['name','phone','email','address','whatsapp','hours'].forEach(k => data[k]=$('c-'+k).value.trim());
  try {
    const r = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json());
    if (r.success) { contact=data; showToast('Contact info updated!'); closeModal('contact-modal'); renderContact(); updateWaLinks(); }
  } catch(e) {
    contact = data; showToast('Contact info updated!');
    closeModal('contact-modal'); renderContact(); updateWaLinks();
  }
}

/* ══════════════════════════════
   CONTACT FORM SUBMIT
══════════════════════════════ */
function submitContact() {
  const name = $('cf-name').value.trim();
  if (!name) { showToast('Please enter your name.'); return; }
  const waNum = (contact.whatsapp || '').replace(/\D/g,'');
  const msg   = `Hi! I'm ${name}. Interested in: ${$('cf-interest').value}.\n${$('cf-msg').value.trim()}`;
  if (waNum) {
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
  }
  showToast('Message sent! We will contact you shortly.');
  ['cf-name','cf-phone','cf-email','cf-msg'].forEach(id => $(id).value='');
}

/* ══════════════════════════════
   TOAST
══════════════════════════════ */
let toastTimer;
function showToast(msg) {
  const t = $('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

/* ══════════════════════════════
   ADMIN AUTH
══════════════════════════════ */
function isAdmin() { return sessionStorage.getItem(SK)==='1'; }
function openLoginModal() {
  if (isAdmin()) { showToast('Already logged in as admin.'); return; }
  $('admin-pass').value=''; $('login-err').classList.remove('show');
  openModal('login-modal');
  setTimeout(() => $('admin-pass').focus(), 120);
}
function doLogin() {
  if ($('admin-pass').value === PASS) {
    sessionStorage.setItem(SK,'1'); closeModal('login-modal');
    document.body.classList.add('admin-mode');
    $('admin-login-btn').style.display = 'none';
    const mob = $('mobile-admin-btn'); if (mob) mob.style.display='none';
    showToast('Welcome, Admin!'); render();
  } else {
    $('login-err').classList.add('show'); $('admin-pass').value=''; $('admin-pass').focus();
  }
}
function doLogout() {
  sessionStorage.removeItem(SK); document.body.classList.remove('admin-mode');
  $('admin-login-btn').style.display='inline-flex';
  showToast('Logged out.'); render();
}

// Boot
if (isAdmin()) {
  document.body.classList.add('admin-mode');
  $('admin-login-btn').style.display='none';
}
initApp();
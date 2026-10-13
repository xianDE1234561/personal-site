const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
let images = [], tracks = [], filtered = [], category = '全部', visibleCount = 24, activeIndex = 0, heroIndex = 5, trackIndex = 0, toastTimer;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let heroRequest = 0, heroAnimation = null, gridAnimation = null;
const grid = $('#photo-grid'), dialog = $('#lightbox'), audio = $('#audio');
function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800); }
function render() {
  const query = $('#search').value.trim().toLowerCase();
  filtered = images.filter(item => (category === '全部' || item.category === category) && (item.title + item.category + item.note).toLowerCase().includes(query));
  grid.replaceChildren();
  for (const [index, item] of filtered.slice(0, visibleCount).entries()) {
    const button = document.createElement('button'); button.className = 'photo'; button.type = 'button'; button.setAttribute('aria-label', `查看${item.title}大图`);
    const holder = document.createElement('div'); holder.className = 'photo-image';
    const image = document.createElement('img'); image.src = item.thumb; image.alt = item.title; image.loading = 'lazy'; image.width = item.width; image.height = item.height;
    const caption = document.createElement('div'); caption.className = 'photo-caption';
    const name = document.createElement('span'); name.textContent = item.title;
    const tag = document.createElement('span'); tag.className = 'category'; tag.textContent = item.category + ' / ' + item.note;
    const open = document.createElement('span'); open.className = 'photo-open'; open.textContent = '↗'; open.setAttribute('aria-hidden', 'true');
    holder.append(image); caption.append(name, tag); button.append(holder, caption, open); button.addEventListener('click', () => openLightbox(index)); grid.append(button);
  }
  $('#result-info').textContent = `${category} / ${filtered.length} 张影像 · 已展示 ${Math.min(visibleCount, filtered.length)} 张`;
  $('#empty-state').hidden = filtered.length > 0;
  $('#load-more').hidden = visibleCount >= filtered.length;
  $$('.filters button').forEach(button => { const active = button.dataset.filter === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  gridAnimation?.cancel();
  if (!motionPreference.matches && grid.animate) gridAnimation = grid.animate([{opacity:0.55},{opacity:1}],{duration:180,easing:'ease-out'});
}
function chooseCategory(value) { category = value; visibleCount = 24; render(); }
$$('[data-filter]').forEach(button => button.addEventListener('click', () => chooseCategory(button.dataset.filter)));
$$('[data-collection]').forEach(button => button.addEventListener('click', () => { $('#search').value = ''; chooseCategory(button.dataset.collection); $('#gallery').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); }));
$('#search').addEventListener('input', () => { visibleCount = 24; render(); });
$('#load-more').addEventListener('click', () => { const previous = visibleCount; visibleCount += 24; render(); grid.children[previous]?.focus({preventScroll: true}); });
function updateLightbox() {
  const item = filtered[activeIndex]; if (!item) return;
  $('#lightbox-image').src = item.src; $('#lightbox-image').alt = item.title;
  $('#lightbox-title').textContent = item.title; $('#lightbox-category').textContent = item.category + ' / VISUAL ARCHIVE';
  $('#lightbox-note').textContent = item.note;
  $('#lightbox-counter').textContent = `${String(activeIndex + 1).padStart(2,'0')} / ${filtered.length}`;
  $('#download').href = item.src; $('#download').download = item.id + '.webp';
}
function openLightbox(index) { activeIndex = index; updateLightbox(); dialog.showModal(); document.body.style.overflow = 'hidden'; }
function changeImage(offset) { activeIndex = (activeIndex + offset + filtered.length) % filtered.length; updateLightbox(); }
$('#lightbox-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
$('#lightbox-prev').addEventListener('click', () => changeImage(-1)); $('#lightbox-next').addEventListener('click', () => changeImage(1));
document.addEventListener('keydown', event => { if (!dialog.open) return; if (event.key === 'ArrowLeft') {event.preventDefault(); changeImage(-1);} if (event.key === 'ArrowRight') {event.preventDefault(); changeImage(1);} });
async function changeHero(offset) {
  const slides = images.filter(item => item.category === '精选'); if (!slides.length) return;
  heroIndex = (heroIndex + offset + slides.length) % slides.length; const item = slides[heroIndex];
  const request = ++heroRequest, base = $('.hero-image'), overlay = $('.hero-overlay');
  const preload = new Image(); preload.src = item.src;
  try { await preload.decode(); } catch { if (request === heroRequest) notify('这张影像暂时无法加载。'); return; }
  if (request !== heroRequest) return;
  heroAnimation?.cancel();
  base.alt = item.title; $('#hero-caption').textContent = item.title; $('#hero-counter').textContent = `${String(heroIndex + 1).padStart(2, '0')} / 08`;
  if (motionPreference.matches || !overlay.animate) {base.src = item.src; return;}
  overlay.src = item.src;
  const animation = overlay.animate([{opacity:0},{opacity:1}],{duration:550,easing:'cubic-bezier(.2,.6,.3,1)',fill:'forwards'});
  heroAnimation = animation;
  try { await animation.finished; } catch { return; }
  if (request !== heroRequest) return;
  base.src = item.src;
  try { await base.decode(); } catch {}
  if (request === heroRequest) {animation.cancel(); heroAnimation = null;}
}
$('#hero-prev').addEventListener('click', () => changeHero(-1)); $('#hero-next').addEventListener('click', () => changeHero(1));
function musicState() { const playing = !audio.paused; $('#play-icon').textContent = playing ? 'Ⅱ' : '▶'; $('#music-toggle').setAttribute('aria-pressed', String(playing)); $('#music-toggle').setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐'); }
function setTrack(index) { trackIndex = index; audio.src = tracks[index].src; $('#track-title').textContent = tracks[index].title; }
async function play() { try { await audio.play(); } catch { notify('暂时无法播放音乐，请再试一次。'); } musicState(); }
$('#music-toggle').addEventListener('click', () => audio.paused ? play() : audio.pause());
$('#next-track').addEventListener('click', () => { if (!tracks.length) return; const wasPlaying = !audio.paused; setTrack((trackIndex + 1) % tracks.length); if (wasPlaying) play(); });
audio.addEventListener('play', musicState); audio.addEventListener('pause', musicState); audio.addEventListener('ended', () => { setTrack((trackIndex + 1) % tracks.length); play(); });
audio.addEventListener('error', () => { musicState(); notify('这首音乐暂时不可用，可以试试下一首。'); });
$('#music-dismiss').addEventListener('click', () => { audio.pause(); $('#music-dock').hidden = true; $('#music-reopen').hidden = false; });
$('#music-reopen').addEventListener('click', () => { $('#music-dock').hidden = false; $('#music-reopen').hidden = true; });
$$('.copy-contact').forEach(button => button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(button.dataset.copy); notify('已复制：' + button.dataset.copy); } catch { notify('请手动复制：' + button.dataset.copy); } }));
async function loadContent() {
  $('#load-error').hidden = true;
  try {
    const response = await fetch('content.json'); if (!response.ok) throw new Error('Content unavailable');
    const data = await response.json(); images = data.images; tracks = data.tracks;
    $('#total-count').textContent = `${images.length} 张影像 / 3 个相册`; render();
    if (tracks.length) { setTrack(0); $('#music-dock').hidden = false; }
  } catch { $('#total-count').textContent = '影像暂时无法加载'; $('#load-error').hidden = false; }
}
$('#retry').addEventListener('click', loadContent);
let revealObserver;
if ('IntersectionObserver' in window && !motionPreference.matches) {
  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {entry.target.classList.add('reveal-visible'); revealObserver.unobserve(entry.target);}
  }, {threshold:0.1,rootMargin:'0px 0px -25px 0px'});
  $$('.section-heading,.collection-card,.archive-heading,.about-visual,.about-copy,.contact-heading').forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight - 25) return;
    element.classList.add('reveal-pending'); revealObserver.observe(element);
    element.addEventListener('focusin', () => {element.classList.add('reveal-visible'); revealObserver.unobserve(element);}, {once:true});
  });
}
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) {
    heroAnimation?.finish(); gridAnimation?.cancel(); revealObserver?.disconnect();
    $$('.reveal-pending').forEach(element => element.classList.add('reveal-visible'));
  }
});
loadContent();

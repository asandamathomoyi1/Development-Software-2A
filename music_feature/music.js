const $ = (sel) => document.querySelector(sel);
const resultsEl = $('#results');
const player = $('#player');
const qInput = $('#q');
const searchBtn = $('#searchBtn');
const enableBtn = $('#enableAudio');

async function search(q) {
  resultsEl.innerHTML = '<p class="muted">Searching…</p>';
  try {
    const res = await fetch(`/spotify/search?q=${encodeURIComponent(q)}&limit=12`);
    const data = await res.json();
    if (!data.success) return showError(data.error || 'Search failed');
    renderTracks(data.tracks || []);
  } catch (err) {
    showError(err.message || 'Network error');
  }
}

function showError(msg) {
  resultsEl.innerHTML = `<p class="muted">${msg}</p>`;
}

function renderTracks(tracks) {
  if (!tracks.length) return showError('No results');
  resultsEl.innerHTML = tracks.map(t => {
    const img = t.album && t.album.image ? `<img class="thumb" src="${t.album.image}" alt="album">` : '';
    const previewBtn = t.preview_url ? `<button data-preview="${t.preview_url}" class="play">Play preview</button>` : `<a class="open" href="${t.external_url}" target="_blank" rel="noopener">Open in Spotify</a>`;
    return `<div class="track" data-id="${t.id}">${img}<div class="meta"><div class="title">${escapeHtml(t.name)}</div><div class="artists">${escapeHtml(t.artists)}</div>${previewBtn}</div></div>`;
  }).join('');
  // attach handlers
  document.querySelectorAll('.play').forEach(btn => btn.addEventListener('click', () => {
    const src = btn.getAttribute('data-preview');
    if (!src) return;
    player.src = src;
    player.play().catch((err)=>{
      // show enable button when autoplay / play is blocked
      if (enableBtn) {
        enableBtn.style.display = 'inline-block';
        enableBtn.textContent = 'Tap to play';
      }
    });
  }));
}

function escapeHtml(s){ if(!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

searchBtn.addEventListener('click', () => {
  const q = qInput.value.trim();
  if (!q) return;
  search(q);
});

qInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtn.click(); });

// optional: friendly initial suggestions
document.addEventListener('DOMContentLoaded', () => {
  // focus input
  qInput.focus();
  // if user taps anywhere, try to resume audio (helpful on mobile)
  const tryResume = () => {
    if (!player) return;
    player.play().then(()=>{
      if (enableBtn) enableBtn.style.display = 'none';
    }).catch(()=>{});
    document.body.removeEventListener('click', tryResume);
  };
  document.body.addEventListener('click', tryResume, { once: true });
  if (enableBtn) {
    enableBtn.addEventListener('click', () => {
      player.play().then(()=>{
        enableBtn.style.display = 'none';
      }).catch(()=>{
        // still blocked; keep the button visible
      });
    });
  }
});

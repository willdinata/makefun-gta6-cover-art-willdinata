// VICE FRAME - Editor Main Controller

import { LAYOUTS } from './panels.js';
import { drawCover, panelAtPoint } from './render.js';
import { handleShotMode } from './shots.js';

const state = {
  layout: 'diagonal-six',
  theme: 'sunset-vice',
  title1: 'LEONIDA',
  title2: 'HEAT',
  tagline: 'WELCOME BACK TO LEONIDA',
  selectedPanel: 0,
  photos: [],
  panels: [],
  canvasWidth: 1080,
  canvasHeight: 1080,
};

function initPanels() {
  const layoutObj = LAYOUTS.find(l => l.id === state.layout) || LAYOUTS[0];
  const dummyPolys = layoutObj.getPanels(1080, 1080);
  while (state.panels.length < dummyPolys.length) {
    const idx = state.panels.length;
    const framing = layoutObj.getFraming ? layoutObj.getFraming(idx) : { zoom: 1, fx: 0.5, fy: 0.5 };
    state.panels.push({
      photo: null,
      zoom: framing.zoom,
      fx: framing.fx,
      fy: framing.fy,
      offsetX: 0,
      offsetY: 0,
    });
  }
  state.panels = state.panels.slice(0, dummyPolys.length);
  state.panels.forEach((p, idx) => {
    const framing = layoutObj.getFraming ? layoutObj.getFraming(idx) : { zoom: 1, fx: 0.5, fy: 0.5 };
    if (!p.zoom || p.zoom === 1) {
      p.zoom = framing.zoom;
      p.fx = framing.fx;
      p.fy = framing.fy;
    }
  });
}
initPanels();

async function loadDefaultSamples() {
  const loadImg = (url) => new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = url;
  });

  const pier = await loadImg('samples/pier.jpg');
  const boulevard = await loadImg('samples/boulevard.jpg');
  if (pier) state.photos.push(pier);
  if (boulevard) state.photos.push(boulevard);

  if (pier && state.panels.length > 0) {
    const layoutObj = LAYOUTS.find(l => l.id === state.layout) || LAYOUTS[0];
    state.panels.forEach((p, idx) => {
      if (!p.photo) p.photo = pier;
      const framing = layoutObj.getFraming ? layoutObj.getFraming(idx) : { zoom: 1, fx: 0.5, fy: 0.5 };
      p.zoom = framing.zoom;
      p.fx = framing.fx;
      p.fy = framing.fy;
    });
  }
  updatePhotoStrip();
  redraw();
}

const canvas = document.getElementById('cover-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const statusLine = document.getElementById('status-line');

function setStatus(msg) {
  if (statusLine) statusLine.textContent = msg;
}

function redraw(options = {}) {
  if (!canvas || !ctx) return;
  const w = state.canvasWidth || 1080;
  const h = state.canvasHeight || 1080;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.clearRect(0, 0, w, h);
  const isEditor = options.isEditor ?? (!window.location.search?.includes('shot=cover') && !document.body.classList.contains('shot-cover'));
  drawCover(ctx, w, h, state, { isEditor });
}

function bindUI() {
  const layoutSelect = document.getElementById('layout-select');
  if (layoutSelect) {
    layoutSelect.value = state.layout;
    layoutSelect.onchange = (e) => {
      state.layout = e.target.value;
      initPanels();
      redraw();
      setStatus(`Switched layout to ${state.layout}`);
    };
  }

  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = state.theme;
    themeSelect.onchange = (e) => {
      state.theme = e.target.value;
      redraw();
      setStatus(`Switched theme to ${state.theme}`);
    };
  }

  const t1 = document.getElementById('title1-input');
  const t2 = document.getElementById('title2-input');
  const tag = document.getElementById('tagline-input');
  if (t1) { t1.value = state.title1; t1.oninput = (e) => { state.title1 = e.target.value; redraw(); }; }
  if (t2) { t2.value = state.title2; t2.oninput = (e) => { state.title2 = e.target.value; redraw(); }; }
  if (tag) { tag.value = state.tagline; tag.oninput = (e) => { state.tagline = e.target.value; redraw(); }; }

  const zoomSlider = document.getElementById('zoom-slider');
  if (zoomSlider) {
    zoomSlider.oninput = (e) => {
      const p = state.panels[state.selectedPanel];
      if (p) {
        p.zoom = parseFloat(e.target.value);
        redraw();
      }
    };
  }

  const photoInput = document.getElementById('photo-input');
  if (photoInput) {
    photoInput.onchange = (e) => {
      handleFiles(e.target.files);
    };
  }

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  const btnPier = document.getElementById('btn-sample-pier');
  const btnBlvd = document.getElementById('btn-sample-boulevard');
  if (btnPier) btnPier.onclick = () => loadSamplePhoto('samples/pier.jpg');
  if (btnBlvd) btnBlvd.onclick = () => loadSamplePhoto('samples/boulevard.jpg');

  const btnFillAll = document.getElementById('btn-fill-all');
  if (btnFillAll) {
    btnFillAll.onclick = () => {
      const curPhoto = state.panels[state.selectedPanel]?.photo || state.photos[0];
      if (curPhoto) {
        const layoutObj = LAYOUTS.find(l => l.id === state.layout) || LAYOUTS[0];
        state.panels.forEach((p, idx) => {
          p.photo = curPhoto;
          const framing = layoutObj.getFraming ? layoutObj.getFraming(idx) : { zoom: 1, fx: 0.5, fy: 0.5 };
          p.zoom = framing.zoom;
          p.fx = framing.fx;
          p.fy = framing.fy;
          p.offsetX = 0;
          p.offsetY = 0;
        });
        redraw();
        setStatus('Applied selected photo to all panels with framing presets.');
      }
    };
  }

  const export1080 = document.getElementById('btn-export-1080');
  const export1350 = document.getElementById('btn-export-1350');
  const export1920 = document.getElementById('btn-export-1920');

  if (export1080) export1080.onclick = () => exportCover(1080, 1080, 'vice-frame-1080x1080.png');
  if (export1350) export1350.onclick = () => exportCover(1080, 1350, 'vice-frame-1080x1350.png');
  if (export1920) export1920.onclick = () => exportCover(1920, 1080, 'vice-frame-1920x1080.png');

  if (canvas) {
    let isDragging = false;
    let startX = 0, startY = 0;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const layoutObj = LAYOUTS.find(l => l.id === state.layout) || LAYOUTS[0];
      const panels = layoutObj.getPanels(canvas.width, canvas.height);
      const clickedIdx = panelAtPoint(x, y, panels);

      if (clickedIdx !== -1) {
        state.selectedPanel = clickedIdx;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        redraw();
        updateSelectedPanelUI();
        setStatus(`Selected Panel #${clickedIdx + 1}`);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = e.clientX;
      startY = e.clientY;

      const p = state.panels[state.selectedPanel];
      if (p) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        p.offsetX += dx * scaleX;
        p.offsetY += dy * (canvas.height / rect.height);
        redraw();
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}

function handleFiles(files) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.photos.push(img);
      if (state.panels[state.selectedPanel]) {
        state.panels[state.selectedPanel].photo = img;
      }
      updatePhotoStrip();
      redraw();
      setStatus(`Loaded photo: ${file.name}`);
    };
    img.src = url;
  });
}

async function loadSamplePhoto(path) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.photos.push(img);
    if (state.panels[state.selectedPanel]) {
      state.panels[state.selectedPanel].photo = img;
    }
    updatePhotoStrip();
    redraw();
    setStatus(`Loaded sample photo`);
  };
  img.src = path;
}

function updatePhotoStrip() {
  const strip = document.getElementById('photo-strip');
  if (!strip) return;
  strip.innerHTML = '';
  state.photos.forEach((photo) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';
    const im = document.createElement('img');
    im.src = photo.src;
    thumb.appendChild(im);
    thumb.onclick = () => {
      if (state.panels[state.selectedPanel]) {
        state.panels[state.selectedPanel].photo = photo;
        redraw();
        setStatus(`Assigned photo to Panel #${state.selectedPanel + 1}`);
      }
    };
    strip.appendChild(thumb);
  });
}

function updateSelectedPanelUI() {
  const p = state.panels[state.selectedPanel];
  const zoomSlider = document.getElementById('zoom-slider');
  if (p && zoomSlider) {
    zoomSlider.value = p.zoom;
  }
}

function exportCover(w, h, filename) {
  setStatus(`Rendering export at ${w}x${h}...`);
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d');
  drawCover(offCtx, w, h, state, { isEditor: false });

  offCanvas.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(`Successfully exported ${filename}`);
  }, 'image/png');
}

async function init() {
  bindUI();
  const handled = await handleShotMode(state, { redraw });
  if (!handled) {
    await loadDefaultSamples();
  }
}

init();

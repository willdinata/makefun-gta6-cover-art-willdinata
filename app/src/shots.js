// VICE FRAME - Shot Mode Handler

import { LAYOUTS } from './panels.js';

export async function handleShotMode(state, callbacks) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return false;

  const photoParam = params.get('photo') || 'pier';
  const photoNames = photoParam.split(',').map(s => s.trim()).filter(Boolean);
  
  const loadedImages = [];
  for (const name of photoNames) {
    const photoUrl = `samples/${name}.jpg`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photoUrl;
    await new Promise((resolve) => {
      if (img.complete || img.naturalWidth) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = resolve;
      }
    });
    if (img.complete || img.naturalWidth) {
      loadedImages.push(img);
    }
  }

  const layoutObj = LAYOUTS.find(l => l.id === (params.get('layout') || state.layout)) || LAYOUTS[0];
  if (params.get('layout')) {
    state.layout = params.get('layout');
  }

  // Ensure panels are initialized according to current layout and assigned in order
  const dummyPolys = layoutObj.getPanels(1080, 1080);
  state.panels = [];
  for (let i = 0; i < dummyPolys.length; i++) {
    const framing = layoutObj.getFraming ? layoutObj.getFraming(i) : { zoom: 1, fx: 0.5, fy: 0.5 };
    const assignedPhoto = loadedImages.length > 0 ? loadedImages[i % loadedImages.length] : null;
    state.panels.push({
      photo: assignedPhoto,
      zoom: framing.zoom,
      fx: framing.fx,
      fy: framing.fy,
      offsetX: 0,
      offsetY: 0,
    });
  }

  const caption = params.get('caption');
  if (caption) {
    const parts = caption.split(/[:|]/);
    state.title1 = parts[0]?.trim() || state.title1;
    state.title2 = parts[1]?.trim() || state.title2;
  }
  const tagline = params.get('tagline');
  if (tagline) state.tagline = tagline;

  const grade = params.get('grade') || params.get('theme');
  if (grade) state.theme = grade;

  const w = Number(params.get('w')) || 1920;
  const h = Number(params.get('h')) || 1080;

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.canvasWidth = w;
    state.canvasHeight = h;
  } else if (shot === 'editor') {
    document.body.classList.add('shot-editor');
  }

  if (callbacks.redraw) callbacks.redraw({ isEditor: shot !== 'cover' });

  try {
    await document.fonts.load('900 48px NotoSansDisplay');
  } catch {}

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (callbacks.redraw) callbacks.redraw({ isEditor: shot !== 'cover' });
      window.__shotReady = true;
    });
  });

  return true;
}

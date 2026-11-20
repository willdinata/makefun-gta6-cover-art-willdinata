// VICE FRAME - Cover Renderer

import { LAYOUTS } from './panels.js';

const THEMES = {
  'sunset-vice': {
    filter: 'saturate(1.3) contrast(1.2)',
    palettes: [
      ['rgba(255, 140, 40, 0.28)', 'rgba(255, 40, 110, 0.22)'],
      ['rgba(255, 30, 120, 0.3)', 'rgba(255, 200, 40, 0.22)'],
      ['rgba(255, 210, 60, 0.28)', 'rgba(255, 120, 0, 0.25)'],
      ['rgba(0, 220, 240, 0.32)', 'rgba(0, 110, 220, 0.22)'],
      ['rgba(255, 180, 50, 0.28)', 'rgba(255, 60, 130, 0.22)'],
      ['rgba(0, 200, 255, 0.28)', 'rgba(255, 150, 30, 0.25)'],
    ],
  },
  'neon-noir': {
    filter: 'saturate(0.9) contrast(1.35)',
    palettes: [
      ['rgba(40, 10, 80, 0.4)', 'rgba(255, 0, 120, 0.25)'],
      ['rgba(0, 140, 255, 0.35)', 'rgba(0, 240, 255, 0.25)'],
      ['rgba(220, 0, 100, 0.38)', 'rgba(80, 20, 120, 0.25)'],
      ['rgba(0, 220, 200, 0.35)', 'rgba(20, 20, 70, 0.3)'],
      ['rgba(0, 100, 220, 0.38)', 'rgba(255, 0, 90, 0.25)'],
      ['rgba(60, 10, 100, 0.38)', 'rgba(0, 240, 220, 0.25)'],
    ],
  },
  'golden-leonida': {
    filter: 'saturate(1.4) contrast(1.15)',
    palettes: [
      ['rgba(255, 170, 0, 0.3)', 'rgba(180, 20, 60, 0.22)'],
      ['rgba(255, 120, 0, 0.32)', 'rgba(255, 220, 80, 0.22)'],
      ['rgba(200, 10, 50, 0.3)', 'rgba(255, 150, 0, 0.22)'],
      ['rgba(160, 80, 20, 0.35)', 'rgba(255, 140, 0, 0.25)'],
      ['rgba(255, 200, 50, 0.3)', 'rgba(190, 30, 70, 0.22)'],
      ['rgba(210, 20, 60, 0.32)', 'rgba(255, 170, 0, 0.22)'],
    ],
  },
};

export function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function panelAtPoint(x, y, panels) {
  for (let i = panels.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, panels[i])) return i;
  }
  return -1;
}

function drawFallbackBackdrop(ctx, poly, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.clip();

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of poly) {
    minX = Math.min(minX, pt[0]);
    minY = Math.min(minY, pt[1]);
    maxX = Math.max(maxX, pt[0]);
    maxY = Math.max(maxY, pt[1]);
  }
  const pw = maxX - minX;
  const ph = maxY - minY;

  const grad = ctx.createLinearGradient(minX, minY, minX, maxY);
  grad.addColorStop(0, '#ff4e50');
  grad.addColorStop(0.4, '#f9d423');
  grad.addColorStop(0.7, '#2b1055');
  grad.addColorStop(1, '#000428');
  ctx.fillStyle = grad;
  ctx.fillRect(minX, minY, pw, ph);

  // Sun disc
  ctx.fillStyle = '#ffeed0';
  ctx.beginPath();
  ctx.arc(minX + pw * 0.5, minY + ph * 0.45, Math.min(pw, ph) * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Skyline
  ctx.fillStyle = '#0c0c1d';
  ctx.fillRect(minX, minY + ph * 0.65, pw, ph * 0.35);
  for (let bx = minX; bx < maxX; bx += pw * 0.12) {
    const bw = pw * 0.1;
    const bh = ph * (0.15 + ((bx * 7) % 0.3));
    ctx.fillStyle = (bx % 2 === 0) ? '#161633' : '#0d0d22';
    ctx.fillRect(bx, minY + ph * 0.65 - bh, bw, bh);
  }

  ctx.restore();
}

function drawImageCover(ctx, img, poly, zoom = 1, offsetX = 0, offsetY = 0, fx = 0.5, fy = 0.5) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.clip();

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of poly) {
    minX = Math.min(minX, pt[0]);
    minY = Math.min(minY, pt[1]);
    maxX = Math.max(maxX, pt[0]);
    maxY = Math.max(maxY, pt[1]);
  }
  const pw = maxX - minX;
  const ph = maxY - minY;
  const cx = minX + pw / 2;
  const cy = minY + ph / 2;

  const iw = img.naturalWidth || img.width || 800;
  const ih = img.naturalHeight || img.height || 600;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;

  const minOffsetX = (fx - 1) * dw + pw / 2;
  const maxOffsetX = fx * dw - pw / 2;
  const clampedOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, offsetX));

  const minOffsetY = (fy - 1) * dh + ph / 2;
  const maxOffsetY = fy * dh - ph / 2;
  const clampedOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));

  const dx = cx - fx * dw + clampedOffsetX;
  const dy = cy - fy * dh + clampedOffsetY;

  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPanelGradeAndTint(ctx, poly, w, h, themeKey, idx) {
  const theme = THEMES[themeKey] || THEMES['sunset-vice'];
  const palette = theme.palettes || [['rgba(255, 50, 120, 0.22)', 'rgba(0, 220, 255, 0.18)']];
  const [c1, c2] = palette[idx % palette.length];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.clip();

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of poly) {
    minX = Math.min(minX, pt[0]);
    minY = Math.min(minY, pt[1]);
    maxX = Math.max(maxX, pt[0]);
    maxY = Math.max(maxY, pt[1]);
  }
  const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  ctx.restore();
}

function drawHalftoneAndVignette(ctx, w, h) {
  ctx.save();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  const step = Math.max(5, Math.floor(w / 200));
  for (let x = 0; x < w; x += step) {
    for (let y = 0; y < h; y += step) {
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  }
  ctx.restore();
}

export function drawCover(ctx, w, h, state, options = {}) {
  const isEditor = options.isEditor ?? false;

  // Background base
  ctx.fillStyle = '#05050b';
  ctx.fillRect(0, 0, w, h);

  const layoutObj = LAYOUTS.find(l => l.id === state.layout) || LAYOUTS[0];
  const panels = layoutObj.getPanels(w, h);
  const themeKey = state.theme || 'sunset-vice';

  // Draw panels
  panels.forEach((poly, idx) => {
    const panelState = state.panels?.[idx] || {};
    const photo = panelState.photo;
    const framing = layoutObj.getFraming ? layoutObj.getFraming(idx) : { zoom: 1, fx: 0.5, fy: 0.5 };
    const zoom = panelState.zoom !== undefined && panelState.zoom !== null ? panelState.zoom : framing.zoom;
    const fx = panelState.fx !== undefined ? panelState.fx : framing.fx;
    const fy = panelState.fy !== undefined ? panelState.fy : framing.fy;
    const ox = panelState.offsetX ?? 0;
    const oy = panelState.offsetY ?? 0;

    // Safety net: fill each panel with its theme tint before drawing the photo
    drawPanelGradeAndTint(ctx, poly, w, h, themeKey, idx);

    if (photo && (photo.complete || photo.naturalWidth)) {
      drawImageCover(ctx, photo, poly, zoom, ox, oy, fx, fy);
    } else {
      drawFallbackBackdrop(ctx, poly, w, h);
    }

    // Panel border / selection outline
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
    ctx.lineWidth = Math.max(3, Math.round(w * 0.0035));
    if (isEditor && idx === state.selectedPanel && !window.location.search?.includes('shot=cover')) {
      ctx.strokeStyle = '#00e5ff';
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#05050b';
      ctx.stroke();
    }
    ctx.restore();
  });

  // Halftone & vignette
  drawHalftoneAndVignette(ctx, w, h);

  // Caption Band Area & Scrim (bottom 20%)
  const bandY = h * 0.80;

  // Bottom scrim gradient
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.08, 0, h);
  scrim.addColorStop(0, 'rgba(3, 3, 8, 0)');
  scrim.addColorStop(0.3, 'rgba(3, 3, 8, 0.88)');
  scrim.addColorStop(1, 'rgba(3, 3, 8, 0.99)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.08, w, h - (bandY - h * 0.08));

  // Sunset gradient strip on top edge of caption block
  const stripHeight = Math.max(6, h * 0.012);
  const stripGrad = ctx.createLinearGradient(0, bandY, w, bandY);
  stripGrad.addColorStop(0, '#ff007f');
  stripGrad.addColorStop(0.33, '#ff7f00');
  stripGrad.addColorStop(0.66, '#ffcc00');
  stripGrad.addColorStop(1, '#00e5ff');
  ctx.fillStyle = stripGrad;
  ctx.fillRect(0, bandY, w, stripHeight);

  // Typography - Titles (larger: 8-9% of cover height)
  const title1 = (state.title1 || 'LEONIDA').toUpperCase();
  const title2 = (state.title2 || 'HEAT').toUpperCase();
  const tagline = (state.tagline || 'WELCOME BACK TO LEONIDA').toUpperCase();

  const fontSize = Math.round(h * 0.086); // ~8.6% of cover height
  const fontName = 'NotoSansDisplay, Impact, Arial Black, sans-serif';

  ctx.save();
  ctx.font = `900 ${fontSize}px ${fontName}`;
  ctx.textBaseline = 'top';

  const tx = w * 0.05;
  const ty1 = bandY + stripHeight + h * 0.012;
  const ty2 = ty1 + fontSize * 0.88;

  // Draw shadow
  ctx.fillStyle = '#d6005b';
  ctx.fillText(title1, tx + 4, ty1 + 4);
  ctx.fillText(title2, tx + 4, ty2 + 4);

  // Chrome gradient fill
  const chromeGrad = ctx.createLinearGradient(tx, ty1, tx, ty2 + fontSize);
  chromeGrad.addColorStop(0, '#ffffff');
  chromeGrad.addColorStop(0.3, '#fff3a0');
  chromeGrad.addColorStop(0.7, '#ff8800');
  chromeGrad.addColorStop(1, '#ff3300');

  ctx.lineWidth = Math.max(3, fontSize * 0.06);
  ctx.strokeStyle = '#000000';

  // Draw stroke then fill for title1
  ctx.strokeText(title1, tx, ty1);
  ctx.fillStyle = chromeGrad;
  ctx.fillText(title1, tx, ty1);

  // Draw stroke then fill for title2
  ctx.strokeText(title2, tx, ty2);
  ctx.fillStyle = chromeGrad;
  ctx.fillText(title2, tx, ty2);

  // Tagline beneath in letter-spaced uppercase
  const tagSize = Math.round(h * 0.024);
  ctx.font = `700 ${tagSize}px ${fontName}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  if (ctx.letterSpacing !== undefined) {
    ctx.letterSpacing = '3px';
  }
  
  const tagY = ty2 + fontSize * 0.94;
  ctx.fillText(tagline, tx, tagY);

  ctx.restore();
}

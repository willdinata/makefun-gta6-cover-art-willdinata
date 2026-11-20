// VICE FRAME - Panel Layout Geometry
// Defines multi-panel cover layouts returning arrays of polygons (each an array of [x, y] points).

export const LAYOUTS = [
  {
    name: 'Diagonal Six',
    id: 'diagonal-six',
    getPanels(w, h) {
      const H = h * 0.80; // reserve bottom for caption band
      return [
        // Panel 0: Large diagonal hero (left)
        [[0, 0], [w * 0.52, 0], [w * 0.42, H * 0.55], [0, H * 0.55]],
        // Panel 1: Upper right top
        [[w * 0.54, 0], [w, 0], [w, H * 0.26], [w * 0.44, H * 0.26]],
        // Panel 2: Upper right bottom
        [[w * 0.42, H * 0.28], [w, H * 0.28], [w, H * 0.55], [w * 0.40, H * 0.55]],
        // Panel 3: Bottom left
        [[0, H * 0.57], [w * 0.32, H * 0.57], [w * 0.30, H], [0, H]],
        // Panel 4: Bottom mid
        [[w * 0.34, H * 0.57], [w * 0.66, H * 0.57], [w * 0.64, H], [w * 0.32, H]],
        // Panel 5: Bottom right
        [[w * 0.68, H * 0.57], [w, H * 0.57], [w, H], [w * 0.66, H]],
      ];
    },
    getFraming(idx) {
      const presets = [
        { zoom: 1.0, fx: 0.5, fy: 0.5 }, // 0: Hero full scene
        { zoom: 1.25, fx: 0.25, fy: 0.3 }, // 1: Upper right top
        { zoom: 1.4, fx: 0.75, fy: 0.4 },  // 2: Upper right bottom
        { zoom: 1.3, fx: 0.2, fy: 0.7 },   // 3: Bottom left
        { zoom: 1.5, fx: 0.5, fy: 0.6 },   // 4: Bottom mid
        { zoom: 1.6, fx: 0.8, fy: 0.7 },   // 5: Bottom right
      ];
      return presets[idx % presets.length];
    }
  },
  {
    name: 'Hero Boulevard',
    id: 'hero-boulevard',
    getPanels(w, h) {
      const H = h * 0.80;
      return [
        // Panel 0: Wide hero top
        [[0, 0], [w, 0], [w, H * 0.55], [0, H * 0.55]],
        // Panel 1: Bottom left
        [[0, H * 0.57], [w * 0.32, H * 0.57], [w * 0.32, H], [0, H]],
        // Panel 2: Bottom mid
        [[w * 0.34, H * 0.57], [w * 0.66, H * 0.57], [w * 0.66, H], [w * 0.34, H]],
        // Panel 3: Bottom right
        [[w * 0.68, H * 0.57], [w, H * 0.57], [w, H], [w * 0.68, H]],
      ];
    },
    getFraming(idx) {
      const presets = [
        { zoom: 1.0, fx: 0.5, fy: 0.4 },  // 0: Wide hero top
        { zoom: 1.3, fx: 0.25, fy: 0.7 },  // 1: Bottom left
        { zoom: 1.5, fx: 0.5, fy: 0.6 },   // 2: Bottom mid
        { zoom: 1.4, fx: 0.75, fy: 0.7 },  // 3: Bottom right
      ];
      return presets[idx % presets.length];
    }
  },
  {
    name: 'Triple Strip',
    id: 'triple-strip',
    getPanels(w, h) {
      const H = h * 0.80;
      return [
        // Panel 0: Left strip with angled top
        [[0, H * 0.12], [w * 0.32, 0], [w * 0.32, H], [0, H]],
        // Panel 1: Middle strip
        [[w * 0.34, H * 0.12], [w * 0.66, 0], [w * 0.66, H], [w * 0.34, H]],
        // Panel 2: Right strip
        [[w * 0.68, H * 0.12], [w, 0], [w, H], [w * 0.68, H]],
      ];
    },
    getFraming(idx) {
      const presets = [
        { zoom: 1.2, fx: 0.25, fy: 0.5 },  // 0: Left strip
        { zoom: 1.0, fx: 0.5, fy: 0.5 },   // 1: Middle hero strip
        { zoom: 1.4, fx: 0.75, fy: 0.5 },  // 2: Right strip
      ];
      return presets[idx % presets.length];
    }
  },
];

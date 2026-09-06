// Static image assets baked from user-supplied 3D models (see
// DEVELOPMENT.md "Art assets" section for how tree-*.png / meadow-tile.png
// were produced). Loaded once at startup; renderer code checks readiness
// via get() rather than assuming synchronous availability, since image
// decode is asynchronous even for same-origin local files.
const ASSET_PATHS = {
  'tree-spring': 'assets/tree-spring.png',
  'tree-summer': 'assets/tree-summer.png',
  'tree-autumn': 'assets/tree-autumn.png',
  'tree-winter': 'assets/tree-winter.png',
  'meadow-tile': 'assets/meadow-tile.png',
};

export class AssetLoader {
  constructor() {
    this.images = {};
    for (const [key, path] of Object.entries(ASSET_PATHS)) {
      const img = new Image();
      img.src = path;
      this.images[key] = img;
    }
  }

  // Returns the HTMLImageElement if fully decoded and ready to draw, else null.
  get(key) {
    const img = this.images[key];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }
}

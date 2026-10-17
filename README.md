# Pixels — Professional Browser-Based Image Editor

Pixels is a powerful, modern, browser-based creative image editor inspired by desktop software like Adobe Photoshop, Photopea, and Affinity Photo. It runs 100% locally in your browser with zero backend requirements and no image uploads to external servers.

![Pixels Logo](./public/favicon.svg)

---

## Key Features

- **Document & Multi-Layer System**:
  - Raster layers, editable text layers, and vector shape layers (Rectangles, Ellipses, Lines).
  - Layer reordering, duplicating, renaming, locking, and visibility toggling.
  - Stacking order compositing with 12 native blend modes (Normal, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge, Color Burn, Hard Light, Soft Light, Difference, Exclusion).
  - Layer opacity control, Merge Down, and Flatten Image capabilities.

- **Creative Editing Tools**:
  - **Move Tool (V)**: Free movement and positioning of active layers.
  - **Selection Tools (M / Shift+M)**: Rectangular and elliptical marquee selection with marching ants visual boundary and Replace/Add/Subtract modes.
  - **Brush Tool (B)**: Smooth, continuous interpolated strokes with configurable size, opacity, softness/hardness, and color.
  - **Pencil Tool (P)**: Crisp hard-edged pixel-level precision drawing.
  - **Eraser Tool (E)**: Erases non-destructively on active editable raster layers respecting opacity, hardness, and transparency.
  - **Crop Tool (C)**: Interactive on-canvas crop rectangle with aspect-ratio presets (Free, 1:1, 16:9, 4:3, 3:2) and instant document resizing.
  - **Text Tool (T)**: Multiline editable text with font family, size, fill color, bold, italic, underline, and alignment controls.
  - **Shape Tools (U)**: Editable rectangles, ellipses, and lines with custom fill, stroke, and stroke width.
  - **Eyedropper Tool (I)**: Instant visible composite color sampling under the pointer.
  - **Zoom (Z) & Hand (H)**: Smooth canvas navigation with mouse wheel, spacebar pan, 100% actual size, and fit-to-screen.

- **Filters & Color Adjustments**:
  - **Color & Tone**: Brightness, Contrast, Saturation, Hue Shift, Exposure, Temperature & Tint, Grayscale, Sepia, Invert.
  - **Advanced Color**: Levels (Input Shadows/Highlights, Gamma, Output Blacks/Whites) and Color Balance (Cyan-Red, Magenta-Green, Yellow-Blue with Luminosity preservation).
  - **Spatial Filters**: High-performance separable Gaussian Blur, Sharpen, Sobel Edge Detection, Pixelate, and Noise.
  - **Worker Acceleration**: Computationally heavy pixel filters run off the main thread via Web Workers with zero-copy buffer transfer and synchronous fallback.
  - **Selection Awareness**: Filters and adjustments automatically constrain to active marquee selections.

- **Command History & Undo/Redo**:
  - Command-based history engine with bounded memory.
  - Interactive History Panel allowing instantaneous jumping to any previous edit state.
  - Full Undo (`Ctrl+Z`) and Redo (`Ctrl+Y` / `Ctrl+Shift+Z`) support for all editing operations.

- **Persistence & Export**:
  - **Native `.pixels` Project Format**: Extensible ZIP-based format bundling document manifest (`project.json`) and raw PNG assets for full offline restoration.
  - **IndexedDB Autosave**: Background autosave recovering uncommitted session state on page reloads.
  - **Recent Projects**: Visual landing screen list of recent projects with thumbnail previews.
  - **Multi-Format Export**: High-resolution PNG (preserving alpha transparency), JPEG (with quality slider and opaque background fill), and WebP (with modern compression) at custom scale factors.

---

## Technology Stack

- **Framework**: React 19, TypeScript (strict mode)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS with custom slate/charcoal desktop design system
- **Icons**: Lucide React
- **State Management**: Zustand
- **Image Compositing**: Canvas 2D API (`OffscreenCanvas` & `HTMLCanvasElement`)
- **Background Processing**: Web Workers with transferable buffers
- **Persistence**: IndexedDB (`idb`) & JSZip
- **Testing**: Vitest, React Testing Library, and Playwright E2E

---

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 3. Run Unit and Component Tests

```bash
npm test
```

### 4. Build for Production

```bash
npm run build
```

The production assets will be output to `./dist/`.

### 5. Run End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

---

## GitHub Pages Deployment

The repository is pre-configured with:
1. Relative base path (`base: './'`) in `vite.config.ts`, ensuring assets load properly on both custom domains (such as `pixels.jeremia.tech`) and subpaths (such as `https://username.github.io/pixels/`).
2. Custom domain `CNAME` file in `public/CNAME`.
3. Automated GitHub Actions workflow in `.github/workflows/deploy.yml`.

### Enabling GitHub Pages on GitHub:
1. Push your changes to the `main` branch.
2. In your repository on GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The deployment workflow will automatically run, run tests, build the application, and publish it to GitHub Pages.

---

## License

MIT

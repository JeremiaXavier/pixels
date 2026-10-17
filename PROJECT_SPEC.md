# Project: Pixels — Professional Browser-Based Image Editor

## 1. Project Objective

Build **Pixels**, a powerful, professional, browser-based image editor inspired by desktop applications such as Adobe Photoshop, Photopea, and Affinity Photo.

The application must provide a modern, polished interface and a practical image-editing workflow, including layers, selections, drawing tools, image adjustments, filters, transformations, undo/redo, and export options.

This is a complete application rebuild. The existing project implementation is buggy and must not be treated as the foundation for the new application.

**Delete the existing application implementation and create a completely new project structure.**

The final application must be deployable as a static website on GitHub Pages, with all image processing performed locally in the user's browser.

Do not build a mockup, landing-page-only application, or collection of nonfunctional buttons. Build a real, working image editor.

---

## 2. Mandatory Requirements

- Build the application from scratch.
- Use a modern React and TypeScript architecture.
- Use suitable libraries for canvas rendering, image manipulation, state management, UI components, and testing.
- All image editing must happen locally in the browser.
- Do not require a backend, database server, authentication service, or cloud storage.
- Do not upload user images to external services.
- Do not use external APIs for image processing.
- Support GitHub Pages deployment.
- Use modular, maintainable, strongly typed code.
- Prioritize functional correctness, editing performance, and a professional user experience.
- Do not leave placeholder tools, fake filters, or buttons that only display notifications.
- Avoid unnecessary architecture complexity and unnecessary dependencies.
- Do not stop after generating the project scaffold. Implement the application, test it, fix issues, and prepare it for deployment.

## 3. Start From a Completely Clean Project

Before implementation, inspect the project directory and understand its structure.

Then:

1. Identify the project root and existing application files.
2. Remove the old application implementation, obsolete UI components, legacy scripts, and conflicting build configuration.
3. Create a new, clean project structure.
4. Reinitialize the application around the selected modern stack.
5. Install the required dependencies and verify their compatibility.
6. Implement the new application from the ground up.

Important safeguards:

- Preserve the `.git` directory and Git history.
- Preserve the repository's license, README history where relevant, and repository metadata.
- Preserve environment files, credentials, SSH keys, and unrelated user files.
- Do not delete files outside the project.
- Do not delete the repository configuration merely for the sake of cleaning the application.
- Do not blindly run destructive shell commands.
- Inspect each deletion target before removing it.
- Remove old application code when it conflicts with the new implementation rather than trying to patch or reuse the buggy editor.
- Update the existing repository's build configuration as needed for GitHub Pages.

After cleaning the application, create a new architecture and implementation. Do not carry forward the old editor's buggy code.

## 4. Technology Stack

Use the following stack unless a specific compatibility issue makes an alternative necessary.

### Core application

- React
- TypeScript with strict type checking
- Vite
- React Router only if routing is genuinely needed

### UI and styling

- Tailwind CSS
- shadcn/ui
- Radix UI primitives through shadcn/ui
- Lucide React icons
- CSS variables for theme tokens
- A consistent design system for colors, spacing, typography, borders, and controls

### State management

- Zustand for application and editor state
- Separate document state from temporary interface state
- Use immutable, predictable state transitions

### Canvas and image rendering

Evaluate and select one primary canvas interaction library:

- Fabric.js, or
- Konva.js with React integration.

Choose the library that best supports editable objects, selections, transformations, layers, and a maintainable editing architecture. Do not combine competing canvas frameworks unnecessarily.

Use the native Canvas 2D API where appropriate for pixel operations, image processing, previews, and compositing. Consider WebGL or WebGPU only where they provide a measurable benefit and are practical to support.

### Persistence and background processing

- IndexedDB for local project persistence and larger binary assets
- Web Workers for expensive image-processing operations
- `OffscreenCanvas` where supported, with suitable fallbacks
- Blob, File, ImageBitmap, Canvas, and object URLs for browser-native image workflows

### Testing and quality

- Vitest
- React Testing Library
- Playwright for browser-level end-to-end tests
- ESLint
- Prettier

Do not introduce a library simply because it is available. Every dependency should have a clear purpose.

## 5. Architecture

Organize the application into independent, maintainable modules.

Suggested structure:

```text
pixels/
├── public/
│   ├── favicon.svg
│   └── assets/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dialogs/
│   │   └── common/
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── EditorHeader.tsx
│   │   ├── MenuBar.tsx
│   │   ├── Toolbar.tsx
│   │   ├── OptionsBar.tsx
│   │   ├── CanvasWorkspace.tsx
│   │   ├── LayersPanel.tsx
│   │   ├── PropertiesPanel.tsx
│   │   ├── AdjustmentsPanel.tsx
│   │   ├── HistoryPanel.tsx
│   │   └── StatusBar.tsx
│   ├── canvas/
│   │   ├── CanvasEngine.ts
│   │   ├── Renderer.ts
│   │   ├── Viewport.ts
│   │   ├── Compositor.ts
│   │   └── CoordinateSystem.ts
│   ├── document/
│   │   ├── Document.ts
│   │   ├── Layer.ts
│   │   ├── Selection.ts
│   │   ├── ProjectSerializer.ts
│   │   └── documentTypes.ts
│   ├── tools/
│   │   ├── ToolManager.ts
│   │   ├── BrushTool.ts
│   │   ├── EraserTool.ts
│   │   ├── SelectionTool.ts
│   │   ├── CropTool.ts
│   │   ├── TextTool.ts
│   │   ├── ShapeTool.ts
│   │   └── EyedropperTool.ts
│   ├── filters/
│   │   ├── FilterRegistry.ts
│   │   ├── colorAdjustments.ts
│   │   ├── blurFilters.ts
│   │   ├── sharpenFilters.ts
│   │   └── effects.ts
│   ├── history/
│   │   ├── HistoryManager.ts
│   │   └── commands.ts
│   ├── workers/
│   │   ├── imageProcessing.worker.ts
│   │   └── workerClient.ts
│   ├── storage/
│   │   ├── IndexedDBStorage.ts
│   │   └── ProjectRepository.ts
│   ├── export/
│   │   ├── ExportManager.ts
│   │   └── formatters.ts
│   ├── store/
│   │   ├── editorStore.ts
│   │   ├── documentStore.ts
│   │   └── preferencesStore.ts
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── test/
│   ├── main.tsx
│   └── index.css
├── tests/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

This is a proposed structure, not a requirement to create empty files for every item. Create modules as their functionality is implemented.

Avoid putting the entire editor into a single React component. Separate the rendering engine, document model, tools, history, filters, persistence, and UI.

## 6. Product Design and Visual Direction

Pixels should look like a professional desktop-class creative application running in the browser.

The interface should be inspired by the usability of professional image editors without copying another product's branding or exact layout.

### Visual style

- Modern, minimal, professional, and precise.
- Neutral charcoal or slate editor chrome with clear visual hierarchy.
- Light canvas workspace surrounding the document.
- Restrained accent color for active tools and selections.
- Solid colors rather than gradients.
- No excessive glassmorphism, glowing borders, animated backgrounds, or decorative effects.
- Consistent spacing and alignment.
- Sharp, readable typography.
- Compact, high-quality tool icons.
- Clear hover, active, selected, disabled, and focus states.
- Subtle borders and restrained shadows.
- Consistent corner radii.
- Smooth but restrained transitions.

The editor workspace should prioritize usable canvas area. Avoid oversized navigation, large cards, excessive whitespace, or dashboard-style layouts that waste screen space.

### Main desktop layout

Build the following interface:

1. **Top application bar**
   - Pixels logo and application name.
   - Current document name.
   - Save status.
   - Undo and redo.
   - Zoom controls.
   - Export button.
   - Settings or workspace controls where appropriate.

2. **Menu bar**
   - File
   - Edit
   - Image
   - Layer
   - Select
   - Filter
   - View
   - Help

   Every implemented menu item must perform the correct action. Disable unavailable commands rather than presenting fake functionality.

3. **Left toolbar**
   - Move
   - Selection
   - Marquee selection
   - Brush
   - Pencil
   - Eraser
   - Crop
   - Text
   - Shapes
   - Eyedropper
   - Zoom
   - Hand/pan

   Group related tools logically and use tooltips with keyboard shortcuts.

4. **Contextual options bar**

   Display settings relevant to the currently selected tool, such as brush size, opacity, hardness, color, selection mode, font, shape fill, or stroke.

5. **Central canvas workspace**

   - Neutral workspace background.
   - Centered document when appropriate.
   - Checkerboard transparency background.
   - Zoom and pan.
   - Scrollbars or navigational controls where appropriate.
   - Clear visual distinction between the image and surrounding workspace.

6. **Right sidebar**

   Use resizable panels for:
   - Layers
   - Properties
   - Adjustments
   - History
   - Color controls

   Tabs may be used to conserve space. Users should be able to resize or collapse appropriate panels.

7. **Bottom status bar**

   - Document dimensions.
   - Zoom percentage.
   - Cursor coordinates when useful.
   - Active tool.
   - Image or selection information where relevant.

### Responsive behavior

Desktop is the primary editing experience.

For smaller screens, reorganize sidebars into collapsible panels or drawers. Ensure basic navigation and essential tools remain accessible. Do not allow panels to obscure the document permanently.

Support keyboard navigation and visible focus states. Use accessible labels for icon-only buttons.

## 7. Welcome Screen and Project Creation

When no document is open, show a polished welcome screen.

Include:

- Create New
- Open Image
- Open Project
- Recent Projects
- Drag-and-drop import area
- Sample image or example project only if bundled locally
- A concise explanation that editing occurs in the browser

### New document dialog

Allow users to configure:

- Document name
- Width
- Height
- Preset dimensions
- Transparent or solid-color background
- Background color
- Resolution metadata where applicable

Include common presets such as square, portrait, landscape, social-media graphics, and custom dimensions.

Validate dimensions and memory requirements before allocating large canvases.

### Opening files

Support importing:

- PNG
- JPEG/JPG
- WebP

Use the browser's native file picker. Support dragging files into the workspace and pasting compatible images from the clipboard.

Preserve the original image dimensions and aspect ratio during import. Handle unsupported files, corrupted files, excessive dimensions, and decoding failures gracefully.

Do not send images to a server.

## 8. Document and Layer System

Implement a real document model rather than treating the entire editor as one flattened image.

A document should contain:

- Unique identifier
- Name
- Width and height
- Background configuration
- Ordered layer collection
- Active layer
- Selection state
- Viewport state where appropriate
- Document metadata
- Undo/redo history
- Dirty or unsaved state

### Layers panel

Each layer should support, as appropriate:

- Visibility toggle
- Layer name
- Selection and activation
- Reordering
- Duplicate
- Rename
- Delete
- Opacity
- Lock/unlock
- Raster image layers
- Text layers
- Shape layers
- Background layers

Include controls for creating a new layer and duplicating the active layer.

Prevent destructive or invalid operations, such as deleting a required background layer without a supported alternative.

### Compositing

Render layers in the correct stacking order.

Support alpha transparency and layer opacity. Add common blend modes such as Normal, Multiply, Screen, Overlay, and Darken/Lighten where the rendering architecture can implement them correctly.

Do not present blend modes as functional if they are only changing a stored label.

Layer visibility, ordering, opacity, and supported blend modes must affect the rendered result and exported image.

### Layer editing

Editing one layer must not unintentionally modify unrelated layers.

Implement a clear distinction between selecting an object, selecting a layer, and editing pixels on a raster layer.

## 9. Core Editing Tools

Implement each tool as a separate module with a clear lifecycle and consistent interaction behavior.

### Move tool

- Move supported objects or layers.
- Display selection outlines or transform handles where appropriate.
- Provide predictable snapping or alignment behavior if implemented.

### Brush tool

- Draw freehand strokes.
- Configure brush size.
- Configure opacity.
- Configure hardness or edge softness.
- Select foreground color.
- Support continuous strokes.
- Ensure undo restores the image correctly.

### Pencil tool

- Draw hard-edged strokes.
- Support configurable size and color.
- Avoid unwanted smoothing when pixel-like drawing is intended.

### Eraser tool

- Erase on the active editable raster layer.
- Respect brush size and opacity.
- Preserve transparency.
- Never erase unrelated layers.

### Selection tools

Implement rectangular marquee selection first, followed by additional supported selection types.

- Create selections.
- Replace, add to, and subtract from selections.
- Clear the active selection.
- Invert the selection where supported.
- Restrict supported editing operations to the selected region.

Display a clear selection boundary.

### Crop tool

- Draw and adjust a crop rectangle.
- Support aspect-ratio constraints.
- Confirm or cancel the crop.
- Apply cropping to the document or the explicitly selected scope according to the chosen behavior.
- Update dimensions and layer content consistently.
- Preserve undo capability.

### Text tool

- Create editable text objects.
- Configure font family from locally available browser fonts.
- Configure font size, color, alignment, and supported styling.
- Edit existing text.
- Move and transform text.
- Render text correctly during export.

Text should remain editable as a text layer until a user explicitly rasterizes it or performs an operation requiring rasterization.

### Shape tools

Support basic shapes:

- Rectangle
- Ellipse
- Line

Configure fill color, stroke color, and stroke width where applicable.

Keep supported shapes editable as objects when practical.

### Eyedropper

Sample visible canvas colors and update the foreground color.

Correctly account for the visible composited result rather than always sampling only the active layer.

### Zoom and hand tools

- Zoom in and out.
- Fit document to workspace.
- Display actual size.
- Pan around large documents.
- Support keyboard shortcuts and mouse-wheel zoom where appropriate.
- Preserve the position under the pointer during zoom when practical.

### Tool consistency

All tools should provide consistent pointer interactions, keyboard behavior, visual feedback, and undo integration.

## 10. Image Transformations

Implement:

- Resize image dimensions.
- Resize canvas dimensions.
- Rotate 90 degrees clockwise.
- Rotate 90 degrees counterclockwise.
- Rotate 180 degrees.
- Flip horizontally.
- Flip vertically.
- Free rotation where supported.
- Scale and transform the selected layer or object.
- Maintain aspect ratio when requested.
- Preview dimensions before applying changes.

Clearly distinguish image resizing from canvas resizing.

Image resizing changes image content and dimensions. Canvas resizing changes the document boundaries and must use an explicit anchor or positioning policy.

All destructive transformations must be undoable.

## 11. Filters and Image Adjustments

Build a real filter system with reusable filter implementations and consistent parameters.

### Essential adjustments

Implement:

- Brightness
- Contrast
- Saturation
- Hue
- Exposure where practical
- Gamma where practical
- Grayscale
- Sepia
- Invert
- Opacity

### Essential filters

Implement:

- Gaussian blur
- Box blur if useful
- Sharpen
- Pixelate
- Basic noise effect if practical
- Edge detection where practical

### Adjustment workflow

- Display adjustment controls in a dedicated panel or dialog.
- Provide live or preview rendering where feasible.
- Include Apply and Cancel actions for destructive previews.
- Allow resetting individual adjustments.
- Preserve undo/redo.
- Apply adjustments to the intended layer or selection.
- Avoid blocking the main interface during expensive operations.

### Advanced image adjustments

After the essential tools are reliable, implement more advanced features incrementally:

- Levels
- Curves
- Color balance
- Temperature and tint
- Selective color controls where feasible

Advanced adjustments must have meaningful mathematical implementations and correct previews. Do not simulate advanced controls by changing unrelated basic parameters.

## 12. Undo, Redo, and History

Implement a reliable command-based history system.

Support undo and redo for all essential operations, including:

- Drawing
- Erasing
- Moving
- Cropping
- Transforming
- Layer creation and deletion
- Layer visibility changes
- Layer opacity changes
- Text editing
- Shape creation
- Image adjustments
- Filters
- Document dimension changes

The history panel should show meaningful action names and allow returning to supported previous states.

Use efficient history storage. Avoid duplicating the entire full-resolution document for every small action when a more efficient representation is practical.

For brush strokes, consider recording stroke commands, affected regions, or suitable checkpoints.

Set reasonable history memory limits and release unused resources.

If an operation fails, do not leave the history or document in a partially updated state.

## 13. Selection-Aware Editing and Masks

After core layers, tools, and history are stable, implement more advanced selection and masking capabilities.

Potential features:

- Elliptical selection
- Polygonal selection
- Selection feathering
- Selection expansion and contraction
- Selection intersection
- Layer masks
- Mask editing
- Invert mask
- Non-destructive masking where supported

Masks must influence actual compositing and export. Do not implement them as decorative grayscale thumbnails.

Clearly communicate which advanced selection or masking operations are supported and which are not.

## 14. Local Project Persistence

Provide a native project format for reopening work later.

### Project format

Define a versioned project format that can serialize:

- Document metadata
- Dimensions
- Layer structure
- Raster assets
- Editable text and shape data
- Supported masks and adjustments
- Visibility and opacity
- Supported blend modes
- Relevant document settings

Use a documented project extension such as `.pixels`.

Use a ZIP-based archive with JSON metadata and binary assets if practical. If choosing a simpler format initially, make the format versioned and extensible.

### Save and open project

- Save project locally.
- Open an existing Pixels project.
- Validate imported project files.
- Handle unsupported format versions.
- Handle corrupted or incomplete project data.
- Warn before losing unsaved changes.

### Autosave and recent projects

Use IndexedDB for optional local autosave and recent project metadata.

- Show the current save state.
- Avoid showing “Saved” before persistence succeeds.
- Recover from unexpected page reloads where possible.
- Allow users to remove recent-project entries.
- Provide an option to clear local project data.
- Keep all project data on the user's device.

Do not assume browser local storage is unlimited. Handle quota errors and storage failures gracefully.

Do not upload projects to GitHub Pages or any external storage service.

## 15. Export System

Implement a dedicated export dialog.

Support:

- PNG
- JPEG
- WebP

Include:

- Output filename
- Output format
- Quality setting for JPEG and WebP
- Final dimensions
- Transparency information
- Export and Cancel actions

PNG should preserve transparency.

JPEG should use a defined background color where transparency cannot be preserved.

WebP quality settings should be applied where supported by the browser.

Export must render the correct visible composite, including supported layers, text, shapes, opacity, blend modes, masks, and adjustments.

Use a browser-native download mechanism. Do not send exported images to an external service.

Test that exported images open correctly and have the expected dimensions.

## 16. Performance and Memory Management

The application must remain responsive when working with reasonably large images.

Implement:

- Separate display rendering from expensive pixel processing where practical.
- Efficient canvas redraws.
- Avoid unnecessary React rerenders during pointer movement.
- Keep pointer-move operations out of broad application-state updates.
- Use workers for computationally expensive filters where beneficial.
- Use previews for expensive adjustments when appropriate.
- Manage object URLs and revoke them when no longer required.
- Release obsolete canvas, image, and bitmap resources.
- Validate dimensions before allocating large buffers.
- Avoid excessive full-resolution image copies.
- Handle worker failures and unsupported browser features gracefully.

Use a reasonable maximum canvas size based on browser capabilities and memory constraints. Display understandable errors when an operation exceeds available resources.

Do not claim that arbitrary image sizes are supported.

## 17. Keyboard Shortcuts

Implement a consistent shortcut system.

At minimum, provide suitable shortcuts for:

- Undo
- Redo
- Save project
- Open image
- Export
- Brush
- Eraser
- Move
- Selection
- Crop
- Text
- Zoom in
- Zoom out
- Fit to screen
- Deselect
- Delete selected object or layer where appropriate

Avoid triggering editor shortcuts while the user is typing into a text field, dialog input, or editable text object, unless the shortcut is explicitly intended to work there.

Show shortcuts in tooltips and menus. Add a keyboard-shortcut reference accessible through Help.

## 18. File, Edit, Image, Layer, Select, Filter, and View Menus

Implement menus that correspond to actual application commands.

### File

- New
- Open Image
- Open Project
- Save Project
- Save Project As
- Export
- Close Document

### Edit

- Undo
- Redo
- Cut, Copy, Paste where supported
- Clear selection contents where supported
- Keyboard shortcuts

### Image

- Image Size
- Canvas Size
- Rotate
- Flip

### Layer

- New Layer
- Duplicate Layer
- Rename Layer
- Delete Layer
- Merge Down where implemented
- Flatten Image where implemented

### Select

- Select All
- Deselect
- Invert Selection
- Selection modification commands when implemented

### Filter

- Blur
- Sharpen
- Pixelate
- Other implemented filter categories

### View

- Zoom In
- Zoom Out
- Fit to Screen
- Actual Size
- Toggle supported panels
- Show or hide supported guides and overlays

Do not expose unfinished commands as if they work. Disable them or omit them until implemented.

## 19. Error Handling and User Feedback

Build consistent user feedback for:

- Unsupported image formats
- Image decoding failures
- Project import errors
- Project save failures
- IndexedDB quota errors
- Worker errors
- Canvas allocation failures
- Invalid dimensions
- Unsupported browser features
- Export errors

Use clear messages with actionable next steps.

Do not use alert dialogs for every routine interaction. Prefer accessible toasts, inline validation, and well-designed confirmation dialogs where appropriate.

Use confirmations for destructive actions that could lose work.

Ensure errors do not corrupt the current document or permanently freeze the editor.

## 20. GitHub Pages Deployment

The application must be deployable as a static website using GitHub Pages.

Configure Vite with a correct deployment base path.

Do not assume the application is hosted at the domain root. GitHub Pages project repositories commonly use a path such as:

`https://username.github.io/repository-name/`

The build must work correctly under a repository subpath.

Implement:

- Correct Vite `base` configuration.
- Reliable asset paths.
- A production build command.
- A GitHub Actions workflow for deployment.
- Correct permissions for the deployment workflow.
- Build artifact upload and Pages deployment.
- A README explaining how to enable GitHub Pages.
- Instructions for updating and redeploying the application.

Avoid unnecessary server-dependent routing. Prefer a simple navigation model that works when hosted as static files.

The deployed application must not depend on a custom server, server-side rendering, or runtime API endpoints.

Test the production build, not just the development server.

## 21. Offline and Privacy Requirements

The editor should function without a backend and should remain usable offline after the application assets have been cached, if a service worker is implemented.

If implementing offline caching:

- Cache only the application shell and required static assets.
- Do not cache sensitive user image data in shared or unnecessary caches.
- Keep project persistence in browser-local storage mechanisms.
- Provide a clear way to clear local projects and cached application data where practical.
- Avoid aggressive cache behavior that prevents users from receiving updates.

Do not add analytics, advertising trackers, external image uploads, or remote AI services.

Any optional external font or asset dependency should be avoided when a bundled or system alternative is reasonable.

Privacy should be reflected in the implementation, not merely in a statement on the welcome screen.

## 22. Accessibility and Usability

Implement:

- Accessible names for icon buttons.
- Keyboard-accessible menus and dialogs.
- Visible focus indicators.
- Logical tab order.
- Appropriate dialog focus management.
- Clear contrast between text and background.
- Tooltips for icon-only controls.
- Clear disabled states.
- Keyboard shortcuts that do not interfere with typing.
- Screen-reader labels for important controls.

Avoid relying on color alone to communicate errors, selections, or active states.

## 23. Testing Requirements

Write tests for important behavior rather than only testing whether components render.

### Unit tests

Test:

- Document initialization
- Layer ordering
- Layer visibility
- Layer opacity
- Supported compositing behavior
- Selection boundaries
- Undo/redo correctness
- Image transformations
- Filter calculations
- Export dimensions and formats
- Project serialization and deserialization
- Invalid project handling
- Dimension validation

### Component tests

Test:

- Tool selection
- Layer selection
- Layer visibility toggles
- Brush options
- Adjustment controls
- Export dialog
- New-document dialog
- Unsaved-change confirmation
- Keyboard shortcut handling

### End-to-end tests

Use Playwright to verify workflows such as:

1. Open Pixels.
2. Create a new document.
3. Import an image.
4. Draw on a layer.
5. Create a second layer.
6. Change layer visibility.
7. Undo and redo an edit.
8. Apply an image adjustment.
9. Export the composite.
10. Save and reopen a project.

Verify that the core workflows work in a real browser.

Run TypeScript checks, linting, unit tests, and the production build. Fix errors instead of ignoring or suppressing them.

## 24. Implementation Phases

Work through these phases in order. Do not skip foundational functionality in favor of visually impressive but incomplete advanced features.

### Phase 1: Clean rebuild

- Inspect the project.
- Safely remove the old application implementation.
- Initialize React, TypeScript, and Vite.
- Configure Tailwind and shadcn/ui.
- Install selected dependencies.
- Establish strict typing, linting, and formatting.
- Create the basic application shell.
- Confirm that the app starts and builds successfully.

### Phase 2: Professional editor interface

- Implement the welcome screen.
- Implement the top bar and menus.
- Implement the left toolbar.
- Implement the options bar.
- Implement the central workspace.
- Implement resizable side panels.
- Implement the status bar.
- Establish the visual design system.
- Ensure the UI responds correctly to selection and editor state.

### Phase 3: Document and rendering foundation

- Implement the document model.
- Implement image import.
- Implement canvas sizing.
- Implement zoom and pan.
- Implement transparency rendering.
- Implement a real rendering and compositing pipeline.
- Establish layer coordinate systems.
- Add memory and dimension safeguards.

### Phase 4: Core editing

- Implement move, brush, pencil, eraser, crop, selection, text, shape, and eyedropper tools.
- Implement editable layers.
- Implement transformations.
- Implement layer properties.
- Ensure operations update the actual rendered document.

### Phase 5: History and filters

- Implement command-based undo/redo.
- Implement history display.
- Implement essential image adjustments.
- Implement essential filters.
- Add previews and cancellation where appropriate.
- Ensure all operations integrate correctly with history.

### Phase 6: Project management and export

- Implement save and open project.
- Implement IndexedDB persistence.
- Implement autosave where practical.
- Implement recent projects.
- Implement PNG, JPEG, and WebP export.
- Validate that reopening a project restores the supported editable state.

### Phase 7: Advanced features

Implement advanced features incrementally:

- Additional selection modes
- Layer masks
- Blend modes
- Levels and curves
- Color balance
- Additional filters
- More advanced transforms

Only add features that can be implemented correctly and tested.

### Phase 8: Performance and refinement

- Optimize rendering.
- Add workers where beneficial.
- Improve large-image handling.
- Verify keyboard shortcuts.
- Refine accessibility.
- Improve empty, loading, error, and confirmation states.
- Remove unused dependencies and code.
- Ensure no dead controls remain.

### Phase 9: Testing and deployment

- Run all checks.
- Fix errors.
- Test primary workflows.
- Verify the production build.
- Configure GitHub Actions.
- Verify base-path compatibility.
- Document deployment and usage in README.

At the end of every phase, ensure the project remains runnable and type-checks successfully before proceeding.

## 25. Definition of Done

The project is complete only when the following conditions are satisfied:

- [ ] The old application implementation has been replaced by a clean, new application.
- [ ] The app uses React and TypeScript.
- [ ] The application starts locally.
- [ ] The interface looks and behaves like a professional image editor.
- [ ] A user can create a document and import an image.
- [ ] The canvas displays the correct image.
- [ ] Zoom and pan work.
- [ ] Core tools perform real editing operations.
- [ ] Layers affect the actual composite.
- [ ] Layer visibility and opacity work.
- [ ] Transformations update the document correctly.
- [ ] Essential filters and adjustments work.
- [ ] Undo and redo restore correct document states.
- [ ] Projects can be saved locally and reopened.
- [ ] Exported images have the correct content and dimensions.
- [ ] The application does not upload images to a backend.
- [ ] No backend is required for editing.
- [ ] Expensive operations are handled without unnecessarily blocking the UI.
- [ ] Errors are handled without corrupting the document.
- [ ] Essential tests pass.
- [ ] TypeScript checks pass.
- [ ] Linting passes.
- [ ] The production build succeeds.
- [ ] GitHub Pages deployment is configured and documented.
- [ ] All essential visible controls work.
- [ ] No misleading placeholder features remain.

## 26. Final Working Instructions

Act as a senior frontend engineer, graphics-programming engineer, and product designer.

First inspect the existing project, then perform the safe cleanup, establish the new architecture, and implement the application.

Do not merely describe what should be built. Make the actual changes in the project workspace.

Do not stop after producing a plan or scaffolding. Continue until the essential editing workflows are implemented and tested.

Use judgment when choosing implementation details, but prioritize working functionality over an unnecessarily large feature list.

If a feature cannot be implemented reliably within the available architecture or browser constraints, document the limitation and do not present it as complete.

Do not replace real image-editing behavior with static screenshots, mock data, or controls that only update their own labels.

Do not introduce a backend or external image-processing dependency.

Keep the application maintainable, modular, and extensible so more advanced image-editing capabilities can be added later.

When finished, provide a concise implementation report covering:

1. The new project architecture.
2. The tools and editing features actually implemented.
3. The libraries and key technical decisions.
4. The tests and build checks performed, including any failures.
5. Any remaining limitations.
6. The commands to run the application locally.
7. The exact steps to deploy the project to GitHub Pages.

**Start by inspecting the project and safely removing the old application implementation. Then build Pixels from scratch.**

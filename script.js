// =====================================
// PIXELS PHOTO EDITOR - Main JavaScript
// =====================================

// Global Variables
let canvas, ctx, originalImage;
let croppingMode = false;
let flipH = 1, flipV = 1;
let cropArea = { x: 0, y: 0, width: 0, height: 0 };
let isDragging = false, isResizing = false, resizeHandle = null;
let dragStart = { x: 0, y: 0 };
let editHistory = [], historyIndex = -1;

const filters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0,
    rotate: 0,
    opacity: 100,
    sharpen: 0
};

// =====================================
// INITIALIZATION
// =====================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Pixels Photo Editor - Initializing...');
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    const container = document.getElementById('canvasContainer');
    if (container) {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    }

    const rangeInputs = ['brightness', 'contrast', 'saturation', 'blur', 'hue', 'rotate', 'opacity', 'sharpen'];
    rangeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', updateFilters);
    });

    ['resizeWidth', 'resizeHeight'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', updateResize);
    });

    setupCropEvents();
    setupKeyboardShortcuts();
    
    console.log('Pixels Photo Editor - Ready!');
}

// =====================================
// FILE HANDLING
// =====================================

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        alert('Please select a valid image file');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        alert('Please drop a valid image file');
    }
}

function loadImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        
        img.onload = function() {
            originalImage = img;
            initCanvas();
            document.getElementById('resizeWidth').value = img.width;
            document.getElementById('resizeHeight').value = img.height;
            resetFilters();
            editHistory = [];
            historyIndex = -1;
            saveHistory();
            updateFilters();
            updateHistoryButtons();
            console.log('Image loaded:', img.width + 'x' + img.height);
        };
        
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

function initCanvas() {
    const container = document.getElementById('canvasContainer');
    const uploadArea = document.getElementById('uploadArea');
    
    if (uploadArea) uploadArea.style.display = 'none';
    
    let canvasEl = document.getElementById('canvas');
    if (!canvasEl) {
        const wrapper = document.createElement('div');
        wrapper.className = 'canvas-checkerboard p-10 shadow-2xl';
        canvasEl = document.createElement('canvas');
        canvasEl.id = 'canvas';
        canvasEl.className = 'max-w-[90vw] max-h-[80vh] shadow-2xl';
        wrapper.appendChild(canvasEl);
        container.appendChild(wrapper);
    }
    
    canvas = canvasEl;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
}

// =====================================
// TOOL SELECTION
// =====================================

function selectTool(toolIndex) {
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach((btn, idx) => {
        if (idx === toolIndex) {
            btn.classList.remove('bg-neutral-800', 'hover:bg-neutral-700');
            btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else {
            btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            btn.classList.add('bg-neutral-800', 'hover:bg-neutral-700');
        }
    });
    
    const toolNames = ['Move', 'Crop', 'Brush', 'Text', 'Shape', 'Zoom'];
    console.log('Tool selected:', toolNames[toolIndex]);
    
    if (toolIndex === 1 && originalImage) {
        startCrop();
    } else if (toolIndex !== 1) {
        cancelCrop();
    }
}

// =====================================
// TAB SWITCHING
// =====================================

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.classList.remove('border-blue-500', 'text-blue-500');
        tab.classList.add('border-transparent', 'text-neutral-400');
    });
    
    contents.forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeTab = event?.target || document.querySelector(`[onclick*="${tabName}"]`);
    if (activeTab && activeTab.classList.contains('tab-btn')) {
        activeTab.classList.add('border-blue-500', 'text-blue-500');
        activeTab.classList.remove('border-transparent', 'text-neutral-400');
    }
    
    const activeContent = document.getElementById(tabName + '-tab');
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
}

// =====================================
// RESIZE FUNCTIONS
// =====================================

function updateResize() {
    const widthInput = document.getElementById('resizeWidth');
    const heightInput = document.getElementById('resizeHeight');
    
    if (!originalImage) return;
    
    const width = widthInput.value;
    const height = heightInput.value;
    
    if (width && !height) {
        const ratio = originalImage.height / originalImage.width;
        heightInput.value = Math.round(width * ratio);
    } else if (height && !width) {
        const ratio = originalImage.width / originalImage.height;
        widthInput.value = Math.round(height * ratio);
    }
}

function applyResize() {
    if (!originalImage) {
        alert('Please load an image first!');
        return;
    }
    
    const newWidth = parseInt(document.getElementById('resizeWidth').value);
    const newHeight = parseInt(document.getElementById('resizeHeight').value);
    
    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
        alert('Please enter valid dimensions');
        return;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
    
    const img = new Image();
    img.onload = function() {
        originalImage = img;
        canvas.width = newWidth;
        canvas.height = newHeight;
        saveHistory();
        updateFilters();
        console.log('Image resized to:', newWidth + 'x' + newHeight);
    };
    img.src = tempCanvas.toDataURL();
}

// =====================================
// CROP FUNCTIONS
// =====================================

function setupCropEvents() {
    const overlay = document.getElementById('cropOverlay');
    const handles = overlay.querySelectorAll('.crop-handle');
    
    overlay.addEventListener('mousedown', startDrag);
    
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startResize(e, handle.dataset.handle);
        });
    });
    
    document.addEventListener('mousemove', dragOrResize);
    document.addEventListener('mouseup', stopDragOrResize);
}

function startCrop() {
    if (!originalImage) {
        alert('Please load an image first!');
        return;
    }
    
    croppingMode = true;
    const overlay = document.getElementById('cropOverlay');
    overlay.classList.remove('hidden');
    
    cropArea = {
        x: canvas.width * 0.1,
        y: canvas.height * 0.1,
        width: canvas.width * 0.8,
        height: canvas.height * 0.8
    };
    
    updateCropOverlay();
    console.log('Crop mode started');
}

function startDrag(e) {
    if (!croppingMode) return;
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    dragStart = {
        x: (e.clientX - rect.left) * scaleX - cropArea.x,
        y: (e.clientY - rect.top) * scaleY - cropArea.y
    };
    e.preventDefault();
}

function startResize(e, handle) {
    if (!croppingMode) return;
    isResizing = true;
    resizeHandle = handle;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    dragStart = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
    e.preventDefault();
}

function dragOrResize(e) {
    if (!croppingMode || (!isDragging && !isResizing)) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    if (isDragging) {
        cropArea.x = Math.max(0, Math.min(mouseX - dragStart.x, canvas.width - cropArea.width));
        cropArea.y = Math.max(0, Math.min(mouseY - dragStart.y, canvas.height - cropArea.height));
    } else if (isResizing) {
        const dx = mouseX - dragStart.x;
        const dy = mouseY - dragStart.y;
        
        const oldX = cropArea.x;
        const oldY = cropArea.y;
        const oldWidth = cropArea.width;
        const oldHeight = cropArea.height;
        
        if (resizeHandle.includes('e')) {
            cropArea.width = Math.max(50, Math.min(oldWidth + dx, canvas.width - cropArea.x));
        }
        if (resizeHandle.includes('w')) {
            const newWidth = Math.max(50, oldWidth - dx);
            const newX = oldX + oldWidth - newWidth;
            if (newX >= 0) {
                cropArea.width = newWidth;
                cropArea.x = newX;
            }
        }
        if (resizeHandle.includes('s')) {
            cropArea.height = Math.max(50, Math.min(oldHeight + dy, canvas.height - cropArea.y));
        }
        if (resizeHandle.includes('n')) {
            const newHeight = Math.max(50, oldHeight - dy);
            const newY = oldY + oldHeight - newHeight;
            if (newY >= 0) {
                cropArea.height = newHeight;
                cropArea.y = newY;
            }
        }
        
        dragStart = { x: mouseX, y: mouseY };
    }
    
    updateCropOverlay();
}

function stopDragOrResize() {
    isDragging = false;
    isResizing = false;
    resizeHandle = null;
}

function updateCropOverlay() {
    const overlay = document.getElementById('cropOverlay');
    const rect = canvas.getBoundingClientRect();
    const container = document.getElementById('canvasContainer');
    const containerRect = container.getBoundingClientRect();
    
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    
    overlay.style.left = (rect.left - containerRect.left + cropArea.x * scaleX) + 'px';
    overlay.style.top = (rect.top - containerRect.top + cropArea.y * scaleY) + 'px';
    overlay.style.width = (cropArea.width * scaleX) + 'px';
    overlay.style.height = (cropArea.height * scaleY) + 'px';
}

function applyCrop() {
    if (!croppingMode || !originalImage) {
        alert('Please start crop mode first!');
        return;
    }
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = cropArea.width;
    tempCanvas.height = cropArea.height;
    
    tempCtx.drawImage(canvas, 
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height
    );
    
    const img = new Image();
    img.onload = function() {
        originalImage = img;
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;
        document.getElementById('resizeWidth').value = cropArea.width;
        document.getElementById('resizeHeight').value = cropArea.height;
        cancelCrop();
        saveHistory();
        updateFilters();
        console.log('Crop applied:', cropArea.width + 'x' + cropArea.height);
    };
    img.src = tempCanvas.toDataURL();
}

function cancelCrop() {
    croppingMode = false;
    const overlay = document.getElementById('cropOverlay');
    overlay.classList.add('hidden');
    console.log('Crop cancelled');
}

// =====================================
// FLIP FUNCTIONS
// =====================================

function flipHorizontal() {
    if (!originalImage) {
        alert('Please load an image first!');
        return;
    }
    flipH *= -1;
    saveHistory();
    updateFilters();
    console.log('Flipped horizontally');
}

function flipVertical() {
    if (!originalImage) {
        alert('Please load an image first!');
        return;
    }
    flipV *= -1;
    saveHistory();
    updateFilters();
    console.log('Flipped vertically');
}

// =====================================
// FILTER FUNCTIONS
// =====================================

function updateFilters() {
    if (!originalImage) return;

    filters.brightness = document.getElementById('brightness').value;
    filters.contrast = document.getElementById('contrast').value;
    filters.saturation = document.getElementById('saturation').value;
    filters.blur = document.getElementById('blur').value;
    filters.hue = document.getElementById('hue').value;
    filters.rotate = document.getElementById('rotate').value;
    filters.opacity = document.getElementById('opacity').value;
    filters.sharpen = document.getElementById('sharpen').value;

    document.getElementById('brightnessValue').textContent = filters.brightness;
    document.getElementById('contrastValue').textContent = filters.contrast;
    document.getElementById('saturationValue').textContent = filters.saturation;
    document.getElementById('blurValue').textContent = filters.blur;
    document.getElementById('hueValue').textContent = filters.hue + '°';
    document.getElementById('rotateValue').textContent = filters.rotate + '°';
    document.getElementById('opacityValue').textContent = filters.opacity + '%';
    document.getElementById('sharpenValue').textContent = filters.sharpen;

    applyFilters();
}

function applyFilters() {
    if (!ctx || !originalImage) return;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.scale(flipH, flipV);
    ctx.rotate((filters.rotate * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    ctx.globalAlpha = filters.opacity / 100;
    
    ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        blur(${filters.blur}px)
        hue-rotate(${filters.hue}deg)
    `;
    
    ctx.drawImage(originalImage, 0, 0);
    
    if (filters.sharpen > 0) {
        ctx.filter = 'none';
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sharpened = sharpenImage(imageData, filters.sharpen / 100);
        ctx.putImageData(sharpened, 0, 0);
    }
    
    ctx.restore();
}

function sharpenImage(imageData, amount) {
    const pixels = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    const output = ctx.createImageData(w, h);
    
    for (let i = 0; i < pixels.length; i++) {
        output.data[i] = pixels[i];
    }
    
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            
            for (let c = 0; c < 3; c++) {
                const center = pixels[idx + c];
                const sum = 
                    pixels[((y-1) * w + x) * 4 + c] +
                    pixels[((y+1) * w + x) * 4 + c] +
                    pixels[(y * w + (x-1)) * 4 + c] +
                    pixels[(y * w + (x+1)) * 4 + c];
                
                output.data[idx + c] = Math.min(255, Math.max(0, 
                    center + amount * (5 * center - sum)
                ));
            }
        }
    }
    
    return output;
}

function applyPreset(preset) {
    if (!originalImage) {
        alert('Please load an image first!');
        return;
    }

    document.querySelectorAll('.filter-preset').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-neutral-800');
    });
    
    if (event?.target) {
        event.target.classList.remove('bg-neutral-800');
        event.target.classList.add('bg-blue-600', 'text-white');
    }

    const presets = {
        none: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0 },
        grayscale: { brightness: 100, contrast: 100, saturation: 0, blur: 0, hue: 0 },
        sepia: { brightness: 110, contrast: 90, saturation: 80, blur: 0, hue: 20 },
        vintage: { brightness: 95, contrast: 85, saturation: 70, blur: 0.5, hue: 10 },
        cold: { brightness: 105, contrast: 110, saturation: 120, blur: 0, hue: 200 },
        warm: { brightness: 110, contrast: 105, saturation: 130, blur: 0, hue: 30 }
    };

    const values = presets[preset];
    document.getElementById('brightness').value = values.brightness;
    document.getElementById('contrast').value = values.contrast;
    document.getElementById('saturation').value = values.saturation;
    document.getElementById('blur').value = values.blur;
    document.getElementById('hue').value = values.hue;

    saveHistory();
    updateFilters();
    console.log('Preset applied:', preset);
}

// =====================================
// RESET & HISTORY
// =====================================

function resetFilters() {
    document.getElementById('brightness').value = 100;
    document.getElementById('contrast').value = 100;
    document.getElementById('saturation').value = 100;
    document.getElementById('blur').value = 0;
    document.getElementById('hue').value = 0;
    document.getElementById('rotate').value = 0;
    document.getElementById('opacity').value = 100;
    document.getElementById('sharpen').value = 0;
    
    flipH = 1;
    flipV = 1;
    
    document.querySelectorAll('.filter-preset').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-neutral-800');
    });
    
    if (croppingMode) cancelCrop();
    
    if (originalImage) {
        saveHistory();
        updateFilters();
    }
    
    console.log('All filters reset');
}

function saveHistory() {
    if (!canvas) return;
    
    if (historyIndex < editHistory.length - 1) {
        editHistory = editHistory.slice(0, historyIndex + 1);
    }
    
    editHistory.push(canvas.toDataURL());
    historyIndex++;
    
    if (editHistory.length > 20) {
        editHistory.shift();
        historyIndex--;
    }
    
    updateHistoryButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            originalImage = img;
        };
        img.src = editHistory[historyIndex];
        updateHistoryButtons();
        console.log('Undo applied');
    }
}

function redo() {
    if (historyIndex < editHistory.length - 1) {
        historyIndex++;
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            originalImage = img;
        };
        img.src = editHistory[historyIndex];
        updateHistoryButtons();
        console.log('Redo applied');
    }
}

function updateHistoryButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = historyIndex <= 0;
    }
    
    if (redoBtn) {
        redoBtn.disabled = historyIndex >= editHistory.length - 1;
    }
}

// =====================================
// EXPORT FUNCTION
// =====================================

function downloadImage() {
    if (!canvas) {
        alert('Please load an image first!');
        return;
    }
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `pixels-edited-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('Image exported successfully');
}

// =====================================
// KEYBOARD SHORTCUTS
// =====================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            document.getElementById('fileInput').click();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            downloadImage();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
        
        if (e.key === 'Escape' && croppingMode) {
            cancelCrop();
        }
        
        if (e.key === 'Enter' && croppingMode) {
            applyCrop();
        }
    });
}

console.log('Pixels Photo Editor - Script loaded successfully');
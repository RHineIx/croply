// المتغيرات العامة
let currentConfig = {
    widthMm: 0,
    heightMm: 0,
    label: '',
    count: 8,
    borderStyle: 'dashed',
    imageData: null
};

let cropper = null;

const steps = {
    1: document.getElementById('step-1'),
    2: document.getElementById('step-2'),
    3: document.getElementById('step-3')
};

function showStep(stepNum) {
    Object.values(steps).forEach(el => el.classList.add('hidden'));
    steps[stepNum].classList.remove('hidden');
    window.scrollTo(0,0);
}

function resetApp() {
    location.reload();
}

function selectSize(w, h, label) {
    currentConfig.widthMm = w;
    currentConfig.heightMm = h;
    currentConfig.label = label;
    document.getElementById('selected-size-label').textContent = `${label} - ${w}x${h} مم`;
    showStep(2);
}

function selectCustomSize() {
    const w = document.getElementById('customW').value;
    const h = document.getElementById('customH').value;
    if(w && h) selectSize(w, h, 'مخصص');
}

function loadImage(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = document.getElementById('image-to-crop');
            image.src = e.target.result;
            
            document.getElementById('upload-area').classList.add('hidden');
            document.getElementById('crop-container').classList.remove('hidden');
            document.getElementById('crop-actions').classList.remove('hidden');

            if(cropper) cropper.destroy();
            cropper = new Cropper(image, {
                aspectRatio: currentConfig.widthMm / currentConfig.heightMm,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: false,
                cropBoxResizable: false,
                toggleDragModeOnDblclick: false,
            });
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function resetUpload() {
    if(cropper) cropper.destroy();
    document.getElementById('fileInput').value = '';
    document.getElementById('upload-area').classList.remove('hidden');
    document.getElementById('crop-container').classList.add('hidden');
    document.getElementById('crop-actions').classList.add('hidden');
}

function processImage() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
        width: currentConfig.widthMm * 11.8,
        height: currentConfig.heightMm * 11.8,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    currentConfig.imageData = canvas.toDataURL('image/jpeg', 1.0);
    generateGrid();
    showStep(3);
}

function generateGrid() {
    const sheet = document.getElementById('print-sheet');
    sheet.innerHTML = '';

    for (let i = 0; i < currentConfig.count; i++) {
        const frame = document.createElement('div');
        frame.className = `photo-item style-${currentConfig.borderStyle}`;
        frame.style.width = `${currentConfig.widthMm}mm`;
        frame.style.height = `${currentConfig.heightMm}mm`;

        const img = document.createElement('img');
        img.src = currentConfig.imageData;
        
        frame.appendChild(img);
        sheet.appendChild(frame);
    }
}

function setBorder(style) {
    currentConfig.borderStyle = style;
    document.querySelectorAll('.border-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[data-type="${style}"]`).classList.add('active');
    generateGrid();
}

function updateCount(val) {
    currentConfig.count = val;
    document.getElementById('countDisplay').textContent = val;
    generateGrid();
}
/**
 * Rhineix Croply - Smart Document Photo Studio
 * Modernized JS Structure (ES6+)
 * * * UPDATES:
 * - Position buttons match visual layout (LTR)
 * - Disabled context menu on cropping area
 */

// --- 1. Data & Configuration ---

const DOCUMENT_SIZES = [
    {
        label: "جواز سفر (قياسي)",
        widthMm: 40,
        heightMm: 60,
        subtitle: "4 × 6 سم",
        icon: "airplane_ticket",
        theme: "blue" 
    },
    {
        label: "هوية / معاملات",
        widthMm: 35,
        heightMm: 45,
        subtitle: "3.5 × 4.5 سم",
        icon: "badge",
        theme: "green"
    },
    {
        label: "صور مدرسية",
        widthMm: 30,
        heightMm: 40,
        subtitle: "3 × 4 سم",
        icon: "school",
        theme: "orange"
    },
    {
        label: "تأشيرة (فيزا) مربع",
        widthMm: 50,
        heightMm: 50,
        subtitle: "5 × 5 سم",
        icon: "public",
        theme: "purple"
    },
    {
        label: "قياس شنغن",
        widthMm: 35,
        heightMm: 45,
        subtitle: "أوروبا (وجه 80%)",
        icon: "flight_takeoff",
        theme: "teal"
    }
];

const COLOR_THEMES = {
    blue:   { box: "bg-blue-100 text-blue-600", hover: "group-hover:bg-blue-600 group-hover:text-white" },
    green:  { box: "bg-green-100 text-green-600", hover: "group-hover:bg-green-600 group-hover:text-white" },
    orange: { box: "bg-orange-100 text-orange-600", hover: "group-hover:bg-orange-600 group-hover:text-white" },
    purple: { box: "bg-purple-100 text-purple-600", hover: "group-hover:bg-purple-600 group-hover:text-white" },
    teal:   { box: "bg-teal-100 text-teal-600", hover: "group-hover:bg-teal-600 group-hover:text-white" }
};

// --- 2. State Management ---

const State = {
    config: {
        widthMm: 0,
        heightMm: 0,
        label: "",
        count: 8,
        borderStyle: "dashed",
        imageData: null,
        marginMm: 5,
        position: "top-left"
    },
    cropper: null,

    setSize(w, h, label) {
        this.config.widthMm = Number(w);
        this.config.heightMm = Number(h);
        this.config.label = label;
        UI.updateSizeLabel(label, w, h);
    },

    updateConfig(key, value) {
        this.config[key] = value;
    },

    reset() {
        this.config.widthMm = 0;
        this.config.heightMm = 0;
        this.config.label = "";
        this.config.imageData = null;
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }
};

// --- 3. UI Utilities & Notifications ---

const UI = {
    showStep(stepId) {
        document.querySelectorAll('section[id^="step-"]').forEach(el => el.classList.add('hidden'));
        document.getElementById(`step-${stepId}`).classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        let bgClass = "bg-gray-800";
        if (type === 'error') bgClass = "bg-red-600";
        if (type === 'success') bgClass = "bg-green-600";

        toast.className = `toast-msg ${bgClass} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3`;
        toast.innerHTML = `
            <span class="material-symbols-rounded text-lg">${type === 'error' ? 'error' : 'check_circle'}</span>
            <span class="font-medium text-sm">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    renderSizeOptions() {
        const grid = document.getElementById("sizes-grid");
        grid.innerHTML = "";

        DOCUMENT_SIZES.forEach(size => {
            const theme = COLOR_THEMES[size.theme];
            const card = document.createElement("div");
            card.className = "card-option group cursor-pointer p-5 rounded-xl shadow border border-transparent";
            
            card.addEventListener('click', () => {
                State.setSize(size.widthMm, size.heightMm, size.label);
                UI.showStep(2);
            });

            const html = `
                <div class="icon-box ${theme.box} ${theme.hover}">
                    <span class="material-symbols-rounded text-4xl">${size.icon}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-800">${size.label}</h3>
                <p class="text-sm text-gray-500 mt-1">${size.subtitle}</p>
            `;
            card.innerHTML = html;
            grid.appendChild(card);
        });
    },

    updateSizeLabel(label, w, h) {
        const el = document.getElementById("selected-size-label");
        if(el) el.textContent = `${label} - ${w}×${h} مم`;
    }
};

// --- 4. Image Handling (Cropper) ---

const ImageHandler = {
    init() {
        this.fileInput = document.getElementById("fileInput");
        this.uploadArea = document.getElementById("upload-area");
        this.imageElement = document.getElementById("image-to-crop");
        this.setupDragDrop();
        this.preventContextMenu();
    },

    setupDragDrop() {
        this.uploadArea.addEventListener("dragover", e => {
            e.preventDefault();
            this.uploadArea.classList.add("drag-over");
        });

        this.uploadArea.addEventListener("dragleave", () => {
            this.uploadArea.classList.remove("drag-over");
        });

        this.uploadArea.addEventListener("drop", e => {
            e.preventDefault();
            this.uploadArea.classList.remove("drag-over");
            const file = e.dataTransfer.files[0];
            if (file) this.processFile(file);
        });
    },

    preventContextMenu() {
        const container = document.getElementById("crop-container");
        // Prevent right-click / long-press menu
        container.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            return false;
        });
    },

    handleInputChange(e) {
        const file = e.target.files[0];
        if (file) this.processFile(file);
    },

    processFile(file) {
        if (!file.type.startsWith("image/")) {
            UI.showToast("يرجى اختيار ملف صورة صحيح (JPG, PNG)", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.imageElement.src = reader.result;
            this.toggleCropperView(true);
            this.initCropperInstance();
        };
        reader.readAsDataURL(file);
    },

    initCropperInstance() {
        if (State.cropper) State.cropper.destroy();

        State.cropper = new Cropper(this.imageElement, {
            aspectRatio: State.config.widthMm / State.config.heightMm,
            viewMode: 1,
            dragMode: "move",
            autoCropArea: 0.95,
            cropBoxMovable: false,
            cropBoxResizable: false,
            background: false,
            ready: () => {
                UI.showToast("تم تحميل الصورة بنجاح", "success");
            }
        });
    },

    rotate(deg) {
        if (State.cropper) State.cropper.rotate(deg);
    },

    reset() {
        if (State.cropper) State.cropper.destroy();
        State.cropper = null;
        this.fileInput.value = ""; 
        this.toggleCropperView(false);
    },

    toggleCropperView(showCropper) {
        const cropContainer = document.getElementById("crop-container");
        const cropActions = document.getElementById("crop-actions");
        const uploadArea = document.getElementById("upload-area");

        if (showCropper) {
            uploadArea.classList.add("hidden");
            cropContainer.classList.remove("hidden");
            cropActions.classList.remove("hidden");
        } else {
            cropContainer.classList.add("hidden");
            cropActions.classList.add("hidden");
            uploadArea.classList.remove("hidden");
        }
    },

    processCroppedImage() {
        if (!State.cropper) return;

        const pxPerMm = 11.81; 
        const canvas = State.cropper.getCroppedCanvas({
            width: State.config.widthMm * pxPerMm,
            height: State.config.heightMm * pxPerMm,
            fillColor: "#fff",
            imageSmoothingQuality: "high"
        });

        State.config.imageData = canvas.toDataURL("image/jpeg", 0.95);
        
        GridLayout.generate();
        UI.showStep(3);
        UI.showToast("تم تجهيز الصور للطباعة", "success");
    }
};

// --- 5. Grid Layout & Printing ---

const GridLayout = {
    generate() {
        const sheet = document.getElementById("print-sheet");
        sheet.innerHTML = "";
        
        // Apply Margin (Padding)
        sheet.style.padding = `${State.config.marginMm}mm`;

        // Update Alignment
        this.updateAlignment(sheet);

        // Generate Items
        for (let i = 0; i < State.config.count; i++) {
            const frame = document.createElement("div");
            frame.className = `photo-item style-${State.config.borderStyle}`;
            frame.style.width = `${State.config.widthMm}mm`;
            frame.style.height = `${State.config.heightMm}mm`;

            const img = document.createElement("img");
            img.src = State.config.imageData;

            frame.appendChild(img);
            sheet.appendChild(frame);
        }
    },

    updateAlignment(sheetElement) {
        const pos = State.config.position;
        
        // Since sheet is LTR, 'flex-start' is Left.
        const map = {
            "top-left":      ["flex-start", "flex-start"],
            "top-center":    ["center", "flex-start"],
            "top-right":     ["flex-end", "flex-start"],

            "middle-left":   ["flex-start", "center"],
            "center":        ["center", "center"],
            "middle-right":  ["flex-end", "center"],

            "bottom-left":   ["flex-start", "flex-end"],
            "bottom-center": ["center", "flex-end"],
            "bottom-right":  ["flex-end", "flex-end"]
        };

        const [justify, align] = map[pos] || map["top-left"];
        sheetElement.style.justifyContent = justify;
        sheetElement.style.alignContent = align;
    }
};

// --- 6. Initialization & Events ---

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Render Initial UI
    UI.renderSizeOptions();
    ImageHandler.init();

    // 2. Event Listeners
    
    document.getElementById('btn-reload').addEventListener('click', () => window.location.reload());

    document.getElementById('btn-custom-size').addEventListener('click', () => {
        const w = document.getElementById('customW').value;
        const h = document.getElementById('customH').value;
        if (!w || !h) {
            UI.showToast("يرجى إدخال الطول والعرض", "error");
            return;
        }
        State.setSize(w, h, "قياس مخصص");
        UI.showStep(2);
    });

    document.getElementById('fileInput').addEventListener('change', (e) => ImageHandler.handleInputChange(e));
    document.getElementById('btn-rotate-left').addEventListener('click', () => ImageHandler.rotate(-90));
    document.getElementById('btn-rotate-right').addEventListener('click', () => ImageHandler.rotate(90));
    document.getElementById('btn-process').addEventListener('click', () => ImageHandler.processCroppedImage());
    document.getElementById('btn-cancel-upload').addEventListener('click', () => ImageHandler.reset());
    
    document.getElementById('btn-change-size').addEventListener('click', () => {
        ImageHandler.reset();
        UI.showStep(1);
    });

    document.querySelectorAll('.border-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.border-btn').forEach(b => b.classList.remove('active'));
            const targetBtn = e.target.closest('.border-btn');
            targetBtn.classList.add('active');
            
            State.updateConfig('borderStyle', targetBtn.dataset.type);
            GridLayout.generate();
        });
    });

    const countRange = document.getElementById('countRange');
    countRange.addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('countDisplay').textContent = val;
        State.updateConfig('count', val);
        GridLayout.generate();
    });

    const marginRange = document.getElementById('marginRange');
    marginRange.addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('marginValue').textContent = val;
        State.updateConfig('marginMm', val);
        GridLayout.generate();
    });

    document.querySelectorAll('.pos-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
            const targetBtn = e.target.closest('.pos-btn');
            targetBtn.classList.add('active');

            State.updateConfig('position', targetBtn.dataset.pos);
            GridLayout.generate();
        });
    });

    document.getElementById('btn-print').addEventListener('click', () => window.print());
    
    document.getElementById('btn-new-photo').addEventListener('click', () => {
        ImageHandler.reset();
        UI.showStep(1);
    });
});
// --- Data & Configuration ---
const documentSizes = [
    {
        label: "جواز سفر (قياسي)",
        width: 40,
        height: 60,
        subtitle: "4 × 6 سم",
        icon: "airplane_ticket",
        theme: "blue" 
    },
    {
        label: "هوية / معاملات",
        width: 35,
        height: 45,
        subtitle: "3.5 × 4.5 سم",
        icon: "badge",
        theme: "green"
    },
    {
        label: "صور مدرسية",
        width: 30,
        height: 40,
        subtitle: "3 × 4 سم",
        icon: "school",
        theme: "orange"
    },
    {
        label: "تأشيرة (فيزا) مربع",
        width: 50,
        height: 50,
        subtitle: "5 × 5 سم",
        icon: "public",
        theme: "purple"
    },
    {
        label: "قياس شنغن",
        width: 35,
        height: 45,
        subtitle: "أوروبا (وجه 80%)",
        icon: "flight_takeoff",
        theme: "teal"
    }
];

const colorThemes = {
    blue:   { box: "bg-blue-100 text-blue-600", hover: "group-hover:bg-blue-600 group-hover:text-white" },
    green:  { box: "bg-green-100 text-green-600", hover: "group-hover:bg-green-600 group-hover:text-white" },
    orange: { box: "bg-orange-100 text-orange-600", hover: "group-hover:bg-orange-600 group-hover:text-white" },
    purple: { box: "bg-purple-100 text-purple-600", hover: "group-hover:bg-purple-600 group-hover:text-white" },
    teal:   { box: "bg-teal-100 text-teal-600", hover: "group-hover:bg-teal-600 group-hover:text-white" }
};

let currentConfig = {
    widthMm: 0,
    heightMm: 0,
    label: "",
    count: 8,
    borderStyle: "dashed",
    imageData: null
};

let cropper = null;
let currentMarginMm = 4;
let currentPosition = "top-left";

document.addEventListener("DOMContentLoaded", () => {
    renderSizeOptions();
    setupDragAndDrop();
    initLayoutControls();
});

// ------- Rendering Size Options -------
function renderSizeOptions() {
    const grid = document.getElementById("sizes-grid");
    grid.innerHTML = "";

    documentSizes.forEach(size => {
        const theme = colorThemes[size.theme];

        const card = document.createElement("div");
        card.className = "card-option group cursor-pointer p-5 rounded-xl shadow border border-transparent";

        card.onclick = () => selectSize(size.width, size.height, size.label);

        const html =
            '<div class="icon-box ' + theme.box + ' ' + theme.hover + '">' +
                '<span class="material-symbols-rounded text-4xl">' + size.icon + '</span>' +
            '</div>' +
            '<h3 class="text-lg font-bold text-gray-800">' + size.label + '</h3>' +
            '<p class="text-sm text-gray-500 mt-1">' + size.subtitle + '</p>';

        card.innerHTML = html;
        grid.appendChild(card);
    });
}

// ------- Steps -------
function showStep(step) {
    document.getElementById("step-1").classList.add("hidden");
    document.getElementById("step-2").classList.add("hidden");
    document.getElementById("step-3").classList.add("hidden");
    document.getElementById("step-" + step).classList.remove("hidden");
}

function selectSize(w, h, label) {
    currentConfig.widthMm = Number(w);
    currentConfig.heightMm = Number(h);
    currentConfig.label = label;

    document.getElementById("selected-size-label").textContent =
        label + " - " + w + "×" + h + " مم";

    showStep(2);
}

function selectCustomSize() {
    const w = document.getElementById("customW").value;
    const h = document.getElementById("customH").value;

    if (!w || !h) return alert("يرجى إدخال الطول والعرض");

    selectSize(w, h, "قياس مخصص");
}

// ------- Upload & Cropper -------
function setupDragAndDrop() {
    const area = document.getElementById("upload-area");
    const fileInput = document.getElementById("fileInput");

    area.addEventListener("dragover", e => {
        e.preventDefault();
        area.classList.add("drag-over");
    });

    area.addEventListener("dragleave", () => {
        area.classList.remove("drag-over");
    });

    area.addEventListener("drop", e => {
        e.preventDefault();
        area.classList.remove("drag-over");

        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
}

function loadImage(ev) {
    const file = ev.target.files[0];
    if (file) handleFile(file);
}

function handleFile(file) {
    if (!file.type.startsWith("image/")) {
        return alert("الملف ليس صورة");
    }

    const reader = new FileReader();

    reader.onload = () => {
        const img = document.getElementById("image-to-crop");
        img.src = reader.result;

        document.getElementById("upload-area").classList.add("hidden");
        document.getElementById("crop-container").classList.remove("hidden");
        document.getElementById("crop-actions").classList.remove("hidden");

        initCropper(img);
    };

    reader.readAsDataURL(file);
}

function initCropper(img) {
    if (cropper) cropper.destroy();

    cropper = new Cropper(img, {
        aspectRatio: currentConfig.widthMm / currentConfig.heightMm,
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 0.95,
        cropBoxMovable: false,
        cropBoxResizable: false,
        background: false
    });
}

function rotateImage(deg) {
    if (cropper) cropper.rotate(deg);
}

function resetUpload() {
    if (cropper) cropper.destroy();
    cropper = null;

    document.getElementById("crop-container").classList.add("hidden");
    document.getElementById("crop-actions").classList.add("hidden");
    document.getElementById("upload-area").classList.remove("hidden");
}

// ------- Process Image -------
function processImage() {
    if (!cropper) return;

    const pxPerMm = 11.81;

    const canvas = cropper.getCroppedCanvas({
        width: currentConfig.widthMm * pxPerMm,
        height: currentConfig.heightMm * pxPerMm,
        fillColor: "#fff",
        imageSmoothingQuality: "high"
    });

    currentConfig.imageData = canvas.toDataURL("image/jpeg", 0.95);

    generateGrid();
    showStep(3);
}

// ------- Grid Generation -------
function generateGrid() {
    const sheet = document.getElementById("print-sheet");
    sheet.innerHTML = "";

    for (let i = 0; i < currentConfig.count; i++) {
        const frame = document.createElement("div");
        frame.className = "photo-item style-" + currentConfig.borderStyle;
        frame.style.width = currentConfig.widthMm + "mm";
        frame.style.height = currentConfig.heightMm + "mm";

        const img = document.createElement("img");
        img.src = currentConfig.imageData;

        frame.appendChild(img);
        sheet.appendChild(frame);
    }
}

// ------- Border Style -------
function setBorder(style) {
    currentConfig.borderStyle = style;

    document.querySelectorAll(".border-btn").forEach(btn => btn.classList.remove("active"));

    const btn = document.querySelector("button[data-type='" + style + "']");
    if (btn) btn.classList.add("active");

    generateGrid();
}

// ------- Count -------
function updateCount(val) {
    currentConfig.count = Number(val);
    document.getElementById("countDisplay").textContent = val;
    generateGrid();
}

// ------- Layout Controls -------
function updateMargin(val) {
    currentMarginMm = Number(val);
    document.getElementById("marginValue").textContent = val;

    document.querySelector(".print-safe-area").style.padding = val + "mm";
}

function setPosition(pos) {
    currentPosition = pos;

    const area = document.querySelector(".print-safe-area");

    let justify = "flex-start";
    let align = "flex-start";

    const map = {
        "top-left": ["flex-start", "flex-start"],
        "top-center": ["center", "flex-start"],
        "top-right": ["flex-end", "flex-start"],

        "middle-left": ["flex-start", "center"],
        "center": ["center", "center"],
        "middle-right": ["flex-end", "center"],

        "bottom-left": ["flex-start", "flex-end"],
        "bottom-center": ["center", "flex-end"],
        "bottom-right": ["flex-end", "flex-end"]
    };

    justify = map[pos][0];
    align = map[pos][1];

    area.style.justifyContent = justify;
    area.style.alignContent = align;

    document.querySelectorAll(".pos-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const active = document.querySelector(`.pos-btn[data-pos="${pos}"]`);
    if (active) active.classList.add("active");
}
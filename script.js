const canvas = document.getElementById("designCanvas");
const ctx = canvas.getContext("2d");

// === OBJECT STORAGE ===
const objects = []; 
// örnek: { type: "text", x, y, text, font, size, color }

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // arka plan
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  objects.forEach(obj => {
    if (obj.type === "text") {
      ctx.fillStyle = obj.color;
      ctx.font = `${obj.size}px ${obj.font}`;
      ctx.fillText(obj.text, obj.x, obj.y);
    }
    if (obj.type === "shape") {
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = obj.lineWidth;
      if (obj.fill) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      } else {
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      }
    if (obj.type === "image") {
      ctx.save();

      if (obj.grayscale) {
      ctx.filter = "grayscale(100%)";
      } else {
      ctx.filter = `brightness(${obj.brightness})`;
      }

      ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
      ctx.restore();
      }
    }
  });
}

const undoStack = [];
const redoStack = [];


function exportCanvas(type) {
  const scale = Number(document.getElementById("exportScale").value);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width * scale;
  tempCanvas.height = canvas.height * scale;

  const tctx = tempCanvas.getContext("2d");
  tctx.scale(scale, scale);

  // background
  tctx.fillStyle = "#f2f2f2";
  tctx.fillRect(0, 0, canvas.width, canvas.height);

  objects.forEach(obj => {
    if (obj.type === "text") {
      tctx.fillStyle = obj.color;
      tctx.font = `${obj.size}px ${obj.font}`;
      tctx.fillText(obj.text, obj.x, obj.y);
    }

    if (obj.type === "image") {
      tctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
    }
  });

  const link = document.createElement("a");
  link.download = `createc-export.${type}`;
  link.href = tempCanvas.toDataURL(`image/${type}`);
  link.click();
}




function saveState() {
  undoStack.push(JSON.stringify(objects));
  redoStack.length = 0;
}

function clearCanvas() {
  saveState();
  objects.length = 0;
  redrawCanvas();
}

function saveToLocal() {
  localStorage.setItem("createc-canvas", JSON.stringify(objects));
}

window.addEventListener("load", () => {
  const saved = localStorage.getItem("createc-canvas");
  if (saved) {
    objects.push(...JSON.parse(saved));
    redrawCanvas();
  }
});

// 2️⃣-1 Active tool state
let activeTool = "draw";
const toolButtons = document.querySelectorAll(".editor-tools button");

function setActiveTool(tool) {
  activeTool = tool;
  toolButtons.forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-tool='${tool}']`);
  if (activeBtn) activeBtn.classList.add("active");
  selectedObject = null;

}
  
function resetToolState() {
  isDrawing = false;
}

// 2️⃣-4 Tool seçimi event listener
const shapeButton = document.querySelector("[data-tool='shape']");
shapeButton.addEventListener("click", () => {
  setActiveTool("shape");
  resetToolState();
});

// 2️⃣-4 Selected object
let selectedObject = null;

// 2️⃣-7 Object lock toggle
function toggleLock(object) {
  object.locked = !object.locked;
}

// 3️⃣-1 Text object model helper
function createTextObject(text, x, y) {
  return {
    type: "text",
    text,
    x,
    y,
    font: "Inter",
    size: 24,
    color: "#000",
    locked: false
  };
}

function createImageObject(img, x, y) {
  return {
    type: "image",
    img,
    x,
    y,
    width: img.width * 0.5,
    height: img.height * 0.5,
    locked: false,
    brightness: 1,
    grayscale: false
  };
}
function generateDemoAIImage(prompt) {
  const img = new Image();
  img.src = "https://picsum.photos/400?random=" + Date.now();
  return img;
}





// 4️⃣-1 Shape object model
function createShapeObject(type, x, y, width, height, color, lineWidth, fill) {
  return {
    type: "shape",
    shapeType: type,
    x, y, width, height,
    color,
    lineWidth,
    fill,
    locked: false
  };
}

// Arka plan
ctx.fillStyle = "#f2f2f2";
ctx.fillRect(0, 0, canvas.width, canvas.height);

let isDrawing = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// === BİRLEŞİK MOUSEDOWN LISTENER ===
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Text drag kontrolü
  selectedObject = null;
  dragOffsetX = 0;
  dragOffsetY = 0;
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.type === "text") {
      const width = ctx.measureText(obj.text).width;
      const height = obj.size;
      if (x >= obj.x && x <= obj.x + width && y <= obj.y && y >= obj.y - height) {
        selectedObject = obj;
        dragOffsetX = x - obj.x;
        dragOffsetY = y - obj.y;
        return; // Text seçildi, diğer işlemleri engelle
      }
    }
  }

  // Shape Tool başlatma
  if (activeTool === "shape") {
    selectedObject = {
      type: "shape",
      shapeType: "rectangle",
      x,
      y,
      width: 0,
      height: 0,
      color: "#000",
      lineWidth: 2,
      fill: false,
      locked: false
    };
    objects.push(selectedObject);
    saveState();
    return; // Shape çizim başladı
  }

  // Free draw başlatma
  if (activeTool === "draw") {
    isDrawing = true;
  }
});

// Mouseup listener
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  // 4️⃣-5 Shape çizimi bitir
if (activeTool === "shape") {
  selectedObject = null;
}

  selectedObject = null;
  ctx.beginPath();
});

// Mousemove listener
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Text veya Shape sürükleme / güncelleme
  if (selectedObject && !selectedObject.locked) {
    if (selectedObject.type === "text") {
      selectedObject.x = x - dragOffsetX;
      selectedObject.y = y - dragOffsetY;
    }

    if (selectedObject.type === "image") {
      selectedObject.x = e.clientX - rect.left - dragOffsetX;
      selectedObject.y = e.clientY - rect.top - dragOffsetY;
      redrawCanvas();
      return;
    }

    
    
    
    if (selectedObject.type === "shape") {
      selectedObject.width = x - selectedObject.x;
      selectedObject.height = y - selectedObject.y;
    }
    redrawCanvas();
    return;
  
  // 4️⃣-4 Shape çizim güncelleme
if (
  activeTool === "shape" &&
  isDrawing &&
  selectedObject &&
  selectedObject.type === "shape"
) {
  const rect = canvas.getBoundingClientRect();
  selectedObject.width = (e.clientX - rect.left) - selectedObject.x;
  selectedObject.height = (e.clientY - rect.top) - selectedObject.y;
  redrawCanvas();
  return;
}

  
  
  
  
  

  // Free draw
  if (!isDrawing) return;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
});

// Doubleclick ile Text düzenleme
canvas.addEventListener("dblclick", () => {
  if (!selectedObject || selectedObject.type !== "text") return;
  const newText = prompt("Yeni metin:", selectedObject.text);
  if (!newText) return;
  saveState();
  selectedObject.text = newText;
  redrawCanvas();
  saveToLocal();
});

// Text Tool seçimi
const textTool = document.getElementById("toolText");
textTool.addEventListener("click", () => {
  activeTool = "text";
});

const imageToolBtn = document.querySelector("[data-tool='image']");
const imageUploadInput = document.getElementById("imageUpload");

imageToolBtn.addEventListener("click", () => {
  setActiveTool("image");
  imageUploadInput.click();
});

  const aiToolBtn = document.querySelector("[data-tool='ai']");
  const aiPromptInput = document.getElementById("aiPrompt");
  const aiGenerateBtn = document.getElementById("aiGenerateBtn");

  aiToolBtn.addEventListener("click", () => {
    setActiveTool("ai");
});

aiGenerateBtn.addEventListener("click", () => {
  if (!aiPromptInput.value) return;

  const img = generateDemoAIImage(aiPromptInput.value);

  img.onload = () => {
    saveState();
    const imageObj = createImageObject(img, 150, 150);
    objects.push(imageObj);
    redrawCanvas();
    saveToLocal();
  };
});

const clearCanvasBtn = document.getElementById("clearCanvasBtn");

clearCanvasBtn.addEventListener("click", () => {
  if (!objects.length) return;
  saveState();
  objects.length = 0;
  selectedObject = null;
  redrawCanvas();
  saveToLocal();
});





imageUploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    saveState();
    const imageObj = createImageObject(img, 100, 100);
    objects.push(imageObj);
    redrawCanvas();
    saveToLocal();
  };

  img.src = URL.createObjectURL(file);
});

if (obj.type === "image") {
  if (
    x >= obj.x &&
    x <= obj.x + obj.width &&
    y >= obj.y &&
    y <= obj.y + obj.height
  ) {
    selectedObject = obj;
    dragOffsetX = x - obj.x;
    dragOffsetY = y - obj.y;
    break;
  }
}


  // Text ekleme
canvas.addEventListener("click", (e) => {
  if (activeTool !== "text") return;
  const text = prompt("Yazıyı gir:");
  if (!text) return;
  saveState();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const textObj = createTextObject(text, x, y);
  objects.push(textObj);
  redrawCanvas();
  saveToLocal();
  activeTool = "draw";
});

// Font, boyut, renk değişimi
const fontSelect = document.getElementById("fontSelect");
fontSelect.addEventListener("change", () => {
  if (!selectedObject) return;
  selectedObject.font = fontSelect.value;
  redrawCanvas();
});
const fontSizeInput = document.getElementById("fontSize");
fontSizeInput.addEventListener("input", () => {
  if (!selectedObject) return;
  selectedObject.size = fontSizeInput.value;
  redrawCanvas();
});
const textColorInput = document.getElementById("textColor");
textColorInput.addEventListener("input", () => {
  if (!selectedObject) return;
  selectedObject.color = textColorInput.value;
  redrawCanvas();
});

const shapeTypeSelect = document.getElementById("shapeType");

shapeTypeSelect.addEventListener("change", () => {
  if (selectedObject && selectedObject.type === "shape") {
    selectedObject.shapeType = shapeTypeSelect.value;
    redrawCanvas();
  }
});

const shapeColorInput = document.getElementById("shapeColor");

shapeColorInput.addEventListener("input", () => {
  if (selectedObject && selectedObject.type === "shape") {
    selectedObject.color = shapeColorInput.value;
    redrawCanvas();
  }
});

const shapeLineWidthInput = document.getElementById("shapeLineWidth");
const shapeFillInput = document.getElementById("shapeFill");

shapeLineWidthInput.addEventListener("input", () => {
  if (selectedObject && selectedObject.type === "shape") {
    selectedObject.lineWidth = shapeLineWidthInput.value;
    redrawCanvas();
  }
});

shapeFillInput.addEventListener("change", () => {
  if (selectedObject && selectedObject.type === "shape") {
    selectedObject.fill = shapeFillInput.checked;
    redrawCanvas();
  }
});






// Undo / Redo / Delete
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") {
    if (undoStack.length) {
      redoStack.push(JSON.stringify(objects));
      objects.length = 0;
      objects.push(...JSON.parse(undoStack.pop()));
      redrawCanvas();
    }
  }
  if (e.ctrlKey && e.key === "y") {
    if (redoStack.length) {
      undoStack.push(JSON.stringify(objects));
      objects.length = 0;
      objects.push(...JSON.parse(redoStack.pop()));
      redrawCanvas();
    }
  }
  if (e.key === "Delete" && selectedObject) {
    saveState();
    const index = objects.indexOf(selectedObject);
    if (index > -1) {
      objects.splice(index, 1);
      selectedObject = null;
      redrawCanvas();
    }
  }
});

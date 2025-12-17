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
  });
}

const undoStack = [];
const redoStack = [];

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
}

function resetToolState() {
  isDrawing = false;
}

// 2️⃣-3 Tool state reset
function resetToolState() {
  isDrawing = false;
}

// 4️⃣-2 Tool seçimi event listener
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

// 4️⃣-1 Shape object model
function createShapeObject(type, x, y, width, height, color, lineWidth, fill) {
  return {
    type: "shape",
    shapeType: type, // rectangle, circle, line
    x, y, width, height,
    color,
    lineWidth,
    fill,
    locked: false
  };
}






ctx.fillStyle = "#f2f2f2";
ctx.fillRect(0, 0, canvas.width, canvas.height);

let isDrawing = false;



canvas.addEventListener("mousedown", (e) => {

  // 3️⃣-4 Text drag support
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  selectedObject = null;

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.type === "text") {
      const width = ctx.measureText(obj.text).width;
      const height = obj.size;

      if (
        x >= obj.x &&
        x <= obj.x + width &&
        y <= obj.y &&
        y >= obj.y - height
      ) {
        selectedObject = obj;
        dragOffsetX = x - obj.x;
        dragOffsetY = y - obj.y;
        break;
      }
    }
  }
});


canvas.addEventListener("mousedown", () => {
  isDrawing = true;
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (e) => {
  if (selectedObject && !selectedObject.locked) {
  const rect = canvas.getBoundingClientRect();
  selectedObject.x = e.clientX - rect.left - dragOffsetX;
  selectedObject.y = e.clientY - rect.top - dragOffsetY;
  redrawCanvas();
  return;
}

  if (!isDrawing) return;

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener("dblclick", () => {
  if (!selectedObject || selectedObject.type !== "text") return;

  const newText = prompt("Yeni metin:", selectedObject.text);
  if (!newText) return;

  saveState();
  selectedObject.text = newText;
  redrawCanvas();
  saveToLocal();
});





const textTool = document.getElementById("toolText");

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




let activeTool = "draw";

textTool.addEventListener("click", () => {
  activeTool = "text";
});

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


// 2️⃣-5 Keyboard shortcuts
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

  // 2️⃣-6 Delete ile silme
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



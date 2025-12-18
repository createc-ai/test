const canvas = document.getElementById("designCanvas");
const ctx = canvas.getContext("2d");

/* ================= GLOBAL STATE ================= */
const objects = [];
const undoStack = [];
const redoStack = [];

let activeTool = "draw";
let selectedObject = null;
let isDrawing = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

let showGrid = false;

/* ================= REDRAW ================= */
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // arka plan
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // GRID
  if (showGrid) {
    const gridSize = 25;
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  // OBJELER
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
    }

    if (obj.type === "image") {
      ctx.save();
      ctx.filter = obj.grayscale
        ? "grayscale(100%)"
        : `brightness(${obj.brightness})`;
      ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
      ctx.restore();
    }
  });

  // EMPTY HINT
  if (objects.length === 0) {
    ctx.fillStyle = "#aaa";
    ctx.font = "20px Inter";
    ctx.textAlign = "center";
    ctx.fillText("Start creating ✨", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
  }
}

/* ================= HELPERS ================= */
function saveState() {
  undoStack.push(JSON.stringify(objects));
  redoStack.length = 0;
}

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

function createShapeObject(x, y) {
  return {
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
}

function createImageObject(img, x, y) {
  return {
    type: "image",
    img,
    x,
    y,
    width: img.width * 0.5,
    height: img.height * 0.5,
    brightness: 1,
    grayscale: false,
    locked: false
  };
}

/* ================= MOUSE EVENTS ================= */
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  selectedObject = null;
  dragOffsetX = 0;
  dragOffsetY = 0;

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];

    if (obj.type === "text") {
      const w = ctx.measureText(obj.text).width;
      const h = obj.size;
      if (x >= obj.x && x <= obj.x + w && y <= obj.y && y >= obj.y - h) {
        selectedObject = obj;
        dragOffsetX = x - obj.x;
        dragOffsetY = y - obj.y;
        return;
      }
    }

    if (obj.type === "image") {
      if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
        selectedObject = obj;
        dragOffsetX = x - obj.x;
        dragOffsetY = y - obj.y;
        return;
      }
    }
  }

  if (activeTool === "shape") {
    selectedObject = createShapeObject(x, y);
    objects.push(selectedObject);
    saveState();
    isDrawing = true;
    return;
  }

  if (activeTool === "draw") {
    isDrawing = true;
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (selectedObject && !selectedObject.locked) {
    if (selectedObject.type === "text" || selectedObject.type === "image") {
      selectedObject.x = x - dragOffsetX;
      selectedObject.y = y - dragOffsetY;
      redrawCanvas();
      return;
    }

    if (selectedObject.type === "shape" && isDrawing) {
      selectedObject.width = x - selectedObject.x;
      selectedObject.height = y - selectedObject.y;
      redrawCanvas();
      return;
    }
  }

  if (!isDrawing) return;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  selectedObject = null;
  ctx.beginPath();
});

/* ================= TEXT ================= */
document.getElementById("toolText").addEventListener("click", () => {
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

  objects.push(createTextObject(text, x, y));
  redrawCanvas();
  activeTool = "draw";
});

/* ================= UNDO / REDO / DELETE ================= */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z" && undoStack.length) {
    redoStack.push(JSON.stringify(objects));
    objects.length = 0;
    objects.push(...JSON.parse(undoStack.pop()));
    redrawCanvas();
  }

  if (e.ctrlKey && e.key === "y" && redoStack.length) {
    undoStack.push(JSON.stringify(objects));
    objects.length = 0;
    objects.push(...JSON.parse(redoStack.pop()));
    redrawCanvas();
  }

  if (e.key === "Delete" && selectedObject) {
    saveState();
    objects.splice(objects.indexOf(selectedObject), 1);
    selectedObject = null;
    redrawCanvas();
  }
});

/* ================= EXTRA FEATURES ================= */

// Grid toggle
document.getElementById("toggleGrid").addEventListener("click", () => {
  showGrid = !showGrid;
  redrawCanvas();
});

// Save
document.getElementById("saveProject").onclick = () => {
  localStorage.setItem("project", JSON.stringify(objects));
};

// Load (CONST SAFE)
document.getElementById("loadProject").onclick = () => {
  const data = JSON.parse(localStorage.getItem("project")) || [];
  objects.length = 0;
  objects.push(...data);
  redrawCanvas();
};

// Bring front
document.getElementById("bringFront").onclick = () => {
  if (!selectedObject) return;
  const index = objects.indexOf(selectedObject);
  if (index === -1) return;
  objects.push(objects.splice(index, 1)[0]);
  redrawCanvas();
};

// Align center
document.getElementById("alignCenter").onclick = () => {
  if (!selectedObject) return;
  selectedObject.x = canvas.width / 2;
  selectedObject.y = canvas.height / 2;
  redrawCanvas();
};

// Autosave
setInterval(() => {
  localStorage.setItem("autosave", JSON.stringify(objects));
}, 5000);

redrawCanvas();

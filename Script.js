/* ================= CANVAS SETUP ================= */
const canvas = document.getElementById("designCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

/* ================= STATE ================= */
let objects = [];
let history = [];
let redoStack = [];

let activeTool = "select";
let isDragging = false;
let selectedObject = null;
let startX = 0;
let startY = 0;

/* ================= UTILS ================= */
function saveState() {
  history.push(JSON.stringify(objects));
  redoStack = [];
}

function restoreState(stackFrom, stackTo) {
  if (stackFrom.length === 0) return;
  stackTo.push(JSON.stringify(objects));
  objects = JSON.parse(stackFrom.pop());
  redraw();
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  objects.forEach(obj => drawObject(obj));
}

function drawObject(obj) {
  ctx.save();

  if (obj.type === "text") {
    ctx.fillStyle = obj.color;
    ctx.font = `${obj.size}px ${obj.font}`;
    ctx.fillText(obj.text, obj.x, obj.y);
  }

  if (obj.type === "rect") {
    ctx.fillStyle = obj.fill;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  }

  if (obj.type === "circle") {
    ctx.fillStyle = obj.fill;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (obj.type === "image") {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h);
  }

  ctx.restore();
}

/* ================= TOOLS ================= */
document.getElementById("toolText").onclick = () => activeTool = "text";
document.getElementById("toolRect").onclick = () => activeTool = "rect";
document.getElementById("toolCircle").onclick = () => activeTool = "circle";
document.getElementById("toolImage").onclick = () => activeTool = "image";
document.getElementById("toolSelect").onclick = () => activeTool = "select";
document.getElementById("toolUndo").onclick = () => restoreState(history, redoStack);
document.getElementById("toolRedo").onclick = () => restoreState(redoStack, history);
document.getElementById("toolClear").onclick = () => {
  saveState();
  objects = [];
  redraw();
};

/* ================= CANVAS EVENTS ================= */
canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;

  if (activeTool === "select") {
    selectedObject = objects.findLast(obj =>
      startX >= obj.x &&
      startX <= obj.x + (obj.w || 0) &&
      startY >= obj.y - (obj.h || 0) &&
      startY <= obj.y
    );
    isDragging = !!selectedObject;
  }

  if (activeTool === "rect") {
    saveState();
    objects.push({
      type: "rect",
      x: startX,
      y: startY,
      w: 0,
      h: 0,
      fill: "#5b5bff"
    });
    selectedObject = objects[objects.length - 1];
    isDragging = true;
  }

  if (activeTool === "circle") {
    saveState();
    objects.push({
      type: "circle",
      x: startX,
      y: startY,
      r: 0,
      fill: "#8f8fff"
    });
    selectedObject = objects[objects.length - 1];
    isDragging = true;
  }
});

canvas.addEventListener("mousemove", e => {
  if (!isDragging || !selectedObject) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (selectedObject.type === "rect") {
    selectedObject.w = x - startX;
    selectedObject.h = y - startY;
  }

  if (selectedObject.type === "circle") {
    selectedObject.r = Math.hypot(x - startX, y - startY);
  }

  if (activeTool === "select") {
    selectedObject.x = x;
    selectedObject.y = y;
  }

  redraw();
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  selectedObject = null;
});

/* ================= TEXT TOOL ================= */
canvas.addEventListener("click", e => {
  if (activeTool !== "text") return;

  const text = prompt("Metni gir:");
  if (!text) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  saveState();
  objects.push({
    type: "text",
    text,
    x,
    y,
    font: "Inter",
    size: 24,
    color: "#000000"
  });

  redraw();
});

/* ================= IMAGE TOOL ================= */
document.getElementById("imageUpload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    saveState();
    objects.push({
      type: "image",
      img,
      x: 100,
      y: 100,
      w: 200,
      h: 150
    });
    redraw();
  };
  img.src = URL.createObjectURL(file);
});

/* ================= DELETE ================= */
window.addEventListener("keydown", e => {
  if (e.key === "Delete" && selectedObject) {
    saveState();
    objects = objects.filter(obj => obj !== selectedObject);
    selectedObject = null;
    redraw();
  }
});

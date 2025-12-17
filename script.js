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

ctx.fillStyle = "#f2f2f2";
ctx.fillRect(0, 0, canvas.width, canvas.height);

let isDrawing = false;

canvas.addEventListener("mousedown", () => {
  isDrawing = true;
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (e) => {
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

const textTool = document.getElementById("toolText");

let activeTool = "draw";

textTool.addEventListener("click", () => {
  activeTool = "text";
});

canvas.addEventListener("click", (e) => {
  if (activeTool !== "text") return;

  const text = prompt("Yazıyı gir:");
  if (!text) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.fillStyle = "#000";
  ctx.font = "24px Inter";
  ctx.fillText(text, x, y);

  activeTool = "draw"; // otomatik çizime dön
});




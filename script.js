const canvas = document.getElementById("designCanvas");
const ctx = canvas.getContext("2d");

// === OBJECT STORAGE ===
const objects = []; 
// örnek: { type: "text", x, y, text, font, size, color }

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




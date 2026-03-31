const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [16, 48, 128];

function drawIcon(ctx, size) {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Face circle
  ctx.fillStyle = '#00d4ff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#1a1a2e';
  const eyeSize = size * 0.08;
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.45, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.6, size * 0.45, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = size * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(size/2, size * 0.5, size * 0.15, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
});

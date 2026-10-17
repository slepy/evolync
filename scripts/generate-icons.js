const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const sharp = require("sharp");

// Icon configurations
const ICONS = [
  { name: "icon.png", size: 1024, showAccent: false, fullBleed: true },
  { name: "adaptive-icon.png", size: 1024, showAccent: false },
  { name: "favicon.png", size: 48, showAccent: false }, // Too small for accent
  { name: "logo.png", size: 200, showAccent: true, halfBleed: true },
];

const OUTPUT_DIR = path.join(__dirname, "..", "assets", "images");

// Colors matching AppLogo.tsx
const GRADIENT_START = "#DC2626"; // Imperial Red
const GRADIENT_END = "#F59E0B"; // Chinese Gold
const TEXT_COLOR = "#FFFFFF"; // Pearl White
const ACCENT_GOLD = "#F59E0B";
const ACCENT_RED = "#DC2626";

async function generateIcon(config) {
  const { name, size, showAccent, fullBleed, halfBleed } = config;

  console.log(`Generating ${name} (${size}x${size}px)...`);

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Calculate dimensions
  const logoRatio = fullBleed ? 1.0 : halfBleed ? 0.8 : 0.65;
  const logoSize = size * logoRatio;
  const borderRadius = logoSize / 5;
  const fontSize = logoSize * 0.5;
  const accentMarginTop = logoSize * 0.15;
  const accentLineWidth = logoSize * 0.3;
  const accentDotSize = logoSize * 0.08;
  const accentLineHeight = logoSize * 0.02;

  // Center the logo
  const x = (size - logoSize) / 2;
  const y = showAccent
    ? (size - logoSize - accentMarginTop - accentLineHeight) / 2
    : (size - logoSize) / 2;

  // Draw rounded rectangle with gradient
  const gradient = ctx.createLinearGradient(x, y, x + logoSize, y + logoSize);
  gradient.addColorStop(0, GRADIENT_START);
  gradient.addColorStop(1, GRADIENT_END);

  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, logoSize, logoSize, borderRadius);

  // Draw shadow effect (simplified)
  ctx.shadowColor = "rgba(220, 38, 38, 0.3)";
  ctx.shadowBlur = size > 100 ? 12 : 4;
  ctx.shadowOffsetY = size > 100 ? 4 : 2;
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Draw letter "E"
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `800 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Add text shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = size > 100 ? 4 : 2;
  ctx.shadowOffsetY = size > 100 ? 2 : 1;

  ctx.fillText("E", x + logoSize / 2, y + logoSize / 2);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Draw accent line (if enabled)
  if (showAccent) {
    const accentY = y + logoSize + accentMarginTop;
    const centerX = size / 2;
    const gap = logoSize * 0.02;

    // Left line
    ctx.fillStyle = ACCENT_GOLD;
    ctx.fillRect(
      centerX - accentLineWidth - gap - accentDotSize / 2,
      accentY,
      accentLineWidth,
      accentLineHeight,
    );

    // Center dot
    ctx.fillStyle = ACCENT_RED;
    ctx.beginPath();
    ctx.arc(
      centerX,
      accentY + accentLineHeight / 2,
      accentDotSize / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Right line
    ctx.fillStyle = ACCENT_GOLD;
    ctx.fillRect(
      centerX + gap + accentDotSize / 2,
      accentY,
      accentLineWidth,
      accentLineHeight,
    );
  }

  // Convert canvas to buffer
  const buffer = canvas.toBuffer("image/png");

  // Use sharp for final processing (better quality)
  await sharp(buffer).png({ quality: 100 }).toFile(path.join(OUTPUT_DIR, name));

  console.log(`✓ Generated ${name}`);
}

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Main function
async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Starting icon generation...\n");

  // Generate all icons
  for (const config of ICONS) {
    await generateIcon(config);
  }

  console.log("\n✨ All icons generated successfully!");
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

// Run
main().catch(console.error);

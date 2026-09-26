import sharp from 'sharp';
import fs from 'fs';

async function generate() {
  const svg = fs.readFileSync('public/favicon.svg');
  
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
    
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
    
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
    
  console.log("Icons generated successfully!");
}

generate().catch(console.error);

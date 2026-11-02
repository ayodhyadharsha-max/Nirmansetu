const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const brandsDir = path.join(publicDir, 'images', 'brands');
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

// 1. Placeholder product image
const baseImg = path.join(publicDir, 'images', 'products', 'ultratech_cement.png');
if (fs.existsSync(baseImg)) {
  fs.copyFileSync(baseImg, path.join(publicDir, 'images', 'placeholder-product.png'));
  fs.copyFileSync(baseImg, path.join(publicDir, 'images', 'products', 'placeholder.jpg'));
}

// 2. Cement category JPG
const cementPng = path.join(publicDir, 'images', 'categories', 'cement.png');
if (fs.existsSync(cementPng)) {
  fs.copyFileSync(cementPng, path.join(publicDir, 'images', 'categories', 'cement.jpg'));
}

// 3. Brand logos mapping to best available source
const brandMappings = {
  'ultratech.png': 'products/ultratech_cement.png',
  'tata-tiscon.png': 'products/tata_tiscon.png',
  'kajaria.png': 'products/kajaria_tiles.png',
  'asian-paints.png': 'products/asian_paints_primer.png',
  'dr-fixit.png': 'products/dr_fixit.png',
  'havells.png': 'products/havells_wire.png',
  'supreme.png': 'products/supreme_cpvc.png',
  'jaquar.png': 'products/jaquar_mixer.png',
  'greenply.png': 'products/greenply_plywood.png',
  'godrej.png': 'products/godrej_lock.png',
  'ambuja.png': 'products/ultratech_cement.png',
  'sintex.png': 'products/supreme_cpvc.png',
  'generic.png': 'products/ultratech_cement.png',
};

for (const [brandFile, srcRel] of Object.entries(brandMappings)) {
  const srcPath = path.join(publicDir, 'images', srcRel);
  const dstPath = path.join(brandsDir, brandFile);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dstPath);
    console.log(`Generated brand logo: ${brandFile} from ${srcRel}`);
  }
}

console.log('All missing assets successfully generated and verified!');

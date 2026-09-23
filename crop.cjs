const fs = require('fs');
const Jimp = require('jimp');

const files = [
  'media_1790135261772.png',
  'media_1790135270091.png',
  'media_1790135277070.png',
  'media_1790135287453.png',
  'media_1790135295762.png'
];

const inputDir = 'C:\\Users\\hongq\\.gemini\\antigravity-ide\\brain\\568fbc62-1a4d-4931-a7bc-3db50f88c516\\.user_uploaded\\';
const outputDir = 'C:\\Users\\hongq\\.gemini\\antigravity-ide\\scratch\\new_project\\public\\dogs\\';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processImage(filename, index) {
  try {
    const image = await Jimp.read(inputDir + filename);
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      var r = this.bitmap.data[idx + 0];
      var g = this.bitmap.data[idx + 1];
      var b = this.bitmap.data[idx + 2];
      
      // Blue background logic
      if (b > r + 20 && b > g + 10 && r < 180 && g < 200) {
        this.bitmap.data[idx + 3] = 0; // transparent
      }
    });
    
    // Attempt to autocrop the transparent edges
    try {
      image.autocrop();
    } catch(e) {}

    await image.writeAsync(outputDir + 'dog' + index + '.png');
    console.log('Processed', filename);
  } catch(e) {
    console.error('Error processing', filename, e);
  }
}

async function run() {
  for (let i = 0; i < files.length; i++) {
    await processImage(files[i], i + 1);
  }
}

run();

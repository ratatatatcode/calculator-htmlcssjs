const fs = require('fs');
const path = require('path');

// Helper to get default profile picture as data URL
function toDataUrl() {
  try {
    const filePath = path.join(__dirname, '../public/images/default.jpg');
    const img = fs.readFileSync(filePath);
    return 'data:image/png;base64,' + Buffer.from(img).toString('base64');
  } catch (e) {
    return null;
  }
}

module.exports = toDataUrl
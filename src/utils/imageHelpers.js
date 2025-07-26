const fs = require("fs");
const path = require("path");

function toDataUrl() {
  try {
    const filePath = path.join(__dirname, "../public/images/default.jpg");
    const img = fs.readFileSync(filePath);
    return "data:image/png;base64," + Buffer.from(img).toString("base64");
  } catch (e) {
    return null;
  }
}

module.exports = toDataUrl;

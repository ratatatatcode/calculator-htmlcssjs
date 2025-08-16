const fs = require("fs");
const path = require("path");
const { pipeline } = require('@huggingface/transformers');

class AuthUtils {
  toDataUrl() {
    try {
      const filePath = path.join(__dirname, "@/public/images/profile/default.jpg");
      const img = fs.readFileSync(filePath);
      return "data:image/png;base64," + Buffer.from(img).toString("base64");
    } catch (e) {
      return null;
    }
  }

  async calculateEmbeddings(skills) {
    const vectors = []

    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { pooling: "none", normalize: true });
    const embeddings = await extractor(skills, { pooling: 'none', normalize: true });
    
    const numSkills = skills.length;
    const embeddingSize = embeddings.data.length / numSkills;

    const avgVector = new Array(embeddingSize).fill(0);
    for (let i = 0; i < embeddings.data.length; i++) {
      avgVector[i % embeddingSize] += embeddings.data[i];
    }
    for (let i = 0; i < avgVector.length; i++) {
      avgVector[i] /= numSkills;
    }

    return avgVector;
  }
}


module.exports = AuthUtils;

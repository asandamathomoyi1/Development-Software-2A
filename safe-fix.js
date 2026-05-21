const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Remove duplicate admin declarations
const lines = content.split('\n');
const newLines = [];
let foundAdmin = false;
let skipMode = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip duplicate admin declarations after first
  if (line.includes("const admin = require('firebase-admin')") && foundAdmin) {
    continue;
  }
  if (line.includes("const admin = require('firebase-admin')")) {
    foundAdmin = true;
    newLines.push(line);
    // Add service account right after
    newLines.push("const serviceAccount = require('./digital-mental-health-pl-7df78-firebase-adminsdk-fbsvc-b5a9543bbb.json');");
    continue;
  }
  
  // Skip duplicate serviceAccount declarations
  if (line.includes("const serviceAccount = require") && foundAdmin) {
    continue;
  }
  
  // Skip old initializeApp blocks
  if (line.includes("admin.initializeApp") || (line.includes("if (!admin.apps.length)") && lines[i+1] && lines[i+1].includes("admin.initializeApp"))) {
    skipMode = true;
    continue;
  }
  if (skipMode && (line.includes("}") || line.includes("});"))) {
    skipMode = false;
    continue;
  }
  
  newLines.push(line);
}

// Add proper initialization at the top if not exists
let result = newLines.join('\n');
if (!result.includes("if (!admin.apps.length)")) {
  result = result.replace(
    /const admin = require\('firebase-admin'\);\nconst serviceAccount = require/,
    `const admin = require('firebase-admin');
const serviceAccount = require('./digital-mental-health-pl-7df78-firebase-adminsdk-fbsvc-b5a9543bbb.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const serviceAccount = require`
  );
}

fs.writeFileSync('server.js', result);
console.log('✅ Server fixed! Now run: node server.js');

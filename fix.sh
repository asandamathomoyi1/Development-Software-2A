#!/bin/bash
cp server.js server.js.backup
cat server.js.backup | grep -v "const admin = require" | grep -v "const serviceAccount = require" | grep -v "admin.initializeApp" | grep -v "if" | grep -v "const db = admin.firestore" > server.js
echo "const admin = require('firebase-admin');" > temp.js
echo "const serviceAccount = require('./digital-mental-health-pl-7df78-firebase-adminsdk-fbsvc-b5a9543bbb.json');" >> temp.js
echo "if (!admin.apps.length) {" >> temp.js
echo "  admin.initializeApp({" >> temp.js
echo "    credential: admin.credential.cert(serviceAccount)" >> temp.js
echo "  });" >> temp.js
echo "}" >> temp.js
echo "const db = admin.firestore();" >> temp.js
echo "" >> temp.js
cat server.js >> temp.js
mv temp.js server.js
rm -f temp.js
echo "Done! Now run: node server.js"

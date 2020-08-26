var admin = require("firebase-admin");
const { databaseURL, storageBucket } = require("./config");
var serviceAccount = require("./cedar-mingle-firebase-adminsdk-dev.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
  storageBucket,
});

const db = admin.firestore();

module.exports = { admin, db };

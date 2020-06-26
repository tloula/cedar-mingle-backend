var admin = require("firebase-admin");

var serviceAccount = require("./cedar-mingle-firebase-adminsdk-av7l6-5483d645e1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cedar-mingle.firebaseio.com",
});

const db = admin.firestore();

module.exports = { admin, db };

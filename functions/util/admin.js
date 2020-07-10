var admin = require("firebase-admin");

var serviceAccount = require("./cedar-mingle-firebase-adminsdk-av7l6-b62ec744bd.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cedar-mingle.firebaseio.com",
  storageBucket: "cedar-mingle.appspot.com",
});

const db = admin.firestore();

module.exports = { admin, db };

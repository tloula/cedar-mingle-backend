const functions = require("firebase-functions");

var admin = require("firebase-admin");
var serviceAccount = require("./cedar-mingle-firebase-adminsdk-av7l6-5483d645e1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cedar-mingle.firebaseio.com",
});

const app = require("express")();

const config = {
  apiKey: "AIzaSyBUm473Su_sV2W8xXLR3RnNXEhKT9soW9I",
  authDomain: "cedar-mingle.firebaseapp.com",
  databaseURL: "https://cedar-mingle.firebaseio.com",
  projectId: "cedar-mingle",
  storageBucket: "cedar-mingle.appspot.com",
  messagingSenderId: "454983196248",
  appId: "1:454983196248:web:591ab2598b6290c193742d",
  measurementId: "G-W53C7MN504",
};

const firebase = require("firebase");
firebase.initializeApp(config);

const db = admin.firestore();

// GET Screams
app.get("/screams", (request, response) => {
  db.collection("screams")
    .orderBy("timestamp", "desc")
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          username: doc.data().username,
          timestame: doc.data().timestamp,
        });
      });
      return response.json(screams);
    })
    .catch((err) => console.error(err));
});

// Authorization Middleware
const FBAuth = (request, response, next) => {
  let idToken;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = request.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return response.status(403).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      request.user = decodedToken;
      console.log(decodedToken);
      return db
        .collection("users")
        .where("userId", "==", request.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      request.user.username = data.docs[0].data().username;
      return next();
    })
    .catch((err) => {
      console.error("Error while verifying token ", err);
      return response.status(403).json(err);
    });
};

// POST Scream
app.post("/scream", FBAuth, (request, response) => {
  if (request.body.body.trim() === "") {
    return response.status(500).json({ body: "Body must not be empty" });
  }

  const newScream = {
    body: request.body.body,
    username: request.user.username,
    timestamp: new Date().toISOString(),
  };

  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      response.json({ message: `document ${doc.id} created sucessfully` });
    })
    .catch((err) => {
      response.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

// Checks if param is empty
const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

// Checks if param is valid email syntax
const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

// POST Signup
app.post("/signup", (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    username: request.body.username,
  };

  // Validate User's Information
  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Email Required";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Invalid Email Address";
  }

  if (isEmpty(newUser.password)) errors.password = "Password Required";
  if (isEmpty(newUser.username)) errors.username = "Username Required";
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  if (Object.keys(errors).length > 0) return response.status(400).json(errors);

  let token, userId;

  db.doc(`/users/${newUser.username}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return response
          .status(400)
          .json({ username: "this username is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        username: newUser.username,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return response.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code == "auth/email-already-in-use") {
        return response.status(400).json({ email: "Email is already in use" });
      } else {
        return response.status(500).json({ error: err.code });
      }
    });
});

// POST Login
app.post("/login", (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password,
  };

  let errors = {};

  if (isEmpty(user.email)) errors.email = "Email is empty";
  if (isEmpty(user.password)) errors.password = "Password is empty";

  if (Object.keys(errors).length > 0) return response.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return response.json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return response.status(403).json({ general: "Invalid credentials" });
      } else {
        return response.status(500).json({ error: err.code });
      }
    });
});

// https://baseurl.com/api/
exports.api = functions.https.onRequest(app);

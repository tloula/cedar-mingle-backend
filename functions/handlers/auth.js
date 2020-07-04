// Helpers
const { admin, db } = require("../util/admin");
const config = require("../util/config");

// Initialize Firebase
const firebase = require("firebase");
firebase.initializeApp(config);

// Validators
const { validateSignupData, validateLoginData } = require("../util/validators");
const { user } = require("firebase-functions/lib/providers/auth");

// Signup Route
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  let token, userId;
  return firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then((data) => {
      data.user
        .sendEmailVerification()
        .then(() => {
          // Email Sent
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json("Send Email Verification Failed");
        });
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        userId,
        email: newUser.email,
        name: "",
        gender: "",
        birthday: "",
        gradYear: "",
        major: "",
        hometown: "",
        about: "",
        interests: "",
        visible: true,
        createdAt: new Date().toISOString(),
        likes: [],
        dislikes: [],
        matches: [],
      };
      return db.doc(`/users/${newUser.email}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res
          .status(400)
          .json({ email: "You already have an account, please login" });
      } else {
        return res
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
    });
};

// Login Route
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      //verified = data.user.emailVerified;
      return data.user.getIdToken();
    })
    .then((token) => {
      //if (!verified)
      //return res.status(401).json({ general: "Email has not been verified" });
      return res.status(200).json({ token });
    })
    .catch((err) => {
      console.error(err);
      // auth/wrong-password
      // auth/user-not-user
      return res
        .status(403)
        .json({ general: "Wrong credentials, please try again" });
    });
};

// Resend Verification Email Route
exports.resendVerificationEmail = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      if (!data.user.emailVerified) {
        data.user
          .sendEmailVerification()
          .then(() => {
            return res.status(200).json({ message: "Verification Email Sent" });
          })
          .catch((err) => {
            console.error(err);
            return res
              .status(500)
              .json({ error: "Error Sending Verification Email" });
          });
      } else {
        return res.status(304).json({ error: "Email Already Verified" });
      }
    })
    .catch((err) => {
      console.error(err);
      // auth/wrong-password
      // auth/user-not-user
      return res
        .status(403)
        .json({ general: "Wrong credentials, please try again" });
    });
};

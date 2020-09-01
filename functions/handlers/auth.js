// Axios
const axios = require("axios");

// Helpers
const { db } = require("../util/admin");
const config = require("../util/config");

// Firebase API Key
const { apiKey } = require("../util/config");

// Initialize Firebase
const firebase = require("firebase");
firebase.initializeApp(config);

// Validators
const {
  validateSignupData,
  validateLoginData,
  validatePassword,
  validateEmail,
} = require("../util/validators");

// Signup Route
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email ? req.body.email.toLowerCase() : "",
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    gender: req.body.gender,
    legal: req.body.legal,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  let idToken, refreshToken, uid;
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
      uid = data.user.uid;
      refreshToken = data.user.refreshToken;
      return data.user.getIdToken();
    })
    .then((token) => {
      idToken = token;
      const data = {
        uid,
        email: newUser.email,
        emails: {
          matches: true,
          messages: true,
          notifications: true,
        },
        gender: newUser.gender,
        visible: false,
        premium: false,
        boost: false,
        recycle: false,
        count: 0,
        created: new Date().toISOString(),
        images: [],
        likes: [],
        dislikes: [],
        matches: [],
      };
      return db.doc(`/users/${newUser.email}`).set(data);
    })
    .then(() => {
      return res.status(201).json({ idToken, refreshToken });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "You already have an account, please login" });
      } else {
        return res.status(500).json({ general: "Something went wrong, please try again" });
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

  let refreshToken;
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      refreshToken = data.user.refreshToken;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      return res.status(200).json({ idToken, refreshToken });
    })
    .catch((err) => {
      console.error(err);
      // auth/wrong-password
      // auth/user-not-user
      return res.status(400).json({ general: "Wrong credentials, please try again" });
    });
};

exports.token = (req, res) => {
  var url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
  var params = `grant_type=refresh_token&refresh_token=${req.body.refresh_token}`;

  axios
    .post(url, params)
    .then((apiRes) => {
      return res.status(201).json({ FBIdToken: apiRes.data.id_token });
    })
    .catch((err) => {
      console.error(err.message);
      return res.status(500).json({ error: "Error refreshing token" });
    });
};

// Resend Verification Email Route
exports.resendVerificationEmail = (req, res) => {
  firebase
    .auth()
    .signInWithCustomToken(req.user.token)
    .then((data) => {
      if (!data.user.emailVerified) {
        data.user
          .sendEmailVerification()
          .then(() => {
            return res.status(200).json({ message: "Verification email sent" });
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: "Error sending verification email" });
          });
      } else {
        return res.status(400).json({ error: "Email already verified" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(400).json({ error: err.code });
    });
};

// Change password route
exports.changePassword = (req, res) => {
  const data = {
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  };

  const { valid, errors } = validatePassword(data);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithCustomToken(req.user.token)
    .then(() => {
      firebase.auth().currentUser.updatePassword(data.password);
    })
    .then(() => {
      return res.status(200).json({ message: "Password sucessfully updated" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Forgot password route
exports.forgotPassword = (req, res) => {
  const { valid, errors } = validateEmail(req.body.email);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .sendPasswordResetEmail(req.body.email)
    .then(() => {
      return res
        .status(200)
        .json({ message: "An email with instructions to reset your password has been sent" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(400).json({ email: "Must enter an email" });
    });
};

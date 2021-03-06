// Helpers
const { admin, db } = require("../util/admin");
const { storageBase, storageBucket } = require("../util/config");
const config = require("../util/config");

// Initialize Firebase
const firebase = require("firebase");

const { age } = require("../util/helpers");
const { validateUserProfile, validateUserSettings } = require("../util/validators");

const { v4: uuidv4 } = require("uuid");

const imageSize = require("image-size");

// Update User Profile Route
exports.updateUserProfile = (req, res) => {
  const { valid, errors, userProfile } = validateUserProfile(req.body);
  if (!valid) return res.status(400).json(errors);

  db.doc(`/users/${req.user.email}`)
    .update(userProfile)
    .then(() => {
      return res.status(200).json({ message: "Profile updated successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Update User Settings Route
exports.updateUserSettings = (req, res) => {
  let _valid, _errors;

  // Refresh user in case they just verified their email
  firebase
    .auth()
    .signInWithCustomToken(req.user.token)
    .then(() => {
      return db.collection(`users`).where("uid", "==", req.user.uid).limit(1).get();
    })
    .then((data) => {
      image = data.docs[0].data().images[0] ? true : false;
      profileComplete = data.docs[0].data().name ? true : false;

      const { valid, errors, userSettings } = validateUserSettings(
        req.body,
        firebase.auth().currentUser.emailVerified,
        image,
        profileComplete
      );
      _valid = valid;
      _errors = errors;

      db.doc(`/users/${req.user.email}`).update(userSettings);
    })
    .then(() => {
      if (!_valid) return res.status(400).json(_errors);
      else return res.status(200).json({ message: "Settings updated successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get Any Users Details Route
exports.getUserDetails = (req, res) => {
  db.collection(`users`)
    .where("uid", "==", req.params.uid)
    .limit(1)
    .get()
    .then((docs) => {
      doc = docs.docs[0];
      if (doc) {
        data = doc.data();
        return res.status(200).json({
          profile: {
            about: data.about,
            age: age(data.birthday),
            dream: data.dream,
            gender: data.gender,
            hometown: data.hometown,
            images: data.images,
            interests: data.interests,
            major: data.major,
            name: data.name,
            occupation: data.occupation,
            uid: data.uid,
            website: data.website,
            year: data.year,
          },
        });
      } else {
        return res.status(404).json({ error: "User not found" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get Authenticated User Profile Route
exports.getAuthenticatedUserProfile = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      if (doc) {
        let data = doc.data();
        return res.status(200).json({
          profile: {
            about: data.about,
            birthday: data.birthday,
            dream: data.dream,
            created: data.created,
            gender: data.gender,
            hometown: data.hometown,
            images: data.images,
            interests: data.interests,
            major: data.major,
            name: data.name,
            occupation: data.occupation,
            uid: data.uid,
            website: data.website,
            year: data.year,
          },
          settings: {
            boost: data.boost,
            email: data.email,
            emails: data.emails,
            premium: data.premium,
            recycle: data.recycle,
            verified: req.user.email_verified,
            visible: data.visible,
          },
        });
      } else {
        console.error("Could not access user document");
        return res.status(500).json({ error: "Internal error accessing user document" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get Authenticated User Settings Route
exports.getAuthenticatedUserSettings = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      if (doc) {
        let data = doc.data();
        return res.status(200).json({
          settings: {
            boots: data.boost,
            email: data.email,
            emails: data.emails,
            premium: data.premium,
            recycle: data.recycle,
            verified: req.user.email_verified,
            visible: data.visible,
          },
        });
      } else {
        console.error("Could not access user document");
        return res.status(500).json({ error: "Internal error accessing user document" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Image Upload Route
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;
  // String for image token
  let generatedToken = uuidv4();
  let imageUrl;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }

    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];

    // Generate New Filename 32756238461724837.png
    imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;

    // Get OS Path
    const filepath = path.join(os.tmpdir(), imageFileName);

    // Get Image Details
    imageToBeUploaded = { filepath, mimetype };

    // Create File Stream
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            //Generate token to be appended to imageUrl
            firebaseStorageDownloadTokens: generatedToken,
          },
        },
        destination: `photos/${req.user.uid}/${imageFileName}`,
      })
      .then(() => {
        // Calculate dimensions
        const dimensions = imageSize(imageToBeUploaded.filepath);
        // Append token to url
        imageUrl = `${storageBase}/${storageBucket}/o/photos%2F${req.user.uid}%2F${imageFileName}?alt=media&token=${generatedToken}`;
        // Append Photo URL to Array if URLS
        return db.doc(`/users/${req.user.email}`).update({
          images: admin.firestore.FieldValue.arrayUnion({
            src: imageUrl,
            width: dimensions.width,
            height: dimensions.height,
          }),
        });
      })
      .then(() => {
        return res.status(200).json({ message: "Image uploaded successfully", url: imageUrl });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};

// Remove Photo Route
exports.removeImage = (req, res) => {
  let photo = req.body;
  if (typeof photo === "undefined") res.status(400).json({ error: "No photo specified" });
  db.doc(`/users/${req.user.email}`)
    .update({
      images: admin.firestore.FieldValue.arrayRemove(photo),
    })
    .then(() => {
      // Dont delete placeholder photo
      if (
        photo.src ===
        `${storageBase}/${storageBucket}/o/placeholder.png?alt=media&token=0cd1c3a5-51d6-43de-a0e1-17d04161e7d3`
      )
        res.status(200).json({ message: "Photo deleted successfully" });
      // Get filename including user folder
      var begin = photo.src.search("%2F") + 3;
      var end = photo.src.search("alt") - 1;
      var filename = photo.src.substring(begin, end);

      // Remove user folder from string
      begin = filename.search("%2F") + 3;
      end = filename.length;
      filename = filename.substring(begin, end);

      admin
        .storage()
        .bucket()
        .deleteFiles({
          prefix: `photos/${req.user.uid}/${filename}`,
        })
        .then(() => {
          res.status(200).json({ message: "Photo deleted successfully" });
        });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.rearrangeImage = (req, res) => {
  return db
    .doc(`/users/${req.user.email}`)
    .update({
      images: req.body.images,
    })
    .then(() => {
      return res.status(200).json({ message: "Sucessfully rearranged photos" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.status(200).json({ message: "Notifications marked read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.markMessagesRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((msg) => {
    const message = db.doc(`/conversations/${msg.cid}/messages/${msg.mid}`);
    batch.update(message, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.status(200).json({ message: "Messages marked read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getNotifications = (req, res) => {
  let notifications = {};
  db.collectionGroup("messages")
    .where("receiver.uid", "==", req.user.uid)
    .where("read", "==", false)
    .get()
    .then((messages) => {
      notifications.messages = [];
      messages.forEach((message) => {
        let data = message.data();
        data.mid = message.id;
        notifications.messages.push(data);
      });
      return db
        .collection("notifications")
        .where("receiver.uid", "==", req.user.uid)
        .where("read", "==", false)
        .orderBy("created", "desc")
        .limit(10)
        .get();
    })
    .then((data) => {
      notifications.notifications = [];
      data.forEach((doc) => {
        notifications.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          created: doc.data().created,
          type: doc.data().type,
          read: doc.data().read,
          content: doc.data().content,
          nid: doc.id,
        });
      });
      return res.status(200).json(notifications);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.deleteAccount = (req, res) => {
  console.log("User requested account deletion for " + req.user.email);
  firebase
    .auth()
    .currentUser.delete()
    .then(() => {
      return res.status(200).json({ message: "Account deleted." });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

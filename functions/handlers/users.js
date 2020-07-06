// Helpers
const { admin, db } = require("../util/admin");
const { config, storageBase, storageBucket } = require("../util/config");

const { validateUserDetails } = require("../util/validators");

const { v4: uuidv4 } = require("uuid");

// Update User Details Route
exports.addUserDetails = (req, res) => {
  const { valid, errors, userDetails } = validateUserDetails(req.body);
  if (!valid) return res.status(400).json(errors);

  if (req.body.visible === true && !req.user.email_verified)
    return res
      .status(400)
      .json({ visible: "Must verify email before making account visible" });

  db.doc(`/users/${req.user.email}`)
    .update(userDetails)
    .then(() => {
      return res.status(200).json({ message: "Details added successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get Any Users Details Route
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.collection(`users`)
    .where("userId", "==", req.params.userId)
    .limit(1)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        if (doc.exists) {
          userData.user = doc.data();
          return res.status(200).json(userData);
        } else {
          return res.status(404).json({ error: "User not found" });
        }
      });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get User Details Route
exports.getAuthenticatedUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("receiver", "==", req.user.uid)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data().sender);
      });
      return db
        .collection("notifications")
        .where("recipient", "==", req.user.uid)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
    })
    .then((data) => {
      userData.notifications = [];
      data.forEach((doc) => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          type: doc.data().type,
          read: doc.data().read,
          body: doc.data().body,
          notificationId: doc.id,
        });
      });
      return res.status(200).json(userData);
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
    //console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }

    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];

    // Generate New Filename 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;

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
        // Append token to url
        imageUrl = `${storageBase}/${storageBucket}/o/photos%2F${req.user.uid}%2F${imageFileName}?alt=media&token=${generatedToken}`;
        // Append Photo URL to Array if URLS
        return db.doc(`/users/${req.user.email}`).update({
          imageUrls: admin.firestore.FieldValue.arrayUnion(imageUrl),
        });
      })
      .then(() => {
        return res
          .status(200)
          .json({ message: "Image uploaded successfully", url: imageUrl });
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
  let url = req.body.url;
  db.doc(`/users/${req.user.email}`)
    .update({
      imageUrls: admin.firestore.FieldValue.arrayRemove(url),
    })
    .then(() => {
      var end = url.search("alt") - 1;
      var filename = url.substring(end - 16, end);
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

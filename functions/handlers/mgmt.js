// Helpers
const { admin, db } = require("../util/admin");

// Validators
const { validateReportDetails } = require("../util/validators");

// Nodemailer
const { transporter, reportMail, messageMail, matchMail } = require("../util/nodemailer");

// Report Route
exports.reportUser = (req, res) => {
  const { valid, errors } = validateReportDetails(req.body);
  if (!valid) return res.status(400).json(errors);

  const report = {
    description: req.body.description,
    reason: req.body.reason,
    reporter: {
      uid: req.user.uid,
    },
    reported: {
      uid: req.body.reported,
    },
    created: new Date().toISOString(),
  };

  db.collection("users")
    .where("uid", "==", report.reporter.uid)
    .limit(1)
    .get()
    .then((docs) => {
      report.reporter.name = docs.docs[0].data().name;
      report.reporter.email = docs.docs[0].data().email;
      return db.collection("users").where("uid", "==", report.reported.uid).limit(1).get();
    })

    .then((docs) => {
      report.reported.name = docs.docs[0].data().name;
      report.reported.email = docs.docs[0].data().email;
      db.collection("reports").add(report);
    })

    .then(() => {
      return res.status(200).json({ message: "User sucessfully reported" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

/*exports.resetSwipeCount = (req, res) => {
  twentyfourHoursAge = new Date(Date.now() - 86400 * 1000).toISOString();
  let batch = db.batch();
  db.collection("users")
    .where("online", ">", twentyfourHoursAge)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        batch.update(doc.ref, { count: 0 });
      });
      batch.commit();
    })
    .then(() => {
      return res.status(200).json({ message: "Sucessfully reset all user's swipe count" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.test = (req, res) => {
  let usersToEmail = new Map();
  db.collection("notifications")
    .where("read", "==", false)
    .where("type", "==", "match")
    .get()
    .then((docs) => {
      // Count numer of matches each user has
      docs.forEach((doc) => {
        let key = doc.data().receiver.uid;
        if (usersToEmail.has(key)) {
          let value = usersToEmail.get(key);
          usersToEmail.set(key, ++value);
        } else {
          usersToEmail.set(key, 1);
        }
      });

      // Send each user their matches
      usersToEmail.forEach((count, uid) => {
        console.log("UID:", uid, "Count:", count);
        db.collection("users")
          .where("uid", "==", uid)
          .limit(1)
          .get()
          .then((docs) => {
            let doc = docs.docs[0];
            if (!doc) {
              console.error("Notified user's profile doc not found");
            }
            return transporter
              .sendMail(matchMail(count, doc.data().name, doc.data().email))
              .catch((err) => {
                console.error(err);
              });
          });
      });
    })
    .then(() => {
      return res.status(200).json({ message: "Done" });
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.deleteUser = (req, res) => {
  var user = req.user;

  db.doc(`/users/${user.email}`)
    .get()
    .then((doc) => {
      // Delete user from pool
      db.doc(`/groups/${doc.data().gender}`)
        .update({
          uids: admin.firestore.FieldValue.arrayRemove(user.uid),
        })
        .catch((err) => {
          console.error(`Error deleting user from pool ${user.uid}`, err);
        });

      // Delete user's photos
      if (doc.data().images[0]) {
        doc.data().images.forEach((photo) => {
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
              prefix: `photos/${user.uid}/${filename}`,
            })
            .catch((err) => {
              console.error(`Error deleting photo for user ${user.uid}`, err);
            });
        });
      }

      // Delete user's matches
      if (doc.data().matches[0]) {
        doc.data().matches.forEach((match) => {
          let matchToRemove;
          db.collection(`users`)
            .where("uid", "==", match.uid)
            .limit(1)
            .get()
            .then((docs) => {
              let tempDoc = docs.docs[0];
              // Find match object
              tempDoc.data().matches.forEach((match) => {
                if (match.uid === user.uid) matchToRemove = match;
              });
              db.doc(`/users/${tempDoc.data().email}`).update({
                matches: admin.firestore.FieldValue.arrayRemove(matchToRemove),
              });
            })
            .catch((err) => {
              console.error(`Error deleting matches for user ${user.uid}`, err);
            });
        });
      }
    })
    .then(() => {
      // Delete user's data
      db.collection("users")
        .doc(user.email)
        .delete()
        .then(() => {
          console.log(`Completely deleted user ${user.uid}, ${user.email}`);
        })
        .catch((err) => {
          console.error(`Error deleting data for user ${user.uid}`, err);
        });
    });
  return;
};
*/

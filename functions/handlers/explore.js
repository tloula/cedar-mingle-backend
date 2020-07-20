// Helpers
const { admin, db } = require("../util/admin");
const { calculateAgeFromMY, shuffle } = require("../util/helpers");
const { MAX_SWIPES, REQUIRE_VERIFIED_EMAIL } = require("../util/constants");

// Explore Route
exports.explore = (req, res) => {
  // Confirm that the authenticated user's account is activated before proceeding
  if (REQUIRE_VERIFIED_EMAIL && !req.user.email_verified)
    return res.status(401).json({ error: "Email has not been verified" });

  var found = false;
  var genderPool;
  var recycleEnabled = false;
  var recycle = false;
  var pool = new Array();
  var likes = new Set();
  var dislikes = new Set();

  // Get authenticated user's swipe history
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        console.error(err);
        return res.status(404).json({ error: "Authenticated user not found" });
      }

      // Limit numer of swipes
      if (doc.data().count > MAX_SWIPES && doc.data().premium !== true)
        return res
          .status(200)
          .json({ message: "You have reached you maximum swipes for today. Check back tomorrow!" });

      // Select gender pool to search
      if (doc.data().gender === "male") {
        genderPool = "female";
      } else {
        genderPool = "male";
      }

      // Determine if user has enabled recycling
      if (doc.data().recycle === true) recycleEnabled = true;

      // Add user's likes to swipe history set
      if (doc.data().likes !== "") {
        doc.data().likes.forEach((uid) => {
          likes.add(uid);
        });
      }

      // Add user's dislikes to swipe history set
      if (doc.data().dislikes !== "") {
        doc.data().dislikes.forEach((uid) => {
          dislikes.add(uid);
        });
      }

      // Get all eligible users to swipe on
      return db
        .doc(`/groups/${genderPool}`)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            return res.status(500).json({ error: "Internal Error finding available users" });
          }

          // Push all users to pool array
          if (doc.data().uids !== "") {
            doc.data().uids.forEach((uid) => {
              pool.push(uid);
            });
          }

          // Shuffle the pool
          shuffle(pool);

          // Recycle Profiles if the authenticated user has enabled profile recycling and
          // has already swiped through all other users
          if (recycleEnabled && likes.size + dislikes.size >= pool.length) recycle = true;

          // Iterate through the shuffled pool to find a user not swiped on
          for (i = 0; i < pool.length && !found; i++) {
            let uid = pool[i];
            console.log(`UID: ${uid}`);
            if (!likes.has(uid) && (recycle || !dislikes.has(uid))) {
              found = uid;
            }
          }

          if (found) {
            // Retrive user profile
            console.log(`RETRIEVING: ${found}`);
            return db
              .collection(`users`)
              .where("uid", "==", found)
              .limit(1)
              .get()
              .then((docs) => {
                if (!docs.docs[0].exists)
                  return res.status(500).json({ error: "Internal error retrieving users profile" });

                // Return profile
                profile = docs.docs[0].data();
                card = {
                  name: profile.name,
                  major: profile.major,
                  images: profile.images,
                  about: profile.about,
                  interests: profile.interests,
                  uid: profile.uid,
                  year: profile.year,
                  hometown: profile.hometown,
                  age: calculateAgeFromMY(profile.birthday),
                };
                return res.status(200).json({ card });
              })
              .catch((err) => {
                console.error(err);
                return res.status(500).json({ error: err.code });
              });
          } else {
            return res.status(404).json({ error: "No new users" });
          }
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: err.code });
        });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Like User Route
exports.like = (req, res) => {
  // Check to see if liked user has also liked authenticated user
  db.collection("users")
    .where("uid", "==", req.params.uid)
    .where("likes", "array-contains", req.user.uid)
    .limit(1)
    .get()
    .then((docs) => {
      // If there is a match
      let doc = docs.docs[0];
      if (doc) {
        // Build match object
        let likedMatch = {
          uid: req.params.uid,
          name: doc.data().name,
          image: doc.data().images[0],
        };
        // Add match to authenticated user's match list
        db.doc(`/users/${req.user.email}`)
          .update({
            matches: admin.firestore.FieldValue.arrayUnion(likedMatch),
            likes: admin.firestore.FieldValue.arrayUnion(req.params.uid),
            dislikes: admin.firestore.FieldValue.arrayRemove(req.params.uid),
            count: admin.firestore.FieldValue.increment(1),
            online: new Date().toISOString(),
          })
          .then(() => {
            // Build match object
            let authenticatedMatch = {
              uid: req.user.uid,
              name: req.user.name,
              image: req.user.image,
            };
            // Add match to liked user's match list
            return db
              .doc(`/users/${doc.data().email}`)
              .update({ matches: admin.firestore.FieldValue.arrayUnion(authenticatedMatch) });
          })
          .then(() => {
            // Create notification for liked user
            return db.collection("notifications").add({
              created: new Date().toISOString(),
              sender: "Cedar Mingle",
              receiver: {
                uid: req.params.uid,
                name: likedMatch.name,
              },
              content: `You matched with ${req.user.name}!`,
              type: "match",
              read: false,
            });
          })
          .then(() => {
            res.status(200).json({ message: "Sucessfully liked user", match: true });
          })
          .catch((err) => {
            console.error(err);
            res.status(500).json({ error: err.code });
          });
      } else {
        // No match, just like
        db.doc(`/users/${req.user.email}`)
          .update({
            likes: admin.firestore.FieldValue.arrayUnion(req.params.uid),
            dislikes: admin.firestore.FieldValue.arrayRemove(req.params.uid),
            count: admin.firestore.FieldValue.increment(1),
            online: new Date().toISOString(),
          })
          .then(() => {
            res.status(200).json({ message: "Sucessfully liked user", match: false });
          })
          .catch((err) => {
            res.status(500).json({ error: err.code });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

// Pass User Route
exports.pass = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .update({
      dislikes: admin.firestore.FieldValue.arrayUnion(req.params.uid),
      count: admin.firestore.FieldValue.increment(1),
      online: new Date().toISOString(),
    })
    .then(() => {
      res.status(200).json({ message: "Sucessfully passed user" });
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

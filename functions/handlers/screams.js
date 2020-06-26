const { db } = require("../util/admin");

// Get All Screams Route
exports.getAllScreams = (request, response) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          username: doc.data().username,
          timestame: doc.data().createdAt,
        });
      });
      return response.json(screams);
    })
    .catch((err) => console.error(err));
};

// Add Scream Route
exports.postOneScream = (request, response) => {
  if (request.body.body.trim() === "") {
    return response.status(500).json({ body: "Body must not be empty" });
  }

  const newScream = {
    body: request.body.body,
    username: request.user.username,
    createdAt: new Date().toISOString(),
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
};

// Get Scream Route
exports.getScream = (request, response) => {
  let screamData = {};
  db.doc(`/screams/${request.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(404).json({ error: "Scream not found" });
      }
      screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("screamId", "==", request.params.screamId)
        .get();
    })
    .then((data) => {
      screamData.comments = [];
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return response.status(200).json(screamData);
    })
    .catch((err) => {
      console.error(err);
      response.status(500).json({ error: err.code });
    });
};

// Comment On Scream Route
exports.commentOnScream = (request, response) => {
  if (request.body.body.trim() === "")
    return response.status(400).json({ error: "Comment must not be empty" });

  const newComment = {
    body: request.body.body,
    createdAt: new Date().toISOString(),
    screamId: request.params.screamId,
    username: request.user.username,
    userImage: request.user.imageUrl,
  };

  db.doc(`/screams/${request.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(404).json({ error: "Scream not fount" });
      }
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      response.status(200).json(newComment);
    })
    .catch((err) => {
      console.log(err);
      response.status(500).json({ error: "Something went wrong" });
    });
};

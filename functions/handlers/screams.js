const { db } = require("../util/admin");

exports.getAllScreams = (request, response) => {
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
};

exports.postOneScream = (request, response) => {
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
};

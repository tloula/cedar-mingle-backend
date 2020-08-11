// Helpers
const { db } = require("../util/admin");

exports.age = (dateString) => {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

exports.shuffle = (array) => {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

exports.getUserData = (request) => {
  return new Promise(function (resolve, reject) {
    db.collection("users")
      .where("uid", "==", request.user.uid)
      .limit(1)
      .get()
      .then((data) => {
        request.user.name = data.docs[0].data().name;
        if (data.docs[0].data().images[0]) {
          request.user.image = data.docs[0].data().images[0].src;
        }
        resolve(request);
      })
      .catch((err) => {
        reject(Error("Error while retrieving user data"));
      });
  });
};

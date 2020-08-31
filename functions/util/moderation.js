const Filter = require("bad-words"),
  filter = new Filter();

const capitalize = require("capitalize-sentence");

exports.moderateMessage = (message) => {
  // Re-capitalize if the user is Shouting.
  if (isShouting(message)) {
    console.log("User is shouting. Fixing sentence case...");
    message = stopShouting(message);
  }

  // Moderate if the user uses SwearWords.
  if (containsSwearwords(message)) {
    console.log(`User is swearing. Moderating: ${message}`);
    message = moderateSwearwords(message);
  }

  return message;
};

// Returns true if the string contains swearwords.
function containsSwearwords(message) {
  return message !== filter.clean(message);
}

// Hide all swearwords. e.g: Crap => ****.
function moderateSwearwords(message) {
  return filter.clean(message);
}

// Detect if the current message is shouting. i.e. there are too many Uppercase
// characters or exclamation points.
function isShouting(message) {
  return (
    message.replace(/[^A-Z]/g, "").length > message.length / 2 ||
    message.replace(/[^!]/g, "").length > 3
  );
}

// Correctly capitalize the string as a sentence (e.g. uppercase after dots)
// and remove exclamation points.
function stopShouting(message) {
  return capitalize(message.toLowerCase()).replace(/!+/g, "!");
}

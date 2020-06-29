const { user } = require("firebase-functions/lib/providers/auth");

// Checks if param is empty
const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

// Checks if param is valid email syntax
const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const domain = "@cedarville.edu";
  const length = email.length;
  if (
    email.match(emailRegEx) &&
    email.substring(length - 15, length) === domain
  )
    return true;
  else return false;
};

// Validate Signup Data
exports.validateSignupData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid Cedarville email address";
  }

  if (isEmpty(data.password)) errors.password = "Must not be empty";
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match";
  //if (isEmpty(data.name)) errors.name = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

// Validate Login Data
exports.validateLoginData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) errors.email = "Must not be empty";
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;

  if (!isEmpty(data.website.trim())) {
    // Add 'http://' If Not Present
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }

  if (!isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
};

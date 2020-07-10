const { user } = require("firebase-functions/lib/providers/auth");
const { EMAIL_DOMAIN } = require("../util/constants");

// Checks if param is empty
const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

// Checks if param is valid email syntax
const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const domainLength = EMAIL_DOMAIN.length;
  const submittedLength = email.length;
  if (
    email.match(emailRegEx) &&
    email.substring(submittedLength - domainLength, submittedLength) === EMAIL_DOMAIN
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
  if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords must match";
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

exports.validateUserDetails = (data) => {
  let userDetails = {};
  let errors = {};

  // Display Name - Required
  if (typeof data.name === "undefined" || isEmpty(data.name.trim()))
    errors.name = "Must not be empty";
  else userDetails.name = data.name;

  // Gender - Required
  if (typeof data.gender === "undefined" || isEmpty(data.gender.trim()))
    errors.gender = "Must not be empty";
  else userDetails.gender = data.gender;

  // Birthday - Required
  if (typeof data.birthday === "undefined" || isEmpty(data.birthday.trim()))
    errors.birthday = "Must not be empty";
  else userDetails.birthday = data.birthday;

  // Graduation Year - Required
  if (typeof data.gradYear === "undefined" || isEmpty(data.gradYear.trim()))
    errors.gradYear = "Must not be empty";
  else userDetails.gradYear = data.gradYear;

  // Major
  if (typeof data.major !== "undefined" && !isEmpty(data.major.trim()))
    userDetails.major = data.major;

  // Hometown
  if (typeof data.hometown !== "undefined" && !isEmpty(data.hometown.trim()))
    userDetails.hometown = data.hometown;

  // About
  if (typeof data.about !== "undefined" && !isEmpty(data.about.trim()))
    userDetails.about = data.about;

  // Interests
  if (typeof data.interests !== "undefined" && !isEmpty(data.interests.trim()))
    userDetails.interests = data.interests;

  // Visibility
  if (typeof data.visible !== "undefined") userDetails.visible = data.visible;

  /*if (!isEmpty(data.website.trim())) {
    // Add 'http://' If Not Present
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }*/

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
    userDetails,
  };
};

exports.validateReportDetails = (data) => {
  let errors = {};

  // Display Name - Required
  if (typeof data.reason === "undefined" || isEmpty(data.reason.trim()))
    errors.reason = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

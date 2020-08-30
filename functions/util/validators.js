// Constants
const {
  EMAIL_DOMAIN,
  MIN_USER_AGE,
  MAX_ABOUT_CHARACTERS,
  REQUIRE_VERIFIED_EMAIL,
} = require("../util/constants");

// Moderation
const { moderateMessage } = require("../util/moderation");

// Age
const { age } = require("../util/helpers");

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

  // Email
  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid Cedarville email address";
  }

  // Password
  if (isEmpty(data.password)) errors.password = "Must not be empty";
  if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords must match";
  if (data.password.length < 6) errors.password = "Must be at least 6 characters";

  // Gender
  if (typeof data.gender === "undefined" || isEmpty(data.gender.trim()))
    errors.gender = "Must specify your gender";

  // Terms of Service, Privacy Policy, & Disclaimer
  if (!data.legal) errors.legal = "Must agree to ToS and Privacy Policy";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

// Validate Change Password
exports.validatePassword = (data) => {
  let errors = {};

  if (data.password.length < 6) errors.password = "Must be at least 6 characters";
  if (isEmpty(data.password)) errors.password = "Must not be empty";
  if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords must match";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

// Validate Forgot Password
exports.validateEmail = (email) => {
  let errors = {};

  if (isEmpty(email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "Must be a valid Cedarville email address";
  }

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

exports.validateUserProfile = (data) => {
  let userProfile = {};
  let errors = {};

  // Display Name - Required
  if (typeof data.name === "undefined" || isEmpty(data.name.trim()))
    errors.name = "Must specify your name";
  else userProfile.name = moderateMessage(data.name);

  // Birthday - Required
  if (typeof data.birthday === "undefined" || isEmpty(data.birthday.trim()))
    errors.birthday = "Required so we can display your age";
  else if (age(data.birthday) < MIN_USER_AGE)
    errors.birthday = "Please specify a valid birthday so we can display your age";
  else userProfile.birthday = data.birthday;

  // Graduation Year - Required
  if (typeof data.year === "undefined" || isEmpty(data.year.trim()))
    errors.year = "Must not be empty";
  else userProfile.year = data.year;

  // Major
  if (typeof data.major !== "undefined" && !isEmpty(data.major.trim()))
    userProfile.major = moderateMessage(data.major);

  // Hometown
  if (typeof data.hometown !== "undefined") userProfile.hometown = moderateMessage(data.hometown);

  // About
  if (typeof data.about !== "undefined")
    if (data.about.length > MAX_ABOUT_CHARACTERS)
      errors.about =
        "Please limit to " +
        MAX_ABOUT_CHARACTERS +
        " characters, currently at " +
        data.about.length +
        " characters";
    else userProfile.about = moderateMessage(data.about);

  // Interests
  if (typeof data.interests !== "undefined") userProfile.interests = data.interests;

  // Occupation
  if (typeof data.occupation !== "undefined")
    userProfile.occupation = moderateMessage(data.occupation);

  // Dream
  if (typeof data.dream !== "undefined") userProfile.dream = moderateMessage(data.dream);

  // Website
  if (typeof data.website !== "undefined") {
    // https://website.com
    if (data.website !== "" && data.website.trim().substring(0, 4) !== "http") {
      userProfile.website = `http://${data.website.trim()}`;
    } else userProfile.website = moderateMessage(data.website);
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
    userProfile,
  };
};

exports.validateUserSettings = (data, email_verified, image, profileComplete) => {
  let userSettings = {};
  let errors = {};

  // Visibility
  if (data.visible === true && !email_verified && REQUIRE_VERIFIED_EMAIL)
    errors.visible = "Must verify email before making account visible";

  if (data.visible === true && !image)
    errors.visible = "Must upload a photo before making account visible";

  if (data.visible === true && !profileComplete)
    errors.visible = "Must complete your profile before making account visible";

  if (!errors.visible) userSettings.visible = data.visible;

  // Email Preferences
  if (typeof data.emails !== "undefined") userSettings.emails = data.emails;

  // Premium Settings

  // Premium
  if (typeof data.premium !== "undefined") userSettings.premium = data.premium;

  // Boost
  if (typeof data.boost !== "undefined")
    if (data.premium) userSettings.boost = data.boost;
    else if (data.boost === true) errors.boost = "Requires premium";

  // Recycle
  if (typeof data.recycle !== "undefined")
    if (data.premium) userSettings.recycle = data.recycle;
    else if (data.recycle === true) errors.recycle = "Requires premium";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
    userSettings,
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

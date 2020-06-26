// Checks if param is empty
const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

// Checks if param is valid email syntax
const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

exports.validateSignupData = (data) => {
  let errors = {};

  console.log(data.email);
  console.log(data.password);
  console.log(data.username);

  if (isEmpty(data.email)) {
    errors.email = "Email Required";
  } else if (!isEmail(data.email)) {
    errors.email = "Invalid Email Address";
  }

  if (isEmpty(data.password)) errors.password = "Password Required";
  if (isEmpty(data.username)) errors.username = "Username Required";
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) errors.email = "Email is empty";
  if (isEmpty(data.password)) errors.password = "Password is empty";

  if (Object.keys(errors).length > 0) return response.status(400).json(errors);

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

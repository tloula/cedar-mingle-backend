exports.calculateAge = (birth_day, birth_month, birth_year) => {
  today_date = new Date();
  today_year = today_date.getFullYear();
  today_month = today_date.getMonth();
  today_day = today_date.getDate();
  age = today_year - birth_year;

  if (today_month < birth_month - 1) {
    age--;
  }
  if (birth_month - 1 == today_month && today_day < birth_day) {
    age--;
  }
  return age;
};

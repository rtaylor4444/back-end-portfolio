function getValidationErrors(err) {
  let validationErrors = [];
  for (field in err.errors) {
    validationErrors.push(err.errors[field].message);
  }
  return validationErrors.length > 0 ? validationErrors : undefined;
}

module.exports = function (err, req, res, next) {
  const validationErrors = getValidationErrors(err);
  if (validationErrors) return res.status(400).send(validationErrors);

  //BUG - Other types of errors are not handled properly
  console.log(err);
  res.status(500).send("An unexpected error occured");
  exit(1);
};

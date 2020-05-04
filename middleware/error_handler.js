function getValidationErrors(err) {
  let validationErrors = [];
  for (field in err.errors) {
    validationErrors.push(err.errors[field].message);
  }
  return validationErrors.length > 0 ? validationErrors : undefined;
}

//BUG - Different types of errors are not handled properly
module.exports = function (err, req, res, next) {
  const validationErrors = getValidationErrors(err);
  if (validationErrors) return res.status(400).send(validationErrors);

  return res.status(500).message("An unexpected error occured");
};

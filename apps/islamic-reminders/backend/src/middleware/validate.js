'use strict';

const { validationResult } = require('express-validator');

/**
 * Express middleware: run after express-validator chains.
 * Returns 422 with array of errors if validation fails.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = { validate };

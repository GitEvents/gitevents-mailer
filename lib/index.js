'use strict';

module.exports = gitEventsMailer;

/**
 * gitevents plugin API which setup an gitevents-mailer
 *
 * @param {Object} opts Options map to setup the mailer:
 *      - {gitevents-mailer/provider} provider configured email provider
 *      - {gitevents-mailer/renderer} renderer configured renderer
 *      - {Object} sendParams Map with all the values required by provider.send
 * @returns {Object} configured gitevents-mailer, with
 *      # methods:
 *        - send @see return Object and `send` API private function
 */
function gitEventsMailer(opts) {
  if (!opts || typeof opts !== 'object') {
    throw new Error('Options must be an object');
  }

  // Opts destructuring
  var provider = checkProvider(opts.provider);
  var renderer = checkRenderer(opts.renderer);
  var sendParams = sendParameters(opts.sendParams);

  // Exposed API
  return {
    send: send.bind(null, provider, renderer, sendParams)
  };
}

/**
 * Send an email using the specified provider
 *
 * @param {gitevents-mailer/provider} provider Configured email provider object to be used
 * @param {gitevents-mailer/renderer} renderer Configured renderer object to be used
 * @param {Object} params Map with all the values required by provider.send
 * @param {Array} to List of email addresses. An email address is an Object with
 *      - {String} name
 *      - {String} address
 * @param {Object} data Map with all the values to use by renderer to create the email content
 * @param {Function} done node callback convention, no data returned when successful
 * @api private
 */
function send(provider, renderer, params, to, data, done) {
  renderer(data, function (err, content) {
    if (err) {
      return done(err);
    }

    provider.send(
      params.from,
      to,
      params.cc,
      params.bcc,
      content.subject,
      { html: content.html, text: content.text },
      params.options,
      done);
  });
}

/**
 * Basic check if object is an expected provider
 *
 * @param {gitevents-mailer/provider} obj Configured provider
 * @returns {Object} obj parameter for assigning purpose
 * @throws {Error} if provider does not fulfil the minimum expected API
 * @api private
 */
function checkProvider(obj) {
  if (!typeCheck(false, 'object', obj)) {
    throw new Error('provider must be an object');
  }

  if (typeof obj.send !== 'function') {
    throw new  Error('provider must have a `send` method');
  }

  return obj;
}

/**
 * Basic check if fn is an accepted renderer
 *
 * @param {Function} fn configured gitevents-mailer/renderer which is a function
 * @returns {Function} fn parameter for assigning
 * @throws {Error} if renderer does not fulfil the minimum expected API
 * @api private
 */
function checkRenderer(fn) {
  if (!typeCheck(false, 'function', fn)) {
    throw new  Error('renderer must be a function');
  }

  return fn;
}

/**
 * Check required send parameters
 *
 * @param {Object} params the parameters to pass to provder.send
 * @returns {Object} params parameter for assigning
 * @throws {Error} if params does not contains the minimum expected values
 * @api private
 */
function sendParameters(params) {
  if (!typeCheck(false, 'object', params)) {
    throw new  Error('params must be an object');
  }

  if (!typeCheck(false, 'object', params.from)) {
    throw new  Error('params#from must be an object');
  }

  ['name', 'address'].forEach(function (prop) {
    if (!typeCheck(false, 'string', params.from[prop])) {
      throw new Error('params#from must have `name` and `address`');
    }
  });

  if (!typeCheck(true, Array, params.cc) || !typeCheck(true, Array, params.bcc)) {
    throw new Error('params#cc and params#bcc must be an Array when provided');
  }

  if (!typeCheck(true, 'object', params.options)) {
    throw new Error('params#options must be an Object when provided');
  }

  // Assign null to cc & bcc if they're not provided
  if (!params.cc) { params.cc = null; }
  if (!params.bcc) { params.bcc = null; }

  return params;
}

/**
 * Helper function to check if a value can be empty and its type
 *
 * @param {boolean} allowEmpty if empty values are allowed
 * @param {String|Function} type to check the target, if string typeof is used otherwise instanceof
 * @param {*} target th value to check
 * @returns {boolean} True if target type checks, otherwise false
 */
function typeCheck(allowEmpty, type, target) {
  if (allowEmpty && !target) {
    return true;
  }

  if (!target) { return false; }

  return (typeof type === 'string') ?
    typeof target === type : target instanceof type;
}

const bcrypt = require('bcryptjs');

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * It returns all URLs that are assigned to particular user.
 * @param {String} userId
 * @param {Array} urlsDB
 * @returns {Array}
 */
const urlsForUser = function(userId , urlsDB) {
  const userURLs = {};

  for (let shorturl in urlsDB) {
    const {longURL , userID} = urlsDB[shorturl];
    if (userId === userID)
      userURLs[shorturl] = urlsDB[shorturl];
  }
  return userURLs;
};

/**
 *  It validates the passed shortURL to a particular user passed and it returns that as object.
 * @param {String} userId
 * @param {String} shortUrl
 * @param {Array} urlsDB
 * @returns {Object}
 */
const validateShortURLForUser = function(userId, shortUrl,urlsDB) {
  const userURLs = urlsForUser(userId,urlsDB);
  for (let key of Object.keys(userURLs)) {
    if (shortUrl === key)
      return {data : key};
  }
  return {data: null};
};

/**
 * It returns the user object for particular email passed if available in userDB. If not, returns undefined object.
 * @param {String} email
 * @param {Array} usersDB
 * @returns {Object}
 */
const getUserByEmail = function(email,usersDB) {
  
  for (let user in usersDB) {
    if (usersDB[user]["email"] === email)
      return  usersDB[user];
  }
  return undefined;
};

/**
 * It authenticates user credentials that are passed and returns object based on that.
 * @param {String} email
 * @param {String} password
 * @param {Array} usersDB
 * @returns {Object}
 */
const authenticateLoginUser = function(email , password , usersDB) {

  for (let user in usersDB) {
    if (usersDB[user]["email"] === email && bcrypt.compareSync(password, usersDB[user]["password"]))
      return {error: null};
  }
  return {error : "Email and Password does not match."};
};

/**
 * It checks if the passed email already exists with any existing user or not and returns error pbject based on validation.
 * @param {String} email
 * @param {Array} usersDB
 * @returns {Object}
 */
const userAlreadyExist = function(email,usersDB) {
  for (let user in usersDB) {
    if (usersDB[user]["email"] === email)
      return {error: "Email Exists"};
  }
  return {error: null};
};

/**
 * It authenticates passed user information to make sure there are no null,'' and also validates if these detals already exist for other user and returns error object based on that validation.
 * @param {String} email
 * @param {String} password
 * @param {Array} usersDB
 * @returns {Object}
 */
const authenticateUserInfo = function(email , password , usersDB) {

  if (!email || email.trim() === "")
    return {"error": "Invalid Email"};

  if (!password || password.trim() === "")
    return {"error": "Invalid pasword"};

  const {error} = userAlreadyExist(email, usersDB);

  if (error)
    return {"error": error};

  return {"error": null};
};

/**
 * It generated random string and returns it.
 * @returns {String}
 */
const generateRandomString = function() {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = {generateRandomString , authenticateUserInfo , authenticateLoginUser,getUserByEmail,urlsForUser,validateShortURLForUser};
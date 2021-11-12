const bcrypt = require('bcryptjs');

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const urlsForUser = function(userId , urlsDB) {
  const userURLs = {};

  for (let shorturl in urlsDB) {
    const {longURL , userID} = urlsDB[shorturl];
    if (userId === userID)
      userURLs[shorturl] = urlsDB[shorturl];
  }
  return userURLs;
};

const validateShortURLForUser = function(userId, shortUrl,urlsDB) {
  const userURLs = urlsForUser(userId,urlsDB);
  for (let key of Object.keys(userURLs)) {
    if (shortUrl === key)
      return {data : key};
  }
  return {data: null};
};

const getUserByEmail = function(email,usersDB) {
  
  for (let user in usersDB) {
    if (usersDB[user]["email"] === email)
      return  usersDB[user];
  }
  return undefined;
};

const authenticateLoginUser = function(email , password , usersDB) {

  for (let user in usersDB) {
    if (usersDB[user]["email"] === email && bcrypt.compareSync(password, usersDB[user]["password"]))
      return {error: null};
  }
  return {error : "Email and Password does not match."};
};

const userAlreadyExist = function(email,usersDB) {
  for (let user in usersDB) {
    if (usersDB[user]["email"] === email)
      return {error: "Email Exists"};
  }
  return {error: null};
};

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

const generateRandomString = function() {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = {generateRandomString , authenticateUserInfo , authenticateLoginUser,getUserByEmail,urlsForUser,validateShortURLForUser};
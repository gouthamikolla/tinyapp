/* eslint-disable func-style */
const express = require("express");
const bodyParser = require("body-parser");
//const cookieParser = require('cookie-parser');
const {generateRandomString , authenticateUserInfo , authenticateLoginUser,getUserByEmail,urlsForUser,validateShortURLForUser} = require('./helpers/helpers');
let cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
const users = {};

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(cookieSession({
  name: 'tinyapp',
  keys: ["user_id"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000
}));
const urlDatabase = {};
  
/*
  Web server is listening on this port.
*/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/", (req, res) => {
  res.render("login");
});

/*
  This method will check, if user is alreday logged-in or not. If logged-in, redirects to /urls link, if not shows login page to user for login.
*/
app.get("/login", (req, res) => {

  const user = users[req.session.user_id];
  if (user) {
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }
  res.render("login");
});

/*
  This method will check, if user is alreday rtegisteted or not. If registered, redirects to /urls link, if not shows login page to user for login.
*/
app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }

  res.render("register_user");
});

/*
  This method will give all users data in JSON format.
*/
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/*
  This method handles when user clicks on 'My URLs' button.If user already logged-in, it shows all urls for that user, if not it asks user to login.
*/
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const userURLs = urlsForUser(user["id"], urlDatabase);
    const templateVars = { urls: userURLs , "user" : user};
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send(`Please <a href="/login">Login</a> or <a href="/register">Register</a> first.`);
  }
  
});

/*
  This methods handles 'Create New URL' button. When user clicks on it, based on user validation in session, it shows 'urls_new' page else redictes to login page.
*/
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const templateVars = { "user" : user};
    res.render("urls_new",templateVars);
  } else {
    res.redirect("/login");
  }
  
});

/*
  This method handles when user clicks on 'Edit' button for any particular URL. It shows URLs edit page for user to edit after successfull validation. If not, redicts to login/register again.
*/
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;
  if (user) {
    const {data} = validateShortURLForUser(user["id"], shortURL,urlDatabase);
    if (shortURL === data) {
      const {longURL , userID} = urlDatabase[shortURL];
      const templateVars = { shortURL: req.params.shortURL, longURL: longURL , "user":user};
      res.render("urls_show", templateVars);
    } else {
      res.status(400).send(`Please enter valid ShortURL. <a href="/urls">URLs</a> `);
    }
  } else  {
    res.status(400).send(`Please <a href="/login">Login</a> or <a href="/register">Register</a> first.`);
  }
});

/**
 * When user enters 'u/{shortURL}' in browser, this method validates that shortURL and redirects to that particular longURL.
 */
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (urlDatabase[shortURL]) {
    const  {longURL , userID}  = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.status(400).send(`<p>Invalid ShortURL : ${shortURL}</p>`);
  }
  
});

/*
  This methods handles for creating new url. When user enter new URL and do submit, it creates new shortURL for that one and then redirects to /urls page to show all URLs for that user.
*/
app.post("/urls", (req, res) => {
  const userID = users[req.session.user_id];
  const {longURL} = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {"longURL" : longURL, "userID": userID["id"] };
  res.redirect(`/urls`);
});

/**
 * This method handles delete button. It valdaites if url belongs to user or not. Based on that, it deletes that shortURL, if not send HTML to user saying, 'not authorised' to delete that URL.
 */
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const {shortURL} = req.params;
    const {data} = validateShortURLForUser(user["id"],shortURL, urlDatabase);
    if (shortURL === data) {
      delete urlDatabase[shortURL];
      res.redirect('/urls');
    } else {
      res.status(400).send(`You are not Authorized to delete. <a href="/urls">URLs</a>`);
    }
  }
  
});

/*
  When user edits existing url and submit, then this methods takes modifies URL and saves to urlsDB and redicts to /urls link to show all urls with edit one.
*/
app.post("/urls/:id", (req, res) => {
  const userID = users[req.session.user_id];
  const {id} = req.params;
  const {longURL} = req.body;
  urlDatabase[id] = {"longURL" : longURL , "userID" : userID["id"] };
  res.redirect('/urls');
});


/**
 * This method handles login button. It authenticates all fields and based on that it redirects to link /urls for success else sends a html with a login link to login again.
 */
app.post("/login", (req, res) => {
  const {email,password} = req.body;
  const { error } = authenticateLoginUser(email,password,users);
  if (error) {
    res.status(400).send(`${error}. Please try again :  <a href="/login">Login</a>`);
  } else {
    const user = getUserByEmail(email,users);
    req.session.user_id =  user["id"];
    res.redirect("/urls");
  }
});

/**
 * This method handles logout button. It nullifies session and redirects to /login link for user to login again.
 */
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

/**
 * This method handles register button. If user authenticates correctly, redirects to link /urls for success else sends a html with a register link to register.
 */
app.post("/register", (req, res) => {
  
  const {email,password} = req.body;
  const { error} = authenticateUserInfo(email,password,users);
  if (error) {
    res.status(400).send(`${error}. Please try again :  <a href="/register">Register</a>`);
  } else {
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[id] = {"id":id,"email":email,"password":hashedPassword};
    req.session.user_id =  id;
    res.redirect("/urls");
  }
  
});

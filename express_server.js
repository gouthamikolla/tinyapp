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
  

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/", (req, res) => {
  res.render("login");
});


app.get("/login", (req, res) => {

  const user = users[req.session.user_id];
  if (user) {
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }
  res.render("login");
});

app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }

  res.render("register_user");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


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


app.get("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const shortURL = req.params.shortURL;
    const {data} = validateShortURLForUser(user["id"],shortURL, urlDatabase);
    if (data === shortURL) {
      const {longURL,userID} = urlDatabase[shortURL];
      const templateVars = { shortURL: req.params.shortURL, longURL: longURL , "user":user};
      res.render("urls_show", templateVars);
    } else {
      res.status(400).send(`You are not Authorized to edit. <a href="/urls">URLs</a>`);
    }
  }
  
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const templateVars = { "user" : user};
    res.render("urls_new",templateVars);
  } else {
    res.redirect("/login");
  }
  
});

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

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (urlDatabase[shortURL]) {
    const  {longURL , userID}  = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.status(400).send(`<p>Invalid ShortURL : ${shortURL}</p>`);
  }
  
});

app.post("/urls", (req, res) => {
  const userID = users[req.session.user_id];
  const {longURL} = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {"longURL" : longURL, "userID": userID["id"] };
  res.redirect(`/urls`);
});


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


app.post("/urls/:id", (req, res) => {
  const userID = users[req.session.user_id];
  const {id} = req.params;
  const {longURL} = req.body;
  urlDatabase[id] = {"longURL" : longURL , "userID" : userID["id"] };
  res.redirect('/urls');
});



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

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


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

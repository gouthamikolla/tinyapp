/* eslint-disable func-style */
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const users = {};

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.render("login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase , "user" : user};
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const {longURL} = req.body;
  const shortURL = generateRandomString();
  //console.log(shortURL);
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const {shortURL} = req.params;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const longURL = urlDatabase[req.params.shortURL];
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL , "user":user};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const {id} = req.params;
  const {longURL} = req.body;
  urlDatabase[id] = longURL;
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  
  const user = users[req.cookies["user_id"]];
  const templateVars = { "user" : user};
  res.render("urls_new",templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const longURL = urlDatabase[req.params.shortURL];
  //console.log(req.params.shortURL, urlDatabase, longURL);
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL , "user":user};
  //console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { "user":user };
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL,templateVars);
});

app.post("/login", (req, res) => {
  const {email,password} = req.body;
  const { error } = authenticateLoginUser(email,password,users);
  console.log("login failed", error);
  if (error) {
    res.status(403);
  } else {
    const {id} = getUseIdBasedOnEmail(email,users);
    console.log("id" , id);
    res.cookie('user_id', id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register_user");
});

const getUseIdBasedOnEmail = function(email,usersDB) {
  console.log(usersDB);
  for (let user in usersDB) {
    if (usersDB[user]["email"] === email)
      return {"id": usersDB[user]["id"]};
  }
  return {error: null};
};


const authenticateLoginUser = function(email , password , usersDB) {

  for (let user in usersDB) {
    if (usersDB[user]["email"] === email && usersDB[user]["password"] === password)
      return {error: null};
  }
  return {error : "INVALID DETAILS"};
};

const userAlreadyExist = function(email,usersDB) {
  console.log(usersDB);
  for (let user in usersDB) {
    if (usersDB[user]["email"] === email)
      return {error: "Email Exists"};
  }
  return {error: null};
};

const authenticateUserInfo = function(email , password , usersDB) {

  if (email === "" || email.trim().length === 0)
    return {"error": "BAD email"};

  if (password === "" || password.trim().length === 0)
    return {"error": "BAD pasword"};

  const {error} = userAlreadyExist(email,usersDB);
  
  if (error)
    return {"error" : error};

  return {"error": null};
};


app.post("/register", (req, res) => {
  //console.log(req);
  const {email,password} = req.body;
  const { error} = authenticateUserInfo(email,password,users);

  if (error) {
    res.status(400).end();
  } else {
    const id = generateRandomString();
    users[id] = {"id":id,"email":email,"password":password};
    res.cookie("user_id", id);
    res.redirect("/");
  }
  
});

function generateRandomString() {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
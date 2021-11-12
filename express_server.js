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

const urlDatabase = {};
  

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
  if (user) {
    const templateVars = { urls: urlDatabase , "user" : user};
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
  
});
app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const userID = users[req.cookies["user_id"]];
  const {longURL} = req.body;
  const shortURL = generateRandomString();
  //console.log(shortURL);
  urlDatabase[shortURL] = {"longURL" : longURL, "userID": userID };
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const {shortURL} = req.params;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const {longURL,userID} = urlDatabase[req.params.shortURL];
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL , "user":user};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const userID = users[req.cookies["user_id"]];
  const {id} = req.params;
  const {longURL} = req.body;
  urlDatabase[id] = {"longURL" : longURL , "userID" : userID };
  res.redirect('/urls');
});


app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (user) {
    const templateVars = { "user" : user};
    res.render("urls_new",templateVars);
  } else {
    res.redirect("/login");
  }
  
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const shortURL = req.params.shortURL;
  if (shortURL) {
    const {longURL , userID} = urlDatabase[shortURL];
    //console.log(req.params.shortURL, urlDatabase, longURL);
    const templateVars = { shortURL: req.params.shortURL, longURL: longURL , "user":user};
    //console.log(templateVars);
    res.render("urls_show", templateVars);
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

app.post("/login", (req, res) => {
  const {email,password} = req.body;
  const { error } = authenticateLoginUser(email,password,users);
  if (error) {
    res.status(400).send(`${error}. Please try again :  <a href="/login">Login</a>`);
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


app.post("/register", (req, res) => {
  
  const {email,password} = req.body;
  const { error} = authenticateUserInfo(email,password,users);
  if (error) {
    res.status(400).send(`${error}. Please try again :  <a href="/register">Register</a>`);
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
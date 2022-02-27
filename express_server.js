const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { getUserByEmail, generateRandomString, urlsForUser } = require("./helpers");
const { urlDatabase, users } = require("./database");

//--------------------------------------------- MIDDLEWARE -------------------------------------------------
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'anything',
  keys: ["keyuno", "keydeux", "keythree"],
}));

app.set("view engine", "ejs");

//--------------------------------------------- GET ROUTES -------------------------------------------------
app.get("/", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.redirect("/login");
  }

  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const userURLS = urlsForUser(userId, urlDatabase);
  const templateVars = {
    user,
    urls: userURLS
  };

  // if user is not logged in: returns HTML with a relevant error message
  // POSSIBLE CONFLICTING DIRECTIONS FROM Compass
  //if a user is not logged in, the header shows: a link to the login page (/login)
  // a link to the registration page (/register)
  if (!user) {
    return res.status(401).send("Please <a href='/login'> login </a> or <a href='/register'> register </a> to continue!");
  }

  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user };

  if (!userId) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.shortURL;

  if (!userId) {
    return res.send("<a href='/login'> Login</a> to continue!");
  }
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("Page not found. <a href='/urls'> Go back to main page.</a>");
  }
  if (userId !== urlDatabase[shortURL].userID) {
    return res.send('Unauthorized access');
  }

  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {
    user,
    shortURL,
    longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  if (urlDatabase[shortURL] === undefined) {
    res.send("This URL does not exist.");
  }

  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = { user };

  if (user) {
    res.redirect("/urls");
  }
  
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = { user };

  if (user) {
    res.redirect("/urls");
  }

  res.render("login", templateVars);
});

//---------------------------------------------- POST ROUTES -----------------------------------------------

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  if (!userID) {
    return res.status(401).send("Login to continue");
  }

  urlDatabase[shortURL] = { longURL, userID };
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;

  if (userId !== urlDatabase[shortURL].userID) {
    return res.send('Unauthorized access');
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const newURL = req.body.longURL;

  if (!userId) {
    return res.send("Login to continue");
  }
  if (userId !== urlDatabase[shortURL].userID) {
    return res.status(400).send("Unauthorized");
  }

  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Missing login credentials. <a href='/login'> Click to go back </a>");
  }

  const user = getUserByEmail(email, users);
  
  if (!user) {
    return res.status(403).send("Email not found. Go back to <a href='/login'> Login</a> or <a href='/register'> Register</a> another email.");
  }

  const passwordsMatch = bcrypt.compareSync(password, user.password);

  if (!passwordsMatch) {
    return res.status(403).send("Invalid login credentials. <a href='/login'> Click to go back. </a>");
  }

  req.session.user_id = user.id;
  res.redirect("/urls/");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("ERROR: Missing login information. <a href='/register'> Click to go back. </a>");
  }

  const user = getUserByEmail(email, users);

  if (user) {
    return res.status(400).send("Email is already registered. <a href='/register'> Click to go back. </a>");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  users[id] = {
    id,
    email,
    password: hashedPassword
  };

  req.session.user_id = id;
  res.redirect("/urls/");
});

//---------------------------------------------- LISTENER -------------------------------------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
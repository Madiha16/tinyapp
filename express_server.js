const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { getUserByEmail } = require("./helpers");

//--------------------------------------------- MIDDLEWARE -------------------------------------------------
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'anything',
  keys: ["keyuno", "keydeux", "keythree"],
}));

app.set("view engine", "ejs");

//--------------------------------------------- DATABASE -------------------------------------------------
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aa"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aa"
  },
  h4L110: {
    longURL: "https://www.google.ca",
    userID: "bb"
  }
};

const users = {
  "aa": {
    id: "aa",
    email: "a@a",
    password: "$2a$10$O6a3j/1KBeXwxRMGXtWFQ.tnDZEMwzp0NxI1rfH8C0eLT7d1sfc6C"
  },
  "bb": {
    id: "bb",
    email: "b@b",
    password: "$2a$10$5BW3UBhoNgDaq5OWgntdEeagJ8bQotNxRH3ZhiT9b.vXDlV1M1qJe"
  }
};

//-------------------------------------------- HELPER FUNCTIONS ---------------------------------------------
const generateRandomString = () => Math.random().toString(36).substr(2, 6);

const urlsForUser = function(id, urlDatabase) {
  let userURLS = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLS[url] = urlDatabase[url];
    }
  }
  return userURLS;
};

//--------------------------------------------- GET ROUTES -------------------------------------------------
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.redirect("/login");
  }

  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const urls = urlsForUser(userId, urlDatabase);

  if (!user) {
    return res.status(401).send("Please <a href='/login'> login </a> or <a href='/register'> register </a> to continue!");
  }

  const templateVars = {
    user,
    urls
  };

  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  if (!user) {
    return res.send('Please click <a href="/login"> Login</a> to continue!');
  }
  if (userId !== urlDatabase[shortURL].userID) {
    return res.send('Unauthorized access');
  }

  const templateVars = {
    user,
    shortURL,
    longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (urlDatabase[shortURL] === undefined) {
    res.send("This URL does not exist.");
  }

  const longURL = urlDatabase[shortURL].longURL;
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

  if (!userID) {
    return res.status(401).send("Login to continue");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
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

  if (!userId) {
    return res.send("Login to continue");
  }

  if (userId !== urlDatabase[shortURL].userID) {
    return res.status(400).send("Unauthorized");
  }

  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  const result = bcrypt.compareSync(password, user.password);

  if (!email || !password) {
    return res.status(400).send("Missing login credentials. <a href='/login'> Click to go back </a>");
  }
  if (!user) {
    return res.status(403).send("Email not found. Go back to <a href='/login'> Login</a> or <a href='/register'> Register</a> another email.");
  }
  if (!result) {
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
  if (getUserByEmail(email, users)) {
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
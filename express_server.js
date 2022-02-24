const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

//--------------------------------------------- DATABASE -------------------------------------------------
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "aa": {
    id: "aa",
    email: "a@a",
    password: "a"
  },
 "bb": {
    id: "bb",
    email: "b@b",
    password: "b"
  }
};

//-------------------------------------------- HELPER FUNCTION ---------------------------------------------
// Helper func to generate a random string
const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};

// Helper func to check if email is in "users" database
const getUserByEmail = function(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return false;
};

//--------------------------------------------- GET ROUTES -------------------------------------------------
// Homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// URLS index
app.get("/urls", (req, res) => {
  // console.log("req.cookies.user_id:", req.cookies.user_id); // req.cookies.user_id = nk8gkb
  // console.log("req.cookies >>>>", req.cookie); // req.cookies = undefined

  const user = users[req.cookies.user_id];

  const templateVars = {
    user,
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET route to render the urls_new.ejs template in the browser, to present the form to the user
// This route handler will render the page with the form.
app.get("/urls/new", (req, res) => {

  const user = users[req.cookies.user_id];

  const templateVars = {
    user,
    urls: urlDatabase };
  res.render("urls_new", templateVars);
});

// Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  // URL Shortening (Part 2)
  // What would happen if a client requests a non-existent shortURL?
  if (!urlDatabase[req.params.shortURL]) {
    res.send("This URL does not exist.");
  }
  res.redirect(longURL);

});

// Create a GET /register endpoint, which returns the register template
app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { user };
  res.render("register", templateVars);
});

// Create a GET /login endpoint that responds with the new login form template
app.get("/login", (req, res) => {
  const templateVars = {
    email: req.body.email,
    password: req.body.password };
  res.render("login", templateVars);
});

//---------------------------------------------- POST ROUTES -----------------------------------------------
// POST route to handle the form submission (make a request to POST /urls)
// body will contain one URL-encoded name-value pair with the name longURL.
// The form has an action attribute set to /urls
// The form's method is set to POST
// The form has one named input, with the name attribute set to longURL
// Note that it's been parsed into a JS object, where "longURL" is the key
// we specified this key using the "input" attribute "name"
app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  // console.log("shortURL::", shortURL, "req.body.longURL::", req.body.longURL);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);
});

// Add a POST route that removes a URL resource: POST /urls/:shortURL/delete
// After the resource has been deleted, redirect the client back to the urls_index page ("/urls").
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Add a POST route that updates a URL resource; POST /urls/:id
app.post("/urls/:shortURL/", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// Add an endpoint to handle a POST to /login in your Express server.
// After our server has set the cookie it should redirect the browser back to the /urls page.
//
// Update the POST /login endpoint to look up the email address (submitted via the login form) in
// the user object.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  // check for missing email or password
  if (!email || !password) {
    return res.status(400).send("ERROR: Missing login information!");
    // include link to go back?
  }
  
  // set user to return value of check email function
  const user = getUserByEmail(email);
  // console.log("user:", user, "user.password::", user.password);
  // user: { id: 'aa', email: 'a@a', password: 'a' } user.password:: a

  // 1. If a user with that e-mail cannot be found, return a response with a 403 status code.
  //
  // if getUserByEmail returns false, that means email IS NOT in "users" database
  if (!user) {
    return res.status(403).send("This email is not registered");
    // include link to go back? try again?
  }

  // 2. If a user with that e-mail address is located, compare the password given in the form with
  // the existing user's password. If it does not match, return a response with a 403 status code.
  if (password !== user.password) {
    return res.status(403).send("Invalid login credentials");
    // include link to go back? try again?
  }

  // 3. If both checks pass, set the user_id cookie with the matching user's random ID
  // then redirect to /urls.
  res.cookie("user_id", user.id);
  res.redirect("/urls/");
});

// Modify the logout endpoint to clear the correct user_id cookie instead of the username one.
// and redirects the user back to the /urls page.
// mentor suggested to redirect to /login... makes sense
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  // only have to pass in the string of the key name, not the value!
  // mentor suggested to redirect to /login... makes sense
  res.redirect("/login");
});

// This endpoint should add a new user object to the global users object.
// The user object should include the user's id, email and password, similar to the example above.
// After adding the user, set a user_id cookie containing the user's newly generated ID.
// Redirect the user to the /urls page.
// Test that the users object is properly being appended to.
// Also test that the user_id cookie is being set correctly upon redirection.
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  // If the e-mail or password are empty strings, send back a response with the 400 status code.
  // If someone tries to register with an email that is already in the users object, send back a
  // response with the 400 status code.

  if (!email || !password) {
    return res.status(400).send("ERROR: Missing email and/or password");
    // include link to go back?
  }

  // Checking for an email in the users object is something we'll need to do
  // in other routes as well. Consider creating an email lookup helper function to keep your code DRY

  // if checkEail is true, means the email exists in users -> don't allow registration
  if (getUserByEmail(email)) {
    return res.status(400).send("Email is already registered");
    // include link to go back and try again, or to go to log in page??
  }

  users[id] = {
    id,
    email,
    password
  };

  res.cookie("user_id", id);

  console.log("users:", users);
  
  res.redirect("/urls/");
});

//--------------------------------- GET ROUTE for /urls/:shortURL -------------------------------------------------
// Page to display a single URL and its shortened form
// if the ID of the long url was b2xVn2, then the url would look like /urls/b2xVn2 in the browser
// Further, the value of req.params.shortURL would be b2xVn2
//
// The order of route definitions matters! The GET /urls/new route needs to be defined before the
// GET /urls/:id route. Routes defined earlier will take precedence, so if we place this route after
// the /urls/:id definition, any calls to /urls/new will be handled by app.get("/urls/:id", ...)
// because Express will think that new is a route parameter. A good rule of thumb to follow is that routes
// should be ordered from most specific to least specific.
app.get("/urls/:shortURL", (req, res) => {

  const user = users[req.cookies.user_id];

  const templateVars = {
    user,
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

//---------------------------------------------- LISTENER -------------------------------------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
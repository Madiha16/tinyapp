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
const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};

//--------------------------------------------- GET ROUTES -------------------------------------------------
// Homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// URLS index
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
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
  const templateVars = {
    username: req.cookies["username"],
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
  const templateVars = {
    email: req.body.email,
    password: req.body.password };
  res.render("register", templateVars);
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
// It should set a cookie named username to the value submitted in the request body via the login form.
// After our server has set the cookie it should redirect the browser back to the /urls page.
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls/");
});

// Implement the /logout endpoint so that it clears the username cookie
// and redirects the user back to the /urls page.
app.post("/logout", (req, res) => {
  const username = req.body.username;
  res.clearCookie("username", username);
  res.redirect("/urls/");
});

// This endpoint should add a new user object to the global users object.
// The user object should include the user's id, email and password, similar to the example above.

// To generate a random user ID, use the same function you use to generate random IDs for URLs.

// After adding the user, set a user_id cookie containing the user's newly generated ID.

// Redirect the user to the /urls page.
// Test that the users object is properly being appended to.
// You can insert a console.log or debugger prior to the redirect logic to inspect what data the object contains.
// Also test that the user_id cookie is being set correctly upon redirection. You already did this sort
// of testing in the Cookies in Express activity. Use the same approach here.
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const user = {
    id,
    email,
    password
  };
  users[id] = user;

  res.cookie("user_id", user.id);
  // console.log("user:", user, "users[id]:", users[id]);
  // console.log("users:", users);
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
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

//---------------------------------------------- LISTENER -------------------------------------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
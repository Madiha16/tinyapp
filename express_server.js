const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

//--------------------------------------------- DATABASE -------------------------------------------------
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase };
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
  res.render("urls_new");
});

// Page to display a single URL and its shortened form
// if the ID of the long url was b2xVn2, then the url would look like /urls/b2xVn2 in the browser
// Further, the value of req.params.shortURL would be b2xVn2
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
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


//---------------------------------------------- POST ROUTES -----------------------------------------------
// POST route to handle the form submission (make a request to POST /urls)
// body will contain one URL-encoded name-value pair with the name longURL.
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log("shortURL::", shortURL, "req.body.longURL::", req.body.longURL);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);
});

//---------------------------------------------- LISTENER -------------------------------------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
// Helper func to check if email is in "users" database
const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};

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

module.exports = { getUserByEmail, generateRandomString, urlsForUser };
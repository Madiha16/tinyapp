// Helper func to check if email is in "users" database
const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};

module.exports = { getUserByEmail };
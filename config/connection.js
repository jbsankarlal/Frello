const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = (done) => {
  // const url = "mongodb://localhost:27017"; // Updated URL for localhost
  const url =
    "mongodb+srv://sankarlal:Sfrello@cluster0.nlvd0f7.mongodb.net/?retryWrites=true&w=majority";
  const dbname = "frello";

  mongoClient.connect(url, (err, data) => {
    if (err) {
      return done(err);
    }
    state.db = data.db(dbname);
    done();
  });
};

module.exports.get = () => {
  return state.db;
};

var express = require('express')
  , MongoStore = require('connect-mongo')(express)

module.exports = function (skinDB) {
  if (!skinDB) throw new Error('must have a db as first arg');
  return express.session({
      secret: 'august sunday'
    , store: new MongoStore({
          db: adaptMongoskin(skinDB)
      })
  })
}

// hacky; open to suggestions
function adaptMongoskin(skinDB) {
  return {
      collection: function (name, cb) {
        cb(null, skinDB.collection(name))
      }
    , open: skinDB.open.bind(skinDB)
  }
}

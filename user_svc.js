var P
  , error = require('./error')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10

module.exports = UserService

function UserService(db) {
  this.users = db.collection('users')
}

P = UserService.prototype

P.findById = function (id, cb) {
  this.users.findById(id, cb)
}

P.create = function (username, password, cb) {
  var self = this
  this._encryptPassword(password, function (err, passHash) {
    if (err) return cb(err)
    var user = {username: username, password: passHash}
    self.users
      .ensureIndex({username: 1}, {unique: true})
      .insert(user, {safe: true}, function (err) {
        if (err) {
          var isDup = (err.message.indexOf('E11000') > -1)
            , msg = 'user already exists: ' + username
          return cb(isDup ? new error.ConflictError(msg, err) : err)
        }
        cb(null, user._id)
      })
  })
}

P.authenticate = function (username, password, cb) {
  var self = this
  this.users.findOne({
      username: username
  }, function (err, user) {
    if (err) return cb(err)
    if (!user) return cb(null, false, {message: 'Unknown user'})
    self._comparePassword(password, user.password, function (err, isMatch) {
      if (err) return cb(err)
      if (!isMatch) return cb(null, false, {message: 'Invalid password'})
      return cb(null, user)
    })
  })
}

P.toSession = function (user, cb) {
  cb(null, user._id)
}

P.fromSession = function (userId, cb) {
  this.findById(userId, cb)
}

P._comparePassword = function (plainText, hashedPassword, cb) {
  bcrypt.compare(plainText, hashedPassword, function (err, isMatch) {
    if (err) return cb(err)
    cb(null, isMatch)
  })
}

P._encryptPassword = function (plainText, cb) {
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err)
    bcrypt.hash(plainText, salt, cb)
  })
}

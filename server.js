var express = require('express')
  , Passport = require('passport').Passport
  , LocalStrategy = require('passport-local').Strategy
  , mongo = require('mongoskin')
  , error = require('./error')
  , UserSvc = require('./user_svc')
  , session = require('./session_mid')
  , MONGO_URI = process.env.MONGO_URI || 'localhost:27017/test'
  , db = mongo.db(MONGO_URI, {safe: false})
  , app = express()
  , userSvc = new UserSvc(db)
  , pass = new Passport()

pass.serializeUser(userSvc.toSession.bind(userSvc))
pass.deserializeUser(userSvc.fromSession.bind(userSvc))
pass.use(new LocalStrategy(userSvc.authenticate.bind(userSvc)))

app.configure('development', function () {
  app.use(express.logger('dev'))
})

app.configure(function () {
  app.use(express.cookieParser())
  app.use(express.bodyParser())
  app.use(session(db))
  app.use(pass.initialize())
  app.use(pass.session())
})

app.get('/', function (req, res, next) {
  if (!req.isAuthenticated()) return res.redirect('/login')
  res.json({user: req.user})
})

app.get('/logout', function (req, res, next) {
  req.logout()
  res.redirect('/login')
})

app.post('/signup', function (req, res, next) {
  var username = req.body.username
    , password = req.body.password
  if (!username || !password) {
    var msg = 'username & password are mandatory'
    return res.json(400, {error: msg})
  }
  userSvc.create(username, password, function (err, userId) {
    if (err) {
      if (err instanceof error.ConflictError) {
        return res.json(409, {error: err.message})
      }
      return next(err)
    }
    res.json({id: userId})
  })
})

app.post('/login', pass.authenticate('local', {
    successRedirect: '/'
  , failureRedirect: '/login'
}))

app.listen(process.env.PORT || 3000)

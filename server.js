var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var config = require('./config');
var request = require('request');
var cookie = require('cookie-parser');
app.set('superSecret', config.secret);

var port = 8000 || process.env.PORT;
var db = mongoose.createConnection('localhost', 'test');

var schema = mongoose.Schema({
    name: String,
    password: String,
    admin: Boolean
});

var schema2 = mongoose.Schema({
    Name: String,
    Hero: String

});
var User = db.model('User', schema);
var Films = db.model('films', schema2);


// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
// use morgan to log requests to the console
app.use(morgan('dev'));
app.listen(port, function () {
    console.log("Server running on port " + port);
});

app.get('/setup', function (req, res) {


    // create a sample user
    var mk = new User({
        name: 'mani',
        password: 'kanta',
        admin: true
    });

    // save the sample user
    mk.save(function (err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({
            success: true
        });
    });
});
app.get('/', function (req, res) {
    res.send('Hello wolrd!!!');
});

var apiRouter = express.Router();

apiRouter.get('/movies', function (req, res) {
    Films.find({}, function (err, results) {
        if (err) {
            res.json({
                message: 'No films found'
            });
        } else {
            res.json(results);
        }
    });
});
var objectId = require('mongodb').ObjectId;



apiRouter.post('/authenticate', function (req, res) {
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err;
        if (!user) {
            res.json({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        } else if (user) {
            // check if password matches
            if (user.password != req.body.password) {
                res.json({
                    success: false,
                    message: 'Authentication failed. Wrong password.'
                });
            } else {
                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: 60 // expires in 24 hours
                });
                //   console.log(token);
                //    req.session.token = token;
                //  console.log(req.session.token);
                // return the information including token as JSON
                res.json({

                    success: true,
                    message: "Hello  " + req.body.name,
                    token: token
                });
            }
        }
    });
});
apiRouter.use(function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});





apiRouter.get('/users', function (req, res) {
    User.find({}, function (err, users) {
        if (err) {
            res.json({
                message: 'No User Found'
            });
        } else {
            res.json(users);
        }
    });
});


app.get('/logout', function (req, res) {
    function deleteAllCookies() {
        var cookies = document.cookie.split(";");

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }
    res.json({
        message: "Logout Sucessfully"
    });

});
apiRouter.get('/movies/:id', function (req, res) {
    Films.find({
        Name: req.params.id
    }, function (err, results) {
        if (err) {
            res.json({
                message: "Wrong Movie Id"
            });
        } else {
            res.json(results);
        }
    })
});

app.use('/api', apiRouter);
var express = require("express");
var util = require("util");
var oauth = require("oauth").OAuth;
var redis = require("redis");
var config = require("./config");

var app = express.createServer();
var db = redis.createClient(6379);

db.on('error', function(err) {
    console.log(err);
    db.quit();
});

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.static(__dirname + "/www/"));

    app.set("views", __dirname + "/views");
    app.set("view options", {layout: false});
    app.set("view engine", "html");
    app.register("html", require("jqtpl").express);
});

// global

var unauthSecrets = {};
var authSecrets = {};
var consumerKey = config.consumerKey;
var consumerSecret = config.consumerSecret;

var oa = new oauth("https://api.twitter.com/oauth/request_token",
                   "https://api.twitter.com/oauth/access_token",
                   consumerKey,
                   consumerSecret,
                   "1.0",
                   null,
                   "HMAC-SHA1");

// util

function setRequestSecret(token, secret, k) {
    db.set('tweetness-rs-' + token, secret, function() {
        if(k) k();
    });
}

function getRequestSecret(token, k) {
    db.get('tweetness-rs-' + token, function(err, res) {
        k(res);
    });
}

function setTokenSecret(token, secret, k) {
    db.set('tweetness-ts-' + token, secret, function() {
        if(k) k();
    });
}

function delTokenSecret(token) {
    db.del('tweetness-ts-' + token);
}

function getTokenSecret(token, k) {
    db.get('tweetness-ts-' + token, function(err, res) {
        k(res);
    });
}

function getTimeline(accessToken, k) {
    getTokenSecret(accessToken, function(accessTokenSecret) {
        oa.get("http://api.twitter.com/1/statuses/home_timeline.json",
               accessToken,
               accessTokenSecret,
               k);
    });
}

// pages

app.get("/", function(req, res) {
    // if(req.cookies.accesstoken) {
    //     res.redirect("/app");
    // }
    // else {
        res.render("index.html");
//}
});

app.get("/authorize", function(req, res) {
    oa.getOAuthRequestToken(function(err, token, tokenSecret, results) {
        if(err) {
            console.log("Error:" + util.inspect(err));
            res.end();
        }
        else {
            setRequestSecret(token, tokenSecret, function() {
                res.redirect("http://api.twitter.com/oauth/authorize?oauth_token=" +
                             token);
            });
        }
    });
});

app.get("/oauth_callback", function(req, res) {
    var token = req.query.oauth_token;
    var verifier = req.query.oauth_verifier;

    getRequestSecret(token, function(tokenSecret) {
        if(!tokenSecret) {
            res.write("This token is invalid");
            res.end();
            return;
        }

        oa.getOAuthAccessToken(
            token,
            tokenSecret,
            verifier,
            function(err, accessToken, accessTokenSecret, results) {
                if(err) {
                    console.log("getOAuthAccessToken: error: " + util.inspect(error));
                }
                else {
                    setTokenSecret(accessToken, accessTokenSecret, function() {
                        res.cookie("accesstoken", accessToken);
                        res.redirect("/app");
                    });
                }
            }
        );
    });
});

app.get("/app", function(req, res) {
    getTimeline(req.cookies.accesstoken, function(err, data) {
        if(err) {
            res.write("There was an error getting your timeline: " +
                      util.inspect(err));
        }
        else {
            data = JSON.parse(data);
            res.render("app.html", { tweets: data });
        }

        res.end();
    });
});

app.get("/logout", function(req, res) {
    res.clearCookie("accesstoken");
    delTokenSecret(req.cookies.accesstoken);
    res.redirect("/");
});

app.get("/timeline", function(req, res) {
    getTimeline(req.cookies.accesstoken, function(err, data) {
        if(err) {
            res.write('{ "error": true }');
        }
        else {
            res.write(data);
        }

        res.end();
    });
});

app.post("/update", function(req, res) {
    var accessToken = req.cookies.accesstoken;

    getTokenSecret(accessToken, function(accessTokenSecret) {
        oa.post("http://api.twitter.com/1/statuses/update.json",
                accessToken,
                accessTokenSecret,
                { status: req.body.msg },
                function(err, data) {
                    if(err) {
                        console.log("Error: " + util.inspect(err));
                        res.send('{ "error": true }', 400);
                    }
                    else {
                        res.send('{ "success": true }');
                    }

                    res.end();
                });
    });
});

app.listen(config.port);
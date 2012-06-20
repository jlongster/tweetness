
// This is just a braindump of trying to work with Twitter's OAuth

var util = require("util");
var oauth = require("oauth").OAuth;

var consumerKey = "";
var consumerSecret = "";

var oa = new oauth("https://api.twitter.com/oauth/request_token",
                   "https://api.twitter.com/oauth/access_token",
                   consumerKey,
                   consumerSecret,
                   "1.0",
                   null,
                   "HMAC-SHA1");

var accessToken = "";
var accessTokenSecret = "";

// oa.post("http://api.twitter.com/1/statuses/update.json",
//         accessToken,
//         accessTokenSecret,
//         { "status": "Tweeting from tweetness" },
//         function(err, data) {
//             if(err) {
//                 console.log("Error: " + util.inspect(err));
//             }
//             else {
//                 console.log(data);
//             }
//         });

function authorize(k) {
    oa.getOAuthRequestToken(function(err, token, tokenSecret, results) {
        if(error) {
            console.log("Error:" + util.inspect(err));
        }
        else {
            k(token, tokenSecret);
        }
    });
}

authorize(function(token, tokenSecret) {
    res.redirect("http://api.twitter.com/oauth/authorize?oauth_token=" + token);
});

// twitter callback

function callback() {
    var token = url.query.oauth_token;
    var verifier = url.query.oauth_verifier;

    oa.getOAuthAccessToken(token, tokenSecret, verifier,
                           function(err, accessToken, accessTokenSecret, results2) {
                               if(error) {
                                   console.log("getOAuthAccessToken: error: " + util.inspect(error));
                               }
                               else {
                                   // and I have everything I need
                               }
                           });
}
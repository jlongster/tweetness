
var global = this;

// Include the in-app payments API, and if it fails to load handle it
// gracefully.
// https://developer.mozilla.org/en/Apps/In-app_payments
require(['https://marketplace-cdn.addons.mozilla.net/mozmarket.js'],
        function() {},
        function(err) {
            global.mozmarket = global.mozmarket || {};
            global.mozmarket.buy = function() {
                alert('The in-app purchasing is currently unavailable.');
            };
        });


require(['lib/zepto'], function($) {
    var tweetbox = $("header input[name=tweet]");

    function notify(msg) {
        if(msg) {
            var note = $('.notification');
            if(note.length) {
                note.html(msg);
            }
            else {
                $('body').append('<div class="notification">' + msg + '</div>');
            }
        }
        else {
            $('.notification').remove();
        }
    }

    function update_tweets() {
        $.getJSON('/timeline', function(data) {
            var lst = $('section ul');
            lst.empty();

            for(var i=0; i<data.length; i++) {
                var tweet = data[i];
                lst.append('<li>' +
                           '<strong>' + tweet.user.name + '</strong> ' +
                           tweet.text +
                           '</li>');
            }

            notify(null);
        });
    }

    function submit_tweet(tweet) {
        notify("Posting tweet...");
        $.post('/update', { msg: tweet }, function(r) {
            tweetbox.val('');
            notify(null);

            // Give twitter 2 seconds to update
            setTimeout(function() {
                notify("Updating tweets...");
                update_tweets();
            }, 4000);
        }, function() {
            alert('error sending tweet');
        });
    }

    tweetbox.keydown(function(e) {
        // enter
        if(e.keyCode == 13) {
            submit_tweet(tweetbox.val());
        }
    });

    $('#go').click(function() {
        submit_tweet(tweetbox.val());
    });
});

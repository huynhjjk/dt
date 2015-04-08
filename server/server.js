var request = require('request');
var Q = require('q');
var Firebase = require('firebase');
var express = require('express');
var cheerio = require('cheerio');
var app = express();


app.get('/', function (req, res) {
	res.send('Hello World!')
})

var server = app.listen(3000, 'localhost', function () {

	var host = server.address().address
	var port = server.address().port

	var rootRef = new Firebase('https://dt-app.firebaseio.com/');
	var reutersRef = rootRef.child('reuters')

	console.log('News Crawler listening at http://%s:%s', host, port)

	var reutersNewsRequest = function(searchQuery){
		var deferred = Q.defer();
		var url = 'http://www.reuters.com/search/news?blob=' + searchQuery + '&sortBy=date&dateRange=pastDay'
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var $ = cheerio.load(body);
		    var articles = [];
		    $('.search-result-content').each(function(i, element){
		      var article = {
		      	title: $(this).children().children().eq(0).text(),
		      	url: $(this).children().children().attr('href'),
		      	summary: $(this).children().next().eq(0).text(),      	
		      	date: $(this).children().next().eq(1).text(),
		      	source: 'reuters'
		      }
		      articles.push(article);
		    });
			deferred.resolve(articles);  
		  }
		});
		return deferred.promise;
	};

	var addToFirebase = function(data) {
		// Clear Previous Data
		reutersRef.remove();
		for (var i = 0; i < data.length; i++) {
			reutersRef.push(data[i]);
		}
		console.log('Sent to Firebase');
	}

	// Reuters Crude Oil News
	reutersNewsRequest('crude oil').then(function(data){
		addToFirebase(data);
	});
})
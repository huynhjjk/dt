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

	/* START OF BUSINESS TIMES */

	// Recent Business Times Urls
	var getBusinessTimesUrls = function(searchQuery) {
		var deferred = Q.defer();
		var url = 'http://www.businesstimes.com.sg/search/' + searchQuery + '?page=1&filter=headline_en%2Cbody_en&sort=publicationdate'
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var $ = cheerio.load(body);
		    var urls = [];
			$('#sph-search-results .media .media-body').each(function() {
				urls.push($(this).children().first().children().attr('href'));
			});
			deferred.resolve(urls);  
		  }
		});
		return deferred.promise;
	}

	// Business Times Article
	var getBusinessTimesArticle = function(url) {
		var deferred = Q.defer();
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var $ = cheerio.load(body);
		    var data = {
		    	url: url,
		    	title: $('h1.headline').text(),
		    	date: $('#node_article_full_group_content > time').text(),
		    	summary: $('#node_article_full_group_content').children().next().next().text() + ' ',
		    	source: 'Business Times'
		    }
			deferred.resolve(data);
		  }
		});
		return deferred.promise;
	}

	// Business Times Articles
	var getAllBusinessTimesArticles = function(urls) {
		var articles = [];
		for (var i = 0; i < urls.length; i++) {
			articles.push(getBusinessTimesArticle(urls[i]));
		}
		return Q.all(articles);
	}

	/* END OF BUSINESS TIMES */

	/* START OF REUTERS */

	// Recent Reuters Urls
	var getReutersUrls = function(searchQuery) {
		var deferred = Q.defer();
		var url = 'http://www.reuters.com/search/news?blob=' + searchQuery + '&sortBy=date&dateRange=pastDay'		
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var $ = cheerio.load(body);
		    var urls = [];		    
			$('.search-result-list .search-result-indiv .search-result-content').each(function() {
			    urls.push($(this).children().children().attr('href'));
			});	    
			deferred.resolve(urls);  
		  }
		});
		return deferred.promise;
	}

	// Reuters Article
	var getReutersArticle = function(url) {
		var deferred = Q.defer();
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var $ = cheerio.load(body);
		    var data = {
		    	url: url,
		    	title: $('h1.article-headline').text(),
		    	date: $('span.timestamp').text(),
		    	summary: $('#articleText').children().text() + ' ',
		    	source: 'Reuters'
		    }
			deferred.resolve(data);
		  }
		});
		return deferred.promise;
	}

	// Reuters Articles
	var getAllReutersArticles = function(urls) {
		var articles = [];
		for (var i = 0; i < urls.length; i++) {
			articles.push(getReutersArticle(urls[i]));
		}
		return Q.all(articles);
	}

	/* END OF REUTERS */

	var addToFirebase = function(data) {
		for (var i = 0; i < data.length; i++) {
			reutersRef.push(data[i]);
		}
		console.log('Sent to Firebase');
	}

	// Clear Previous Data
	reutersRef.remove();
	console.log('Cleared Firebase');

	getBusinessTimesUrls('crude oil').then(function(urls) {
		getAllBusinessTimesArticles(urls).then(function(data){
			console.log('Business Times');
			addToFirebase(data);
		});
	});

	getReutersUrls('crude oil').then(function(urls) {
		getAllReutersArticles(urls).then(function(data){
			console.log('Reuters');
			addToFirebase(data);
		});
	});

})
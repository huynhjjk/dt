var request = require('request');
var Q = require('q');
var Firebase = require('firebase');
var express = require('express');
var cheerio = require('cheerio');
var sentiment = require('sentiment');
var app = express();
var dictionaryFile = require('./utilities/dictionary.js');
console.log(dictionaryFile);
var dictionary = dictionaryFile.dictionary;
var onlyWords = dictionaryFile.onlyWords;
var countBusiness = 0;
var countReuters = 0;

app.get('/', function (req, res) {
	res.send('Hello World!')
})

var server = app.listen(3000, 'localhost', function () {

	var host = server.address().address
	var port = server.address().port

	var rootRef = new Firebase('https://dt-app.firebaseio.com/');
	var businessTimesRef = rootRef.child('businessTimes')
	var reutersRef = rootRef.child('reuters')

	 //return an object with its sentiment score about a particular article
	  var calculateSentimentScore = function(abstract, dictionary, onlyWords){
	    var scoreObject = {
	      positive: 0,
	      both: 0,
	      negative: 0,
	      neutral: 0,
	      weakLevel: 0,
	      strongLevel: 0,
	      testedWords: []
	    };

      var listOfWords = abstract.replace(/[\n\r]/g, "").split(/[ .]+/);
      //iterate and evaluate each word in sentence
      for(var j = 0; j < listOfWords.length; j++){
        var currentWord = listOfWords[j];       
        //if current word is in the dictionary
         if(onlyWords.indexOf(currentWord) != -1 && currentWord != ""){
            for(var k = 0; k < dictionary.length; k++){
              var wordInDictionary = dictionary[k].word;
              if(currentWord == wordInDictionary){
                scoreObject.testedWords.push(currentWord);
                //scoreObject['abstract'] = abstract;
                  switch(dictionary[k].connotation){
                    case "negative":
                      if (dictionary[k].level == "strongsubj"){
                        scoreObject.negative++;  
                      }
                      scoreObject.negative++;
                      break;
                    case "positive":
                      if (dictionary[k].level == "strongsubj"){
                        scoreObject.positive++;  
                      }                    
                      scoreObject.positive++;
                      break; 
                    case "neutral":
                      scoreObject.neutral++;
                    case "both":
                      scoreObject.both++;
                      break;
                  }
                  switch(dictionary[k].level){
                    case "strongsubj":
                    scoreObject.strongLevel++;
                    break;
                    case "weaksubj":
                    scoreObject.weakLevel++;
                    break;
                  }
              }
            }
         }
      }
	    return scoreObject;
	  }

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
		    //console.log(sentiment($('#node_article_full_group_content').children().next().text() + ' '));
		    var data = {
		    	url: url,
		    	title: $('h1.headline').text(),
		    	date: $('#node_article_full_group_content > time').text(),
		    	summary: $('#node_article_full_group_content').children().next().text() + ' ',
		    	source: 'Business Times',
		    	countBusiness: countBusiness,
		    	sentiments: calculateSentimentScore($('#node_article_full_group_content').children().next().text() + ' ', dictionary, onlyWords),
		    	score: sentiment($('#node_article_full_group_content').children().next().text() + ' ')

		    }
		    countBusiness++;
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
		    	source: 'Reuters',
		    	countReuters: countReuters,
				sentiments: calculateSentimentScore($('#articleText').children().text() + ' ', dictionary, onlyWords),
				score: sentiment($('#articleText').children().text() + ' ')

		    }
		    countReuters++;
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

	var addBusinessTimesToFirebase = function(data) {
		businessTimesRef.remove();
		for (var i = 0; i < data.length; i++) {
			businessTimesRef.push(data[i]);
		}
		console.log('Sent Business Times to Firebase');
	}

	var addReutersToFirebase = function(data) {
		reutersRef.remove();
		for (var i = 0; i < data.length; i++) {
			reutersRef.push(data[i]);
		}
		console.log('Sent Reuters to Firebase');
	}

	getBusinessTimesUrls('crude oil').then(function(urls) {
		getAllBusinessTimesArticles(urls).then(function(data){
			addBusinessTimesToFirebase(data);
		});
	});

	getReutersUrls('crude oil').then(function(urls) {
		getAllReutersArticles(urls).then(function(data){
			addReutersToFirebase(data);
		});
	});

})
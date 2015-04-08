var request = require('request');
var Q = require('q');
var Firebase = require('firebase');
var express = require('express');
var app = express();

app.get('/', function (req, res) {
	res.send('Hello World!')
})

var server = app.listen(3000, 'localhost', function () {

	var host = server.address().address
	var port = server.address().port

	console.log('DT-Server listening at http://%s:%s', host, port)

	var rootRef = new Firebase('https://dt-app.firebaseio.com/');
	var stocksRef = rootRef.child('stocks')
	var originalSymbolsRef = rootRef.child('symbols')
	var currentSymbolsRef = rootRef.child('currentSymbols')

	stocksRef.remove();
	currentSymbolsRef.remove();

	//set all symbols to database
	// for(var i = 0; i < symbols.length; i++){
	// 	originalSymbolsRef.push({
	// 		name: symbols[i]
	// 	});
	// }

	var symbolsRequest = function(ref){
		var deferred = Q.defer();
		ref.once("value", function(data){
			var symbolsPerCall = 100;
			var tempSymbols = [];
			var tempToPush = [];
			data.forEach(function(currentSymbol){
				if(tempToPush.length == symbolsPerCall){
					tempSymbols.push(tempToPush);
					tempToPush = [];
				}
				tempToPush.push(currentSymbol.val().name);
			});
			//remaining symbols
			tempSymbols.push(tempToPush);			
			deferred.resolve(tempSymbols);
		});
		return deferred.promise;
	};

	var financeRequest = function(url){
		var deferred = Q.defer();
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
			deferred.resolve(body);
		  }
		})
		return deferred.promise;
	};

	var googleYahooRequests = function(symbolsGroup) {
		var packGoogleYahooRequests = [];
		var googleFinanceUrl = 'http://finance.google.com/finance/info?client=ig&q=' + symbolsGroup.join();
		var yahooFinanceUrl = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%27' + symbolsGroup.join() + '%27)%0A%09%09&format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env&callback=';
		packGoogleYahooRequests.push(financeRequest(googleFinanceUrl), financeRequest(yahooFinanceUrl));
		return Q.all(packGoogleYahooRequests);		
	}

	var formatStocks = function(googleArray, yahooArray) {
	    var googleFinance = JSON.parse(googleArray.substring(3, googleArray.length));
	    var yahooFinance = JSON.parse(yahooArray).query.results.quote;
	    var stocks = [];
	    // console.log(googleFinance.length, yahooFinance.length);
	    for(var i = 0; i < yahooFinance.length; i++){
	    	var yahooSymbol = yahooFinance[i].Symbol;
	    	for(var j = 0; j < googleFinance.length; j++){
	    		var googleSymbol = googleFinance[j].t;
	    		if(yahooSymbol == googleSymbol){
					var stock = {};
					// Google Finance
					if (googleSymbol) {
						stock.symbol = googleSymbol || Math.random();
					}
					if (googleFinance[j].l) {
						stock.current = parseFloat(googleFinance[j].l);
					}
					if (googleFinance[j].cp) {
						stock.changePrice = parseFloat(googleFinance[j].c);
					}
					if (googleFinance[j].cp) {
						stock.changePercent = parseFloat(googleFinance[j].cp);
					} else {
						stock.changePercent = 0;
					}
					if (googleFinance[j].lt) {
						stock.lastPurchase = googleFinance[j].lt;
					}
					if (googleFinance[j].div) {
						stock.div = parseFloat(googleFinance[j].div);
					}
					// Yahoo Finance
					if (yahooFinance[i].Name) {
						stock.name = yahooFinance[i].Name;
					}
					if (yahooFinance[i].AverageDailyVolume) {
						stock.averageDailyVolume = parseFloat(yahooFinance[i].AverageDailyVolume);						
					}
					if (yahooFinance[i].Open) {
						stock.open = parseFloat(yahooFinance[i].Open);						
					}
					if (yahooFinance[i].PreviousClose) {
						stock.close = parseFloat(yahooFinance[i].PreviousClose);						
					}
					if (yahooFinance[i].DaysRange) {
						stock.dayRange = yahooFinance[i].DaysRange;						
					}
					if (yahooFinance[i].YearRange) {
						stock.yearRange = yahooFinance[i].YearRange;						
					}
					if (yahooFinance[i].FiftydayMovingAverage) {
						stock.fiftyDayMovingAverage = parseFloat(yahooFinance[i].FiftydayMovingAverage);
					}
					if (yahooFinance[i].TwoHundreddayMovingAverage) {
						stock.twoHundredDayMovingAverage = parseFloat(yahooFinance[i].TwoHundreddayMovingAverage);
					}
					if (yahooFinance[i].DividendYield) {
						stock.dividendYield = parseFloat(yahooFinance[i].DividendYield);
					} else {
						stock.dividendYield = 'N/A';
					}
					if (yahooFinance[i].DividendPayDate) {
						stock.dividendPayDate = yahooFinance[i].DividendPayDate;
					} else {
						stock.dividendPayDate = 'N/A';
					}
					// Custom
					stock.lastUpdate = (new Date()).getTime();
					stocks.push(stock);
	    		}
	    	}
	    }
		return stocks;
	}

	var getFinalStocks = function(multiSymbolsArray){
		var stockPromises = [];
		for (var i = 0; i < multiSymbolsArray.length; i++) {
			stockPromises.push(googleYahooRequests(multiSymbolsArray[i]));
		}
		return Q.all(stockPromises);	
	}

	var addToFirebase = function(data) {
		currentSymbolsRef.remove();
		for (var i = 0; i < data.length; i++) {
			stocksRef.push(data[i]);

			// Add to current symbols\
			currentSymbolsRef.push({
				name: data[i].symbol
			});

		}
		console.log('Sent to Firebase');
	}

	var updateToFirebase = function(data) {
		for (var i = 0; i < data.length; i++) {
			// var stock = stocksRef.set({
			// 	"ABC": {
			// 	    averageDailyVolume: Math.random(),
			// 	    changePercent: 0,
			// 	    changePrice: 0,
			// 	    close: 9.63,
			// 	    current: 9.63,
			// 	    daysHigh: 0,
			// 	    daysLow: 0,
			// 	    fiftyDayMovingAverage: 9.52,
			// 	    lastModified: new Date(),
			// 	    lastPurchase: "Mar 9, 2:43PM EDT",
			// 	    name: "Testing",
			// 	    open: 9.63,
			// 	    symbol: "ABC"
			// 	}
			// });
		}
		console.log('Udated to Firebase');
	}

	/* Initialize using default symbols */
    rootRef.once('value', function(snapshot) {
        if (!snapshot.hasChild('currentSymbols')) {
        	console.log('Current Symbols does not exist. Using original symbols.');
			symbolsRequest(originalSymbolsRef).then(function(multiSymbolsArray){
				getFinalStocks(multiSymbolsArray).then(function(googleYahooArray){
					var finalStockPromises = [];
					for (var i = 0; i < googleYahooArray.length; i++) {
						finalStockPromises = finalStockPromises.concat(formatStocks(googleYahooArray[i][0], googleYahooArray[i][1]));
					}
					addToFirebase(finalStockPromises);
				});
			});
        } else {
        	console.log('Current Symbols already exist. Using existing symbols.');
			/* Initialize using current symbols */
			var seconds = 30, timeInterval = seconds * 1000;
			setInterval(function() {
				console.log(seconds + " seconds have passed. Updating...");

				stocksRef.remove();

				symbolsRequest(currentSymbolsRef).then(function(multiSymbolsArray){
					getFinalStocks(multiSymbolsArray).then(function(googleYahooArray){
						var finalStockPromises = [];
						for (var i = 0; i < googleYahooArray.length; i++) {
							finalStockPromises = finalStockPromises.concat(formatStocks(googleYahooArray[i][0], googleYahooArray[i][1]));
						}
						addToFirebase(finalStockPromises);
					});
				});
			}, timeInterval);
        }
    });

})
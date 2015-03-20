app.controller('TrendsController', ['$scope', '$http', '$q', '$interval', function($scope, $http, $q, $interval) {

// Site domain: localhost
// Consumer key: e3607fbbbc59dabc
// Consumer secret: 082e6fc86fb4e39c40797539613f5f2ceac0ece5
// Request token URL: https://api.stocktwits.com/api/2/oauth/token
// Authorize URL: https://api.stocktwits.com/api/2/oauth/authorize
// DeAuthorization URL: None
// Use link below to get token
// https://api.stocktwits.com/api/2/oauth/authorize?client_id=e3607fbbbc59dabc&response_type=token&redirect_uri=http://localhost:8888/dt/#trends&scope=read,watch_lists,publish_messages,publish_watch_lists,follow_users,follow_stocks

  var tokens = {
    stockTwits: 'f7df9f117b9aaf79bd77d126ac4d443df93a2846'
  }
/*
  // StockTwits Trending Tickers
  var getTrendingStockTwitsTickers = function() {
    return $q(function(resolve, reject) {
      //https://api.stocktwits.com/api/2/trending/symbols.json?access_token=f7df9f117b9aaf79bd77d126ac4d443df93a2846
      var config = {
          url: 'https://api.stocktwits.com/api/2/trending/symbols.json',
          method: 'GET',
          params: {
              access_token: tokens.stockTwits
          }
      };
      $http(config).
        success(function(data, status, headers, config) {
          var symbols = [];
          for (var i = 0; i < data.symbols.length; i++) {
            symbols.push(data.symbols[i].symbol);
          }
          resolve(symbols);
        }).
        error(function(data, status, headers, config) {
          alert('Error', status);
          console.log(data);
        });
    });
  } */


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
    var listOfSentences = abstract.split(".");
    //iterate through each line of sentence
    for(var i = 0; i < listOfSentences.length; i++){
      var listOfWords = listOfSentences[i].split(" ");
      //iterate and evaluate each word in sentence
      for(var j = 0; j < listOfWords.length; j++){
        var currentWord = listOfWords[j];
        //if current word is in the dictionary
         if(onlyWords.indexOf(currentWord) != -1 && currentWord != ""){
            for(var k = 0; k < dictionary.length; k++){
              var wordInDictionary = dictionary[k].word;
              if(currentWord == wordInDictionary){
                scoreObject.testedWords.push(currentWord);
                scoreObject['abstract'] = abstract;
                  switch(dictionary[k].connotation){
                    case "negative":
                      scoreObject.negative++;
                      break;
                    case "positive":
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
    }
    return scoreObject;
  }

  //return a list of article objects with its sentiment scores
  var getNewYorkTimesAnalysis = function(resourceType, section, timePeriod, newYorkTimesKey){
      var deferred = $q.defer();
      var newYorkTimesKey = '37d93fe31d8af6a697b21ba70b290b4a:15:71619308';
      var newYorkTimesUrl = 'http://api.nytimes.com/svc/mostpopular/v2/' + resourceType + "/" + section + "/"  + timePeriod + ".json?api-key=" + newYorkTimesKey;
      console.log(newYorkTimesUrl);
      // Simple GET request example :
      $http.get(newYorkTimesUrl).
        success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          var listOfData = data.results;
          //console.log(listOfData);
          var newYorkAnalysisObject = [];
          for(var i = 0; i < listOfData.length; i++){
              console.log(listOfData[i]);
              newYorkAnalysisObject.push({
                title: listOfData[i].title,
                score: calculateSentimentScore(listOfData[i].abstract, dictionary, onlyWords)
              });
          }  
          console.log(newYorkAnalysisObject);
          deferred.resolve(newYorkAnalysisObject);
        }).
        error(function(data, status, headers, config) {
          alert("failed...");
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });
      return deferred.promise;
  }

  var newYorkPromise = getNewYorkTimesAnalysis("mostemailed", "business", "1");
  newYorkPromise.then(function(newYorkData) {
    alert('Success:');
    console.log(newYorkData);
  }, function(reason) {
    alert('Failed: ' + reason);
  });    


  var getAllSymbols = function() {
    var symbols = [];
    for (var i = 0; i < allSymbols.length; i++) {
      symbols.push(allSymbols[i].Symbol);
    }
    return symbols;
  }


  // Google and Yahoo Finance Stock Mash Up
  var getStocks = function(symbols){

      var googleFinanceUrl = 'http://finance.google.com/finance/info?client=ig&q=' + symbols.join();
      var yahooFinanceUrl = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%27' + symbols.join() + '%27)%0A%09%09&format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env&callback=';

      var urls = [];
      urls.push(googleFinanceUrl);
      urls.push(yahooFinanceUrl);

      var promises = [];

      for (var i = 0; i < urls.length; i++) {
        promises.push($http.get(urls[i]));
      }

      return $q.all(promises);
  }

  var formatStocks = function(data) {
    console.log(data[0]);
    var googleFinanceStocks = JSON.parse(data[0].data.substring(3, data[0].data.length));
    var yahooFinanceStocks = data[1].data.query.results.quote;
    var stocks = [];
    for (var j = 0; j < googleFinanceStocks.length; j++) {
      var stock = {};
      // Google Finance
      stock.symbol = googleFinanceStocks[j].t;
      stock.current = parseFloat(googleFinanceStocks[j].l);
      stock.changePrice = parseFloat(googleFinanceStocks[j].c);
      stock.changePercent = parseFloat(googleFinanceStocks[j].cp);
      stock.lastPurchase = new Date(googleFinanceStocks[j].lt_dts);
      stock.div = parseFloat(googleFinanceStocks[j].div);
      if ($scope.trendingStocks) {
        stock.isTrending = ($scope.trendingStocks.indexOf(googleFinanceStocks[j].t) != -1) ? true:false;
        stock.trendingRank = ($scope.trendingStocks.indexOf(googleFinanceStocks[j].t) != -1) ? $scope.trendingStocks.indexOf(googleFinanceStocks[j].t) + 1: -1;
      }

      // Yahoo Finance
      stock.name = yahooFinanceStocks[j].Name;
      stock.averageDailyVolume = parseFloat(yahooFinanceStocks[j].AverageDailyVolume);
      stock.open = parseFloat(yahooFinanceStocks[j].Open);
      stock.close = parseFloat(yahooFinanceStocks[j].PreviousClose);
      stock.daysHigh = parseFloat(yahooFinanceStocks[j].DaysHigh);
      stock.daysLow = parseFloat(yahooFinanceStocks[j].DaysLow);
      stock.yearHigh = parseFloat(yahooFinanceStocks[j].YearHigh);
      stock.yearLow = parseFloat(yahooFinanceStocks[j].YearLow);
      stock.estimateCurrentYear = parseFloat(yahooFinanceStocks[j].EPSEstimateCurrentYear);
      stock.estimateNextQuarter = parseFloat(yahooFinanceStocks[j].EPSEstimateNextQuarter);
      stock.estimateNextYear = parseFloat(yahooFinanceStocks[j].EPSEstimateNextYear);
      stock.fiftyDayMovingAverage = parseFloat(yahooFinanceStocks[j].FiftydayMovingAverage);

      stocks.push(stock);
    }
    return stocks;
  }

  var getTrendingStocksData = function(symbols) {
      var symbolsPerCall = 116;
      var originalSymbolSize = angular.copy(symbols.length);      
      var iterate = Math.floor(originalSymbolSize / symbolsPerCall);

      var tempStocks = [];
      for (var i = 0; i < iterate; i++) {
        var sendToPromise = symbols.splice(0, symbolsPerCall);
        getStocks(sendToPromise).then(function(data) {
          tempStocks = tempStocks.concat(formatStocks(data));
        });
        console.log('Making Call');
      }
      getStocks(symbols).then(function(data) {
        tempStocks = tempStocks.concat(formatStocks(data));        
        $scope.stocks = tempStocks;
        // console.log('Making Last Call');
        // console.log($scope.stocks[0]);
      });
  }


  /* Get Manual Stocks */
  // $scope.symbols = ['UWTI', 'RTRX', 'FXCM', 'AAPL'];
  $scope.searchSymbols = function() {
    getTrendingStocksData($scope.symbols);
  }

  /* Get Trending Stock Twits Stocks */
  // getTrendingStockTwitsTickers().then(function(trendingStocks) {
  //   $scope.trendingStocks = trendingStocks;
  //   $scope.symbols = trendingStocks;
  //   getTrendingStocksData($scope.symbols);
  // }); 

  /* Get All Stocks */
  // $scope.symbols = getAllSymbols();
  // getTrendingStocksData($scope.symbols);

  /* 15 Second Intervals */
  // $interval(function() {
  //   getTrendingStocksData();
  // }, 15000);

  /* COMMON FUNCTIONS */
  $scope.isPositive = function(stock) {
    return (stock > 0) ? true : false;
  }

}]);



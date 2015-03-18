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


  var getGoogleTrends = function(query){
      
      var googleTrendsUrl = "http://www.google.com/trends/fetchComponent?q=" + query + "&cid=TIMESERIES_GRAPH_0&export=3";
      var object = $http.get(googleTrendsUrl); 
         
      // Simple GET request example :
      $http.get(googleTrendsUrl).
        success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          console.log(data);

        }).
        error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          console.log(data);
        });


  }

  getGoogleTrends("OIL");

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
    var googleFinanceStocks = JSON.parse(data[0].data.substring(3, data[0].data.length));
    var yahooFinanceStocks = data[1].data.query.results.quote;
    var stocks = [];
    for (var j = 0; j < googleFinanceStocks.length; j++) {
      var stock = {
        // Google Finance
        symbol: googleFinanceStocks[j].t,
        current: parseFloat(googleFinanceStocks[j].l),
        changePrice: parseFloat(googleFinanceStocks[j].c),
        changePercent: parseFloat(googleFinanceStocks[j].cp),
        lastPurchase: googleFinanceStocks[j].lt,
        div: parseFloat(googleFinanceStocks[j].div),
       // isTrending: ($scope.trendingStocks.indexOf(googleFinanceStocks[j].t) != -1) ? true:false,
       //trendingRank: ($scope.trendingStocks.indexOf(googleFinanceStocks[j].t) != -1) ? $scope.trendingStocks.indexOf(googleFinanceStocks[j].t) + 1: -1,
        // Yahoo Finance
        name: yahooFinanceStocks[j].Name,
        averageDailyVolume: parseFloat(yahooFinanceStocks[j].AverageDailyVolume),
        open: parseFloat(yahooFinanceStocks[j].Open),
        close: parseFloat(yahooFinanceStocks[j].PreviousClose),
        daysHigh: parseFloat(yahooFinanceStocks[j].DaysHigh),
        daysLow: parseFloat(yahooFinanceStocks[j].DaysLow),
        yearHigh: parseFloat(yahooFinanceStocks[j].YearHigh),
        yearLow: parseFloat(yahooFinanceStocks[j].YearLow),
        estimateCurrentYear: parseFloat(yahooFinanceStocks[j].EPSEstimateCurrentYear),
        estimateNextQuarter: parseFloat(yahooFinanceStocks[j].EPSEstimateNextQuarter),
        estimateNextYear: parseFloat(yahooFinanceStocks[j].EPSEstimateNextYear),
        fiftyDayMovingAverage: parseFloat(yahooFinanceStocks[j].FiftydayMovingAverage)
      }
      stocks.push(stock);
    }
    return stocks;
  }

  var getTrendingStocksData = function() {
      var symbols = getAllSymbols();
      var symbolsPerCall = 116;
      var originalSymbolSize = angular.copy(symbols.length);      
      var iterate = Math.floor(originalSymbolSize / symbolsPerCall);

      var tempStocks = [];
      for (var i = 0; i < iterate; i++) {
        var sendToPromise = symbols.splice(0, symbolsPerCall);
        getStocks(sendToPromise).then(function(data) {
          tempStocks = tempStocks.concat(formatStocks(data));
        });

      }
      getStocks(symbols).then(function(data) {
        tempStocks = tempStocks.concat(formatStocks(data));        
        $scope.stocks = tempStocks;
        // console.log('Making Last Call');
        // console.log($scope.stocks[0]);
      });
  }

  
/*  getTrendingStockTwitsTickers().then(function(trendingStocks) {
    $scope.trendingStocks = trendingStocks;
    getTrendingStocksData();
  });
*/

  //15 second intervals
  // $interval(function() {
  //   getTrendingStocksData();
  // }, 15000);


  /* COMMON FUNCTIONS */
  $scope.isPositive = function(stock) {
    return (stock > 0) ? true : false;
  }

}]);



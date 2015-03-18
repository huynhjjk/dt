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
  }

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
        console.log('Making Last Call');
        console.log($scope.stocks[0]);
      });
  }

  /* Get Manual Stocks */
  $scope.symbols = ['UWTI', 'RTRX', 'FXCM', 'AAPL'];
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



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
      var stock = {
        // Google Finance
        symbol: googleFinanceStocks[j].t,
        current: googleFinanceStocks[j].l,
        changePrice: googleFinanceStocks[j].c,
        changePercent: googleFinanceStocks[j].cp,
        lastPurchase: googleFinanceStocks[j].elt,
        div: googleFinanceStocks[j].div,
        // Yahoo Finance
        name: yahooFinanceStocks[j].Name,
        averageDailyVolume: yahooFinanceStocks[j].AverageDailyVolume,
        open: yahooFinanceStocks[j].Open,
        close: yahooFinanceStocks[j].PreviousClose,
        daysHigh: yahooFinanceStocks[j].DaysHigh,
        daysLow: yahooFinanceStocks[j].DaysLow,
        yearHigh: yahooFinanceStocks[j].YearHigh,
        yearLow: yahooFinanceStocks[j].YearLow,
        estimateCurrentYear: yahooFinanceStocks[j].EPSEstimateCurrentYear,
        estimateNextQuarter: yahooFinanceStocks[j].EPSEstimateNextQuarter,
        estimateNextYear: yahooFinanceStocks[j].EPSEstimateNextYear,
        fiftyDayMovingAverage: yahooFinanceStocks[j].FiftydayMovingAverage
      }
      stocks.push(stock);
    }
    return stocks;
  }


  var getTrendingStocksData = function() {
    // getTrendingStockTwitsTickers.then(function(symbols) {

    // getAllSymbols().then(function(symbols) {
      var symbols = getAllSymbols();
      var symbolsPerCall = 116;
      var originalSymbolSize = angular.copy(symbols.length);      
      var iterate = Math.floor(originalSymbolSize / symbolsPerCall);
      $scope.stocks = [];
      for (var i = 0; i < iterate; i++) {
        var sendToPromise = symbols.splice(0, symbolsPerCall);
        getStocks(sendToPromise).then(function(data) {
          $scope.stocks = $scope.stocks.concat(formatStocks(data));
          console.log('Making Call');
        //console.log($scope.stocks);
        });

      }
      getStocks(symbols).then(function(data) {
        $scope.stocks = $scope.stocks.concat(formatStocks(data));        
        $scope.stocks = $scope.stocks.sort(sortNumber);    
        console.log('Making Last Call');
      });
  }


  // Upon pageload
  getTrendingStocksData();

  // 30 second intervals
 /* $interval(function() {
    getTrendingStocksData();
  }, 30000);*/


  /* COMMON FUNCTIONS */

  function sortNumber(a,b){
   console.log(typeof a.changePercent);
   return parseFloat(b.changePercent) - parseFloat(a.changePercent) ;
  }

  $scope.isPositive = function(stock) {
    var index = stock.indexOf('+');
    return (index != -1) ? true : false;
  }

}]);



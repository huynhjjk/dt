app.controller('TrendsController', ['$scope', '$http', '$q', '$interval', '$firebaseArray', function($scope, $http, $q, $interval, $firebaseArray) {

 $scope.firebaseStocks = $firebaseArray(new Firebase("https://dt-app.firebaseio.com/").child("stocks"));

  /* COMMON FUNCTIONS */
  $scope.isPositive = function(stock) {
    return (stock > 0) ? true : false;
  }

}]);



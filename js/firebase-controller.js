app.controller('FirebaseController', ['$scope', '$http', '$q', '$interval', '$firebaseArray', function($scope, $http, $q, $interval, $firebaseArray) {

 $scope.firebaseNews = $firebaseArray(new Firebase("https://dt-app.firebaseio.com/").child("reuters"));

 $scope.firebaseStocks = $firebaseArray(new Firebase("https://dt-app.firebaseio.com/").child("stocks"));

  /* COMMON FUNCTIONS */
  $scope.isPositive = function(stock) {
    return (stock > 0) ? true : false;
  }

}]);



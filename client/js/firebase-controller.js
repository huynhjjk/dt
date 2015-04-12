app.controller('FirebaseController', ['$scope', '$http', '$q', '$interval', '$firebaseArray', function($scope, $http, $q, $interval, $firebaseArray) {

 $scope.firebaseBusinessTimesNews = $firebaseArray(new Firebase("https://dt-app.firebaseio.com/").child("businessTimes"));

 $scope.firebaseReutersNews = $firebaseArray(new Firebase("https://dt-app.firebaseio.com/").child("reuters"));

 //$scope.firebaseStocks = $firebaseArray(new Firebase("https://dt-app.firebaseio.com/").child("stocks"));

  /* COMMON FUNCTIONS */
  $scope.isPositive = function(stock) {
    return (stock > 0) ? true : false;
  }

 $scope.generate = function(article, index, source){
 	console.log(index);
	var chart = c3.generate({
		bindto: "#article_" + source + "_" + index,
		size: {
			width: 200
		},
	    data: {
	        columns: [
	            ['good', article.sentiments.positive],
	            ['bad', article.sentiments.negative],
	        ],
	        type : 'donut',
	        onclick: function (d, i) { console.log("onclick", d, i); },
	        onmouseover: function (d, i) { console.log("onmouseover", d, i); },
	        onmouseout: function (d, i) { console.log("onmouseout", d, i); }
	    },
	    donut: {
	        title: "Oil"
	    }
	}); 	
 }	  

}]);



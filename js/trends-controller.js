app.controller('TrendsController', ['$scope', '$http', '$q', '$interval', '$firebaseArray', function($scope, $http, $q, $interval, $firebaseArray) {

/*
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
*/

 $scope.firebaseStocks = $firebaseArray(new Firebase("https://dt-app.firebaseio.com/").child("stocks"));

  /* COMMON FUNCTIONS */
  $scope.isPositive = function(stock) {
    return (stock > 0) ? true : false;
  }

}]);



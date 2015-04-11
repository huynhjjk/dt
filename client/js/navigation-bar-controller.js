// app.controller('NavigationBarController', ['$scope', function($scope) {

//     // Always start on Intro page
//     if (window.location.hash != '#trends') { window.location.hash = '#trends' }
//     $scope.hash = window.location.hash;
//     $(window).on('hashchange', function() {
//         $scope.$apply(function() {
//             $scope.hash = window.location.hash;
//         });
//     });

//     $scope.containsHash = function(hash, menuItem) {
//         var index = hash.indexOf(menuItem);
//         return (index != -1) ? true : false;
//     }

// }]);
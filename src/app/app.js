(function() {

  angular
    .module('ngBracket', ['templates'])
    .controller('BracketController', BracketController);

  BracketController.$inject = ['$log', '$scope', 'tournamentGenerator'];
  function BracketController($log, $scope, tournamentGenerator) {

    function startTournament(tournamentData, teams) {
      $scope.bracketData.teams = teams;
      $scope.bracketData.tournament = tournamentData;
      $scope.bracketData.reload();
      $log.info('bracketData', $scope.bracketData);
    }

    // data object for bracket controller
    $scope.bracketData = {
      teams: [],
      tournament: {
        type: "SE",
        matches: []
      },
      options: {
        onTeamRightClick: angular.noop,
        onTeamClick: angular.noop,
        onMatchClick: angular.noop,
        onMatchRightClick: angular.noop
      }
    };

    $scope.tType = 'SE';

    $scope.playersToGenerate = 5;

    $scope.playersToGenerate2 = '';

    $scope.generateWithRandomPlayers = function() {
      function generateTeams(size, startFrom) {
        var t = [];
        startFrom = startFrom ? startFrom : 0;
        for (var i = 1; i <= size; i++) {
          t.push({
            name: 'Team ' + (i + startFrom),
            id: (i + startFrom).toString()
          });
        }

        return t;
      }

      if ($scope.playersToGenerate) {
        $scope.bracketData.teams = [];
        var n = parseInt($scope.playersToGenerate);
        var n2 = parseInt($scope.playersToGenerate2);
        if (n > 3 && (!n2 || n2 > 3)) {
          /**
           * Sinn der for-Schleife noch nicht verstanden, da direkt danach,
           * die Teams eh wieder zurückgesetzt werden. Das herausnehmen dieses Codeblocks
           * hat keine Änderung bewirkt, daher erstmal raus.
           */
          //for (var i = 1; i <= n; i++) {
          //  $scope.bracketData.teams.push();
          //}

          $scope.bracketData.teams = [];
          $scope.bracketData.teams.push(generateTeams(n));

          var t;

          if(n2 > 3){
            $scope.bracketData.teams.push(generateTeams(n2, n));
            t = tournamentGenerator.newTournament($scope.tType, $scope.bracketData.teams, $scope.playBronzeMatch, true);
            t.conferences[0].conferenceName = 'West';
            t.conferences[2].conferenceName = 'East';
          }
          else
          {
            t = tournamentGenerator.newTournament($scope.tType, $scope.bracketData.teams[0], $scope.playBronzeMatch, false);
          }

          startTournament(t, $scope.bracketData.teams);
        }
      }
    };
  }

})();
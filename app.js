var rp = require('request-promise');
var config = require('./config.js')

var loginCreds = {
  user: config.huddleUsername,
  pass: config.huddlePassword,
};
var cookieJar = rp.jar();
var currentWeek = '01';
const defaultAction = 'pickem';

var lineReturnRegEx = /\s/gi;
var predictionsRegEx = /STARTPRINTIT.*<ul.*?>(.*)<\/ul>.*ENDPRINTIT/;

function main() {
  var action = defaultAction;
  if (process.argv[2]) {
    action = process.argv[2].trim();
  }

  switch(action) {
    case 'pickem': {
      if(process.argv[3]){
        currentWeek = process.argv[3];
      }
      getWeeklyGamePredictions(currentWeek);
      break;
    }
    default: {
      if(process.argv[2]){
        currentWeek = process.argv[2];
      }
      getWeeklyGamePredictions(currentWeek);
      break;
    }
  }

}

function getWeeklyGamePredictions(currenWeek) {
  login()
  .then(function(response) {
    console.log('login success');
    getGameSummaryPredictions(currentWeek)
      .then(function(predictionsResponse) {
        predictionsResponse = predictionsResponse.replace(lineReturnRegEx, '');
        var table = predictionsResponse.match(predictionsRegEx);

        scoreObject = iterateThroughLinesInTable(table[1]);
        // console.log(scoreObject);

        displayPickOrderInConsole(scoreObject);
      });
  })
  .catch(function(err) {
    console.log('error in main:', err);
  });
}

function login() {
  var loginRequestOptions = {
    method: 'POST',
    uri: 'http://www.thehuddle.com/login.php',
    formData: {
      user: loginCreds.user,
      pass: loginCreds.pass,
      submit: 'Login'
    },
    jar: cookieJar
  };
  return rp(loginRequestOptions);
}

function getGameSummaryPredictions(week) {
  var getGamePredictionsOptions = {
    method: 'GET',
    uri: 'http://thehuddle.com/2018/season/' + week + '/game-predictions-summary.php',
    jar: cookieJar
  };
  return rp(getGamePredictionsOptions);
}

function iterateThroughLinesInTable(table) {
  var teamScoreObjArray = [];

  var lineRegEx = /<li>(.*?)<\/li>/;
  var nextLine = lineRegEx.exec(table);
  // console.log('nextLine match:', nextLine[1]);
  // console.log('nextLine index:', nextLine.index);
  // console.log('nextLine index:', table.slice(nextLine.index + nextLine[0].length));
  while (nextLine && nextLine[1] && nextLine.index >= 0) {
    teamScoreObjArray.push(extractScoreFromLine(nextLine[1]));
    table = table.slice(nextLine.index + nextLine[0].length);

    nextLine = lineRegEx.exec(table);
  }
  return teamScoreObjArray;
}

function extractScoreFromLine(line) {
  var scoreRegEx = /(<strong><.*?\.php">|strong>)(.*?),(.*?)(<\/strong>.*?|\(Line.*?)</;
  scoreMatch = scoreRegEx.exec(line);
  // console.log('extract score from line input:', line);
  // console.log('first match:', scoreMatch[1]);
  // console.log('Away Team:', scoreMatch[2], ' Home Team:', scoreMatch[3]);

  // console.log(convertScoreToObj(scoreMatch[2], scoreMatch[3]));
  return convertScoreToObj(scoreMatch[2], scoreMatch[3]);
}

function convertScoreToObj(awayScore, homeScore) {
  var teamAndScoreRegex = /(^\D*)(\d*$)/;
  var awayMatch = teamAndScoreRegex.exec(awayScore);
  var homeMatch = teamAndScoreRegex.exec(homeScore);

  var matchObj = {
    "home": {
      "team": homeMatch[1],
      "score": parseInt(homeMatch[2])
    },
    "away": {
      "team": awayMatch[1],
      "score": parseInt(awayMatch[2])
    }
  };
  var comparisonFieldValue = buildComparison(matchObj);
  matchObj['comparison'] = comparisonFieldValue;
  return matchObj;
}

function buildComparison(matchObj) {
  var winningTeam = null;
  if (matchObj.home.score === matchObj.away.score) {
    console.log('tie detected');
    winningTeam = 'TIE';
  } else {
    winningTeam = matchObj.home.score > matchObj.away.score ? matchObj.home.team : matchObj.away.team;
  }
  var scoreDiff = Math.abs(matchObj.home.score - matchObj.away.score);
  return {
    'winningTeam': winningTeam,
    'scoreDiff': scoreDiff
  };
}

function displayPickOrderInConsole(scoreObject) {
  scoreObject.sort(function(a, b) {
    return b.comparison.scoreDiff - a.comparison.scoreDiff;
  });

  scoreObject.forEach(function(value) {
    console.log('Matchup:', value.away.team, '@', value.home.team, '-', value.comparison.winningTeam, 'wins by', value.comparison.scoreDiff);
  });
}

main();
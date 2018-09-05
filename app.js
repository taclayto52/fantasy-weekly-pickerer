var rp = require('request-promise');

var loginCreds = {
    user: 'mcharri7',
    pass: 'Darthvader123',
};
var cookieJar = rp.jar();

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
var currentWeek = '01';

var getGamePredictionsOptions = {
    method: 'GET',
    uri: 'http://thehuddle.com/2018/season/' + currentWeek + '/game-predictions-summary.php',
    jar: cookieJar
};

// var lineReturnRegEx = /[\n\r\f]/gi;
var lineReturnRegEx = /\s/gi;
var predictionsRegEx = /STARTPRINTIT.*<ul.*?>(.*)<\/ul>.*ENDPRINTIT/;

function main(){
    rp(loginRequestOptions)
        .then(function (response){
            console.log('login success');
            rp(getGamePredictionsOptions)
                .then(function (predictionsResponse){
                    predictionsResponse = predictionsResponse.replace(lineReturnRegEx, '');
                    // console.log('no LRs:', predictionsResponse);
                    var match = predictionsResponse.match(predictionsRegEx);
                    console.log('match:', match[1]);
                });
        })
        .catch(function (err){
            console.log('error in main');
        });
}

main();
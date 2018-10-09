const {Builder, Browser, By, Key, until, Options} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('./config.js');
const xpathStrings = require('./xpathStrings.js');

function getChromeBuilder(){
    var chromeBuilder = new Builder().forBrowser(Browser.CHROME);
    // chromeBuilder.getCapabilities().set('pageLoadStrategy', 'none');
    var chromeOptions = new chrome.Options().addArguments('--start-maximized');
    chromeBuilder.setChromeOptions(chromeOptions);
    return chromeBuilder;
}

async function _findTextUsingSelector(webElement, selector, textToFind) {
    try{
        var linkText = await webElement.findElement(By.xpath(selector)).getText();
        return (linkText === textToFind);
    } catch(e){
        console.log(e);
    }
}

async function fantasyLogin(driver) {
    await driver.get(config.nflFantasyUrl);
    await driver.wait(until.elementLocated(By.xpath(xpathStrings.nflFantasyLogin.loginButton)), 5000);
    // await driver.sleep(1000);
    await driver.findElement(By.xpath(xpathStrings.nflFantasyLogin.loginButton)).click();
    await driver.findElement(By.xpath(xpathStrings.nflFantasyLogin.userNameInput)).sendKeys(config.nflFantasyUsername);
    await driver.findElement(By.xpath(xpathStrings.nflFantasyLogin.userPasswordInput)).sendKeys(config.nflFantasyPassword).then(function(){
        driver.findElement(By.xpath(xpathStrings.nflFantasyLogin.userPasswordInput)).submit();
    });
    await driver.wait(until.elementLocated(By.xpath(xpathStrings.nflFantasyLeague.myLeagueButton)), 5000);
}

async function navToMyTeam(driver) {
    await driver.findElement(By.xpath(xpathStrings.nflFantasyLeague.myLeagueButton)).click();
    var navWebElements = await driver.findElement(By.xpath(xpathStrings.nflFantasyLeague.myLeagueNavigation)).findElements(By.className('nav-item'));

    var myTeamElement;
    for(var i=0; i<navWebElements.length; i++) {
        if(await _findTextUsingSelector(navWebElements[i], './a', 'My Team')){
            myTeamElement = navWebElements[i];
            break;
        }
    }

    await myTeamElement.click();
}

async function navToProjections(driver) {
    var statCategoryNavWebElements = await driver.findElement(By.className('statCategoryNav')).findElements(By.xpath('./ul/li/a/span/span[2]'));
    var projectionsNavElement;
    for(var i=0; i<statCategoryNavWebElements.length; i++) {
        if(await _findTextUsingSelector(statCategoryNavWebElements[i], '.', 'PROJECTIONS')){
            projectionsNavElement = statCategoryNavWebElements[i];
            break;
        }
    }

    await projectionsNavElement.click();
}

async function scrollElementIntoView(driver, element){
    await driver.executeScript("arguments[0].scrollIntoView(true);", element);
    await driver.sleep(250); 
}

async function getAllPlayersOnTeam(driver) {
    var teamTableElements = await driver.findElements(By.className('tableType-player'));
    for(var i=0; i<teamTableElements.length; i++){
        var allPlayerRows = await teamTableElements[i].findElements(By.xpath('./tbody/tr'));
        for(var j=0; j<allPlayerRows.length; j++) {
            // TODO don't work on some rows based on class. Ignore containing 'insertedplayer'
            console.log('class:', await allPlayerRows[j].getAttribute('class'));
            await _extractAllPlayerDataFromRow(allPlayerRows[j]);
        }
    }

    async function _extractAllPlayerDataFromRow(playerRow) {
        var playerCells = await playerRow.findElements(By.xpath('./td'));
        for(var i=0; i<playerCells.length; i++) {
            var currentPlayerCell = playerCells[i];
            await scrollElementIntoView(driver, currentPlayerCell);
            switch (i) {
                // POSITION
                case 0: 
                    var playerPosition = await currentPlayerCell.findElement(By.xpath('./span')).getText();
                    console.log('playerPosition:', playerPosition);
                    break;
                // PLAYER INFO
                case 3:
                    var allPlayerInfo = await currentPlayerCell.findElements(By.xpath('./div/a'));
                    for(var j=0; j<allPlayerInfo.length; j++){
                        switch(j) {
                            // PLAYER NAME
                            case 0: 
                                var playerName = await allPlayerInfo[j].getText();
                                console.log('playerName:', playerName);
                                break;
                        }
                    }
                    break;
            }
        }
    }
}

(async function example() {
    var chromeBuilder = getChromeBuilder();

    let driver = await chromeBuilder.build();
    try{
        await fantasyLogin(driver);
        await navToMyTeam(driver);
        await navToProjections(driver);
        await driver.sleep(1000);
        await getAllPlayersOnTeam(driver);
    } catch(e){ 
        console.log('error!!!', e);
    } finally {
        await driver.quit();
    }
})();
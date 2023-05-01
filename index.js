const chalk = require("chalk");
const fs = require("fs");
const gradient = require("gradient-string");
const readline = require("readline-sync");

const config = require("./config.json");
const proxyChecker = require("./helpers/proxyChecker");
const helpers = require("./helpers");

var userId;
var username;
var token;

var proxyPool;
var currentIndex = 0;
var totalIndex = 0;
var currentProxy;

var totalRatelimits = 0;
var totalBuys = 0;
var totalProxySwitchs = 0;
var errorDisplayed = "";
var currentTask = "";
var currentChecks = 0;

var infoInterval = "";

var asciiArt = `\n\n
                             ██████╗ █████╗ ███████╗███████╗███████╗██╗███╗   ██╗███████╗
                            ██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝██║████╗  ██║██╔════╝
                            ██║     ███████║█████╗  █████╗  █████╗  ██║██╔██╗ ██║█████╗  
                            ██║     ██╔══██║██╔══╝  ██╔══╝  ██╔══╝  ██║██║╚██╗██║██╔══╝  
                            ╚██████╗██║  ██║██║     ██║     ███████╗██║██║ ╚████║███████╗
                             ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
                                          > A Roblox UGC Limited Sniper. <
          
`;

function startInterval() {
    infoInterval = setInterval(()=>{
        console.clear();
        console.log(gradient("#99754f","#c8b6a3")(asciiArt));
        console.log(chalk.hex("c8b6a3")("  -------"));
        console.log(chalk.hex("99754f")("  Program  :  ") + chalk.hex("c8b6a3")("MasterGamers#8449"));
        console.log(chalk.hex("99754f")("  Theme    :  ") + chalk.hex("c8b6a3")("doot#0002"));
        console.log(chalk.hex("c8b6a3")("  -------"));
        console.log(chalk.hex("99754f")("  Status  :  ") + chalk.hex("c8b6a3")(currentStatus));
        console.log(chalk.hex("99754f")("  Checks  :  ") + chalk.hex("c8b6a3")(currentChecks));
        console.log(chalk.hex("99754f")("  Buys    :  ") + chalk.hex("c8b6a3")(totalBuys));
        console.log(chalk.hex("99754f")("  Limits  :  ") + chalk.hex("c8b6a3")(totalRatelimits));
        if (config.proxyEnabled) {
            console.log(chalk.hex("c8b6a3")("  -------"));
            console.log(chalk.hex("99754f")("  Switched Proxies    :  ") + chalk.hex("c8b6a3")(totalProxySwitchs));
            console.log(chalk.hex("99754f")("  Current Proxy    :  ") + chalk.hex("c8b6a3")(currentProxy));
            console.log(chalk.hex("c8b6a3")("  -------"));
        }
        console.log(chalk.hex("99754f")("  Task    :  ") + chalk.hex("c8b6a3")(currentTask));
        console.log(chalk.hex("99754f")("  ERROR   :  ") + chalk.hex("cc0000")(errorDisplayed));
        console.log(chalk.hex("c8b6a3")("  -------"));
        sleep(0);
    }, 350);
}

function switchProxy() {
    if (currentIndex == totalIndex) {
        currentIndex = 0;
    } else {
        currentIndex += 1;
    }
    var proxy = proxyPool[currentIndex];
    if (!proxy) {
        proxy = proxyPool[0];
    }
    currentProxy = proxy;
    totalProxySwitchs += 1;
}

function sleep(time) {
    if (!time) return;
    const finalTime = Date.now() + time;
    while (Date.now() < finalTime);
}

(async()=>{
    process.title = "-Roblox Limited Sniper- / Created by *MasterGamers*";
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log("Roblox Item Sniper V2\nCreated by MasterGamers.");
    if (!config.cookie) {
        console.log("There isnt a cookie inside the config, cannot proceed.");
        return;
    }
    if (config.proxyEnabled) {
        switch(true) {
            case !fs.existsSync("proxies.txt"):
                console.log("There isnt proxies.txt file.");
                process.exit();
            case !config.proxyType:
                console.log("No proxy type defined, cannot proceed.");
                process.exit();
            case !fs.readFileSync("proxies.txt", "utf-8").trim():
                console.log("There isnt any proxy inside the proxy list.");
                process.exit();
            default:
                break;
        }
        const checkProxy = readline.question("Do you want to check proxies? (Yes/No): ");
        switch (checkProxy.toLocaleLowerCase()) {
            case "yes":
                await proxyChecker.checkProxies();
                break;
            case "no":
                break;
        }
        const proxies = fs.readFileSync("proxies.txt", "utf-8").split("\r\n");
        proxyPool = proxies;
        currentProxy = proxyPool[currentIndex];
        totalIndex = proxyPool.length;
        console.log(proxyPool);
        console.log(currentProxy);
        console.log({totalIndex});
    }
    startInterval();
    currentStatus = "Logging in...";
    //we handle cookie invalid error
    try {
        const userInfo = await helpers.fetchUserInfo(config.cookie)
        userId = userInfo[0];
        username = userInfo[1];
    } catch(err) {
        errorDisplayed = "Invalid cookie, put a valid cookie and restart.";
        currentStatus = "";
        return;
    }
    currentStatus = `Logged in as ${username} || ID: ${userId}.`;
    const itemId = config.itemId;
    if (!itemId) {
        errorDisplayed = "There isnt a itemId to snipe, cannot proceed.";
        return;
    }
    currentTask = "Getting X-CSRF-TOKEN...";
    await getToken();
    async function getToken() {
        try {
            const xToken = await helpers.getXCSRFToken(config.cookie, config.proxyEnabled ? currentProxy : "")
            token = xToken;
            if (typeof token == "undefined") {
              throw new Error("undefined");
            }  
        } catch(err) {
            if (config.proxyEnabled) {
                switchProxy();
                await getToken();
            }
        }
    }
    var productId;
    currentTask = "Sniping item...";
    var sleepTime = 0;
    var gotProxyToken = false;
    if (config.proxyEnabled) {
        sleepTime = 50;
    } else {
        sleepTime = 326;
    }
    while (true) {
        try {
            if (config.proxyEnabled && !gotProxyToken) {
                try {
                    const proxyToken = await helpers.getXCSRFToken(config.cookie, currentProxy)
                    token = proxyToken;
                    if (typeof token == "undefined") {
                      throw new Error("undefined");
                    }  
                    gotProxyToken = true;
                } catch (err) {
                    errorDisplayed = "PROXY ERROR, SWITCHING PROXY...";
                    switchProxy();
                }
            }
            var itemDetails = await helpers.getItemDetails(config.cookie, token, itemId, config.proxyEnabled ? currentProxy : "");
            currentChecks += 1;
            if (itemDetails[0].collectibleItemId || itemDetails[0].productId) {
                currentTask = "Attempting purchase...";
                if (itemDetails[0].productId) {
                    productId = itemDetails[0].productId;
                } else {
                    productId = await helpers.getProductId(config.cookie, token, itemDetails[0].collectibleItemId, config.proxyEnabled ? currentProxy : "");
                }
                break;
            }
            sleep(sleepTime);
            errorDisplayed = "";
        } catch(err) {
            if (err.statusCode = 429) {
                totalRatelimits += 1;
                if (config.proxyEnabled) {
                    gotProxyToken = false;
                    switchProxy();
                }
                sleep(sleepTime);
            }
            if (err.statusCode == 403 && err.error.message == "Token Verification Failed") {
                errorDisplayed = "TOKEN EXPIRED, GETTING NEW TOKEN...";
                helpers.getXCSRFToken(config.cookie, config.proxyEnabled ? currentProxy : "").then((newToken)=>{
                    token = newToken;
                    errorDisplayed = "";
                })
                .catch((err)=>{
                    errorDisplayed = "ERROR HAPPENED WHILE FETCHING NEW TOKEN.";
                    clearInterval(infoInterval);
                    console.log(err);
                    process.exit();
                })
            }
            if (config.proxyEnabled) {
                switchProxy();
            }
        }
    }
    while (productId) {
        try {
            if (config.proxyEnabled && !gotProxyToken) {
                try {
                    const proxyToken = await helpers.getXCSRFToken(config.cookie, currentProxy)
                    token = proxyToken;
                    if (typeof token == "undefined") {
                      throw new Error("undefined");
                    }
                    gotProxyToken = true;
                } catch (err) {
                    errorDisplayed = "PROXY ERROR, SWITCHING PROXY...";
                    gotProxyToken = false;
                    switchProxy();
                }
            }
            const buyResponse = await helpers.buyItem(config.cookie, token, userId, itemDetails[0].creatorTargetId, itemDetails[0].collectibleItemId, productId, config.proxyEnabled ? currentProxy : "");
            if (buyResponse.purchased) {
                totalBuys += 1;
            }
            if (buyResponse.purchaseResult == "Flooded") {
                errorDisplayed = "BOUGHT THE MAX AMOUNT. (4)";
            }
            if (buyResponse.errorMessage == "QuantityExhausted") {
                errorDisplayed = "ITEM IS OUT OF STOCK";
                currentStatus = "SNIPING FINISHED.";
                break;
            }
        } catch(err) {
            if (err.statusCode == 429) {
                totalRatelimits += 1;
                if (config.proxyEnabled) {
                    gotProxyToken = false;
                    switchProxy();
                }
                return;
            }
            if (err.statusCode == 403) {
                errorDisplayed = "PURCHASE FAILED.";
                return;
            }
            if (config.proxyEnabled) {
                gotProxyToken = false;
                switchProxy();
            }
        }
    }
})();

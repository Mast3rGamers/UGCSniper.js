const fs = require("fs");
const path = require("path");
const ProxyAgent = require("proxy-agent");
const request = require("request-promise");

const proxyList = fs.readFileSync(path.join(__dirname, "..", "/proxies.txt"), "utf8").split("\r\n");

var proxies;

function doRequest(proxy) {
    request({
        uri: "http://example.com",
        method: "GET",
        timeout: 360,
        agent: new ProxyAgent(`${config.proxyType}://${proxy}`)
    })
    .then((res)=>{
        if (res.includes("<h1>Example Domain</h1>")) {
            fs.appendFileSync(path.join(__dirname, "..", "/proxies.txt"), `${proxy}\r\n`);
            console.log(`[WORKING] ${proxy}`);
            return;
        }
        console.log(`[DEAD] ${proxy}`)
        return;
    })
    .catch((err)=>{
        console.log(`[DEAD] ${proxy}`);
        return;
    })
}

module.exports = {
    checkProxies: function() {
        return new Promise((resolve, reject)=>{
            console.log("Checking proxies...");
            proxies = proxyList;
            fs.truncate(path.join(__dirname, "..", "/proxies.txt"), 0, ()=>{
                console.log("DELETED CONTENTS IN FILE");
                var currentIndex = 0;
                const totalIndex = proxies.length;
                const proxyCheckInterval = setInterval(()=>{
                    doRequest(proxies[currentIndex]);
                    if (currentIndex == totalIndex) {
                        clearInterval(proxyCheckInterval);
                        resolve(true);
                        process.exit();
                    }
                    currentIndex += 1;
                })
            })
        })
    }
}

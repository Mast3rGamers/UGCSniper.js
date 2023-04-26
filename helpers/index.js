const request = require("request-promise");
const uuid = require("uuid");
const proxyAgent = require("proxy-agent");

module.exports = {
    //User details helpers.
    fetchUserInfo: function(cookie) {
        if (!cookie) return;
        var options = {
            uri: "https://www.roblox.com/mobileapi/userinfo",
            method: "GET",
            json: true,
            followRedirect: false,
            headers: {
                "Cookie": `.ROBLOSECURITY=${cookie}`
            }
        }
        return new Promise((resolve, reject)=>{
            request(options)
            .then((res)=>{
                resolve([res["UserID"], res["UserName"]]);
            })
            .catch((err)=>{
                reject(err);
            })
        })
    },
    getXCSRFToken: function(cookie, proxy) {
        if (!cookie) return;
        var agentOptions = "";
        var options = {
            uri: "https://auth.roblox.com/v2/logout",
            method: "POST",
            agent: "",
            timeout: 200,
            headers: {
                "Referer": "https://www.roblox.com",
                "Cookie": `.ROBLOSECURITY=${cookie}`
            },
            resolveWithFullResponse: true
        }
        if (proxy) {
            agentOptions = `http://${proxy}`;
            options.agent = new proxyAgent(agentOptions);
        }
        return new Promise((resolve, reject)=>{
            request(options)
            .catch((err)=>{
                try {
                    console.log(err.response.headers["x-csrf-token"]);
                    resolve(err.response.headers["x-csrf-token"]);
                } catch(err) {
                    reject(err);
                }
            })
        })
    },
    //Item data helpers.
    getItemDetails: function(cookie, xToken, assetId, proxy) {
        if (!cookie || !xToken || !assetId) return;
        var agentOptions = "";
        var options = {
            uri: "https://catalog.roblox.com/v1/catalog/items/details",
            method: "POST",
            json: true,
            agent: "",
            timeout: 200,
            headers: {
                "x-csrf-token": xToken,
                "Cookie": `.ROBLOSECURITY=${cookie}`
            },
            body: {
                "items": [
                    {
                        "itemType": "Asset",
                        "id": parseInt(assetId)
                    }
                ]
            }
        }
        if (proxy) {
            agentOptions = `http://${proxy}`;
            options.agent = new proxyAgent(agentOptions);
        }
        return new Promise((resolve, reject)=>{
            request(options)
            .then((res)=>{
                resolve(res.data);
            })
            .catch((err)=>{
                reject(err);
            })
        })
    },
    getProductId: function(cookie, xToken, collectibleItemId, proxy) {
        if (!cookie || !xToken || !collectibleItemId) return;
        var agentOptions = "";
        var options;
        options = {
            uri: "https://apis.roblox.com/marketplace-items/v1/items/details",
            method: "POST",
            json: true,
            agent: "",
            timeout: 650,
            headers: {
                "x-csrf-token": xToken,
                "Cookie": `.ROBLOSECURITY=${cookie}`
            },
            body: {
                "itemIds": [collectibleItemId]
            }
        }
        if (proxy) {
            agentOptions = `http://${proxy}`;
            options.agent = new proxyAgent(agentOptions);
        }
        return new Promise((resolve, reject)=>{
            request(options)
            .then((res)=>{
                resolve(res[0].collectibleProductId);
            })
            .catch((err)=>{
                reject(err);
            })
        })
    },
    //Purchase helper.
    buyItem: function(cookie, xToken, userId, creatorId, itemId, productId, proxy) {
        if (!cookie || !xToken || !userId || !creatorId || !itemId || !productId) return;
        var agentOptions = "";
        var options;
        var data = {
            "collectibleItemId": itemId,
            "expectedCurrency": 1,
            "expectedPrice": 0,
            "expectedPurchaserId": userId,
            "expectedPurchaserType": "User",
            "expectedSellerId": creatorId,
            "expectedSellerType": "User",
            "idempotencyKey": uuid.v4(),
            "collectibleProductId": productId
        }
        options = {
            uri: `https://apis.roblox.com/marketplace-sales/v1/item/${itemId}/purchase-item`,
            method: "POST",
            json: true,
            agent: "",
            headers: {
                "x-csrf-token": xToken,
                "Cookie": `.ROBLOSECURITY=${cookie}`
            },
            body: data
        }
        if (proxy) {
            agentOptions = `http://${proxy}`;
            options.agent = new proxyAgent(agentOptions);
        }
        return new Promise((resolve, reject)=>{
            request(options)
            .then((res)=>{
                resolve(res);
            })
            .catch((err)=>{
                reject(err);
            })
        })
    }
}

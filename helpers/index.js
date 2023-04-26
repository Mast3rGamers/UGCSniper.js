const request = require("request-promise");
const uuid = require("uuid");

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
        var options = {
            uri: "https://auth.roblox.com/v2/logout",
            method: "POST",
            proxy: "",
            timeout: 200,
            headers: {
                "Referer": "https://www.roblox.com",
                "Cookie": `.ROBLOSECURITY=${cookie}`
            },
            resolveWithFullResponse: true
        }
        if (proxy) {
            options.proxy = `http://${proxy}`;
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
        var options = {
            uri: "https://catalog.roblox.com/v1/catalog/items/details",
            method: "POST",
            json: true,
            proxy: "",
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
            options.proxy = `http://${proxy}`;
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
        var options;
        options = {
            uri: "https://apis.roblox.com/marketplace-items/v1/items/details",
            method: "POST",
            json: true,
            proxy: "",
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
            options.proxy = `http://${proxy}`;
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
            proxy: "",
            headers: {
                "x-csrf-token": xToken,
                "Cookie": `.ROBLOSECURITY=${cookie}`
            },
            body: data
        }
        if (proxy) {
            options.proxy = `http://${proxy}`;
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
    },
    buyItemFromEconomy: function(cookie, xToken, productId, creatorId, proxy) {
        if (!cookie || !xToken || !productId || !creatorId) return;
        var options = {
            uri: `https://economy.roblox.com/v1/purchases/products/${productId}`,
            method: "POST",
            json: true,
            proxy: "",
            headers: {
                "x-csrf-token": xToken,
                "Cookie": `.ROBLOSECURITY=${cookie}`
                },
                body: {
                "expectedCurrency":1,
                "expectedPrice":0,
                "expectedSellerId":creatorId
            }
        }
        if (proxy) {
            options.proxy = `http://${proxy}`;
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

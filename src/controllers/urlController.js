const urlModel = require('../models/urlModel')
const isValidUrl = require("url-validation")
const shortId = require('short-unique-id')
const redis = require("redis")
const { promisify } = require("util")


// Connecting to redis -----------------------------------------------------------
const redisClient = redis.createClient(
    18708,
    "redis-18708.c264.ap-south-1-1.ec2.cloud.redislabs.com", { no_ready_check: true }
);
redisClient.auth("c4wumzAqu1aqeSjGmtoGJ65S3kUkwtdT", function(err) {
    if (err) throw err;
});

redisClient.on("connect", async function() {
    console.log("Connected to Redis..Let's GO");
});


//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
// ----------------------------------------------------------------------------------

const isValid = function(value) {
    if (value == "undefined" || value == null) return false
    if (value == "string" && value.trim().length == 0) return false
    return true;
}

const isValidRequestBody = function(value) {
    return Object.keys(value).length > 0
}

//API 1 - create short URL=====================================================================================
let urlShortener = async function(req, res) {
    try {
        const requestBody = req.body
        console.log(requestBody)
            // Validations starts
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters, please provide URL" })
        }

        if (!isValid(requestBody.longUrl)) {
            return res.status(400).send({ status: false, Message: "Please provide a vaild url" })
        }

        const longUrl = String.prototype.trim.call(requestBody.longUrl)

        if (!isValidUrl(longUrl)) {
            return res.status(400).send({ status: false, Message: "URL is not valid, please provide a valid url" })
        }
        //validation ends


        let cachedUrlData = await GET_ASYNC(`${longUrl}`)
        if (cachedUrlData) {
            let urlDetails = JSON.parse(cachedUrlData)
            return res.status(200).send({ status: true, data: urlDetails })
        }

        let shortUrlAlready = await urlModel.findOne({ longUrl })

        if (shortUrlAlready) {
            const { longUrl, shortUrl, urlCode } = shortUrlAlready
            const urlDetails = { longUrl, shortUrl, urlCode }
            return res.status(200).send({ status: true, data: urlDetails })
        } else {
            const uid = new shortId({ length: 5 })
            uid.setDictionary('alpha_lower')
            const urlCode = uid();
            const shortUrl = `http: //localhost:3000/${urlCode}`
            const urlDetails = { longUrl, shortUrl, urlCode }
            const newUrl = await urlModel.create(urlDetails)
            const responseBody = { longUrl: newUrl.longUrl, shortUrl, urlCode }
            await SET_ASYNC(`${longUrl}`, JSON.stringify(responseBody))
            return res.status(200).send({ status: true, Message: "Short url created successfully", data: responseBody })
        }
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

//API 2 - Get URL=======================================================================
const getUrl = async function(req, res) {
    try {
        const urlCode = req.params.urlCode
        let cachedUrlData = await GET_ASYNC(`${urlCode}`)
        if (cachedUrlData) {
            const longUrl = JSON.parse(cachedUrlData)
            return res.status(303).redirect(longUrl)
        }
        const urlDetails = await urlModel.findOne({ urlCode: urlCode })
        if (urlDetails) {
            let longUrl = urlDetails.longUrl
            await SET_ASYNC(`${urlCode}`, JSON.stringify(longUrl))
            return res.status(303).redirect(longUrl)
        } else {
            return res.status(404).send({ status: false, msg: "404 Page Not Found" })
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




module.exports = { urlShortener, getUrl }
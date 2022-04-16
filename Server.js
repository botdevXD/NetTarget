const StartTime = new Date();

const AppVersion = "1.0.0"; // this is the version which will identify each server and make sure they're up to date!
let CurrentVersion = AppVersion; // Current version of the application, the master server sends this to all servers!
let NewAppCode = ""; // This'll be updated when the server sends out a new app version request!

const NetLib = require("net");
const requestIp = require('request-ip');
const { TextEncoder, TextDecoder } = require("util"); // Util module for fixing stupid problems such as TextEncoder is undefined
const fs = require("fs"); // File module, used for creating and reading data aka files
const tunnel = require('tunnel'); // Used for tunneling our http requests through proxies :))
const Mongoose = require("mongoose"); // This is for our database / MongoDB
const DBModel = require("./Dependencies/DBModels/DB"); // Our database model so we can go through the database
const axios = require("axios"); // For http / https requests n so on
const ClientWebSocket = require("websocket").client; // This is for connecting to non server sockets and letting us listen for input from all servers and the operator!
const expressJS = require("express"); // For starting the server so we can connect web sockets etc
const ExpressWS = require("express-ws"); // Express web sockets
const ExpressApp = expressJS(); // Our express app
const ExpressRatelimit = require("express-rate-limit"); // Used for rate limiting and slowing down requests on endpoints, this is to help with spam abuse etc
const ExpressWebSocket = ExpressWS(ExpressApp); // Our express websocket which contains a set of functions for collecting all connected clients etc!
const WebSocketInstance = ExpressWebSocket.getWss("/server_socket"); // Get the cached data of our worker web socket!
const Functions = require("./Dependencies/Container/App/Functions");
const BootHandler = require("./Dependencies/Container/Boot/BootHandler");
const RateLimiterCustom = require("./Dependencies/Container/App/Ratelimit");
const PageData = require("./Dependencies/Container/App/PageData");
const AppPort = process.env.PORT || 222; // Current web server port
let Pages = PageData.Pages

ExpressApp.use(requestIp.mw()); // Add request IPs into the server so we can do for example: request.clientIP
ExpressApp.use(expressJS.json()); // Add auto convert for json structures
ExpressApp.use(expressJS.static(__dirname + '/Dependencies/Web/WebPages'));

const RateTest = new RateLimiterCustom({
    message: undefined,
    max_requests: 5,
    reset_time: 10000,
    endpoints: Pages
}).function

/*const API_RATE_LIMIT = ExpressRatelimit({
	windowMs: 1000 * 10, // 10 seconds
	max: 10,
    handler: async (Request, Response) => {
        Response.status(429);

        return Response.json({
            success: false,
            error: "You're currently being rate-limited!"
        })
    },
	standardHeaders: true,
    endpoint_data: Pages
})*/

ExpressApp.use(RateTest, (Request, Response) => {
    let PageData = (typeof Pages[Request.url] != "undefined") ? Pages[Request.url] : undefined; // Search for page, if found then return else return undefined
    let Page = (typeof PageData != "undefined") ? `${__dirname}/Dependencies/Web/WebPages/${PageData.page_file}` : undefined; // Search for page, if found then return else return undefined

    switch (Request.url.toString()){
        case (typeof PageData != "undefined") ? "/" : undefined: // Main Page
            Functions.Execute(PageData.methods[Request.method] == true, [Functions.BadMethod, Response, Request.method], [Functions.RenderPage, Page, Response])
            break;
        case (typeof PageData != "undefined") ? "/api/attack" : undefined: // Attack API
            Functions.Execute(PageData.methods[Request.method] == true, [Functions.BadMethod, Response, Request.method], [function(){
                return BootHandler.HandleRequest(Request, Response)
            }])
            break;
        default: // 404 page
            Page = `${__dirname}/Dependencies/Web/WebPages/404.html`

            Functions.RenderPage(Page, Response);
            break;
    }
})

//localhost:8000

ExpressApp.listen(AppPort, () => {
    console.log(`Web server listening on port: ${AppPort}`)
})

console.log(`Application took ${Functions.ConvertTimeToSeconds(StartTime)} seconds to run!`)
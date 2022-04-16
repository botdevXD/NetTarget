class RateLimiter{
    constructor(Options){
        const RequestHandler = this.RequestHandler;

        Options = {
            url_data: {},
            max_requests: (typeof Options.max_requests == "number") ? Options.max_requests : 100,
            reset_time: (typeof Options.reset_time == "number") ? Options.reset_time : 60000,
            message: (typeof Options.message != "undefined" & Options.message != null) ? Options.message : "You've been rate limited!",
            endpoints: (typeof Options.endpoints == "object") ? Options.endpoints : {}
        };

        setInterval(() => {
            for (const [URL_INDEX, END_POINT_DATA] of Object.entries(Options.url_data)) {
                if (typeof END_POINT_DATA == "object"){
                    for (const [CLIENT_IP, CLIENT_DATA] of Object.entries(END_POINT_DATA)) {
                        Options.url_data[URL_INDEX][CLIENT_IP].requests = 0
                    }
                }
            }
        }, Options.reset_time);

        return {
            function: function(Request, Response, Next){
                return RequestHandler(Options, Request, Response, Next);
            }
        };
    };

    RequestHandler = function(Options, Request, Response, Next){
        if (Options){
            if (((typeof Options.endpoints[Request.url] != "undefined") ?  (typeof Options.endpoints[Request.url].rate_limit != "undefined" ? Options.endpoints[Request.url].rate_limit : false) : false) == true){
                Options.url_data[Request.url] = (typeof Options.url_data[Request.url] != "undefined") ? Options.url_data[Request.url] : {}
                Options.url_data[Request.url][Request.clientIp] = (typeof Options.url_data[Request.url][Request.clientIp] != "undefined") ? Options.url_data[Request.url][Request.clientIp] : {
                    requests: 0
                }

                if (Options.url_data[Request.url][Request.clientIp].requests >= Options.max_requests){
                    Response.status(429);
                    Response.setHeader("RateLimit-Limit", Options.max_requests);
                    Response.setHeader("RateLimit-Remaining", Math.max(Options.max_requests - Options.TotalRequests, 0));
                    return Response.send(Options.message.toString());
                }else{
                    Options.url_data[Request.url][Request.clientIp].requests += 1
                }
            };
        };

        return Next();
    };
};

module.exports = RateLimiter;
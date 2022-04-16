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

        return {
            function: function(Request, Response, Next){
                return RequestHandler(Options, Request, Response, Next);
            }
        };
    };

    RequestHandler = function(Options, Request, Response, Next){
        if (Options){
            if (((typeof Options.endpoints[Request.url] != "undefined") ?  (typeof Options.endpoints[Request.url].rate_limit != "undefined" ? Options.endpoints[Request.url].rate_limit : false) : false) == true){
                console.log(Options)

                Response.status(429);
                Response.setHeader("RateLimit-Limit", Options.max_requests);
                Response.setHeader("RateLimit-Remaining", Math.max(Options.max_requests - Options.TotalRequests, 0));
                
                return Response.send(Options.message.toString());
            };
        };

        return Next();
    };
};

module.exports = RateLimiter;
class RateLimiter{
    constructor(Options){
        const RequestHandler = this.RequestHandler

        Options = {
            endpoints: (typeof Options.endpoints == "object") ? Options.endpoints : {}
        }

        return {
            function: function(Request, Response, Next){
                return RequestHandler(Options, Request, Response, Next)
            }
        }
    }

    RequestHandler = function(Options, Request, Response, Next){
        if (Options){
            if (((typeof Options.endpoints[Request.url] != "undefined") ?  (typeof Options.endpoints[Request.url].rate_limit != "undefined" ? Options.endpoints[Request.url].rate_limit : false) : false) == true){
                console.log('wow')
            }
        }

        return Next()
    }
}

module.exports = RateLimiter
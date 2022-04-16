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
            console.log('wow')
        }

        return Next()
    }
}

module.exports = RateLimiter
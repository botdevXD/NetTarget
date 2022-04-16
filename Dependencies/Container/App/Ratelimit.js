class RateLimiter{
    constructor(Options){
        const RequestHandler = this.RequestHandler

        return {
            function: function(Request, Response, Next){
                return RequestHandler(Options, Request, Response, Next)
            }
        }
    }

    RequestHandler = function(Options, Request, Response, Next){
        console.log(Request.url, Options)
        Next()
    }
}

module.exports = RateLimiter
class BootHandler{
    HandleRequest = function(Request, Response){
        return Response.send(JSON.stringify({
            wow: true
        }))
    }
}

module.exports = new BootHandler
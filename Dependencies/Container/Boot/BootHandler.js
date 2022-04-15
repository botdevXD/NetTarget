class BootHandler{
    HandleRequest = function(Request, Response){
        const RequestBody = Request.body;

        switch (RequestBody.TargetType || ""){
            case "TCP":
                console.log(1)
                break
            case "UDP":
                console.log(2)
                break
            case "HTTP":
                console.log(3)
                break
            default:
                console.log(4)
                break
        }

    }
}

module.exports = new BootHandler
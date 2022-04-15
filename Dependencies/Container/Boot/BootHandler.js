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
                Response.status(400)
                Response.json({
                    error: "Attack method doesn't exist!"
                })
                break
        }

    }
}

module.exports = new BootHandler
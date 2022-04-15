const CurrentAttacks = [];

class BootHandler{
    HandleRequest = function(Request, Response){
        const RequestBody = Request.body;
        Response.status(200)

        switch (RequestBody.TargetType || ""){
            case "TCP":
                Response.json({
                    success: true
                })
                break
            case "UDP":
                Response.json({
                    success: true
                })
                break
            case "HTTP":
                Response.json({
                    success: true
                })
                break
            default:
                Response.status(400)
                Response.json({
                    success: false,
                    error: "Attack method doesn't exist!"
                })
                break
        }

    }
}

module.exports = new BootHandler
const CurrentAttacks = [];

class BootHandler{
    constructor(){

    }

    AttackTypeHandler = function(Request, Response){
        const RequestBody = Request.body;

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

    HandleRequest = function(Request, Response){
        const RequestBody = Request.body;
        Response.status(200)

        if (RequestBody.TargetRequest){
            switch (RequestBody.TargetRequest){
                case "START":

                    this.AttackTypeHandler(Request, Response)
                
                    break
                case "STOP":
                    if (typeof CurrentAttacks[Request.clientIP || "0.0.0.0.0"] != "undefined") {
                        Response.json({
                            success: false,
                            error: "Attack stopped!"
                        })
                    }else{
                        Response.status(400)
                        Response.json({
                            success: false,
                            error: "You haven't submitted an attack!"
                        })
                    }
                default:
                    break
            }
        }

    }
}

module.exports = new BootHandler()
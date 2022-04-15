class Functions{
    ConvertTimeToSeconds = function(Time){
        return Math.abs(((new Date().getTime() - Time.getTime()) / 1000))
    };

    RenderPage = function(File, Response){
        if (typeof File == "object"){
            Response = File[1]
            File = File[0]
            
            return Response.sendFile(File)
        }

        if (typeof File != "undefined"){
            return Response.sendFile(File)
        }
    }

    BadMethod = function(Response, Method){
        if (typeof Response == "object"){
            Method = Response[1]
            Response = Response[0]
            
            Response.status(405)
            return Response.send(`${Method} requests are disabled for this endpoint!`)
        }

        if (typeof Response != "undefined"){
            Response.status(405)
            return Response.send(`${Method} requests are disabled for this endpoint!`)
        }
    }

    Execute = function(Condition, FailCallbackData, SuccessCallbackData){
        const SucessCallback = SuccessCallbackData[0]
        const FailCallback = FailCallbackData[0]

        SuccessCallbackData.splice(0, 1)
        FailCallbackData.splice(0, 1)

        if (Condition == true){
            return SucessCallback(SuccessCallbackData)
        }else if (Condition == false){
            return FailCallback(FailCallbackData)
        }
    }
}

module.exports = new Functions // create class object
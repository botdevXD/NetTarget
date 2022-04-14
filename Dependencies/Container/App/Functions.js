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

    BadMethod = function(){

    }

    Execute = function(Condition, FailCallbackData, SuccessCallbackData){
        if (Condition == true){
            //return Callback(Args)
        }
    }
}

module.exports = new Functions // create class object
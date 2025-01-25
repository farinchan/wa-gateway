const { config } = require("dotenv");
const { toDataURL } = require("qrcode");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const MainRouter = require("./app/routers");
const errorHandlerMiddleware = require("./app/middlewares/error_middleware");
const whatsapp = require("wa-multi-session");
const WebSocket = require('ws');

config();

var app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("view engine", "ejs");
// Public Path
app.use("/p", express.static(path.resolve("public")));
app.use("/p/*", (req, res) => res.status(404).send("Media Not Found"));

app.use(MainRouter);

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || "5000";
app.set("port", PORT);
var server = http.createServer(app);
server.on("listening", () => console.log("APP IS RUNNING ON PORT " + PORT));

server.listen(PORT);

whatsapp.onConnected((session) => {
  console.log("connected => ", session);
});

whatsapp.onDisconnected((session) => {
  console.log("disconnected => ", session);
});

whatsapp.onConnecting((session) => {
  console.log("connecting => ", session);
});

whatsapp.loadSessionsFromStorage();



const WS_PORT = process.env.WS_PORT || "5003";
const wsServer = http.createServer();
const wss = new WebSocket.Server({ server: wsServer });
wsServer.listen(WS_PORT, () => {
  console.log('WebSocket server running on ws://localhost:' + WS_PORT);
});

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data) => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Message received: ', jsonData);

      const sessionName = jsonData.session;
      if (!sessionName) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Session name is required',
          })
        );
        return;
      } else {
        whatsapp.onQRUpdated(async (data) => {
          const qr = await toDataURL(data.qr);
          if (data.sessionId == sessionName) {
            ws.send(
              JSON.stringify({
                type: 'response',
                qr: qr,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: 'response',
                qr: qr,
              })
            );
          }
        });

      }
      whatsapp.startSession(sessionName, { printQR: true }).then(() => {
        ws.send(
          JSON.stringify({
            type: 'response',
            message: 'Session started',
          })
        );
      }
      ).catch((error) => {
        // console.error('Error starting session: ', error);
        console.error('Error starting session');
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Kamu sudah Terhubung, Jika ada masalah silahkan reset session',
          })
        );
      });

    } catch (error) {
      console.error('Error parsing JSON message: ', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Error parsing JSON message',
        })
      );
    }

  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

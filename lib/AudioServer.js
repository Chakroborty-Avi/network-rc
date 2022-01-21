const { WebSocketServer } = require("@clusterws/cws");
const audioPlayer = require("./audioPlayer");

/**
 * 车子的喇叭
 * 播放控制端麦克风拾取的声音
 */
module.exports = class AudioServer {
  constructor({ server, onWarnning, onError, onSuccess }) {
    this.onWarnning = onWarnning;
    this.onError = onError;
    this.onSuccess = onSuccess;
    const path = `/audio`;
    this.clients = new Set();
    console.log(`Audio player websocker server starting`, path);

    this.bufferList = [];
    const wss = new WebSocketServer({ noServer: true, path }, () => {
      console.log(`Audio player websocker server started`, path);
    });

    server.on("upgrade", (request, socket, head) => {
      if (request.url === path)
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
    });

    this.wss = wss;

    wss.on("connection", (socket) => {
      console.log(`控制端已连接 Audio player`);
      socket.send(JSON.stringify({ action: "ok" }));

      socket.player = audioPlayer.createStreamPlayer({
        sampleRate: 48000,
        channelCount: 1,
        bitsPerSample: 16,
      });

      socket.on("message", (data) => {
        socket.player.write(Buffer.from(data));
      });

      socket.on("close", () => {
        console.log(`控制端已断开 Audio player`);
        socket.player.end();
        delete socket.player;
      });
    });

    wss.on("error", (err) => {
      console.error(err);
    });
  }
};

const child_process = require('child_process') // To be used later for running FFmpeg

const {
    inputSettings,
    twitchSettings,
    youtubeSettings,
    facebookSettings,
    customRtmpSettings,
  } = require('./ffmpeg')
  

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
  });

const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {

    console.log(`Socket connected to ${socket.id}`)
    const socketQueryParams = socket.handshake.query

    const youtube = socketQueryParams.youtubeUrl

    // "cdn": {
    //     "ingestionType": "rtmp",
    //     "ingestionInfo": {
    //       "streamName": "bt3w-x1yb-95e4-wrsh-1s67",
    //       "ingestionAddress": "rtmp://a.rtmp.youtube.com/live2",
    //       "backupIngestionAddress": "rtmp://b.rtmp.youtube.com/live2?backup=1",
    //       "rtmpsIngestionAddress": "rtmps://a.rtmps.youtube.com/live2",
    //       "rtmpsBackupIngestionAddress": "rtmps://b.rtmps.youtube.com/live2?backup=1"
    //     },
    //     "resolution": "variable",
    //     "frameRate": "variable"
    //   },
    // const youtube = 'rtmp://a.rtmp.youtube.com/live2/u5cv-k79v-3agw-cskb-3a2u'

    console.log(socketQueryParams)



    const ffmpegInput = inputSettings.concat(
        youtubeSettings(youtube)
      )


       const  ffmpeg = child_process.spawn('ffmpeg', ffmpegInput)
        
        // If FFmpeg stops for any reason, close the WebSocket connection.
        ffmpeg.on('close', (code, signal) => {
            console.log(
                'FFmpeg child process closed, code ' + code + ', signal ' + signal
            )
        })

        //   FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
        ffmpeg.stderr.on('data', (data) => {
            console.log('FFmpeg STDERR:', data.toString())
            ffmpeg.kill(0);

        })

        
   
   

    
    socket.conn.on('close', (e) => {
        console.log('kill: SIGINT')

        ffmpeg.kill('SIGINT')
    })

    
    
    
    let recived = 0
    socket.on('data', msg => {

        console.log(msg)
        recived = recived +1
        console.log("recived data : ", recived) 
        if(ffmpeg.connected) {
            console.log("sent to : ",recived)
            ffmpeg.stdin.write(msg)
        }else {
            ffmpeg.stdin.write(msg)

        }

        if(recived == 10){
            console.log("emmit streaming")
            socket.emit("streaming", true);
        }
    });


});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
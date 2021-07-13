// - App

// - Dependencies

// - Inilialize express
const express = require('express');

// - AppConfig
const app = express();

const server = require('http').Server(app);
// - Socket Server :- 
// - Path set to './socket.io' and serverClient to 'true' by default
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true,
    allow_discovery: true,
})
const { v4: uuidV4 } = require('uuid');
const cors = require('cors');


// - Middlewares
app.use('/peerjs', peerServer)
app.use(cors())


// - Templating language set to ejs, which is a simple templating language that lets you generate HTML markup with plain JavaScript.
app.set('view engine', 'ejs')


app.use(express.static('public'))


// - App routes
app.get('/leave', (req, res) => {
    res.render('leave');
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
})

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
})


// - Server side Socket.io. Runs everytime there is a connection on the webpage 
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId,userName) => {

        // - When user connects
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId, userName);

        // - When user sends a message
        socket.on('message', (message) => {
            // - Sharing the message to the same room
            io.to(roomId).emit('createMessage', message, userName);
        })

        socket.on('raiseHand', () => {
            io.to(roomId).emit('raiseHand-notif', userName);
        })

        // - When user disconnects
        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId, userName);
        })

    })
})

// - Listen to the environment variable PORT, or 3000 if there's nothing
const port = process.env.PORT || 3000
server.listen(port, () => console.log(`Server Started on ${port}`))
// Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory database (for simplicity)
let votes = [
	{id:1, name:"재현재성", votes:3},
	{id:2, name:"광희홀로", votes:6},
	{id:3, name:"집행부??", votes:1}
];

// API Endpoints

// Send html file
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/manage', (req, res) => res.sendFile(__dirname + '/public/manage.html'));

// Manage votes list
app.post('/create-option', (req, res) => {
	votes.push({id: votes.length + 1, name: req.body.name, votes: 0});
});
app.delete('/delete-option/:id', (req, res) => {
	const optionId = parseInt(req.params.id, 10);
	
	// Find the index of the option to be deleted
	const optionIndex = votes.findIndex(option => option.id === optionId);
  
	if (optionIndex === -1) {
	  return res.status(404).json({ message: 'Option not found' });
	}
  
	// Remove the option from the votes array
	votes.splice(optionIndex, 1);
  
	// Respond with success
	res.status(200).json({ message: 'Option deleted successfully' });
});

// Get all votes
app.get('/votes', (req, res) => {
  res.json(votes);
});

// Cast a vote
app.post('/vote', (req, res) => {
  const { id } = req.body;
  const option = votes.find(v => v.id === id);

  if (option) {
    option.votes += 1;

    // Emit real-time update
    io.emit('voteUpdate', votes);

    res.status(200).json({ message: 'Vote cast successfully' });
  } else {
    res.status(404).json({ message: 'Option not found' });
  }
});

// Real-time connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

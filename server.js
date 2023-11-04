const express = require("express");
const {MongoClient} = require('mongodb');
const cors = require('cors')
const jwt = require("jsonwebtoken")
const fs = require("fs")
const bodyParser = require("body-parser");
const { log, Console } = require("console");
// const bcrypt = require('bcrypt')
// const { v4: uuidv4 } = require('uuid');
const http = require('http');
// const socketIO = require('socket.io');
const socketIO = require('socket.io');
const multer = require('multer');




const app = express();

const server = http.createServer(app);
// const io = socketIO(server);
// const io = socketIO(server);
const io = socketIO(server, { path: '/socket' });

// console.log(io);

app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({limit: '50mb'}));

app.use(cors());
// app.use(express.json());
app.use(bodyParser.json())


const storage = multer.memoryStorage();
const upload = multer({ storage });

const uri = process.env.CONNECTION


// const client = new MongoClient(uri, {
//     serverApi: {
//       version: ServerApiVersion.v1,
//       strict: true,
//       deprecationErrors: true,
//     }
//   });



const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

//   async function setupSocketIo() {
//     await client.connect();
//     console.log('Connected to MongoDB');
  
//     const database = client.db('chillinq');
//     const users = database.collection('messages');
  
//     io.on('connection', (socket) => {
//       console.log('A user connected');
  
//       socket.on('disconnect', () => {
//         console.log('User disconnected');
//       });
  
//       socket.on('chat message', async (data) => {
//         // Save message to MongoDB
//         await users.insertOne({
//           text: data.text,
//           sender: data.sender,
//         });
  
//         // Broadcast the message to all connected clients
//         io.emit('chat message', data);
//       });
//     });
//   }
  
//   setupSocketIo().catch(console.error);







// async function startServer() {
//   try {
//     await client.connect();
//     console.log('Connected to MongoDB');

//     // Define the chat collection
//     const chatCollection = client.db('chillinq').collection('messages');

//     io.on('connection', (socket) => {
//       console.log('A user connected');

//       socket.on('chatMessage', async (message) => {
//         console.log('Received message:', message);

//         try {
//           // Save the chat message to MongoDB
//           await chatCollection.insertOne({
//             sender: 'User', // You can replace this with the actual sender information
//             message: message,
//             timestamp: new Date(),
//           });

//           // Broadcast the message to all connected clients
//           io.emit('chatMessage', message);
//         } catch (error) {
//           console.error('Error saving chat message to MongoDB:', error);
//         }
//       });

//       socket.on('disconnect', () => {
//         console.log('A user disconnected');
//       });
//     });

//     server.listen(3000, () => {
//       console.log('Server is running on port 3000');
//     });
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//   }
//   finally{
//     client.close()
//   }
// }

// startServer();








async function startServer() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Define the chat collection
    const chatMessagesCollection = client.db('chillinq').collection('messages');
    const queueCollection = client.db('chillinq').collection('queueTier1');
    app.use(express.json());


    app.post('/loadMessages', async (req, res) => {
      const { targetUserMobileNumber, currentUserMobileNumber, maker } = req.body;
      // console.log(targetUserMobileNumber);
      // console.log(currentUserMobileNumber);
      // console.log(req.body);


      // Normalize the room name to ensure consistency
      function normalizeRoomName(user1MobileNumber, user2MobileNumber) {
      const smallerNumber = Math.min(user1MobileNumber, user2MobileNumber);
      const largerNumber = Math.max(user1MobileNumber, user2MobileNumber);
      return `user_${smallerNumber}_user_${largerNumber}`;
      }
  
      // When creating a room or saving a message, use the normalized room name
      const room = normalizeRoomName(targetUserMobileNumber, currentUserMobileNumber);

      // Query your MongoDB collection for messages in the specific chat room
      const messages = await chatMessagesCollection.find({
        room: room,
      }).toArray();

      const queue = await queueCollection.findOne({maker:maker})
      const timestamp = queue.activeMemberEndTime
      // console.log(queue);

      // Send the loaded messages to the client
      console.log(messages);
      res.json({ messages, timestamp});
    });



    io.on('connection', (socket) => {
      console.log('A user connected');

      socket.on('joinRoom', (room) => {
        socket.join(room);
      });

      socket.on('chatMessage', async (message, room, sender) => {
        console.log('Received message:', message);

        try {
          // Save the chat message to MongoDB with the room identifier
          await chatMessagesCollection.insertOne({
            room,
            sender: sender, // You can replace this with the actual sender information
            message: message,
            timestamp: new Date(),
          });

          // Broadcast the message to all connected clients in the room
          io.to(room).emit('chatMessage', {message, room, sender});
        } catch (error) {
          console.error('Error saving chat message to MongoDB:', error);
        }
      });



      socket.on('friend-request', async (sender, receiver) => {
        // console.log('Received message:', message);
        console.log(sender);
        console.log(receiver);

        try {
          if (receiver) {
            // Emit a friend request event to the receiver
            io.to(receiver).emit('friend-request', { sender, receiver});
            console.log("sent");
          }
          
        } 
        catch (error) {
          console.error('Error sending friend request', error);
        }
      });



      // Handle friend requests using Socket.io
      // socket.on('friend-request', (data) => {
      //   // Data should contain sender, receiver, and request details
      //   // Emit an event to the receiver's socket
      //   io.to(data.receiverSocketId).emit('friend-request', data.request);
      // });


      // io.to(receiverSocketId).emit('friend-request', request);


      socket.on('disconnect', () => {
        console.log('A user disconnected');
      });
    });

    const port = 3000;

    server.listen(port , () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

startServer();


















// async function connectToDB() {
//     try {
//       await client.connect();
//       console.log('Connected to MongoDB');
//     } catch (err) {
//       console.error('Error connecting to MongoDB:', err);
//     }
//   }
// connectToDB();
// const Message = client.db('chillinq').collection('messages');


// io.on('connection', (socket) => {
//     console.log('User connected');
  
//     socket.on('newMessage', async (data) => {
//       try {
//         await Message.insertOne({ text: data.text });
//         io.emit('newMessage', data);
//       } catch (err) {
//         console.error('Error inserting message to MongoDB:', err);
//       }
//     });
  
//     socket.on('disconnect', () => {
//       console.log('User disconnected');
//     });
// });



app.post('/checkActiveTime', async (req, res) => {
  console.log("active check");
  // const client = new MongoClient(uri)
  const maker = req.body.maker;
  console.log(maker);
  
  try{
  await client.connect()
  const database = client.db('chillinq')
  // const usersCollection = database.collection('users')


  // const user = await usersCollection.findOne({ 'mobileNumber.val': mobileNumber });
  // const points = user.chillCounter
  // console.log(points);
  // res.json({counter:points})

  }
  catch (err) {
      console.log(err)
  }
  finally{
      // await client.close()
  }
  });













// await client.connect()
// const database = client.db('chillinq')
// const queueCollection = database.collection('queueTier1')
// const queueDocs = await queueCollection.find({}).toArray();

const updateQueue = async(maker, data) =>{
  await client.connect()
  const database = client.db('chillinq')
  const queueCollection = database.collection('queueTier1')
  const query = {maker: maker}

  const updateDocument = {
    $set: data
}
const insertedUser = await queueCollection.updateOne(query, updateDocument)
}




// Function to manage transitions in a specific queue
const manageQueueTransitions = async (queue) => {
  if (!queue.activeMember) {

    if (queue.waitingList.length > 0) {
      // Get the next member from the waiting list
      const nextMember = queue.waitingList.shift();
      // const { userId, timestamp } = nextMember;

      // Make the next member the active member with remaining time
      // const remainingTime = activeMemberEndTime - currentTime;
      // const newActiveMemberEndTime = currentTime + Math.min(remainingTime, 100000);

      const currentTime = Date.now();
      const newActiveMemberEndTime = currentTime + 100000;

      queue.activeMember = nextMember;
      queue.activeMemberEndTime = newActiveMemberEndTime;
      const data = {waitingList: queue.waitingList,
                    activeMember: queue.activeMember,
                    activeMemberEndTime: queue.activeMemberEndTime
                  }
      console.log(queue);

      updateQueue(queue.maker, data)

    }
    // No active member; do nothing
    // return;
  }

  const currentTime = Date.now();
  const activeMemberEndTime = queue.activeMemberEndTime || 0;

  if (activeMemberEndTime <= currentTime) {
    if (queue.waitingList.length > 0) {
      // Get the next member from the waiting list
      const nextMember = queue.waitingList.shift();
      // const { userId, timestamp } = nextMember;

      // Make the next member the active member with remaining time
      const remainingTime = activeMemberEndTime - currentTime;
      // const newActiveMemberEndTime = currentTime + Math.min(remainingTime, 100000);
      const newActiveMemberEndTime = currentTime + 100000
      queue.activeMember = nextMember;
      queue.activeMemberEndTime = newActiveMemberEndTime;
    } else {
      // No one in the waiting list; clear the active member
      queue.activeMember = null;
      queue.activeMemberEndTime = null;
    }

    // Update the queue in the database
    // await queue.save();
    updateQueue(queue.maker, queue)

    // Notify clients about the transition
    // You can use a WebSocket to broadcast this information
  }
};

// Function to periodically check and manage transitions for all queues
const checkAndManageQueueTransitions = async () => {
  // let client;
  try {
    // const allQueues = await Queue.find({});

    // client = new MongoClient(uri)
    await client.connect()
    const db = client.db('chillinq');
    const queueCollection = db.collection('queueTier1');
  
      // Fetch all queue documents
      const allQueues = await queueCollection.find({}).toArray();
      console.log('check');

    for (const queue of allQueues) {
      await manageQueueTransitions(queue);
    }
  } catch (err) {
    console.error('Error checking and managing queue transitions:', err);
  }
  finally{
    if (client) {
      // await client.close();
    }
  }

  // Schedule the next check for transitions
  setTimeout(checkAndManageQueueTransitions, 2000);
};

// Start the initial check for transitions
checkAndManageQueueTransitions();




app.post('/getCounter', async (req, res) => {
  console.log("countercheck");
  // const client = new MongoClient(uri)
  const mobileNumber = req.body.value;
  console.log(mobileNumber);
  
  try{
  await client.connect()
  const database = client.db('chillinq')
  const usersCollection = database.collection('users')


  const user = await usersCollection.findOne({ 'mobileNumber.val': mobileNumber });
  const points = user.chillCounter
  console.log(points);
  res.json({counter:points})

  }
  catch (err) {
      console.log(err)
  }
  finally{
      // await client.close()
  }
  });












app.get("/", function(req,res){
    res.json("hello")
})


app.post('/checkQueueStatus', async (req, res) => {
    console.log("statuscheck");
    // const client = new MongoClient(uri)
    const mobileNumber = req.body.value;
    
    try{
    await client.connect()
    const database = client.db('chillinq')
    const queue = database.collection('queueTier1')


    const result = await queue.findOne({ maker: mobileNumber });
    if (result) {
        // User already has a queue
        console.log("Queue exists");
        res.json({ hasQueue: true });
      } else {
        // User doesn't have a queue
        console.log("Doesn't exist");
        res.json({ hasQueue: false });
      }

    }
    catch (err) {
        console.log(err)
    }
    finally{
        // await client.close()
    }
    });



app.post('/createQueue', async (req, res) => {
    console.log("create");
    // const client = new MongoClient(uri)
    const mobileNumber = req.body.value;

    try{
        await client.connect()
        const database = client.db('chillinq')
        const queue = database.collection('queueTier1')
        // Check if a queue exists for the mobileNumber
    const existingQueue = await queue.findOne({ maker: mobileNumber });

    if (existingQueue) {
      // User already has a queue
      return res.status(400).json({ error: 'You already have a queue' });
    }

    // Create a new queue object for the user
    const newQueue = {
      maker: mobileNumber, 
      waitingList:[],
      // Add any other properties you need for the queue
    };

    // Insert the newQueue object into the collection
    const result = await queue.insertOne(newQueue);

    // if (result.insertedCount === 1) {
    //   // Queue successfully created
    //   return res.status(201).json({ message: 'Queue created successfully' });
    // } else {
    //   // Error occurred while inserting the queue
    //   console.error('Error creating queue:', result);
    //   return res.status(500).json({ error: 'Error creating queue' });
    // }
    res.json({Success:  "Queue Created"})
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }


  finally{
    // client.close()
  }
})





app.post('/getJoinedQueues', async (req, res) => {
  try {
    console.log("Fetching Queues you have joined");
    const mobileNumber = req.body.value;
    // const client = new MongoClient(uri)
    const db = client.db('chillinq');
    const queue = db.collection('queueTier1');
    const usersCollection = db.collection('users');
    console.log(mobileNumber)


    // Fetch all queue documents
    const user = await usersCollection.findOne({ 'mobileNumber.val': mobileNumber });
    console.log(user);
    // const queueDocs = await queue.find({}).toArray();
    const joinedQueues = user.joinedQueues;
    // const queueMakers = usersCollection.find({ 'mobileNumber.val': { $in: joinedQueues } });

    // Iterate through queue documents and retrieve maker's details
    const queueMakers = [];

    for (const maker of joinedQueues) {
      const user = await usersCollection.findOne({ 'mobileNumber.val': maker });

      // Combine queue and user details
      // const queueWithUser = {
      //   ...queue,
      //   makerDetails: user,
      // };

      queueMakers.push(user);
      // console.log(queueDetails);
    }
    console.log(queueMakers);
    res.json(queueMakers);
  } catch (err) {
    console.error('Error fetching or processing queue details:', err);
    res.status(500).json({ error: 'An error occurred while fetching or processing queue details' });
  } finally {
    if (client) {
      // client.close();
    }
  }
});













app.post('/getQueue', async (req,res) => {
  const maker = req.body.value;
  
  try{
    console.log(maker);
    console.log("Fetching");
    // const client = new MongoClient(uri)
    const db = client.db('chillinq');
    const queueCollection = db.collection('queueTier1');
    const usersCollection = db.collection('users');


    const queue = await queueCollection.findOne({ maker: maker });
    members = queue.members;
    console.log(queue.members);


    const memberInfo = await usersCollection
      .find({ 'mobileNumber.val': { $in: members } })
      .project({ mobileNumber: 1, name: 1, firstImage: 1 }) // Adjust the fields you want to retrieve
      .toArray();
    console.log(memberInfo);
    res.json({memberInfo: memberInfo, active: queue.activeMember})

  }

  catch (err) {
    console.error('Error fetching or processing queue details:', err);
    res.status(500).json({ error: 'An error occurred while fetching or processing queue details' });
  } finally {
    if (client) {
      // client.close();
    }
  }

})



app.post('/getMyqueue', async (req,res) => {
  const maker = req.body.value;
  
  try{
    console.log(maker);
    console.log("Fetching");
    // const client = new MongoClient(uri)
    const db = client.db('chillinq');
    const queueCollection = db.collection('queueTier1');
    const usersCollection = db.collection('users');


    const queue = await queueCollection.findOne({ maker: maker });
    members = queue.members;
    console.log(queue.members);


    const memberInfo = await usersCollection
      .find({ 'mobileNumber.val': { $in: members } })
      .project({ mobileNumber: 1, name: 1, firstImage: 1 }) // Adjust the fields you want to retrieve
      .toArray();
    console.log(memberInfo);
    res.json(memberInfo)

  }

  catch (err) {
    console.error('Error fetching or processing queue details:', err);
    res.status(500).json({ error: 'An error occurred while fetching or processing queue details' });
  } finally {
    if (client) {
      // client.close();
    }
  }

})





app.post('/leaveQueue', async (req,res) => {
  try{
    console.log("leaving");
    const data = req.body;
    const db = client.db('chillinq');
    const queueCollection = db.collection('queueTier1');
    const userToRemove1 = data.value._j;
    const usersCollection = db.collection('users');
    // const queue = await queueCollection.findOne({maker: data.maker})
    const query = {maker: data.maker}
    const update1 = {
      $pull: { members: userToRemove1 }
    };
    const update2 = {
      $pull: { waitingList: userToRemove1 }
    };
    console.log(data);
    const result1 = await queueCollection.updateOne(query, update1);
    const result2 = await queueCollection.updateOne(query, update2);
    const userToRemove2 = data.maker;
    const query2 = {'mobileNumber.val' : data.value._j}
    const update3 = {
      $pull: { joinedQueues: userToRemove2 }
    }
    const result3 = await usersCollection.updateOne(query2, update3);
    console.log("Left");
    res.json("success")
  }

  catch{
    console.error('Error leaving queue:', err);
    res.status(500).json({ error: 'An error occurred while leaving Queue.' });
  }

  finally{

  }
})


app.post('/deleteQueue', async (req,res) => {
  try{
    const data = req.body.value;
    const db = client.db('chillinq');
    const queueCollection = db.collection('queueTier1');
    const usersCollection = db.collection('users');
    const queue = await queueCollection.findOne({maker: data})

    for (joiner in queue.members){
      const result = await usersCollection.updateOne({'mobileNumber.val' : joiner}, {$pull :{joinedQueues:data}});
    }
    const deleting = await queueCollection.deleteOne({maker: data})

  }

  catch (err){
    console.error('Error fetching or processing queue details:', err);
      res.status(500).json({ error: 'An error occurred while fetching or processing queue details' });
  }

  finally{

  }
})












app.get('/getQueueDetails', async (req, res) => {
    try {
      console.log("Fetching");
      // const client = new MongoClient(uri)
      const db = client.db('chillinq');
      const queue = db.collection('queueTier1');
      const usersCollection = db.collection('users');
  
      // Fetch all queue documents
      const queueDocs = await queue.find({}).toArray();
  
      // Iterate through queue documents and retrieve maker's details
      const queueDetails = [];
  
      for (const queue of queueDocs) {
        const user = await usersCollection.findOne({ 'mobileNumber.val': queue.maker });
  
        // Combine queue and user details
        const queueWithUser = {
          ...queue,
          makerDetails: user,
        };
  
        queueDetails.push(queueWithUser);
        // console.log(queueDetails);
      }
      console.log(queueDetails);
      res.json(queueDetails);
    } catch (err) {
      console.error('Error fetching or processing queue details:', err);
      res.status(500).json({ error: 'An error occurred while fetching or processing queue details' });
    } finally {
      if (client) {
        // client.close();
      }
    }
  });



  // app.post('/joinQueue', async (req, res) => {
  //   const makerNumber = req.body.value;
  //   const userNumber = req.body.userNumber; // Adjust to your user object structure
  //   const queueLimit = 6; // Maximum number of members in the queue
  
  //   try {
  //     const client = new MongoClient(uri)
  //     const db = client.db('chillinq');
  //     const queueCollection = db.collection('queueTier1');
  //     const usersCollection = db.collection('users');
  
  //     // Find the maker's queue
  //     const queue = await queueCollection.findOne({ maker: makerNumber });
  
  //     if (!queue) {
  //       res.status(404).json({ error: 'Maker not found' });
  //       return;
  //     }
  
  //     // Check if the user is already in the queue
  //     if (Object.values(queue).includes(userNumber)) {
  //       console.log("already in queue");
  //       res.status(400).json({ error: 'You are already in the queue' });
  //       return;
  //     }
  
  //     // Check if the queue is full (reached the maximum number of members)
  //     if (Object.keys(queue).length >= queueLimit) {
  //       console.log("queue full");
  //       res.status(400).json({ error: 'Queue is full' });
  //       return;
  //     }
  
  //     // Find the first available member slot and add the user
  //     for (let i = 1; i <= queueLimit; i++) {
  //       const memberKey = `member${i}`;
  //       if (!queue[memberKey]) {
  //         // Add the user to the queue as a member
  //         const update = { $set: { [memberKey]: userNumber } };
  //         await queueCollection.updateOne({ maker: makerNumber }, update);
          
  //         // Update the user's object in the "users" collection
  //         await usersCollection.updateOne(
  //           {mobileNumber: {val:userNumber}},
  //           { $addToSet: { joinedQueues: makerNumber } }
  //         );
  //         console.log(joinedQueues);
          
  //         res.status(200).json({ message: `You are now member ${i} in the queue` });
  //         return;
  //       }
  //     }
  
  //     res.status(400).json({ error: 'Queue is full' });
  //   } catch (err) {
  //     console.error('Error joining the queue:', err);
  //     res.status(500).json({ error: 'An error occurred while joining the queue' });
  //   } finally {
  //     if (client) {
  //       client.close();
  //     }
  //   }
  // });





  
  // ...
  
//   app.post('/joinQueue', async (req, res) => {
//   const MAX_MEMBERS = 6; // Maximum number of members in a queue
//   const INTERACTION_DURATION_MS = 30 * 1000; // 4 minutes and 30 seconds in milliseconds
//   const makerId = req.body.value;
//   const userId = req.body.userNumber; // Adjust to your user object structure

//   try {
//     const client = new MongoClient(uri)
//     const db = client.db('chillinq');
//     const queueCollection = db.collection('queueTier1');
//     const usersCollection = db.collection('users');

//     // Find the maker's queue
//     const queue = await queueCollection.findOne({ maker: makerId });

//     if (!queue) {
//       res.status(404).json({ error: 'Maker not found' });
//       return;
//     }

//     // Check if the user is already in the queue
//     if (Object.values(queue).includes(userId)) {
//       res.status(400).json({ error: 'You are already in the queue' });
//       return;
//     }

//     // Check if the queue is full (reached the maximum number of members)
//     if (Object.keys(queue).length >= MAX_MEMBERS) {
//       res.status(400).json({ error: 'Queue is full' });
//       return;
//     }

//     // Add the user to the waiting list with a timestamp
//     const waitingList = queue.waitingList || [];
//     waitingList.push({ userId, timestamp: Date.now() });
//     let update = { $set: { waitingList } };
//     await queueCollection.updateOne({ maker: makerId }, update);

//     // If it's the first member to join, create the 'member1' slot
//     if (Object.keys(queue).length === 2) {
//       update.$set.member1 = userId;
//       // update.$set.member1 = '';
//     }
//     await queueCollection.updateOne({ maker: makerId }, update);


//     // Update the user's object in the "users" collection
//     await usersCollection.updateOne(
//       {mobileNumber: {val:userId}},
//       { $addToSet: { joinedQueues: makerId } }
//     );

//     res.status(200).json({ message: 'You are in the waiting list' });

//     // Start a timer to move the next member from the waiting list to active member slot
//     setTimeout(async () => {
//       const updatedQueue = await queueCollection.findOne({ maker: makerId });
//       console.log(updatedQueue);
//       if (updatedQueue) {
//         const nextMemberIndex = Object.keys(updatedQueue).findIndex((key) => key.startsWith('member') && !updatedQueue[key]);
//         console.log(nextMemberIndex);
//         if (nextMemberIndex !== -1) {
//           const nextMemberKey = `member${nextMemberIndex + 1}`;
//           const nextMember = updatedQueue.waitingList.shift();
//           if (nextMember) {
//             update = { $set: { [nextMemberKey]: nextMember.userId }, $pull: { waitingList: nextMember } };
//             await queueCollection.updateOne({ maker: makerId }, update);
//           }
//         }
//       }
//     }, INTERACTION_DURATION_MS);

//   } catch (err) {
//     console.error('Error joining the queue:', err);
//     res.status(500).json({ error: 'An error occurred while joining the queue' });
//   } finally {
//     if (client) {
//       client.close();
//     }
//   }
// });

  
// app.post('/joinQueue', async (req, res) => {
//   const INTERACTION_DURATION_MS = 30 * 1000;
//   const makerId = req.body.value;
//   const userId = req.body.userNumber; // Adjust to your user object structure

//   try {
//     const client = new MongoClient(uri)
//     const db = client.db('chillinq');
//     const queueCollection = db.collection('queueTier1');
//     const usersCollection = db.collection('users');

//     // Find the maker's queue
//     const queue = await queueCollection.findOne({ maker: makerId });

//     if (!queue) {
//       res.status(404).json({ error: 'Maker not found' });
//       return;
//     }

//     // Check if the user is already in the queue
//     if (Object.values(queue).includes(userId)) {
//       res.status(400).json({ error: 'You are already in the queue' });
//       return;
//     }

//     // Check if the queue already has an active member
//     if (queue.activeMember) {
//       // Add the user to the waiting list with a timestamp
//       const waitingList = queue.waitingList || [];
//       waitingList.push({ userId, timestamp: Date.now() });
//       const update = { $set: { waitingList } };
//       await queueCollection.updateOne({ maker: makerId }, update);
//       res.status(200).json({ message: 'You are in the waiting list' });
//     } else {
//       // If there is no active member, make the user the active member
//       const update = { $set: { activeMember: userId } };
//       await queueCollection.updateOne({ maker: makerId }, update);
//       res.status(200).json({ message: 'You are the active member' });

//       // Start a timer to move the next member from the waiting list to the active slot
//       setTimeout(async () => {
//         const updatedQueue = await queueCollection.findOne({ maker: makerId });
//         if (updatedQueue) {
//           const nextMember = updatedQueue.waitingList.shift();
//           if (nextMember) {
//             // Set the next member as active
//             const update = { $set: { activeMember: nextMember.userId }, $pull: { waitingList: nextMember } };
//             await queueCollection.updateOne({ maker: makerId }, update);
//           }
//         }
//       }, INTERACTION_DURATION_MS);
//     }

//     // Update the user's object in the "users" collection
//     await usersCollection.updateOne(
//       {mobileNumber: {val:userId}},
//       { $addToSet: { joinedQueues: makerId } }
//     );

//   } catch (err) {
//     console.error('Error joining the queue:', err);
//     res.status(500).json({ error: 'An error occurred while joining the queue' });
//   } finally {
//     if (client) {
//       client.close();
//     }
//   }
// });










// ...

// app.post('/joinQueue', async (req, res) => {
//   const MAX_MEMBERS = 6; // Maximum number of members in a queue
//   const INTERACTION_DURATION_MS =30 * 1000; // 4 minutes and 30 seconds in milliseconds
//   const makerId = req.body.value;
//   const userId = req.body.userNumber; // Adjust to your user object structure

//   try {
//     const client = new MongoClient(uri)
//     const db = client.db('chillinq');
//     const queueCollection = db.collection('queueTier1');
//     const usersCollection = db.collection('users');

//     // Find the maker's queue
//     const queue = await queueCollection.findOne({ maker: makerId });

//     if (!queue) {
//       res.status(404).json({ error: 'Maker not found' });
//       return;
//     }

//     // Check if the user is already in the queue
//     if (Object.values(queue).includes(userId)) {
//       res.status(400).json({ error: 'You are already in the queue' });
//       return;
//     }

//     // Calculate the interaction end time for the active member
//     const currentTime = Date.now();
//     const activeMemberEndTime = queue.activeMemberEndTime || 0;

//     // If there is no active member or the active member's time is up
//     if (!queue.activeMember || (activeMemberEndTime <= currentTime)) {
//       // Make the user the active member with a specific interaction end time
//       const newActiveMemberEndTime = currentTime + INTERACTION_DURATION_MS;
//       const update = {
//         $set: {
//           activeMember: userId,
//           activeMemberEndTime: newActiveMemberEndTime
//         }
//       };
//       await queueCollection.updateOne({ maker: makerId }, update);
//       res.status(200).json({ message: 'You are the active member' });
//     } else {
//       // Check if there are fewer than 6 members in the queue
//       const memberCount = Object.keys(queue).filter(key => key.startsWith('member')).length;
//       if (memberCount < MAX_MEMBERS) {
//         // Add the user to the waiting list
//         const waitingList = queue.waitingList || [];
//         waitingList.push({ userId, timestamp: currentTime });
//         const update = { $set: { waitingList } };
//         await queueCollection.updateOne({ maker: makerId }, update);
//         res.status(200).json({ message: 'You are in the waiting list' });
//       } else {
//         res.status(400).json({ error: 'Queue is full' });
//       }
//     }

//     // Update the user's object in the "users" collection
//     await usersCollection.updateOne(
//       {mobileNumber: {val:userId}},
//       { $addToSet: { joinedQueues: makerId } }
//     );

//     // Add the userId to the members array in the queue document
//     await queueCollection.updateOne(
//       { maker: makerId },
//       { $addToSet: { members: userId } }
//     );


//   } catch (err) {
//     console.error('Error joining the queue:', err);
//     res.status(500).json({ error: 'An error occurred while joining the queue' });
//   } finally {
//     if (client) {
//       client.close();
//     }
//   }
// });










app.post('/friendRequest', async (req, res) => {

  try {
    // const client = new MongoClient(uri)
    const db = client.db('chillinq');
    const queueCollection = db.collection('queueTier1');
    const usersCollection = db.collection('users');

    // Find the maker's queue
    const queue = await queueCollection.findOne({ maker: makerId });

  } catch (err) {
    console.error('Error joining the queue:', err);
    res.status(500).json({ error: 'An error occurred while joining the queue' });
  } finally {
    if (client) {
      // client.close();
    }
  }

})













app.post('/joinQueue', async (req, res) => {
  const MAX_MEMBERS = 6; // Maximum number of members in a queue
  const INTERACTION_DURATION_MS = 150 * 1000; // 4 minutes and 30 seconds in milliseconds
  const makerId = req.body.value;
  const userId = req.body.userNumber; // Adjust to your user object structure

  try {
    // const client = new MongoClient(uri)
    const db = client.db('chillinq');
    const queueCollection = db.collection('queueTier1');
    const usersCollection = db.collection('users');

    // Find the maker's queue
    const queue = await queueCollection.findOne({ maker: makerId });

    if (!queue) {
      res.status(404).json({ error: 'Maker not found' });
      return;
    }

    // Check if the user is already in the queue
    if (Object.values(queue).includes(userId)) {
      res.status(400).json({ error: 'You are already in the queue' });
      return;
    }

    // Calculate the interaction end time for the active member
    const currentTime = Date.now();
    const activeMemberEndTime = queue.activeMemberEndTime || 0;

    // If there is no active member or the active member's time is up
    if (!queue.activeMember || (activeMemberEndTime <= currentTime)) {
      // Make the user the active member with a specific interaction end time
      const newActiveMemberEndTime = currentTime + INTERACTION_DURATION_MS;
      const update = {
        $set: {
          activeMember: userId,
          activeMemberEndTime: newActiveMemberEndTime
        }
      };
      await queueCollection.updateOne({ maker: makerId }, update);
      res.status(200).json({ message: 'You are the active member' });

      // Set a timer to automatically change the active member after INTERACTION_DURATION_MS
      setTimeout(async () => {
        // Change the active member here (update the queue document)
        // This code will execute after the specified duration
        const updatedQueue = await queueCollection.findOne({ maker: makerId });
        if (updatedQueue.activeMember === userId) {
          // Change the active member (e.g., set it to null)
          const activeMemberUpdate = {
            $set: {
              activeMember: null,
              activeMemberEndTime: null
            }
          };
          await queueCollection.updateOne({ maker: makerId }, activeMemberUpdate);
        }
      }, INTERACTION_DURATION_MS);
    } else {
      // Check if there are fewer than 6 members in the queue
      const memberCount = Object.keys(queue).filter(key => key.startsWith('member')).length;
      if (memberCount < MAX_MEMBERS) {
        // Add the user to the waiting list
        const waitingList = queue.waitingList || [];
        waitingList.push({ userId, timestamp: currentTime });
        const update = { $set: { waitingList } };
        await queueCollection.updateOne({ maker: makerId }, update);
        res.status(200).json({ message: 'You are in the waiting list' });
      } else {
        res.status(400).json({ error: 'Queue is full' });
      }
    }

    // Update the user's object in the "users" collection
    await usersCollection.updateOne(
      {mobileNumber: {val:userId}},
      { $addToSet: { joinedQueues: makerId } }
    );

    // Add the userId to the members array in the queue document
    await queueCollection.updateOne(
      { maker: makerId },
      { $addToSet: { members: userId } }
    );

  } catch (err) {
    console.error('Error joining the queue:', err);
    res.status(500).json({ error: 'An error occurred while joining the queue' });
  } finally {
    if (client) {
      // client.close();
    }
  }
});









app.post("/signup", async (req,res) => {
    // const client = new MongoClient(uri)
    const mobileNumber = req.body

    try {
        await client.connect()
        const database = client.db('chillinq')
        const users = database.collection('users')

        const existingUser = await users.findOne({mobileNumber})

        if (existingUser) {
        //     // return res.status(409).send('User already exists. Please login')

        //     const token = jwt.sign(existingUser, mobileNumber, {
        //         expiresIn: 60 * 24
        //     })
            res.status(201).json({existingUser, mobileNumber: mobileNumber})

        }




        // const sanitizedEmail = email.toLowerCase()

        // const data = {
        //     user_id: generatedUserId,
        //     email: sanitizedEmail,
        //     hashed_password: hashedPassword
        // }
        


        else{
        const data = {
            mobileNumber: mobileNumber,
            ongoingQueue: false,
            isTalking: false
        }

        // const insertedUser = await users.insertOne(data)
        try {
            const insertedUser = await users.insertOne(data);
            // console.log("User inserted:", insertedUser);
            // res.status(201).json({insertedUser, mobileNumber: mobileNumber})
            res.status(201).json({insertedUser, data})
        } catch (error) {
            console.error("Error inserting user:", error);
        }
        // res.status(201).json({insertedUser, mobileNumber: mobileNumber})
    }
    
    // const token = jwt.sign(insertedUser, mobileNumber, {
        //     expiresIn: 60 * 24
        // })
        // res.json(insertedUser, mobileNumber: mobileNumber)

    } catch (err) {
        console.log(err)
    } finally {
        // await client.close()
    }
})





app.post("/gender" , async (req,res) => {
    // const client = new MongoClient(uri);
    const gender = req.body.val;
    try{
        await client.connect()
        const database = client.db('chillinq')
        const users = database.collection('users')
        const query = {mobileNumber: {val:req.body.number}}
        console.log(req.body)
        console.log(query);

        const updateDocument = {
            $set: {
                gender : gender
            }
        }
        const insertedUser = await users.updateOne(query, updateDocument)
        res.json(insertedUser)
    }
    finally{
        // await client.close()
    }
})


app.post("/about", async (req,res) => {
    // const client = new MongoClient(uri);
    const formData = req.body;

    try{
        await client.connect();
        const database = client.db('chillinq')
        const users = database.collection('users')

        const query = {mobileNumber: {val:req.body.number}}
        console.log(req.body)
        // const imageUri = formData.firstImage
        console.log("hi")
        // const imageBuffer = fs.readFileSync(imageUri)
        console.log("hi")
        // console.log(imageBuffer);
        // const imageName = imageUri.split('/').pop()
        const updateDocument = {
            $set: {
                name: formData.namee,
                firstImage: formData.firstImage,
                secondImage: formData.secondImage,
                thirdImage: formData.thirdImage,
                fourthImage: formData.fourthImage,
                // imageName:imageName,
                // imagePath:imageUri,
                // img1: formData.img1,
                // img2: formData.img2,
                // img3: formData.img3,
                // img4: formData.img4,
                bio: formData.aboutt,
                chillCounter : formData.chillCounter
            }
        }
        const insertedUser = await users.updateOne(query, updateDocument)

        res.json(insertedUser)

    } finally {
        // await client.close()
    }
})




app.post("/", async (req,res ) => {
    // const client = new MongoClient(uri);
    const formData = req.body;

    try{
        await client.connect();
        const database = client.db('chillinq')
        const users = database.collection('users')

        const query = {user_id: formData.user_id}

        const updateDocument = {
            $set: {
                year_of_birth: formData.year_of_birth,
                month_of_birth: formData.month_of_birth,
                date_of_birth: formData.date_of_birth,
                email: formData.email,
                profession: formData.profession,
                location: formData.location
            }
        }
        const insertedUser = await users.updateOne(query, updateDocument)

        res.json(insertedUser)

    } finally {
        // await client.close()
    }
})




app.get("user", async (req, res) => {


})



app.get("/users", async (req,res) => {
    // const client = new MongoClient(uri);
    
    try{
        await client.connect();
        const database = client.db("chillinq");
        const users = database.collection("users");
        const returnedUsers = await users.find().toArray();
        res.send(returnedUsers);
    }
    finally{
        // await client.close();
    }
})



app.post("/profile", async(req, res) =>{
    // const client = new MongoClient(uri);
    const mobileNumber = req.body;
    console.log("hi",mobileNumber);
    try{
        await client.connect();
        const database = client.db("chillinq");
        const users = database.collection("users");
        // const returnedUsers = await users.findOne({mobileNumber : {val:mobileNumber}})
        const returnedUsers = await users.findOne({mobileNumber})
        console.log(returnedUsers)
        res.status(201).json({returnedUsers, mobileNumber: mobileNumber})

    }
    finally{
        // await client.close()
    }
})







app.listen(process.env.PORT || 8000,function(){
    console.log("Server is running");
})

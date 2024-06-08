const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173"
    ],
    
  })
);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@artstore.tattjrs.mongodb.net/?retryWrites=true&w=majority&appName=ArtStore`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });


    const servicesCollection = client.db('serviceDB').collection('service');
    const testimonialsCollection = client.db('serviceDB').collection('testimonials');
    const usersCollection = client.db('serviceDB').collection('users');
    const workCollection = client.db('serviceDB').collection('work');


// * get api for services
app.get('/services',async(req,res)=> {
  const cursor = servicesCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})




// *get api for testimonials
app.get('/testimonials',async(req,res)=> {
  const cursor = testimonialsCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})



// !post api for user
app.post('/users', async (req,res)=> {
  const {name,email,role,image,bank_account_no,salary,designation} = req.body;

  const user = await usersCollection.findOne({email:email});
  if (user) {
    res.status(200).send('User already exists');
  }else {
    const userinfo = { name,email,role,image,bank_account_no,salary,designation}
    const result = await usersCollection.insertOne(userinfo);
    console.log(result)
    res.send(result)
    
  }
})

// ! post api for work-data
app.post('/work-list', async (req,res)=> {
  const workData = req.body;
  const result = await workCollection.insertOne(workData);
  console.log(result)
  res.send(result)
})


// * get api for user info
app.get('/users',async(req,res)=> {
  const email = req.query.email
  if(email){

    const query = { email : email};
    const result = await usersCollection.findOne(query);
    res.send(result);
  }else{
    const result = await usersCollection.find().toArray();
    res.send(result);
  }
})


// ? put api for update verify status
app.put('/users/:id',async (req,res)=>{
  const id = req.params.id;
  // const item = req.body.date;
  console.log(id);
  const filter = {_id : new ObjectId(id)};
  const options = {upsert : true};
  const updatedData = {
    $set: {
 isVerified: true
 }
  };
  const result = await usersCollection.updateOne(filter,updatedData,options);
  res.status(200).send(result);
})


// ? patch api for update verify status
app.patch('/users/:id',async (req,res)=>{
  const id = req.params.id;
  // const item = req.body.date;
  console.log(id);
  const filter = {_id : new ObjectId(id)};
  const options = {upsert : true};
  const updatedData = {
    $set: {
 role: "HR"
 }
  };
  const result = await usersCollection.updateOne(filter,updatedData,options);
  res.status(200).send(result);
})

// * get api for work data
app.get('/work-list', async(req,res)=> {
  const email = req.query.email;
  const query = { email : email};
  const cursor =  workCollection.find(query).sort({ date: -1 });
  const result = await cursor.toArray();
  res.send(result);
})


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res)=> {
    res.send('server running ')
})

app.listen(port, ()=>{
    console.log(`server running from ${port}`);
})
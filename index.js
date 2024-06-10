const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');


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
    const salaryCollection = client.db('serviceDB').collection('salary');


            // jwt related api
            app.post('/jwt', async(req,res)=>{
              const user = req.body;
              const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: "6h"});
              res.send({token});
            });

            // middlewares
            const verifyToken = (req,res,next) => {
              console.log("inside",req.headers);
              if(!req.headers.authorization){
                return res.status(401).send({message: 'Unauthorized Access'})
              }
              const token = req.headers.authorization.split(' ')[1];
              jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
                if(err){
                  return res.status(401).send({message: 'unauthorized access'})
                }
                req.decoded = decoded;
                next();
              })
            }
            
            
            // use verify hr after verify token
            const verifyHR = async(req,res,next) => {
              const email = req.decoded.email;
              const query = {email : email};
              const user = await usersCollection.findOne(query);
              const isHR = user?.role === 'HR';
              if(!isHR){
                return res.status(403).send({message: 'forbidden access'});
              }
            next()
            }


            // use verify admin after verify token
            const verifyAdmin = async (req,res,next) => {
              const email = req.decoded.email;
              const query = {email : email};
              const user = await usersCollection.findOne(query);
              const isAdmin = user?.role === 'admin';
              if(!isAdmin){
                return res.status(403).send({message: 'forbidden access'})
              }
              next()
            }

 



// get api for verify HR role
app.get('/users/hr/:email', verifyToken, async (req,res)=> {
  const email = req.params.email;
  if(email !== req.decoded.email){
    return res.status(403).send({message: 'Forbidden Access'})
  }

  const query = {email:email};
  const user = await usersCollection.findOne(query);
  let HR = false;
  if(user){
    HR = user?.role === 'HR';
  }
  res.send({HR})
})

// get api for verify admin role
app.get('/users/admin/:email', verifyToken, async (req,res)=> {
  const email = req.params.email;
  if(email !== req.decoded.email){
    return res.status(403).send({message: 'Forbidden Access'})
  }

  const query = {email:email};
  const user = await usersCollection.findOne(query);
  let admin = false;
  if(user){
    admin = user?.role === 'admin';
  }
  res.send({admin})
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




// ! post api for payment
app.post('/payment-history/:id',async (req,res)=>{
  const id = req.params.id;
 const {email,salary,month,year,name,employeeId} = req.body.data;
 console.log(email,salary,month,year);
 const alreadyPaid = await salaryCollection.findOne({month: month, year:year});
 if(alreadyPaid){
  res.status(200).send("already paid for selected month")
 }else {
  const paymentinfo = {email,salary,month,year,name,employeeId};
  const result = await salaryCollection.insertOne(paymentinfo);
  res.status(200).send(result)
 }

})


// ! post api for work-data
app.post('/work-list', async (req,res)=> {
  const workData = req.body;
  const result = await workCollection.insertOne(workData);
  res.send(result)
})


// * get api for user info
app.get('/users',async(req,res)=> {
  
  const email = req.query.email;
  if(email){
    const query = { email : email};
    const result1 = await usersCollection.findOne(query);

    res.send(result1);
  }else{
    const result2 = await usersCollection.find().toArray();
    res.send(result2);
  }
})

//  * get api for payment info
app.get('/payment-history', async (req,res)=>{
  const email =req.query.email;
  
  if(email){
    const query = {email : email};
  
    const result1 = await salaryCollection.find(query).toArray();
    res.status(200).send(result1);
  }else {
    const result2 = await salaryCollection.find().toArray();
    res.status(200).send(result2);
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


// ? put api for update employee fired status
app.patch('/users/:id',async (req,res)=>{
  const id = req.params.id;
 
  console.log(id);
  const filter = {_id : new ObjectId(id)};
  const options = {upsert : true};
  const updatedData = {
    $set: {
 isFired: true
 }
  };
  const result = await usersCollection.updateOne(filter,updatedData,options);
  res.status(200).send(result);
})



// ? patch api for update hr status
app.patch('/users/:id/HR',async (req,res)=>{
  const id = req.params.id;
  // const status = req.body.status;
  // console.log(status)
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
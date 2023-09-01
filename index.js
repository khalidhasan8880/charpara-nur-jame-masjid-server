const express = require('express');
var cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
var jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = 5000
app.use(cors())
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = process.env.URL

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


app.post("/jwt", (req,res)=>{
  const user = req?.body
  var token = jwt.sign(user, process.env.secrete_key);
  res.send({token})

})


async function run() {
  try {
    await client.connect()


    app.post('/add-resource', (req,res)=>{
      const data = req.body
     
    })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);



app.listen(port, ()=>{
    console.log('started' + port);
})
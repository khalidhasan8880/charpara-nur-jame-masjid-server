const express = require("express");
var cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = 5000;
app.use(cors());
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = process.env.URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.post("/jwt", (req, res) => {
  const user = req?.body;
  var token = jwt.sign(user, process.env.secrete_key);
  res.send({ token });
});
const verifyJWT = (req, res, next) => {
  const authorization = req.headers?.authorization;
  const email = req.query?.email;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.secrete_key, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    if (decoded.email === email) {
      req.decoded = decoded;
      next();
    } else {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
  });
};

async function run() {
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    const resourceCollection = client
      .db("charpara-nur-jame-masjid-DB")
      .collection("resources");
    const userCollection = client
      .db("charpara-nur-jame-masjid-DB")
      .collection("users");

    const verifyAdmin = async (req, res, next) => {
      const email = req.query?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      console.log(user);
      if (user?.role === "admin") {
        next();
      } else {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
    };
    // add resource
    app.post("/add/resource", verifyJWT, async (req, res) => {
      const data = req.body;
      const result = await resourceCollection.insertOne(data);
      res.send(result);
    });
    // save user in database
    app.post("/users", verifyJWT, async (req, res) => {
      const user = req.query;
      const filter = { email: user?.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // get resources
    // app.get("/bangla/resources", async(req, res)=>{
    //   const result = await resourceCollection.find({contentLanguage:'Bangla'}).toArray()
    //   res.send(result)
    // })

    app.get("/bangla/resources", async (req, res) => {
      try {
        const { page, pageSize } = req.query;
        const skip = (page - 1) * pageSize;

        const total = await resourceCollection.countDocuments({
          status: "approved",
        });
        const resources = await resourceCollection
          .find({ status: "approved", contentLanguage: "Bangla" })
          .skip(skip)
          .limit(parseInt(pageSize))
          .toArray();
        res.json({ resources, total });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    });
    app.get("/english/resources", async (req, res) => {
      try {
        const { page, pageSize } = req.query;
        const skip = (page - 1) * pageSize;

        const total = await resourceCollection.countDocuments({
          status: "approved",
        });
        const resources = await resourceCollection
          .find({ status: "approved", contentLanguage: "English" })
          .skip(skip)
          .limit(parseInt(pageSize))
          .toArray();
        res.json({ resources, total });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    });

    app.post("/isAdmin", verifyJWT, verifyAdmin, (req, res) => {
      console.log(req.headers.authorization);
      res.send({ isAdmin: true });
    });
    app.get("/website/data", verifyJWT, verifyAdmin, async (req, res) => {
      const totalUsers = await userCollection.estimatedDocumentCount()
      const totalResources = await resourceCollection.estimatedDocumentCount()
      const totalApprovedResources = await resourceCollection.countDocuments({status: "approved"})
      const result = {totalUsers, totalResources, totalApprovedResources, fund:0}
      res.send(result)
    });

    
    




    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("started" + port);
});

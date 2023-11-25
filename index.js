const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aj8rb8b.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const apartCollection = client.db("gulshanDb").collection("aparts")
        const userCollection = client.db("gulshanDb").collection("users")
        const agreementCollection = client.db("gulshanDb").collection("agreements")


        // Users related API
        app.post('/users', async (req, res) => {
            const user = req.body

            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: "User already exists", insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        // Get All Users
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        // Delete Users
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        // Get All Apartments
        app.get('/aparts', async (req, res) => {
            const result = await apartCollection.find().toArray()
            res.send(result);
        })

        // Post Agreement Collection
        app.post('/agreements', async (req, res) => {
            const agreement = req.body
            const result = await agreementCollection.insertOne(agreement)
            res.send(result)
        })

        // Get Agreement Collection of User
        app.get('/agreements', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await agreementCollection.find(query).toArray();
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to Gulshan Pride...')
})

app.listen(port, () => {
    console.log(`Gulshan Pride is running on port ${port}`)
})
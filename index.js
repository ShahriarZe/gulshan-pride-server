const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
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



        // ---JWT Authentication--
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.TOKEN, {
                expiresIn: '1h'
            })
            res.send({ token })
        })


        // ---Middlewares---

        const verifyToken = (req, res, next) => {
            console.log('Inside Verify Token', req.headers.authorization)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized Access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized Access' })
                }
                req.decoded = decoded
                next()
            })
        }

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'Admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next()
        }

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
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let admin = false
            if (user) {
                admin = user.role == 'Admin'
            }
            res.send({ admin })
        })

        // Delete Users
        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'Admin',
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
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
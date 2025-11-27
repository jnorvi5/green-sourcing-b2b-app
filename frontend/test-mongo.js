import { MongoClient, ServerApiVersion } from 'mongodb';

// CEO CHECK: Ensure your password is correct in this string
const uri = "mongodb+srv://ADMIN:ZS4fYc6umeF2z2AN@cluster0.q9gvyyg.mongodb.net/greenchainz?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    // Pinging the specific 'greenchainz' database
    await client.db("greenchainz").command({ ping: 1 });
    console.log("✅ SUCCESS: Connected to GreenChainz Database!");
  } catch (error) {
    console.error("❌ FAILURE:", error);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

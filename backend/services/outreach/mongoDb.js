/**
 * MongoDB Connection for Outreach Service
 * 
 * Provides MongoDB client for the outreach system
 * Falls back to in-memory storage if MongoDB is unavailable
 */

const { MongoClient } = require('mongodb');

let client = null;
let db = null;
let useInMemory = false;

// In-memory storage fallback
const inMemoryStore = {
    contacts: [],
    campaigns: [],
    events: [],
    enrollments: [],
    instructions: [],
    agent_runs: []
};

/**
 * Chainable cursor mock for in-memory queries
 */
class InMemoryCursor {
    constructor(data) {
        this._data = data;
        this._sortField = null;
        this._sortOrder = 1;
        this._skipCount = 0;
        this._limitCount = Infinity;
    }

    sort(sortObj) {
        if (sortObj && typeof sortObj === 'object') {
            const [field, order] = Object.entries(sortObj)[0] || [];
            if (field) {
                this._sortField = field;
                this._sortOrder = order || 1;
            }
        }
        return this;
    }

    skip(count) {
        this._skipCount = count || 0;
        return this;
    }

    limit(count) {
        this._limitCount = count || Infinity;
        return this;
    }

    async toArray() {
        let result = [...this._data];

        // Apply sort
        if (this._sortField) {
            result.sort((a, b) => {
                const aVal = a[this._sortField];
                const bVal = b[this._sortField];
                if (aVal < bVal) return -1 * this._sortOrder;
                if (aVal > bVal) return 1 * this._sortOrder;
                return 0;
            });
        }

        // Apply skip and limit
        result = result.slice(this._skipCount, this._skipCount + this._limitCount);

        return result;
    }
}

/**
 * In-memory collection mock that mimics MongoDB collection API
 */
class InMemoryCollection {
    constructor(name) {
        this.name = name;
        if (!inMemoryStore[name]) {
            inMemoryStore[name] = [];
        }
    }

    find(query = {}) {
        const data = inMemoryStore[this.name];
        // For simplicity, return all data (filtering would require complex query parsing)
        return new InMemoryCursor(data);
    }

    async findOne(query) {
        return inMemoryStore[this.name].find(item => {
            if (query._id) return item._id === query._id;
            return Object.keys(query).every(k => item[k] === query[k]);
        }) || null;
    }

    async insertOne(doc) {
        const _id = `inmem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDoc = { _id, ...doc, createdAt: new Date(), updatedAt: new Date() };
        inMemoryStore[this.name].push(newDoc);
        return { insertedId: _id, acknowledged: true };
    }

    async insertMany(docs) {
        const ids = [];
        for (const doc of docs) {
            const result = await this.insertOne(doc);
            ids.push(result.insertedId);
        }
        return { insertedIds: ids, acknowledged: true };
    }

    async updateOne(query, update) {
        const idx = inMemoryStore[this.name].findIndex(item => {
            if (query._id) return item._id === query._id;
            return Object.keys(query).every(k => item[k] === query[k]);
        });
        if (idx >= 0) {
            if (update.$set) {
                inMemoryStore[this.name][idx] = { ...inMemoryStore[this.name][idx], ...update.$set, updatedAt: new Date() };
            }
            return { matchedCount: 1, modifiedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0 };
    }

    async deleteOne(query) {
        const idx = inMemoryStore[this.name].findIndex(item => {
            if (query._id) return item._id === query._id;
            return Object.keys(query).every(k => item[k] === query[k]);
        });
        if (idx >= 0) {
            inMemoryStore[this.name].splice(idx, 1);
            return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
    }

    async countDocuments(query = {}) {
        return inMemoryStore[this.name].length;
    }

    async createIndex() {
        return true; // No-op for in-memory
    }

    async aggregate(pipeline) {
        // Simple aggregation mock
        return { toArray: async () => inMemoryStore[this.name] };
    }
}

/**
 * Connect to MongoDB
 */
async function connect() {
    if (db) return db;
    if (useInMemory) return { inMemory: true };

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn('[Outreach] No MONGODB_URI set, using in-memory storage');
        useInMemory = true;
        return { inMemory: true };
    }

    // Fix the URI if it has the wrong format (greenchainz=Cluster0 instead of greenchainz?...)
    let fixedUri = uri;
    if (uri.includes('greenchainz=')) {
        fixedUri = uri.replace('greenchainz=Cluster0', 'greenchainz?retryWrites=true&w=majority');
    }

    try {
        client = new MongoClient(fixedUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        await client.connect();
        db = client.db('greenchainz');
        console.log('[Outreach MongoDB] Connected successfully');
        return db;
    } catch (err) {
        console.error('[Outreach MongoDB] Connection error:', err.message);
        console.warn('[Outreach] Falling back to in-memory storage');
        useInMemory = true;
        return { inMemory: true };
    }
}

/**
 * Get database instance
 */
function getDb() {
    if (useInMemory) {
        return { inMemory: true };
    }
    if (!db) {
        throw new Error('Database not connected. Call connect() first.');
    }
    return db;
}

/**
 * Get a collection
 */
function getCollection(name) {
    if (useInMemory) {
        return new InMemoryCollection(name);
    }
    return getDb().collection(name);
}

/**
 * Check if using in-memory fallback
 */
function isInMemory() {
    return useInMemory;
}

/**
 * Close connection
 */
async function close() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('[Outreach MongoDB] Connection closed');
    }
}

module.exports = {
    connect,
    getDb,
    getCollection,
    isInMemory,
    close
};

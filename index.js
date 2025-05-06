// index.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const Redis = require('ioredis');
const cassandra = require('cassandra-driver');
const neo4j = require('neo4j-driver');

const app = express();
app.use(express.json());
// تسجيل كل طلب يصل للسيرفر
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

const PORT = 3000;

// ==== MongoDB ====
const mongoClient = new MongoClient('mongodb://127.0.0.1:27017');
let mongoDB;

// ==== InfluxDB ====
const influxDB = new InfluxDB({
  url: 'http://localhost:8086',
  token: 'mytoken'
});
const influxWrite = influxDB.getWriteApi('healthcare', 'patient_metrics');
const influxQuery = influxDB.getQueryApi('healthcare');

// ==== Redis ====
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379
});
redis.on('error', err => console.error('[Redis error]', err));

// ==== Cassandra ====
const cassandraClient = new cassandra.Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  keyspace: 'healthcare',
});

// ==== Neo4j ====
const neo4jDriver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password123')
);
const neo4jSession = neo4jDriver.session();

// ========== MONGODB ROUTES ==========
app.get('/patients', async (req, res) => {
  try {
    const patients = await mongoDB.collection('patients').find().toArray();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/patients', async (req, res) => {
  try {
    const result = await mongoDB.collection('patients').insertOne(req.body);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== INFLUXDB ROUTES ==========
app.post('/vitals', async (req, res) => {
  console.log('✅ Loaded /vitals route');
  const { patient_id, sensor_type, value } = req.body;
  const point = new Point('vitals')
    .tag('patient_id', patient_id)
    .tag('sensor_type', sensor_type)
    .floatField('value', value);
  influxWrite.writePoint(point);
  await influxWrite.flush();
  res.json({ message: 'Vitals written to InfluxDB' });
});

app.get('/vitals/:patient_id', async (req, res) => {
  const fluxQuery = `
    from(bucket: "patient_metrics")
      |> range(start: -1d)
      |> filter(fn: (r) => r["patient_id"] == "${req.params.patient_id}")
  `;
  let results = [];
  influxQuery.queryRows(fluxQuery, {
    next: (row, tableMeta) => results.push(tableMeta.toObject(row)),
    error: err => res.status(500).json({ error: err.toString() }),
    complete: () => res.json(results),
  });
});

// ========== REDIS ROUTES ==========
app.post('/alerts', async (req, res) => {
  try {
    const { patient_id, message } = req.body;
    const key = `alert:${patient_id}:${Date.now()}`;
    await redis.set(key, message);
    res.json({ message: 'Alert stored in Redis', key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/alerts/:patient_id', async (req, res) => {
  try {
    const keys = await redis.keys(`alert:${req.params.patient_id}:*`);
    const values = await Promise.all(keys.map(k => redis.get(k)));
    res.json({ alerts: values });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CASSANDRA ROUTES ==========
app.post('/analytics', async (req, res) => {
  try {
    const { patient_id, avg_heart_rate } = req.body;
    const query = `
      INSERT INTO realtime_analytics (patient_id, timestamp, avg_heart_rate)
      VALUES (?, toTimestamp(now()), ?)
    `;
    await cassandraClient.execute(query, [patient_id, avg_heart_rate], { prepare: true });
    res.json({ message: 'Analytics inserted into Cassandra' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== NEO4J ROUTES ==========
app.post('/relation', async (req, res) => {
  try {
    const { patient_id, patient_name, doctor_id, doctor_name } = req.body;
    await neo4jSession.run(
      `
      MERGE (p:Patient {id: $patient_id, name: $patient_name})
      MERGE (d:Doctor  {id: $doctor_id,  name: $doctor_name})
      MERGE (p)-[:TREATED_BY]->(d)
      `,
      { patient_id, patient_name, doctor_id, doctor_name }
    );
    res.json({ message: 'Relation added to Neo4j' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/relations', async (req, res) => {
  try {
    const result = await neo4jSession.run(
      `
      MATCH (p:Patient)-[:TREATED_BY]->(d:Doctor)
      RETURN p.name AS patient, d.name AS doctor
      `
    );
    res.json(
      result.records.map(r => ({
        patient: r.get('patient'),
        doctor: r.get('doctor'),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== SERVER START ==========
async function startServer() {
  try {
    await mongoClient.connect();
    mongoDB = mongoClient.db('healthcare');
    console.log('✅ Connected to MongoDB');

    await cassandraClient.connect();
    console.log('✅ Connected to Cassandra');

    app.listen(PORT, () => {
      console.log(`🚀 API server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

startServer();

// تأكّد في النهاية من إغلاق اتصال Neo4j عند الخروج
process.on('SIGINT', async () => {
  await neo4jSession.close();
  await neo4jDriver.close();
  process.exit(0);
});

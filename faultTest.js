const axios = require('axios');

const services = [
  {
    name: 'MongoDB - Add Patient',
    method: 'post',
    url: 'http://localhost:3000/patients',
    data: {
      patient_id: `FT${Date.now()}`,
      name: "Test User",
      age: 45,
      gender: "other",
      medical_history: ["stress"],
      region: "TestRegion"
    }
  },
  {
    name: 'InfluxDB - Add Vitals',
    method: 'post',
    url: 'http://localhost:3000/vitals',
    data: {
      patient_id: "FT001",
      sensor_type: "blood_pressure",
      value: 120
    }
  },
  {
    name: 'Redis - Add Alert',
    method: 'post',
    url: 'http://localhost:3000/alerts',
    data: {
      patient_id: "FT001",
      message: "Blood pressure too high"
    }
  },
  {
    name: 'Cassandra - Add Analytics',
    method: 'post',
    url: 'http://localhost:3000/analytics',
    data: {
      patient_id: "FT001",
      avg_heart_rate: 72
    }
  },
  {
    name: 'Neo4j - Add Relation',
    method: 'post',
    url: 'http://localhost:3000/relation',
    data: {
      patient_id: "FT001",
      patient_name: "Test User",
      doctor_id: "DRFT01",
      doctor_name: "Dr. Fault Tolerance"
    }
  }
];

async function runTests() {
  console.log("🧪 Starting fault tolerance test...");
  for (const service of services) {
    try {
      const res = await axios({
        method: service.method,
        url: service.url,
        data: service.data
      });
      console.log(`✅ ${service.name}: Success (${res.status})`);
    } catch (error) {
      console.error(`❌ ${service.name}: Failed - ${error.message}`);
    }
  }
}

runTests();

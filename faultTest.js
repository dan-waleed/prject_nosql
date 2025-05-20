const axios = require('axios');

class DatabaseTester {
  constructor() {
    this.patientId = `FT${Date.now()}`;
    this.services = [
      {
        name: 'MongoDB - Add Patient',
        method: 'post',
        url: 'http://localhost:3000/patients',
        data: {
          patient_id: this.patientId,
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
          patient_id: this.patientId,
          sensor_type: "blood_pressure",
          value: 120
        }
      },
      {
        name: 'Redis - Add Alert',
        method: 'post',
        url: 'http://localhost:3000/alerts',
        data: {
          patient_id: this.patientId,
          message: "Blood pressure too high"
        }
      },
      {
        name: 'Cassandra - API Insert',
        method: 'post',
        url: 'http://localhost:3000/analytics',
        data: {
          patient_id: this.patientId,
          avg_heart_rate: 72
        }
      },
      {
        name: 'Neo4j - Add Relation',
        method: 'post',
        url: 'http://localhost:3000/relation',
        data: {
          patient_id: this.patientId,
          patient_name: "Test User",
          doctor_id: "DRFT01",
          doctor_name: "Dr. Fault Tolerance"
        }
      }
    ];
  }

  async run() {
    console.log("🧪 بدء اختبار تحمل الخطأ...");
    console.log(`🆔 معرف المريض المستخدم: ${this.patientId}`);

    for (const service of this.services) {
      try {
        const result = await axios({
          method: service.method,
          url: service.url,
          data: service.data,
          timeout: 5000
        });

        console.log(`✅ ${service.name}: pass (${result.status})`);
        if (result.data) {
          console.log(` response : ${JSON.stringify(result.data)}`);
        }
      } catch (error) {
        console.error(`❌ ${service.name}: fail - ${error.message}`);
        if (error.response) {
          console.error(` response from the node  : ${JSON.stringify(error.response.data)}`);
        }
      }
      console.log('---');
    }

    process.exit(0);
  }
}

// تشغيل الاختبار
const tester = new DatabaseTester();
tester.run();

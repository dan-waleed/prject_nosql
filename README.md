# Healthcare System for Patient Monitoring

## Overview
This project implements a healthcare system for patient monitoring using multiple NoSQL databases to manage patient data, real-time measurements, doctor-patient relationships, analytics, and alerts. The system ensures scalability, high availability, and fault tolerance, with a focus on meeting diverse consistency requirements.

This repository contains the prototype implementation, configuration files, sample queries, and a presentation for the project.

---

## Project Requirements
The system addresses the following:
- **Data Storage**:
  - Document Database: Patient information (e.g., name, medical history).
  - Time-Series Database: Real-time body measurements (e.g., heartbeat, blood pressure).
  - Graph Database: Doctor-patient relationships.
  - Column-Family Database: Real-time patient data analytics.
  - Key-Value Database: Abnormal readings and alert notifications.
- **Scalability**: Partition patients by region via sharding; replicate for availability.
- **Consistency**: Strong consistency for medical records; eventual consistency for analytics.
- **Fault Tolerance**: Handle node failures and network partitions.
- **Performance**: Optimize with indexing, caching, and replication tuning.
- **Prototype**: Data models, CRUD operations, queries, and fault tolerance demos.
- **Presentation**: 20-minute overview of use case, implementation, and lessons learned.

---

## Database Selection
| Database | Type | Purpose | Justification | Trade-offs |
|----------|------|---------|---------------|------------|
| **MongoDB** | Document | Patient info | Flexible schema, sharding by region, strong consistency | Higher latency for complex queries |
| **InfluxDB** | Time-Series | Vital signs | High write throughput, time-series optimization | Limited for non-time-series data |
| **Neo4j** | Graph | Relationships | Efficient for relationship queries | Slower for high write throughput |
| **Cassandra** | Column-Family | Analytics | High write throughput, tunable consistency | Complex query design |
| **Redis** | Key-Value | Alerts | Low-latency caching, pub/sub for alerts | Limited querying capabilities |

---

## Data Model
- **MongoDB (Patients)**:
  ```json
  {
    "_id": ObjectId,
    "region": "north",
    "name": "John Doe",
    "medical_history": [{ "condition": "Hypertension", "diagnosed": ISODate }]
  }

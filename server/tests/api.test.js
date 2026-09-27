import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { ApprovedStudent } from '../src/models/ApprovedStudent.js';
import { Grievance } from '../src/models/Grievance.js';
import { runEscalationSweep } from '../src/jobs/escalationJob.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/smart_grievance_portal';
let app;

describe('Smart Grievance Portal - Backend Test Suite', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    app = createApp(MONGO_URI);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  describe('1. Health Check Endpoint', () => {
    test('GET /health returns healthy status', async () => {
      const res = await request(app).get('/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'healthy');
    });
  });

  describe('2. Authentication & Session Security', () => {
    test('POST /api/auth/login fails with invalid credentials (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@university.edu',
        password: 'WrongPassword!',
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('POST /api/auth/login succeeds with valid seeded student credentials (200)', async () => {
      const agent = request.agent(app);
      const res = await agent.post('/api/auth/login').send({
        email: 'aarav.sharma@student.university.edu',
        password: 'Password123!',
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.role, 'student');
      assert.equal(res.body.user.institutionalId, 'MU0321282938');

      // Test session persistence via GET /api/auth/me
      const meRes = await agent.get('/api/auth/me');
      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.user.email, 'aarav.sharma@student.university.edu');

      // Test Logout
      const logoutRes = await agent.post('/api/auth/logout');
      assert.equal(logoutRes.status, 200);

      // Verify unauthenticated after logout
      const afterLogoutRes = await agent.get('/api/auth/me');
      assert.equal(afterLogoutRes.status, 401);
    });
  });

  describe('3. Institutional Verification on Registration', () => {
    test('Registration fails if ID is NOT in approved roster (403)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        role: 'student',
        institutionalId: 'FAKE999999',
        name: 'Intruder User',
        email: 'intruder@random.com',
        department: 'Computer Science',
        year: 2,
        division: 'A',
        password: 'Password123!',
      });
      assert.equal(res.status, 403);
      assert.match(res.body.message, /Institutional verification failed/i);
    });

    test('Registration succeeds with unclaimed approved student record (201)', async () => {
      // Clean up previous test run registration state if present
      await User.deleteOne({ email: 'rohan.gupta@student.university.edu' });
      await ApprovedStudent.updateOne({ institutionalId: 'MU0321282940' }, { isClaimed: false, claimedAt: null });

      const res = await request(app).post('/api/auth/register').send({
        role: 'student',
        institutionalId: 'MU0321282940',
        name: 'Rohan Gupta',
        email: 'rohan.gupta@student.university.edu',
        department: 'Mechanical Engineering',
        year: 4,
        division: 'A',
        password: 'NewSecurePassword123!',
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.institutionalId, 'MU0321282940');

      // Verify record is now claimed
      const approved = await ApprovedStudent.findOne({ institutionalId: 'MU0321282940' });
      assert.equal(approved.isClaimed, true);
    });

    test('Registration fails if approved ID is already claimed (409)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        role: 'student',
        institutionalId: 'MU0321282940',
        name: 'Rohan Gupta',
        email: 'rohan.gupta@student.university.edu',
        department: 'Mechanical Engineering',
        year: 4,
        division: 'A',
        password: 'AnotherPassword123!',
      });
      assert.equal(res.status, 409);
    });
  });

  describe('4. Role-Based Authorization & Endpoint Protection', () => {
    test('Unauthenticated user cannot access /api/grievances (401)', async () => {
      const res = await request(app).get('/api/grievances');
      assert.equal(res.status, 401);
    });

    test('Student cannot access Admin Analytics /api/admin/analytics (403)', async () => {
      const studentAgent = request.agent(app);
      await studentAgent.post('/api/auth/login').send({
        email: 'aarav.sharma@student.university.edu',
        password: 'Password123!',
      });

      const res = await studentAgent.get('/api/admin/analytics');
      assert.equal(res.status, 403);
    });

    test('Teacher cannot access Admin Analytics /api/admin/analytics (403)', async () => {
      const teacherAgent = request.agent(app);
      await teacherAgent.post('/api/auth/login').send({
        email: 'rajesh.verma@faculty.university.edu',
        password: 'Password123!',
      });

      const res = await teacherAgent.get('/api/admin/analytics');
      assert.equal(res.status, 403);
    });

    test('Admin CAN access /api/admin/analytics (200) with calculated metrics', async () => {
      const adminAgent = request.agent(app);
      await adminAgent.post('/api/auth/login').send({
        email: 'admin@university.edu',
        password: 'Password123!',
      });

      const res = await adminAgent.get('/api/admin/analytics');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.metrics.totalGrievances === 'number');
      assert.ok(typeof res.body.metrics.pendingCount === 'number');
      assert.ok(typeof res.body.metrics.escalatedCount === 'number');
    });
  });

  describe('5. Duplicate Detection & AI Assistant', () => {
    test('Duplicate check detects active complaint by same student', async () => {
      const studentUser = await User.findOne({ email: 'aarav.sharma@student.university.edu' });
      // Create a test fixture grievance for Aarav Sharma to test duplicate detection
      const testGrievance = await Grievance.create({
        trackingId: 'TEST-GRV-0001',
        title: 'WiFi Connectivity Failure in Lab 3',
        description: 'The wifi is not working in lab 3 from yesterday and our online coding practical test is scheduled.',
        category: 'IT / Network',
        location: 'Computer Lab 3, 2nd Floor, CS Block',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        student: studentUser._id,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const studentAgent = request.agent(app);
      await studentAgent.post('/api/auth/login').send({
        email: 'aarav.sharma@student.university.edu',
        password: 'Password123!',
      });

      const res = await studentAgent.post('/api/grievances/check-duplicates').send({
        title: 'WiFi is down in lab 3',
        description: 'Cannot connect to lab 3 wifi for our test',
        category: 'IT / Network',
        location: 'Computer Lab 3, 2nd Floor, CS Block',
      });

      // Clean up test fixture
      await Grievance.deleteOne({ _id: testGrievance._id });

      assert.equal(res.status, 200);
      assert.equal(res.body.hasSameStudentDuplicate, true);
      assert.ok(res.body.sameStudentDuplicate.similarity > 50);
    });

    test('AI Draft Assistant returns suggestions and clean title', async () => {
      const studentAgent = request.agent(app);
      await studentAgent.post('/api/auth/login').send({
        email: 'aarav.sharma@student.university.edu',
        password: 'Password123!',
      });

      const res = await studentAgent.post('/api/ai/assist-draft').send({
        title: 'water leaking from toilet ceiling',
        description: 'water is leaking non stop from the ceiling in 2nd floor restroom',
        location: 'Restroom 2nd floor',
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.suggestions.suggestedCategory, 'Infrastructure');
    });
  });

  describe('6. 24-Hour SLA Automatic Escalation Sweep', () => {
    test('runEscalationSweep identifies overdue items and escalates to admin', async () => {
      const studentUser = await User.findOne({ email: 'aarav.sharma@student.university.edu' });
      // Create an overdue test fixture
      const overdueGrievance = await Grievance.create({
        trackingId: 'TEST-GRV-OVERDUE',
        title: 'Broken Overhead Projector in Room 204',
        description: 'Projector flickers and shuts down within 5 minutes of class.',
        category: 'Infrastructure',
        location: 'Room 204, Academic Block A',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        student: studentUser._id,
        dueAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours overdue
      });

      const sweepResult = await runEscalationSweep();
      assert.ok(sweepResult);
      assert.ok(typeof sweepResult.escalatedCount === 'number');

      // Verify that all ESCALATED grievances have escalatedAt populated
      const escalatedGrievance = await Grievance.findById(overdueGrievance._id);
      assert.equal(escalatedGrievance.status, 'ESCALATED');
      assert.ok(escalatedGrievance.escalatedAt);

      // Clean up test fixture
      await Grievance.deleteOne({ _id: overdueGrievance._id });
    });
  });
});

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ApprovedStudent } from '../models/ApprovedStudent.js';
import { ApprovedTeacher } from '../models/ApprovedTeacher.js';
import { Category } from '../models/Category.js';
import { Grievance } from '../models/Grievance.js';
import { CommonIssue } from '../models/CommonIssue.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { Feedback } from '../models/Feedback.js';
import { AuditLog } from '../models/AuditLog.js';
import { Department } from '../models/Department.js';
import { Worker } from '../models/Worker.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing old collections...');

    await Promise.all([
      User.deleteMany({}),
      ApprovedStudent.deleteMany({}),
      ApprovedTeacher.deleteMany({}),
      Category.deleteMany({}),
      Grievance.deleteMany({}),
      CommonIssue.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      AuditLog.deleteMany({}),
      Department.deleteMany({}),
      Worker.deleteMany({}),
    ]);

    console.log('[Seed] Cleaned database.');

    // 0. Seed Departments
    const departmentsData = [
      { name: 'IT / Network', code: 'IT', description: 'Network connectivity, Wi-Fi, computer labs, software & servers', defaultSlaHours: 24 },
      { name: 'Maintenance & Electrical', code: 'MAINT', description: 'Classroom hardware, lighting, fans, ACs, plumbing & electricals', defaultSlaHours: 24 },
      { name: 'Examination & Records', code: 'EXAM', description: 'Exam hall tickets, grade statements, paper re-evaluation', defaultSlaHours: 24 },
      { name: 'Accounts & Fees', code: 'ACCT', description: 'Tuition fees, challans, scholarships & refund processing', defaultSlaHours: 24 },
      { name: 'Library Services', code: 'LIB', description: 'Physical books, digital journals & reading room facilities', defaultSlaHours: 24 },
      { name: 'AV & Technical Support', code: 'AV', description: 'Smart boards, projectors, audio systems & seminar hall setups', defaultSlaHours: 24 },
      { name: 'Hostel & Mess', code: 'HOSTEL', description: 'Hostel room allotments, hot water & mess food quality', defaultSlaHours: 24 },
      { name: 'Administration', code: 'ADMIN', description: 'Bonafide certificates, ID cards & general institutional services', defaultSlaHours: 24 },
    ];
    const createdDepts = await Department.insertMany(departmentsData);
    console.log(`[Seed] Seeded ${createdDepts.length} departments.`);

    const itDept = createdDepts.find((d) => d.code === 'IT');
    const maintDept = createdDepts.find((d) => d.code === 'MAINT');
    const examDept = createdDepts.find((d) => d.code === 'EXAM');
    const avDept = createdDepts.find((d) => d.code === 'AV');

    // 0.1 Seed Workers
    const workersData = [
      {
        name: 'Rahul Sharma',
        employeeId: 'EMP-IT-001',
        email: 'rahul.sharma@staff.university.edu',
        phone: '+91 98765 43210',
        department: itDept._id,
        designation: 'Network Technician',
        specialization: 'Wi-Fi Access Points & Router Setup',
        currentWorkload: 0,
      },
      {
        name: 'Amit Patil',
        employeeId: 'EMP-IT-002',
        email: 'amit.patil@staff.university.edu',
        phone: '+91 98765 43211',
        department: itDept._id,
        designation: 'Hardware Technician',
        specialization: 'Lab PC Repair & OS Setup',
        currentWorkload: 0,
      },
      {
        name: 'Suresh Kumar',
        employeeId: 'EMP-MAINT-001',
        email: 'suresh.kumar@staff.university.edu',
        phone: '+91 98765 43212',
        department: maintDept._id,
        designation: 'Electrician',
        specialization: 'High-voltage wiring & AC servicing',
        currentWorkload: 0,
      },
      {
        name: 'Anita Desai',
        employeeId: 'EMP-EXAM-001',
        email: 'anita.desai@staff.university.edu',
        phone: '+91 98765 43213',
        department: examDept._id,
        designation: 'Records Specialist',
        specialization: 'Grade Statements & Transcripts',
        currentWorkload: 0,
      },
      {
        name: 'Vikram Singh',
        employeeId: 'EMP-AV-001',
        email: 'vikram.singh@staff.university.edu',
        phone: '+91 98765 43214',
        department: avDept._id,
        designation: 'AV Technician',
        specialization: 'Smart Projectors & Auditorium Sound',
        currentWorkload: 0,
      },
    ];
    const createdWorkers = await Worker.insertMany(workersData);
    console.log(`[Seed] Seeded ${createdWorkers.length} workers.`);

    // 1. Seed Categories
    const categoriesData = [
      { name: 'Academic', description: 'Curriculum, lectures, attendance, courses', defaultPriority: 'MEDIUM', slaHours: 24 },
      { name: 'Examination', description: 'Exam halls, paper evaluation, hall tickets, grades', defaultPriority: 'HIGH', slaHours: 24 },
      { name: 'IT / Network', description: 'WiFi, lab PCs, student portal, networking', defaultPriority: 'HIGH', slaHours: 24 },
      { name: 'Infrastructure', description: 'Classroom fans, lighting, projectors, washrooms', defaultPriority: 'MEDIUM', slaHours: 24 },
      { name: 'Library', description: 'Book availability, digital access, reading rooms', defaultPriority: 'LOW', slaHours: 24 },
      { name: 'Hostel', description: 'Hostel rooms, mess food, hygiene, hot water', defaultPriority: 'HIGH', slaHours: 24 },
      { name: 'Fees', description: 'Tuition payment, challans, scholarships, refunds', defaultPriority: 'MEDIUM', slaHours: 24 },
      { name: 'Faculty', description: 'Faculty counseling, scheduling, mentor guidance', defaultPriority: 'MEDIUM', slaHours: 24 },
      { name: 'Administration', description: 'Identity cards, bonafide certificates, official transcripts', defaultPriority: 'LOW', slaHours: 24 },
      { name: 'Transport', description: 'College buses, parking facilities, shuttle services', defaultPriority: 'LOW', slaHours: 24 },
      { name: 'Other', description: 'General campus queries or special requests', defaultPriority: 'MEDIUM', slaHours: 24 },
    ];
    await Category.insertMany(categoriesData);
    console.log(`[Seed] Seeded ${categoriesData.length} categories.`);

    // 2. Seed Approved Students Whitelist
    const approvedStudents = [
      {
        institutionalId: 'MU0321282938',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@student.university.edu',
        department: 'Computer Science',
        year: 3,
        division: 'A',
        isClaimed: true,
        claimedAt: new Date(),
      },
      {
        institutionalId: 'MU0321282939',
        name: 'Priya Patel',
        email: 'priya.patel@student.university.edu',
        department: 'Computer Science',
        year: 2,
        division: 'B',
        isClaimed: true,
        claimedAt: new Date(),
      },
      {
        institutionalId: 'MU0321282940',
        name: 'Rohan Gupta',
        email: 'rohan.gupta@student.university.edu',
        department: 'Mechanical Engineering',
        year: 4,
        division: 'A',
        isClaimed: false, // Unclaimed - ready for manual test registration!
      },
      {
        institutionalId: 'MU0321282941',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@student.university.edu',
        department: 'Electronics Engineering',
        year: 1,
        division: 'C',
        isClaimed: false, // Unclaimed - ready for manual test registration!
      },
    ];
    await ApprovedStudent.insertMany(approvedStudents);
    console.log(`[Seed] Seeded ${approvedStudents.length} approved student records.`);

    // 3. Seed Approved Teachers Whitelist
    const approvedTeachers = [
      {
        institutionalId: 'FAC1042',
        name: 'Prof. Rajesh Verma',
        email: 'rajesh.verma@faculty.university.edu',
        department: 'Computer Science',
        designation: 'Associate Professor',
        isClaimed: true,
        claimedAt: new Date(),
      },
      {
        institutionalId: 'FAC1043',
        name: 'Dr. Sunita Rao',
        email: 'sunita.rao@faculty.university.edu',
        department: 'IT / Network',
        designation: 'Head of IT Services',
        isClaimed: true,
        claimedAt: new Date(),
      },
      {
        institutionalId: 'FAC1044',
        name: 'Prof. Vikram Malhotra',
        email: 'vikram.malhotra@faculty.university.edu',
        department: 'Mechanical Engineering',
        designation: 'Assistant Professor',
        isClaimed: false, // Unclaimed - ready for manual faculty registration!
      },
    ];
    await ApprovedTeacher.insertMany(approvedTeachers);
    console.log(`[Seed] Seeded ${approvedTeachers.length} approved faculty records.`);

    // 4. Create Seed Users via passport-local-mongoose
    // Admin User
    const adminUser = new User({
      institutionalId: 'ADMIN001',
      name: 'Dr. Aris Thorne (Dean)',
      email: 'admin@university.edu',
      role: 'admin',
      department: 'Administration',
      isVerified: true,
      isActive: true,
    });
    await User.register(adminUser, 'Password123!');

    // Teacher 1
    const teacher1 = new User({
      institutionalId: 'FAC1042',
      name: 'Prof. Rajesh Verma',
      email: 'rajesh.verma@faculty.university.edu',
      role: 'teacher',
      department: 'Computer Science',
      isVerified: true,
      isActive: true,
    });
    await User.register(teacher1, 'Password123!');

    // Teacher 2
    const teacher2 = new User({
      institutionalId: 'FAC1043',
      name: 'Dr. Sunita Rao',
      email: 'sunita.rao@faculty.university.edu',
      role: 'teacher',
      department: 'IT / Network',
      isVerified: true,
      isActive: true,
    });
    await User.register(teacher2, 'Password123!');

    // Student 1 (Aarav Sharma)
    const student1 = new User({
      institutionalId: 'MU0321282938',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@student.university.edu',
      role: 'student',
      department: 'Computer Science',
      year: 3,
      division: 'A',
      isVerified: true,
      isActive: true,
    });
    await User.register(student1, 'Password123!');

    // Student 2 (Priya Patel)
    const student2 = new User({
      institutionalId: 'MU0321282939',
      name: 'Priya Patel',
      email: 'priya.patel@student.university.edu',
      role: 'student',
      department: 'Computer Science',
      year: 2,
      division: 'B',
      isVerified: true,
      isActive: true,
    });
    await User.register(student2, 'Password123!');

    console.log('[Seed] Registered demo users (Admin, 2 Teachers, 2 Students).');

    // 5. Seed Common Campus Issue
    const commonIssue1 = await CommonIssue.create({
      title: 'Lab 3 WiFi Access Point Malfunction',
      description: 'Recurring disconnection and authentication failures affecting all machines connected to AP-03 in Lab 3.',
      category: 'IT / Network',
      location: 'Computer Lab 3, 2nd Floor, CS Block',
      status: 'IN_PROGRESS',
      assignedTeacher: teacher2._id,
      affectedStudentCount: 2,
      createdBy: adminUser._id,
    });

    // 6. Automatic Grievance Generation (Disabled by default)
    const shouldSeedGrievances =
      process.env.SEED_SAMPLE_GRIEVANCES === 'true' ||
      process.argv.includes('--with-sample-grievances');

    if (shouldSeedGrievances) {
      console.log('[Seed] Seeding sample test grievances (--with-sample-grievances enabled)...');
      const now = new Date();

      // Grievance 1: In Progress, linked to Common Issue, 18 hours left on 24h SLA
      const created6hAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const dueIn18Hours = new Date(created6hAgo.getTime() + 24 * 60 * 60 * 1000);
      const grv1 = await Grievance.create({
        trackingId: 'GRV-2026-0001',
        title: 'WiFi Connectivity Failure in Lab 3',
        description: 'The wifi is not working in lab 3 from yesterday and our online coding practical test is scheduled for tomorrow morning.',
        category: 'IT / Network',
        location: 'Computer Lab 3, 2nd Floor, CS Block',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        student: student1._id,
        assignedTeacher: teacher2._id,
        commonIssue: commonIssue1._id,
        createdAt: created6hAgo,
        dueAt: dueIn18Hours,
        aiAnalysis: {
          suggestedCategory: 'IT / Network',
          suggestedPriority: 'HIGH',
          summary: 'WiFi connectivity failure in Lab 3 affecting upcoming practical exam.',
          confidence: 0.94,
        },
      });

      // Grievance 2: Another student reporting the same incident
      const created10hAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
      const dueIn14Hours = new Date(created10hAgo.getTime() + 24 * 60 * 60 * 1000);
      const grv2 = await Grievance.create({
        trackingId: 'GRV-2026-0002',
        title: 'Cannot Connect to Internet in Computer Laboratory 3',
        description: 'Internet unavailable in Lab 3 PCs during afternoon laboratory session.',
        category: 'IT / Network',
        location: 'Computer Lab 3, 2nd Floor, CS Block',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        student: student2._id,
        assignedTeacher: teacher2._id,
        commonIssue: commonIssue1._id,
        createdAt: created10hAgo,
        dueAt: dueIn14Hours,
        aiAnalysis: {
          suggestedCategory: 'IT / Network',
          suggestedPriority: 'HIGH',
          summary: 'Network disruption in Computer Lab 3.',
          confidence: 0.91,
        },
      });

      // Link grievances to common issue
      commonIssue1.grievances = [grv1._id, grv2._id];
      await commonIssue1.save();

      // Grievance 3: Overdue / Escalated
      const created28hAgo = new Date(now.getTime() - 28 * 60 * 60 * 1000);
      const due4hAgo = new Date(created28hAgo.getTime() + 24 * 60 * 60 * 1000);
      const grv3 = await Grievance.create({
        trackingId: 'GRV-2026-0003',
        title: 'Broken Overhead Projector in Room 204',
        description: 'The projector in Lecture Hall 204 flickers and shuts down within 5 minutes of starting class.',
        category: 'Infrastructure',
        location: 'Room 204, Academic Block A',
        priority: 'MEDIUM',
        status: 'ESCALATED',
        student: student1._id,
        assignedTeacher: teacher1._id,
        createdAt: created28hAgo,
        dueAt: due4hAgo,
        escalatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        aiAnalysis: {
          suggestedCategory: 'Infrastructure',
          suggestedPriority: 'MEDIUM',
          summary: 'Faulty ceiling projector in Lecture Room 204.',
          confidence: 0.88,
        },
      });

      // Grievance 4: Resolved with student feedback
      const created14hAgo = new Date(now.getTime() - 14 * 60 * 60 * 1000);
      const dueIn10Hours = new Date(created14hAgo.getTime() + 24 * 60 * 60 * 1000);
      const resolvedDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const grv4 = await Grievance.create({
        trackingId: 'GRV-2026-0004',
        title: 'Discrepancy in Mid-Term Internal Marks',
        description: 'My Data Structures internal test marks were entered as 14 instead of 24 on the university portal.',
        category: 'Examination',
        location: 'CS Department Faculty Office',
        priority: 'HIGH',
        status: 'RESOLVED',
        student: student1._id,
        assignedTeacher: teacher1._id,
        createdAt: created14hAgo,
        dueAt: dueIn10Hours,
        resolvedAt: resolvedDate,
        resolution: {
          actionTaken: 'Verified mark sheet with examination committee and updated the official score register to 24.',
          notes: 'Marks rectifed on portal.',
          resolvedBy: teacher1._id,
          resolvedAt: resolvedDate,
        },
      });

      // Feedback for Grievance 4
      await Feedback.create({
        grievance: grv4._id,
        student: student1._id,
        rating: 5,
        comment: 'Thank you Prof. Verma for rectifying the marks promptly!',
        timelinessRating: 5,
        satisfactionRating: 5,
      });

      // 7. Seed Discussion Messages on Grievance 1
      await Message.create([
        {
          grievance: grv1._id,
          sender: student1._id,
          senderRole: 'student',
          message: 'Hello sir, could you please check this urgently as our practical test is scheduled for tomorrow at 9 AM?',
        },
        {
          grievance: grv1._id,
          sender: teacher2._id,
          senderRole: 'teacher',
          message: 'Thank you for reporting. The IT technician has been dispatched to inspect Lab 3.',
        },
      ]);

      // 8. Seed Notifications
      await Notification.create([
        {
          recipient: student1._id,
          title: 'Officer Reply: GRV-2026-0001',
          message: 'Dr. Sunita Rao posted an update on your Lab 3 WiFi grievance.',
          type: 'MESSAGE',
          link: `/student/grievances/${grv1._id}`,
          grievance: grv1._id,
        },
      ]);

      // 9. Seed Audit Logs
      await AuditLog.create([
        {
          grievance: grv1._id,
          user: student1._id,
          role: 'student',
          action: 'GRIEVANCE_SUBMITTED',
          details: 'Aarav Sharma submitted grievance GRV-2026-0001 in IT / Network.',
        },
      ]);
    } else {
      console.log('[Seed] Automatic complaint generation disabled: No automatic complaints created.');
      console.log('[Seed] Students and faculty start with a clean empty complaints directory.');
    }

    console.log('[Seed] Database successfully initialized with institutional infrastructure!');
    console.log('\n================ TEST CREDENTIALS ================');
    console.log('ADMIN:');
    console.log('  Email:    admin@university.edu');
    console.log('  Password: Password123!');
    console.log('TEACHER (Faculty):');
    console.log('  Email:    rajesh.verma@faculty.university.edu');
    console.log('  Password: Password123!');
    console.log('TEACHER 2 (IT Head):');
    console.log('  Email:    sunita.rao@faculty.university.edu');
    console.log('  Password: Password123!');
    console.log('STUDENT (Pre-registered):');
    console.log('  Email:    aarav.sharma@student.university.edu');
    console.log('  ID:       MU0321282938');
    console.log('  Password: Password123!');
    console.log('STUDENT (Unclaimed ID for new registration):');
    console.log('  ID:       MU0321282940');
    console.log('  Name:     Rohan Gupta');
    console.log('  Email:    rohan.gupta@student.university.edu');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();

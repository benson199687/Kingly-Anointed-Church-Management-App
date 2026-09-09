import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());

let dbPath = path.join(process.cwd(), "src", "db.json");

if (process.env.VERCEL) {
  const tmpPath = path.join("/tmp", "db.json");
  try {
    if (!fs.existsSync(tmpPath)) {
      if (fs.existsSync(dbPath)) {
        const content = fs.readFileSync(dbPath, "utf-8");
        fs.writeFileSync(tmpPath, content, "utf-8");
      }
    }
    dbPath = tmpPath;
  } catch (e) {
    console.warn("Could not copy database to /tmp, using default path:", e);
  }
}

const DEFAULT_USERS = [
  { id: "1", name: "Pastor Benson Nyirenda", email: "benson.nyirenda@goodnatureagro.com", password: "bensonnyirenda", role: "pastor", pastorType: "main", memberSince: "2010-01-01", mfaEnabled: false, phone: "+260 977 111111", spiritualGrowthLevel: "Spiritual Father / Pastor", xp: 950 },
  { id: "2", name: "Deaconess Celina", email: "celina@church.org", password: "celinadecon", role: "deacon", memberSince: "2018-05-12", mfaEnabled: false, phone: "+260 977 222222", spiritualGrowthLevel: "Group Shepherd", xp: 450 },
  { id: "3", name: "Pastor John", email: "john@church.org", password: "pastorjohn", role: "elder", memberSince: "2012-04-10", mfaEnabled: false, phone: "+260 977 333333", spiritualGrowthLevel: "Disciple Maker", xp: 750 },
  { id: "4", name: "Deaconess Winnie Nyirenda", email: "winnie@church.org", password: "winnienyirenda", role: "deacon", memberSince: "2018-03-20", mfaEnabled: false, phone: "+260 977 444444", spiritualGrowthLevel: "Group Shepherd", xp: 500 },
  { id: "5", name: "Pastor Teddy", email: "teddy@church.org", password: "pastorteddy", role: "pastor", memberSince: "2011-08-15", mfaEnabled: false, phone: "+260 977 555555", spiritualGrowthLevel: "Spiritual Father / Pastor", xp: 900 },
  { id: "6", name: "Elder Chileshe", email: "chileshe@church.org", password: "elderchileshe", role: "elder", memberSince: "2015-02-14", mfaEnabled: false, phone: "+260 977 666666", spiritualGrowthLevel: "Disciple Maker", xp: 600 },
  { id: "7", name: "Elder Sem", email: "sem@church.org", password: "eldersem", role: "elder", memberSince: "2016-11-20", mfaEnabled: false, phone: "+260 977 777777", spiritualGrowthLevel: "Disciple Maker", xp: 580 },
  { id: "8", name: "Deacon Mukandawile", email: "mukandawile@church.org", password: "deaconmukandawile", role: "deacon", memberSince: "2019-07-05", mfaEnabled: false, phone: "+260 977 888888", spiritualGrowthLevel: "Group Shepherd", xp: 420 },
  { id: "9", name: "System Administrator", email: "admin@church.org", password: "admin123", role: "admin", memberSince: "2010-01-01", mfaEnabled: false, phone: "+260 977 999999" },
];

const DEFAULT_MESSAGES = [
  { id: "msg1", from: "Pastor Benson", preview: "This Sunday's service outline is complete...", content: "Hello! This Sunday's service outline is complete and published. I look forward to shepherding you all and studying God's word together. Blessings!", time: "2h ago", unread: true },
  { id: "msg2", from: "Elder James", preview: "Please remember to submit your monthly shepherding care logs...", content: "Grace and peace to you. Deacons and Elders, please ensure your shepherding connection logs are uploaded by Friday so we can review prayer requests in detail. Thank you.", time: "5h ago", unread: true },
  { id: "msg3", from: "Church Admin", preview: "New bulletin posted regarding annual church fundraiser...", content: "The annual church fundraiser is coming up next month. We need volunteers for hospitality, setting up the tables, and welcoming guests. Please sign up at the office.", time: "Yesterday", unread: false },
  { id: "msg4", from: "Sarah Johnson", preview: "Thank you for the wonderful prayers! God has healed my family...", content: "I wanted to share a praise report! Thank you for praying for my mother last week. The doctor says she is completely clear now. Praise the Lord!", time: "2 days ago", unread: false },
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif_1",
    title: "Request to Add Member",
    message: "Brother Abel Phiri would like to join the Men's Fellowship Small Group.",
    type: "connection_request",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    fromUser: "Brother Abel Phiri",
    targetGroupId: "3",
    personName: "Abel Phiri",
    status: "pending"
  },
  {
    id: "notif_2",
    title: "Connection Invitation Request",
    message: "Sister Martha Banda requested to add her cousin Mary Banda to the Women of Faith Group.",
    type: "connection_request",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    fromUser: "Sister Martha Banda",
    targetGroupId: "2",
    personName: "Mary Banda",
    status: "pending"
  },
  {
    id: "notif_3",
    title: "New Believer Connection",
    message: "Pastor Benson requested a deacon or elder to connect with newly baptized member John Tembo.",
    type: "connection_request",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    fromUser: "Pastor Benson",
    targetGroupId: "1",
    personName: "John Tembo",
    status: "pending"
  }
];

// Helper to read JSON database
function readDb() {
  try {
    let db: any = {};
    let needsWrite = false;
    if (!fs.existsSync(dbPath)) {
      db = {
        churches: [],
        members: [],
        events: [],
        sermons: [],
        prayerRequests: [],
        announcements: [],
        finances: { income: [], expenses: [] },
        attendance: [],
        tasks: [],
        quizzes: [],
        groups: []
      };
      needsWrite = true;
    } else {
      const raw = fs.readFileSync(dbPath, "utf-8");
      db = JSON.parse(raw);
    }

    if (!db.users) {
      db.users = [...DEFAULT_USERS];
      needsWrite = true;
    }
    if (!db.messages) {
      db.messages = [...DEFAULT_MESSAGES];
      needsWrite = true;
    }
    if (!db.loginHistory) {
      db.loginHistory = [];
      needsWrite = true;
    }
    if (!db.notifications) {
      db.notifications = [...DEFAULT_NOTIFICATIONS];
      needsWrite = true;
    }
    if (!db.dashboardStats) {
      db.dashboardStats = [
        { 
          id: "sermons_watched", 
          label: "Sermons Watched", 
          val: "12", 
          imageUrl: "https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?w=600&auto=format&fit=crop&q=60" 
        },
        { 
          id: "services_attended", 
          label: "Services Attended", 
          val: "8", 
          imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60" 
        },
        { 
          id: "groups_joined", 
          label: "Groups Joined", 
          val: "3", 
          imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&auto=format&fit=crop&q=60" 
        },
        { 
          id: "prayer_requests", 
          label: "Prayer Requests", 
          val: "2", 
          imageUrl: "https://images.unsplash.com/photo-1438263308737-6e5a7a1a157e?w=600&auto=format&fit=crop&q=60" 
        }
      ];
      needsWrite = true;
    }

    if (needsWrite) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    }
    return db;
  } catch (error) {
    console.error("Error reading JSON database:", error);
    return {
      users: DEFAULT_USERS,
      messages: DEFAULT_MESSAGES,
      loginHistory: []
    };
  }
}

// Helper to write JSON database
function writeDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing JSON database:", error);
  }
}

// Deletion Approval Request Helper
function handleDeleteRequest(req: express.Request, res: express.Response, itemType: string, itemId: string, itemName: string, parentId: string | null, deleteCallback: (db: any) => void) {
  const role = (req.query.role as string) || "member";
  const userName = (req.query.userName as string) || "Administrator";
  const db = readDb();

  if (role === "pastor") {
    deleteCallback(db);
    writeDb(db);
    return res.json({ success: true, state: db });
  } else if (role === "admin") {
    const newNotif = {
      id: "notif_del_" + Date.now(),
      title: "Pending Deletion Approval",
      message: `Admin ${userName} requested to delete ${itemType.replace("_", " ")} '${itemName}'.`,
      type: "deletion_request",
      timestamp: new Date().toISOString(),
      fromUser: userName,
      itemType,
      itemId,
      parentId,
      itemName,
      status: "pending"
    };
    db.notifications = db.notifications || [];
    db.notifications.unshift(newNotif);
    writeDb(db);
    return res.json({ success: true, pendingApproval: true, state: db });
  } else {
    return res.status(403).json({ success: false, message: "Only Pastor and Admin can delete data." });
  }
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// --- API ENDPOINTS ---

// Full Database Fetch
app.get("/api/db", (req, res) => {
  res.json(readDb());
});

// State Fetch
app.get("/api/state", (req, res) => {
  const role = req.query.role;
  const db = readDb();
  if (role && role !== "pastor" && role !== "admin") {
    if (db.groups) {
      db.groups = db.groups.filter((g: any) => {
        const isCourse = g.type === "class" || g.leader?.toLowerCase().includes("teacher") || g.name?.toLowerCase().includes("class") || g.name?.toLowerCase().includes("training");
        if (isCourse) {
          const status = (g.status || "published").toLowerCase();
          return status === "published";
        }
        return true;
      });
    }
  }
  res.json({ success: true, state: db });
});

// Churches
app.get("/api/churches", (req, res) => {
  res.json(readDb().churches || []);
});

app.post("/api/churches/:id", (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, denomination } = req.body;
  const db = readDb();
  if (!db.churches) {
    db.churches = [];
  }
  let church = db.churches.find((c: any) => c.id === id);
  if (!church) {
    church = {
      id: id,
      name: "Church Kingly Anointed App",
      address: "123 Faith Ave, Lusaka, Zambia",
      phone: "+260 977 123 456",
      email: "info@gracechurch.org",
      denomination: "Non-denominational"
    };
    db.churches.push(church);
  }
  
  church.name = name || church.name;
  if (address !== undefined) church.address = address;
  if (phone !== undefined) church.phone = phone;
  if (email !== undefined) church.email = email;
  if (denomination !== undefined) church.denomination = denomination;
  if (req.body.youtubeUrl !== undefined) church.youtubeUrl = req.body.youtubeUrl;

  writeDb(db);
  res.json({ success: true, church, state: db });
});

// Authentication
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  const db = readDb();
  let user;
  
  if (role) {
    user = db.users.find((u: any) => u.role === role);
  } else if (email && password) {
    const searchKey = email.trim().toLowerCase();
    const cleanPhone = (p: string) => p ? p.replace(/[^0-9]/g, "") : "";
    const searchPhoneDigits = searchKey.replace(/[^0-9]/g, "");

    user = db.users.find((u: any) => {
      const emailMatches = u.email && u.email.toLowerCase() === searchKey;
      const phoneMatches = u.phone && searchPhoneDigits.length >= 6 && cleanPhone(u.phone).endsWith(searchPhoneDigits);
      return (emailMatches || phoneMatches) && u.password === password;
    });
  }

  if (user) {
    if (user.mfaEnabled) {
      // Generate 6-digit MFA code
      const mfaCode = String(Math.floor(100000 + Math.random() * 900000));
      user.mfaCode = mfaCode;
      writeDb(db);

      // Return status requiring MFA and pass temp code for sandbox ease-of-use (displayed via UI Toast)
      return res.json({ 
        success: true, 
        mfaRequired: true, 
        email: user.email,
        tempCode: mfaCode
      });
    }

    // Log successful login
    const loginRecord = {
      id: String(Date.now()),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      ipAddress: "197.221.144.15 (Lusaka, Zambia)",
      device: "Chrome / Windows 11 (Secure Web)",
      status: "Success",
      mfaVerified: false
    };
    db.loginHistory = db.loginHistory || [];
    db.loginHistory.push(loginRecord);
    writeDb(db);

    res.json({ success: true, user });
  } else {
    // Log failed login
    const loginRecord = {
      id: String(Date.now()),
      userId: "unknown",
      userName: "Anonymous Guest",
      userEmail: email || "unknown@church.org",
      userRole: "none",
      timestamp: new Date().toISOString(),
      ipAddress: "197.221.144.15 (Lusaka, Zambia)",
      device: "Chrome / Unknown Browser OS",
      status: "Failed (Invalid Credentials)",
      mfaVerified: false
    };
    db.loginHistory = db.loginHistory || [];
    db.loginHistory.push(loginRecord);
    writeDb(db);

    res.status(401).json({ success: false, message: "Invalid email or password" });
  }
});

app.post("/api/auth/verify-mfa", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Email and code are required." });
  }
  const db = readDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
  
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (user.mfaCode && String(user.mfaCode) === String(code)) {
    user.mfaCode = null; // Clear code
    
    // Log successful MFA login
    const loginRecord = {
      id: String(Date.now()),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      ipAddress: "197.221.144.15 (Lusaka, Zambia)",
      device: "Chrome / Windows 11 (2FA Verified)",
      status: "Success (MFA Verified)",
      mfaVerified: true
    };
    db.loginHistory = db.loginHistory || [];
    db.loginHistory.push(loginRecord);
    writeDb(db);

    res.json({ success: true, user });
  } else {
    // Log failed MFA verification
    const loginRecord = {
      id: String(Date.now()),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      ipAddress: "197.221.144.15 (Lusaka, Zambia)",
      device: "Chrome / Windows 11 (MFA Error)",
      status: "Failed (MFA Code Incorrect)",
      mfaVerified: false
    };
    db.loginHistory = db.loginHistory || [];
    db.loginHistory.push(loginRecord);
    writeDb(db);

    res.status(401).json({ success: false, message: "Invalid 2FA verification code." });
  }
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }
  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "No account registered with this email address." });
  }

  // Generate a reset code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.users[userIndex].resetCode = code;
  writeDb(db);

  // In sandbox, we return the code directly so client can toast it!
  res.json({ success: true, message: "Reset code generated successfully.", tempCode: code });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: "Email, code, and new password are required." });
  }
  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const user = db.users[userIndex];
  if (user.resetCode && String(user.resetCode) === String(code)) {
    user.password = newPassword;
    user.resetCode = null;
    writeDb(db);
    res.json({ success: true, message: "Password updated successfully." });
  } else {
    res.status(400).json({ success: false, message: "Invalid password reset verification code." });
  }
});

app.post("/api/auth/toggle-mfa", (req, res) => {
  const { email, enabled } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }
  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  db.users[userIndex].mfaEnabled = !!enabled;
  writeDb(db);
  res.json({ success: true, message: `MFA updated successfully.`, user: db.users[userIndex] });
});

app.get("/api/auth/login-history", (req, res) => {
  res.json(readDb().loginHistory || []);
});

// Dynamic Messaging
app.get("/api/messages", (req, res) => {
  res.json(readDb().messages || []);
});

app.post("/api/messages", (req, res) => {
  const { from, to, groupId, preview, content, attachmentType, attachmentId } = req.body;
  if (!from || !preview || !content) {
    return res.status(400).json({ success: false, message: "From, preview, and content are required." });
  }
  const db = readDb();
  const newMessage = {
    id: "msg_" + Date.now(),
    from,
    to: to || undefined,
    groupId: groupId || undefined,
    preview,
    content,
    time: "Just now",
    unread: true,
    attachmentType: attachmentType || undefined,
    attachmentId: attachmentId || undefined
  };
  db.messages = db.messages || [];
  db.messages.unshift(newMessage);
  writeDb(db);
  res.json({ success: true, message: newMessage, state: db });
});

// Admin User Accounts Management
app.get("/api/users", (req, res) => {
  res.json(readDb().users || []);
});

app.post("/api/users", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "Name, email, password, and role are required." });
  }
  const db = readDb();
  const exists = db.users.some((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: "A user account with this email already exists." });
  }

  const newUser = {
    id: String(Date.now()),
    name,
    email: email.trim().toLowerCase(),
    password,
    role,
    memberSince: new Date().toISOString().split("T")[0],
    mfaEnabled: false,
    pastorType: req.body.pastorType,
    spiritualGrowthLevel: role === "pastor" && req.body.pastorType === "main" ? "Spiritual Father / Pastor" : (role === "pastor" ? "Ministry Volunteer" : "Visitor")
  };

  db.users.push(newUser);

  // Auto-sync user as a congregation member too!
  db.members = db.members || [];
  db.members.push({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: "+260 977 111 222",
    memberSince: newUser.memberSince,
    status: "active",
    role: newUser.role,
    attendance: 100,
    groups: [],
    pastorType: newUser.pastorType,
    spiritualGrowthLevel: newUser.spiritualGrowthLevel
  });

  writeDb(db);
  res.json({ success: true, user: newUser, state: db });
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.users = db.users.filter((u: any) => u.id !== id);
  db.members = db.members.filter((m: any) => m.id !== id);
  writeDb(db);
  res.json({ success: true, state: db });
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { 
    name, email, role, password, phone, 
    spiritualGrowthLevel, classEnrollment, xp, 
    isMinistryVolunteer, assignedMembersLog, 
    assignedAttendanceDuty, assignedFinanceDuty,
    pastorType
  } = req.body;
  const db = readDb();

  db.users = db.users || [];
  db.users = db.users.map((u: any) => {
    if (u.id === id) {
      return {
        ...u,
        name: name !== undefined ? name : u.name,
        email: email !== undefined ? email : u.email,
        role: role !== undefined ? role : u.role,
        phone: phone !== undefined ? phone : u.phone,
        password: (password !== undefined && password.trim() !== "") ? password : u.password,
        spiritualGrowthLevel: spiritualGrowthLevel !== undefined ? spiritualGrowthLevel : u.spiritualGrowthLevel,
        classEnrollment: classEnrollment !== undefined ? classEnrollment : u.classEnrollment,
        xp: xp !== undefined ? (isNaN(Number(xp)) ? u.xp : Number(xp)) : u.xp,
        isMinistryVolunteer: isMinistryVolunteer !== undefined ? (isMinistryVolunteer === true || isMinistryVolunteer === "true") : u.isMinistryVolunteer,
        assignedMembersLog: assignedMembersLog !== undefined ? (assignedMembersLog === true || assignedMembersLog === "true") : u.assignedMembersLog,
        assignedAttendanceDuty: assignedAttendanceDuty !== undefined ? (assignedAttendanceDuty === true || assignedAttendanceDuty === "true") : u.assignedAttendanceDuty,
        assignedFinanceDuty: assignedFinanceDuty !== undefined ? (assignedFinanceDuty === true || assignedFinanceDuty === "true") : u.assignedFinanceDuty,
        pastorType: pastorType !== undefined ? pastorType : u.pastorType
      };
    }
    return u;
  });

  db.members = db.members || [];
  db.members = db.members.map((m: any) => {
    if (m.id === id) {
      return {
        ...m,
        name: name !== undefined ? name : m.name,
        email: email !== undefined ? email : m.email,
        phone: phone !== undefined ? phone : m.phone,
        role: role !== undefined ? role : m.role,
        spiritualGrowthLevel: spiritualGrowthLevel !== undefined ? spiritualGrowthLevel : m.spiritualGrowthLevel,
        classEnrollment: classEnrollment !== undefined ? classEnrollment : m.classEnrollment,
        xp: xp !== undefined ? (isNaN(Number(xp)) ? m.xp : Number(xp)) : m.xp,
        isMinistryVolunteer: isMinistryVolunteer !== undefined ? (isMinistryVolunteer === true || isMinistryVolunteer === "true") : m.isMinistryVolunteer,
        assignedMembersLog: assignedMembersLog !== undefined ? (assignedMembersLog === true || assignedMembersLog === "true") : m.assignedMembersLog,
        assignedAttendanceDuty: assignedAttendanceDuty !== undefined ? (assignedAttendanceDuty === true || assignedAttendanceDuty === "true") : m.assignedAttendanceDuty,
        assignedFinanceDuty: assignedFinanceDuty !== undefined ? (assignedFinanceDuty === true || assignedFinanceDuty === "true") : m.assignedFinanceDuty,
        pastorType: pastorType !== undefined ? pastorType : m.pastorType
      };
    }
    return m;
  });

  writeDb(db);
  res.json({ success: true, state: db });
});

app.put("/api/members/:id", (req, res) => {
  const { id } = req.params;
  const { 
    name, email, phone, role, status, attendance, password,
    spiritualGrowthLevel, classEnrollment, xp, 
    isMinistryVolunteer, assignedMembersLog,
    assignedAttendanceDuty, assignedFinanceDuty,
    pastorType, spiritualGrowthNote
  } = req.body;
  const db = readDb();
  
  db.members = db.members || [];
  db.members = db.members.map((m: any) => {
    if (m.id === id || (email && m.email?.toLowerCase() === email.toLowerCase())) {
      return {
        ...m,
        name: name !== undefined ? name : m.name,
        email: email !== undefined ? email : m.email,
        phone: phone !== undefined ? phone : m.phone,
        role: role !== undefined ? role : m.role,
        status: status !== undefined ? status : m.status,
        attendance: attendance !== undefined ? Number(attendance) : m.attendance,
        spiritualGrowthLevel: spiritualGrowthLevel !== undefined ? spiritualGrowthLevel : m.spiritualGrowthLevel,
        classEnrollment: classEnrollment !== undefined ? classEnrollment : m.classEnrollment,
        xp: xp !== undefined ? (isNaN(Number(xp)) ? m.xp : Number(xp)) : m.xp,
        isMinistryVolunteer: isMinistryVolunteer !== undefined ? (isMinistryVolunteer === true || isMinistryVolunteer === "true") : m.isMinistryVolunteer,
        assignedMembersLog: assignedMembersLog !== undefined ? (assignedMembersLog === true || assignedMembersLog === "true") : m.assignedMembersLog,
        assignedAttendanceDuty: assignedAttendanceDuty !== undefined ? (assignedAttendanceDuty === true || assignedAttendanceDuty === "true") : m.assignedAttendanceDuty,
        assignedFinanceDuty: assignedFinanceDuty !== undefined ? (assignedFinanceDuty === true || assignedFinanceDuty === "true") : m.assignedFinanceDuty,
        pastorType: pastorType !== undefined ? pastorType : m.pastorType,
        spiritualGrowthNote: spiritualGrowthNote !== undefined ? spiritualGrowthNote : m.spiritualGrowthNote
      };
    }
    return m;
  });

  db.users = db.users || [];
  db.users = db.users.map((u: any) => {
    if (u.id === id || (email && u.email?.toLowerCase() === email.toLowerCase())) {
      return {
        ...u,
        name: name !== undefined ? name : u.name,
        email: email !== undefined ? email : u.email,
        phone: phone !== undefined ? phone : u.phone,
        role: role !== undefined ? role : u.role,
        password: (password !== undefined && password.trim() !== "") ? password : u.password,
        spiritualGrowthLevel: spiritualGrowthLevel !== undefined ? spiritualGrowthLevel : u.spiritualGrowthLevel,
        classEnrollment: classEnrollment !== undefined ? classEnrollment : u.classEnrollment,
        xp: xp !== undefined ? (isNaN(Number(xp)) ? u.xp : Number(xp)) : u.xp,
        isMinistryVolunteer: isMinistryVolunteer !== undefined ? (isMinistryVolunteer === true || isMinistryVolunteer === "true") : u.isMinistryVolunteer,
        assignedMembersLog: assignedMembersLog !== undefined ? (assignedMembersLog === true || assignedMembersLog === "true") : u.assignedMembersLog,
        assignedAttendanceDuty: assignedAttendanceDuty !== undefined ? (assignedAttendanceDuty === true || assignedAttendanceDuty === "true") : u.assignedAttendanceDuty,
        assignedFinanceDuty: assignedFinanceDuty !== undefined ? (assignedFinanceDuty === true || assignedFinanceDuty === "true") : u.assignedFinanceDuty,
        pastorType: pastorType !== undefined ? pastorType : u.pastorType,
        spiritualGrowthNote: spiritualGrowthNote !== undefined ? spiritualGrowthNote : u.spiritualGrowthNote
      };
    }
    return u;
  });

  writeDb(db);
  res.json({ success: true, state: db });
});

app.delete("/api/members/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const member = (db.members || []).find((m: any) => m.id === id);
  const memberName = member ? member.name : "Member Profile";

  handleDeleteRequest(req, res, "member", id, memberName, null, (database) => {
    database.members = (database.members || []).filter((m: any) => m.id !== id);
    database.users = (database.users || []).filter((u: any) => u.id !== id);
  });
});

// Members
app.post("/api/members", (req, res) => {
  const db = readDb();
  const newMember = {
    id: String(Date.now()),
    status: "active" as const,
    attendance: 100,
    groups: [],
    ...req.body
  };
  db.members = db.members || [];
  db.members.push(newMember);
  writeDb(db);
  res.json({ success: true, member: newMember, state: db });
});

app.post("/api/members/bulk", (req, res) => {
  const { members } = req.body;
  if (!Array.isArray(members)) {
    return res.status(400).json({ success: false, message: "Members list must be an array." });
  }
  const db = readDb();
  db.members = db.members || [];
  const today = new Date().toISOString().split("T")[0];
  const addedMembers: any[] = [];
  members.forEach((m: any, i: number) => {
    const newMember = {
      id: String(Date.now() + i),
      status: "active" as const,
      attendance: 100,
      groups: [],
      memberSince: today,
      name: m.name || "Unknown Member",
      email: m.email || `contact_${Date.now() + i}@church.org`,
      phone: m.phone || "",
      role: m.role || "member",
    };
    db.members.push(newMember);
    addedMembers.push(newMember);
  });
  writeDb(db);
  res.json({ success: true, members: addedMembers, state: db });
});

// Events
app.post("/api/events", (req, res) => {
  const db = readDb();
  const newEvent = {
    id: String(Date.now()),
    attendees: 0,
    ...req.body
  };
  db.events = db.events || [];
  db.events.push(newEvent);
  writeDb(db);
  res.json({ success: true, event: newEvent, state: db });
});

app.post("/api/events/:id/rsvp", (req, res) => {
  const db = readDb();
  const event = db.events?.find((e: any) => e.id === req.params.id);
  if (event) {
    event.attendees = Math.min((event.attendees || 0) + 1, event.capacity || 300);
    writeDb(db);
    res.json({ success: true, event, state: db });
  } else {
    res.status(404).json({ success: false, message: "Event not found" });
  }
});

// Sermons
app.post("/api/dashboard-stats", (req, res) => {
  const { stats } = req.body;
  if (!stats || !Array.isArray(stats)) {
    return res.status(400).json({ success: false, message: "Stats array is required" });
  }
  const db = readDb();
  db.dashboardStats = stats;
  writeDb(db);
  res.json({ success: true, state: db });
});

app.post("/api/sermons", (req, res) => {
  const db = readDb();
  const newSermon = {
    id: String(Date.now()),
    views: 0,
    ...req.body
  };
  db.sermons = db.sermons || [];
  db.sermons.push(newSermon);
  writeDb(db);
  res.json({ success: true, sermon: newSermon, state: db });
});

app.patch("/api/sermons/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.sermons?.findIndex((s: any) => s.id === id);
  if (index !== -1 && db.sermons) {
    db.sermons[index] = { ...db.sermons[index], ...req.body };
    writeDb(db);
    res.json({ success: true, sermon: db.sermons[index], state: db });
  } else {
    res.status(404).json({ success: false, message: "Sermon not found" });
  }
});

app.delete("/api/sermons/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.sermons = db.sermons || [];
  const sermon = db.sermons.find((s: any) => s.id === id);
  if (!sermon) {
    return res.status(404).json({ success: false, message: "Sermon not found" });
  }

  handleDeleteRequest(req, res, "sermon", id, sermon.title, null, (database) => {
    database.sermons = (database.sermons || []).filter((s: any) => s.id !== id);
  });
});

// Prayer Requests
app.post("/api/prayer-requests", (req, res) => {
  const db = readDb();
  const newRequest = {
    id: String(Date.now()),
    prayers: 1,
    status: "active" as const,
    date: new Date().toISOString().split("T")[0],
    ...req.body
  };
  db.prayerRequests = db.prayerRequests || [];
  db.prayerRequests.push(newRequest);
  writeDb(db);
  res.json({ success: true, request: newRequest, state: db });
});

app.post("/api/prayer-requests/:id/pray", (req, res) => {
  const { userName } = req.body;
  if (!userName) {
    return res.status(400).json({ success: false, message: "userName is required to pray." });
  }
  const db = readDb();
  const request = db.prayerRequests?.find((p: any) => p.id === req.params.id);
  if (request) {
    const today = new Date().toISOString().split("T")[0];
    request.likedBy = request.likedBy || [];
    
    // Check if user has liked this request today
    const alreadyLikedToday = request.likedBy.some(
      (like: any) => like.userName === userName && like.date === today
    );
    
    if (alreadyLikedToday) {
      return res.json({ 
        success: false, 
        message: "You have already liked and prayed for this request today! Please lift them up again tomorrow." 
      });
    }

    // Add to likedBy list
    request.likedBy.push({ userName, date: today });
    request.prayers = (request.prayers || 0) + 1;

    // Send notification to the prayer request's owner
    if (request.member && request.member !== "Anonymous" && request.member !== userName) {
      const newNotif = {
        id: "notif_" + Date.now(),
        title: "New Prayer Partner Alert",
        message: `${userName} liked your prayer request and is praying with you!`,
        type: "prayer_alert" as const,
        timestamp: new Date().toISOString(),
        fromUser: userName,
        targetUser: userName, // The person who liked, i.e., who B will send a thank you message to
        personName: request.member, // The owner of the prayer request (recipient of notification)
        prayerRequestId: request.id,
        status: "pending" as const,
        thankYouSent: false
      };
      db.notifications = db.notifications || [];
      db.notifications.unshift(newNotif);
    }

    writeDb(db);
    res.json({ success: true, request, state: db });
  } else {
    res.status(404).json({ success: false, message: "Prayer request not found" });
  }
});

// Thank you for prayer endpoint
app.post("/api/notifications/:id/thank-you", (req, res) => {
  const { id } = req.params;
  const { fromUser, messageText } = req.body;
  const db = readDb();
  const notification = db.notifications?.find((n: any) => n.id === id);
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }

  const recipient = notification.targetUser;
  if (!recipient) {
    return res.status(400).json({ success: false, message: "No target user specified for thank you message." });
  }

  // Create a direct message to targetUser
  const thankYouMessage = {
    id: "msg_" + Date.now(),
    from: fromUser,
    to: recipient,
    preview: "Thank you for praying with me!",
    content: messageText || `Dear ${recipient}, thank you so much for praying with me and lifting up my request. May God bless you!`,
    time: "Just now",
    unread: true,
    attachmentType: "prayer_thankyou" as const,
    attachmentId: notification.prayerRequestId
  };

  db.messages = db.messages || [];
  db.messages.unshift(thankYouMessage);

  // Mark notification as resolved
  notification.status = "approved";
  notification.thankYouSent = true;

  writeDb(db);
  res.json({ success: true, notification, message: thankYouMessage, state: db });
});

app.post("/api/prayer-requests/:id/answer", (req, res) => {
  const db = readDb();
  const request = db.prayerRequests?.find((p: any) => p.id === req.params.id);
  if (request) {
    request.status = "answered";
    writeDb(db);
    res.json({ success: true, request, state: db });
  } else {
    res.status(404).json({ success: false, message: "Prayer request not found" });
  }
});

// Announcements
app.post("/api/announcements", (req, res) => {
  const db = readDb();
  const newAnnouncement = {
    id: String(Date.now()),
    date: new Date().toISOString().split("T")[0],
    pinned: false,
    expires: null,
    ...req.body
  };
  db.announcements = db.announcements || [];
  db.announcements.push(newAnnouncement);
  writeDb(db);
  res.json({ success: true, announcement: newAnnouncement, state: db });
});

// Like Announcement
app.post("/api/announcements/:id/like", (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;
  const db = readDb();
  db.announcements = db.announcements || [];
  const ann = db.announcements.find((a: any) => a.id === id);
  if (ann) {
    ann.likes = ann.likes || [];
    const index = ann.likes.indexOf(userName);
    if (index > -1) {
      ann.likes.splice(index, 1);
    } else {
      ann.likes.push(userName);
    }
    writeDb(db);
    res.json({ success: true, announcement: ann, state: db });
  } else {
    res.status(404).json({ success: false, message: "Announcement not found" });
  }
});

// Comment on Announcement
app.post("/api/announcements/:id/comment", (req, res) => {
  const { id } = req.params;
  const { author, role, content } = req.body;
  const db = readDb();
  db.announcements = db.announcements || [];
  const ann = db.announcements.find((a: any) => a.id === id);
  if (ann) {
    ann.comments = ann.comments || [];
    const newComment = {
      id: String(Date.now()),
      author,
      role: role || "member",
      content,
      date: new Date().toISOString()
    };
    ann.comments.push(newComment);
    writeDb(db);
    res.json({ success: true, comment: newComment, announcement: ann, state: db });
  } else {
    res.status(404).json({ success: false, message: "Announcement not found" });
  }
});

// Share Announcement increment
app.post("/api/announcements/:id/share", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.announcements = db.announcements || [];
  const ann = db.announcements.find((a: any) => a.id === id);
  if (ann) {
    ann.sharesCount = (ann.sharesCount || 0) + 1;
    writeDb(db);
    res.json({ success: true, announcement: ann, state: db });
  } else {
    res.status(404).json({ success: false, message: "Announcement not found" });
  }
});

// Finances / Giving
app.get("/api/finances/offering-types", (req, res) => {
  const db = readDb();
  if (!db.finances) {
    db.finances = { income: [], expenses: [] };
  }
  db.finances.offeringTypes = db.finances.offeringTypes || ["Tithe", "Offering", "Building Fund", "Missions Care", "Benevolence", "Thanksgiving"];
  res.json({ success: true, offeringTypes: db.finances.offeringTypes });
});

app.post("/api/finances/offering-types", (req, res) => {
  const { name } = req.body;
  const db = readDb();
  if (!db.finances) {
    db.finances = { income: [], expenses: [] };
  }
  db.finances.offeringTypes = db.finances.offeringTypes || ["Tithe", "Offering", "Building Fund", "Missions Care", "Benevolence", "Thanksgiving"];
  
  if (name && !db.finances.offeringTypes.includes(name)) {
    db.finances.offeringTypes.push(name);
  }
  writeDb(db);
  res.json({ success: true, offeringTypes: db.finances.offeringTypes, state: db });
});

app.post("/api/finances", (req, res) => {
  const db = readDb();
  const { type, category, amount, name, submittedBy, submittedRole, status } = req.body;
  
  const autoApproved = 
    submittedRole === "pastor" || 
    submittedRole === "admin" || 
    name?.includes("(Online)") || 
    status === "approved";

  const newTransaction = {
    id: String(Date.now()),
    date: new Date().toISOString().split("T")[0],
    type: type || "income",
    category: category || "Offering",
    amount: Number(amount) || 0,
    name: name || "Anonymous",
    submittedBy: submittedBy || "System",
    submittedRole: submittedRole || "member",
    status: autoApproved ? "approved" : "pending"
  };
  
  if (!db.finances) {
    db.finances = { income: [], expenses: [] };
  }

  if (newTransaction.type === "income") {
    db.finances.income = db.finances.income || [];
    db.finances.income.push(newTransaction);
  } else {
    db.finances.expenses = db.finances.expenses || [];
    db.finances.expenses.push(newTransaction);
  }
  
  writeDb(db);
  res.json({ success: true, transaction: newTransaction, state: db });
});

app.post("/api/finances/:id/approve", (req, res) => {
  const { id } = req.params;
  const { approvedBy } = req.body;
  const db = readDb();
  if (db.finances) {
    let found = false;
    const approveTx = (tx: any) => {
      if (tx.id === id) {
        tx.status = "approved";
        tx.approvedBy = approvedBy || "Pastor/Elder";
        tx.approvedDate = new Date().toISOString().split("T")[0];
        found = true;
      }
    };
    (db.finances.income || []).forEach(approveTx);
    (db.finances.expenses || []).forEach(approveTx);
    if (found) {
      writeDb(db);
      return res.json({ success: true, state: db });
    }
  }
  res.status(404).json({ success: false, message: "Transaction not found" });
});

app.post("/api/finances/:id/reject", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (db.finances) {
    let found = false;
    const rejectTx = (tx: any) => {
      if (tx.id === id) {
        tx.status = "rejected";
        found = true;
      }
    };
    (db.finances.income || []).forEach(rejectTx);
    (db.finances.expenses || []).forEach(rejectTx);
    if (found) {
      writeDb(db);
      return res.json({ success: true, state: db });
    }
  }
  res.status(404).json({ success: false, message: "Transaction not found" });
});

app.post("/api/finances/mobile-money", (req, res) => {
  const db = readDb();
  const { amount, phone, senderName, reference, network } = req.body;
  if (!amount || !phone || !senderName) {
    return res.status(400).json({ success: false, message: "Amount, phone, and sender name are required." });
  }

  const selectedNetwork = (network || "airtel").toLowerCase();
  const networkName = selectedNetwork === "mtn" ? "MTN Money" : "Airtel Money";
  
  // Simulate direct integration with Airtel Money OpenAPI / MTN MoMo Open API
  console.log(`[Mobile Money API] Connecting to ${networkName} API Gateway...`);
  console.log(`[Mobile Money API] Triggering USSD push prompt on phone: ${phone} for Amount: K${amount}`);
  console.log(`[Mobile Money API] Reference ID: ${reference || 'N/A'}. Awaiting Customer PIN entry on handset...`);

  const txId = "mm_" + Date.now();
  const newTransaction = {
    id: txId,
    date: new Date().toISOString().split("T")[0],
    type: "income",
    category: `Unassigned (${networkName})`,
    amount: Number(amount) || 0,
    name: `${senderName} (${selectedNetwork === "mtn" ? "MTN" : "Airtel"}: ${phone})`,
    submittedBy: senderName,
    submittedRole: "member",
    status: "pending_mobile_money",
    reference: reference || ""
  };

  db.finances = db.finances || { income: [], expenses: [] };
  db.finances.income = db.finances.income || [];
  db.finances.income.push(newTransaction);

  const newNotif = {
    id: "notif_mm_" + Date.now(),
    title: `Pending ${networkName} Contribution`,
    message: `${senderName} submitted a contribution of K${amount} via ${networkName} (${phone}). Reference: ${reference || 'N/A'}. Awaiting category assignment and ledger posting.`,
    type: "mobile_money_pending" as const,
    timestamp: new Date().toISOString(),
    fromUser: senderName,
    personName: senderName,
    status: "pending" as const,
    targetUser: "leadership",
    transactionId: txId
  };

  db.notifications = db.notifications || [];
  db.notifications.unshift(newNotif);

  writeDb(db);
  res.json({ success: true, transaction: newTransaction, state: db });
});

app.post("/api/finances/mobile-money/:id/approve", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { category, approvedBy } = req.body;

  if (!category) {
    return res.status(400).json({ success: false, message: "Giving category/type is required." });
  }

  db.finances = db.finances || { income: [], expenses: [] };
  db.finances.income = db.finances.income || [];
  
  const tx = db.finances.income.find((t: any) => t.id === id);
  if (!tx) {
    return res.status(404).json({ success: false, message: "Mobile money transaction not found." });
  }

  tx.status = "approved";
  tx.category = category;
  tx.approvedBy = approvedBy || "Pastor";
  tx.approvedDate = new Date().toISOString().split("T")[0];

  db.notifications = db.notifications || [];
  const associatedNotif = db.notifications.find((n: any) => n.transactionId === id || n.id === "notif_" + id);
  if (associatedNotif) {
    associatedNotif.status = "approved";
    associatedNotif.message += ` (Approved and assigned to ${category} by ${approvedBy})`;
  }

  writeDb(db);
  res.json({ success: true, transaction: tx, state: db });
});

app.post("/api/members/:id/toggle-finance-duty", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.members = db.members || [];
  const member = db.members.find((m: any) => m.id === id);
  if (member) {
    member.assignedFinanceDuty = !member.assignedFinanceDuty;
    db.users = db.users || [];
    const user = db.users.find((u: any) => u.email === member.email || u.name === member.name);
    if (user) {
      user.assignedFinanceDuty = member.assignedFinanceDuty;
    }
    writeDb(db);
    res.json({ success: true, member, state: db });
  } else {
    res.status(404).json({ success: false, message: "Member not found" });
  }
});

// Attendance Records
app.post("/api/attendance", (req, res) => {
  const db = readDb();
  const record = {
    id: String(Date.now()),
    status: req.body.status || 'pending',
    ...req.body
  };
  db.attendance = db.attendance || [];
  db.attendance.push(record);
  writeDb(db);
  res.json({ success: true, attendance: record, state: db });
});

app.post("/api/attendance/:id/approve", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { approvedBy } = req.body;
  db.attendance = db.attendance || [];
  const record = db.attendance.find((a: any) => a.id === id);
  if (record) {
    record.status = "approved";
    record.approvedBy = approvedBy || "Elder";
    record.approvedDate = new Date().toISOString().split("T")[0];
    writeDb(db);
    res.json({ success: true, record, state: db });
  } else {
    res.status(404).json({ success: false, message: "Record not found" });
  }
});

app.post("/api/attendance/:id/reject", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.attendance = db.attendance || [];
  const record = db.attendance.find((a: any) => a.id === id);
  if (record) {
    record.status = "rejected";
    writeDb(db);
    res.json({ success: true, record, state: db });
  } else {
    res.status(404).json({ success: false, message: "Record not found" });
  }
});

app.post("/api/members/:id/toggle-duty", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.members = db.members || [];
  const member = db.members.find((m: any) => m.id === id);
  if (member) {
    member.assignedAttendanceDuty = !member.assignedAttendanceDuty;
    // Keep user in sync if we find them
    db.users = db.users || [];
    const user = db.users.find((u: any) => u.email === member.email || u.name === member.name);
    if (user) {
      user.assignedAttendanceDuty = member.assignedAttendanceDuty;
    }
    writeDb(db);
    res.json({ success: true, member, state: db });
  } else {
    res.status(404).json({ success: false, message: "Member not found" });
  }
});

// Connection Groups
app.post("/api/groups", (req, res) => {
  const { name, leader, day, time, location, type, certificateEnabled } = req.body;
  const db = readDb();
  const newGroup = {
    id: String(Date.now()),
    name,
    leader: leader || "TBD Shepherd",
    members: 1,
    day: day || "Sunday",
    time: time || "17:00",
    location: location || "Main Sanctuary",
    type: type || "class",
    certificateEnabled: certificateEnabled !== undefined ? certificateEnabled : true
  };
  db.groups = db.groups || [];
  db.groups.push(newGroup);
  writeDb(db);
  res.json({ success: true, group: newGroup, state: db });
});

app.patch("/api/groups/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }
  db.groups[groupIndex] = {
    ...db.groups[groupIndex],
    ...req.body
  };
  writeDb(db);
  res.json({ success: true, group: db.groups[groupIndex], state: db });
});

app.post("/api/groups/:id/lessons", (req, res) => {
  const { id } = req.params;
  const { title, introduction, notes, scriptures, discussionQuestions, quiz } = req.body;
  const db = readDb();
  
  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.lessons = group.lessons || [];
  
  const newLesson = {
    id: "les_" + Date.now(),
    title: title || "Untitled Lesson",
    order: group.lessons.length + 1,
    introduction: introduction || "",
    notes: notes || "",
    scriptures: scriptures || [],
    discussionQuestions: discussionQuestions || [],
    quiz: quiz || []
  };

  group.lessons.push(newLesson);
  db.groups[groupIndex] = group;
  
  writeDb(db);
  res.json({ success: true, lesson: newLesson, state: db });
});

app.delete("/api/groups/:id/lessons/:lessonId", (req, res) => {
  const { id, lessonId } = req.params;
  const db = readDb();
  const group = db.groups?.find((g: any) => g.id === id);
  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }
  const lesson = (group.lessons || []).find((l: any) => l.id === lessonId);
  const lessonTitle = lesson ? lesson.title : "Lesson";

  handleDeleteRequest(req, res, "group_lesson", lessonId, lessonTitle, id, (database) => {
    const targetGroup = database.groups?.find((g: any) => g.id === id);
    if (targetGroup) {
      targetGroup.lessons = (targetGroup.lessons || []).filter((l: any) => l.id !== lessonId);
    }
  });
});

app.post("/api/groups/:id/add-request", (req, res) => {
  const { id } = req.params;
  const { personName, email, phone, fromUser } = req.body;
  const db = readDb();
  const group = db.groups?.find((g: any) => g.id === id);
  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }
  
  const contactInfo = [email && `Email: ${email}`, phone && `Phone: ${phone}`].filter(Boolean).join(", ");
  const newNotif = {
    id: "notif_" + Date.now(),
    title: "Report to Lead Pastor: Connection Request",
    message: `${fromUser} requested to add ${personName} (${contactInfo}) to the group: ${group.name}. Attention: Lead Pastor.`,
    type: "connection_request",
    timestamp: new Date().toISOString(),
    fromUser,
    targetGroupId: id,
    personName,
    email: email || "",
    phone: phone || "",
    status: "pending",
    isLeadPastorReport: true
  };
  
  db.notifications = db.notifications || [];
  db.notifications.unshift(newNotif);

  // Send a welcome message / alert directly to the person (simulating communication)
  const newMessage = {
    id: "msg_" + Date.now(),
    from: "Lead Pastor Benson",
    to: personName,
    groupId: id,
    preview: `Welcome to ${group.name}!`,
    content: `Hello ${personName},\n\nWelcome to our church's connection group workspace! We have received a request from ${fromUser} to add you to the group: "${group.name}".\n\nYour contact details (${contactInfo || 'not provided'}) have been securely reported to the Lead Pastor's desk. We will reach out to you very soon. God bless you!`,
    timestamp: new Date().toISOString(),
    attachmentType: undefined,
    attachmentId: undefined
  };
  db.messages = db.messages || [];
  db.messages.unshift(newMessage);

  writeDb(db);
  res.json({ success: true, notification: newNotif, state: db });
});

// Helper to evaluate progress and module unlocking logic
function evaluateProgress(group: any, userName: string) {
  if (!group.studentProgress) group.studentProgress = {};
  if (!group.studentProgress[userName]) {
    group.studentProgress[userName] = {
      userId: userName,
      completedLessons: [],
      completedModules: [],
      completedCourses: [],
      quizAttempts: {},
      examAttempts: {},
      certificates: []
    };
  }
  const progress = group.studentProgress[userName];
  const studyModules = [...(group.studyModules || [])].sort((a: any, b: any) => a.order - b.order);

  // Determine completions iteratively
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < studyModules.length; i++) {
      const mod = studyModules[i];
      if (progress.completedModules.includes(mod.id)) continue;

      // Unlocks if it's the first module OR the previous module is completed
      let isUnlocked = i === 0 || progress.completedModules.includes(studyModules[i - 1].id);
      if (!isUnlocked) continue;

      // Requirements for completion:
      // 1. Completion of lessons belonging to this module
      const modLessons = (group.academyLessons || []).filter((l: any) => l.moduleId === mod.id);
      const allLessonsDone = modLessons.length > 0 && modLessons.every((l: any) => progress.completedLessons.includes(l.id));

      // 2. Passing the required quiz (if any) linked to this module with minimum 70%
      const modQuiz = (group.quizzes || []).find((q: any) => q.linkedType === 'module' && q.linkedId === mod.id);
      let quizPassed = true;
      if (modQuiz) {
        const attempt = progress.quizAttempts[modQuiz.id];
        quizPassed = attempt ? attempt.passed : false;
      }

      if (allLessonsDone && quizPassed) {
        progress.completedModules.push(mod.id);
        changed = true;
      }
    }
  }

  // Check course completion
  const courses = group.courses || [];
  courses.forEach((course: any) => {
    if (progress.completedCourses.includes(course.id)) return;
    const courseModules = studyModules.filter((m: any) => m.courseId === course.id);
    if (courseModules.length > 0 && courseModules.every((m: any) => progress.completedModules.includes(m.id))) {
      progress.completedCourses.push(course.id);
      progress.certificates = progress.certificates || [];
      const certExists = progress.certificates.some((c: any) => c.courseId === course.id);
      if (!certExists) {
        progress.certificates.push({
          courseId: course.id,
          courseTitle: course.title,
          earnedAt: new Date().toISOString()
        });
      }
    }
  });

  group.studentProgress[userName] = progress;
  return progress;
}

// 1. Events & Announcements (Small Groups Only)
app.post("/api/groups/:id/events", (req, res) => {
  const { id } = req.params;
  const { eventId, title, description, date, time, location, status, createdBy, isPastor } = req.body;
  const db = readDb();
  
  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.groupEvents = group.groupEvents || [];

  const isApproved = !!isPastor; // Pastors can publish directly without additional approval

  if (eventId) {
    // Edit existing
    const idx = group.groupEvents.findIndex((e: any) => e.id === eventId);
    if (idx !== -1) {
      group.groupEvents[idx] = {
        ...group.groupEvents[idx],
        title,
        description,
        date,
        time,
        location,
        status,
        isApproved,
        createdBy
      };
    }
  } else {
    // Create new
    const newEvent = {
      id: "ev_" + Date.now(),
      title,
      description,
      date,
      time,
      location,
      status: status || "Upcoming",
      isApproved,
      createdBy
    };
    group.groupEvents.push(newEvent);
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.post("/api/groups/:id/events/:eventId/approve", (req, res) => {
  const { id, eventId } = req.params;
  const { approvedBy } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.groupEvents = group.groupEvents || [];
  const event = group.groupEvents.find((e: any) => e.id === eventId);
  if (event) {
    event.isApproved = true;
    event.approvedBy = approvedBy;
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.delete("/api/groups/:id/events/:eventId", (req, res) => {
  const { id, eventId } = req.params;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.groupEvents = (group.groupEvents || []).filter((e: any) => e.id !== eventId);
  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

// 2. Small Groups Academy - Course Administration
app.post("/api/groups/:id/courses", (req, res) => {
  const { id } = req.params;
  const { courseId, title, description, isPublished } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.courses = group.courses || [];

  if (courseId) {
    const idx = group.courses.findIndex((c: any) => c.id === courseId);
    if (idx !== -1) {
      group.courses[idx] = {
        ...group.courses[idx],
        title,
        description,
        isPublished: isPublished !== undefined ? isPublished : true
      };
    }
  } else {
    const newCourse = {
      id: "course_" + Date.now(),
      title,
      description,
      isPublished: isPublished !== undefined ? isPublished : true,
      syllabusId: "syl_" + Date.now()
    };
    group.courses.push(newCourse);
    group.syllabi = group.syllabi || [];
    group.syllabi.push({
      id: newCourse.syllabusId,
      courseId: newCourse.id,
      title: `${title} Syllabus`,
      description: `Core syllabus for the ${title} course.`
    });
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.delete("/api/groups/:id/courses/:courseId", (req, res) => {
  const { id, courseId } = req.params;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.courses = (group.courses || []).filter((c: any) => c.id !== courseId);
  group.studyModules = (group.studyModules || []).filter((m: any) => m.courseId !== courseId);
  group.academyLessons = (group.academyLessons || []).filter((l: any) => l.courseId !== courseId);
  group.quizzes = (group.quizzes || []).filter((q: any) => q.linkedId !== courseId);
  group.exams = (group.exams || []).filter((e: any) => e.linkedCourseId !== courseId);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

// 2.2 Syllabi & Study Modules Management
app.post("/api/groups/:id/syllabi", (req, res) => {
  const { id } = req.params;
  const { syllabusId, courseId, title, description } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.syllabi = group.syllabi || [];

  const idx = group.syllabi.findIndex((s: any) => s.id === syllabusId);
  if (idx !== -1) {
    group.syllabi[idx] = { ...group.syllabi[idx], title, description };
  } else {
    group.syllabi.push({ id: syllabusId || "syl_" + Date.now(), courseId, title, description });
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.post("/api/groups/:id/study-modules", (req, res) => {
  const { id } = req.params;
  const { moduleId, courseId, syllabusId, title, order, description, requiredQuizScore } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.studyModules = group.studyModules || [];

  if (moduleId) {
    const idx = group.studyModules.findIndex((m: any) => m.id === moduleId);
    if (idx !== -1) {
      group.studyModules[idx] = {
        ...group.studyModules[idx],
        title,
        order: Number(order) || 1,
        description,
        requiredQuizScore: requiredQuizScore ? Number(requiredQuizScore) : 70
      };
    }
  } else {
    group.studyModules.push({
      id: "mod_" + Date.now(),
      courseId,
      syllabusId,
      title,
      order: Number(order) || (group.studyModules.length + 1),
      description,
      requiredQuizScore: requiredQuizScore ? Number(requiredQuizScore) : 70
    });
  }

  // Sort modules
  group.studyModules.sort((a: any, b: any) => a.order - b.order);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.delete("/api/groups/:id/study-modules/:moduleId", (req, res) => {
  const { id, moduleId } = req.params;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.studyModules = (group.studyModules || []).filter((m: any) => m.id !== moduleId);
  group.academyLessons = (group.academyLessons || []).filter((l: any) => l.moduleId !== moduleId);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

// 2.3 Lessons & Resources
app.post("/api/groups/:id/lessons-academy", (req, res) => {
  const { id } = req.params;
  const { lessonId, moduleId, courseId, title, order, introduction, notes, scriptures, discussionQuestions, resources, quizId } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.academyLessons = group.academyLessons || [];

  if (lessonId) {
    const idx = group.academyLessons.findIndex((l: any) => l.id === lessonId);
    if (idx !== -1) {
      group.academyLessons[idx] = {
        ...group.academyLessons[idx],
        title,
        order: Number(order) || 1,
        introduction,
        notes,
        scriptures: scriptures || [],
        discussionQuestions: discussionQuestions || [],
        resources: resources || [],
        quizId
      };
    }
  } else {
    group.academyLessons.push({
      id: "ac_les_" + Date.now(),
      moduleId,
      courseId,
      title,
      order: Number(order) || (group.academyLessons.length + 1),
      introduction,
      notes,
      scriptures: scriptures || [],
      discussionQuestions: discussionQuestions || [],
      resources: resources || [],
      quizId
    });
  }

  group.academyLessons.sort((a: any, b: any) => a.order - b.order);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.delete("/api/groups/:id/lessons-academy/:lessonId", (req, res) => {
  const { id, lessonId } = req.params;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.academyLessons = (group.academyLessons || []).filter((l: any) => l.id !== lessonId);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

// 3. Quizzes & Self-Assessments Setup
app.post("/api/groups/:id/quizzes", (req, res) => {
  const { id } = req.params;
  const { quizId, title, linkedType, linkedId, passingMark, timeLimit, attemptsAllowed, questions, isSelfAssessment } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.quizzes = group.quizzes || [];

  if (quizId) {
    const idx = group.quizzes.findIndex((q: any) => q.id === quizId);
    if (idx !== -1) {
      group.quizzes[idx] = {
        ...group.quizzes[idx],
        title,
        linkedType,
        linkedId,
        passingMark: Number(passingMark) || 70,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        attemptsAllowed: Number(attemptsAllowed) || 0,
        questions: questions || [],
        isSelfAssessment: !!isSelfAssessment
      };
    }
  } else {
    const newQuiz = {
      id: "qz_" + Date.now(),
      title,
      linkedType,
      linkedId,
      passingMark: Number(passingMark) || 70,
      timeLimit: timeLimit ? Number(timeLimit) : undefined,
      attemptsAllowed: Number(attemptsAllowed) || 0,
      questions: questions || [],
      isSelfAssessment: !!isSelfAssessment
    };
    group.quizzes.push(newQuiz);

    // If linked to an academy lesson, auto link it
    if (linkedType === 'module') {
      const lessons = (group.academyLessons || []).filter((l: any) => l.moduleId === linkedId);
      if (lessons.length > 0) {
        // link to last lesson of module as terminal gate
        lessons[lessons.length - 1].quizId = newQuiz.id;
      }
    }
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.delete("/api/groups/:id/quizzes/:quizId", (req, res) => {
  const { id, quizId } = req.params;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.quizzes = (group.quizzes || []).filter((q: any) => q.id !== quizId);
  // Remove link from lessons
  group.academyLessons = (group.academyLessons || []).map((l: any) => {
    if (l.quizId === quizId) return { ...l, quizId: undefined };
    return l;
  });

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

// 4. Exams Management
app.post("/api/groups/:id/exams", (req, res) => {
  const { id } = req.params;
  const { examId, title, linkedCourseId, linkedSyllabusId, linkedModuleIds, startDate, endDate, passingMark, timeLimit, attemptsAllowed, questions } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.exams = group.exams || [];

  if (examId) {
    const idx = group.exams.findIndex((e: any) => e.id === examId);
    if (idx !== -1) {
      group.exams[idx] = {
        ...group.exams[idx],
        title,
        linkedCourseId,
        linkedSyllabusId,
        linkedModuleIds: linkedModuleIds || [],
        startDate,
        endDate,
        passingMark: Number(passingMark) || 70,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        attemptsAllowed: Number(attemptsAllowed) || 1,
        questions: questions || []
      };
    }
  } else {
    group.exams.push({
      id: "exm_" + Date.now(),
      title,
      linkedCourseId,
      linkedSyllabusId,
      linkedModuleIds: linkedModuleIds || [],
      startDate,
      endDate,
      passingMark: Number(passingMark) || 70,
      timeLimit: timeLimit ? Number(timeLimit) : undefined,
      attemptsAllowed: Number(attemptsAllowed) || 1,
      questions: questions || []
    });
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.delete("/api/groups/:id/exams/:examId", (req, res) => {
  const { id, examId } = req.params;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.exams = (group.exams || []).filter((e: any) => e.id !== examId);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

// 5 & 6. Progression and Progress Tracking Submissions
app.post("/api/groups/:id/lessons/:lessonId/complete", (req, res) => {
  const { id, lessonId } = req.params;
  const { userName } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  group.studentProgress = group.studentProgress || {};
  if (!group.studentProgress[userName]) {
    group.studentProgress[userName] = {
      userId: userName,
      completedLessons: [],
      completedModules: [],
      completedCourses: [],
      quizAttempts: {},
      examAttempts: {},
      certificates: []
    };
  }

  const progress = group.studentProgress[userName];
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }

  // Re-evaluate unlocking logic
  evaluateProgress(group, userName);

  // Award XP to user in global users state
  const user = db.users?.find((u: any) => u.name === userName);
  if (user) {
    user.xp = (user.xp || 0) + 15; // 15 XP for lesson completion
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.post("/api/groups/:id/quizzes/:quizId/submit", (req, res) => {
  const { id, quizId } = req.params;
  const { userName, answers } = req.body; // answers is array or record of indexes
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  const quiz = (group.quizzes || []).find((q: any) => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ success: false, message: "Quiz not found." });
  }

  // Auto grade objective questions
  let correctCount = 0;
  let totalObjective = 0;
  const scoredAnswers = quiz.questions.map((q: any, idx: number) => {
    const isObjective = q.type === 'multiple-choice';
    if (isObjective) {
      totalObjective++;
      const userAns = answers[idx];
      const isCorrect = Number(userAns) === Number(q.correctIndex);
      if (isCorrect) correctCount++;
      return { qIndex: idx, correct: isCorrect, value: userAns };
    }
    return { qIndex: idx, subjective: true, value: answers[idx] };
  });

  const rawScore = totalObjective > 0 ? Math.round((correctCount / totalObjective) * 100) : 100;
  const passed = rawScore >= quiz.passingMark;

  group.studentProgress = group.studentProgress || {};
  if (!group.studentProgress[userName]) {
    group.studentProgress[userName] = {
      userId: userName,
      completedLessons: [],
      completedModules: [],
      completedCourses: [],
      quizAttempts: {},
      examAttempts: {},
      certificates: []
    };
  }

  const progress = group.studentProgress[userName];
  const prevAttempt = progress.quizAttempts[quizId] || { attempts: 0, bestScore: 0, passed: false, responses: [] };

  progress.quizAttempts[quizId] = {
    attempts: prevAttempt.attempts + 1,
    bestScore: Math.max(prevAttempt.bestScore, rawScore),
    passed: prevAttempt.passed || passed,
    responses: scoredAnswers
  };

  // Evaluate sequential module locks and course certificates
  evaluateProgress(group, userName);

  // Award XP if passed
  if (passed && !prevAttempt.passed) {
    const user = db.users?.find((u: any) => u.name === userName);
    if (user) {
      user.xp = (user.xp || 0) + 50; // 50 XP for passing quiz
    }
  }

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, score: rawScore, passed, group, state: db });
});

app.post("/api/groups/:id/exams/:examId/submit", (req, res) => {
  const { id, examId } = req.params;
  const { userName, answers } = req.body;
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  const exam = (group.exams || []).find((e: any) => e.id === examId);
  if (!exam) {
    return res.status(404).json({ success: false, message: "Exam not found." });
  }

  // Auto grade objective questions
  let correctCount = 0;
  let totalObjective = 0;
  let hasSubjective = false;

  const scoredAnswers = exam.questions.map((q: any, idx: number) => {
    const isObjective = q.type === 'multiple-choice';
    if (isObjective) {
      totalObjective++;
      const userAns = answers[idx];
      const isCorrect = Number(userAns) === Number(q.correctIndex);
      if (isCorrect) correctCount++;
      return { qIndex: idx, type: 'multiple-choice', correct: isCorrect, value: userAns };
    }
    hasSubjective = true;
    return { qIndex: idx, type: 'open-ended', subjective: true, value: answers[idx], graded: false, score: 0 };
  });

  const rawScore = totalObjective > 0 ? Math.round((correctCount / totalObjective) * 100) : 100;
  // If there are subjective answers, final grade is pending. Otherwise passed is calculated now
  const passed = hasSubjective ? false : (rawScore >= exam.passingMark);

  group.studentProgress = group.studentProgress || {};
  if (!group.studentProgress[userName]) {
    group.studentProgress[userName] = {
      userId: userName,
      completedLessons: [],
      completedModules: [],
      completedCourses: [],
      quizAttempts: {},
      examAttempts: {},
      certificates: []
    };
  }

  const progress = group.studentProgress[userName];
  const prevAttempt = progress.examAttempts[examId] || { attempts: 0, score: 0, passed: false, completedAt: "", responses: [] };

  progress.examAttempts[examId] = {
    attempts: prevAttempt.attempts + 1,
    score: hasSubjective ? prevAttempt.score : Math.max(prevAttempt.score, rawScore),
    passed: prevAttempt.passed || passed,
    completedAt: new Date().toISOString(),
    responses: scoredAnswers
  };

  // Add pastor notification for manual review if subjective questions exist
  if (hasSubjective) {
    db.notifications = db.notifications || [];
    db.notifications.unshift({
      id: "review_" + Date.now(),
      title: "Exam Grading Review Requested",
      message: `${userName} completed the exam "${exam.title}" in Small Group ${group.name}. Free-text open responses require manual grading.`,
      type: "system",
      timestamp: new Date().toISOString(),
      fromUser: userName,
      targetGroupId: id,
      status: "pending"
    });
  } else {
    // If auto-graded and passed, award high XP!
    if (passed && !prevAttempt.passed) {
      const user = db.users?.find((u: any) => u.name === userName);
      if (user) {
        user.xp = (user.xp || 0) + 120; // 120 XP for passing course exam
      }
    }
  }

  evaluateProgress(group, userName);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, score: rawScore, pendingReview: hasSubjective, passed, group, state: db });
});

app.post("/api/groups/:id/review-grade", (req, res) => {
  const { id } = req.params;
  const { userName, assessmentId, type, scores, reviewer, comments } = req.body; // scores = Record<qIndex, score>
  const db = readDb();

  const groupIndex = db.groups?.findIndex((g: any) => g.id === id);
  if (groupIndex === -1 || groupIndex === undefined) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const group = db.groups[groupIndex];
  const progress = group.studentProgress?.[userName];
  if (!progress) {
    return res.status(404).json({ success: false, message: "Student progress record not found." });
  }

  if (type === 'exam') {
    const examAttempt = progress.examAttempts[assessmentId];
    const exam = (group.exams || []).find((e: any) => e.id === assessmentId);
    if (examAttempt && exam) {
      // Re-calculate score with manual grades
      let objectiveCorrect = 0;
      let objectiveCount = 0;
      let subjectiveTotalScore = 0;
      let subjectiveCount = 0;

      examAttempt.responses.forEach((resp: any) => {
        if (resp.type === 'multiple-choice') {
          objectiveCount++;
          if (resp.correct) objectiveCorrect++;
        } else {
          subjectiveCount++;
          const score = scores[resp.qIndex] !== undefined ? Number(scores[resp.qIndex]) : 100; // score out of 100
          resp.score = score;
          resp.graded = true;
          subjectiveTotalScore += score;
        }
      });

      const objectiveScore = objectiveCount > 0 ? (objectiveCorrect / objectiveCount) * 100 : 100;
      const subjectiveScore = subjectiveCount > 0 ? (subjectiveTotalScore / subjectiveCount) : 100;
      
      const finalScore = Math.round((objectiveScore + subjectiveScore) / 2);
      const passed = finalScore >= exam.passingMark;

      const wasPassed = examAttempt.passed;
      examAttempt.score = finalScore;
      examAttempt.passed = passed;

      progress.gradedResponses = progress.gradedResponses || {};
      progress.gradedResponses[assessmentId] = {
        reviewer,
        grade: finalScore,
        comments: comments || "Excellent theological integration.",
        isReviewed: true
      };

      if (passed && !wasPassed) {
        const user = db.users?.find((u: any) => u.name === userName);
        if (user) {
          user.xp = (user.xp || 0) + 120; // 120 XP for passing course exam
        }
      }
    }
  }

  evaluateProgress(group, userName);

  db.groups[groupIndex] = group;
  writeDb(db);
  res.json({ success: true, group, state: db });
});

// AI Discipleship Helper Endpoints
app.post("/api/ai/generate-lesson", async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ success: false, message: "Topic is required" });
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a comprehensive Christian Bible study discipleship lesson about the topic: "${topic}".`,
        config: {
          systemInstruction: "You are a Christian theologian and pastor's study assistant helping teachers prepare discipleship lessons for their small groups.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A catchy, theological title for the lesson" },
              introduction: { type: Type.STRING, description: "A warm introduction of 2-3 paragraphs connecting the topic to everyday life" },
              notes: { type: Type.STRING, description: "Comprehensive study notes in Markdown format explaining key theological principles of the topic" },
              scriptures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-4 key scripture references (e.g., 'John 3:16', 'Romans 8:28')"
              },
              discussionQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-4 deep discussion questions for home fellowship groups"
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "A multiple choice or true/false question about the lesson" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "4 options for multiple choice, or 2 for true/false"
                    },
                    correctIndex: { type: Type.INTEGER, description: "0-based index of the correct option" },
                    explanation: { type: Type.STRING, description: "Brief scripture-based explanation of why this answer is correct" }
                  },
                  required: ["question", "options", "correctIndex", "explanation"]
                },
                description: "Exactly 3 distinct questions to test the student's understanding of the lesson"
              }
            },
            required: ["title", "introduction", "notes", "scriptures", "discussionQuestions", "quiz"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, lesson: parsed });
    } catch (error: any) {
      console.error("Gemini lesson generation error:", error);
      return res.status(500).json({ success: false, message: "AI generation failed. Fallback available.", error: error.message });
    }
  }

  // Fallback if no API key is present
  const fallbackLessons: Record<string, any> = {
    "faith": {
      title: "Walk by Faith, Not by Sight",
      introduction: "In our journey as believers, faith is the bedrock of our relationship with God. It is more than just positive thinking or intellectual assent; it is active trust in the character and promises of our Creator, even when our circumstances scream otherwise.",
      notes: "### Understanding Biblical Faith\n\n1. **What is Faith?** According to Hebrews 11:1, faith is the confidence in what we hope for and assurance about what we do not see. It is a solid conviction.\n2. **The Origin of Faith:** Faith comes by hearing, and hearing by the word of God (Romans 10:17). Feeding on Scripture builds our trust in God.\n3. **Living Faith vs. Dead Faith:** True faith is demonstrated through our actions. As James 2 teaches, faith without works is dead. Our obedience is the fruit of our belief.",
      scriptures: ["Hebrews 11:1", "Romans 10:17", "James 2:17", "Proverbs 3:5"],
      discussionQuestions: [
        "How would you define faith in your own words, and when was a time you had to exercise it?",
        "Why is it difficult to trust God when we cannot see the outcome?",
        "What is the difference between active biblical faith and passive wishful thinking?"
      ],
      quiz: [
        {
          question: "According to Hebrews 11:1, what is faith?",
          options: [
            "A vague wish for good things to happen",
            "The confidence in what we hope for and assurance of what we do not see",
            "An intellectual agreement with historical events",
            "A feeling of excitement during worship"
          ],
          correctIndex: 1,
          explanation: "Hebrews 11:1 explicitly defines faith as the substance of things hoped for, the evidence of things not seen."
        },
        {
          question: "How does faith come, according to Romans 10:17?",
          options: [
            "Through dreams and visions",
            "By doing good deeds in the community",
            "By hearing, and hearing through the word of God",
            "Through quiet meditation"
          ],
          correctIndex: 2,
          explanation: "Romans 10:17 states that faith comes by hearing, and hearing by the word of God."
        },
        {
          question: "True or False: James teaches that faith without works is completely dead.",
          options: [
            "True",
            "False"
          ],
          correctIndex: 0,
          explanation: "James 2:17 says, 'In the same way, faith by itself, if it is not accompanied by action, is dead.'"
        }
      ]
    },
    "grace": {
      title: "Extravagant Grace",
      introduction: "Grace is perhaps the most glorious word in the Christian vocabulary. It is the unmerited, undeserved favor of God shown to us through Jesus Christ. Grace means that our relationship with God is based entirely on His goodness, not our performance.",
      notes: "### The Power of God's Grace\n\n1. **Saved by Grace:** We are saved by grace through faith, and this is not from ourselves—it is the free gift of God (Ephesians 2:8-9).\n2. **Sufficient Grace:** God's grace is sufficient for us in our weakness. His power is made perfect when we are weak (2 Corinthians 12:9).\n3. **Grace to Grow:** Grace does not just save us; it trains us to live upright and godly lives in the present age (Titus 2:11-12).",
      scriptures: ["Ephesians 2:8-9", "2 Corinthians 12:9", "Titus 2:11-12"],
      discussionQuestions: [
        "Why is it so hard for humans to accept something that is completely free and unearned?",
        "How does understanding God's grace change the way we treat people who make mistakes?",
        "What is the difference between true biblical grace and 'cheap grace' that excuses sinful behavior?"
      ],
      quiz: [
        {
          question: "According to Ephesians 2:8-9, we are saved by what?",
          options: [
            "Our charity and church attendance",
            "Grace through faith, as a gift from God",
            "Rigorous keeping of the Law",
            "Intellectual study of the Hebrew scriptures"
          ],
          correctIndex: 1,
          explanation: "Ephesians 2:8 states, 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.'"
        },
        {
          question: "Where is God's power made perfect in our lives?",
          options: [
            "In our strengths and accomplishments",
            "In our public speaking and ministry positions",
            "In our weaknesses, where His grace is sufficient",
            "Only when we are completely sinless"
          ],
          correctIndex: 2,
          explanation: "In 2 Corinthians 12:9, God tells Paul: 'My grace is sufficient for you, for my power is made perfect in weakness.'"
        },
        {
          question: "What does grace teach us to do, according to Titus 2:11-12?",
          options: [
            "To ignore sins because they are already forgiven",
            "To say 'No' to ungodliness and worldly passions",
            "To build bigger cathedrals",
            "To judge those outside the church"
          ],
          correctIndex: 1,
          explanation: "Titus 2:11-12 notes that grace teaches us to say 'No' to ungodliness and worldly passions, and to live self-controlled, upright and godly lives."
        }
      ]
    }
  };

  const topicLower = topic.toLowerCase();
  let selected = fallbackLessons.faith;
  if (topicLower.includes("grace") || topicLower.includes("salvation") || topicLower.includes("love")) {
    selected = fallbackLessons.grace;
  }
  
  const customLesson = {
    title: `Study of ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
    introduction: `This discipleship study explores the deep spiritual impact of "${topic}" in our personal walk of faith. As we study the scriptures, we learn how God uses our understanding of ${topic} to guide our hearts and mold our character.`,
    notes: `### Exploring ${topic.toUpperCase()} in Scripture\n\n1. **A Devoted Heart:** Embracing ${topic} requires a heart fully committed to the teachings of Jesus Christ.\n2. **The Power of Scriptural Anchors:** When we ground our study of ${topic} in the Word of God, we find stability and wisdom for everyday decisions.\n3. **A Call to Action:** Understanding ${topic} must lead to a life of service, demonstrating God's love to our families and church community.`,
    scriptures: ["Psalm 119:105", "Colossians 3:16", "Romans 12:2"],
    discussionQuestions: [
      `How does ${topic} challenge the standards of modern culture?`,
      `In what ways can our small group support one another in growing in ${topic}?`,
      `What is one practical change you can make this week based on today's study?`
    ],
    quiz: [
      {
        question: `What is the primary foundation for understanding ${topic} biblical principles?`,
        options: [
          "Popular culture trends",
          "The authoritative Word of God in Scripture",
          "Personal opinions of philosophers",
          "What is easiest to accomplish"
        ],
        correctIndex: 1,
        explanation: "All discipleship studies must be anchored in the Word of God as our ultimate source of wisdom."
      },
      {
        question: `How should our study of ${topic} affect our daily conduct?`,
        options: [
          "It should remain intellectual knowledge only",
          "It should lead to loving actions and spiritual fruit",
          "It should make us feel superior to others",
          "It has no practical effect"
        ],
        correctIndex: 1,
        explanation: "True learning always moves from the head to the heart, and manifests in active love and service."
      },
      {
        question: "According to Romans 12:2, how are we transformed?",
        options: [
          "By conforming to the patterns of this world",
          "By the renewing of our mind",
          "By avoiding other people",
          "By material success"
        ],
        correctIndex: 1,
        explanation: "Romans 12:2 urges us: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.'"
      }
    ]
  };

  return res.json({ success: true, lesson: customLesson });
});

app.post("/api/ai/ask-assistant", async (req, res) => {
  const { question, context } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, message: "Question is required" });
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Study question: "${question}"\nContext Study Material: "${context || 'No specific lesson selected'}"`,
        config: {
          systemInstruction: "You are 'Grace-AI', an interactive theological Study Assistant inside the Kingly Anointed Church app. Provide deep, encouraging, scripture-based answers grounded in historical orthodox Christian teachings. Reference relevant Bible verses and explain Hebrew/Greek root words if helpful. Keep answers highly readable and engaging with bullet points and clear paragraphs.",
        }
      });
      return res.json({ success: true, answer: response.text });
    } catch (error: any) {
      console.error("Gemini study assistant error:", error);
      return res.status(500).json({ success: false, message: "AI response failed. Fallback available.", error: error.message });
    }
  }

  // Fallback direct scripture lookup / short discussion
  const qLower = question.toLowerCase();
  let fallbackAnswer = `Thank you for asking! I am the church's digital discipleship assistant. To fully unlock my real-time Gemini capabilities, please add your **GEMINI_API_KEY** in **Settings > Secrets**.\n\nHere is a scripture-grounded insight regarding your question:\n\n* **Anchor Verse**: 'The grass withers and the flowers fall, but the word of our God endures forever.' (Isaiah 40:8)\n* **Theological Insight**: When we study God's word, we find that spiritual topics such as faith, grace, and redemption are interconnected. To grow spiritually, we must feed daily on God's word, pray without ceasing, and remain in active fellowship with other believers.\n* **Next Step**: Discuss this with your Group Leader, Deacon Winnie, or Pastor Benson Nyirenda during Sunday service!`;

  if (qLower.includes("faith")) {
    fallbackAnswer = `### Biblical Perspective on Faith\n\nFaith is active, trusting obedience to God. \n\n* **Key Verse**: *'And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.'* (Hebrews 11:6)\n\n* **Insight**: Biblical faith is not blind. It is built on God's proven track record of faithfulness. In Hebrew, the word is *Emunah*, which signifies firmness, fidelity, and steadfastness. It's like trusting a sturdy chair to hold your weight—you don't just admire it, you sit in it.\n\nTo grow your faith, spend time reading the Gospels, studying God's promises, and acting on the small prompts of obedience God places on your heart today.`;
  } else if (qLower.includes("grace")) {
    fallbackAnswer = `### Biblical Perspective on God's Grace\n\nGrace is God's unmerited favor—loving kindness given to us even though we cannot earn it and do not deserve it.\n\n* **Key Verse**: *'But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'...'* (2 Corinthians 12:9)\n  \n* **Insight**: In the Greek New Testament, grace is *Charis*, which means a free favor or gift. It is where we get the word 'charitable.' God's grace justifies us (saves us from the penalty of sin) and also sanctifies us (gives us the daily power to live holy lives).\n\nIf you are feeling weary, remember that you don't have to earn your salvation. God loves you simply because He is love. Breathe in His grace today.`;
  } else if (qLower.includes("romans 8") || qLower.includes("romans")) {
    fallbackAnswer = `### Insights from Romans Chapter 8\n\nRomans 8 is often considered the peak of the Apostle Paul's theological writings, describing life in the Spirit and God's everlasting love.\n\n* **Key Verses**: \n  * *'There is therefore now no condemnation for those who are in Christ Jesus...'* (Romans 8:1)\n  * *'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.'* (Romans 8:28)\n\n* **Insight**: Paul begins with 'no condemnation' and ends with 'no separation' (Romans 8:39). In between, he shows that the Holy Spirit lives in us, groans with us in our suffering, and guarantees our future inheritance. No matter what trials you are facing in Lusaka or anywhere else, you are more than a conqueror through Christ!`;
  } else if (qLower.includes("forgive") || qLower.includes("forgiveness")) {
    fallbackAnswer = `### The Calling of Forgiveness\n\nForgiveness is releasing someone from a debt they owe you, just as Christ released you from your debt of sin.\n\n* **Key Verse**: *'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.'* (Ephesians 4:32)\n\n* **Insight**: In Greek, the word for forgive is *Aphiemi*, which literally means to 'let go' or 'send away.' Forgiveness is not saying the offense didn't matter. Rather, it is trusting God to be the ultimate Judge, and freeing your own heart from the prison of bitterness.\n\nIf you are struggling to forgive someone today, ask Holy Spirit to give you supernatural strength. Forgiveness is a process that begins with a decision.`;
  }

  return res.json({ success: true, answer: fallbackAnswer });
});

// System Notifications
app.get("/api/notifications", (req, res) => {
  res.json(readDb().notifications || []);
});

app.post("/api/notifications/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const db = readDb();
  const notification = db.notifications?.find((n: any) => n.id === id);
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }
  
  if (action === "approve") {
    notification.status = "approved";
    if (notification.type === "connection_request" && notification.targetGroupId) {
      const group = db.groups?.find((g: any) => g.id === String(notification.targetGroupId));
      if (group) {
        group.memberNames = group.memberNames || [];
        if (notification.personName && !group.memberNames.includes(notification.personName)) {
          group.memberNames.push(notification.personName);
        }
        group.members = group.memberNames.length;
      }
    } else if (notification.type === "deletion_request") {
      const { itemType, itemId, parentId } = notification;
      if (itemType === "sermon") {
        db.sermons = (db.sermons || []).filter((s: any) => s.id !== itemId);
      } else if (itemType === "quiz") {
        db.quizzes = (db.quizzes || []).filter((q: any) => q.id !== itemId);
      } else if (itemType === "member") {
        db.members = (db.members || []).filter((m: any) => m.id !== itemId);
        db.users = (db.users || []).filter((u: any) => u.id !== itemId);
      } else if (itemType === "group_bulletin") {
        const group = db.groups?.find((g: any) => g.id === parentId);
        if (group) {
          group.bulletins = (group.bulletins || []).filter((b: any) => b.id !== itemId);
        }
      } else if (itemType === "group_lesson") {
        const group = db.groups?.find((g: any) => g.id === parentId);
        if (group) {
          group.lessons = (group.lessons || []).filter((l: any) => l.id !== itemId);
        }
      }
    }
  } else {
    notification.status = "dismissed";
  }
  
  writeDb(db);
  res.json({ success: true, notification, state: db });
});

// Join group directly
app.post("/api/groups/:id/join", (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;
  if (!userName) {
    return res.status(400).json({ success: false, message: "userName is required to join." });
  }
  const db = readDb();
  const group = db.groups?.find((g: any) => g.id === id);
  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }
  
  group.memberNames = group.memberNames || [];
  if (!group.memberNames.includes(userName)) {
    group.memberNames.push(userName);
    group.members = group.memberNames.length;
    
    // Also post a system message to the group chat!
    const sysMsg = {
      id: "msg_" + Date.now(),
      from: "System Notification",
      groupId: id,
      preview: `${userName} has joined the connection group!`,
      content: `${userName} joined the connection group fellowship. Welcome!`,
      time: "Just now",
      unread: false
    };
    db.messages = db.messages || [];
    db.messages.unshift(sysMsg);
    
    writeDb(db);
    res.json({ success: true, group, state: db });
  } else {
    res.json({ success: true, group, message: "Already a member.", state: db });
  }
});

// Post group notice / bulletin
app.post("/api/groups/:id/bulletins", (req, res) => {
  const { id } = req.params;
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ success: false, message: "Author and content are required." });
  }
  const db = readDb();
  const group = db.groups?.find((g: any) => g.id === id);
  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }
  
  group.bulletins = group.bulletins || [];
  const newBulletin = {
    id: "bull_" + Date.now(),
    author,
    content,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  };
  group.bulletins.unshift(newBulletin);
  
  writeDb(db);
  res.json({ success: true, group, state: db });
});

app.delete("/api/groups/:id/bulletins/:bulletinId", (req, res) => {
  const { id, bulletinId } = req.params;
  const db = readDb();
  const group = db.groups?.find((g: any) => g.id === id);
  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }
  const bulletin = (group.bulletins || []).find((b: any) => b.id === bulletinId);
  if (!bulletin) {
    return res.status(404).json({ success: false, message: "Bulletin not found." });
  }
  const bulletinSummary = bulletin.content.length > 30 ? bulletin.content.substring(0, 30) + "..." : bulletin.content;

  handleDeleteRequest(req, res, "group_bulletin", bulletinId, bulletinSummary, id, (database) => {
    const targetGroup = database.groups?.find((g: any) => g.id === id);
    if (targetGroup) {
      targetGroup.bulletins = (targetGroup.bulletins || []).filter((b: any) => b.id !== bulletinId);
    }
  });
});

// Share sermon to connection group
app.post("/api/sermons/:sermonId/share-group", (req, res) => {
  const { sermonId } = req.params;
  const { groupId, fromUser } = req.body;
  if (!groupId || !fromUser) {
    return res.status(400).json({ success: false, message: "groupId and fromUser are required." });
  }
  const db = readDb();
  const sermon = db.sermons?.find((s: any) => s.id === sermonId);
  const group = db.groups?.find((g: any) => g.id === groupId);
  if (!sermon || !group) {
    return res.status(404).json({ success: false, message: "Sermon or Group not found." });
  }

  group.sharedSermons = group.sharedSermons || [];
  if (!group.sharedSermons.includes(sermonId)) {
    group.sharedSermons.push(sermonId);
  }

  // Send a message in the group chat
  const groupMsg = {
    id: "msg_" + Date.now(),
    from: fromUser,
    groupId,
    preview: `Recommended Sermon: "${sermon.title}"`,
    content: `I've shared this sermon with the group: "${sermon.title}" by ${sermon.speaker}. Let's discuss this during our next fellowship!`,
    time: "Just now",
    unread: true,
    attachmentType: "sermon" as const,
    attachmentId: sermonId
  };
  db.messages = db.messages || [];
  db.messages.unshift(groupMsg);

  writeDb(db);
  res.json({ success: true, message: groupMsg, state: db });
});

// Share sermon to member directly
app.post("/api/sermons/:sermonId/share-member", (req, res) => {
  const { sermonId } = req.params;
  const { toUser, fromUser } = req.body;
  if (!toUser || !fromUser) {
    return res.status(400).json({ success: false, message: "toUser and fromUser are required." });
  }
  const db = readDb();
  const sermon = db.sermons?.find((s: any) => s.id === sermonId);
  if (!sermon) {
    return res.status(404).json({ success: false, message: "Sermon not found." });
  }

  const directMsg = {
    id: "msg_" + Date.now(),
    from: fromUser,
    to: toUser,
    preview: `Recommended Sermon: "${sermon.title}"`,
    content: `Dear ${toUser}, I wanted to share this sermon with you: "${sermon.title}" by ${sermon.speaker}. I hope it blesses your spiritual journey!`,
    time: "Just now",
    unread: true,
    attachmentType: "sermon" as const,
    attachmentId: sermonId
  };

  db.messages = db.messages || [];
  db.messages.unshift(directMsg);

  writeDb(db);
  res.json({ success: true, message: directMsg, state: db });
});

// Tasks
app.post("/api/tasks", (req, res) => {
  const db = readDb();
  const newTask = {
    id: String(Date.now()),
    status: "pending" as const,
    ...req.body
  };
  db.tasks = db.tasks || [];
  db.tasks.push(newTask);
  writeDb(db);
  res.json({ success: true, task: newTask, state: db });
});

app.patch("/api/tasks/:id", (req, res) => {
  const db = readDb();
  const taskIndex = db.tasks?.findIndex((t: any) => t.id === req.params.id);
  if (taskIndex !== -1 && db.tasks) {
    db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...req.body };
    writeDb(db);
    res.json({ success: true, task: db.tasks[taskIndex], state: db });
  } else {
    res.status(404).json({ success: false, message: "Task not found" });
  }
});

app.put("/api/tasks/:id", (req, res) => {
  const db = readDb();
  const taskIndex = db.tasks?.findIndex((t: any) => t.id === req.params.id);
  if (taskIndex !== -1 && db.tasks) {
    db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...req.body };
    writeDb(db);
    res.json({ success: true, task: db.tasks[taskIndex], state: db });
  } else {
    res.status(404).json({ success: false, message: "Task not found" });
  }
});

// SMS Broadcast Alerts
app.post("/api/sms/broadcast", (req, res) => {
  const { message, senderName } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: "Message content is required for SMS broadcast." });
  }

  const db = readDb();
  // Find all members with phone numbers
  const recipients = (db.members || []).filter((m: any) => m.phone && m.phone.trim().length > 0);
  const recipientCount = recipients.length;
  const recipientNames = recipients.map((r: any) => `${r.name} (${r.phone})`);

  const newBroadcast = {
    id: "sms_" + Date.now(),
    sender: senderName || "Lead Pastor Benson",
    message,
    timestamp: new Date().toISOString(),
    recipientCount,
    recipientNames
  };

  db.smsBroadcasts = db.smsBroadcasts || [];
  db.smsBroadcasts.unshift(newBroadcast);

  // Auto-notify other leaders or add to message records (optional, but clean)
  writeDb(db);
  res.json({ success: true, broadcast: newBroadcast, state: db });
});

app.get("/api/sms/broadcasts", (req, res) => {
  const db = readDb();
  res.json({ success: true, broadcasts: db.smsBroadcasts || [] });
});

// Quizzes
app.post("/api/quizzes", (req, res) => {
  const db = readDb();
  const newQuiz = {
    id: String(Date.now()),
    participants: 0,
    avgScore: 0,
    status: "active" as const,
    date: new Date().toISOString().split("T")[0],
    ...req.body
  };
  db.quizzes = db.quizzes || [];
  db.quizzes.push(newQuiz);
  writeDb(db);
  res.json({ success: true, quiz: newQuiz, state: db });
});

app.post("/api/quizzes/:id/submit", (req, res) => {
  const db = readDb();
  const quiz = db.quizzes?.find((q: any) => q.id === req.params.id);
  if (quiz) {
    const { score } = req.body; // percentage score e.g. 80
    const totalParts = quiz.participants || 0;
    const currentAvg = quiz.avgScore || 0;
    
    quiz.participants = totalParts + 1;
    quiz.avgScore = Math.round(((currentAvg * totalParts) + score) / (totalParts + 1));
    
    writeDb(db);
    res.json({ success: true, quiz, state: db });
  } else {
    res.status(404).json({ success: false, message: "Quiz not found" });
  }
});

app.patch("/api/quizzes/:id", (req, res) => {
  const db = readDb();
  const quiz = db.quizzes?.find((q: any) => q.id === req.params.id);
  if (quiz) {
    Object.assign(quiz, req.body);
    writeDb(db);
    res.json({ success: true, quiz, state: db });
  } else {
    res.status(404).json({ success: false, message: "Quiz not found" });
  }
});

app.delete("/api/quizzes/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.quizzes = db.quizzes || [];
  const quiz = db.quizzes.find((q: any) => q.id === id);
  if (!quiz) {
    return res.status(404).json({ success: false, message: "Quiz not found" });
  }

  handleDeleteRequest(req, res, "quiz", id, quiz.title, null, (database) => {
    database.quizzes = (database.quizzes || []).filter((q: any) => q.id !== id);
  });
});

// Helper function to update member and user spiritual growth level
function updateMemberSpiritualLevel(db: any, memberId: string, stageLabel: string) {
  // Update in members list
  db.members = db.members || [];
  db.members = db.members.map((m: any) => {
    if (String(m.id) === String(memberId)) {
      m.spiritualGrowthLevel = stageLabel;
      m.xp = (m.xp || 0) + 100;
    }
    return m;
  });

  // Update in users list
  db.users = db.users || [];
  db.users = db.users.map((u: any) => {
    if (String(u.id) === String(memberId)) {
      u.spiritualGrowthLevel = stageLabel;
      u.xp = (u.xp || 0) + 100;
    }
    return u;
  });
}

// Discipleship / Scripture Academy Qualifications
app.get("/api/qualifications", (req, res) => {
  const db = readDb();
  res.json({ success: true, qualifications: db.discipleshipQualifications || [] });
});

app.post("/api/qualifications", (req, res) => {
  const db = readDb();
  const { memberId, memberName, stage, stageLabel, submittedBy, submittedRole } = req.body;
  
  if (!memberId || !memberName || !stage) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  db.discipleshipQualifications = db.discipleshipQualifications || [];

  // If already approved or exists for the same stage, skip to prevent duplicates
  const existing = db.discipleshipQualifications.find((q: any) => String(q.memberId) === String(memberId) && q.stage === stage);
  if (existing) {
    return res.json({ success: true, message: "Already submitted or qualified", state: db });
  }

  // Determine initial status based on submitting role
  // If pastor or admin, auto-approve. If deacon or elder, pending_pastor
  const autoApprove = ["pastor", "admin"].includes(submittedRole);
  const status = autoApprove ? "approved" : "pending_pastor";

  const newQual = {
    id: "qual_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    memberId,
    memberName,
    stage,
    stageLabel,
    submittedBy,
    submittedRole,
    status,
    submittedAt: new Date().toISOString(),
    approvedAt: autoApprove ? new Date().toISOString() : null,
    approvedBy: autoApprove ? submittedBy : null
  };

  db.discipleshipQualifications.push(newQual);

  // If auto-approved, update the member/user details
  if (autoApprove) {
    updateMemberSpiritualLevel(db, memberId, stageLabel);
  }

  writeDb(db);
  res.json({ success: true, qualifications: db.discipleshipQualifications, state: db });
});

app.post("/api/qualifications/approve-all", (req, res) => {
  const db = readDb();
  const { approvedBy } = req.body; // pastor name
  
  db.discipleshipQualifications = db.discipleshipQualifications || [];
  
  let approvedCount = 0;
  db.discipleshipQualifications = db.discipleshipQualifications.map((q: any) => {
    if (q.status === "pending_pastor") {
      q.status = "approved";
      q.approvedAt = new Date().toISOString();
      q.approvedBy = approvedBy || "Senior Pastor";
      approvedCount++;
      // Update spiritual growth level on member & user
      updateMemberSpiritualLevel(db, q.memberId, q.stageLabel);
    }
    return q;
  });

  writeDb(db);
  res.json({ success: true, approvedCount, state: db });
});

app.post("/api/qualifications/:id/approve", (req, res) => {
  const { id } = req.params;
  const { approvedBy } = req.body;
  const db = readDb();

  db.discipleshipQualifications = db.discipleshipQualifications || [];
  const qual = db.discipleshipQualifications.find((q: any) => q.id === id);
  if (qual) {
    qual.status = "approved";
    qual.approvedAt = new Date().toISOString();
    qual.approvedBy = approvedBy || "Senior Pastor";
    // Update spiritual growth level on member & user
    updateMemberSpiritualLevel(db, qual.memberId, qual.stageLabel);
    writeDb(db);
    res.json({ success: true, state: db });
  } else {
    res.status(404).json({ success: false, message: "Qualification record not found" });
  }
});

// --- AI SERMON GENERATION ENDPOINT ---
app.post("/api/gemini/generate-sermon", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      success: false,
      message: "Gemini AI API key is not configured. Please supply an API key in Secrets panel."
    });
  }

  const { title, scripture, topic } = req.body;
  if (!title || !scripture || !topic) {
    return res.status(400).json({ success: false, message: "Title, scripture, and topic are required." });
  }

  const prompt = `You are an expert theologian, pastor, and inspiring Bible teacher.
Write a comprehensive, inspiring, and engaging sermon outline and its corresponding 5-question multiple choice Bible study quiz based on the following:
Title: "${title}"
Scripture Reference: "${scripture}"
Core Theme/Topic: "${topic}"

Provide:
1. A highly structured and inspiring sermon. The outline content MUST be detailed, with an introduction, 3 main biblical principles/points accompanied by illustrative examples, and a concluding call to action/application. Format the content nicely in Markdown.
2. A 5-question weekly Bible study quiz based directly on this scripture and the sermon's points to test the congregation's understanding. Each question must have exactly 4 options, a correct option index (0 to 3), and a short, encouraging biblical explanation.

Format your output STRICTLY to match the requested JSON schema.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      sermon: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          speaker: { type: Type.STRING },
          date: { type: Type.STRING },
          duration: { type: Type.STRING },
          category: { type: Type.STRING },
          scripture: { type: Type.STRING },
          content: { type: Type.STRING, description: "Detailed sermon outline, illustration, and notes in Markdown format." }
        },
        required: ["title", "speaker", "date", "duration", "category", "scripture", "content"]
      },
      quiz: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          week: { type: Type.STRING },
          duration: { type: Type.INTEGER },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correct: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correct", "explanation"]
            }
          }
        },
        required: ["title", "week", "duration", "questions"]
      }
    },
    required: ["sermon", "quiz"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    if (!response.text) {
      throw new Error("No response text returned from Gemini API.");
    }

    const aiResult = JSON.parse(response.text.trim());
    
    // Inject custom metadata values
    const today = new Date().toISOString().split("T")[0];
    aiResult.sermon.date = today;
    aiResult.sermon.speaker = req.body.speaker || "Pastor Benson";
    aiResult.sermon.duration = "40 min";
    aiResult.sermon.views = 0;
    aiResult.sermon.status = req.body.status || "approved";
    aiResult.sermon.imageUrl = "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600&auto=format&fit=crop&q=60";

    aiResult.quiz.date = today;
    aiResult.quiz.participants = 0;
    aiResult.quiz.avgScore = 0;
    aiResult.quiz.status = "active";

    // Auto-save generated items into the database
    const db = readDb();
    
    db.sermons = db.sermons || [];
    const newSermonId = String(Date.now());
    const finalSermon = { id: newSermonId, ...aiResult.sermon };
    db.sermons.push(finalSermon);

    db.quizzes = db.quizzes || [];
    const newQuizId = String(Date.now() + 1);
    const finalQuiz = { id: newQuizId, ...aiResult.quiz };
    db.quizzes.push(finalQuiz);

    writeDb(db);

    res.json({
      success: true,
      sermon: finalSermon,
      quiz: finalQuiz
    });
  } catch (error: any) {
    console.error("Gemini sermon generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate sermon. Please verify your API key and connection.",
      error: error.message
    });
  }
});

// --- AI PRAYER OPTIMIZATION ENDPOINT ---
app.post("/api/gemini/optimize-prayer", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      success: false,
      message: "Gemini AI API key is not configured. Please supply an API key in Secrets panel."
    });
  }
  const { request } = req.body;
  if (!request) {
    return res.status(400).json({ success: false, message: "Prayer outline is required." });
  }

  const prompt = `You are a warm, compassionate Pastor. Take the following prayer request draft or prompt and rewrite it to be structured, inspiring, biblically encouraging, and beautifully phrased, while keeping the user's primary concerns intact. Limit the final prayer request to 100-150 words. Do NOT include extraneous intro/outro text, just return the optimized prayer request directly.
  
Original Draft: "${request}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ success: true, optimized: response.text?.trim() });
  } catch (error: any) {
    console.error("Gemini prayer optimization error:", error);
    res.status(500).json({ success: false, message: "Failed to optimize prayer request with AI.", error: error.message });
  }
});

// --- AI QUIZ EXPLANATION ENDPOINT ---
app.post("/api/gemini/explain-quiz", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      success: false,
      message: "Gemini AI API key is not configured. Please supply an API key in Secrets panel."
    });
  }
  const { question, options, correct, selected, explanation } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, message: "Question details are required." });
  }

  const prompt = `You are an encouraging Sunday school teacher and biblical tutor. Explain why the correct answer is correct, why other options might be incorrect, and provide inspiring context.
Question: "${question}"
Options: ${JSON.stringify(options)}
Correct Option: "${options[correct]}"
Selected Option: "${options[selected]}"
Did the user answer correctly?: ${correct === selected ? "Yes, they did!" : "No, they selected a different option."}
Original basic explanation: "${explanation}"

Please write a warm, clear, and informative 100-150 word breakdown explaining the theological context of this question.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ success: true, explanation: response.text?.trim() });
  } catch (error: any) {
    console.error("Gemini quiz explanation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate explanation with AI.", error: error.message });
  }
});

// --- AI BIBLE STUDY COMPANION CHATBOT ENDPOINT ---
app.post("/api/gemini/bible-chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      success: false,
      message: "Gemini AI API key is not configured. Please supply an API key in Secrets panel."
    });
  }
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required." });
  }

  const prompt = `You are "GraceGuide AI", a gentle, supportive, and knowledgeable Church & Bible Study companion. Help the user understand scripture, find biblical wisdom, answer theological questions, or draft inspiring prayers. Always speak with kindness, humbleness, and clarity. Format your replies beautifully using markdown list points or bold text if helpful. Keep replies friendly and concise (under 200 words).
  
User Question: "${message}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ success: true, reply: response.text?.trim() });
  } catch (error: any) {
    console.error("Gemini bible study companion error:", error);
    res.status(500).json({ success: false, message: "Failed to connect to GraceGuide AI.", error: error.message });
  }
});

// --- AI DRAW QUESTIONS FROM SERMON ENDPOINT ---
app.post("/api/gemini/draw-questions", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      success: false,
      message: "Gemini AI API key is not configured. Please supply an API key in Secrets panel."
    });
  }

  const { sermonId, type = "quiz" } = req.body;
  if (!sermonId) {
    return res.status(400).json({ success: false, message: "Sermon ID is required." });
  }

  const db = readDb();
  const sermon = db.sermons?.find((s: any) => s.id === sermonId);
  if (!sermon) {
    return res.status(404).json({ success: false, message: "Sermon not found." });
  }

  const notesText = sermon.notes || "";
  const sermonContent = (sermon as any).content || "";

  const prompt = `You are an expert theologian and bible teacher. Draft a set of 5 multiple-choice questions for a biblical ${type} based directly on the following sermon/teaching and scripture:
Sermon Title: "${sermon.title}"
Scripture Reference: "${sermon.scripture}"
Sermon Notes: "${notesText}"
Sermon Content Outline: "${sermonContent}"

Requirements:
- Generate 5 highly relevant and accurate questions testing comprehension of this sermon's teaching and underlying scripture.
- Each question must have exactly 4 plausible options, with only one correct answer (index 0 to 3).
- Provide a brief, encouraging, and clear biblical explanation for why the correct option is right.
- Output strictly in JSON matching the specified schema.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correct: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correct", "explanation"]
        }
      }
    },
    required: ["questions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) {
      throw new Error("No response text returned from Gemini API.");
    }

    const result = JSON.parse(response.text.trim());
    res.json({ success: true, questions: result.questions });
  } catch (error: any) {
    console.error("Gemini draw questions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to draw questions from the sermon. Please verify your API key and sermon notes.",
      error: error.message
    });
  }
});

// --- VITE DEV / PRODUCTION ROUTING MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();


const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serves your index.html and files inside 'public'

const PROPS_FILE = path.join(__dirname, 'data', 'properties.json');
const CONTACT_FILE = path.join(__dirname, 'data', 'contact.json');

// Ensure directories exist on startup
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync(path.join(__dirname, 'public', 'uploads'))) fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });

// Fallback Default Data
const defaultProps = [
  { id:1, title:"Grand Villa with Private Pool", location:"Bani Park, Jaipur", price:"₹3.5 Cr", status:"For Sale", type:"Villa", beds:5, baths:4, area:"4800", desc:"An architectural masterpiece with Italian marble flooring, a 40-ft private pool, and landscaped gardens.", agent:"Rajesh Sharma", phone:"+91 98765 43210", img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80" }
];
const defaultContact = {
  name:"Prestige Realty Jaipur", phone:"+91 98765 43210", email:"info@prestigerealty.in", address:"12, Sansar Chandra Road, C-Scheme, Jaipur – 302001", whatsapp:"+91 98765 43210", hours:"Mon–Sat, 9:00 AM – 7:00 PM"
};

// Seed data if files don't exist OR are completely empty strings
if (!fs.existsSync(PROPS_FILE) || fs.readFileSync(PROPS_FILE, 'utf8').trim() === "") {
  fs.writeFileSync(PROPS_FILE, JSON.stringify(defaultProps, null, 2));
}
if (!fs.existsSync(CONTACT_FILE) || fs.readFileSync(CONTACT_FILE, 'utf8').trim() === "") {
  fs.writeFileSync(CONTACT_FILE, JSON.stringify(defaultContact, null, 2));
}

// Configure Multer for processing physical image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Safe Read Helpers (Prevents JSON.parse crash exceptions)
function getProperties() {
  try {
    const data = fs.readFileSync(PROPS_FILE, 'utf8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function getContact() {
  try {
    const data = fs.readFileSync(CONTACT_FILE, 'utf8');
    return data.trim() ? JSON.parse(data) : defaultContact;
  } catch (e) {
    return defaultContact;
  }
}

// --- API ROUTES ---

// 1. Get properties
app.get('/api/properties', (req, res) => {
  res.json(getProperties());
});

// 2. Add / Update property (Handles both text and optional file upload)
app.post('/api/properties', upload.single('imageFile'), (req, res) => {
  let properties = getProperties();
  
  const propData = JSON.parse(req.body.propertyData);
  let imageUrl = propData.img;

  // If a physical file was uploaded, reference its server path instead
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  if (propData.id) {
    // Edit mode
    const idx = properties.findIndex(p => p.id === parseInt(propData.id));
    if (idx !== -1) {
      properties[idx] = { ...properties[idx], ...propData, id: parseInt(propData.id), img: imageUrl };
    }
  } else {
    // Add mode
    const newId = properties.length ? Math.max(...properties.map(p => p.id)) + 1 : 1;
    properties.push({ ...propData, id: newId, img: imageUrl });
  }

  fs.writeFile(PROPS_FILE, JSON.stringify(properties, null, 2), (err) => {
    if (err) return res.status(500).send("Error saving data");
    res.json({ success: true, message: "Properties updated successfully!" });
  });
});

// 3. Delete property
app.delete('/api/properties/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let properties = getProperties();
  properties = properties.filter(p => p.id !== id);

  fs.writeFile(PROPS_FILE, JSON.stringify(properties, null, 2), (err) => {
    if (err) return res.status(500).send("Property deleted");
    res.json({ success: true });
  });
});

// 4. Get Contact details
app.get('/api/contact', (req, res) => {
  res.json(getContact());
});

// 5. Update Contact details
app.post('/api/contact', (req, res) => {
  fs.writeFile(CONTACT_FILE, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).send("Error updating contact");
    res.json({ success: true });
  });
});


// 6. Handle Contact Form Submissions via Email


app.post('/api/send-message', async (req, res) => {
  const { name, phone, email, interest, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `🏠 New Property Enquiry - ${name}`,
      html: `
        <h2>New Property Enquiry</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Interest:</strong> ${interest}</p>

        <hr>

        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.json({
      success: true,
      message: "Email sent successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Failed to send email"
    });
  }
});

app.listen(PORT, () => console.log(`Server running smoothly at http://localhost:${PORT}`));
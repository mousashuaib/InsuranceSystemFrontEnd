<h1 align="center">🌐 Birzeit University Insurance System – Web Frontend</h1>

<p align="center">
  <strong>Modern Health Insurance Web Application</strong>
</p>

<hr>

<img width="1618" height="872" alt="Image" src="https://github.com/user-attachments/assets/37f8db3d-a47b-49f0-82b0-a739b2cda749" />

<h2>📌 Project Overview</h2>
<p>
  <strong>Birzeit University Insurance System – Web Frontend</strong> is a
  modern, responsive, and role-based <strong>web application</strong> developed to provide
  an intuitive user interface for interacting with the university’s health insurance platform.
</p>

<p>
  The frontend focuses on usability, performance, and clarity, allowing different system
  stakeholders to manage insurance services efficiently through a browser-based interface.
  All business logic and security rules are enforced by the backend, while the frontend
  acts as a presentation and interaction layer.
</p>

<p>
  This application was developed as part of a <strong>Graduation Project</strong> at
  <strong>Birzeit University – Department of Computer Science</strong>.
</p>

<hr>

<h2>🎯 Frontend Objectives</h2>
<ul>
  <li>Provide a clean and professional user experience for insurance services</li>
  <li>Support multiple roles with tailored dashboards and workflows</li>
  <li>Ensure responsive design across different screen sizes</li>
  <li>Visualize insurance data clearly using charts and tables</li>
  <li>Integrate seamlessly with backend REST APIs</li>
</ul>

<hr>

<h2>👥 Supported User Roles</h2>

<h3>🗂️ Coordination Admin</h3>
<ul>
  <li>Monitor system-wide activities</li>
  <li>View cross-department workflows</li>
</ul>

<h3>🏥 Medical Admin</h3>
<ul>
  <li>Manage medical entities and reports</li>
  <li>Supervise doctors, pharmacies, and radiology units</li>
</ul>

<h3>💼 Insurance Manager</h3>
<ul>
  <li>Manage insurance policies</li>
  <li>Review and process insurance claims</li>
  <li>Access reports and analytics dashboards</li>
</ul>

<h3>👤 Customer</h3>
<ul>
  <li>View insurance coverage and policy details</li>
  <li>Submit and track insurance claims</li>
  <li>Access medical records and prescriptions</li>
</ul>

<h3>👨‍⚕️ Doctors & Medical Staff</h3>
<ul>
  <li>Manage patient medical records</li>
  <li>Submit diagnoses, prescriptions, and test requests</li>
</ul>

<h3>💊 Pharmacy & 🧪 Radiology</h3>
<ul>
  <li>View and validate prescriptions</li>
  <li>Upload medical test results and imaging reports</li>
</ul>

<hr>

<h2>🔄 Core User Workflows</h2>

<h3>🧾 Insurance Claims</h3>
<pre>
draft → submitted → reviewed → approved / rejected → closed
</pre>

<h3>🚨 Emergency Requests</h3>
<pre>
created → evaluated → approved → closed
</pre>

<p>
  Workflow transitions are visually represented in the UI while being
  strictly enforced by the backend.
</p>

<hr>

<h2>🗺️ Maps & Data Visualization</h2>
<p>
  The frontend integrates interactive maps and charts to enhance data understanding:
</p>

<ul>
  <li>Map-based visualization of healthcare providers</li>
  <li>Location-aware service discovery</li>
  <li>Charts and graphs for insurance analytics</li>
</ul>

<p>
  Mapping and visualization are implemented using modern React-compatible libraries
  to ensure performance and clarity.
</p>

<hr>

<h2>🏗️ Frontend Architecture</h2>
<p>
  The application follows a <strong>component-based architecture</strong>,
  promoting modularity, reusability, and maintainability.
</p>

<ul>
  <li>Stateless UI components</li>
  <li>Centralized API communication</li>
  <li>Client-side routing</li>
  <li>Asynchronous data fetching and caching</li>
</ul>

<hr>

<h2>🧰 Technologies Used</h2>

<h3>Core Stack</h3>
<ul>
  <li>React 19</li>
  <li>Vite</li>
  <li>React Router DOM</li>
  <li>Axios</li>
  <li>@tanstack/react-query</li>
</ul>

<h3>UI & Styling</h3>
<ul>
  <li>Material UI (MUI)</li>
  <li>Emotion (Styled & React)</li>
  <li>Tailwind CSS</li>
  <li>Framer Motion</li>
  <li>Lucide & React Icons</li>
</ul>

<h3>Maps & Visualization</h3>
<ul>
  <li>Leaflet & React-Leaflet</li>
  <li>Google Maps API</li>
  <li>Recharts</li>
</ul>

<h3>Utilities</h3>
<ul>
  <li>SweetAlert2</li>
  <li>WebSocket (SockJS & STOMP)</li>
</ul>

<hr>

<h2>🗂️ Project Structure</h2>
<pre>
frontinsurancesystem/
│
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── assets/
│   └── App.jsx
│
├── public/
├── index.html
├── vite.config.js
└── README.md
</pre>

<hr>

<h2>🚀 Running the Frontend</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js (18+ recommended)</li>
  <li>npm</li>
</ul>

<h3>Steps</h3>
<pre>
npm install
npm run dev
</pre>

<p>
  The application runs locally at:
  <strong>http://localhost:5173</strong>
</p>

<hr>

<h2>🔮 Future Enhancements</h2>
<ul>
  <li>Enhanced dashboard analytics</li>
  <li>Improved accessibility support</li>
  <li>Advanced real-time notifications</li>
  <li>Progressive Web App (PWA) support</li>
</ul>

<hr>

<h2>📚 Academic Information</h2>
<ul>
  <li><strong>Project Type:</strong> Graduation Project</li>
  <li><strong>Institution:</strong> Birzeit University</li>
  <li><strong>Department:</strong> Computer Science</li>
</ul>

<hr>

<p align="center">
  🌐 <strong>Birzeit University Insurance System – Web Frontend</strong><br>
  A modern, scalable, and professional health insurance web application.
</p>

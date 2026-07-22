import React from 'react';
import './StudentIdCard.css';

export default function StudentIdCard({ student }) {
  if (!student) return null;

  // Generate QR code URL using a free reliable API
  const qrData = encodeURIComponent(`Student ID: ${student.id} | Name: ${student.name} | Phone: ${student.phone}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  return (
    <div className="id-card-wrapper id-card-print-container">
      <div className="id-card">
        <div className="id-card-bg-shape1"></div>
        <div className="id-card-bg-shape2"></div>
        
        <div className="id-card-header">
          <h2>ERANGA</h2>
          <p>Driving School</p>
        </div>
        
        <div className="id-card-body">
          <div className="id-card-photo">
            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
          </div>
          
          <h3 className="id-card-name">{student.name || 'Unknown Student'}</h3>
          <div className="id-card-type">STUDENT</div>
          
          <div className="id-card-details">
            <div className="id-card-row">
              <span className="id-card-label">ID No</span>
              <span className="id-card-value">{student.id.substring(0, 8).toUpperCase()}</span>
            </div>
            {student.nic && (
              <div className="id-card-row">
                <span className="id-card-label">NIC</span>
                <span className="id-card-value">{student.nic}</span>
              </div>
            )}
            <div className="id-card-row">
              <span className="id-card-label">Phone</span>
              <span className="id-card-value">{student.phone || 'N/A'}</span>
            </div>
            <div className="id-card-row">
              <span className="id-card-label">Package</span>
              <span className="id-card-value" style={{ fontSize: '0.75rem', textAlign: 'right', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {student.enrolledPackage || student.packageName || student.packageId || 'Standard'}
              </span>
            </div>
          </div>
          
          <div className="id-card-qr-container">
            <div className="id-card-qr">
              <img src={qrUrl} alt="Student QR Code" />
            </div>
            <div className="id-card-footer">
              Valid for practical training & exams
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

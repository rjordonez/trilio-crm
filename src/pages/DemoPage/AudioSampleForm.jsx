import React from 'react';
import './ListenModeForm.css';

function AudioSampleForm({ formData, onNext, onBack }) {
  // Ensure formData exists
  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="listen-mode-form">
      <div className="form-container">
        <button className="back-button" onClick={onBack}>← Back</button>

        <h1>Tour Information</h1>
        <p className="form-subtitle">Pre-filled from the sample conversation</p>

        <div style={{
          padding: '16px 20px',
          backgroundColor: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            color: '#1565c0',
            fontWeight: '600'
          }}>
            📋 Demo: Prospect Information Entry
          </h3>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#1976d2',
            lineHeight: '1.5'
          }}>
            This is where you would normally enter the prospect's information.
            For this demo, we've pre-filled it with the details from the sample conversation.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          <div className="form-group">
            <label htmlFor="situation">Situation</label>
            <select
              id="situation"
              name="situation"
              value={formData.situation || ''}
              disabled
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            >
              <option value="">Select a situation</option>
              <option value="tour">Tour</option>
              <option value="marketing-event">Marketing Event</option>
              <option value="phone-call">Phone Call</option>
              <option value="follow-up">Follow-up</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                placeholder="John"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="zipcode">Zipcode</label>
            <input
              type="text"
              id="zipcode"
              value={formData.zipcode || ''}
              disabled
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              placeholder="e.g. 90210"
            />
          </div>

          <button type="submit" className="submit-btn">
            Next: View AI Analysis →
          </button>
        </form>
      </div>
    </div>
  );
}

export default AudioSampleForm;

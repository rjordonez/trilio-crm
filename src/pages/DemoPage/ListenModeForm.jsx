import React, { useState } from 'react';
import './ListenModeForm.css';

function ListenModeForm({ onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    situation: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    zipcode: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.situation) newErrors.situation = 'Please select a situation';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="listen-mode-form">
      <div className="form-container">
        <button className="back-button" onClick={onBack}>← Back</button>

        <h1>Tour Information</h1>
        <p className="form-subtitle">Enter the prospect's details to begin</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="situation">Situation</label>
            <select
              id="situation"
              name="situation"
              value={formData.situation}
              onChange={handleChange}
              className={errors.situation ? 'error' : ''}
            >
              <option value="">Select a situation</option>
              <option value="tour">Tour</option>
              <option value="marketing-event">Marketing Event</option>
              <option value="phone-call">Phone Call</option>
              <option value="follow-up">Follow-up</option>
              <option value="other">Other</option>
            </select>
            {errors.situation && <span className="error-message">{errors.situation}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? 'error' : ''}
                placeholder="John"
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? 'error' : ''}
                placeholder="Smith"
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="john.smith@email.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="zipcode">Zipcode <span style={{ fontWeight: 'normal', color: '#999' }}>(optional)</span></label>
            <input
              type="text"
              id="zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
              placeholder="e.g. 90210"
            />
          </div>

          <button type="submit" className="submit-btn">Continue to Recording</button>
        </form>
      </div>
    </div>
  );
}

export default ListenModeForm;

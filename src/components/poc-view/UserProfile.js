import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserProfile.css';
import BackButtonPOC from './BackButtonPOC';
import { FaUser, FaUpload, FaCalendarAlt, FaUserMd, FaStar, FaCommentDots } from 'react-icons/fa';
import createAuthenticatedAxios from '../../createAuthenticatedAxios';

const UserProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const location = useLocation();
  const pocId = location.state?.pocId;
  const navigate = useNavigate();
  const axiosInstance = createAuthenticatedAxios();

  useEffect(() => {
    if (!pocId) {
      console.error('No POC ID provided');
      return;
    }

    // Fetch doctor details
    axiosInstance.get(`/api/doctor/${pocId}`)
      .then((response) => {
        setDoctor(response.data);
        console.log("Doctor data:", response.data);
        
        // Set image preview if profile_image exists
        if (response.data.profile_image) {
          console.log("Found profile image:", response.data.profile_image);
          setImagePreview(response.data.profile_image);
          
          // Debug: Check if image exists on server
          axiosInstance.get(`/check-image-path?path=${response.data.profile_image}`)
            .then(result => {
              console.log("Image path check:", result.data);
            })
            .catch(err => console.error("Error checking image:", err));
        }
      })
      .catch((error) => console.error('Error fetching doctor details:', error));

    // Fetch appointments
    axiosInstance.get(`/api/poc/appointments/${pocId}`)
    .then((response) => {
        console.log("Fetched appointments:", response.data);
        setAppointments(response.data);
    })
    .catch((error) => console.error('Error fetching appointments:', error));
  }, [pocId]);

  const handleBackButton = () => {  
    navigate("/back-button", { state: { pocId } });  
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !pocId) return;

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('pocId', pocId);

    try {
      const response = await axiosInstance.post('/api/poc/update-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        console.log("Image upload successful:", response.data);
        // Update doctor state with new image URL
        setDoctor({...doctor, profile_image: response.data.imageUrl});
        // Important: Use the returned URL from the server
        setImagePreview(response.data.imageUrl);
        alert('Profile image updated successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!doctor) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Function to render the image or placeholder
  const renderProfileImage = () => {
    if (imagePreview) {
      return (
        <img 
          src={imagePreview}
          alt={doctor.name} 
          className="user-profile__image" 
          onError={(e) => {
            console.error("Image failed to load:", imagePreview);
            e.target.onerror = null; 
            e.target.src = ''; 
            // If image fails to load, show placeholder instead
            e.target.style.display = 'none';
            document.getElementById('profile-placeholder').style.display = 'flex';
          }}
        />
      );
    } else {
      return (
        <div id="profile-placeholder" className="user-profile__placeholder">
          <FaUser size={40} />
        </div>
      );
    }
  };

  return (
    <div className="user-profile-page">
      <BackButtonPOC onClick={handleBackButton}/>
      
      <div className="user-profile">
        <div className="user-profile__container">
          {/* Doctor Profile Section */}
          <div className="user-profile__header">
            <div className="user-profile__image-container">
              {renderProfileImage()}
              
              <div className="user-profile__image-upload">
                <label htmlFor="profile-image" className="upload-button">
                  <FaUpload /> Change
                </label>
                <input 
                  type="file" 
                  id="profile-image" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }}
                />
                {imageFile && (
                  <button 
                    className="save-button" 
                    onClick={handleImageUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="user-profile__info">
              <h1 className="user-profile__name">{doctor.name}</h1>
              <p className="user-profile__specialization">{doctor.specialization}</p>
              <p className="user-profile__qualification">{doctor.qualification}</p>
              
              <div className="user-profile__contact">
                <p><strong>Email:</strong> {doctor.email}</p>
                <p><strong>Phone:</strong> {doctor.phone}</p>
                <p><strong>Location:</strong> {doctor.location}</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="user-profile__stats">
            <div className="user-profile__stat">
              <div className="stat-icon"><FaUser /></div>
              <h3 className="user-profile__stat-title">Patients</h3>
              <p className="user-profile__stat-value">{doctor.patientCount || '1,234'}</p>
              <p className="user-profile__stat-description">Total Patients</p>
            </div>
            
            <div className="user-profile__stat">
              <div className="stat-icon"><FaUserMd /></div>
              <h3 className="user-profile__stat-title">Experience</h3>
              <p className="user-profile__stat-value">{doctor.experience || '15+' }</p>
              <p className="user-profile__stat-description">Years of Practice</p>
            </div>
            
            <div className="user-profile__stat">
              <div className="stat-icon"><FaStar /></div>
              <h3 className="user-profile__stat-title">Ratings</h3>
              <p className="user-profile__stat-value">{doctor.rating || '4.9'}</p>
              <p className="user-profile__stat-description">Out of 5.0</p>
            </div>
            
            <div className="user-profile__stat">
              <div className="stat-icon"><FaCommentDots /></div>
              <h3 className="user-profile__stat-title">Reviews</h3>
              <p className="user-profile__stat-value">{doctor.reviewCount || '500'}</p>
              <p className="user-profile__stat-description">Patient Reviews</p>
            </div>
          </div>

          {/* Appointment List Section */}
          <div className="user-profile__appointments">
            <h2 className="user-profile__appointments-title">
              <FaCalendarAlt className="appointment-icon" /> Upcoming Appointments
            </h2>
            
            {appointments.length > 0 ? (
              appointments.map((appointment, index) => (
                <div key={index} className="user-profile__appointment">
                  <div className="appointment-content">
                    <div className="appointment-info">
                      <h3 className="user-profile__appointment-name">{appointment.patientName}</h3>
                      <p className="user-profile__appointment-reason">{appointment.reason}</p>
                    </div>
                    <div className="appointment-time">
                      <span className="user-profile__appointment-time">{appointment.time}</span>
                      <span className="user-profile__appointment-date">{appointment.date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-appointments">No upcoming appointments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
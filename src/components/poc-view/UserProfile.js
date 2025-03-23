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
  
  // State for protected data
  const [pocId, setPocId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [pocName, setPocName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stateLoaded, setStateLoaded] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const axiosInstance = createAuthenticatedAxios();

  // Load state from location or sessionStorage - only runs once on component mount
  useEffect(() => {
    // First try to get state from location
    if (location.state && location.state.pocId) {
      setPocId(location.state.pocId);
      setClientId(location.state.clientId || null);
      setPocName(location.state.pocName || null);
      
      // Save to sessionStorage for persistence
      try {
        sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
        if (location.state.clientId) {
          sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
        }
        if (location.state.pocName) {
          sessionStorage.setItem('pocName', JSON.stringify(location.state.pocName));
        }
      } catch (error) {
        console.error("Failed to save state to sessionStorage:", error);
      }
      
      setIsLoading(false);
      setStateLoaded(true);
      return;
    }
    
    // If not available in location, try sessionStorage
    try {
      const storedPocId = sessionStorage.getItem('pocId');
      const storedClientId = sessionStorage.getItem('clientId');
      const storedPocName = sessionStorage.getItem('pocName');
      
      if (storedPocId) {
        setPocId(JSON.parse(storedPocId));
        
        if (storedClientId) {
          setClientId(JSON.parse(storedClientId));
        }
        
        if (storedPocName) {
          setPocName(JSON.parse(storedPocName));
        }
        
        setIsLoading(false);
        setStateLoaded(true);
        return;
      }
    } catch (error) {
      console.error("Failed to retrieve state from sessionStorage:", error);
    }
    
    // If we get here, we couldn't get state from either source
    navigate('/', { replace: true });
  }, []); // Empty dependency array - only runs once

  // Fetch doctor details and appointments - depends on pocId and stateLoaded
  useEffect(() => {
    // Only proceed if pocId is available and state loading is complete
    if (!pocId || !stateLoaded) {
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch doctor details
        const doctorResponse = await axiosInstance.get(`/api/doctor/${pocId}`);
        setDoctor(doctorResponse.data);
        console.log("Doctor data:", doctorResponse.data);
        
        // Set image preview if profile_image exists
        if (doctorResponse.data.profile_image) {
          console.log("Found profile image:", doctorResponse.data.profile_image);
          setImagePreview(doctorResponse.data.profile_image);
          
          // Debug: Check if image exists on server
          try {
            const imageCheckResult = await axiosInstance.get(`/check-image-path?path=${doctorResponse.data.profile_image}`);
            console.log("Image path check:", imageCheckResult.data);
          } catch (err) {
            console.error("Error checking image:", err);
          }
        }

        // Fetch appointments
        const appointmentsResponse = await axiosInstance.get(`/api/poc/appointments/${pocId}`);
        console.log("Fetched appointments:", appointmentsResponse.data);
        setAppointments(appointmentsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [pocId, stateLoaded]); // Only depends on pocId and stateLoaded

  const handleBackButton = () => {  
    navigate("/back-button", { state: { pocId, clientId, pocName } });  
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
    if (!imageFile || !pocId) {
      console.error("Missing imageFile or pocId for upload:", { imageFile, pocId });
      alert('Unable to upload: missing required information');
      return;
    }

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

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  // Function to render the image or placeholder
  // In UserProfile.js, modify the renderProfileImage function
const renderProfileImage = () => {
  if (imagePreview) {
    return (
      <div className="image-container">
        <img 
          src={imagePreview}
          alt={doctor.name || 'Doctor profile'} 
          className="user-profile__image" 
          onError={(e) => {
            console.error("Image failed to load:", imagePreview);
            e.target.onerror = null; 
            e.target.src = ''; 
            e.target.style.display = 'none';
            document.getElementById('profile-placeholder').style.display = 'flex';
          }}
        />
        <div id="profile-placeholder" className="user-profile__placeholder" style={{display: 'none'}}>
          <FaUser size={40} />
        </div>
      </div>
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
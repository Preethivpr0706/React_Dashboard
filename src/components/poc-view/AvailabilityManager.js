import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import '../styles/AvailabilityManager.css';
import BackButtonPOC from './BackButtonPOC';

const AvailabilityManager = () => {
  const location = useLocation();
  const pocId= location.state.pocId;
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState('full');
  const [timings, setTimings] = useState([]);
  const [selectedTimings, setSelectedTimings] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [message, setMessage] = useState('');
const navigate = useNavigate();
  
  useEffect(() => {
    
    // Fetch available dates immediately
    fetch('api/pocs/available-dates-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId}),
    })
      .then((response) => response.json())
      .then((data) => {
        setAvailableDates(
          data.map((date) => ({
            Schedule_Date: date.Schedule_Date,
            active_status: date.active_status,
          }))
        );
      })
      .catch((error) => console.error('Error fetching available dates:', error));
  }, []);

  const handleAvailabilityChange = (e) => {
    setAvailability(e.target.value);
    if (e.target.value === 'partial') {
      setSelectedTimings([]); // Reset selected timings when switching to partial
    }
  };

  const handleDateTileClick = (dateObj) => {
    setSelectedDate(dateObj.Schedule_Date);

    // Fetch available timings for the selected date
    fetch('api/pocs/available-times-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId, date: dateObj.Schedule_Date }),
    })
      .then((response) => response.json())
      .then(setTimings)
      .catch((error) => console.error('Error fetching timings:', error));
  };

  const handleTimingClick = (timing) => {
    setSelectedTimings((prev) => {
      return prev.includes(timing)
        ? prev.filter((t) => t !== timing)
        : [...prev, timing];
    });
  };

  const handleUpdateAvailability = () => {
    const endpoint = availability === 'full' ? 'api/pocs/update-full' : 'api/pocs/update-partial';
    const body = {
      pocId: 1,
      date: selectedDate,
      timings: availability === 'partial' ? selectedTimings : [],
    };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (response.ok) {
          setMessage("Doctor's availability has been updated successfully.");
        } else {
          setMessage('Error updating availability.');
        }
      })
      .catch((error) => {
        console.error('Error updating availability:', error);
        setMessage('Error updating availability.');
      });
  };

  const handleBackButton = () => {  
    navigate("/back-button", { state: { pocId } });  
   }; 
  return (
    <>
      <BackButtonPOC onClick={handleBackButton}/>
    <div className="availability-manager-page">
      <h1 className="availability-manager-heading">Manage Doctor's Availability</h1>
      <hr className="availability-manager-horizontal-line" />
      <form className="availability-manager-form">
        <div className="availability-manager-form-group">
          <label className="availability-manager-label">Available Dates:</label>
          <div className="availability-manager-available-dates">
            {availableDates.map((dateObj) => (
              <div
                key={dateObj.Schedule_Date}
                className={`availability-manager-date-tile ${
                  selectedDate === dateObj.Schedule_Date
                    ? 'availability-manager-selected'
                    : ''
                } ${
                  dateObj.active_status === 'blocked'
                    ? 'availability-manager-blocked'
                    : dateObj.active_status === 'partial'
                    ? 'availability-manager-partial'
                    : 'availability-manager-available'
                }`}
                onClick={() =>
                  dateObj.active_status !== 'blocked' && handleDateTileClick(dateObj)
                }
                title={
                  dateObj.active_status === 'blocked'
                    ? 'Full day is blocked'
                    : dateObj.active_status === 'partial'
                    ? 'Partial slots are blocked'
                    : 'No slots are blocked'
                }
              >
                {dateObj.Schedule_Date}
              </div>
            ))}
          </div>
        </div>

        <div className="availability-manager-form-group">
          <label className="availability-manager-label">Availability:</label>
          <div className="availability-manager-availability">
            <input
              type="radio"
              value="full"
              checked={availability === 'full'}
              onChange={handleAvailabilityChange}
            />{' '}
            Full
            <input
              type="radio"
              value="partial"
              checked={availability === 'partial'}
              onChange={handleAvailabilityChange}
            />{' '}
            Partial
          </div>
        </div>

        {availability === 'partial' && (
          <div className="availability-manager-form-group">
            <label className="availability-manager-label">Timings:</label>
            <div className="availability-manager-timings">
              {timings.map((timing) => (
                <div
                  key={timing.appointment_time}
                  className={`availability-manager-timing ${
                    timing.active_status === 'blocked'
                      ? 'availability-manager-blocked'
                      : ''
                  } ${
                    selectedTimings.includes(timing.appointment_time)
                      ? 'availability-manager-selected'
                      : ''
                  }`}
                  onClick={() =>
                    timing.active_status !== 'blocked' &&
                    handleTimingClick(timing.appointment_time)
                  }
                  title={
                    timing.active_status === 'blocked'
                      ? 'Slot is blocked'
                      : 'Slot is unblocked'
                  }
                >
                  {timing.appointment_time}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpdateAvailability}
          className="availability-manager-update-button"
        >
          Update Availability
        </button>

        {message && <div className="availability-manager-message">{message}</div>}
      </form>
    </div>
    </>
  );
};

export default AvailabilityManager;
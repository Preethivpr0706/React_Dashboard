import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authenticatedFetch from '../../authenticatedFetch';
import { useProtectedState } from '../../StatePersistence';
import '../styles/AdminSchedule.css';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function AdminSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Protected state management
  const [pocId, setPocId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [pocName, setPocName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Component state
  const [selectedDays, setSelectedDays] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [theme, setTheme] = useState('light');

  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      // First try to get state from location
      if (location.state && location.state.pocId) {
        setPocId(location.state.pocId);
        setClientId(location.state.clientId || null);
        setPocName(location.state.pocName || null);
        
        // Save to sessionStorage for persistence
        try {
          sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
          if (location.state.clientId) sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
          if (location.state.pocName) sessionStorage.setItem('pocName', JSON.stringify(location.state.pocName));
        } catch (error) {
          console.error("Failed to save state to sessionStorage:", error);
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not available in location, try sessionStorage
      try {
        const storedPocId = sessionStorage.getItem('pocId');
        const storedClientId = sessionStorage.getItem('clientId');
        const storedPocName = sessionStorage.getItem('pocName');
        
        if (storedPocId) {
          setPocId(JSON.parse(storedPocId));
          if (storedClientId) setClientId(JSON.parse(storedClientId));
          if (storedPocName) setPocName(JSON.parse(storedPocName));
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to retrieve state from sessionStorage:", error);
      }
      
      // If we get here, we couldn't get state from either source
      navigate('/', { replace: true });
    };
    
    loadState();
  }, [location, navigate]);

  // Fetch existing schedule data if needed
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!pocId) return;
      
      try {
        const response = await authenticatedFetch('/api/getSchedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pocId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Transform the data into our schedule format
            const transformedSchedule = [];
            const activeDays = new Set();
            
            data.forEach(entry => {
              activeDays.add(entry.day);
              
              const existingDayIndex = transformedSchedule.findIndex(s => s.day === entry.day);
              if (existingDayIndex >= 0) {
                transformedSchedule[existingDayIndex].timeIntervals.push({
                  startTime: entry.startTime,
                  endTime: entry.endTime,
                  appointmentsPerSlot: entry.appointmentsPerSlot,
                  slotDuration: entry.slotDuration
                });
              } else {
                transformedSchedule.push({
                  day: entry.day,
                  timeIntervals: [{
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    appointmentsPerSlot: entry.appointmentsPerSlot,
                    slotDuration: entry.slotDuration
                  }]
                });
              }
            });
            
            setSchedule(transformedSchedule);
            setSelectedDays(Array.from(activeDays));
          }
        } else {
          console.error("Failed to fetch schedule data");
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
      }
    };
    
    fetchScheduleData();
  }, [pocId]);

  const toggleDay = (day) => {
    setSelectedDays((prevDays) =>
      prevDays.includes(day) ? prevDays.filter((d) => d !== day) : [...prevDays, day]
    );
  };

  const addTimeInterval = (day) => {
    setSchedule((prevSchedule) => {
      const existingEntry = prevSchedule.find((entry) => entry.day === day);
      if (existingEntry) {
        return prevSchedule.map((entry) =>
          entry.day === day
            ? {
                ...entry,
                timeIntervals: [
                  ...entry.timeIntervals,
                  { startTime: '', endTime: '', appointmentsPerSlot: 1, slotDuration: 15 },
                ],
              }
            : entry
        );
      } else {
        return [
          ...prevSchedule,
          {
            day,
            timeIntervals: [{ startTime: '', endTime: '', appointmentsPerSlot: 1, slotDuration: 15 }],
          },
        ];
      }
    });
  };

  const removeTimeInterval = (day, index) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              timeIntervals: entry.timeIntervals.filter((_, i) => i !== index),
            }
          : entry
      ).filter(entry => entry.timeIntervals.length > 0)
    );
  };

  const updateTimeInterval = (day, index, field, value) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              timeIntervals: entry.timeIntervals.map((interval, i) =>
                i === index ? { ...interval, [field]: value } : interval
              ),
            }
          : entry
      )
    );
  };

  const deleteScheduleEntry = (day) => {
    setSchedule((prevSchedule) => prevSchedule.filter((entry) => entry.day !== day));
    setSelectedDays((prevDays) => prevDays.filter((d) => d !== day));
  };

  const saveSchedule = async () => {
    if (!pocId) {
      console.error("Cannot save schedule: No POC ID available");
      return;
    }
    
    try {
      // Transform the schedule data for API
      const scheduleData = schedule.flatMap(entry => 
        entry.timeIntervals.map(interval => ({
          pocId,
          day: entry.day,
          startTime: interval.startTime,
          endTime: interval.endTime,
          appointmentsPerSlot: interval.appointmentsPerSlot,
          slotDuration: interval.slotDuration
        }))
      );
      
      const response = await authenticatedFetch('/api/saveSchedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleData }),
      });
      
      if (response.ok) {
        console.log('Schedule saved successfully');
        // Optionally show success message to user
      } else {
        console.error('Failed to save schedule');
        // Show error message to user
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      // Show error message to user
    }
  };

  const resetSchedule = () => {
    setSelectedDays([]);
    setSchedule([]);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className={`p-4 ${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-2xl font-bold">Doctor Schedule Management</h1>
        <div>
          <span className="mr-2">Welcome, {pocName || 'Doctor'}</span>
          <button
            className="btn btn-primary"
            onClick={toggleTheme}
          >
            {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
          </button>
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Select Days</h2>
        <div className="day-selector">
          {daysOfWeek.map((day) => (
            <div key={day} className="day-checkbox">
              <input
                type="checkbox"
                id={`day-${day}`}
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              <label htmlFor={`day-${day}`}>{day}</label>
            </div>
          ))}
        </div>
      </div>
      {selectedDays.map((day) => (
        <div key={day} className="mb-4 day-schedule-section">
          <h2 className="text-lg font-bold mb-2">{day}</h2>
          {schedule.find((entry) => entry.day === day)?.timeIntervals.map((interval, index) => (
            <div key={index} className="d-flex flex-wrap gap-2 mb-2 time-interval">
              <div className="time-field">
                <label>Start Time</label>
                <input
                  type="time"
                  value={interval.startTime}
                  onChange={(e) =>
                    updateTimeInterval(day, index, 'startTime', e.target.value)
                  }
                  className="form-control"
                />
              </div>
              <div className="time-field">
                <label>End Time</label>
                <input
                  type="time"
                  value={interval.endTime}
                  onChange={(e) => updateTimeInterval(day, index, 'endTime', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="time-field">
                <label>Appointments Per Slot</label>
                <input
                  type="number"
                  value={interval.appointmentsPerSlot}
                  onChange={(e) =>
                    updateTimeInterval(day, index, 'appointmentsPerSlot', parseInt(e.target.value, 10) || 1)
                  }
                  className="form-control"
                  min={1}
                />
              </div>
              <div className="time-field">
                <label>Slot Duration (min)</label>
                <input
                  type="number"
                  value={interval.slotDuration}
                  onChange={(e) =>
                    updateTimeInterval(day, index, 'slotDuration', parseInt(e.target.value, 10) || 15)
                  }
                  className="form-control"
                  min={1}
                />
              </div>
              <button
                className="btn btn-danger remove-btn"
                onClick={() => removeTimeInterval(day, index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="btn btn-success"
            onClick={() => addTimeInterval(day)}
          >
            Add Time Interval
          </button>
        </div>
      ))}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Schedule Summary</h2>
        {schedule.length > 0 ? (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Day(s)</th>
                <th>Time Interval(s)</th>
                <th>Appointments Per Slot</th>
                <th>Slot Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((entry) => (
                <tr key={entry.day}>
                  <td>{entry.day}</td>
                  <td>
                    {entry.timeIntervals.map((interval, index) => (
                      <div key={index}>
                        {interval.startTime || '--:--'} - {interval.endTime || '--:--'}
                      </div>
                    ))}
                  </td>
                  <td>
                    {entry.timeIntervals.map((interval, index) => (
                      <div key={index}>{interval.appointmentsPerSlot}</div>
                    ))}
                  </td>
                  <td>
                    {entry.timeIntervals.map((interval, index) => (
                      <div key={index}>{interval.slotDuration} min</div>
                    ))}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteScheduleEntry(entry.day)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No schedule entries yet. Please select days and add time intervals.</p>
        )}
      </div>
      <div className="d-flex justify-content-end">
        <button
          className="btn btn-success mr-2"
          onClick={saveSchedule}
          disabled={schedule.length === 0}
        >
          Save
        </button>
        <button
          className="btn btn-danger"
          onClick={resetSchedule}
          disabled={schedule.length === 0}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default AdminSchedule;
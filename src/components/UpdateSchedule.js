import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import createAuthenticatedAxios from "../createAuthenticatedAxios";
import "./styles/UpdateSchedule.css";
import { useProtectedState } from "../StatePersistence";

const UpdateSchedule = () => {
  // Use protected state hook for required data
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, state } = useProtectedState(location, ["pocId"]);
  
  // Component state
  const [schedule, setSchedule] = useState([]);
  const [daysOfWeek, setDaysOfWeek] = useState([
    { day: "Monday", timeIntervals: [] },
    { day: "Tuesday", timeIntervals: [] },
    { day: "Wednesday", timeIntervals: [] },
    { day: "Thursday", timeIntervals: [] },
    { day: "Friday", timeIntervals: [] },
    { day: "Saturday", timeIntervals: [] },
    { day: "Sunday", timeIntervals: [] },
  ]);
  const [selectedDay, setSelectedDay] = useState("");
  const [activeTab, setActiveTab] = useState("scheduleSummary");
  const axiosInstance = createAuthenticatedAxios();

  // Fetch schedule data when pocId is available
  useEffect(() => {
    // Only proceed if state is loaded with valid pocId
    if (isLoaded && state && state.pocId) {
      fetchSchedule(state.pocId);
    }
  }, [isLoaded, state]); // Only depend on these two values, not any state that changes during the fetch

  // Function to fetch schedule
  const fetchSchedule = (pocId) => {
    axiosInstance
      .get(`/api/poc/schedule/${pocId}`)
      .then((response) => {
        const scheduleData = response.data;
        setSchedule(scheduleData);
        
        // Update the days of week with the new data
        const updatedDaysOfWeek = daysOfWeek.map((day) => {
          const daySchedule = scheduleData.find(
            (schedule) => schedule.day === day.day
          );
          if (daySchedule) {
            return { ...day, timeIntervals: daySchedule.timeIntervals };
          }
          return { ...day, timeIntervals: [] };
        });
        
        setDaysOfWeek(updatedDaysOfWeek);
      })
      .catch((error) => {
        console.error("Error fetching schedule:", error);
        toast.error("Failed to fetch schedule");
      });
  };

  const handleAddTimeInterval = (day) => {
    const updatedDaysOfWeek = daysOfWeek.map((d) => {
      if (d.day === day) {
        return {
          ...d,
          timeIntervals: [
            ...d.timeIntervals,
            {
              startTime: "",
              endTime: "",
              appointmentsPerSlot: "",
              slotDuration: "",
            },
          ],
        };
      }
      return d;
    });
    setDaysOfWeek(updatedDaysOfWeek);
  };

  const handleRemoveTimeInterval = (day, index) => {
    const updatedDaysOfWeek = daysOfWeek.map((d) => {
      if (d.day === day) {
        return {
          ...d,
          timeIntervals: d.timeIntervals.filter((_, i) => i !== index),
        };
      }
      return d;
    });
    setDaysOfWeek(updatedDaysOfWeek);
  };

  const handleUpdateTimeInterval = (day, index, field, value) => {
    const updatedDaysOfWeek = daysOfWeek.map((d) => {
      if (d.day === day) {
        return {
          ...d,
          timeIntervals: d.timeIntervals.map((interval, i) => {
            if (i === index) {
              return { ...interval, [field]: value };
            }
            return interval;
          }),
        };
      }
      return d;
    });
    setDaysOfWeek(updatedDaysOfWeek);
  };

  const handleSaveSchedule = () => {
    if (!isLoaded || !state || !state.pocId) {
      toast.error("Unable to save: POC ID not available");
      return;
    }
    
    const scheduleData = daysOfWeek
      .filter(
        (day) =>
          day.timeIntervals.length > 0 &&
          day.timeIntervals.every(
            (interval) =>
              interval.startTime &&
              interval.endTime &&
              interval.appointmentsPerSlot &&
              interval.slotDuration
          )
      )
      .map((day) => ({
        pocId: state.pocId,
        day: day.day,
        timeIntervals: day.timeIntervals,
      }));

    if (scheduleData.length === 0) {
      toast.warning("No valid schedule data to save");
      return;
    }

    axiosInstance
      .post("/api/update-schedule", { schedule: scheduleData })
      .then((response) => {
        if (response.data.message === "Schedule updated successfully") {
          toast.success("Schedule updated successfully");
          
          // Refresh schedule data
          fetchSchedule(state.pocId);
        } else {
          toast.error("Failed to update schedule");
        }
      })
      .catch((error) => {
        console.error("Error updating schedule:", error);
        toast.error("Failed to update schedule");
      });
  };

  const resetForm = () => {
    setSelectedDay("");
    
    // Only reset if we have a valid pocId
    if (isLoaded && state && state.pocId) {
      fetchSchedule(state.pocId);
    } else {
      toast.error("Cannot reset: POC ID not available");
    }
  };

  const getDayClass = (day) => {
    const hasTimeIntervals = daysOfWeek.find(d => d.day === day)?.timeIntervals.length > 0;
    return `day-selector ${hasTimeIntervals ? 'has-intervals' : ''}`;
  };

  // Show loading state if data isn't ready
  if (!isLoaded || !state) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="schedule-container">
      <ToastContainer position="top-right" />
      
      <header className="schedule-header">
        <h1>Doctor Schedule Management</h1>
        <div className="doctor-info">
          <span className="doctor-id">Doctor ID: {state.pocId}</span>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === "scheduleSummary" ? "active" : ""}`}
            onClick={() => setActiveTab("scheduleSummary")}
          >
            Edit Schedule
          </button>
          <button
            className={`tab-button ${activeTab === "availableSlots" ? "active" : ""}`}
            onClick={() => setActiveTab("availableSlots")}
          >
            Available Slots
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "scheduleSummary" && (
            <div className="schedule-editor">
              <div className="day-selection">
                <h2>Select Day to Edit</h2>
                <div className="days-grid">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.day}
                      className={`${getDayClass(day.day)} ${selectedDay === day.day ? 'selected' : ''}`}
                      onClick={() => setSelectedDay(day.day)}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDay && (
                <div className="time-intervals">
                  <h2>{selectedDay} Schedule</h2>
                  
                  {daysOfWeek.find((d) => d.day === selectedDay).timeIntervals.length === 0 ? (
                    <div className="no-intervals">
                      <p>No time intervals added yet.</p>
                      <button
                        onClick={() => handleAddTimeInterval(selectedDay)}
                        className="add-interval-button"
                      >
                        Add Time Interval
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="intervals-table">
                        <div className="interval-header">
                          <div>Start Time</div>
                          <div>End Time</div>
                          <div>Appointments per Slot</div>
                          <div>Slot Duration (min)</div>
                          <div>Actions</div>
                        </div>
                        
                        {daysOfWeek
                          .find((d) => d.day === selectedDay)
                          .timeIntervals.map((interval, index) => (
                            <div key={index} className="interval-row">
                              <div>
                                <input
                                  type="time"
                                  value={interval.startTime || ""}
                                  onChange={(e) =>
                                    handleUpdateTimeInterval(
                                      selectedDay,
                                      index,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <input
                                  type="time"
                                  value={interval.endTime || ""}
                                  onChange={(e) =>
                                    handleUpdateTimeInterval(
                                      selectedDay,
                                      index,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  value={interval.appointmentsPerSlot || ""}
                                  onChange={(e) =>
                                    handleUpdateTimeInterval(
                                      selectedDay,
                                      index,
                                      "appointmentsPerSlot",
                                      parseInt(e.target.value, 10) || ""
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  value={interval.slotDuration || ""}
                                  onChange={(e) =>
                                    handleUpdateTimeInterval(
                                      selectedDay,
                                      index,
                                      "slotDuration",
                                      parseInt(e.target.value, 10) || ""
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <button
                                  onClick={() => handleRemoveTimeInterval(selectedDay, index)}
                                  className="remove-button"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                      
                      <button
                        onClick={() => handleAddTimeInterval(selectedDay)}
                        className="add-interval-button"
                      >
                        Add Time Interval
                      </button>
                    </>
                  )}
                </div>
              )}
              
              <div className="action-buttons">
                <button className="save-button" onClick={handleSaveSchedule}>
                  Save Schedule
                </button>
                <button className="reset-button" onClick={resetForm}>
                  Reset
                </button>
              </div>
            </div>
          )}

          {activeTab === "availableSlots" && (
            <div className="slots-viewer">
              <h2>Available Slots</h2>
              
              {schedule.length === 0 ? (
                <div className="no-slots">
                  <p>No available slots found.</p>
                </div>
              ) : (
                <div className="slots-table">
                  <div className="slots-header">
                    <div>Day</div>
                    <div>Time Intervals</div>
                    <div>Appointments Per Slot</div>
                    <div>Slot Duration</div>
                  </div>
                  
                  {schedule.map((entry) => (
                    <div key={entry.day} className="slot-row">
                      <div className="day-cell">{entry.day}</div>
                      <div className="intervals-cell">
                        {entry.timeIntervals.map((interval, index) => (
                          <div key={index} className="interval-item">
                            {interval.startTime} - {interval.endTime}
                          </div>
                        ))}
                      </div>
                      <div className="appointments-cell">
                        {entry.timeIntervals.map((interval, index) => (
                          <div key={index} className="interval-item">
                            {interval.appointmentsPerSlot}
                          </div>
                        ))}
                      </div>
                      <div className="duration-cell">
                        {entry.timeIntervals.map((interval, index) => (
                          <div key={index} className="interval-item">
                            {interval.slotDuration} min
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="action-buttons">
                <button 
                  className="edit-button" 
                  onClick={() => setActiveTab("scheduleSummary")}
                >
                  Edit Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateSchedule;
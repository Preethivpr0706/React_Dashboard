import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UpdateSchedule = () => {
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
const [pocId, setPocId] = useState(null);
const [activeTab, setActiveTab] = useState("scheduleSummary");
const location = useLocation();
const navigate = useNavigate();

useEffect(() => {
const pocId = location.state.pocId;
setPocId(pocId);

axios
.get(`/api/poc/schedule/${pocId}`)
.then((response) => {
const scheduleData = response.data;
setSchedule(scheduleData); // Store the complete schedule
const updatedDaysOfWeek = daysOfWeek.map((day) => {
const daySchedule = scheduleData.find(
(schedule) => schedule.day === day.day
);
if (daySchedule) {
return { ...day, timeIntervals: daySchedule.timeIntervals };
}
return day;
});
setDaysOfWeek(updatedDaysOfWeek); // Update days of week with full data
})
.catch((error) => {
console.error("Error fetching schedule:", error);
toast.error("Failed to fetch schedule");
});
}, [location.state]);

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
const scheduleData = daysOfWeek
.filter((day) => day.timeIntervals.length > 0 && day.timeIntervals[0].startTime !== "" && day.timeIntervals[0].endTime !== "" && day.timeIntervals[0].appointmentsPerSlot !== "" && day.timeIntervals[0].slotDuration !== "")
.map((day) => ({
pocId: pocId,
day: day.day,
timeIntervals: day.timeIntervals,
}));

axios
.post("/api/update-schedule", { schedule: scheduleData })
.then((response) => {
if (response.data.message === "Schedule updated successfully") {
toast.success("Schedule updated successfully");
setDaysOfWeek((prevDays) =>
prevDays.map((day) => ({ ...day, timeIntervals: [] }))
);
axios
.get(`/api/poc/schedule/${pocId}`)
.then((response) => {
setSchedule(response.data); // Refresh schedule
})
.catch((error) => {
console.error("Error fetching updated schedule:", error);
toast.error("Failed to refresh available slots");
});
} else {
toast.error("Failed to update schedule");
}
})
.catch((error) => {
console.error("Error updating schedule:", error);
toast.error("Failed to update schedule");
});
};


return (
<div
className="container mt-5 bg-light text-dark"> 
<ToastContainer />
<div className="d-flex justify-content-between align-items-center mb-4">
<h1 className="text-2xl font-bold">Doctor Schedule Management</h1>
</div>

{/* Tab Navigation */}
<ul className="nav nav-tabs">
<li className="nav-item">
<button
className={`nav-link ${activeTab === "scheduleSummary" ? "active" : ""}`}
onClick={() => setActiveTab("scheduleSummary")}
>
Schedule Summary
</button>
</li>
<li className="nav-item">
<button
className={`nav-link ${activeTab === "availableSlots" ? "active" : ""}`}
onClick={() => setActiveTab("availableSlots")}
>
Available Slots
</button>
</li>
</ul>

{/* Tab Content */}
{activeTab === "scheduleSummary" && (
<div className="mb-4">
<h2 className="text-xl font-bold mb-2">Select Day</h2>
<select
className="form-control"
value={selectedDay}
onChange={(e) => setSelectedDay(e.target.value)}
>
<option value="">Select Day</option>
{daysOfWeek.map((day) => (
<option key={day.day} value={day.day}>
{day.day}
</option>
))}
</select>

{selectedDay && (
<div>
<h2 className="text-lg font-bold mb-2">{selectedDay}</h2>
<table className="table table-striped">
<thead>
<tr>
<th>Start Time</th>
<th>End Time</th>
<th>Appointments per Slot</th>
<th>Slot Duration</th>
<th>Actions</th>
</tr>
</thead>
<tbody>
{daysOfWeek
.find((d) => d.day === selectedDay)
.timeIntervals.map((interval, index) => (
<tr key={index}>
<td>
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
className="form-control"
/>
</td>
<td>
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
className="form-control"
/>
</td>
<td>
<input
type="number"
value={interval.appointmentsPerSlot || ""}
onChange={(e) =>
handleUpdateTimeInterval(
selectedDay,
index,
"appointmentsPerSlot",
parseInt(e.target.value, 10)
)
}
className="form-control"
/>
</td>
<td>
<input
type="number"
value={interval.slotDuration || ""}
onChange={(e) =>
handleUpdateTimeInterval(
selectedDay,
index,
"slotDuration",
parseInt(e.target.value, 10)
)
}
className="form-control"
/>
</td>
<td>
<button
onClick={() => handleRemoveTimeInterval(selectedDay, index)}
className="btn btn-danger"
>
Remove
</button>
</td>
</tr>
))}
</tbody>
</table>
<button
onClick={() => handleAddTimeInterval(selectedDay)}
className="btn btn-success"
>
Add Time Interval
</button>
</div>
)}
</div>
)}

{activeTab === "availableSlots" && (
<div className="mb-4">
<h2 className="text-xl font-bold mb-2">Available Slots</h2>
<table className="table table-striped">
<thead>
<tr>
<th>Day(s)</th>
<th>Time Interval(s)</th>
<th>Appointments Per Slot</th>
<th>Slot Duration</th>
</tr>
</thead>
<tbody>
{schedule.map((entry) => (
<tr key={entry.day}>
<td>{entry.day}</td>
<td>
{entry.timeIntervals.map((interval, index) => (
<div key={index}>
{interval.startTime} - {interval.endTime}
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
</tr>
))}
</tbody>
</table>
</div>
)}

<div className="d-flex justify-content-end">
  {activeTab === "scheduleSummary" && (
    <>
      <button className="btn btn-success mr-2" onClick={handleSaveSchedule}>
        Save
      </button>
      <button
        className="btn btn-danger"
        onClick={() => {
          setSelectedDay(""); // Reset the selected day
          setDaysOfWeek((prevDays) =>
            prevDays.map((day) => ({ ...day, timeIntervals: [] }))
          ); // Clear the time intervals for all days
        }}
      >
        Reset
      </button>
    </>
  )}
</div>

</div>
);
};

export default UpdateSchedule;

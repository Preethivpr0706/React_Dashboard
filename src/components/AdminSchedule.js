import React, { useState } from 'react';  
  
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];  
  
function AdminSchedule() {  
  const [selectedDays, setSelectedDays] = useState([]);  
  const [schedule, setSchedule] = useState([]);  
  const [theme, setTheme] = useState('light');  
  
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
    )  
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
  };  
  
  const saveSchedule = () => {  
   console.log('Schedule saved:', schedule);  
  };  
  
  const resetSchedule = () => {  
   setSelectedDays([]);  
   setSchedule([]);  
  };  
  
  const toggleTheme = () => {  
   setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));  
  };  
  
  return (  
   <div className={`p-4 ${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'}`}>  
    <div className="d-flex justify-content-between align-items-center mb-4">  
      <h1 className="text-2xl font-bold">Doctor Schedule Management</h1>  
      <button  
       className="btn btn-primary"  
       onClick={toggleTheme}  
      >  
       {theme === 'light' ? 'Dark Theme' : 'Light Theme'}  
      </button>  
    </div>  
    <div className="mb-4">  
      <h2 className="text-xl font-bold mb-2">Select Days</h2>  
      <select  
       multiple  
       className="form-control"  
       onChange={(e) => {  
        const selected = Array.from(e.target.selectedOptions, (option) => option.value);  
        setSelectedDays(selected);  
       }}  
      >  
       {daysOfWeek.map((day) => (  
        <option key={day} value={day}>  
          {day}  
        </option>  
       ))}  
      </select>  
    </div>  
    {selectedDays.map((day) => (  
      <div key={day} className="mb-4">  
       <h2 className="text-lg font-bold mb-2">{day}</h2>  
       {schedule.find((entry) => entry.day === day)?.timeIntervals.map((_, index) => (  
        <div key={index} className="d-flex flex-wrap gap-2 mb-2">  
          <input  
           type="time"  
           value={schedule.find((entry) => entry.day === day)?.timeIntervals[index].startTime}  
           onChange={(e) =>  
            updateTimeInterval(day, index, 'startTime', e.target.value)  
           }  
           className="form-control"  
          />  
          <input  
           type="time"  
           value={schedule.find((entry) => entry.day === day)?.timeIntervals[index].endTime}  
           onChange={(e) => updateTimeInterval(day, index, 'endTime', e.target.value)}  
           className="form-control"  
          />  
          <input  
           type="number"  
           value={schedule.find((entry) => entry.day === day)?.timeIntervals[index].appointmentsPerSlot}  
           onChange={(e) =>  
            updateTimeInterval(day, index, 'appointmentsPerSlot', parseInt(e.target.value, 10))  
           }  
           className="form-control"  
           min={1}  
          />  
          <input  
           type="number"  
           value={schedule.find((entry) => entry.day === day)?.timeIntervals[index].slotDuration}  
           onChange={(e) =>  
            updateTimeInterval(day, index, 'slotDuration', parseInt(e.target.value, 10))  
           }  
           className="form-control"  
           min={1}  
          />  
          <button  
           className="btn btn-danger"  
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
           <td>  
            <button  
              className="btn btn-primary"  
              onClick={() => {  
               // Implement edit functionality  
              }}  
            >  
              Edit  
            </button>  
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
    </div>  
    <div className="d-flex justify-content-end">  
      <button  
       className="btn btn-success mr-2"  
       onClick={saveSchedule}  
      >  
       Save  
      </button>  
      <button  
       className="btn btn-danger"  
       onClick={resetSchedule}  
      >  
       Reset  
      </button>  
    </div>  
   </div>  
  );  
}  
  
export default AdminSchedule;

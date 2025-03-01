import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './styles/ViewAppointments.css';

const ViewAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);
  const [clientName, setClientName] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocSpecialization, setPocSpecialization] = useState('');
  const location = useLocation();
  const clientId = location.state.clientId || null;
  const pocId = location.state.pocId || null;
  useEffect(() => {
    // Set the background color when the component is mounted
    document.body.style.background = "linear-gradient(135deg, #6e8efb, #a777e3)";

    // Cleanup when the component is unmounted or navigation happens
    return () => {
      document.body.style.background = "";
    };
  }, []);
  useEffect(() => {
    axios
      .post('/api/appointments', {  clientId: clientId, pocId:pocId })
      .then((response) => {
        const data = response.data || {};
        setClientName(data.clientName || 'Unknown Client');
        setPocName(data.pocName || 'Unknown POC');
        setPocSpecialization(data.pocSpecialization || 'Unknown Specialization');
        const appointmentDetails = data.appointmentDetails || [];
        setAppointments(appointmentDetails);
        setFilteredAppointments(appointmentDetails);
      })
      .catch((error) => console.error('Error fetching appointments:', error));
  }, []);

  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setFilteredAppointments(
      appointments.filter((appointment) =>
        ['date', 'day', 'time']
          .some((key) => appointment[key]?.toLowerCase().includes(searchTerm))
      )
    );
    setSearchTerm(searchTerm);
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="appointments-wrapper">
    <div className="view-appointments">
      <header className="header">
        <h1 className="header-title">{pocName}</h1>
        <p className="header-subtitle">{pocSpecialization}</p>
      </header>

      <div className="search-bar">
        <h2 className="section-title">Appointments</h2>
        <input
          type="search"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search appointments"
          className="search-input"
        />
      </div>

      <table className="appointments-table">
        <thead>
          <tr>
            <th>S.No.</th>
            <th>Date</th>
            <th>Day</th>
            <th>Time</th>
            <th>Booked</th>
            <th>Total Slots</th>
          </tr>
        </thead>
        <tbody>
          {filteredAppointments
            .slice((currentPage - 1) * 10, currentPage * 10)
            .map((appointment, index) => (
              <tr key={appointment.sNo} className="table-row">
                <td>{appointment.sNo}</td>
                <td>{appointment.date}</td>
                <td>{appointment.day}</td>
                <td>{appointment.time}</td>
                <td>{appointment.noOfAppointments}</td>
                <td>{appointment.totalSlots}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={handlePrevPage} disabled={currentPage === 1} className="pagination-btn">Prev</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber)}
            className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
          >
            {pageNumber}
          </button>
        ))}
        <button onClick={handleNextPage} disabled={currentPage === totalPages} className="pagination-btn">Next</button>
      </div>
    </div>
    </div>
  );
};

export default ViewAppointments;

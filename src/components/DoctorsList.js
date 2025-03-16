import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/DoctorsList.css";
import authenticatedFetch from "../authenticated Fetch";

const DoctorsList = () => {
  const location = useLocation();
  const clientId = location.state?.clientId || null;
  const clientName = location.state?.clientName || null;

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Removed the blue background setting

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await authenticatedFetch("/api/poc/get-doctors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });

        if (response.ok) {
          const data = await response.json();
          setDoctors(data);
        } else {
          throw new Error("Failed to fetch doctors");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchDoctors();
  }, [clientId]);

  const groupByDepartment = (doctors) => {
    const grouped = {};
    doctors.forEach((doc) => {
      if (!grouped[doc.departmentName]) {
        grouped[doc.departmentName] = [];
      }
      grouped[doc.departmentName].push(doc);
    });
    return grouped;
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.pocName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.contactNumber.includes(searchTerm)
  );

  const groupedDoctors = groupByDepartment(filteredDoctors);

 

  return (
    <div className="doctors-page">
      <div className="doctors-container">
        <header className="doctors-header">
          <h1 className="doctors-title">
            {clientName ? `${clientName} - Doctors Directory` : "Doctors Directory"}
          </h1>
          {/* <button className="back-button" onClick={handleBackButton}>
            ← Back
          </button> */}
        </header>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, department, or contact info..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading doctors information...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">Error: {error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            {Object.keys(groupedDoctors).length > 0 ? (
              Object.entries(groupedDoctors).map(([department, departmentDoctors], deptIndex) => (
                <div key={department} className="department-section">
                  <div className="department-header">
                    <h2>{department}</h2>
                    <span className="department-count">{departmentDoctors.length} Doctor{departmentDoctors.length !== 1 ? 's' : ''}</span>
                  </div>
                  <table className="doctors-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Contact Number</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentDoctors.map((doctor) => (
                        <tr key={doctor.pocId}>
                          <td>
                            <div className="doctor-name">{doctor.pocName}</div>
                          </td>
                          <td>
                            <a href={`tel:${doctor.contactNumber}`} className="contact-link">
                              {doctor.contactNumber}
                            </a>
                          </td>
                          <td>
                            <a href={`mailto:${doctor.email}`} className="contact-link">
                              {doctor.email}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No doctors found matching your search criteria</p>
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="clear-search">
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsList;
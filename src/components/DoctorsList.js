import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/DoctorsList.css";

const DoctorsList = () => {
  const location = useLocation();
  const clientId = location.state?.clientId || null;
  const clientName = location.state.clientName || null;

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
   useEffect(() => {
      // Set the background color when the component is mounted
      document.body.style.backgroundColor = " #80bdff";
  
      // Cleanup when the component is unmounted or navigation happens
      return () => {
        document.body.style.backgroundColor = "";
      };
    }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("/api/poc/get-doctors", {
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

  const groupedDoctors = groupByDepartment(doctors);

  const handleBackButton = () => {  
    navigate("/back-button", { state: { clientId, clientName } });  
   }; 

  return (
    <>
      {/* <BackButton onClick={handleBackButton}/> */}
        <div className="doctors-table-container">
  <h1 className="doctors-table-heading">{clientName} - Doctors List</h1>
  {loading ? (
    <p className="doctors-loading">Loading...</p>
  ) : error ? (
    <p className="doctors-error">{error}</p>
  ) : (
    <table className="doctors-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Department</th>
          <th>Name</th>
          <th>Contact Number</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(groupedDoctors).length > 0 ? (
          Object.keys(groupedDoctors).map((department, deptIndex) => {
            const departmentDoctors = groupedDoctors[department];
            return departmentDoctors.map((doctor, index) => (
              <tr key={doctor.pocId}>
                {index === 0 && (
                  <td rowSpan={departmentDoctors.length}>
                    {deptIndex + 1}
                  </td>
                )}
                {index === 0 && (
                  <td rowSpan={departmentDoctors.length}>
                    {doctor.departmentName}
                  </td>
                )}
                <td>{doctor.pocName}</td>
                <td>{doctor.contactNumber}</td>
                <td>{doctor.email}</td>
              </tr>
            ));
          })
        ) : (
          <tr>
            <td colSpan="5">No doctors found</td>
          </tr>
        )}
      </tbody>
    </table>
  )}
</div>

    </>
  );
};

export default DoctorsList;

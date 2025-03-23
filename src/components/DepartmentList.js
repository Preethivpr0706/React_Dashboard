import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Briefcase, ArrowLeft, Search, Loader, AlertCircle } from "lucide-react";
import "./styles/DepartmentList.css";
import authenticatedFetch from "../authenticatedFetch";

const DepartmentList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for departments data
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for protected data with persistence
  const [clientId, setClientId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      // First try to get state from location
      if (location.state && location.state.clientId) {
        setClientId(location.state.clientId);
        
        // Save to sessionStorage for persistence
        try {
          sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
        } catch (error) {
          console.error("Failed to save clientId to sessionStorage:", error);
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not available in location, try sessionStorage
      try {
        const storedClientId = sessionStorage.getItem('clientId');
        
        if (storedClientId) {
          setClientId(JSON.parse(storedClientId));
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

  // Fetch departments once clientId is available
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await authenticatedFetch("/api/admin/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });

        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          throw new Error("Failed to fetch departments");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (clientId && !isLoading) {
      fetchDepartments();
    }
  }, [clientId, isLoading]);



  const filteredDepartments = departments.filter(dept =>
    dept.DepartmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader className="loading-spinner" size={36} />
        <p>Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="department-container">
      <div className="department-header">
        <h1 className="department-title">
          <Briefcase className="department-icon" size={28} />
          Departments
        </h1>
      </div>

      <div className="department-card">
        <div className="department-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search departments..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="department-count">
            {!loading && !error && (
              <span>{departments.length} Departments</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader className="loading-spinner" size={36} />
            <p>Loading departments...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <AlertCircle size={36} className="error-icon" />
            <p>{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : (
          <div className="table-container">
            {filteredDepartments.length > 0 ? (
              <table className="department-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Department Name</th>
                    <th>POCs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept, index) => (
                    <tr key={index} className="department-row">
                      <td className="department-index">{index + 1}</td>
                      <td className="department-name">{dept.DepartmentName}</td>
                      <td className="department-pocs">{dept.NoOfPOCs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No departments found matching your search</p>
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm("")}
                  >
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

export default DepartmentList;
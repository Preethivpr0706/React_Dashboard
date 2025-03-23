import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/ViewUsers.css';
import createAuthenticatedAxios from '../createAuthenticatedAxios';

const ViewUsers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State variables
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Protected state - initialize from location directly to avoid race conditions
  const [clientId, setClientId] = useState(location.state?.clientId || null);
  const [clientName, setClientName] = useState(location.state?.clientName || null);
  
  const itemsPerPage = 10;
  const axiosInstance = createAuthenticatedAxios();

  // Load state from location or sessionStorage - run only once on mount
  useEffect(() => {
    const loadState = () => {
      // If clientId is already set from location.state in the initial state, skip
      if (clientId) {
        // Still save to sessionStorage for persistence
        try {
          sessionStorage.setItem('clientId', JSON.stringify(clientId));
          if (clientName) {
            sessionStorage.setItem('clientName', JSON.stringify(clientName));
          }
        } catch (error) {
          console.error("Failed to save client data to sessionStorage:", error);
        }
        return;
      }
      
      // If not available in initial state, try sessionStorage
      try {
        const storedClientId = sessionStorage.getItem('clientId');
        const storedClientName = sessionStorage.getItem('clientName');
        
        if (storedClientId) {
          setClientId(JSON.parse(storedClientId));
          if (storedClientName) {
            setClientName(JSON.parse(storedClientName));
          }
          return;
        }
      } catch (error) {
        console.error("Failed to retrieve state from sessionStorage:", error);
      }
      
      // If we get here, we couldn't get state from either source
      navigate('/', { replace: true });
    };
    
    loadState();
    // Empty dependency array ensures this only runs once on mount
  }, []);

  // Set background color
  useEffect(() => {
    document.body.style.backgroundColor = "#f0f7ff";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Fetch users data
  useEffect(() => {
    if (!clientId) return;
    
    console.log("Fetching users with clientId:", clientId);
    setIsLoading(true);
    axiosInstance
      .post('/api/getUsers', { clientId })
      .then((response) => {
        const data = response.data || [];
        console.log("Users data received:", data.length);
        setUsers(data);
        setFilteredUsers(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        setError("Failed to load users data. Please try again.");
        setIsLoading(false);
      });
  }, [clientId]);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredUsers(
      users.filter((user) =>
        ['User_Name', 'User_Contact', 'User_Email', 'User_Location']
          .some((key) => user[key]?.toLowerCase().includes(term))
      )
    );
    setCurrentPage(1); // Reset to first page on new search
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Calculate page numbers to display (show max 5 page numbers)
  const getPageNumbers = () => {
    let pages = [];
    if (totalPages <= 5) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, 5];
      } else if (currentPage >= totalPages - 2) {
        pages = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
      }
    }
    return pages;
  };

  return (
    <div className="app__users-wrapper">
      <div className="app__view-users">
        <header className="app__users-header">
          <h1 className="app__header-title">
            {clientName ? `${clientName} - User Details` : 'User Details'}
          </h1>
        </header>

        <div className="app__search-container">
          <div className="app__search-bar">
            <h2 className="app__section-title">Users List</h2>
            <div className="app__search-input-wrapper">
              <i className="app__search-icon">🔍</i>
              <input
                type="search"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by name, email, location..."
                className="app__search-input"
              />
              {searchTerm && (
                <button 
                  className="app__clear-search" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilteredUsers(users);
                    setCurrentPage(1);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          <div className="app__users-count">
            <span className="app__count-badge">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="app__loading-container">
            <div className="app__loading-spinner"></div>
            <p className="app__loading-text">Loading users data...</p>
          </div>
        ) : error ? (
          <div className="app__error-container">
            <div className="app__error-icon">!</div>
            <p className="app__error-message">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="app__retry-button"
            >
              Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="app__empty-container">
            <div className="app__empty-icon">👤</div>
            <p className="app__empty-message">
              {searchTerm ? 'No users match your search criteria' : 'No users found'}
            </p>
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilteredUsers(users);
                }} 
                className="app__clear-button"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="app__table-container">
              <table className="app__users-table">
                <thead className="app__table-head">
                  <tr className="app__table-header-row">
                    <th className="app__table-header">S.No.</th>
                    <th className="app__table-header">User Name</th>
                    <th className="app__table-header">User Number</th>
                    <th className="app__table-header">Email</th>
                    <th className="app__table-header">Location</th>
                  </tr>
                </thead>
                <tbody className="app__table-body">
                  {filteredUsers
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((user, index) => (
                      <tr key={user.User_ID} className="app__table-row">
                        <td className="app__table-cell">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="app__table-cell app__user-name">{user.User_Name}</td>
                        <td className="app__table-cell">{user.User_Contact}</td>
                        <td className="app__table-cell app__user-email">{user.User_Email}</td>
                        <td className="app__table-cell">{user.User_Location}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="app__pagination-wrapper">
              <div className="app__pagination">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1} 
                  className="app__pagination-btn app__pagination-nav"
                  aria-label="Previous page"
                >
                  &laquo;
                </button>
                
                {getPageNumbers().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`app__pagination-btn ${currentPage === pageNumber ? 'app__pagination-active' : ''}`}
                    aria-current={currentPage === pageNumber ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
                
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages || totalPages === 0} 
                  className="app__pagination-btn app__pagination-nav"
                  aria-label="Next page"
                >
                  &raquo;
                </button>
              </div>
              
              <div className="app__pagination-info">
                Page {currentPage} of {totalPages || 1}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewUsers;
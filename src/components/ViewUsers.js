import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/ViewUsers.css';


const ViewUsers = () => {
    const location = useLocation();
    const clientId = location.state?.clientId || null;
    const clientName = location.state?.clientName || null;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);
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
    axios
      .post('/api/getUsers', { clientId })
      .then((response) => {
        const data = response.data || [];
        setUsers(data);
        setFilteredUsers(data);
      })
      .catch((error) => console.error('Error fetching users:', error));
  }, [clientId]);

  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setFilteredUsers(
      users.filter((user) =>
        ['User_Name', 'User_Contact', 'User_Email', 'User_Location']
          .some((key) => user[key]?.toLowerCase().includes(searchTerm))
      )
    );
    setSearchTerm(searchTerm);
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const handleBackButton = () => {  
    navigate("/back-button", { state: { clientId, clientName } });  
   }; 
    

  return (
    <div className="users-wrapper">
         {/* <BackButton onClick={handleBackButton}/> */}
      <div className="view-users">
        <header className="header">
          <h1 className="header-title">{clientName} - User Details</h1>
        </header>

        <div className="search-bar">
          <h2 className="section-title">Users</h2>
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search users"
            className="search-input"
          />
        </div>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>User Name</th>
              <th>User Number</th>
              <th>Email</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers
              .slice((currentPage - 1) * 10, currentPage * 10)
              .map((user, index) => (
                <tr key={user.User_ID} className="table-row">
                  <td>{index + 1}</td>
                  <td>{user.User_Name}</td>
                  <td>{user.User_Contact}</td>
                  <td>{user.User_Email}</td>
                  <td>{user.User_Location}</td>
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

export default ViewUsers;

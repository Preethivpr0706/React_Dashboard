import React, { useState, useEffect } from "react";  
import { useLocation, useNavigate } from "react-router-dom";  
import "../styles/AppointmentDetails.css";  
import authenticatedFetch from "../../authenticatedFetch";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AppointmentDetails = () => {  
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for protected data
  const [pocId, setPocId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [pocName, setPocName] = useState(null);
  const [status, setStatus] = useState(null);
  const [type, setType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Appointments data and UI state
  const [appointments, setAppointments] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    paymentStatus: '',
    specialization: ''
  });
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    paymentStatuses: ['All', 'Paid', 'Pay_later'],
    specializations: []
  });

  const appointmentsPerPage = 10;
  const showBranchColumn = appointments.some(appt => appt.BranchID > 0);

  useEffect(() => {
    // Set the background color when the component is mounted
    document.body.style.backgroundColor = "#f5f7fa";
    
    // Cleanup when the component is unmounted or navigation happens
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      // First try to get state from location
      if (location.state) {
        if (location.state.pocId) {
          setPocId(location.state.pocId);
          sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
        }
        
        if (location.state.clientId) {
          setClientId(location.state.clientId);
          sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
        }
        
        if (location.state.pocName) {
          setPocName(location.state.pocName);
          sessionStorage.setItem('pocName', JSON.stringify(location.state.pocName));
        }
        
        if (location.state.status) {
          setStatus(location.state.status);
          sessionStorage.setItem('appointmentStatus', JSON.stringify(location.state.status));
        }
        
        if (location.state.type) {
          setType(location.state.type);
          sessionStorage.setItem('appointmentType', JSON.stringify(location.state.type));
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not available in location, try sessionStorage
      try {
        const storedPocId = sessionStorage.getItem('pocId');
        const storedClientId = sessionStorage.getItem('clientId');
        const storedPocName = sessionStorage.getItem('pocName');
        const storedStatus = sessionStorage.getItem('appointmentStatus');
        const storedType = sessionStorage.getItem('appointmentType');
        
        if (storedPocId) setPocId(JSON.parse(storedPocId));
        if (storedClientId) setClientId(JSON.parse(storedClientId));
        if (storedPocName) setPocName(JSON.parse(storedPocName));
        if (storedStatus) setStatus(JSON.parse(storedStatus));
        if (storedType) setType(JSON.parse(storedType));
        
        if (storedPocId && (storedStatus || storedType)) {
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

    // Load UI state from sessionStorage
    try {
      const storedSearchTerm = sessionStorage.getItem('appointmentSearchTerm');
      const storedCurrentPage = sessionStorage.getItem('appointmentCurrentPage');
      const storedFilters = sessionStorage.getItem('appointmentFilters');

      if (storedSearchTerm !== null) setSearchTerm(storedSearchTerm);
      if (storedCurrentPage !== null) setCurrentPage(parseInt(storedCurrentPage, 10));
      if (storedFilters !== null) setFilters(JSON.parse(storedFilters));
    } catch (error) {
      console.error("Failed to load UI state from sessionStorage:", error);
    }
  }, [location, navigate]);

  // Fetch appointment data
  useEffect(() => {  
    const fetchAppointments = async () => {
      if (!pocId || (!status && !type)) return;
      
      try {  
        setLoading(true);
        const response = await authenticatedFetch("/api/poc/appointment-details", {  
          method: "POST",  
          headers: { "Content-Type": "application/json" },  
          body: JSON.stringify({ pocId, status, type }),  
        });  
    
        if (response.ok) {  
          const data = await response.json();  
          setAppointments(data);
          
          // Extract unique specializations for filter
          const uniqueSpecializations = [...new Set(data.map(appt => appt.Specialization))].sort();
          setFilterOptions(prev => ({
            ...prev,
            specializations: ['All', ...uniqueSpecializations]
          }));
        } else {  
          throw new Error("Failed to fetch appointments");  
        }  
      } catch (err) {  
        setError(err.message);  
      } finally {  
        setLoading(false);  
      }  
    };  
    
    if (!isLoading) {
      fetchAppointments();
    }
  }, [pocId, status, type, isLoading]);

  // Save UI state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('appointmentSearchTerm', searchTerm);
      sessionStorage.setItem('appointmentCurrentPage', currentPage.toString());
      sessionStorage.setItem('appointmentFilters', JSON.stringify(filters));
    } catch (error) {
      console.error("Failed to save UI state to sessionStorage:", error);
    }
  }, [searchTerm, currentPage, filters]);

  // Convert date string to Date object for comparison
  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('-');
    const monthNames = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return new Date(year, monthNames[month], day);
  };

  // Filter appointments based on search and filters
  const getFilteredAppointments = () => {
    return appointments.filter((appt) => {
      // Search term filter
      if (searchTerm && !appt.UserName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const apptDate = parseDate(appt.AppointmentDate);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (apptDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          if (apptDate > toDate) return false;
        }
      }


      // Specialization filter
      if (filters.specialization && filters.specialization !== 'All' && 
          appt.Specialization !== filters.specialization) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus && filters.paymentStatus !== 'All' && 
          appt.Payment_Status !== filters.paymentStatus) {
        return false;
      }

      return true;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  // Pagination
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

  const nextPage = () => {
    if (indexOfLastAppointment < filteredAppointments.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      paymentStatus: '',
      specialization: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredAppointments.map((appt, index) => ({
      'S.No': index + 1,
      'User Name': appt.UserName,
      'Contact': appt.UserContact,
      'Location': appt.UserLocation,
      'POC Name': appt.POCName,
      'Specialization': appt.Specialization,
      [showBranchColumn ? 'Branch' : 'Appointment Type']: showBranchColumn 
        ? (appt.BranchName || `Branch ID: ${appt.BranchID}`)
        : appt.AppointmentType,
      'Appointment Date': appt.AppointmentDate,
      'Appointment Time': appt.AppointmentTime,
      'Payment Status': appt.Payment_Status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
    
    const fileName = `appointments_${status || type}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Appointment Details', 14, 22);
    
    // Add filters info
    doc.setFontSize(10);
    let yPos = 35;
    if (filters.dateFrom || filters.dateTo) {
      doc.text(`Date Range: ${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}`, 14, yPos);
      yPos += 5;
    }
    if (filters.specialization && filters.specialization !== 'All') {
      doc.text(`Specialization: ${filters.specialization}`, 14, yPos);
      yPos += 5;
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'All') {
      doc.text(`Payment Status: ${filters.paymentStatus}`, 14, yPos);
      yPos += 5;
    }

    const tableData = filteredAppointments.map((appt, index) => [
      index + 1,
      appt.UserName,
      appt.UserContact,
      appt.UserLocation,
      appt.POCName,
      appt.Specialization,
       showBranchColumn 
        ? (appt.BranchName || `Branch ID: ${appt.BranchID}`)
        : appt.AppointmentType,
      appt.AppointmentDate,
      appt.AppointmentTime,
      appt.Payment_Status
    ]);

    const headers = [
      'S.No', 'User Name', 'Contact', 'Location', 'POC Name', 'Specialization',
      showBranchColumn ? 'Branch' : 'Appointment Type', 'Date', 'Time', 'Payment'
    ];

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPos + 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 15 },
        9: { cellWidth: 20 }
      }
    });

    const fileName = `appointments_${status || type}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Export to Word (HTML format compatible with Word)
  const exportToWord = () => {
    try {
      // Create HTML content that Word can open in landscape mode
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Details Report</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 0.5in;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              font-size: 10px;
              line-height: 1.2;
            }
            
            h1 { 
              text-align: center; 
              color: #2E86AB; 
              margin-bottom: 15px; 
              font-size: 18px;
              page-break-after: avoid;
            }
            
            .filter-info { 
              margin-bottom: 15px; 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 3px;
              page-break-after: avoid;
            }
            
            .filter-info h3 { 
              margin-top: 0; 
              color: #333; 
              font-size: 12px;
              margin-bottom: 8px;
            }
            
            .filter-item { 
              margin: 3px 0; 
              font-size: 9px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 8px;
              page-break-inside: auto;
            }
            
            th, td { 
              border: 1px solid #ddd; 
              padding: 4px; 
              text-align: left;
              vertical-align: top;
              word-wrap: break-word;
            }
            
            th { 
              background-color: #2E86AB; 
              color: white; 
              font-weight: bold;
              font-size: 8px;
              page-break-after: avoid;
            }
            
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            .paid { 
              color: #28A745; 
              font-weight: bold; 
            }
            
            .unpaid { 
              color: #DC3545; 
              font-weight: bold; 
            }
            
            .summary { 
              margin: 10px 0; 
              font-weight: bold; 
              font-size: 12px;
              page-break-after: avoid;
            }
            
            .footer { 
              margin-top: 20px; 
              text-align: right; 
              font-style: italic; 
              color: #666;
              font-size: 9px;
              page-break-before: avoid;
            }
            
            /* Column-specific widths for landscape layout */
            .col-sno { width: 4%; }
            .col-name { width: 12%; }
            .col-contact { width: 10%; }
            .col-location { width: 10%; }
            .col-poc { width: 12%; }
            .col-spec { width: 12%; }
            .col-type { width: 12%; }
            .col-date { width: 10%; }
            .col-time { width: 8%; }
            .col-payment { width: 10%; }
            
            /* Responsive text for small cells */
            .small-text {
              font-size: 7px;
              line-height: 1.1;
            }
          </style>
        </head>
        <body>
          <h1>Appointment Details Report</h1>
      `;

      // Add filter information
      const filterInfo = [];
      if (filters.dateFrom || filters.dateTo) {
        filterInfo.push(`Date Range: ${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}`);
      }
      if (filters.specialization && filters.specialization !== 'All') {
        filterInfo.push(`Specialization: ${filters.specialization}`);
      }
      if (filters.paymentStatus && filters.paymentStatus !== 'All') {
        filterInfo.push(`Payment Status: ${filters.paymentStatus}`);
      }

      if (filterInfo.length > 0) {
        htmlContent += `
          <div class="filter-info">
            <h3>Applied Filters:</h3>
            ${filterInfo.map(filter => `<div class="filter-item">• ${filter}</div>`).join('')}
          </div>
        `;
      }

      // Add summary
      htmlContent += `<div class="summary">Total Appointments: ${filteredAppointments.length}</div>`;

      // Add table with column classes for better control
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th class="col-sno">S.No</th>
              <th class="col-name">User Name</th>
              <th class="col-contact">Contact</th>
              <th class="col-location">Location</th>
              <th class="col-poc">POC Name</th>
              <th class="col-spec">Specialization</th>
             <th className="col-branch">${showBranchColumn ? 'Branch' : 'Appointment Type'}</th>
              <th class="col-date">Date</th>
              <th class="col-time">Time</th>
              <th class="col-payment">Payment Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Add data rows with better text handling
      filteredAppointments.forEach((appt, index) => {
        const paymentClass = appt.Payment_Status === 'Paid' ? 'paid' : 'pay_later';
        
        // Truncate long text for better display
        const truncateText = (text, maxLength = 15) => {
          return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };
        
        htmlContent += `
          <tr>
            <td class="col-sno">${index + 1}</td>
            <td class="col-name" title="${appt.UserName}">${truncateText(appt.UserName, 20)}</td>
            <td class="col-contact">${appt.UserContact}</td>
            <td class="col-location" title="${appt.UserLocation}">${truncateText(appt.UserLocation, 15)}</td>
            <td class="col-poc" title="${appt.POCName}">${truncateText(appt.POCName, 18)}</td>
           <><td className="col-spec" title="${appt.Specialization}">${truncateText(appt.Specialization, 15)}</td>
          <td className="col-branch" title="${showBranchColumn ? (appt.BranchName || `Branch ID: ${appt.BranchID}`): appt.AppointmentType}">
            ${truncateText(showBranchColumn 
              ? (appt.BranchName || `Branch ID: ${appt.BranchID}`)
              : appt.AppointmentType, 15)}
          </td>
          <td className="col-date small-text">${appt.AppointmentDate}</td></>
            <td class="col-time small-text">${appt.AppointmentTime}</td>
            <td class="col-payment"><span class="${paymentClass}">${appt.Payment_Status}</span></td>
          </tr>
        `;
      });

      htmlContent += `
          </tbody>
        </table>
        <div class="footer">Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredAppointments.length}</div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { 
        type: 'application/msword'
      });
      
      const fileName = `appointments_${status || type}_${new Date().toISOString().split('T')[0]}.doc`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error('Error creating Word document:', error);
      alert('Error creating Word document. Please try again.');
    }
  };

  // Payment status functions
  const getPaymentStatusClass = (status) => {
    if (!status) return 'payment-status-unknown';
    return status.toLowerCase() === 'paid' 
      ? 'payment-status-paid' 
      : 'payment-status-unpaid';
  };
  
  const countPaidAppointments = () => {
    return filteredAppointments.filter(a => a.Payment_Status && a.Payment_Status.toLowerCase() === 'paid').length;
  };
  
  const countUnpaidAppointments = () => {
    return filteredAppointments.filter(a => a.Payment_Status && a.Payment_Status.toLowerCase() !== 'paid').length;
  };
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (  
    <div className="appointment-details-page">
      <div className="appointment-details-header">
        <h1 className="appointment-details-title">Appointment Details</h1>
      </div>
      
      <div className="appointment-details-container">
        {/* Search and Filters Section */}
        <div className="filters-section">
          <div className="search-filter-row">
            <input
              type="text"
              placeholder="Search by user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="appointment-search-box"
            />
            
            <div className="export-buttons">
              <button 
                onClick={exportToExcel}
                className="export-button excel-button"
                disabled={filteredAppointments.length === 0}
              >
                📊 Export Excel
              </button>
              <button 
                onClick={exportToWord}
                className="export-button word-button"
                disabled={filteredAppointments.length === 0}
              >
                📄 Export Word
              </button>
              <button 
                onClick={exportToPDF}
                className="export-button pdf-button"
                disabled={filteredAppointments.length === 0}
              >
                📄 Export PDF
              </button>
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>From Date:</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>To Date:</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Specialization:</label>
              <select
                value={filters.specialization}
                onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                className="filter-select"
              >
                {filterOptions.specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Payment:</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="filter-select"
              >
                {filterOptions.paymentStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={clearAllFilters}
              className="clear-filters-button"
            >
              Clear All
            </button>
          </div>

          {/* Active filters display */}
          <div className="active-filters">
            {(searchTerm || Object.values(filters).some(f => f && f !== 'All')) && (
              <div className="active-filters-info">
                <span>Active filters: </span>
                {searchTerm && <span className="filter-tag">Search: "{searchTerm}"</span>}
                {filters.dateFrom && <span className="filter-tag">From: {filters.dateFrom}</span>}
                {filters.dateTo && <span className="filter-tag">To: {filters.dateTo}</span>}
                {filters.specialization && filters.specialization !== 'All' && 
                  <span className="filter-tag">Specialization: {filters.specialization}</span>}
                {filters.paymentStatus && filters.paymentStatus !== 'All' && 
                  <span className="filter-tag">Payment: {filters.paymentStatus}</span>}
              </div>
            )}
            <div className="results-count">
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </div>
          </div>
        </div>

        {loading ? (  
          <div className="appointment-details-loading">
            <div className="loading-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : error ? (  
          <div className="appointment-details-error">
            <i className="error-icon">!</i>
            <p>{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                window.location.reload();
              }}
              className="refresh-button"
            >
              Try Again
            </button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="no-appointments">
            <div className="empty-state-icon">📅</div>
            <p>No appointments found matching your criteria</p>
            <button
              onClick={clearAllFilters}
              className="refresh-button"
            >
              Clear All Filters
            </button>
          </div>
        ) : (  
          <div className="appointment-details-content">
            <div className="appointment-stats">
              <div className="stat-card">
                <h3>Total</h3>
                <p>{filteredAppointments.length}</p>
              </div>
              <div className="stat-card">
                <h3>Paid</h3>
                <p>{countPaidAppointments()}</p>
              </div>
              <div className="stat-card">
                <h3>Unpaid</h3>
                <p>{countUnpaidAppointments()}</p>
              </div>
            </div>
            
            <div className="appointment-details-table-container">
              <table className="appointment-details-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>User Name</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>POC Name</th>
                    <th>Specialization</th>
                   {showBranchColumn ? (
                    <th>Branch</th>
                  ) : (
                    <th>Appointment Type</th>
                  )}
                    <th>Date</th>
                    <th>Time</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAppointments.map((appt, index) => (
                    <tr key={index}>
                      <td>{indexOfFirstAppointment + index + 1}</td>
                      <td>{appt.UserName || 'N/A'}</td>
                      <td>{appt.UserContact || 'N/A'}</td>
                      <td>{appt.UserLocation || 'N/A'}</td>
                      <td>{appt.POCName || 'N/A'}</td>
                      <td>{appt.Specialization || 'N/A'}</td>
                     <td>
                      <span className="appointment-type">
                        {appt.BranchID > 0 ?
                          (appt.BranchName || `Branch ID: ${appt.BranchID}`) :
                          appt.AppointmentType}
                      </span>
                      </td>
                      <td>{appt.AppointmentDate || 'N/A'}</td>
                      <td>{appt.AppointmentTime || 'N/A'}</td>
                      <td>
                        <span className={getPaymentStatusClass(appt.Payment_Status)}>
                          {appt.Payment_Status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination-controls">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {Math.ceil(filteredAppointments.length / appointmentsPerPage)}
                </span>
                <button
                  onClick={nextPage}
                  disabled={indexOfLastAppointment >= filteredAppointments.length}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );  
};  

export default AppointmentDetails;
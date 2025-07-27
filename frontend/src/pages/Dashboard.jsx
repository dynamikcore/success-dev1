import React from 'react';

const Dashboard = () => {
  return (
    <div>
      <h1>Uvwie LGA Shop Revenue Overview Dashboard</h1>
      {/* Top Row: Summary Cards */}
      <section className="summary-cards">
        <div className="card">Total Registered Shops</div>
        <div className="card">Today's Revenue Collection</div>
        <div className="card">Pending Permit Renewals</div>
        <div className="card">Compliance Rate</div>
      </section>

      {/* Middle Section: Charts */}
      <section className="charts">
        <div className="chart-container">Revenue Trend Chart</div>
        <div className="chart-container">Shop Distribution by Business Type</div>
        <div className="chart-container">Revenue by Ward</div>
      </section>

      {/* Bottom Section: Tables and Actions */}
      <section className="data-tables-actions">
        <div className="table-container">Recent Shop Registrations</div>
        <div className="table-container">Recent Payments</div>
        <div className="alert-container">Expiring Permits Alert</div>
        <div className="action-buttons">
          <button>Register New Shop</button>
          <button>Record Payment</button>
          <button>Issue Permit</button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
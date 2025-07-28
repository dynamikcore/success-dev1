import React from 'react';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Dashboard = () => {
  const navigate = useNavigate();

  // Dummy data for demonstration
  const [stats, setStats] = useState({
    totalShops: 1250,
    todayRevenue: 750000,
    pendingRenewals: 45,
    complianceRate: 88,
  });

  const [recentRegistrations, setRecentRegistrations] = useState([
    { id: 1, name: 'Grace Boutique', type: 'Fashion', date: '2023-10-26' },
    { id: 2, name: 'Chukwudi Electronics', type: 'Electronics', date: '2023-10-25' },
  ]);

  const [recentPayments, setRecentPayments] = useState([
    { id: 1, shop: 'Mama Ngozi Provisions', amount: 15000, date: '2023-10-26' },
    { id: 2, shop: 'Uvwie Fast Food', amount: 10000, date: '2023-10-24' },
  ]);

  const [expiringPermits, setExpiringPermits] = useState([
    { id: 1, shop: 'Local Pharmacy', type: 'Business Permit', expiry: '2023-11-15' },
    { id: 2, shop: 'Tech Gadgets', type: 'Waste Levy', expiry: '2023-11-30' },
  ]);

  // In a real application, you would fetch this data from your backend
  useEffect(() => {
    // Example of fetching data
    // fetch('/api/dashboard-stats').then(res => res.json()).then(data => setStats(data));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Uvwie LGA Shop Revenue Overview Dashboard</Typography>

      {/* Top Row: Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>Total Registered Shops</Typography>
              <Typography variant="h5" color="primary">{stats.totalShops}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>Today's Revenue Collection</Typography>
              <Typography variant="h5" color="primary">₦{stats.todayRevenue.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>Pending Permit Renewals</Typography>
              <Typography variant="h5" color="error">{stats.pendingRenewals}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>Compliance Rate</Typography>
              <Typography variant="h5" color="success">{stats.complianceRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Middle Section: Charts (Placeholders) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue Trend Chart</Typography>
              <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="text.secondary">Chart Placeholder</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Shop Distribution by Business Type</Typography>
              <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="text.secondary">Chart Placeholder</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue by Ward</Typography>
              <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="text.secondary">Chart Placeholder</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section: Tables and Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Shop Registrations</Typography>
              {/* Table Placeholder */}
              <Box sx={{ height: 150, overflow: 'auto' }}>
                {recentRegistrations.map(reg => (
                  <Typography key={reg.id} variant="body2">{reg.name} ({reg.type}) - {reg.date}</Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Payments</Typography>
              {/* Table Placeholder */}
              <Box sx={{ height: 150, overflow: 'auto' }}>
                {recentPayments.map(payment => (
                  <Typography key={payment.id} variant="body2">{payment.shop}: ₦{payment.amount.toLocaleString()} - {payment.date}</Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Expiring Permits Alert</Typography>
              {/* Alert Placeholder */}
              <Box sx={{ height: 150, overflow: 'auto', bgcolor: 'warning.light', p: 1, borderRadius: 1 }}>
                {expiringPermits.map(permit => (
                  <Typography key={permit.id} variant="body2" color="warning.dark">{permit.shop} ({permit.type}) expires {permit.expiry}</Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/shop-management')}
                >
                  Register New Shop
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/payments')}
                >
                  Record Payment
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/permits')}
                >
                  Issue Permit
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
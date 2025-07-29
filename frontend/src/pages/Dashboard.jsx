import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Alert } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  fetchDashboardStats,
  fetchRecentRegistrations,
  fetchRecentPayments,
  fetchExpiringPermits,
  fetchDashboardCharts,
  formatNaira
} from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalShops: 0,
    todayRevenue: 0,
    pendingRenewals: 0,
    complianceRate: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [expiringPermits, setExpiringPermits] = useState([]);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState({
    revenueChart: null,
    businessTypeChart: null,
    wardRevenueChart: null
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [statsData, registrations, payments, permits, charts] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentRegistrations(5),
          fetchRecentPayments(5),
          fetchExpiringPermits(30),
          fetchDashboardCharts()
        ]);

        setStats(statsData);
        setRecentRegistrations(registrations);
        setRecentPayments(payments);
        setExpiringPermits(permits);
        setChartData(charts);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
              <Typography variant="h5" color="primary">{formatNaira(stats.todayRevenue)}</Typography>
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

      {/* Middle Section: Real Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue Trend (Last 6 Months)</Typography>
              <Box sx={{ height: 200 }}>
                {chartData.revenueChart ? (
                  <Line
                    data={chartData.revenueChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                      }
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Shop Distribution by Business Type</Typography>
              <Box sx={{ height: 200 }}>
                {chartData.businessTypeChart ? (
                  <Pie
                    data={chartData.businessTypeChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right' }
                      }
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue by Ward</Typography>
              <Box sx={{ height: 200 }}>
                {chartData.wardRevenueChart ? (
                  <Bar
                    data={chartData.wardRevenueChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '₦' + value.toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                )}
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Business Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRegistrations.length > 0 ? (
                    recentRegistrations.map((reg) => (
                      <TableRow key={reg.shopId}>
                        <TableCell>{reg.businessName}</TableCell>
                        <TableCell>{reg.businessType}</TableCell>
                        <TableCell>{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No recent registrations</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Payments</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Shop</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPayments.length > 0 ? (
                    recentPayments.map((payment) => (
                      <TableRow key={payment.paymentId}>
                        <TableCell>{payment.shopName}</TableCell>
                        <TableCell>{formatNaira(payment.amountPaid)}</TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No recent payments</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" gutterBottom>Expiring Permits Alert</Typography>
              <Box sx={{ height: 150, overflow: 'auto' }}>
                {expiringPermits.length > 0 ? (
                  expiringPermits.map((permit) => (
                    <Alert key={permit.id} severity="warning" sx={{ mb: 1 }}>
                      {permit.shopName} ({permit.permitType}) expires {new Date(permit.expiryDate).toLocaleDateString()}
                    </Alert>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No permits expiring soon</Typography>
                )}
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
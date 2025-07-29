import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';

import PaymentForm from '../components/PaymentForm';
import { fetchPayments, fetchShops } from '../services/api';

const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;

const PaymentProcessing = () => {
  const [payments, setPayments] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [stats, setStats] = useState({
    todayCollection: 0,
    thisMonthTotal: 0,
    outstandingAmount: 0,
    numTransactions: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [outstandingPayments, setOutstandingPayments] = useState([]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const filters = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      const response = await fetchPayments(filters);
      const paymentsData = response.payments || [];
      setPayments(paymentsData);

      // Calculate stats from actual data
      const today = dayjs().format('YYYY-MM-DD');
      const thisMonth = dayjs().format('YYYY-MM');

      const todayPayments = paymentsData.filter(p => p.paymentDate === today);
      const thisMonthPayments = paymentsData.filter(p => p.paymentDate.startsWith(thisMonth));
      const completedPayments = paymentsData.filter(p => p.paymentStatus === 'Completed');
      const pendingPayments = paymentsData.filter(p => p.paymentStatus === 'Pending');

      setStats({
        todayCollection: todayPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
        thisMonthTotal: thisMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
        outstandingAmount: pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
        numTransactions: completedPayments.length,
      });

      // Set recent payments (last 5)
      setRecentPayments(paymentsData.slice(0, 5));

      // Set outstanding payments (pending/failed)
      setOutstandingPayments(paymentsData.filter(p => p.paymentStatus === 'Pending' || p.paymentStatus === 'Failed'));

    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadShops = async () => {
    try {
      const response = await fetchShops();
      setShops(response.shops || []);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      setShops([]);
    }
  };

  useEffect(() => {
    loadPayments();
    loadShops();
  }, [startDate, endDate]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const filteredPaymentHistory = payments.filter(payment =>
    (payment.Shop && payment.Shop.businessName && payment.Shop.businessName.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
    (payment.receiptNo && payment.receiptNo.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
    (payment.RevenueType && payment.RevenueType.typeName && payment.RevenueType.typeName.toLowerCase().includes(historySearchQuery.toLowerCase()))
  );

  const handleAdvancedFilters = () => {
    alert('Advanced filters dialog would open here');
  };

  const handleExportExcel = () => {
    const headers = ['Receipt No', 'Date', 'Shop Name', 'Revenue Type', 'Amount', 'Method', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredPaymentHistory.map(row =>
        `"${row.receiptNo || ''}","${row.paymentDate || ''}","${row.Shop ? row.Shop.businessName : ''}","${row.RevenueType ? row.RevenueType.typeName : ''}","${row.amount || ''}","${row.paymentMethod || ''}","${row.paymentStatus || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Payment Processing & Revenue Collection
        </Typography>

        {/* Header Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card raised>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography component="div" variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Today's Collection
                </Typography>
                <Typography component="div" variant="h5" color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {formatCurrency(stats.todayCollection)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card raised>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography component="div" variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  This Month's Total
                </Typography>
                <Typography component="div" variant="h5" color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {formatCurrency(stats.thisMonthTotal)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card raised>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography component="div" variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Outstanding Amount
                </Typography>
                <Typography variant="h5" color="error" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {formatCurrency(stats.outstandingAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card raised>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Number of Transactions
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {stats.numTransactions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'flex-end'
            }}>
              <Button variant="contained" size="small">Record Payment</Button>
              <Button variant="outlined" size="small">View Overdue</Button>
              <Button variant="outlined" size="small">Print Daily Summary</Button>
            </Box>
          </Grid>
        </Grid>

        {/* Payment Recording Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Record New Payment</Typography>
          <PaymentForm onPaymentSuccess={loadPayments} />

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Recent Payments</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Receipt No</TableCell>
                <TableCell>Shop Name</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPayments.map((payment) => (
                <TableRow key={payment.paymentId || payment.receiptNo}>
                  <TableCell>{payment.receiptNo || payment.paymentId}</TableCell>
                  <TableCell>{payment.Shop ? payment.Shop.businessName : 'N/A'}</TableCell>
                  <TableCell align="right">{formatCurrency(parseFloat(payment.amount || 0))}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.paymentStatus || 'Unknown'}
                      color={payment.paymentStatus === 'Completed' ? 'success' : payment.paymentStatus === 'Pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{payment.paymentDate || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {recentPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No recent payments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Payment History Section */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Payment History
          </Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            mb: 2,
            gap: { xs: 2, sm: 0 }
          }}>
            <TextField
              label="Search History"
              variant="outlined"
              size="small"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1
            }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                sx={{ mr: { xs: 0, sm: 1 } }}
                onClick={handleAdvancedFilters}
                size="small"
              >
                Advanced Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<TableViewIcon />}
                sx={{ mr: { xs: 0, sm: 1 } }}
                onClick={handleExportExcel}
                size="small"
              >
                Export Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleExportPDF}
                size="small"
              >
                Export PDF
              </Button>
            </Box>
          </Box>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 650, sm: 750 } }} aria-label="payment history table">
              <TableHead>
                <TableRow>
                  <TableCell>Receipt No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Shop Name</TableCell>
                  <TableCell>Revenue Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPaymentHistory.map((row) => (
                  <TableRow
                    key={row.paymentId || row.receiptNo}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">{row.receiptNo || row.paymentId}</TableCell>
                    <TableCell>{row.paymentDate || 'N/A'}</TableCell>
                    <TableCell>{row.Shop ? row.Shop.businessName : 'N/A'}</TableCell>
                    <TableCell>{row.RevenueType ? row.RevenueType.typeName : 'N/A'}</TableCell>
                    <TableCell align="right">{formatCurrency(parseFloat(row.amount || 0))}</TableCell>
                    <TableCell>{row.paymentMethod || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.paymentStatus || 'Unknown'}
                        color={row.paymentStatus === 'Completed' ? 'success' : row.paymentStatus === 'Pending' ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        aria-label="more"
                        id="long-button"
                        aria-controls={open ? 'long-menu' : undefined}
                        aria-expanded={open ? 'true' : undefined}
                        aria-haspopup="true"
                        onClick={handleMenuClick}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        id="long-menu"
                        MenuListProps={{
                          'aria-labelledby': 'long-button',
                        }}
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleMenuClose}
                        PaperProps={{
                          style: {
                            maxHeight: 48 * 4.5,
                            width: '20ch',
                          },
                        }}
                      >
                        <MenuItem onClick={() => {
                          handleMenuClose();
                          alert(`Viewing details for ${row.receiptNo || row.paymentId}`);
                        }}>
                          View Details
                        </MenuItem>
                        <MenuItem onClick={() => {
                          handleMenuClose();
                          window.print();
                        }}>
                          <PrintIcon sx={{ mr: 1 }} fontSize="small" /> Print Receipt
                        </MenuItem>
                        <MenuItem onClick={() => {
                          handleMenuClose();
                          alert(`${row.receiptNo || row.paymentId} marked as verified`);
                        }}>
                          Mark as Verified
                        </MenuItem>
                        <MenuItem onClick={() => {
                          handleMenuClose();
                          const penalty = prompt('Enter penalty amount:');
                          if (penalty) {
                            alert(`Penalty of ₦${penalty} applied to ${row.receiptNo || row.paymentId}`);
                          }
                        }}>
                          Apply Penalty
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPaymentHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No payment history found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Outstanding Payments Section */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Outstanding Payments</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Shop Name</TableCell>
                <TableCell>Revenue Type</TableCell>
                <TableCell align="right">Amount Due</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outstandingPayments.map((payment) => (
                <TableRow key={payment.paymentId}>
                  <TableCell>{payment.Shop ? payment.Shop.businessName : 'N/A'}</TableCell>
                  <TableCell>{payment.RevenueType ? payment.RevenueType.typeName : 'N/A'}</TableCell>
                  <TableCell align="right">{formatCurrency(parseFloat(payment.amount || 0))}</TableCell>
                  <TableCell>{payment.paymentDate || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.paymentStatus || 'Unknown'}
                      color={payment.paymentStatus === 'Pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => {
                        alert(`Reminder sent to ${payment.shopName || 'shop'}`);
                      }}
                    >
                      Send Reminder
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        alert(`Processing payment for ${payment.shopName || 'shop'}`);
                      }}
                    >
                      Process Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {outstandingPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No outstanding payments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                alert(`Processing ${outstandingPayments.length} outstanding payments`);
              }}
              disabled={outstandingPayments.length === 0}
            >
              Bulk Process Payments
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                alert('Opening compliance management interface');
              }}
            >
              Manage Compliance Status
            </Button>
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default PaymentProcessing;
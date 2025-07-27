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

// Dummy Data and API functions (replace with actual data and API calls)
const dummyStats = {
  todayCollection: 150000,
  thisMonthTotal: 5750000,
  outstandingAmount: 12300000,
  numTransactions: 75,
};

const dummyRecentPayments = [
  { id: 'REC001', shopName: 'Mama Ngozi Provisions', amount: 15000, status: 'Completed', date: '2023-10-26' },
  { id: 'REC002', shopName: 'Chukwudi Electronics', amount: 25000, status: 'Pending', date: '2023-10-25' },
  { id: 'REC003', shopName: 'Grace Boutique', amount: 5000, status: 'Completed', date: '2023-10-25' },
  { id: 'REC004', shopName: 'Uvwie Fast Food', amount: 10000, status: 'Failed', date: '2023-10-24' },
];

const dummyPaymentHistory = [
  { receiptNo: 'REC001', date: '2023-10-26', shopName: 'Mama Ngozi Provisions', revenueType: 'Business Premises Permit', amount: 15000, method: 'Bank Transfer', status: 'Completed' },
  { receiptNo: 'REC002', date: '2023-10-25', shopName: 'Chukwudi Electronics', revenueType: 'Waste Management Levy', amount: 2500, method: 'POS', status: 'Pending' },
  { receiptNo: 'REC003', date: '2023-10-25', shopName: 'Grace Boutique', revenueType: 'Signage Fee', amount: 5000, method: 'Cash', status: 'Completed' },
  { receiptNo: 'REC004', date: '2023-10-24', shopName: 'Uvwie Fast Food', revenueType: 'Business Premises Permit', amount: 10000, method: 'Online', status: 'Failed' },
  { receiptNo: 'REC005', date: '2023-10-23', shopName: 'Local Pharmacy', revenueType: 'Waste Management Levy', amount: 2500, method: 'Bank Transfer', status: 'Completed' },
  { receiptNo: 'REC006', date: '2023-10-22', shopName: 'Tech Gadgets', revenueType: 'Business Premises Permit', amount: 20000, method: 'POS', status: 'Completed' },
  { receiptNo: 'REC007', date: '2023-10-21', shopName: 'Fashion Hub', revenueType: 'Signage Fee', amount: 5000, method: 'Cash', status: 'Completed' },
  { receiptNo: 'REC008', date: '2023-10-20', shopName: 'Bookworm Store', revenueType: 'Waste Management Levy', amount: 2500, method: 'Online', status: 'Completed' },
  { receiptNo: 'REC009', date: '2023-10-19', shopName: 'Fresh Produce', revenueType: 'Business Premises Permit', amount: 15000, method: 'Bank Transfer', status: 'Completed' },
  { receiptNo: 'REC010', date: '2023-10-18', shopName: 'Auto Repair', revenueType: 'Signage Fee', amount: 5000, method: 'POS', status: 'Completed' },
];

const dummyOutstandingPayments = [
  { id: 'OUT001', shopName: 'Unpaid Groceries', revenueType: 'Business Premises Permit', amount: 15000, dueDate: '2023-09-30', penalty: 1500 },
  { id: 'OUT002', shopName: 'Deluxe Salon', revenueType: 'Waste Management Levy', amount: 2500, dueDate: '2023-10-15', penalty: 125 },
];

const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;

const PaymentProcessing = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const filteredPaymentHistory = dummyPaymentHistory.filter(payment =>
    payment.shopName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    payment.receiptNo.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    payment.revenueType.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Payment Processing & Revenue Collection</Typography>

        {/* Header Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card raised>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>Today's Collection</Typography>
                <Typography variant="h5" color="primary">{formatCurrency(dummyStats.todayCollection)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card raised>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>This Month's Total</Typography>
                <Typography variant="h5" color="primary">{formatCurrency(dummyStats.thisMonthTotal)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card raised>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>Outstanding Amount</Typography>
                <Typography variant="h5" color="error">{formatCurrency(dummyStats.outstandingAmount)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card raised>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>Number of Transactions</Typography>
                <Typography variant="h5" color="primary">{dummyStats.numTransactions}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="contained">Record Payment</Button>
              <Button variant="outlined">View Overdue</Button>
              <Button variant="outlined">Print Daily Summary</Button>
            </Box>
          </Grid>
        </Grid>

        {/* Payment Recording Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Record New Payment</Typography>
          <PaymentForm />

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
              {dummyRecentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.id}</TableCell>
                  <TableCell>{payment.shopName}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={payment.status === 'Completed' ? 'success' : payment.status === 'Pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{payment.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="text" size="small">Quick Pay: Business Permit</Button>
            <Button variant="text" size="small">Quick Pay: Waste Levy</Button>
          </Box>
        </Paper>

        {/* Payment History Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Payment History</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              label="Search History"
              variant="outlined"
              size="small"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box>
              <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ mr: 1 }}>Advanced Filters</Button>
              <Button variant="outlined" startIcon={<TableViewIcon />} sx={{ mr: 1 }}>Export Excel</Button>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>Export PDF</Button>
            </Box>
          </Box>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="payment history table">
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
                    key={row.receiptNo}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">{row.receiptNo}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.shopName}</TableCell>
                    <TableCell>{row.revenueType}</TableCell>
                    <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                    <TableCell>{row.method}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={row.status === 'Completed' ? 'success' : row.status === 'Pending' ? 'warning' : 'error'}
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
                        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
                        <MenuItem onClick={handleMenuClose}><PrintIcon sx={{ mr: 1 }} fontSize="small" /> Print Receipt</MenuItem>
                        <MenuItem onClick={handleMenuClose}>Mark as Verified</MenuItem>
                        <MenuItem onClick={handleMenuClose}>Apply Penalty</MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
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
                <TableCell align="right">Penalty</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dummyOutstandingPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.shopName}</TableCell>
                  <TableCell>{payment.revenueType}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell align="right" color="error">{formatCurrency(payment.penalty)}</TableCell>
                  <TableCell align="center">
                    <Button variant="outlined" size="small" sx={{ mr: 1 }}>Send Reminder</Button>
                    <Button variant="contained" size="small">Process Payment</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" color="secondary">Bulk Process Payments</Button>
            <Button variant="outlined">Manage Compliance Status</Button>
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default PaymentProcessing;
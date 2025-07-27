import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

// Dummy Data and API functions
const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;

const generateReportData = async (reportType, startDate, endDate, filters) => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  switch (reportType) {
    case 'dailyCollection':
      return {
        summary: { total: 250000, transactions: 15 },
        tableData: [
          { id: 1, time: '09:00', shop: 'Shop A', amount: 15000, method: 'Cash' },
          { id: 2, time: '10:30', shop: 'Shop B', amount: 25000, method: 'POS' },
          { id: 3, time: '11:45', shop: 'Shop C', amount: 10000, method: 'Bank Transfer' },
        ],
      };
    case 'monthlyRevenue':
      return {
        summary: { total: 7500000, averageDaily: 250000 },
        chartData: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Monthly Revenue',
              data: [1800000, 2200000, 1500000, 2000000],
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        },
        tableData: [
          { id: 1, month: 'October', revenue: 7500000, transactions: 300 },
        ],
      };
    case 'annualRevenue':
      return {
        summary: { total: 85000000, growth: '10%' },
        chartData: {
          labels: ['2021', '2022', '2023'],
          datasets: [
            {
              label: 'Annual Revenue',
              data: [70000000, 78000000, 85000000],
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              tension: 0.1,
            },
          ],
        },
        tableData: [
          { id: 1, year: 2023, revenue: 85000000, growth: '10%' },
        ],
      };
    case 'revenueByWard':
      return {
        summary: { highestWard: 'Ward 5', total: 12000000 },
        chartData: {
          labels: ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'],
          datasets: [
            {
              label: 'Revenue by Ward',
              data: [2000000, 3000000, 1500000, 2500000, 3000000],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
            },
          ],
        },
        tableData: [
          { id: 1, ward: 'Ward 1', revenue: 2000000 },
          { id: 2, ward: 'Ward 2', revenue: 3000000 },
        ],
      };
    case 'shopRegistrationStats':
      return {
        summary: { totalShops: 1500, newRegistrations: 50 },
        chartData: {
          labels: ['Registered', 'Pending'],
          datasets: [
            {
              label: '# of Shops',
              data: [1450, 50],
              backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 206, 86, 0.6)'],
            },
          ],
        },
        tableData: [
          { id: 1, status: 'Registered', count: 1450 },
          { id: 2, status: 'Pending', count: 50 },
        ],
      };
    case 'businessTypeDistribution':
      return {
        summary: { mostCommon: 'Retail', total: 1500 },
        chartData: {
          labels: ['Retail', 'Food Service', 'Services', 'Manufacturing'],
          datasets: [
            {
              label: 'Business Types',
              data: [700, 400, 300, 100],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
              ],
            },
          ],
        },
        tableData: [
          { id: 1, type: 'Retail', count: 700 },
          { id: 2, type: 'Food Service', count: 400 },
        ],
      };
    case 'complianceRateAnalysis':
      return {
        summary: { overall: '85%', improved: '5%' },
        chartData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Compliance Rate (%)',
              data: [80, 82, 83, 85, 84, 85],
              borderColor: 'rgb(53, 162, 235)',
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              tension: 0.1,
            },
          ],
        },
        tableData: [
          { id: 1, month: 'June', rate: '85%' },
        ],
      };
    case 'permitIssuanceStats':
      return {
        summary: { totalIssued: 1000, newIssued: 100 },
        chartData: {
          labels: ['Business Permit', 'Signage Permit', 'Waste Permit'],
          datasets: [
            {
              label: 'Permits Issued',
              data: [500, 300, 200],
              backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
              ],
            },
          ],
        },
        tableData: [
          { id: 1, type: 'Business Permit', count: 500 },
        ],
      };
    case 'expiryRenewalTracking':
      return {
        summary: { expiringSoon: 50, renewed: 30 },
        tableData: [
          { id: 1, permit: 'BP-001', shop: 'Shop A', expiry: '2023-12-31', status: 'Expiring Soon' },
          { id: 2, permit: 'SF-005', shop: 'Shop B', expiry: '2024-01-15', status: 'Active' },
        ],
      };
    case 'defaulterLists':
      return {
        summary: { totalDefaulters: 200, highRisk: 50 },
        tableData: [
          { id: 1, shop: 'Shop X', owner: 'John Doe', contact: '08012345678', outstanding: 25000, penalty: 2500 },
          { id: 2, shop: 'Shop Y', owner: 'Jane Smith', contact: '08087654321', outstanding: 10000, penalty: 500 },
        ],
      };
    case 'outstandingPaymentsSummary':
      return {
        summary: { totalOutstanding: 12300000, oldest: 'Shop Z (180 days)' },
        tableData: [
          { id: 1, shop: 'Shop A', revenueType: 'Business Permit', amount: 15000, dueDate: '2023-09-30', penalty: 1500 },
          { id: 2, shop: 'Shop B', revenueType: 'Waste Levy', amount: 2500, dueDate: '2023-10-15', penalty: 125 },
        ],
      };
    default:
      return {};
  }
};

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setReportType(''); // Reset report type when tab changes
    setReportResult(null);
  };

  const handleGenerateReport = async () => {
    if (!reportType) return;
    setLoading(true);
    try {
      const data = await generateReportData(reportType, startDate, endDate);
      setReportResult(data);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedTableData = reportResult?.tableData ? [...reportResult.tableData].sort((a, b) => {
    if (orderBy === '') return 0;
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
  }) : [];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Generating Report...</Typography>
        </Box>
      );
    }
    if (!reportResult) {
      return <Typography sx={{ mt: 2 }}>Select a report type and generate to see results.</Typography>;
    }

    const columns = reportResult.tableData && reportResult.tableData.length > 0
      ? Object.keys(reportResult.tableData[0]).map(key => ({ id: key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }))
      : [];

    return (
      <Box sx={{ mt: 3 }}>
        {reportResult.summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.entries(reportResult.summary).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Typography>
                    <Typography variant="h6">{typeof value === 'number' ? formatCurrency(value) : value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {reportResult.chartData && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Chart Visualization</Typography>
            {reportType === 'annualRevenue' || reportType === 'complianceRateAnalysis' ? (
              <Line data={reportResult.chartData} />
            ) : reportType === 'revenueByWard' || reportType === 'monthlyRevenue' ? (
              <Bar data={reportResult.chartData} />
            ) : (
              <Pie data={reportResult.chartData} />
            )}
          </Paper>
        )}

        {reportResult.tableData && reportResult.tableData.length > 0 && (
          <TableContainer component={Paper} elevation={1}>
            <Table aria-label="report data table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      sortDirection={orderBy === column.id ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? sortedTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : sortedTableData
                ).map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        {typeof row[column.id] === 'number' && column.id.toLowerCase().includes('amount') || column.id.toLowerCase().includes('revenue') || column.id.toLowerCase().includes('total')
                          ? formatCurrency(row[column.id])
                          : row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={sortedTableData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="outlined">Export to PDF</Button>
          <Button variant="outlined">Export to Excel</Button>
          <Button variant="outlined">Print</Button>
        </Box>
      </Box>
    );
  };

  const reportOptions = {
    0: [
      { value: 'dailyCollection', label: 'Daily Collection Summary' },
      { value: 'monthlyRevenue', label: 'Monthly Revenue Analysis' },
      { value: 'annualRevenue', label: 'Annual Revenue Trends' },
      { value: 'revenueByWard', label: 'Revenue by Ward Comparison' },
    ],
    1: [
      { value: 'shopRegistrationStats', label: 'Shop Registration Statistics' },
      { value: 'businessTypeDistribution', label: 'Business Type Distribution' },
      { value: 'complianceRateAnalysis', label: 'Compliance Rate Analysis' },
      { value: 'shopGrowthTrends', label: 'Shop Growth Trends' },
    ],
    2: [
      { value: 'permitIssuanceStats', label: 'Permit Issuance Statistics' },
      { value: 'expiryRenewalTracking', label: 'Expiry and Renewal Tracking' },
      { value: 'permitRevenueAnalysis', label: 'Permit Revenue Analysis' },
    ],
    3: [
      { value: 'defaulterLists', label: 'Defaulter Lists' },
      { value: 'complianceRateByBusinessType', label: 'Compliance Rate by Business Type' },
      { value: 'outstandingPaymentsSummary', label: 'Outstanding Payments Summary' },
      { value: 'penaltyCollectionReport', label: 'Penalty Collection Report' },
    ],
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Comprehensive Reports</Typography>

        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="report categories tabs">
            <Tab label="Revenue Reports" />
            <Tab label="Shop Analytics" />
            <Tab label="Permit Management" />
            <Tab label="Compliance Reports" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Select Report</InputLabel>
                  <Select
                    value={reportType}
                    label="Select Report"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {reportOptions[tabValue].map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="contained"
                  onClick={handleGenerateReport}
                  disabled={!reportType || loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Generate'}
                </Button>
              </Grid>
            </Grid>
            {renderReportContent()}
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;
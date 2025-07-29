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
  Card,
  CardContent,
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

// Real API functions for reports
const generateReportData = async (reportType, startDate, endDate, filters) => {
  const API_BASE_URL = 'http://localhost:5000/api';

  try {
    let endpoint = '';
    let params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate.format('YYYY-MM-DD'));
    if (endDate) params.append('endDate', endDate.format('YYYY-MM-DD'));

    switch (reportType) {
      case 'dailyCollection':
        endpoint = '/reports/daily-collection';
        break;
      case 'monthlyRevenue':
        endpoint = '/reports/monthly-summary';
        if (startDate) {
          params.append('year', startDate.year());
          params.append('month', startDate.month() + 1);
        }
        break;
      case 'annualRevenue':
        endpoint = '/reports/collection-trends';
        params.append('period', 'yearly');
        if (startDate) params.append('year', startDate.year());
        break;
      case 'revenueByWard':
        endpoint = '/reports/revenue-by-ward';
        break;
      case 'shopRegistrationStats':
        endpoint = '/reports/shop-analytics';
        break;
      case 'businessTypeDistribution':
        endpoint = '/reports/business-type-analysis';
        break;
      case 'complianceRateAnalysis':
        endpoint = '/reports/compliance-report';
        break;
      case 'permitIssuanceStats':
        endpoint = '/reports/permit-status';
        break;
      case 'expiryRenewalTracking':
        endpoint = '/reports/permit-status';
        break;
      case 'defaulterLists':
        endpoint = '/reports/compliance-report';
        break;
      case 'outstandingPaymentsSummary':
        endpoint = '/reports/outstanding-payments-summary';
        break;
      default:
        throw new Error('Invalid report type');
    }

    const url = `${API_BASE_URL}${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform data for chart display
    return transformReportData(reportType, data);

  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
};

const transformReportData = (reportType, data) => {
  switch (reportType) {
    case 'dailyCollection':
      return {
        summary: {
          total: parseFloat(data.totalCollection?.replace(/[₦,]/g, '') || 0),
          transactions: data.numberOfTransactions || 0
        },
        tableData: Object.entries(data.collectionByRevenueType || {}).map((entry, index) => ({
          id: index + 1,
          revenueType: entry[0],
          amount: entry[1],
          count: Math.floor(Math.random() * 10) + 1 // Placeholder
        }))
      };

    case 'monthlyRevenue':
      return {
        summary: {
          total: parseFloat(data.totalRevenue?.replace(/[₦,]/g, '') || 0),
          averageDaily: Math.floor(parseFloat(data.totalRevenue?.replace(/[₦,]/g, '') || 0) / 30)
        },
        chartData: {
          labels: Object.keys(data.revenueByRevenueType || {}),
          datasets: [{
            label: 'Monthly Revenue',
            data: Object.values(data.revenueByRevenueType || {}),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          }]
        },
        tableData: [{
          id: 1,
          month: new Date().toLocaleDateString('en-US', { month: 'long' }),
          revenue: parseFloat(data.totalRevenue?.replace(/[₦,]/g, '') || 0),
          transactions: data.numberOfTransactions || 0
        }]
      };

    case 'revenueByWard':
      return {
        summary: {
          highestWard: data[0]?.ward || 'N/A',
          total: data.reduce((sum, item) => sum + parseFloat(item.totalRevenue?.replace(/[₦,]/g, '') || 0), 0)
        },
        chartData: {
          labels: data.map(item => item.ward),
          datasets: [{
            label: 'Revenue by Ward',
            data: data.map(item => parseFloat(item.totalRevenue?.replace(/[₦,]/g, '') || 0)),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ]
          }]
        },
        tableData: data.map((item, index) => ({
          id: index + 1,
          ward: item.ward,
          revenue: parseFloat(item.totalRevenue?.replace(/[₦,]/g, '') || 0)
        }))
      };

    default:
      return data;
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

  const handleExportPDF = () => {
    if (!reportResult) {
      alert('Please generate a report first');
      return;
    }

    // Enhanced PDF generation
    const printWindow = window.open('', '_blank');
    const tableHeaders = reportResult.tableData && reportResult.tableData.length > 0
      ? Object.keys(reportResult.tableData[0]).map(key =>
          key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        ).join('</th><th>')
      : '';

    const tableRows = reportResult.tableData
      ? reportResult.tableData.map(row =>
          `<tr>${Object.values(row).map(val => {
            if (typeof val === 'number' && val > 1000) {
              return `<td>${formatCurrency(val)}</td>`;
            }
            return `<td>${val}</td>`;
          }).join('')}</tr>`
        ).join('')
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Uvwie LGA Report - ${reportType}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2e7d32; }
            .subtitle { color: #666; margin-top: 5px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Uvwie Local Government Area</div>
            <div class="subtitle">Revenue Management System Report</div>
            <div class="subtitle">Report Type: ${reportType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
            <div class="subtitle">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>

          ${reportResult.summary ? `
            <div class="summary">
              <h3>Summary</h3>
              ${Object.entries(reportResult.summary).map(([key, value]) =>
                `<p><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${typeof value === 'number' ? formatCurrency(value) : value}</p>`
              ).join('')}
            </div>
          ` : ''}

          ${reportResult.tableData ? `
            <table>
              <thead>
                <tr><th>${tableHeaders}</th></tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p>This report was generated by the Uvwie LGA Revenue Management System</p>
            <p>For inquiries, contact the Revenue Department</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    if (!reportResult?.tableData) {
      alert('No data to export');
      return;
    }

    // Enhanced CSV export with proper formatting
    const headers = Object.keys(reportResult.tableData[0]);
    const csvContent = [
      headers.join(','),
      ...reportResult.tableData.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle currency values
          if (typeof value === 'number' && (header.toLowerCase().includes('amount') || header.toLowerCase().includes('revenue'))) {
            return `"${formatCurrency(value)}"`;
          }
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || '');
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uvwie-lga-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
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
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {typeof value === 'number' ? formatCurrency(value) : value}
                    </Typography>
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

        <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Button variant="outlined" onClick={handleExportPDF} size="small">Export to PDF</Button>
          <Button variant="outlined" onClick={handleExportExcel} size="small">Export to Excel</Button>
          <Button variant="outlined" onClick={handlePrint} size="small">Print</Button>
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
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Comprehensive Reports
        </Typography>

        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="report categories tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 160 }
              }
            }}
          >
            <Tab label="Revenue Reports" />
            <Tab label="Shop Analytics" />
            <Tab label="Permit Management" />
            <Tab label="Compliance Reports" />
          </Tabs>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
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
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
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
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="contained"
                  onClick={handleGenerateReport}
                  disabled={!reportType || loading}
                  fullWidth
                  size="small"
                >
                  {loading ? <CircularProgress size={20} /> : 'Generate'}
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
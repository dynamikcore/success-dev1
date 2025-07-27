import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  TextField,
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
  Checkbox,
  Toolbar,
  alpha,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import RenewIcon from '@mui/icons-material/Autorenew';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';

// Dummy Data and API functions
const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;

const dummyPermits = [
  { id: 'P001', shopName: 'Shop A', permitType: 'Business Permit', issueDate: '2023-01-01', expiryDate: '2023-12-31', status: 'Active' },
  { id: 'P002', shopName: 'Shop B', permitType: 'Signage Permit', issueDate: '2023-03-15', expiryDate: '2023-09-30', status: 'Expired' },
  { id: 'P003', shopName: 'Shop C', permitType: 'Waste Permit', issueDate: '2023-06-01', expiryDate: '2024-01-31', status: 'Expiring Soon' },
  { id: 'P004', shopName: 'Shop D', permitType: 'Business Permit', issueDate: '2023-07-20', expiryDate: '2024-07-19', status: 'Active' },
  { id: 'P005', shopName: 'Shop E', permitType: 'Signage Permit', issueDate: '2023-02-10', expiryDate: '2023-08-09', status: 'Expired' },
  { id: 'P006', shopName: 'Shop F', permitType: 'Business Permit', issueDate: '2023-11-01', expiryDate: '2024-10-31', status: 'Active' },
  { id: 'P007', shopName: 'Shop G', permitType: 'Waste Permit', issueDate: '2023-10-25', expiryDate: '2023-12-25', status: 'Expiring Soon' },
];

const dummyShops = [
  { id: 'S001', name: 'Shop A' },
  { id: 'S002', name: 'Shop B' },
  { id: 'S003', name: 'Shop C' },
  { id: 'S004', name: 'Shop D' },
  { id: 'S005', name: 'Shop E' },
  { id: 'S006', name: 'Shop F' },
  { id: 'S007', name: 'Shop G' },
];

const dummyPermitTypes = [
  { id: 'PT001', name: 'Business Permit', fee: 15000 },
  { id: 'PT002', name: 'Signage Permit', fee: 5000 },
  { id: 'PT003', name: 'Waste Permit', fee: 2500 },
];

const fetchPermits = async (filters) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  let filteredPermits = dummyPermits;
  if (filters?.status) {
    filteredPermits = filteredPermits.filter(p => p.status === filters.status);
  }
  if (filters?.type) {
    filteredPermits = filteredPermits.filter(p => p.permitType === filters.type);
  }
  return filteredPermits;
};

const fetchShops = async (query) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return dummyShops.filter(shop => shop.name.toLowerCase().includes(query.toLowerCase()));
};

const fetchPermitTypes = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return dummyPermitTypes;
};

const issuePermit = async (permitData) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Issuing permit:', permitData);
  return { success: true, permitId: `P${Math.floor(Math.random() * 1000)}` };
};

const renewPermit = async (permitIds) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Renewing permits:', permitIds);
  return { success: true, renewedCount: permitIds.length };
};

const sendReminder = async (permitIds) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Sending reminders for permits:', permitIds);
  return { success: true, sentCount: permitIds.length };
};

// Schema for Permit Issuance Form
const permitSchema = yup.object().shape({
  shopId: yup.string().required('Shop is required'),
  permitType: yup.string().required('Permit Type is required'),
  issueDate: yup.date().required('Issue Date is required').nullable(),
  document: yup.mixed().notRequired(),
});

const PermitManagement = () => {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('issueDate');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [shops, setShops] = useState([]);
  const [permitTypes, setPermitTypes] = useState([]);
  const [selectedPermitType, setSelectedPermitType] = useState(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    resolver: yupResolver(permitSchema),
    defaultValues: {
      shopId: '',
      permitType: '',
      issueDate: null,
      document: null,
    },
  });

  const watchPermitType = watch('permitType');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [permitsData, shopsData, permitTypesData] = await Promise.all([
        fetchPermits(),
        fetchShops(''),
        fetchPermitTypes(),
      ]);
      setPermits(permitsData);
      setShops(shopsData);
      setPermitTypes(permitTypesData);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const type = permitTypes.find(pt => pt.id === watchPermitType);
    setSelectedPermitType(type);
    if (watchPermitType && watch('issueDate')) {
      // Calculate dummy expiry date (e.g., 1 year from issue date)
      const issueDate = dayjs(watch('issueDate'));
      if (issueDate.isValid()) {
        setValue('expiryDate', issueDate.add(1, 'year').format('YYYY-MM-DD'));
      }
    }
  }, [watchPermitType, permitTypes, watch('issueDate')]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredPermits.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - permits.length) : 0;

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Expiring Soon': return 'orange';
      case 'Expired': return 'red';
      default: return 'inherit';
    }
  };

  const filteredPermits = permits.filter(permit => {
    const matchesStatus = filterStatus === 'All' || permit.status === filterStatus;
    const matchesType = filterType === 'All' || permit.permitType === filterType;
    return matchesStatus && matchesType;
  });

  const visibleRows = React.useMemo(
    () =>
      stableSort(filteredPermits, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [order, orderBy, page, rowsPerPage, filteredPermits],
  );

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await issuePermit(data);
      if (result.success) {
        alert(`Permit ${result.permitId} issued successfully!`);
        setOpenForm(false);
        reset();
        // Refresh permits list
        const updatedPermits = await fetchPermits();
        setPermits(updatedPermits);
      }
    } catch (error) {
      console.error('Error issuing permit:', error);
      alert('Failed to issue permit.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRenew = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const result = await renewPermit(selected);
      if (result.success) {
        alert(`${result.renewedCount} permits renewed.`);
        setSelected([]);
        const updatedPermits = await fetchPermits();
        setPermits(updatedPermits);
      }
    } catch (error) {
      console.error('Error renewing permits:', error);
      alert('Failed to renew permits.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRemind = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const result = await sendReminder(selected);
      if (result.success) {
        alert(`${result.sentCount} reminders sent.`);
        setSelected([]);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders.');
    } finally {
      setLoading(false);
    }
  };

  // Summary Cards Data
  const activePermits = permits.filter(p => p.status === 'Active').length;
  const expiringSoon = permits.filter(p => p.status === 'Expiring Soon').length;
  const expiredPermits = permits.filter(p => p.status === 'Expired').length;
  const thisMonthsIssuance = permits.filter(p => dayjs(p.issueDate).month() === dayjs().month() && dayjs(p.issueDate).year() === dayjs().year()).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Permit Management</Typography>

        {/* Header Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Active Permits</Typography>
                <Typography variant="h5">{activePermits}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Expiring Soon (30 days)</Typography>
                <Typography variant="h5">{expiringSoon}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Expired Permits</Typography>
                <Typography variant="h5">{expiredPermits}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>This Month's Issuance</Typography>
                <Typography variant="h5">{thisMonthsIssuance}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
              Issue New Permit
            </Button>
          </Box>
          <Box>
            <FormControl sx={{ minWidth: 120, mr: 2 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Permit Type</InputLabel>
              <Select value={filterType} label="Permit Type" onChange={(e) => setFilterType(e.target.value)}>
                <MenuItem value="All">All</MenuItem>
                {permitTypes.map(type => (
                  <MenuItem key={type.id} value={type.name}>{type.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Permit Tracking Section */}
        <Paper elevation={2} sx={{ width: '100%', mb: 2 }}>
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              ...(selected.length > 0 && {
                bgcolor: (theme) =>
                  alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
              }),
            }}
          >
            {selected.length > 0 ? (
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
                component="div"
              >
                {selected.length} selected
              </Typography>
            ) : (
              <Typography
                sx={{ flex: '1 1 100%' }}
                variant="h6"
                id="tableTitle"
                component="div"
              >
                Permits
              </Typography>
            )}

            {selected.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Renew Selected">
                  <IconButton onClick={handleBulkRenew} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : <RenewIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Send Reminders">
                  <IconButton onClick={handleBulkRemind} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Tooltip>
                {/* <Tooltip title="Delete">
                  <IconButton>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip> */}
              </Box>
            ) : (
              <Tooltip title="Filter list">
                <IconButton>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
          <TableContainer>
            <Table
              sx={{ minWidth: 750 }}
              aria-labelledby="tableTitle"
              size={'medium'}
            >
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < filteredPermits.length}
                      checked={filteredPermits.length > 0 && selected.length === filteredPermits.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all permits' }}
                    />
                  </TableCell>
                  {['Permit ID', 'Shop Name', 'Permit Type', 'Issue Date', 'Expiry Date', 'Status', 'Actions'].map((headCell) => (
                    <TableCell
                      key={headCell}
                      align={headCell === 'Actions' ? 'center' : 'left'}
                      padding={headCell === 'Permit ID' ? 'none' : 'normal'}
                      sortDirection={orderBy === headCell ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === headCell}
                        direction={orderBy === headCell ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell)}
                      >
                        {headCell}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                      <Typography>Loading Permits...</Typography>
                    </TableCell>
                  </TableRow>
                ) : visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>No permits found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row, index) => {
                    const isItemSelected = isSelected(row.id);
                    const labelId = `enhanced-table-checkbox-${index}`;

                    return (
                      <TableRow
                        hover
                        onClick={(event) => handleClick(event, row.id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row.id}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{ 'aria-labelledby': labelId }}
                          />
                        </TableCell>
                        <TableCell
                          component="th"
                          id={labelId}
                          scope="row"
                          padding="none"
                        >
                          {row.id}
                        </TableCell>
                        <TableCell align="left">{row.shopName}</TableCell>
                        <TableCell align="left">{row.permitType}</TableCell>
                        <TableCell align="left">{row.issueDate}</TableCell>
                        <TableCell align="left">{row.expiryDate}</TableCell>
                        <TableCell align="left" sx={{ color: getStatusColor(row.status), fontWeight: 'bold' }}>{row.status}</TableCell>
                        <TableCell align="center">
                          <Button variant="outlined" size="small" sx={{ mr: 1 }}>View</Button>
                          <Button variant="outlined" size="small">Renew</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={7} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPermits.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* Permit Issuance Form Dialog */}
        <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
          <DialogTitle>Issue New Permit</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="shop-select-label">Shop</InputLabel>
                <Controller
                  name="shopId"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      {...field}
                      labelId="shop-select-label"
                      label="Shop"
                      error={!!error}
                    >
                      {shops.map((shop) => (
                        <MenuItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <Typography variant="caption" color="error">{control._formState.errors.shopId?.message}</Typography>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel id="permit-type-select-label">Permit Type</InputLabel>
                <Controller
                  name="permitType"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      {...field}
                      labelId="permit-type-select-label"
                      label="Permit Type"
                      error={!!error}
                    >
                      {permitTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name} ({formatCurrency(type.fee)})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <Typography variant="caption" color="error">{control._formState.errors.permitType?.message}</Typography>
              </FormControl>

              {selectedPermitType && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Permit Fee"
                  value={formatCurrency(selectedPermitType.fee)}
                  InputProps={{ readOnly: true }}
                />
              )}

              <Controller
                name="issueDate"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Issue Date"
                    value={field.value}
                    onChange={(newValue) => field.onChange(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        margin="normal"
                        error={!!error}
                        helperText={error ? error.message : null}
                      />
                    )}
                  />
                )}
              />

              {watch('issueDate') && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Estimated Expiry Date"
                  value={dayjs(watch('issueDate')).add(1, 'year').format('YYYY-MM-DD')}
                  InputProps={{ readOnly: true }}
                />
              )}

              <Button variant="contained" component="label" sx={{ mt: 2 }}>
                Upload Document
                <input type="file" hidden onChange={(e) => setValue('document', e.target.files[0])} />
              </Button>
              {watch('document') && <Typography variant="body2" sx={{ ml: 1 }}>{watch('document').name}</Typography>}

              {/* Fee payment integration would go here */}

              <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
                <Button onClick={() => setOpenForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Issue Permit'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Expiry Management and Reports sections would be more complex components/pages */}
        <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>Expiry Management & Reports Overview</Typography>
          <Typography variant="body1">This section would contain automated reminder systems, renewal processing workflows, penalty calculations, and various permit-related reports like issuance statistics, revenue from permits, expiry calendar view, and compliance tracking.</Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>Go to Expiry Dashboard</Button>
          <Button variant="outlined" sx={{ mt: 2, ml: 2 }}>View Permit Reports</Button>
        </Paper>

      </Box>
    </LocalizationProvider>
  );
};

export default PermitManagement;
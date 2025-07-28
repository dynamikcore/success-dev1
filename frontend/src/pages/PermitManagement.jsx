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
import { fetchPermits, fetchShops, fetchPermitTypes, createPermit, renewPermit, sendReminder } from '../services/api';

const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;

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
    const loadPermits = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (filterStatus !== 'All') filters.status = filterStatus;
        if (filterType !== 'All') filters.permitType = filterType;

        const [permitsResponse, shopsResponse, permitTypesResponse] = await Promise.all([
          fetchPermits(filters),
          fetchShops(''),
          fetchPermitTypes(),
        ]);

        setPermits(permitsResponse.permits || []);
        setShops(shopsResponse.shops || []);
        setPermitTypes(permitTypesResponse.permitTypes || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setPermits([]);
        setShops([]);
        setPermitTypes([]);
      } finally {
        setLoading(false);
      }
    };
    loadPermits();
  }, [filterStatus, filterType]);

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
      const result = await createPermit(data);
      if (result.permit) {
        alert(`Permit ${result.permit.id} issued successfully!`);
        setOpenForm(false);
        reset();
        const permitsResponse = await fetchPermits();
        setPermits(permitsResponse.permits || []);
      }
    } catch (error) {
      console.error('Error issuing permit:', error);
      alert(error.response?.data?.message || 'Failed to issue permit.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRenew = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const result = await renewPermit(selected);
      if (result.renewedPermits) {
        alert(`${result.renewedPermits.length} permits renewed.`);
        setSelected([]);
        const permitsResponse = await fetchPermits();
        setPermits(permitsResponse.permits || []);
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
      if (result.sentReminders) {
        alert(`${result.sentReminders.length} reminders sent.`);
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
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Permit Management
        </Typography>

        {/* Header Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Active Permits
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {activePermits}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Expiring Soon (30 days)
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {expiringSoon}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Expired Permits
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {expiredPermits}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  This Month's Issuance
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {thisMonthsIssuance}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
              fullWidth={window.innerWidth < 600}
              size="small"
            >
              Issue New Permit
            </Button>
          </Box>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <FormControl sx={{ minWidth: 120 }} size="small">
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
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1, sm: 0 },
              ...(selected.length > 0 && {
                bgcolor: (theme) =>
                  alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
              }),
            }}
          >
            {selected.length > 0 ? (
              <Typography
                sx={{ flex: '1 1 100%', textAlign: { xs: 'center', sm: 'left' } }}
                color="inherit"
                variant="subtitle1"
                component="div"
              >
                {selected.length} selected
              </Typography>
            ) : (
              <Typography
                sx={{ flex: '1 1 100%', textAlign: { xs: 'center', sm: 'left' } }}
                variant="h6"
                id="tableTitle"
                component="div"
              >
                Permits
              </Typography>
            )}

            {selected.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-end' } }}>
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
              </Box>
            ) : (
              <Tooltip title="Filter list">
                <IconButton>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table
              sx={{ minWidth: { xs: 650, sm: 750 } }}
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
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() => {
                              alert(`Viewing details for permit ${row.id}`);
                              // In production: navigate to permit details page
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={async () => {
                              try {
                                await renewPermit([row.id]);
                                alert(`Permit ${row.id} renewed successfully`);
                                const permitsResponse = await fetchPermits();
                                setPermits(permitsResponse.permits || []);
                              } catch (error) {
                                alert('Failed to renew permit');
                              }
                            }}
                          >
                            Renew
                          </Button>
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
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        error: !!error,
                        helperText: error ? error.message : null
                      }
                    }}
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
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              // Filter permits expiring in next 30 days
              const expiring = permits.filter(p => p.status === 'Expiring Soon');
              alert(`${expiring.length} permits expiring in the next 30 days`);
            }}
          >
            Go to Expiry Dashboard
          </Button>
          <Button
            variant="outlined"
            sx={{ mt: 2, ml: 2 }}
            onClick={() => {
              const stats = {
                total: permits.length,
                active: permits.filter(p => p.status === 'Active').length,
                expired: permits.filter(p => p.status === 'Expired').length
              };
              alert(`Permit Stats: Total: ${stats.total}, Active: ${stats.active}, Expired: ${stats.expired}`);
            }}
          >
            View Permit Reports
          </Button>
        </Paper>

      </Box>
    </LocalizationProvider>
  );
};

export default PermitManagement;
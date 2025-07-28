import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  MenuItem, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  FormLabel,
  FormControl,
  FormHelperText,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import { useLoading } from '../contexts/LoadingContext';
import { createShop } from '../services/api';
import { formatNaira } from '../services/api';

// Define Yup schema for validation
const schema = yup.object().shape({
  businessName: yup.string().required('Business Name is required'),
  ownerName: yup.string().required('Owner Name is required'),
  ownerPhone: yup
    .string()
    .matches(/^\+234[789]\d{9}$/, 'Phone number must be in +234xxxxxxxxxx format')
    .required('Owner Phone is required'),
  ownerEmail: yup.string().email('Invalid email format').optional(),
  shopAddress: yup.string().required('Shop Address is required'),
  ward: yup.string().required('Ward is required'),
  businessType: yup.string().required('Business Type is required'),
  shopSizeCategory: yup.string().required('Shop Size Category is required'),
  expectedAnnualRevenue: yup.number().typeError('Expected Annual Revenue must be a number').min(0, 'Cannot be negative').optional(),
});

const wards = [
  'Uvwie',
  'Effurun',
  'Ekpan',
  'Jeddo',
  'Kokori',
  // Add more wards as needed
];

const businessTypes = [
  { value: 'retail', label: 'Retail Shop' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'services', label: 'Services' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

const shopSizeCategories = [
  { value: 'Small', label: 'Small (e.g., kiosk, single room shop)' },
  { value: 'Medium', label: 'Medium (e.g., two-story building, multiple sections)' },
  { value: 'Large', label: 'Large (e.g., shopping mall, large warehouse)' },
];

const ShopRegistrationForm = () => {
  const { showLoading, hideLoading } = useLoading();
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [requiredPermits, setRequiredPermits] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success' or 'error'

  const { 
    handleSubmit, 
    control, 
    watch, 
    reset, 
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      shopAddress: '',
      ward: '',
      businessType: '',
      shopSizeCategory: '',
      expectedAnnualRevenue: '',
    },
  });

  const watchedFields = watch(['businessType', 'shopSizeCategory', 'expectedAnnualRevenue']);

  useEffect(() => {
    // Auto-calculate estimated annual fees
    const calculateFees = () => {
      let fee = 0;
      const [type, size, revenue] = watchedFields;

      if (type === 'retail') fee += 5000;
      if (type === 'restaurant') fee += 10000;
      if (type === 'services') fee += 15000;
      if (type === 'bank') fee += 50000;

      if (size === 'Small') fee += 2000;
      if (size === 'Medium') fee += 5000;
      if (size === 'Large') fee += 10000;

      if (revenue && revenue > 1000000) fee += revenue * 0.01; // 1% of revenue over 1M

      setEstimatedFee(fee);
    };

    // Preview required permits
    const determinePermits = () => {
      const [type] = watchedFields;
      let permits = [];
      if (type === 'restaurant') {
        permits.push('Food Handler\'s Permit', 'Health Certificate');
      }
      if (type === 'pharmacy') {
        permits.push('Pharmacy Board License');
      }
      if (type === 'bank') {
        permits.push('Banking License');
      }
      setRequiredPermits(permits);
    };

    calculateFees();
    determinePermits();
  }, [watchedFields]);

  const onSubmit = async (data) => {
    showLoading();
    setSubmissionStatus(null);
    try {
      const formattedData = {
        ...data,
        shopSizeCategory: data.shopSizeCategory.toLowerCase(),
      };
      await createShop(formattedData);
      setSubmissionStatus('success');
      reset(); // Clear form on success
    } catch (error) {
      console.error('Shop registration failed:', error);
      if (error.response && error.response.data) {
        console.error('Backend error details:', error.response.data);
      }
      setSubmissionStatus('error');
    } finally {
      hideLoading();
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Shop Registration Form
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="businessName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Business Name"
                  fullWidth
                  required
                  error={!!errors.businessName}
                  helperText={errors.businessName?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="ownerName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Owner Name"
                  fullWidth
                  required
                  error={!!errors.ownerName}
                  helperText={errors.ownerName?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="ownerPhone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Owner Phone"
                  fullWidth
                  required
                  error={!!errors.ownerPhone}
                  helperText={errors.ownerPhone?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="ownerEmail"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Owner Email (Optional)"
                  fullWidth
                  type="email"
                  error={!!errors.ownerEmail}
                  helperText={errors.ownerEmail?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="shopAddress"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Shop Address"
                  fullWidth
                  required
                  multiline
                  rows={3}
                  error={!!errors.shopAddress}
                  helperText={errors.shopAddress?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="ward"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Ward"
                  fullWidth
                  required
                  error={!!errors.ward}
                  helperText={errors.ward?.message}
                >
                  {wards.map((ward) => (
                    <MenuItem key={ward} value={ward}>
                      {ward}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="businessType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Business Type"
                  fullWidth
                  required
                  error={!!errors.businessType}
                  helperText={errors.businessType?.message}
                >
                  {businessTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset" error={!!errors.shopSizeCategory}>
              <FormLabel component="legend">Shop Size Category *</FormLabel>
              <Controller
                name="shopSizeCategory"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} row>
                    {shopSizeCategories.map((category) => (
                      <FormControlLabel
                        key={category.value}
                        value={category.value}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1">{category.value}</Typography>
                            <Typography variant="body2" color="textSecondary">{category.label}</Typography>
                          </Box>
                        }
                      />
                    ))}
                  </RadioGroup>
                )}
              />
              <FormHelperText>{errors.shopSizeCategory?.message}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="expectedAnnualRevenue"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Expected Annual Revenue (Optional)"
                  fullWidth
                  type="number"
                  error={!!errors.expectedAnnualRevenue}
                  helperText={errors.expectedAnnualRevenue?.message}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Estimated Annual Fee: {formatNaira(estimatedFee)}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Required Permits: {requiredPermits.length > 0 ? requiredPermits.join(', ') : 'None specified'}
            </Typography>
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Submitting...' : 'Register Shop'}
            </Button>
            <Button 
              type="button" 
              variant="outlined" 
              color="secondary" 
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Box>
      {submissionStatus === 'success' && (
        <Typography variant="body1" color="success.main" sx={{ mt: 2, textAlign: 'center' }}>
          Shop registered successfully!
        </Typography>
      )}
      {submissionStatus === 'error' && (
        <Typography variant="body1" color="error.main" sx={{ mt: 2, textAlign: 'center' }}>
          Error registering shop. Please try again.
        </Typography>
      )}
    </Paper>
  );
};

export default ShopRegistrationForm;
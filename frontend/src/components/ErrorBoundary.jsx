import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            p: 3,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We're sorry for the inconvenience. Please try refreshing the page.
          </Typography>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box sx={{ mt: 4, p: 2, border: '1px solid #f44336', borderRadius: 1, backgroundColor: '#ffebee' }}>
              <Typography variant="h6" color="error" gutterBottom>
                Error Details:
              </Typography>
              <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </details>
            </Box>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 3 }}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
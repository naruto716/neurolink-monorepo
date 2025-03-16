import { Code as CodeIcon, Home as HomeIcon, Info as InfoIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { Box, Button, Card, CardActionArea, CardContent, Grid, Paper, Typography } from '@mui/material';

const HomePage = () => {
  const sendNotification = () => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    
    // Request permission and send notification
    if (Notification.permission === "granted") {
      new Notification("Hello from Neurolink!", {
        body: "This is a sample notification",
        icon: "/favicon.ico"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("Hello from Neurolink!", {
            body: "This is a sample notification",
            icon: "/favicon.ico"
          });
        }
      });
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          textAlign: 'center',
          mb: 4,
          borderRadius: 2,
          background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
          color: 'white'
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Neurolink
        </Typography>
        <Typography variant="h5" paragraph>
          A next-generation neuroscience platform
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            startIcon={<InfoIcon />}
            sx={{ mt: 2 }}
          >
            Learn More
          </Button>
          <Button 
            variant="contained" 
            color="warning" 
            size="large"
            startIcon={<NotificationsIcon />}
            sx={{ mt: 2 }}
            onClick={sendNotification}
          >
            Try Notification
          </Button>
        </Box>
      </Paper>

      {/* Features */}
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        Key Features
      </Typography>
      <Grid container spacing={4}>
        {[
          { 
            title: 'Advanced Analytics', 
            description: 'Powerful tools for neuroscience data analysis and visualization', 
            icon: <CodeIcon fontSize="large" color="primary" /> 
          },
          { 
            title: 'Collaborative Research', 
            description: 'Share and collaborate on research projects with colleagues worldwide', 
            icon: <HomeIcon fontSize="large" color="primary" /> 
          },
          { 
            title: 'Secure Platform', 
            description: 'Enterprise-grade security for sensitive research data', 
            icon: <InfoIcon fontSize="large" color="primary" /> 
          }
        ].map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage; 
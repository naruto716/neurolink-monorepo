import { useState } from 'react';
import { Box, Typography, Paper, Avatar, TextField, Button, Grid, Card, CardContent, Divider, IconButton, InputAdornment } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { useAuth } from 'react-oidc-context';
import { toastSuccess, toastError, toastInfo } from '../../app/utils/toast';

const ProfilePage = () => {
  const auth = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showTokens, setShowTokens] = useState({
    idToken: false,
    accessToken: false,
    refreshToken: false
  });
  const [profileData, setProfileData] = useState({
    displayName: 'User Name',
    bio: 'Neuroscience researcher with focus on cognitive functions',
    email: auth.user?.profile.email || 'user@example.com',
    institution: 'University Research Lab',
    role: 'Research Scientist'
  });

  // Extract tokens from auth context
  const idToken = auth.user?.id_token || 'Not available';
  const accessToken = auth.user?.access_token || 'Not available';
  const refreshToken = auth.user?.refresh_token || 'Not available';

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      toastInfo('Now editing your profile');
    }
  };

  const handleSaveProfile = () => {
    // Simulating API call to save profile
    setTimeout(() => {
      setIsEditing(false);
      toastSuccess('Profile updated successfully!');
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActionError = () => {
    toastError('Failed to perform action. Please try again later.');
  };

  const toggleTokenVisibility = (tokenType: 'idToken' | 'accessToken' | 'refreshToken') => {
    setShowTokens(prev => ({
      ...prev,
      [tokenType]: !prev[tokenType]
    }));
  };

  // Function to display a partial token for security
  const formatToken = (token: string, isVisible: boolean) => {
    if (token === 'Not available') return token;
    if (isVisible) return token;
    return token.substring(0, 15) + '...' + token.substring(token.length - 10);
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{ width: 100, height: 100, mr: 3 }}
            alt={profileData.displayName}
            src="/assets/default-avatar.png"
          />
          <Box>
            {isEditing ? (
              <TextField
                fullWidth
                name="displayName"
                label="Display Name"
                value={profileData.displayName}
                onChange={handleChange}
                sx={{ mb: 1 }}
              />
            ) : (
              <Typography variant="h4" component="h1" gutterBottom>
                {profileData.displayName}
              </Typography>
            )}
            <Typography variant="subtitle1" color="text.secondary">
              {profileData.email}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {isEditing ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
              >
                Save
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                name="bio"
                label="Bio"
                value={profileData.bio}
                onChange={handleChange}
              />
            ) : (
              <Typography paragraph>{profileData.bio}</Typography>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Professional Information
                </Typography>
                {isEditing ? (
                  <>
                    <TextField
                      fullWidth
                      name="institution"
                      label="Institution"
                      value={profileData.institution}
                      onChange={handleChange}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      name="role"
                      label="Role"
                      value={profileData.role}
                      onChange={handleChange}
                    />
                  </>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Institution:</strong> {profileData.institution}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Role:</strong> {profileData.role}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Authentication Tokens Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Authentication Tokens
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          These are your current authentication tokens. For security reasons, tokens are partially hidden by default.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ID Token"
              value={formatToken(idToken, showTokens.idToken)}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleTokenVisibility('idToken')}
                      edge="end"
                    >
                      {showTokens.idToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Access Token"
              value={formatToken(accessToken, showTokens.accessToken)}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleTokenVisibility('accessToken')}
                      edge="end"
                    >
                      {showTokens.accessToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Refresh Token"
              value={formatToken(refreshToken, showTokens.refreshToken)}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleTokenVisibility('refreshToken')}
                      edge="end"
                    >
                      {showTokens.refreshToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography>No recent activity to display</Typography>
                <Button 
                  variant="text" 
                  color="primary"
                  onClick={handleActionError}
                  sx={{ mt: 1 }}
                >
                  Load Activity
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications Settings
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => toastSuccess('Notification test successful!')}
                  sx={{ mr: 2 }}
                >
                  Test Success Toast
                </Button>
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => toastError('Error toast example')}
                >
                  Test Error Toast
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage; 
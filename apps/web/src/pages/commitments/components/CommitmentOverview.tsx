import React from 'react';
import { useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  // ListItemAvatar, // Removed unused import
  ListItemText,
  Divider,
  Box,
  // Chip, // Removed unused import
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '@neurolink/shared';
import { SharedRootState } from '@neurolink/shared';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography'; // Adjusted path
import CommitmentList from './CommitmentList'; // Import the new list component

// Removed hardcodedCommitments data


const hardcodedInvitations = [
  {
    id: 9,
    title: 'Join Hackathon Team',
    description: 'Invitation to join a team for the weekend hackathon.',
    dateTime: '2025-04-22T00:00:00.000Z',
    location: {
      description: 'Innovation Hub',
    },
    creatorUsername: 'diana_prince',
  },
];


const CommitmentOverview: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useSelector((state: SharedRootState) => selectCurrentUser(state));

  // Removed nextCommitment calculation logic (will be handled differently if needed)
  // const now = new Date(); // Removed unused variable

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <> {/* Use Fragment as we don't need a container here */}
      {/* Top User Section */}
      {/* Adjust padding and remove gap to reduce height */}
      <Card sx={{
          mb: 3,
          display: 'flex',
          padding: '16px', // Reduced padding
          alignItems: 'center', // Center items vertically
          // gap: '28px', // Remove gap, Grid spacing handles internal layout
          flexShrink: 0,
          borderRadius: '16px',
          backgroundColor: (theme) => theme.palette.mode === 'light' ? '#F7F9FB' : theme.palette.background.paper,
          minHeight: 'auto', // Override default theme minHeight
          '& > .MuiCardContent-root': {
             padding: 0,
             '&:last-child': {
                paddingBottom: '0 !important'
             }
          }
      }}>
        <CardContent sx={{ display: 'flex', flexGrow: 1, width: '100%', p: 0 }}>
          {/* Reduce Grid spacing */}
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              {/* Use profilePicture if available, otherwise fallback to letter */}
              <Avatar
                src={currentUser?.profilePicture || undefined}
                sx={{ width: 40, height: 40 }} // Reduced Avatar size
              >
                {/* Fallback to first letter of displayName or username */}
                {!currentUser?.profilePicture && (currentUser?.displayName || currentUser?.username || 'U')[0].toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              {/* Reduce bottom margin on Typography */}
              {/* Use smaller variant and remove bottom margin */}
              <AccessibleTypography variant="h6" component="div" sx={{ mb: 0 }}>
                {t('commitments.welcome', { name: currentUser?.displayName || currentUser?.username || t('common.user') })}
              </AccessibleTypography>
              <AccessibleTypography variant="body2" color="text.secondary">
                {t('commitments.userSubtitle')}
              </AccessibleTypography>
            </Grid>
            {/* Adjust stats section */}
            <Grid item>
              {/* Remove Box margin, control spacing with Grid */}
              <Box textAlign="center">
                {/* TODO: Update this count based on fetched data or remove if not needed */}
                <AccessibleTypography variant="body1" fontWeight="medium">0</AccessibleTypography>
                <AccessibleTypography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{t('commitments.totalCommitments')}</AccessibleTypography>
              </Box>
            </Grid>
            <Grid item>
              {/* Remove Box margin, control spacing with Grid */}
              <Box textAlign="center">
                {/* Use smaller variant for number */}
                <AccessibleTypography variant="body1" fontWeight="medium">{hardcodedInvitations.length}</AccessibleTypography>
                <AccessibleTypography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{t('commitments.pendingInvitations')}</AccessibleTypography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Middle Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left: Next Commitment */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <AccessibleTypography variant="h6" gutterBottom>
                {t('commitments.nextCommitment')}
              </AccessibleTypography>
              {/* TODO: Fetch and display the actual next commitment */}
              <AccessibleTypography variant="body1" color="text.secondary">
                {t('commitments.noUpcomingCommitments')}
              </AccessibleTypography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Invitations */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <AccessibleTypography variant="h6" gutterBottom>
                {t('commitments.invitations')}
              </AccessibleTypography>
              {hardcodedInvitations.length > 0 ? (
                <List disablePadding>
                  {hardcodedInvitations.map((invite) => (
                    <React.Fragment key={invite.id}>
                      <ListItem alignItems="flex-start" disableGutters>
                        <ListItemText
                          primary={
                            <AccessibleTypography variant="subtitle1">{invite.title}</AccessibleTypography>
                          }
                          secondary={
                            <>
                              <AccessibleTypography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                display="block"
                              >
                                {t('common.from')}: {invite.creatorUsername} - {formatDate(invite.dateTime)}
                              </AccessibleTypography>
                              <AccessibleTypography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                display="block"
                              >
                                {invite.description}
                              </AccessibleTypography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <AccessibleTypography variant="body1" color="text.secondary">
                  {t('commitments.noPendingInvitations')}
                </AccessibleTypography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section: Render the CommitmentList component */}
      <Card>
        <CardContent>
          {/* CommitmentList handles its own title, loading, error, and pagination */}
          <CommitmentList />
        </CardContent>
      </Card>
    </>
  );
};

export default CommitmentOverview;
import React, { useState } from 'react';
import { Container, Box, Tabs, Tab } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CommitmentOverview from './components/CommitmentOverview'; // Import the overview component

// Define the structure for tabs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`commitment-tabpanel-${index}`}
      aria-labelledby={`commitment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}> {/* Add padding top to separate content from tabs */}
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `commitment-tab-${index}`,
    'aria-controls': `commitment-tabpanel-${index}`,
  };
}

const CommitmentPage: React.FC = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState(0); // State for active tab index

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Define tabs
  const tabs = [
    { label: t('commitments.tabs.overview'), component: <CommitmentOverview /> },
    { label: t('commitments.tabs.commitments'), component: <div>Commitments List/Management Content Goes Here</div> },
    // Add other tabs here later, e.g.:
    // { label: t('commitments.tabs.targets'), component: <div>Targets Content</div> },
    // { label: t('commitments.tabs.budget'), component: <div>Budget Content</div> },
  ];

  return (
    // Reduce margin top from 4 (32px) to 2 (16px)
    <Container maxWidth="lg" sx={{ mt: 0, mb: 0 }}>
      {/* Remove bottom border from Box, underline is handled by Tabs indicator */}
      <Box sx={{ mb: 0 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Commitment page tabs"
          // Ensure indicator is styled correctly
          sx={{
            minHeight: '40px', // Adjust height if necessary
            '& .MuiTabs-indicator': {
              height: '2px', // Adjust thickness if needed
              // Use theme's primary text color for the indicator
              backgroundColor: (theme) => theme.palette.text.primary,
            },
            // Remove default bottom border from Tabs component itself if present
            borderBottom: 0,
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              {...a11yProps(index)}
              sx={{
                // Base styles for all tabs (from user feedback)
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px', // --Font-size-14
                fontStyle: 'normal',
                fontWeight: 400, // --Font-weight-Regular (for both selected/unselected per feedback)
                lineHeight: '20px', // --Line-height-20
                letterSpacing: '0px', // --Letter-spacing-Letter-spacing
                fontFeatureSettings: "'ss01' on, 'cv01' on",
                textTransform: 'none', // Prevent uppercase
                minWidth: 'auto', // Allow tabs to size naturally
                padding: '6px 12px', // Adjust padding as needed
                marginRight: '16px', // Space between tabs (adjust as needed)
                minHeight: '40px', // Match Tabs container height
                opacity: 1, // Ensure full opacity
                // Use theme's secondary text color for unselected tabs
                color: 'text.secondary',
                // Styles for the selected tab
                '&.Mui-selected': {
                  // Use theme's primary text color for selected tabs
                  color: 'text.primary',
                  fontWeight: 400, // Keep regular weight as per feedback
                },
                // Remove ripple effect if desired
                // disableRipple: true,
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Render the content for the active tab */}
      {tabs.map((tab, index) => (
         <TabPanel key={index} value={value} index={index}>
           {tab.component}
         </TabPanel>
      ))}

    </Container>
  );
};

export default CommitmentPage;
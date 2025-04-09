import React, { useState, useCallback } from 'react'; // Removed unused useMemo
import { Box, Alert, CircularProgress, Modal, IconButton, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, EventClickArg, DatesSetArg } from '@fullcalendar/core'; // Added DatesSetArg
import { useSelector } from 'react-redux';
import {
  Commitment,
  // fetchUserCommitments, // No longer fetching all at once
  selectCurrentUser,
  SharedRootState
} from '@neurolink/shared';
import apiClientInstance from '../../../app/api/apiClient';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import CommitmentDetailPreview from './CommitmentDetailPreview';

// Define the structure for calendar events
interface CommitmentEventInput extends EventInput {
  id: string;
  extendedProps: {
    commitment: Commitment;
  };
}

// Styled Box for the Modal content
const ModalContentBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 600,
  maxHeight: '80vh',
  overflowY: 'auto',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[24],
  padding: theme.spacing(3),
}));

// Styled Box for the Calendar container
const CalendarContainer = styled(Box)(({ theme }) => ({
  height: '75vh',
  position: 'relative',

  '.fc': {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    '--fc-border-color': theme.palette.divider,
    '--fc-today-bg-color': theme.palette.action.hover,
    '--fc-event-bg-color': theme.palette.primary.main,
    '--fc-event-border-color': theme.palette.primary.dark,
    '--fc-event-text-color': theme.palette.primary.contrastText,
    '--fc-page-bg-color': theme.palette.background.paper,
    '--fc-neutral-bg-color': theme.palette.background.default,
    '--fc-list-event-hover-bg-color': theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
  '.fc .fc-toolbar': {
    marginBottom: theme.spacing(2),
  },
  '.fc .fc-toolbar-title': {
    fontSize: theme.typography.h6.fontSize,
    color: theme.palette.text.primary,
  },
  '.fc .fc-button': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    textTransform: 'none',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
  },
  '.fc .fc-button-primary': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
    },
  },
  '.fc .fc-button-active': {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.divider,
  },
  '.fc-daygrid-day-number': {
    color: theme.palette.text.secondary,
    padding: theme.spacing(0.5),
  },
  '.fc-col-header-cell': {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  },
  // --- Ellipsis Fixes ---
  '.fc-event': { // Base event style
    padding: '2px 4px',
    cursor: 'pointer',
    borderWidth: '1px',
    fontSize: theme.typography.caption.fontSize,
    overflow: 'hidden', // Needed for ellipsis on the container
  },
  '.fc-event-main': { // Inner container for event content
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block', // Ensure it takes block display for ellipsis
  },
  '.fc-daygrid-event-dot': { // Ensure dot doesn't interfere
    marginRight: '4px',
  },
  '.fc-event-title': { // Target the title specifically if needed
     overflow: 'hidden',
     textOverflow: 'ellipsis',
     whiteSpace: 'nowrap',
  },
  // --- End Ellipsis Fixes ---
}));


const CommitmentCalendar: React.FC = () => {
  const { t } = useTranslation();
  const apiClient = apiClientInstance;
  const currentUser = useSelector((state: SharedRootState) => selectCurrentUser(state));
  const username = currentUser?.username;

  // State for loading indicator (optional, FullCalendar shows its own)
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<number | null>(null);

  const handleOpenModal = (commitmentId: number) => {
    setSelectedCommitmentId(commitmentId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCommitmentId(null);
  };

  // Function to fetch events for a given date range
  const fetchEvents = useCallback(async (fetchInfo: { startStr: string; endStr: string }): Promise<EventInput[]> => {
    if (!username || !apiClient) return [];
    setIsLoading(true);
    setFetchError(null);
    console.log(`Fetching events from ${fetchInfo.startStr} to ${fetchInfo.endStr}`); // Debug log

    try {
      // Use lowercase 'commitment' in the path
      const response = await apiClient.get<Commitment[]>(`/commitment/users/${username}/calendar`, {
        params: {
          startDate: fetchInfo.startStr,
          endDate: fetchInfo.endStr,
        },
      });

      // Map API response to FullCalendar EventInput format
      const events = response.data.map((commitment): CommitmentEventInput => ({
        id: String(commitment.id),
        title: commitment.title,
        start: new Date(commitment.dateTime),
        end: new Date(commitment.dateTime), // Assuming point-in-time
        extendedProps: {
          commitment: commitment,
        },
      }));
      setIsLoading(false);
      return events;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to load commitments for calendar range:', err);
      setFetchError(msg || t('commitments.errorLoading', 'Failed to load commitments.'));
      setIsLoading(false);
      return []; // Return empty array on error
    }
  }, [apiClient, username, t]);


  // Handler for clicking an event
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const commitmentId = parseInt(clickInfo.event.id, 10);
    if (!isNaN(commitmentId)) {
      handleOpenModal(commitmentId);
    } else {
      console.error("Invalid commitment ID clicked:", clickInfo.event.id);
    }
  }, []);

  // Optional: Handler for when the calendar dates change (for debugging)
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    console.log("Calendar dates changed:", arg.startStr, arg.endStr);
  }, []);

  return (
    <CalendarContainer sx={{ marginBottom: 0 }}>


      {/* Optional global loading/error display */}
      {isLoading && (
         <Box sx={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
           <CircularProgress size={24} />
         </Box>
      )}
       {fetchError && (
         <Alert severity="error" sx={{ position: 'absolute', top: 60, left: 16, right: 16, zIndex: 10 }}>
           {fetchError}
         </Alert>
       )}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={fetchEvents} // Use the fetching function
        eventClick={handleEventClick}
        datesSet={handleDatesSet} // Optional: Log date changes
        editable={false}
        selectable={true}
        height="100%"
        // FullCalendar's loading prop can show its internal indicator
        loading={(bool) => setIsLoading(bool)} 
      />

      {/* Modal for Commitment Details */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="commitment-detail-modal-title"
      >
        <ModalContentBox>
           <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          {selectedCommitmentId !== null && (
            <CommitmentDetailPreview commitmentId={selectedCommitmentId} />
          )}
        </ModalContentBox>
      </Modal>
    </CalendarContainer>
  );
};

export default CommitmentCalendar;
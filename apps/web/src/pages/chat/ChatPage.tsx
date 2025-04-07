import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Paper } from '@mui/material';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { ChatTokenResponse, fetchChatToken } from '@neurolink/shared/src/features/chat'; // Import chat API and type
import apiClient from '../../app/api/apiClient'; // Import the configured apiClient instance

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  // No need to get user from selector for this call, interceptor handles it
  const [chatTokenInfo, setChatTokenInfo] = useState<ChatTokenResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Define the async function to call the API
    const getToken = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the imported API function with the imported apiClient instance.
        // The interceptor handles adding the X-User-Name header for /chat routes.
        const data = await fetchChatToken(apiClient);
        setChatTokenInfo(data);
      } catch (err: unknown) {
        console.error("Failed to fetch chat token:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || t('chat.error.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    // Call the function
    getToken();

  }, [t]); // Only depend on t, as apiClient is stable

  return (
    <Box sx={{ p: 3 }}>
      <AccessibleTypography variant="h4" gutterBottom>
        {t('chat.title')}
      </AccessibleTypography>
      <Paper elevation={3} sx={{ p: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
            <CircularProgress />
            <AccessibleTypography sx={{ ml: 2 }}>{t('chat.loadingToken')}</AccessibleTypography>
          </Box>
        )}
        {error && (
          <AccessibleTypography color="error">
            {t('chat.error.prefix')}: {error}
          </AccessibleTypography>
        )}
        {chatTokenInfo && !loading && (
          <Box>
            <AccessibleTypography variant="h6">{t('chat.tokenInfoTitle')}</AccessibleTypography>
            <AccessibleTypography><strong>{t('chat.apiKeyLabel')}:</strong> {chatTokenInfo.apiKey}</AccessibleTypography>
            <AccessibleTypography><strong>{t('chat.tokenLabel')}:</strong> {chatTokenInfo.token.substring(0, 30)}...</AccessibleTypography>
            <AccessibleTypography><strong>{t('chat.userIdLabel')}:</strong> {chatTokenInfo.userId}</AccessibleTypography>
            {/* TODO: Initialize GetStream client here using the token */}
            <AccessibleTypography sx={{ mt: 2, fontStyle: 'italic' }}>
              {t('chat.initSuccess')}
            </AccessibleTypography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ChatPage;

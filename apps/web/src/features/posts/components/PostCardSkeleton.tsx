// apps/web/src/features/posts/components/PostCardSkeleton.tsx
import React from 'react';
import { Card, CardContent, Skeleton, Stack, Box } from '@mui/material';

const PostCardSkeleton: React.FC = () => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Author Skeleton */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" sx={{ fontSize: '1rem' }} />
            <Skeleton variant="text" width="20%" sx={{ fontSize: '0.75rem' }} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Stack>

        {/* Content Skeleton */}
        <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1 }} />
        <Skeleton variant="text" width="80%" sx={{ fontSize: '1rem', mb: 2 }} />

        {/* Media Skeleton (Optional: Adjust height as needed) */}
        <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: '8px', mb: 2 }} />

        {/* Actions Skeleton */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1}>
            <Skeleton variant="text" width={60} height={30} />
            <Skeleton variant="text" width={60} height={30} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PostCardSkeleton;
import { Biotech, Psychology, Science } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, Divider, Grid, Paper, Typography } from '@mui/material';

const AboutPage = () => {
  return (
    <Box>
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          About Neurolink
        </Typography>
        <Typography variant="body1" paragraph>
          Neurolink is a pioneering platform dedicated to advancing neuroscience research and collaboration. 
          Our mission is to provide researchers with powerful tools to analyze, visualize, and share their findings.
        </Typography>
        <Typography variant="body1" paragraph>
          Founded in 2023, we've been working closely with leading neuroscience institutions to develop 
          tools that meet the evolving needs of the research community.
        </Typography>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Our Research Areas
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Neural Networks',
            description: 'Exploring the complex networks within the brain and their functions',
            icon: <Psychology fontSize="large" />
          },
          {
            title: 'Cognitive Science',
            description: 'Investigating cognitive processes and their neurological foundations',
            icon: <Science fontSize="large" />
          },
          {
            title: 'Biomedical Applications',
            description: 'Developing applications for neurological diagnostics and treatment',
            icon: <Biotech fontSize="large" />
          }
        ].map((area, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
                  {area.icon}
                </Avatar>
                <Typography variant="h5" component="h3" gutterBottom>
                  {area.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {area.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h4" gutterBottom>
        Our Vision
      </Typography>
      <Typography variant="body1" paragraph>
        We envision a future where neuroscience research is more accessible, collaborative, and impactful.
        Through Neurolink, we aim to break down barriers between researchers and accelerate discoveries
        that could transform our understanding of the human brain and lead to breakthroughs in treating neurological conditions.
      </Typography>
    </Box>
  );
};

export default AboutPage; 
import React from 'react';
import { Container, Typography, Box, List, ListItem } from '@mui/material';

const TosPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4, bgcolor: 'background.paper' }}>
      <Box sx={{ fontFamily: 'Arial, sans-serif' }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Terms of Service
        </Typography>

        <Typography variant="h5" component="h2" gutterBottom mt={4}>
          1. Limitation of Liability
        </Typography>
        <Typography paragraph>
          <strong>Disclaimer of Warranties:</strong> The website and its content are provided “as is” and “as available.” We do not make any guarantees regarding the availability, accuracy, or reliability of our services. You agree that TierlistLab2 shall not be held liable for any damages, direct or indirect, resulting from the use or inability to use the platform.
        </Typography>
        <Typography paragraph>
          <strong>Limitation of Liability:</strong> In no event shall TierlistLab2, its owners, affiliates, or employees be liable for any incidental, indirect, or consequential damages arising out of or in connection with the use of our services. This includes, but is not limited to, loss of data, loss of revenue, or any other damages arising from the content created or shared on the platform.
        </Typography>

        <Typography variant="h5" component="h2" gutterBottom mt={4}>
          2. User-Generated Content and Content Guidelines
        </Typography>
        <Typography sx={{mb: 0}}>
          <strong>Prohibited Content:</strong> Users are strictly prohibited from uploading, posting, or sharing content that is:
        </Typography>
        <List sx={{ mb: 2 }}>
          <ListItem>Explicit, obscene, or pornographic</ListItem>
          <ListItem>Hateful, discriminatory, or harassing</ListItem>
          <ListItem>Violent or inciting harm</ListItem>
          <ListItem>Infringing on any intellectual property rights</ListItem>
          <ListItem>Any other content deemed inappropriate or illegal</ListItem>
        </List>

        <Typography sx={{mb: 0}}>
          <strong>Moderation and Enforcement:</strong> We reserve the right, at our sole discretion, to review, edit, remove, or block any user-generated content that violates these guidelines. We may also take actions against users who breach these terms, which may include:
        </Typography>
        <List sx={{ mt: 0 }}>
          <ListItem>Temporary or permanent banning of accounts</ListItem>
          <ListItem>Deletion of all content associated with the account</ListItem>
          <ListItem>Reporting violations to relevant authorities if necessary</ListItem>
        </List>

        <Typography variant="h5" component="h2" gutterBottom mt={4}>
          3. Account Termination and Penalties
        </Typography>
        <Typography sx={{mb: 0}}>
          <strong>User Responsibility:</strong> Users are responsible for the content they upload and share on our platform. Violations of our terms and content guidelines may result in consequences including, but not limited to, the following:
        </Typography>
        <List sx={{ mb: 2 }}>
          <ListItem>Suspension or termination of user accounts</ListItem>
          <ListItem>Removal of content without prior notice</ListItem>
          <ListItem>Permanent banning from the platform</ListItem>
        </List>

        <Typography paragraph>
          <strong>Appeal Process:</strong> Users may contact us if they believe their content was wrongly removed or if their account was unfairly banned. We reserve the right to make final decisions regarding such appeals.
        </Typography>

        <Typography variant="body2" mt={4} color="text.secondary">
          <em>Note: These terms may be updated from time to time, and it is the responsibility of the users to review and accept the most current version.</em>
        </Typography>
      </Box>
    </Container>
  );
};

export default TosPage;

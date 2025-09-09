import React from 'react';
import { Container, Typography, List, ListItem, Link } from '@mui/material';

const PolicyPage: React.FC = () => {
  const lastUpdatedDate = 'July 31, 2024';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        Privacy Policy
      </Typography>

      <Typography paragraph>
        This Privacy Policy outlines how TierlistLaboratory collects, uses, and protects the information you provide when using our services.
      </Typography>

      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        1. Information We Collect
      </Typography>
      <List sx={{ mt: 0 }}>
        <ListItem>
          <Typography>
            <strong>Email Address:</strong> We collect your email address when you log in to our platform.
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>
            <strong>Uploaded Images:</strong> If you are logged in, we may collect and store images uploaded by you, including filenames.
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>
            <strong>Tierlist Data:</strong> We store data about tierlists you create, including the list of items, their positioning, public visibility, title, row and image spacing. This data is stored both locally (in your browser's local storage) and on our backend servers after you log in.
          </Typography>
        </ListItem>
      </List>

      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        2. Use of Collected Information
      </Typography>
      <List sx={{ mt: 0 }}>
        <ListItem>
          <Typography>
            <strong>Email Address:</strong> Your email address is used for authentication purposes and to communicate with you regarding your account and our services.
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>
            <strong>Uploaded Images:</strong> Images uploaded by you are used to display on your tierlists or other content you create within our platform.
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>
            <strong>Tierlist Data:</strong> Data about tierlists you create is used to provide our tierlist creation and management services, including displaying your tierlists and associated information.
          </Typography>
        </ListItem>
      </List>

      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        3. Data Security
      </Typography>
      <Typography paragraph>
        We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security of your data.
      </Typography>

      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        4. Sharing of Information
      </Typography>
      <Typography paragraph>
        We do not sell, trade, or otherwise transfer your personal information to outside parties. Your information may be shared with third-party service providers who assist us in operating our website, conducting our business, or servicing you, as long as those parties agree to keep this information confidential.
      </Typography>

      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        5. Your Choices
      </Typography>
      <Typography paragraph>
        You can choose not to provide certain information, but this may limit your ability to use certain features of our platform.
      </Typography>

      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        6. Changes to This Policy
      </Typography>
      <Typography paragraph>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </Typography>

      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        7. Contact Us
      </Typography>
      <Typography paragraph>
        If you have any questions regarding this Privacy Policy or the practices of TierlistLaboratory, please contact us at{' '}
        <Link href="mailto:support@tierlistlaboratory.com">support@tierlistlaboratory.com</Link>.
      </Typography>

      <Typography variant="body2" sx={{ mt: 4 }} align="center">
        Last Updated: {lastUpdatedDate}
      </Typography>
    </Container>
  );
};

export default PolicyPage;

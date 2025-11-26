import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface InviteEmailProps {
  inviterName: string;
  recipientEmail: string;
  role: string;
  inviteUrl: string;
  expiryDays?: number;
}

export const InviteEmail = ({
  inviterName = 'A team member',
  recipientEmail,
  role = 'Team Member',
  inviteUrl,
  expiryDays = 7,
}: InviteEmailProps) => {
  const roleDisplay = role === 'admin' ? 'Admin' : 'Team Member';
  const roleDescription = role === 'admin' 
    ? 'full system access to manage companies, contacts, billing, and team members'
    : 'access to manage companies and contacts';

  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join Centervert</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Section style={logoSection}>
            <Text style={logoText}>CENTERVERT</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>You&apos;re Invited!</Heading>
            
            <Text style={text}>
              {inviterName} has invited you to join Centervert as a {roleDisplay}.
            </Text>

            <Text style={text}>
              As a {roleDisplay}, you&apos;ll have {roleDescription}.
            </Text>

            <Section style={buttonContainer}>
              <Link style={button} href={inviteUrl}>
                Accept Invitation
              </Link>
            </Section>

            <Text style={textSmall}>
              Or copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>
              {inviteUrl}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This invitation expires in {expiryDays} days.
            </Text>
            <Text style={footerText}>
              If you didn&apos;t expect this invitation, you can safely ignore this email.
            </Text>
            <Text style={footerTextSmall}>
              © {new Date().getFullYear()} Centervert. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InviteEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoSection = {
  padding: '32px 40px',
  backgroundColor: '#9c5126',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  margin: '0',
};

const content = {
  padding: '0 40px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '40px 0 20px',
  padding: '0',
  lineHeight: '1.25',
};

const text = {
  color: '#484848',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '16px 0',
};

const textSmall = {
  color: '#484848',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '24px 0 8px',
};

const buttonContainer = {
  padding: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#9c5126',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  lineHeight: '1.5',
};

const linkText = {
  color: '#9c5126',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '0 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const footerTextSmall = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '16px 0 0',
};

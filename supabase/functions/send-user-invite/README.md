# User Invitation Email Template

This edge function sends customized invitation emails using React Email templates.

## Features

- ✅ Professional branded email template
- ✅ Responsive design that works on all email clients
- ✅ Role-specific messaging (Admin vs Team Member)
- ✅ Customizable branding colors and messaging
- ✅ Secure invitation links with expiry

## Customizing the Template

The email template is located at `_templates/invite-email.tsx`. You can customize:

### 1. Company Branding

**Logo/Header Color:**
```typescript
const logoSection = {
  backgroundColor: '#9c5126', // Change this to your brand color
};
```

**Button Color:**
```typescript
const button = {
  backgroundColor: '#9c5126', // Match your brand color
  // ... other styles
};
```

**Company Name:**
In `invite-email.tsx`, update the logo text:
```typescript
<Text style={logoText}>CENTERVERT</Text>
// Change to: <Text style={logoText}>YOUR COMPANY</Text>
```

### 2. Email Content

**Subject Line:**
In `index.ts`, change:
```typescript
subject: "You've been invited to join Centervert",
```

**Welcome Message:**
In `invite-email.tsx`:
```typescript
<Heading style={h1}>You&apos;re Invited!</Heading>
```

**Role Descriptions:**
```typescript
const roleDescription = role === 'admin' 
  ? 'full system access to manage companies, contacts, billing, and team members'
  : 'access to manage companies and contacts';
```

### 3. Sender Information

In `index.ts`, update the `from` field:
```typescript
from: "Centervert <noreply@notifications.centervert.com>",
// Change to: "Your Company <noreply@yourcompany.com>",
```

**Note:** Make sure to verify your domain in Resend before sending.

### 4. Invitation Link

The invitation link is automatically generated:
```typescript
const inviteUrl = `https://portal.centervert.com/auth?invite=${token}`;
```

Update to your custom domain or staging URL.

### 5. Expiry Settings

In `index.ts`, change the expiry days:
```typescript
expiryDays: 7, // Change to desired number of days
```

Also update the database when creating invitations to match.

## Testing the Email Template

To preview your email template:

1. Install React Email CLI locally (optional):
   ```bash
   npm install -g @react-email/cli
   ```

2. Run the preview server:
   ```bash
   email dev
   ```

3. Visit `http://localhost:3000` to see your email

## Email Best Practices

✅ **Keep it Simple:** Focus on the call-to-action (Accept Invitation)
✅ **Mobile-Friendly:** Template is responsive for all devices
✅ **Clear Branding:** Logo and colors match your brand
✅ **Security:** Don't expose sensitive data in emails
✅ **Accessibility:** Use semantic HTML and good contrast

## Styling Guide

The template uses inline styles for maximum email client compatibility:

- **Typography:** System fonts for reliability
- **Colors:** HSL/Hex values (avoid CSS variables)
- **Spacing:** Padding/margin in pixels
- **Buttons:** Inline-block with explicit dimensions

## Common Customizations

### Add Company Logo Image

```typescript
<Section style={logoSection}>
  <img 
    src="https://your-cdn.com/logo.png" 
    alt="Your Company"
    style={{ width: '150px', height: 'auto' }}
  />
</Section>
```

### Add Social Media Links

```typescript
<Section style={footer}>
  <Link href="https://twitter.com/yourcompany" style={socialLink}>
    Twitter
  </Link>
  <Link href="https://linkedin.com/company/yourcompany" style={socialLink}>
    LinkedIn
  </Link>
</Section>
```

### Custom Role Messages

```typescript
const getRoleMessage = (role: string) => {
  switch(role) {
    case 'admin':
      return 'You have full administrative access.';
    case 'agent':
      return 'You can manage companies and contacts.';
    default:
      return 'Welcome to the team!';
  }
};
```

## Troubleshooting

**Email not sending:**
- Verify RESEND_API_KEY is set in Supabase secrets
- Check domain verification in Resend dashboard
- Review edge function logs for errors

**Styling issues:**
- Test in multiple email clients (Gmail, Outlook, Apple Mail)
- Use inline styles, not external CSS
- Avoid complex layouts or flexbox

**Template not updating:**
- Edge functions are deployed automatically
- Wait 1-2 minutes for deployment
- Check build logs for errors

## Support

For questions about:
- **React Email:** https://react.email/docs
- **Resend:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

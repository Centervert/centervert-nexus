# Advanced Email Template Customization

This guide shows how to make email templates dynamically customizable through database settings.

## Dynamic Branding from Database

You can store email branding preferences in the `system_settings` table and load them dynamically.

### 1. Add Email Branding Settings

Add a new setting in the database:

```sql
INSERT INTO system_settings (setting_key, setting_value) VALUES 
('email_branding', '{
  "company_name": "Centervert",
  "primary_color": "#9c5126",
  "logo_url": "https://your-cdn.com/logo.png",
  "support_email": "support@centervert.com",
  "website_url": "https://centervert.com",
  "from_name": "Centervert Team",
  "from_email": "noreply@notifications.centervert.com"
}'::jsonb);
```

### 2. Update Edge Function to Fetch Settings

In `index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviter_name, role, token }: InviteRequest = await req.json();

    // Fetch email branding settings
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'email_branding')
      .single();

    const branding = settings?.setting_value || {
      company_name: "Centervert",
      primary_color: "#9c5126",
      from_name: "Centervert Team",
      from_email: "noreply@notifications.centervert.com",
    };

    const inviteUrl = `https://portal.centervert.com/auth?invite=${token}`;

    // Render with dynamic branding
    const html = await renderAsync(
      React.createElement(InviteEmail, {
        inviterName: inviter_name,
        recipientEmail: email,
        role: role,
        inviteUrl: inviteUrl,
        expiryDays: 7,
        // Pass branding props
        companyName: branding.company_name,
        primaryColor: branding.primary_color,
        logoUrl: branding.logo_url,
      })
    );

    const emailResponse = await resend.emails.send({
      from: `${branding.from_name} <${branding.from_email}>`,
      to: [email],
      subject: `You've been invited to join ${branding.company_name}`,
      html,
    });

    return new Response(JSON.stringify(emailResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};
```

### 3. Update Template to Accept Branding Props

In `_templates/invite-email.tsx`:

```typescript
interface InviteEmailProps {
  inviterName: string;
  recipientEmail: string;
  role: string;
  inviteUrl: string;
  expiryDays?: number;
  // Add branding props
  companyName?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export const InviteEmail = ({
  inviterName = 'A team member',
  recipientEmail,
  role = 'Team Member',
  inviteUrl,
  expiryDays = 7,
  // Branding with defaults
  companyName = 'Centervert',
  primaryColor = '#9c5126',
  logoUrl,
}: InviteEmailProps) => {
  // Use dynamic branding
  const logoSectionStyle = {
    ...logoSection,
    backgroundColor: primaryColor,
  };

  const buttonStyle = {
    ...button,
    backgroundColor: primaryColor,
  };

  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSectionStyle}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} style={{ maxWidth: '200px', height: 'auto' }} />
            ) : (
              <Text style={logoText}>{companyName.toUpperCase()}</Text>
            )}
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>You&apos;re Invited!</Heading>
            <Text style={text}>
              <strong>{inviterName}</strong> has invited you to join {companyName} as a <strong>{role}</strong>.
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={buttonStyle} href={inviteUrl}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={text}>
              Or copy and paste this URL into your browser:
            </Text>
            <Text style={code}>{inviteUrl}</Text>

            <Hr style={hr} />

            <Text style={text}>
              This invitation will expire in {expiryDays} days. If you didn&apos;t expect this invitation, you can safely ignore this email.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
```

## Multi-Language Support

Add language preferences and translations:

### 1. Add Translations to Database

```sql
INSERT INTO system_settings (setting_key, setting_value) VALUES 
('email_translations', '{
  "en": {
    "subject": "You''ve been invited to join {company}",
    "heading": "You''re Invited!",
    "inviter_text": "{inviter} has invited you to join {company} as a {role}.",
    "button_text": "Accept Invitation",
    "expiry_text": "This invitation expires in {days} days."
  },
  "es": {
    "subject": "Has sido invitado a unirte a {company}",
    "heading": "¡Estás Invitado!",
    "inviter_text": "{inviter} te ha invitado a unirte a {company} como {role}.",
    "button_text": "Aceptar Invitación",
    "expiry_text": "Esta invitación expira en {days} días."
  }
}'::jsonb);
```

### 2. Template with Translation Support

```typescript
interface InviteEmailProps {
  inviterName: string;
  recipientEmail: string;
  role: string;
  inviteUrl: string;
  expiryDays?: number;
  companyName?: string;
  primaryColor?: string;
  logoUrl?: string;
  language?: 'en' | 'es';
  translations?: Record<string, string>;
}

export const InviteEmail = ({
  inviterName = 'A team member',
  recipientEmail,
  role = 'Team Member',
  inviteUrl,
  expiryDays = 7,
  companyName = 'Centervert',
  primaryColor = '#9c5126',
  logoUrl,
  language = 'en',
  translations,
}: InviteEmailProps) => {
  const t = (key: string, replacements?: Record<string, string>) => {
    let text = translations?.[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value);
      });
    }
    return text;
  };

  const logoSectionStyle = {
    ...logoSection,
    backgroundColor: primaryColor,
  };

  const buttonStyle = {
    ...button,
    backgroundColor: primaryColor,
  };

  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Html>
      <Head />
      <Preview>{t('subject', { company: companyName })}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSectionStyle}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} style={{ maxWidth: '200px', height: 'auto' }} />
            ) : (
              <Text style={logoText}>{companyName.toUpperCase()}</Text>
            )}
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>{t('heading')}</Heading>
            <Text style={text}>
              {t('inviter_text', { 
                inviter: inviterName, 
                company: companyName, 
                role: roleDisplay 
              })}
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={buttonStyle} href={inviteUrl}>
                {t('button_text')}
              </Button>
            </Section>

            <Text style={text}>
              {t('expiry_text', { days: expiryDays.toString() })}
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
```

## Role-Based Template Selection

Create different templates for different roles:

```typescript
// _templates/admin-invite.tsx
export const AdminInviteEmail = (props: InviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You've been granted Administrator Access</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{props.companyName?.toUpperCase()}</Text>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>You've been granted Administrator Access</Heading>
            <Text style={text}>
              <strong>{props.inviterName}</strong> has invited you to join {props.companyName} with full administrative privileges.
            </Text>
            
            <Section style={highlightBox}>
              <Text style={highlightText}>
                As an administrator, you'll have access to:
              </Text>
              <ul>
                <li>User management</li>
                <li>System settings</li>
                <li>Analytics and reports</li>
                <li>Billing and subscriptions</li>
              </ul>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={props.inviteUrl}>
                Accept Admin Invitation
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// _templates/team-invite.tsx
export const TeamInviteEmail = (props: InviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Team!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{props.companyName?.toUpperCase()}</Text>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>Welcome to the Team!</Heading>
            <Text style={text}>
              <strong>{props.inviterName}</strong> has invited you to join the {props.companyName} team.
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={props.inviteUrl}>
                Join the Team
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// In index.ts
const getTemplate = (role: string) => {
  switch(role) {
    case 'admin':
      return AdminInviteEmail;
    case 'agent':
      return TeamInviteEmail;
    default:
      return InviteEmail;
  }
};

const Template = getTemplate(role);
const html = await renderAsync(
  React.createElement(Template, templateProps)
);
```

## Custom Email Footer

Add social links and additional information:

```typescript
// In template
<Section style={footer}>
  {/* Social Links */}
  <Section style={socialLinks}>
    {socialMedia.twitter && (
      <Link href={socialMedia.twitter} style={socialLink}>
        Twitter
      </Link>
    )}
    {socialMedia.linkedin && (
      <Link href={socialMedia.linkedin} style={socialLink}>
        LinkedIn
      </Link>
    )}
  </Section>

  {/* Company Address */}
  <Text style={footerText}>
    {companyAddress.street}<br/>
    {companyAddress.city}, {companyAddress.state} {companyAddress.zip}
  </Text>

  {/* Unsubscribe Link */}
  <Link href={`${baseUrl}/unsubscribe?email=${recipientEmail}`} style={unsubscribeLink}>
    Manage Email Preferences
  </Link>
</Section>
```

## A/B Testing

Track email template performance:

```typescript
// Add tracking parameter to invite URL
const inviteUrl = `https://portal.centervert.com/auth?invite=${token}&template=v2`;

// Store template version in invitations table
const { error } = await supabase
  .from('invitations')
  .update({ 
    email_template_version: 'v2',
    email_sent_at: new Date().toISOString() 
  })
  .eq('token', token);

// Track acceptance
// When user accepts, record which template version was used
```

## Security Considerations

1. **Sanitize User Input:** Always escape user-provided content
2. **Rate Limiting:** Implement rate limits on invitation sending
3. **Token Security:** Use cryptographically secure tokens
4. **Domain Verification:** Only send from verified domains
5. **SPF/DKIM:** Configure email authentication

## Performance Tips

1. **Cache Settings:** Cache branding settings to reduce database queries
2. **Precompile Templates:** Consider pre-rendering common templates
3. **Optimize Images:** Use optimized, CDN-hosted images
4. **Batch Sending:** Send multiple invitations in batches if needed

## Example: Complete Custom Branding Setup

```typescript
// Full example with all features
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviter_name, role, token, language = 'en' }: InviteRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all settings
    const [brandingRes, translationsRes, socialRes] = await Promise.all([
      supabase.from('system_settings').select('setting_value').eq('setting_key', 'email_branding').single(),
      supabase.from('system_settings').select('setting_value').eq('setting_key', 'email_translations').single(),
      supabase.from('system_settings').select('setting_value').eq('setting_key', 'social_media').single(),
    ]);

    const branding = brandingRes.data?.setting_value || {};
    const translations = translationsRes.data?.setting_value?.[language] || {};
    const socialMedia = socialRes.data?.setting_value || {};

    const inviteUrl = `https://portal.centervert.com/auth?invite=${token}`;

    // Render with all customizations
    const html = await renderAsync(
      React.createElement(InviteEmail, {
        inviterName: inviter_name,
        recipientEmail: email,
        role: role,
        inviteUrl: inviteUrl,
        expiryDays: 7,
        ...branding,
        translations,
        socialMedia,
      })
    );

    // Send with custom branding
    await resend.emails.send({
      from: `${branding.from_name} <${branding.from_email}>`,
      to: [email],
      subject: translations.subject || "You've been invited",
      html,
      replyTo: branding.support_email,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};
```

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, Building2, Briefcase } from "lucide-react";
import { formatPhoneNumber } from "@/lib/phoneUtils";

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          companies (
            id,
            name,
            website,
            phone,
            address,
            billing_email
          )
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">Loading...</div>
      </UnifiedLayout>
    );
  }

  if (!contact) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">Contact not found</div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/contacts")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback
                      className={`${getAvatarColor(contact.first_name)} text-white text-2xl`}
                    >
                      {getInitials(contact.first_name, contact.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {contact.first_name} {contact.last_name}
                    </h2>
                    {contact.title && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {contact.title}
                      </p>
                    )}
                    {contact.companies && (
                      <p className="text-sm text-muted-foreground">
                        at {contact.companies.name}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Key information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Email</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Phone Number</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                            {formatPhoneNumber(contact.phone)}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </div>
                    </div>

                    {contact.companies && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Company</div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={() => navigate(`/companies/${contact.companies.id}`)}
                            className="text-primary hover:underline"
                          >
                            {contact.companies.name}
                          </button>
                        </div>
                      </div>
                    )}

                    {contact.title && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Job Title</div>
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.title}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Visibility Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Visibility</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Show in All Contacts</div>
                      <div className="text-sm">
                        {contact.show_in_all_contacts ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      First Name
                    </div>
                    <div className="text-sm">{contact.first_name}</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Last Name
                    </div>
                    <div className="text-sm">{contact.last_name}</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Email
                    </div>
                    <div className="text-sm">{contact.email}</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Phone Number
                    </div>
                    <div className="text-sm">
                      {contact.phone ? formatPhoneNumber(contact.phone) : "--"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Job Title
                    </div>
                    <div className="text-sm">{contact.title || "--"}</div>
                  </div>

                  {contact.companies && (
                    <>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Company name
                        </div>
                        <div className="text-sm">
                          <button
                            onClick={() => navigate(`/companies/${contact.companies.id}`)}
                            className="text-primary hover:underline"
                          >
                            {contact.companies.name}
                          </button>
                        </div>
                      </div>

                      {contact.companies.website && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Company Website
                          </div>
                          <div className="text-sm">
                            <a
                              href={contact.companies.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {contact.companies.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {contact.companies.phone && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Company Phone
                          </div>
                          <div className="text-sm">
                            {formatPhoneNumber(contact.companies.phone)}
                          </div>
                        </div>
                      )}

                      {contact.companies.address && (
                        <div className="md:col-span-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Company Address
                          </div>
                          <div className="text-sm">{contact.companies.address}</div>
                        </div>
                      )}
                    </>
                  )}

                  {contact.notes && (
                    <div className="md:col-span-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Notes
                      </div>
                      <div className="text-sm">{contact.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default ContactDetail;

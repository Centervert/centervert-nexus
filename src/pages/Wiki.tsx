import UnifiedLayout from "@/components/UnifiedLayout";
import { WikiWorkspace } from "@/components/wiki/WikiWorkspace";
import { useUserRole } from "@/hooks/useUserRole";

const Wiki = () => {
  const { data: userRole } = useUserRole();
  const canEdit = !!(userRole?.isAdmin || userRole?.isAgent);

  return (
    <UnifiedLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Company Wiki</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Company-wide process docs, playbooks and notes that aren't tied to a single project.
          </p>
        </div>
        <WikiWorkspace
          canEdit={canEdit}
          emptyLabel="No company pages yet — create the first one."
        />
      </div>
    </UnifiedLayout>
  );
};

export default Wiki;

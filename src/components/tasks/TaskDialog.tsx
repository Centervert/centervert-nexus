import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/lib/crm";

export interface TaskLinks {
  organization_id?: string | null;
  contact_id?: string | null;
  prospect_id?: string | null;
  deal_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links?: TaskLinks;
  task?: any;
  onSuccess?: () => void;
}

export function TaskDialog({ open, onOpenChange, links, task, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [type, setType] = useState("follow_up");
  const [ownerSide, setOwnerSide] = useState("seller");
  const [ownerName, setOwnerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("open");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDetails(task?.details ?? "");
    setType(task?.task_type ?? "follow_up");
    setOwnerSide(task?.owner_side ?? "seller");
    setOwnerName(task?.owner_name ?? "");
    setDueDate(task?.due_date ?? "");
    setPriority(task?.priority ?? "normal");
    setStatus(task?.status ?? "open");
  }, [open, task]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const payload = {
        title,
        details: details || null,
        task_type: type,
        owner_side: ownerSide,
        owner_name: ownerName || null,
        due_date: dueDate || null,
        priority,
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
      };
      if (task?.id) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert({
          ...payload,
          owner_id: uid,
          created_by: uid,
          organization_id: links?.organization_id ?? null,
          contact_id: links?.contact_id ?? null,
          prospect_id: links?.prospect_id ?? null,
          deal_id: links?.deal_id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: task?.id ? "Task updated" : "Task created" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e: Error) =>
      toast({ title: "Could not save task", description: e.message, variant: "destructive" }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task?.id ? "Edit task" : "New task"}</SheetTitle>
          <SheetDescription>Track what we owe the customer and what they owe us.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Task</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="details">Details</Label>
            <Textarea id="details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owned by</Label>
              <Select value={ownerSide} onValueChange={setOwnerSide}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Us</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ownerName">Owner name</Label>
              <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!title.trim() || save.isPending}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import { Building2, Check, Plus, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTalentFlow, type ComplianceSettings } from "@/lib/talentflow-store";

export function ManageWorkspacesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useTalentFlow();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [region, setRegion] = useState("");
  const [draft, setDraft] = useState<ComplianceSettings>(store.compliance);

  function toggle(key: keyof ComplianceSettings, value: boolean) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function createWorkspace() {
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    store.addWorkspace({
      name: name.trim(),
      department: department.trim() || "General",
      region: region.trim() || "Global",
    });
    setName("");
    setDepartment("");
    setRegion("");
    toast.success("Workspace created");
  }

  function save() {
    store.setCompliance(draft);
    onOpenChange(false);
    toast.success("Workspace configuration saved");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage workspaces</DialogTitle>
          <DialogDescription>
            Configure workspaces, team access, and compliance controls for {store.workspace.name}.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="active">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="active">Active Workspaces</TabsTrigger>
            <TabsTrigger value="team">Team Access</TabsTrigger>
            <TabsTrigger value="compliance">Compliance & POPIA</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-5 space-y-4">
            {(store.allWorkspaces || []).map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => {
                  store.setWorkspaceId(workspace.id);
                  toast.success(`Switched to ${workspace.name}`);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-surface-panel"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
                  {workspace.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{workspace.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {workspace.department} · {workspace.region} · {workspace.members} members
                  </span>
                </span>
                {store.workspaceId === workspace.id ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <Building2 className="size-4 text-muted-foreground" />
                )}
              </button>
            ))}
            <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
              <p className="text-sm font-semibold">Create a new workspace</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ws-name">Name</Label>
                  <Input
                    id="ws-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nova Health — Clinical"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ws-dept">Department</Label>
                  <Input
                    id="ws-dept"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    placeholder="Clinical Staffing"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ws-region">Region</Label>
                  <Input
                    id="ws-region"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    placeholder="Pretoria, ZA"
                  />
                </div>
              </div>
              <Button size="sm" onClick={createWorkspace}>
                <Plus className="size-4" /> Create workspace
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-5 space-y-3">
            {(store.team || []).map((member) => (
              <div
                key={member.email}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
                <Badge
                  variant={member.role === "Admin" ? "default" : "secondary"}
                  className="gap-1"
                >
                  <Users className="size-3" /> {member.role}
                </Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="compliance" className="mt-5 space-y-3">
            <ToggleRow
              label="Automated PII Redaction"
              description="Strip identifiers from notes before AI analysis."
              checked={draft.piiRedaction}
              onChange={(value) => toggle("piiRedaction", value)}
            />
            <ToggleRow
              label="Anonymized Candidate Review"
              description="Hide names and demographics during panel scoring."
              checked={draft.anonymizedReview}
              onChange={(value) => toggle("anonymizedReview", value)}
            />
            <ToggleRow
              label="Meeting Recording Consent Requirement"
              description="Block live copilot sessions until consent is confirmed."
              checked={draft.recordingConsent}
              onChange={(value) => toggle("recordingConsent", value)}
            />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>
            <ShieldCheck className="size-4" /> Save configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

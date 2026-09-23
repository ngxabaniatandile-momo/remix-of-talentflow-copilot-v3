import { Building2, CalendarClock, Check, Lock, Plus, ShieldCheck, UserPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  passwordScore,
  teamRoles,
  useTalentFlow,
  validatePassword,
  validatePin,
  type ComplianceSettings,
  type TeamRole,
  type Workspace,
} from "@/lib/talentflow-store";
import { cn } from "@/lib/utils";

const strengthLabels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
const strengthColors = [
  "bg-destructive",
  "bg-destructive",
  "bg-alert-border",
  "bg-primary",
  "bg-success",
];

export function ManageWorkspacesDialog({
  open,
  onOpenChange,
  onRequestUnlock,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestUnlock?: (workspace: Workspace) => void;
}) {
  const store = useTalentFlow();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [region, setRegion] = useState("");
  const [credentialType, setCredentialType] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState<ComplianceSettings>(store.compliance);

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<TeamRole>("Interviewer");

  const score = passwordScore(password);

  function toggle(key: keyof ComplianceSettings, value: boolean) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function createWorkspace() {
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    const secret = credentialType === "pin" ? pin.trim() : password;
    const problem = credentialType === "pin" ? validatePin(secret) : validatePassword(secret);
    if (problem) {
      toast.error(problem);
      return;
    }
    store.addWorkspace({
      name: name.trim(),
      department: department.trim() || "General",
      region: region.trim() || "Global",
      credential: { type: credentialType, value: secret },
    });
    setName("");
    setDepartment("");
    setRegion("");
    setPin("");
    setPassword("");
    toast.success("Workspace created and secured");
  }

  function addMember() {
    if (!memberName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail.trim())) {
      toast.error("Enter a valid work email");
      return;
    }
    const created = store.addMember({
      name: memberName.trim(),
      email: memberEmail.trim(),
      role: memberRole,
    });
    setMemberName("");
    setMemberEmail("");
    setMemberRole("Interviewer");
    toast.success(`${created.name} added · Started: ${created.startDate}`);
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
            Configure workspaces, security credentials, team access, and compliance controls for{" "}
            {store.workspace.name}.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="active">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="active">Active Workspaces</TabsTrigger>
            <TabsTrigger value="team">Team Access</TabsTrigger>
            <TabsTrigger value="compliance">Compliance & POPIA</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-5 space-y-4">
            {(store.allWorkspaces || []).map((workspace) => {
              const unlocked = store.isUnlocked(workspace.id);
              return (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => {
                    if (!unlocked) {
                      onRequestUnlock?.(workspace);
                      return;
                    }
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
                  ) : unlocked ? (
                    <Building2 className="size-4 text-muted-foreground" />
                  ) : (
                    <Lock className="size-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
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

              <div className="space-y-2">
                <Label>Security credential</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={credentialType === "pin" ? "default" : "outline"}
                    onClick={() => setCredentialType("pin")}
                  >
                    6-Digit PIN
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={credentialType === "password" ? "default" : "outline"}
                    onClick={() => setCredentialType("password")}
                  >
                    Strong Password
                  </Button>
                </div>
                {credentialType === "pin" ? (
                  <div className="space-y-1.5">
                    <Input
                      inputMode="numeric"
                      value={pin}
                      onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="849201"
                      aria-label="Workspace PIN"
                    />
                    <p className="text-xs text-muted-foreground">
                      Exactly 6 digits. Simple sequences like 123456 or 000000 are rejected.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                      aria-label="Workspace password"
                    />
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          strengthColors[score] ?? "bg-destructive",
                        )}
                        style={{ width: `${(score / 4) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength: {strengthLabels[score] ?? "Very weak"}
                    </p>
                  </div>
                )}
              </div>

              <Button size="sm" onClick={createWorkspace}>
                <Plus className="size-4" /> Create workspace
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-5 space-y-3">
            {(store.team || []).map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  <Badge variant="secondary" className="mt-2 gap-1 text-[11px]">
                    <CalendarClock className="size-3" /> Started: {member.startDate}
                  </Badge>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(value) => {
                    store.updateMemberRole(member.id, value as TeamRole);
                    toast.success(`Role updated to ${value} for ${member.name}`);
                  }}
                >
                  <SelectTrigger className="w-44" aria-label={`Role for ${member.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teamRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
              <p className="text-sm font-semibold">Add a team member</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="member-name">Full name</Label>
                  <Input
                    id="member-name"
                    value={memberName}
                    onChange={(event) => setMemberName(event.target.value)}
                    placeholder="Lebo Mahlangu"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="member-email">Work email</Label>
                  <Input
                    id="member-email"
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    placeholder="lebo@acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Initial role</Label>
                  <Select
                    value={memberRole}
                    onValueChange={(value) => setMemberRole(value as TeamRole)}
                  >
                    <SelectTrigger aria-label="Initial role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={addMember}>
                <UserPlus className="size-4" /> Add member
              </Button>
              <p className="text-xs text-muted-foreground">
                The start date is captured automatically when the member is added.
              </p>
            </div>
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

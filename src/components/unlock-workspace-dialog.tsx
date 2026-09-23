import { Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { useTalentFlow, type Workspace } from "@/lib/talentflow-store";

export function UnlockWorkspaceDialog({
  workspace,
  onOpenChange,
  onUnlocked,
}: {
  workspace: Workspace | null;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: (workspace: Workspace) => void;
}) {
  const store = useTalentFlow();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSecret("");
    setError(null);
  }, [workspace]);

  function submit() {
    if (!workspace) return;
    const ok = store.unlockWorkspace(workspace.id, secret);
    if (!ok) {
      setError("Incorrect PIN or password for this workspace.");
      return;
    }
    toast.success(`${workspace.name} unlocked`);
    onUnlocked?.(workspace);
    onOpenChange(false);
  }

  return (
    <Dialog open={workspace !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5 text-primary" /> Unlock workspace
          </DialogTitle>
          <DialogDescription>
            {workspace?.name} is protected. Enter its 6-digit PIN or password to switch context.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="workspace-secret">Security credential</Label>
          <Input
            id="workspace-secret"
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(event) => {
              setSecret(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            placeholder="6-digit PIN or password"
          />
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!secret.trim()}>
            <Unlock className="size-4" /> Unlock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

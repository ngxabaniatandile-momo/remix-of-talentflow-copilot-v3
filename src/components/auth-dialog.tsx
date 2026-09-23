import { Apple, ArrowLeft, Mail, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "root" | "phone" | "otp";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

export function AuthDialog({
  open,
  onOpenChange,
  onAuthenticated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
}) {
  const [step, setStep] = useState<Step>("root");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(899);
  const [channel, setChannel] = useState("phone");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open || step !== "otp") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [open, step]);

  function reset() {
    setStep("root");
    setDigits(["", "", "", ""]);
    setPhone("");
    setEmail("");
    setSeconds(899);
  }

  function complete(message: string) {
    onAuthenticated();
    onOpenChange(false);
    reset();
    toast.success(message);
  }

  function setDigit(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 3) inputs.current[index + 1]?.focus();
    if (next.every((entry) => entry !== "")) {
      complete(channel === "phone" ? "Phone verified successfully" : "Email verified successfully");
    }
  }

  function onDigitKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  function startOtp(nextChannel: string) {
    setChannel(nextChannel);
    setDigits(["", "", "", ""]);
    setSeconds(899);
    setStep("otp");
    toast.success("Secure 4-digit code sent");
    window.setTimeout(() => inputs.current[0]?.focus(), 80);
  }

  function submitEmail() {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Enter a valid email address");
      return;
    }
    startOtp("email");
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-xl">{step === "otp" ? "Enter your code" : "Log in or sign up"}</DialogTitle>
          <DialogDescription className="text-center">
            {step === "otp"
              ? `We sent a 4-digit code to ${channel === "phone" ? phone || "your phone" : email || "your email"}.`
              : "You'll get smarter responses and can upload files, candidate records, and more."}
          </DialogDescription>
        </DialogHeader>

        {step === "root" && (
          <div className="space-y-3">
            <Button variant="outline" className="h-11 w-full justify-center rounded-full" onClick={() => complete("Signed in via Google")}>
              <GoogleIcon /> Continue with Google
            </Button>
            <Button variant="outline" className="h-11 w-full justify-center rounded-full" onClick={() => complete("Signed in via Apple")}>
              <Apple className="size-4" /> Continue with Apple
            </Button>
            <Button variant="outline" className="h-11 w-full justify-center rounded-full" onClick={() => setStep("phone")}>
              <Phone className="size-4" /> Continue with phone
            </Button>
            <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email"
                  className="h-11 pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && submitEmail()}
                  placeholder="you@company.com"
                />
              </div>
              <Button className="h-11 w-full rounded-full" onClick={submitEmail}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-3">
            <Label htmlFor="auth-phone">Phone number</Label>
            <Input
              id="auth-phone"
              className="h-11"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && phone.trim() && startOtp("phone")}
              placeholder="+27 ..."
            />
            <Button className="h-11 w-full rounded-full" disabled={!phone.trim()} onClick={() => startOtp("phone")}>
              Send Code
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("root")}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  inputMode="numeric"
                  aria-label={`Digit ${index + 1}`}
                  className="size-12 rounded-md border border-input bg-background text-center text-lg font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                  value={digit}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => onDigitKeyDown(index, event.key)}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">Code expires in {time} minutes (AI-generated secure PIN)</p>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                setDigits(["1", "2", "3", "4"]);
                complete(channel === "phone" ? "Phone verified successfully" : "Email verified successfully");
              }}
            >
              Use demo code 1234
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("root")}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

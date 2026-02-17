// =============================================================================
// SoftwareHub Electron License SDK - Crash Consent Dialog
// =============================================================================
// Renderer process component. Shows a consent dialog before enabling crash
// reporting. Uses Tailwind CSS + shadcn/ui components.
//
// Usage (renderer process):
//   import { CrashConsentDialog } from '@softwarehub/electron-license-sdk'
//
//   <CrashConsentDialog
//     appName="Watermark Remover"
//     onGrant={() => window.crashReporterAPI.grantConsent()}
//     onDecline={() => window.crashReporterAPI.revokeConsent()}
//   />
// =============================================================================

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface CrashConsentDialogProps {
  /** The application name shown in the dialog title and description */
  appName: string;
  /** Called when the user clicks "Enable Crash Reporting" */
  onGrant: () => void;
  /** Called when the user clicks "No Thanks" */
  onDecline: () => void;
  /** Controls whether the dialog is open (default: true) */
  open?: boolean;
}

export function CrashConsentDialog({
  appName,
  onGrant,
  onDecline,
  open = true,
}: CrashConsentDialogProps): React.ReactElement {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Help improve {appName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Send anonymous crash reports to help us fix issues faster.
          </DialogDescription>
        </DialogHeader>

        <Card className="border border-border bg-muted/40">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-sm text-foreground font-medium">
              What is collected:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-none">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5" aria-hidden>&#10003;</span>
                <span>Crash stack traces and error messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5" aria-hidden>&#10003;</span>
                <span>App version and operating system type</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5" aria-hidden>&#10003;</span>
                <span>License tier (e.g. standard, pro)</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground font-medium pt-1">
              What is NOT collected:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-none">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5" aria-hidden>&#10005;</span>
                <span>Your name, email address, or account details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5" aria-hidden>&#10005;</span>
                <span>Files, documents, or media you process</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5" aria-hidden>&#10005;</span>
                <span>Your license key or payment information</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground/70 pt-1">
              No personal data is collected. You can change this in Settings at any time.
            </p>
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-2">
          <Button
            variant="ghost"
            onClick={onDecline}
            className="w-full sm:w-auto"
          >
            No Thanks
          </Button>
          <Button
            variant="default"
            onClick={onGrant}
            className="w-full sm:w-auto"
          >
            Enable Crash Reporting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CrashConsentDialog;

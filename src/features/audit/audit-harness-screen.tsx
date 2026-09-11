import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  Text,
  VStack,
  useToast,
  type DialogProps,
} from '@beemvp/beeui-ui';
import { ScrollView } from 'react-native';

/**
 * Test-only route, not part of the product surface. Mounts real BeeUI overlay/toast
 * primitives with deterministic testIDs so scripts/audit/browser/*.spec.ts can drive
 * the 8 `untested-needs-browser` behavior claims (ADLG-01, DLG-01, DLG-02, SEL-01,
 * SEL-02, SHEET-01, TOAST-01, TOAST-02) against a real DOM + BeeUIProvider, which the
 * Jest/react-test-renderer claims harness cannot exercise. See
 * plans/260911-0854-beepos-ui-prototype/phase-11-native-and-browser-claims.md Part B.
 */
export function AuditHarnessScreen() {
  return (
    <ScrollView testID="audit-harness-root" contentContainerStyle={{ padding: 16, gap: 24 }}>
      <AlertDialogSection />
      <DialogWarnSection />
      <DialogDismissSection />
      <SelectDuplicateSection />
      <SelectRemovedSelectionSection />
      <SheetDismissSection />
      <ToastFifoSection />
      <ToastPersistentSection />
    </ScrollView>
  );
}

function AlertDialogSection() {
  return (
    <VStack className="gap-2">
      <Text>ADLG-01: AlertDialog backdrop/Escape never close</Text>
      <AlertDialog>
        <AlertDialogTrigger testID="adlg01-trigger">Open AlertDialog</AlertDialogTrigger>
        <AlertDialogContent testID="adlg01-content" overlayTestID="adlg01-overlay">
          <AlertDialogTitle>Delete item</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel testID="adlg01-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction testID="adlg01-action">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  );
}

function DialogWarnSection() {
  const [showBroken, setShowBroken] = useState(false);
  // Deliberately invalid per DialogProps (open without onOpenChange) to exercise the
  // documented dev-mode warning + uncontrolled fallback (DLG-01).
  const brokenProps = { open: true } as unknown as DialogProps;
  return (
    <VStack className="gap-2">
      <Text>DLG-01: open without onOpenChange warns + falls back to dismissable</Text>
      <Button testID="dlg01-mount" onPress={() => setShowBroken(true)}>
        Mount dialog without onOpenChange
      </Button>
      {showBroken ? (
        <Dialog {...brokenProps}>
          <DialogContent testID="dlg01-content" overlayTestID="dlg01-overlay">
            <DialogTitle>Broken dialog</DialogTitle>
            <DialogDescription>open supplied without onOpenChange.</DialogDescription>
          </DialogContent>
        </Dialog>
      ) : null}
    </VStack>
  );
}

function DialogDismissSection() {
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [noEscapeOpen, setNoEscapeOpen] = useState(false);
  return (
    <VStack className="gap-2">
      <Text>DLG-02: backdrop / Escape dismiss channels</Text>
      <Button testID="dlg02-default-trigger" onPress={() => setDefaultOpen(true)}>
        Open default dialog
      </Button>
      <Dialog open={defaultOpen} onOpenChange={setDefaultOpen}>
        <DialogContent testID="dlg02-default-content" overlayTestID="dlg02-default-overlay">
          <DialogTitle>Default dialog</DialogTitle>
          <DialogDescription>Escape and backdrop both close this one.</DialogDescription>
        </DialogContent>
      </Dialog>
      <Button testID="dlg02-noescape-trigger" onPress={() => setNoEscapeOpen(true)}>
        Open dismissOnEscape=false dialog
      </Button>
      <Dialog open={noEscapeOpen} onOpenChange={setNoEscapeOpen}>
        <DialogContent
          testID="dlg02-noescape-content"
          overlayTestID="dlg02-noescape-overlay"
          dismissOnEscape={false}
        >
          <DialogTitle>No-escape dialog</DialogTitle>
          <DialogDescription>Escape does not close; backdrop still does.</DialogDescription>
        </DialogContent>
      </Dialog>
    </VStack>
  );
}

function SelectDuplicateSection() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <VStack className="gap-2">
      <Text>SEL-01: duplicate SelectItem value disables both</Text>
      <Text testID="sel01-value-readout">value: {value ?? '(none)'}</Text>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger testID="sel01-trigger">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent testID="sel01-content">
          <SelectItem testID="sel01-item-a" value="dup">
            Option A (dup)
          </SelectItem>
          <SelectItem testID="sel01-item-b" value="dup">
            Option B (dup)
          </SelectItem>
          <SelectItem testID="sel01-item-c" value="unique">
            Option C (unique)
          </SelectItem>
        </SelectContent>
      </Select>
    </VStack>
  );
}

function SelectRemovedSelectionSection() {
  const [value, setValue] = useState<string | undefined>('keep');
  const [showRemoved, setShowRemoved] = useState(true);
  return (
    <VStack className="gap-2">
      <Text>SEL-02: removing the selected option falls back to placeholder</Text>
      <Text testID="sel02-value-readout">value: {value ?? '(none)'}</Text>
      <Button testID="sel02-remove-selected" onPress={() => setShowRemoved(false)}>
        Remove selected option from the list
      </Button>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger testID="sel02-trigger">
          <SelectValue testID="sel02-value" placeholder="No selection" />
        </SelectTrigger>
        <SelectContent testID="sel02-content">
          {showRemoved ? (
            <SelectItem testID="sel02-item-keep" value="keep">
              Removable option
            </SelectItem>
          ) : null}
          <SelectItem testID="sel02-item-other" value="other">
            Other option
          </SelectItem>
        </SelectContent>
      </Select>
    </VStack>
  );
}

function SheetDismissSection() {
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [noCloseOpen, setNoCloseOpen] = useState(false);
  return (
    <VStack className="gap-2">
      <Text>SHEET-01: dismissal routes through the Dialog-equivalent contract</Text>
      <Button testID="sheet01-default-trigger" onPress={() => setDefaultOpen(true)}>
        Open default sheet
      </Button>
      <Sheet open={defaultOpen} onOpenChange={setDefaultOpen}>
        <SheetContent testID="sheet01-default-content" overlayTestID="sheet01-default-overlay">
          <SheetTitle>Default sheet</SheetTitle>
          <SheetDescription>Escape and backdrop both close this one.</SheetDescription>
        </SheetContent>
      </Sheet>
      <Button testID="sheet01-noclose-trigger" onPress={() => setNoCloseOpen(true)}>
        Open dismissOnRequestClose=false sheet
      </Button>
      <Sheet open={noCloseOpen} onOpenChange={setNoCloseOpen}>
        <SheetContent
          testID="sheet01-noclose-content"
          overlayTestID="sheet01-noclose-overlay"
          dismissOnRequestClose={false}
        >
          <SheetTitle>No-close sheet</SheetTitle>
          <SheetDescription>Only the explicit close button closes this one.</SheetDescription>
          <SheetClose testID="sheet01-noclose-close">Explicit close</SheetClose>
        </SheetContent>
      </Sheet>
    </VStack>
  );
}

function ToastFifoSection() {
  const { show, dismissAll } = useToast();
  return (
    <VStack className="gap-2">
      <Text>TOAST-01: FIFO queue, at most 3 visible</Text>
      <Button
        testID="toast01-trigger-5"
        onPress={() => {
          for (let i = 1; i <= 5; i += 1) {
            show({ title: `Toast ${i}`, duration: 'persistent' });
          }
        }}
      >
        Show 5 toasts
      </Button>
      <Button testID="toast01-dismiss-all" onPress={() => dismissAll()}>
        Dismiss all
      </Button>
    </VStack>
  );
}

function ToastPersistentSection() {
  const { show, dismissAll } = useToast();
  return (
    <VStack className="gap-2">
      <Text>TOAST-02: persistent opts out of auto-dismiss; action dismissal is deterministic</Text>
      <Button
        testID="toast02-persistent"
        onPress={() => show({ title: 'Persistent Toast', duration: 'persistent' })}
      >
        Show persistent toast
      </Button>
      <Button
        testID="toast02-timed-action"
        onPress={() =>
          show({
            title: 'Timed Toast',
            duration: 1500,
            action: { label: 'Dismiss now', onPress: () => {}, dismissOnPress: true },
          })
        }
      >
        Show timed toast with action
      </Button>
      <Button testID="toast02-dismiss-all" onPress={() => dismissAll()}>
        Dismiss all
      </Button>
    </VStack>
  );
}

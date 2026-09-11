// Phase 08 fixtures: minimal, hand-written context/ancestor wiring and
// required-value overrides that the generic scripts/audit/props/test-driver
// cannot infer from the prop model alone (compound-family root/provider
// nesting, and a handful of structurally-typed required props such as
// CalendarDate). Everything else (plain required string/number/boolean/
// callback/node props) is auto-filled generically by the driver from the
// prop model's `kind`, so most of the 62 components need no entry here at
// all — only the families with a Root/Provider/Item contract do.
//
// Mirrors real usage shown in scripts/audit/claims/__tests__/*.claims.test.tsx
// (table.js, tabs.js, pagination.js, segmented-control.js, otp-input.js, ...)
// wherever an existing claim test already proved a working shape.
import * as React from 'react';
import { View as RNView, Text as RNText } from 'react-native';
import {
  Accordion,
  AccordionItem,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  Collapsible,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTitle,
  RadioGroup,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  Sheet,
  SheetContent,
  SheetTitle,
  Stepper,
  Tabs,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  SegmentedControl,
  ChipGroup,
} from '@beemvp/beeui-ui';

const noop = () => {};
const TODAY = { year: 2026, month: 9, day: 11 };
const TODAY_TIME = { hour: 12, minute: 0 };

/** Structural (non-generically-derivable) required-value overrides, by exported component name. */
export const FIXTURE_REQUIRED: Record<string, Record<string, unknown>> = {
  Calendar: { value: TODAY },
  DatePicker: { value: TODAY },
  DateTimePicker: { value: { date: TODAY, time: TODAY_TIME } },
  AccordionItem: { value: 'fx-item' },
  TabsTrigger: { value: 'fx-tab' },
  TabsContent: { value: 'fx-tab' },
  Tabs: { value: 'fx-tab', onValueChange: noop },
  SegmentedControlItem: { value: 'fx-seg' },
  SegmentedControl: { value: 'fx-seg', onValueChange: noop },
  SelectItem: { value: 'fx-select' },
  DropdownMenuRadioItem: { value: 'fx-radio' },
  PaginationItem: { page: 1, type: 'page' },
  Pagination: { page: 1, pageCount: 3, onPageChange: noop },
  OTPInput: { length: 6 },
  StepperItem: { step: 1, title: 'Step' },
  Stepper: { currentStep: 1 },
  // Each overlay Root's own `open`/`defaultOpen` boolean only has an
  // observable effect (Content mounted vs. not) when the Root actually has
  // Content children — a bare `<Dialog open />` with no children renders
  // identically whether open or not, which starved the boolean tester's
  // structural-diff fallback of any evidence. Real Trigger+Content children
  // (mirroring actual compound usage) fix that for every own prop tested on
  // these Root components, not just open/defaultOpen.
  AlertDialog: {
    open: true,
    onOpenChange: noop,
    children: (
      <AlertDialogContent>
        <AlertDialogTitle>Fixture</AlertDialogTitle>
      </AlertDialogContent>
    ),
  },
  Dialog: {
    open: true,
    onOpenChange: noop,
    children: (
      <DialogContent>
        <DialogTitle>Fixture</DialogTitle>
      </DialogContent>
    ),
  },
  Popover: {
    open: true,
    onOpenChange: noop,
    children: (
      <PopoverContent>
        <PopoverTitle>Fixture</PopoverTitle>
      </PopoverContent>
    ),
  },
  Sheet: {
    open: true,
    onOpenChange: noop,
    children: (
      <SheetContent>
        <SheetTitle>Fixture</SheetTitle>
      </SheetContent>
    ),
  },
  DropdownMenu: {
    open: true,
    onOpenChange: noop,
    children: (
      <DropdownMenuContent>
        <DropdownMenuItem>Fixture</DropdownMenuItem>
      </DropdownMenuContent>
    ),
  },
  Tooltip: {
    open: true,
    onOpenChange: noop,
    children: <TooltipContent>Fixture</TooltipContent>,
  },
  Select: {
    children: (
      <SelectContent>
        <SelectItem value="fx-select">Fixture</SelectItem>
      </SelectContent>
    ),
  },
  Collapsible: { open: true },
  DropdownMenuCheckboxItem: { checked: false },
  // Default registry is Bee + Violet (packages/tokens); "default"/"bee" are
  // not registered brand names — verified empirically (`Invalid theme
  // registry: unknown brand "default"` thrown from theme-scope.tsx).
  BeeThemeScope: { appearance: 'light', brand: 'violet' },
};

/**
 * Ancestor wiring a component needs to render/behave the way real usage
 * would (compound-family Root/Provider/Item context), applied around the
 * element under test — which already carries FIXTURE_REQUIRED plus the
 * prop under test. Only entries with a real context/positional requirement
 * (verified against the compiled dist/module/components/*.js source) are
 * listed; every other component renders standalone.
 */
export const FIXTURE_WRAP: Record<string, (el: React.ReactElement) => React.ReactElement> = {
  AccordionItem: (el) => <Accordion value="fx-item">{el}</Accordion>,
  AccordionTrigger: (el) => (
    <Accordion value="fx-item">
      <AccordionItem value="fx-item">{el}</AccordionItem>
    </Accordion>
  ),
  AccordionContent: (el) => (
    <Accordion value="fx-item">
      <AccordionItem value="fx-item">{el}</AccordionItem>
    </Accordion>
  ),

  AlertDialogTrigger: (el) => (
    <AlertDialog open onOpenChange={noop}>
      {el}
    </AlertDialog>
  ),
  AlertDialogContent: (el) => (
    <AlertDialog open onOpenChange={noop}>
      {el}
    </AlertDialog>
  ),
  AlertDialogTitle: (el) => (
    <AlertDialog open onOpenChange={noop}>
      {el}
    </AlertDialog>
  ),
  AlertDialogDescription: (el) => (
    <AlertDialog open onOpenChange={noop}>
      {el}
    </AlertDialog>
  ),
  AlertDialogFooter: (el) => (
    <AlertDialog open onOpenChange={noop}>
      {el}
    </AlertDialog>
  ),
  AlertDialogAction: (el) => (
    <AlertDialog open onOpenChange={noop}>
      {el}
    </AlertDialog>
  ),
  AlertDialogCancel: (el) => (
    <AlertDialog open onOpenChange={noop}>
      {el}
    </AlertDialog>
  ),

  DialogTrigger: (el) => (
    <Dialog open onOpenChange={noop}>
      {el}
    </Dialog>
  ),
  DialogContent: (el) => (
    <Dialog open onOpenChange={noop}>
      {el}
    </Dialog>
  ),
  DialogTitle: (el) => (
    <Dialog open onOpenChange={noop}>
      {el}
    </Dialog>
  ),
  DialogDescription: (el) => (
    <Dialog open onOpenChange={noop}>
      {el}
    </Dialog>
  ),
  DialogFooter: (el) => (
    <Dialog open onOpenChange={noop}>
      {el}
    </Dialog>
  ),
  DialogClose: (el) => (
    <Dialog open onOpenChange={noop}>
      {el}
    </Dialog>
  ),

  PopoverTrigger: (el) => (
    <Popover open onOpenChange={noop}>
      {el}
    </Popover>
  ),
  PopoverContent: (el) => (
    <Popover open onOpenChange={noop}>
      {el}
    </Popover>
  ),
  PopoverTitle: (el) => (
    <Popover open onOpenChange={noop}>
      {el}
    </Popover>
  ),
  PopoverDescription: (el) => (
    <Popover open onOpenChange={noop}>
      {el}
    </Popover>
  ),
  PopoverClose: (el) => (
    <Popover open onOpenChange={noop}>
      {el}
    </Popover>
  ),

  SheetTrigger: (el) => (
    <Sheet open onOpenChange={noop}>
      {el}
    </Sheet>
  ),
  SheetContent: (el) => (
    <Sheet open onOpenChange={noop}>
      {el}
    </Sheet>
  ),
  SheetTitle: (el) => (
    <Sheet open onOpenChange={noop}>
      {el}
    </Sheet>
  ),
  SheetDescription: (el) => (
    <Sheet open onOpenChange={noop}>
      {el}
    </Sheet>
  ),
  SheetFooter: (el) => (
    <Sheet open onOpenChange={noop}>
      {el}
    </Sheet>
  ),
  SheetClose: (el) => (
    <Sheet open onOpenChange={noop}>
      {el}
    </Sheet>
  ),
  SheetHandle: (el) => (
    <Sheet open onOpenChange={noop}>
      {el}
    </Sheet>
  ),

  DropdownMenuTrigger: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      {el}
    </DropdownMenu>
  ),
  DropdownMenuContent: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      {el}
    </DropdownMenu>
  ),
  // "DropdownMenu items must be used inside DropdownMenuContent" — verified
  // empirically (dropdown-menu.tsx's own context-check error).
  DropdownMenuItem: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      <DropdownMenuContent>{el}</DropdownMenuContent>
    </DropdownMenu>
  ),
  DropdownMenuLabel: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      <DropdownMenuContent>{el}</DropdownMenuContent>
    </DropdownMenu>
  ),
  DropdownMenuSeparator: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      <DropdownMenuContent>{el}</DropdownMenuContent>
    </DropdownMenu>
  ),
  DropdownMenuRadioGroup: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      <DropdownMenuContent>{el}</DropdownMenuContent>
    </DropdownMenu>
  ),
  DropdownMenuRadioItem: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup>{el}</DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  DropdownMenuCheckboxItem: (el) => (
    <DropdownMenu open onOpenChange={noop}>
      <DropdownMenuContent>{el}</DropdownMenuContent>
    </DropdownMenu>
  ),

  TooltipTrigger: (el) => (
    <Tooltip open onOpenChange={noop}>
      {el}
    </Tooltip>
  ),
  TooltipContent: (el) => (
    <Tooltip open onOpenChange={noop}>
      {el}
    </Tooltip>
  ),

  SelectTrigger: (el) => <Select>{el}</Select>,
  SelectValue: (el) => <Select>{el}</Select>,
  SelectContent: (el) => <Select>{el}</Select>,
  SelectGroup: (el) => (
    <Select>
      <SelectContent>{el}</SelectContent>
    </Select>
  ),
  SelectLabel: (el) => (
    <Select>
      <SelectContent>
        <SelectGroup>{el}</SelectGroup>
      </SelectContent>
    </Select>
  ),
  SelectItem: (el) => (
    <Select>
      <SelectContent>{el}</SelectContent>
    </Select>
  ),

  TabsList: (el) => <Tabs value="fx-tab">{el}</Tabs>,
  TabsTrigger: (el) => <Tabs value="fx-tab">{el}</Tabs>,
  TabsContent: (el) => <Tabs value="fx-tab">{el}</Tabs>,

  CollapsibleTrigger: (el) => <Collapsible open>{el}</Collapsible>,
  CollapsibleContent: (el) => <Collapsible open>{el}</Collapsible>,

  SegmentedControlItem: (el) => <SegmentedControl value="fx-seg">{el}</SegmentedControl>,

  Radio: (el) => <RadioGroup>{el}</RadioGroup>,

  Chip: (el) => <ChipGroup>{el}</ChipGroup>,

  TableRow: (el) => (
    <Table>
      <TableBody>{el}</TableBody>
    </Table>
  ),
  TableCell: (el) => (
    <Table>
      <TableBody>
        <TableRow>{el}</TableRow>
      </TableBody>
    </Table>
  ),
  TableHead: (el) => (
    <Table>
      <TableHeader>
        <TableRow>{el}</TableRow>
      </TableHeader>
    </Table>
  ),
  TableHeader: (el) => <Table>{el}</Table>,
  TableBody: (el) => <Table>{el}</Table>,
  TableFooter: (el) => <Table>{el}</Table>,
  TableCaption: (el) => <Table>{el}</Table>,

  StepperItem: (el) => <Stepper currentStep={1}>{el}</Stepper>,

  PaginationItem: (el) => (
    <Pagination page={1} pageCount={3} onPageChange={noop}>
      {el}
    </Pagination>
  ),
};

/**
 * Component-level skip: the generic driver cannot exercise this component at
 * all under plain Jest (react-test-renderer) for a reason unrelated to any
 * individual prop's documented behavior. Recorded verbatim in
 * docs/beeui-audit/prop-behavior.json as `skipped(reason)` for every prop of
 * that component.
 */
export const FIXTURE_SKIP: Record<string, string> = {};

/**
 * Curated, individually-verified reality-vs-docs mismatches. Each entry
 * makes the driver register that (component, prop[, value]) case with
 * `test.failing` instead of `test`, so the suite stays green while the
 * mismatch is still machine-readable in prop-behavior.json as `fails`.
 * `value` omitted applies to every value of that prop (e.g. every literal in
 * a union, or the single check for a non-enumerable kind).
 */
export type KnownFail = {
  component: string;
  prop: string;
  value?: string | boolean;
  docsUrl: string;
  docsSentence: string;
  observed: string;
};

export const KNOWN_FAILS: KnownFail[] = [];

export function findKnownFail(component: string, prop: string, value?: unknown): KnownFail | undefined {
  return KNOWN_FAILS.find(
    (f) => f.component === component && f.prop === prop && (f.value === undefined || String(f.value) === String(value))
  );
}

export const SENTINEL_NODE_TESTID = (propName: string) => `sentinel-node-${propName}`;
export function SentinelNode({ propName }: { propName: string }) {
  return (
    <RNView testID={SENTINEL_NODE_TESTID(propName)}>
      <RNText>sentinel</RNText>
    </RNView>
  );
}

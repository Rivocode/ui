export const version = "0.4.0";

export { cn } from "./lib/cn";
export { useMediaQuery, useMobile } from "./lib/screen";
export {
  RivoProvider,
  useRivoContext,
  type RivoDensity,
  type RivoProviderProps,
  type RivoResolvedTheme,
  type RivoTheme,
  type RivoThemeSetting,
} from "./provider/rivo-provider";

export { Button, buttonVariants, type ButtonProps } from "./components/button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  type CardProps,
} from "./components/card";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  inputVariants,
  Textarea,
  type FieldProps,
  type InputProps,
  type TextareaProps,
} from "./components/field";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
} from "./components/dialog";
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableRowProps,
} from "./components/table";
export { Checkbox, type CheckboxProps } from "./components/checkbox";
export {
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type TabListProps,
  type TabVariant,
} from "./components/tabs";
export {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  menuItemVariants,
  type MenuGroupProps,
  type MenuItemProps,
} from "./components/menu";
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/select";
export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  type PopoverContentProps,
} from "./components/popover";
export { Calendar, type CalendarProps } from "./components/calendar";
export { CalendarPanel, type CalendarPanelProps } from "./components/calendar-panel";
export { DatePicker, type DatePickerProps } from "./components/date-picker";
export {
  DateRangePicker,
  type DateRange,
  type DateRangePickerProps,
} from "./components/date-range-picker";
export { formatDate, parseDate, maskDate } from "./lib/date";
/*
 * Os formatadores nasceram no subcaminho do grafico, e ali era o lugar errado:
 * formatar dinheiro numa celula de tabela nao e assunto de grafico. Saem
 * tambem pela raiz, e sao o mesmo vocabulario que `format` aceita no Meter, no
 * Progress, no Slider e no eixo.
 */
export {
  compact,
  compactWords,
  currency,
  currencyShort,
  currencyShortWords,
  dayMonth,
  formatters,
  integer,
  monthShort,
  percent,
  type Format,
  type FormatName,
} from "./lib/format";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
  type SheetProps,
  type SheetSide,
} from "./components/sheet";
export { Switch, type SwitchProps } from "./components/switch";
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from "./components/radio";
export { Separator, type SeparatorProps } from "./components/separator";
export { Avatar, avatarVariants, type AvatarProps } from "./components/avatar";
export { Progress, type ProgressProps } from "./components/progress";
export { Spinner, spinnerVariants, type SpinnerProps } from "./components/spinner";
export { Accordion, AccordionItem, type AccordionItemProps } from "./components/accordion";
export {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogContentProps,
} from "./components/alert-dialog";
export { Toggle, ToggleGroup, type ToggleGroupProps, type ToggleProps } from "./components/toggle";
export { MaskedInput, type MaskedInputProps } from "./components/masked-input";
export {
  applyMask,
  applyCurrencyMask,
  applyPattern,
  toCents,
  phoneMask,
  unmask,
  MASKS,
  type Mask,
  type MaskName,
} from "./lib/mask";
export {
  InputAction,
  InputGroup,
  InputPrefix,
  InputSuffix,
  type InputGroupProps,
} from "./components/input-group";
export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  itemVariants,
  type ItemProps,
} from "./components/item";
export { Breadcrumb, type BreadcrumbProps, type Crumb } from "./components/breadcrumb";
export { Pagination, type PaginationProps } from "./components/pagination";
export {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type TooltipContentProps,
} from "./components/tooltip";
export {
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarMenuRow,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  type SidebarBrandProps,
  type SidebarGroupProps,
  type SidebarInputProps,
  type SidebarMenuItemProps,
  type SidebarMenuSubProps,
  type SidebarProps,
  type SidebarProviderProps,
  type SidebarState,
} from "./components/sidebar";
export {
  ToastViewport,
  useToast,
  type ToastPosition,
  type ToastViewportProps,
} from "./components/toast";
export {
  Alert,
  AlertDescription,
  AlertTitle,
  alertVariants,
  type AlertProps,
} from "./components/alert";
export { Skeleton } from "./components/skeleton";
export { Kbd, kbdVariants, keyName, type KbdProps } from "./components/kbd";
export { ButtonGroup, type ButtonGroupProps } from "./components/button-group";
export { AspectRatio, type AspectRatioProps } from "./components/aspect-ratio";
export {
  Command,
  type CommandGroup,
  type CommandItem,
  type CommandProps,
} from "./components/command";
export { EmptyState, type EmptyStateProps } from "./components/empty-state";
export { Stat, type StatProps } from "./components/stat";
export {
  DescriptionItem,
  DescriptionList,
  type DescriptionItemProps,
  type DescriptionListProps,
} from "./components/description-list";
export { SearchInput, type SearchInputProps } from "./components/search-input";
export {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  type FileUploadItemProps,
  type FileUploadListProps,
  type FileUploadProps,
  type Rejection,
} from "./components/file-upload";
export { PageHeader, type PageHeaderProps } from "./components/page-header";
export { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./components/collapsible";
export { ScrollArea, type ScrollAreaProps } from "./components/scroll-area";
export { Slider, type SliderProps } from "./components/slider";
export { Meter, type MeterProps } from "./components/meter";
export { NumberField, type NumberFieldProps } from "./components/number-field";
export { OTPField, type OTPFieldProps } from "./components/otp-field";
export { ContextMenu, ContextMenuTrigger } from "./components/context-menu";
export { Menubar, MenubarTrigger, type MenubarProps } from "./components/menubar";
export { Clipboard, type ClipboardProps } from "./components/clipboard";
export { Indicator, type IndicatorProps } from "./components/indicator";
export { PasswordInput, type PasswordInputProps } from "./components/password-input";
export { Tracker, type TrackerProps, type TrackerPoint } from "./components/tracker";
export { TagsInput, type TagsInputProps } from "./components/tags-input";
export { Splitter, type SplitterProps } from "./components/splitter";
export { Editable, type EditableProps } from "./components/editable";
export { AvatarGroup, type AvatarGroupProps } from "./components/avatar-group";
export {
  Timeline,
  TimelineItem,
  type TimelineProps,
  type TimelineItemProps,
} from "./components/timeline";
export { Code, CodeBlock, type CodeProps, type CodeBlockProps } from "./components/code";
export {
  RelativeTime,
  type RelativeTimeProps,
  type RelativeUnit,
} from "./components/relative-time";
export {
  ToolbarButton,
  ToolbarGroup,
  ToolbarRoot as Toolbar,
  ToolbarSeparator,
  type ToolbarProps,
} from "./components/toolbar";
export { PreviewCard, PreviewCardContent, PreviewCardTrigger } from "./components/preview-card";
export { CheckboxGroup, type CheckboxGroupProps } from "./components/checkbox-group";
export { FieldsetLegend, FieldsetRoot as Fieldset } from "./components/fieldset";
export {
  Autocomplete,
  AutocompleteInput,
  type AutocompleteInputProps,
} from "./components/autocomplete";
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "./components/navigation-menu";
export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  type ComboboxContentProps,
  type ComboboxInputProps,
} from "./components/combobox";
export { Tree, leavesOf, type TreeNode, type TreeProps } from "./components/tree";
export { TreeSelect, type TreeSelectProps } from "./components/tree-select";
export { DataTable, type Column, type DataTableProps } from "./components/data-table";
export {
  Steps,
  useWizard,
  WizardFooter,
  type WizardState,
  type Step,
  type StepsProps,
} from "./components/steps";

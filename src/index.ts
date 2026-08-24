export const version = "0.1.0";

export { cn } from "./lib/cn";
export { useMediaQuery, useTelaEstreita } from "./lib/tela";
export {
  RivoProvider,
  useRivoContext,
  type RivoDensity,
  type RivoProviderProps,
  type RivoTheme,
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
export { Tab, TabList, TabPanel, Tabs, type TabListProps } from "./components/tabs";
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
export { DatePicker, type DatePickerProps } from "./components/date-picker";
export {
  DateRangePicker,
  type DateRange,
  type DateRangePickerProps,
} from "./components/date-range-picker";
export { formatarData, lerData, mascararData } from "./lib/data";
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
  aplicarMascara,
  aplicarMoeda,
  aplicarMolde,
  emCentavos,
  moldeDeTelefone,
  semMascara,
  MOLDES,
  type Mascara,
  type NomeDeMolde,
} from "./lib/mascara";
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
export { Breadcrumb, type BreadcrumbProps, type Migalha } from "./components/breadcrumb";
export { Pagination, type PaginationProps } from "./components/pagination";
export { Tooltip, TooltipContent, TooltipTrigger } from "./components/tooltip";
export { ToastViewport, useToast, type ToastViewportProps } from "./components/toast";
export {
  Alert,
  AlertDescription,
  AlertTitle,
  alertVariants,
  type AlertProps,
} from "./components/alert";
export { Skeleton } from "./components/skeleton";
export { EmptyState, type EmptyStateProps } from "./components/empty-state";

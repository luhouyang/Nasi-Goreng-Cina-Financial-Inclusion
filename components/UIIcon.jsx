import {
  Lightbulb,
  Search,
  Compass,
  Swords,
  LayoutGrid,
  ShieldCheck,
  FileText,
  Mail,
  ListChecks,
  Link2,
  ChartNoAxesCombined,
  Globe2,
  Bot,
  Zap,
  Copy,
  Trash2,
  Pencil,
  Plus,
  Download,
  Printer,
  Play,
  ArrowLeft,
  LoaderCircle,
  Clock,
  UserRound,
  Scale,
  Target,
} from "lucide-react";

const icons = {
  idea: Lightbulb,
  research: Search,
  swot: Compass,
  porter: Swords,
  bmc: LayoutGrid,
  verify: ShieldCheck,
  document: FileText,
  email: Mail,
  steps: ListChecks,
  reference: Link2,
  finance: ChartNoAxesCombined,
  market: Globe2,
  agent: Bot,
  streaming: Zap,
  copy: Copy,
  delete: Trash2,
  edit: Pencil,
  add: Plus,
  download: Download,
  print: Printer,
  run: Play,
  back: ArrowLeft,
  loading: LoaderCircle,
  clock: Clock,
  user: UserRound,
  legal: Scale,
  target: Target,
};

export default function UIIcon({ name, size = 15, className = "", ...props }) {
  const Component = icons[name] || FileText;

  return (
    <Component
      size={size}
      strokeWidth={1.8}
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

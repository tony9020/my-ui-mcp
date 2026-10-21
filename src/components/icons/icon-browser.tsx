"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity, AlarmClock, Archive, ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp,
  ArrowUpRight, Atom, Award, Banknote, BarChart3, Beaker, Bed, Beer, Bell, BellRing, Bike,
  Binary, Bird, Blocks, Book, BookOpen, Bookmark, BookmarkCheck, Box, Boxes, Brain, Braces,
  Briefcase, Brush, Bug, Building, Calculator, Calendar, CalendarDays, Camera, Car, Cat, Check,
  CheckCheck, ChefHat, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleAlert, CircleCheck,
  CircleDollarSign, CircleHelp, CircleX, Clapperboard, Clock, Cloud, CloudRain, CloudUpload, Code2,
  Coffee, Coins, Command, Compass, Component, Cookie, Cpu, CreditCard, Crop, Crosshair, Crown,
  Database, Diamond, Disc, Dna, Dog, DollarSign, Download, Droplet, Droplets, Eraser, Expand, Eye,
  EyeOff, Factory, File, FileCode2, FileText, Files, Film, Filter, Fingerprint, Fish, Flag, Flame,
  FlaskConical, Flower, Flower2, Folder, FolderOpen, Gem, Gift, Glasses, Globe, GraduationCap,
  GripVertical, HardDrive, Hash, Headphones, Heart, HeartPulse, Home, Hourglass, Image, Images,
  Inbox, Info, Keyboard, KeyRound, Lamp, Landmark, Laptop, Layers, LayoutDashboard, LayoutGrid,
  LayoutList, LayoutTemplate, Leaf, Library, Lightbulb, Link as LinkIcon, Link2 as Link2Icon, List,
  ListChecks, ListOrdered, Loader, LoaderCircle, Lock, Mail, Map, MapPin, Maximize2, Medal, Menu,
  MessageCircle, MessageSquare, MessagesSquare, Mic, MicVocal, Microscope, Minimize2, Minus, Monitor,
  Moon, MoreHorizontal, MoreVertical, Move, Music, Navigation, Newspaper, Orbit, Package, PackageOpen,
  Paintbrush, Palette, Pause, Pen, PenTool, Pencil, Percent, Phone, PieChart, Pill, Plane, Play, Plug,
  Plus, Podcast, Power, Printer, Puzzle, QrCode, Radar, Radio, Receipt, RefreshCw, Repeat, Rocket, RotateCw,
  Router, Rss, Ruler, Save, ScanLine, Scissors, Search, Send, SendHorizontal, Server, Settings,
  Settings2, Share, Share2, ShieldAlert, ShieldCheck, ShoppingBag, ShoppingCart, Shuffle, Sliders,
  SlidersHorizontal, Smartphone, Snowflake, Sofa, Sparkle, Sparkles, Sprout, Star, Stethoscope,
  Store, Sun, Syringe, Table, Tablet, Tag, Tags, Target, Telescope, Terminal, Timer, ToggleLeft,
  ToggleRight, Trash, Trash2, TreePine, TrendingDown, TrendingUp, TriangleAlert, Trophy, Truck, Tv,
  Undo, Unlock, Upload, User, UserPlus, Users, Wallet, WandSparkles, Warehouse, Watch, Wifi, Wind, X,
  Zap, type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

type IconGroup =
  | "Interface"
  | "Files & code"
  | "Media"
  | "Commerce"
  | "Nature & travel"
  | "Shapes"
  | "Devices";

interface IconEntry {
  name: string;
  Icon: LucideIcon;
  group: IconGroup;
}

function entry(name: string, Icon: LucideIcon, group: IconGroup): IconEntry {
  return { name, Icon, group };
}

const ICONS: IconEntry[] = [
  // ---------------------------------------------------------------- interface
  entry("Search", Search, "Interface"),
  entry("Settings", Settings, "Interface"),
  entry("Settings2", Settings2, "Interface"),
  entry("Bell", Bell, "Interface"),
  entry("BellRing", BellRing, "Interface"),
  entry("User", User, "Interface"),
  entry("Users", Users, "Interface"),
  entry("UserPlus", UserPlus, "Interface"),
  entry("Mail", Mail, "Interface"),
  entry("Phone", Phone, "Interface"),
  entry("Calendar", Calendar, "Interface"),
  entry("CalendarDays", CalendarDays, "Interface"),
  entry("Clock", Clock, "Interface"),
  entry("AlarmClock", AlarmClock, "Interface"),
  entry("Timer", Timer, "Interface"),
  entry("Hourglass", Hourglass, "Interface"),
  entry("MapPin", MapPin, "Interface"),
  entry("Globe", Globe, "Interface"),
  entry("Link", LinkIcon, "Interface"),
  entry("Link2", Link2Icon, "Interface"),
  entry("Home", Home, "Interface"),
  entry("Building", Building, "Interface"),
  entry("Briefcase", Briefcase, "Interface"),
  entry("Eye", Eye, "Interface"),
  entry("EyeOff", EyeOff, "Interface"),
  entry("Lock", Lock, "Interface"),
  entry("Unlock", Unlock, "Interface"),
  entry("KeyRound", KeyRound, "Interface"),
  entry("Fingerprint", Fingerprint, "Interface"),
  entry("ScanLine", ScanLine, "Interface"),
  entry("QrCode", QrCode, "Interface"),
  entry("ShieldCheck", ShieldCheck, "Interface"),
  entry("ShieldAlert", ShieldAlert, "Interface"),
  entry("SlidersHorizontal", SlidersHorizontal, "Interface"),
  entry("Sliders", Sliders, "Interface"),
  entry("Filter", Filter, "Interface"),
  entry("Menu", Menu, "Interface"),
  entry("MoreHorizontal", MoreHorizontal, "Interface"),
  entry("MoreVertical", MoreVertical, "Interface"),
  entry("GripVertical", GripVertical, "Interface"),
  entry("Move", Move, "Interface"),
  entry("ToggleLeft", ToggleLeft, "Interface"),
  entry("ToggleRight", ToggleRight, "Interface"),
  entry("Plus", Plus, "Interface"),
  entry("Minus", Minus, "Interface"),
  entry("Check", Check, "Interface"),
  entry("CheckCheck", CheckCheck, "Interface"),
  entry("X", X, "Interface"),
  entry("CircleCheck", CircleCheck, "Interface"),
  entry("CircleAlert", CircleAlert, "Interface"),
  entry("CircleX", CircleX, "Interface"),
  entry("CircleHelp", CircleHelp, "Interface"),
  entry("Info", Info, "Interface"),
  entry("TriangleAlert", TriangleAlert, "Interface"),
  entry("Loader", Loader, "Interface"),
  entry("LoaderCircle", LoaderCircle, "Interface"),
  entry("Expand", Expand, "Interface"),
  entry("Maximize2", Maximize2, "Interface"),
  entry("Minimize2", Minimize2, "Interface"),
  entry("ChevronRight", ChevronRight, "Interface"),
  entry("ChevronLeft", ChevronLeft, "Interface"),
  entry("ChevronUp", ChevronUp, "Interface"),
  entry("ChevronDown", ChevronDown, "Interface"),
  entry("ArrowRight", ArrowRight, "Interface"),
  entry("ArrowLeft", ArrowLeft, "Interface"),
  entry("ArrowUp", ArrowUp, "Interface"),
  entry("ArrowDown", ArrowDown, "Interface"),
  entry("ArrowUpRight", ArrowUpRight, "Interface"),
  entry("ArrowDownRight", ArrowDownRight, "Interface"),
  entry("RotateCw", RotateCw, "Interface"),
  entry("RefreshCw", RefreshCw, "Interface"),
  entry("Undo", Undo, "Interface"),
  entry("Save", Save, "Interface"),
  entry("Share", Share, "Interface"),
  entry("Share2", Share2, "Interface"),
  entry("Download", Download, "Interface"),
  entry("Upload", Upload, "Interface"),
  entry("Trash", Trash, "Interface"),
  entry("Trash2", Trash2, "Interface"),
  entry("Archive", Archive, "Interface"),
  entry("MessageCircle", MessageCircle, "Interface"),
  entry("MessageSquare", MessageSquare, "Interface"),
  entry("MessagesSquare", MessagesSquare, "Interface"),
  entry("Send", Send, "Interface"),
  entry("SendHorizontal", SendHorizontal, "Interface"),
  entry("Inbox", Inbox, "Interface"),

  // ------------------------------------------------------------ files & code
  entry("Folder", Folder, "Files & code"),
  entry("FolderOpen", FolderOpen, "Files & code"),
  entry("File", File, "Files & code"),
  entry("FileText", FileText, "Files & code"),
  entry("Files", Files, "Files & code"),
  entry("FileCode2", FileCode2, "Files & code"),
  entry("Terminal", Terminal, "Files & code"),
  entry("Command", Command, "Files & code"),
  entry("Code2", Code2, "Files & code"),
  entry("Database", Database, "Files & code"),
  entry("Server", Server, "Files & code"),
  entry("Cloud", Cloud, "Files & code"),
  entry("CloudUpload", CloudUpload, "Files & code"),
  entry("Binary", Binary, "Files & code"),
  entry("Hash", Hash, "Files & code"),
  entry("Braces", Braces, "Files & code"),

  // -------------------------------------------------------------------- media
  entry("Play", Play, "Media"),
  entry("Pause", Pause, "Media"),
  entry("Repeat", Repeat, "Media"),
  entry("Shuffle", Shuffle, "Media"),
  entry("Headphones", Headphones, "Media"),
  entry("Mic", Mic, "Media"),
  entry("MicVocal", MicVocal, "Media"),
  entry("Music", Music, "Media"),
  entry("Disc", Disc, "Media"),
  entry("Radio", Radio, "Media"),
  entry("Tv", Tv, "Media"),
  entry("Film", Film, "Media"),
  entry("Clapperboard", Clapperboard, "Media"),
  entry("Camera", Camera, "Media"),
  entry("Image", Image, "Media"),
  entry("Images", Images, "Media"),
  entry("Rss", Rss, "Media"),
  entry("Podcast", Podcast, "Media"),
  entry("Newspaper", Newspaper, "Media"),
  entry("Book", Book, "Media"),
  entry("BookOpen", BookOpen, "Media"),
  entry("Library", Library, "Media"),

  // ----------------------------------------------------------------- commerce
  entry("ShoppingCart", ShoppingCart, "Commerce"),
  entry("ShoppingBag", ShoppingBag, "Commerce"),
  entry("CreditCard", CreditCard, "Commerce"),
  entry("Wallet", Wallet, "Commerce"),
  entry("DollarSign", DollarSign, "Commerce"),
  entry("CircleDollarSign", CircleDollarSign, "Commerce"),
  entry("Coins", Coins, "Commerce"),
  entry("Banknote", Banknote, "Commerce"),
  entry("Receipt", Receipt, "Commerce"),
  entry("Percent", Percent, "Commerce"),
  entry("Calculator", Calculator, "Commerce"),
  entry("TrendingUp", TrendingUp, "Commerce"),
  entry("TrendingDown", TrendingDown, "Commerce"),
  entry("BarChart3", BarChart3, "Commerce"),
  entry("PieChart", PieChart, "Commerce"),
  entry("Activity", Activity, "Commerce"),
  entry("Store", Store, "Commerce"),
  entry("Package", Package, "Commerce"),
  entry("PackageOpen", PackageOpen, "Commerce"),
  entry("Boxes", Boxes, "Commerce"),
  entry("Box", Box, "Commerce"),
  entry("Gift", Gift, "Commerce"),
  entry("Tag", Tag, "Commerce"),
  entry("Tags", Tags, "Commerce"),
  entry("Star", Star, "Commerce"),
  entry("Heart", Heart, "Commerce"),
  entry("Bookmark", Bookmark, "Commerce"),
  entry("BookmarkCheck", BookmarkCheck, "Commerce"),
  entry("Flag", Flag, "Commerce"),
  entry("Award", Award, "Commerce"),
  entry("Trophy", Trophy, "Commerce"),
  entry("Medal", Medal, "Commerce"),
  entry("Crown", Crown, "Commerce"),
  entry("Gem", Gem, "Commerce"),
  entry("Diamond", Diamond, "Commerce"),

  // ----------------------------------------------------------- nature/travel
  entry("Sun", Sun, "Nature & travel"),
  entry("Moon", Moon, "Nature & travel"),
  entry("CloudRain", CloudRain, "Nature & travel"),
  entry("Snowflake", Snowflake, "Nature & travel"),
  entry("Wind", Wind, "Nature & travel"),
  entry("Droplet", Droplet, "Nature & travel"),
  entry("Droplets", Droplets, "Nature & travel"),
  entry("Flame", Flame, "Nature & travel"),
  entry("Zap", Zap, "Nature & travel"),
  entry("Leaf", Leaf, "Nature & travel"),
  entry("TreePine", TreePine, "Nature & travel"),
  entry("Flower", Flower, "Nature & travel"),
  entry("Flower2", Flower2, "Nature & travel"),
  entry("Sprout", Sprout, "Nature & travel"),
  entry("Bug", Bug, "Nature & travel"),
  entry("Cat", Cat, "Nature & travel"),
  entry("Dog", Dog, "Nature & travel"),
  entry("Bird", Bird, "Nature & travel"),
  entry("Fish", Fish, "Nature & travel"),
  entry("Rocket", Rocket, "Nature & travel"),
  entry("Plane", Plane, "Nature & travel"),
  entry("Car", Car, "Nature & travel"),
  entry("Truck", Truck, "Nature & travel"),
  entry("Bike", Bike, "Nature & travel"),
  entry("Compass", Compass, "Nature & travel"),
  entry("Map", Map, "Nature & travel"),
  entry("Navigation", Navigation, "Nature & travel"),
  entry("Crosshair", Crosshair, "Nature & travel"),
  entry("Target", Target, "Nature & travel"),
  entry("Telescope", Telescope, "Nature & travel"),
  entry("Landmark", Landmark, "Nature & travel"),

  // ------------------------------------------------------------------- shapes
  entry("Layers", Layers, "Shapes"),
  entry("Blocks", Blocks, "Shapes"),
  entry("Component", Component, "Shapes"),
  entry("Puzzle", Puzzle, "Shapes"),
  entry("LayoutGrid", LayoutGrid, "Shapes"),
  entry("LayoutDashboard", LayoutDashboard, "Shapes"),
  entry("LayoutList", LayoutList, "Shapes"),
  entry("LayoutTemplate", LayoutTemplate, "Shapes"),
  entry("Table", Table, "Shapes"),
  entry("List", List, "Shapes"),
  entry("ListChecks", ListChecks, "Shapes"),
  entry("ListOrdered", ListOrdered, "Shapes"),
  entry("Crop", Crop, "Shapes"),
  entry("Ruler", Ruler, "Shapes"),
  entry("Scissors", Scissors, "Shapes"),
  entry("Palette", Palette, "Shapes"),
  entry("Brush", Brush, "Shapes"),
  entry("Paintbrush", Paintbrush, "Shapes"),
  entry("PenTool", PenTool, "Shapes"),
  entry("Pencil", Pencil, "Shapes"),
  entry("Pen", Pen, "Shapes"),
  entry("Eraser", Eraser, "Shapes"),
  entry("Sparkles", Sparkles, "Shapes"),
  entry("Sparkle", Sparkle, "Shapes"),
  entry("WandSparkles", WandSparkles, "Shapes"),
  entry("Atom", Atom, "Shapes"),
  entry("Orbit", Orbit, "Shapes"),
  entry("Radar", Radar, "Shapes"),
  entry("Beaker", Beaker, "Shapes"),
  entry("FlaskConical", FlaskConical, "Shapes"),
  entry("Microscope", Microscope, "Shapes"),
  entry("Dna", Dna, "Shapes"),
  entry("Stethoscope", Stethoscope, "Shapes"),
  entry("HeartPulse", HeartPulse, "Shapes"),
  entry("Pill", Pill, "Shapes"),
  entry("Syringe", Syringe, "Shapes"),
  entry("Brain", Brain, "Shapes"),

  // ------------------------------------------------------------------ devices
  entry("Monitor", Monitor, "Devices"),
  entry("Laptop", Laptop, "Devices"),
  entry("Tablet", Tablet, "Devices"),
  entry("Smartphone", Smartphone, "Devices"),
  entry("Keyboard", Keyboard, "Devices"),
  entry("Printer", Printer, "Devices"),
  entry("Router", Router, "Devices"),
  entry("Cpu", Cpu, "Devices"),
  entry("HardDrive", HardDrive, "Devices"),
  entry("Lightbulb", Lightbulb, "Devices"),
  entry("Lamp", Lamp, "Devices"),
  entry("Plug", Plug, "Devices"),
  entry("Power", Power, "Devices"),
  entry("Wifi", Wifi, "Devices"),
  entry("Glasses", Glasses, "Devices"),
  entry("Watch", Watch, "Devices"),

  // --------------------------------------------------------------------- life
  entry("Coffee", Coffee, "Nature & travel"),
  entry("Cookie", Cookie, "Nature & travel"),
  entry("Beer", Beer, "Nature & travel"),
  entry("ChefHat", ChefHat, "Nature & travel"),
  entry("GraduationCap", GraduationCap, "Nature & travel"),
  entry("Warehouse", Warehouse, "Nature & travel"),
  entry("Factory", Factory, "Nature & travel"),
  entry("Bed", Bed, "Nature & travel"),
  entry("Sofa", Sofa, "Nature & travel"),
];

const GROUPS: IconGroup[] = [
  "Interface",
  "Files & code",
  "Media",
  "Commerce",
  "Nature & travel",
  "Shapes",
  "Devices",
];

const SIZES = [
  { value: "sm", label: "16", px: 16 },
  { value: "md", label: "20", px: 20 },
  { value: "lg", label: "24", px: 24 },
] as const;

export function IconBrowser() {
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<IconGroup | "All">("All");
  const [size, setSize] = React.useState<(typeof SIZES)[number]["value"]>("md");
  const { copied, copy } = useCopy();

  const activePx = SIZES.find((s) => s.value === size)?.px ?? 20;

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ICONS.filter(
      (i) => (group === "All" || i.group === group) && (!q || i.name.toLowerCase().includes(q)),
    );
  }, [query, group]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative inline-flex w-full items-center sm:w-80">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            aria-label="Search icons"
            className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </label>

        <div className="flex items-center gap-3">
          <span className="text-[13px] tabular-nums text-muted-foreground">{visible.length} icons</span>
          <div className="inline-flex items-center gap-0.5 rounded-full border border-border p-0.5">
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={size === s.value}
                aria-label={`${s.label}px icons`}
                onClick={() => setSize(s.value)}
                className={cn(
                  "h-7 rounded-full px-2.5 text-[12px] font-medium tabular-nums transition-colors",
                  size === s.value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {(["All", ...GROUPS] as const).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
              group === g
                ? "border-brand/50 bg-brand-muted text-brand dark:bg-brand/15 dark:text-[#8f9dff]"
                : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
        {visible.map(({ name, Icon }) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => copy(`<${name} className="size-5" />`, `${name} copied`)}
              title={`Copy <${name} />`}
              className="group flex w-full flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-2 py-4 transition-colors hover:border-foreground/25 hover:bg-muted/50"
            >
              <Icon
                className="text-foreground transition-transform group-hover:scale-110"
                style={{ width: activePx, height: activePx }}
                strokeWidth={1.75}
              />
              <span className="w-full truncate text-center text-[11px] text-muted-foreground">{name}</span>
            </button>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No icons match “{query}”.</p>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">Install as a package</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Every icon ships as a tree-shakeable React component — only what you import is bundled.
          </p>
        </div>
        <Button
          variant={copied ? "secondary" : "brand"}
          onClick={() => copy("npm install lucide-react", "Install command copied")}
          className="gap-2"
        >
          {copied ? <Check className="size-4" /> : null}
          npm install lucide-react
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <Badge variant="muted">MIT licensed</Badge>
        <Badge variant="muted">Stroke 1.75</Badge>
        <Badge variant="muted">24px grid</Badge>
        <Link href="/community/components/s/icon" className="text-brand underline-offset-4 hover:underline">
          Browse icon components →
        </Link>
      </div>
    </div>
  );
}

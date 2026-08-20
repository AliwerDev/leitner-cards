"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dropdown,
  EmptyState,
  Field,
  Input,
  Kbd,
  Progress,
  Select,
  Separator,
  Skeleton,
  Spinner,
  Stat,
  Switch,
  Textarea,
  ToastProvider,
  Tooltip,
  useToast,
} from "@/components/ui";
import type { ButtonVariant, Tone } from "@/types/ui";

/** TEMPORARY. Phase 2 verification surface. Deleted in Phase 9. */

const VARIANTS: readonly ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "danger"];
const TONES: readonly Tone[] = ["neutral", "accent", "success", "danger", "warning", "info"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-sm">
      <h2 className="text-sm font-medium tracking-wide text-fg-subtle uppercase">{title}</h2>
      <div className="rounded-lg border border-border bg-surface p-md">{children}</div>
    </section>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-xs">
      {TONES.map((tone) => (
        <Button
          key={tone}
          size="sm"
          variant="outline"
          onClick={() => toast({ title: `Toast: ${tone}`, description: "Namuna xabar", tone })}
        >
          {tone}
        </Button>
      ))}
    </div>
  );
}

function Showcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-2xl px-lg py-xl">
      <header className="flex items-center justify-between gap-md">
        <div>
          <h1 className="text-2xl">UI primitivlari</h1>
          <p className="text-sm text-fg-muted">Har bir variant ikki temada tekshiriladi.</p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Button">
        <div className="flex flex-col gap-md">
          <div className="flex flex-wrap items-center gap-xs">
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-xs">
            <Button size="sm">sm</Button>
            <Button size="md">md</Button>
            <Button size="lg">lg</Button>
            <Button size="icon" aria-label="Qo'shish">
              +
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-xs">
            <Button loading>Yuklanmoqda</Button>
            <Button disabled>O&apos;chirilgan</Button>
            <Button leadingIcon={<span aria-hidden="true">✓</span>}>Ikonka bilan</Button>
          </div>
        </div>
      </Section>

      <Section title="Form">
        <div className="flex max-w-md flex-col gap-md">
          <Field label="Foydalanuvchi nomi" hint="3-64 belgi." required>
            <Input placeholder="masalan: aliwer" />
          </Field>
          <Field label="Email" error="Email manzil noto'g'ri.">
            <Input defaultValue="notanemail" />
          </Field>
          <Field label="Yo'nalish">
            <Select
              options={[
                { value: 1, label: "Old -> Orqa" },
                { value: 2, label: "Orqa -> Old" },
              ]}
            />
          </Field>
          <Field label="Orqa tomoni">
            <Textarea rows={3} maxLength={1000} showCount placeholder="Javob matni" />
          </Field>
          <div className="flex items-center gap-xs">
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} label="Namuna" />
            <span className="text-sm text-fg-muted">Switch: {switchOn ? "yoniq" : "o'chiq"}</span>
          </div>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-xs">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone} dot>
              {tone}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Alert">
        <div className="flex flex-col gap-xs">
          <Alert tone="warning" title="Oxirgi deck slot qoldi." />
          <Alert tone="danger" title="Login yoki parol xato." />
          <Alert tone="info" title="Leitner qoidasi">
            To&apos;g&apos;ri javob kartani bir daraja oshiradi, xato javob esa 1-darajaga
            qaytaradi.
          </Alert>
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-sm sm:grid-cols-2">
          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Ingliz tili</CardTitle>
              <CardDescription>120 ta karta</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={40} label="Progress" />
            </CardContent>
            <CardFooter>
              <Button size="sm">Boshlash</Button>
            </CardFooter>
          </Card>
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>Hover qilib ko&apos;ring</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Section>

      <Section title="Stat">
        <div className="grid gap-sm sm:grid-cols-4">
          <Stat label="Jami karta" value={248} />
          <Stat label="Takrorlash kerak" value={12} tone="warning" />
          <Stat label="O'zlashtirilgan" value={64} tone="success" />
          <Stat label="Aniqlik" value="85%" tone="accent" hint="7 kunlik" />
        </div>
      </Section>

      <Section title="Progress">
        <div className="flex flex-col gap-sm">
          <Progress value={25} tone="accent" label="25%" />
          <Progress value={60} tone="success" label="60%" />
          <Progress value={95} tone="danger" label="95%" />
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap items-center gap-xs">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            Dialog
          </Button>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            AlertDialog
          </Button>
          <Tooltip content="Deck limiti tugadi (3 ta). Premium hisobda cheklov yo'q.">
            <Button variant="outline" disabled>
              Disabled + tooltip
            </Button>
          </Tooltip>
          <Dropdown
            ariaLabel="Amallar"
            trigger={
              <span className="inline-flex h-8 items-center rounded-md border border-border px-sm text-sm">
                Amallar ▾
              </span>
            }
            items={[
              { label: "Tahrirlash", onSelect: () => {} },
              { label: "Ko'chirish", onSelect: () => {} },
              { label: "O'chirish", onSelect: () => {}, tone: "danger" },
            ]}
          />
        </div>
      </Section>

      <Section title="Toast">
        <ToastDemo />
      </Section>

      <Section title="Feedback">
        <div className="flex flex-col gap-md">
          <div className="flex items-center gap-md">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
          <Separator label="Skeleton" />
          <div className="flex flex-col gap-xs">
            <Skeleton variant="text" lines={3} />
            <Skeleton variant="rect" className="h-20" />
          </div>
          <Separator label="Empty" />
          <EmptyState
            icon="📚"
            title="Hali deck yo'q"
            description="Birinchi deckingizni yarating va kartalar qo'shing."
            action={<Button size="sm">Yangi deck</Button>}
          />
          <Separator label="Kbd" />
          <div className="flex items-center gap-xs text-sm text-fg-muted">
            <Kbd>Space</Kbd> ko&apos;rsatish <Kbd>1</Kbd> bilardim <Kbd>2</Kbd> bilmadim
          </div>
        </div>
      </Section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} ariaLabel="Namuna dialog">
        <DialogHeader>
          <DialogTitle>Yangi deck</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Nomi" required>
            <Input placeholder="Deck nomi" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button onClick={() => setDialogOpen(false)}>Saqlash</Button>
        </DialogFooter>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deckni o'chirish"
        description="Uning barcha kartalari va takrorlash tarixi ham o'chadi. Bu amalni qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        onConfirm={() => setConfirmOpen(false)}
      />
    </main>
  );
}

export default function UiPage() {
  return (
    <ToastProvider>
      <Showcase />
    </ToastProvider>
  );
}

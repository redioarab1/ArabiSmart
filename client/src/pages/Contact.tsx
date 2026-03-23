import { useState } from "react";
import { Globe, Mail, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { toast } from "sonner";
import ScrollToTop from "@/components/ScrollToTop";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

const contactTexts = {
  ar: {
    badge: "تواصل معنا",
    title: "اتصل بنا",
    subtitle: "نسعد بتواصلك معنا لأي استفسار، اقتراح، أو للإبلاغ عن خبر غير دقيق.",
    infoTitle: "معلومات التواصل",
    emailLabel: "البريد الإلكتروني",
    websiteLabel: "الموقع الإلكتروني",
    responseLabel: "وقت الاستجابة",
    responseTime: "خلال 24-48 ساعة",
    commonTitle: "أسباب التواصل الشائعة:",
    commonReasons: ["الإبلاغ عن خبر غير دقيق", "اقتراح مصدر إخباري جديد", "مشكلة تقنية في الموقع", "طلب إعلان أو شراكة", "استفسارات عامة"],
    formTitle: "أرسل لنا رسالة",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "أدخل اسمك الكامل",
    emailFormLabel: "البريد الإلكتروني",
    subjectLabel: "موضوع الرسالة",
    subjectPlaceholder: "مثال: اقتراح مصدر إخباري جديد",
    messageLabel: "الرسالة",
    messagePlaceholder: "اكتب رسالتك هنا...",
    privacyNote: "بإرسال هذا النموذج، أنت توافق على سياسة الخصوصية الخاصة بنا.",
    sending: "جاري الإرسال...",
    send: "إرسال الرسالة",
    successTitle: "تم إرسال رسالتك بنجاح!",
    successMsg: "شكراً لتواصلك معنا. سنرد عليك خلال 24-48 ساعة على بريدك الإلكتروني.",
    sendAnother: "إرسال رسالة أخرى",
    required: "يرجى ملء جميع الحقول المطلوبة",
    successToast: "تم إرسال رسالتك بنجاح! سنرد عليك خلال 24-48 ساعة.",
  },
  en: {
    badge: "Contact Us",
    title: "Contact Us",
    subtitle: "We'd love to hear from you for any inquiry, suggestion, or to report inaccurate news.",
    infoTitle: "Contact Information",
    emailLabel: "Email",
    websiteLabel: "Website",
    responseLabel: "Response Time",
    responseTime: "Within 24-48 hours",
    commonTitle: "Common Reasons to Contact:",
    commonReasons: ["Report inaccurate news", "Suggest a new news source", "Technical issue on the site", "Advertising or partnership request", "General inquiries"],
    formTitle: "Send Us a Message",
    nameLabel: "Full Name",
    namePlaceholder: "Enter your full name",
    emailFormLabel: "Email Address",
    subjectLabel: "Subject",
    subjectPlaceholder: "e.g., Suggest a new news source",
    messageLabel: "Message",
    messagePlaceholder: "Write your message here...",
    privacyNote: "By submitting this form, you agree to our Privacy Policy.",
    sending: "Sending...",
    send: "Send Message",
    successTitle: "Your message was sent successfully!",
    successMsg: "Thank you for contacting us. We will reply within 24-48 hours to your email.",
    sendAnother: "Send Another Message",
    required: "Please fill in all required fields",
    successToast: "Your message was sent successfully! We will reply within 24-48 hours.",
  },
  sv: {
    badge: "Kontakta oss",
    title: "Kontakta oss",
    subtitle: "Vi hör gärna från dig för eventuella frågor, förslag eller för att rapportera felaktiga nyheter.",
    infoTitle: "Kontaktinformation",
    emailLabel: "E-post",
    websiteLabel: "Webbplats",
    responseLabel: "Svarstid",
    responseTime: "Inom 24-48 timmar",
    commonTitle: "Vanliga kontaktorsaker:",
    commonReasons: ["Rapportera felaktiga nyheter", "Föreslå en ny nyhetskälla", "Tekniskt problem på sajten", "Reklam- eller partnerskapsförfrågan", "Allmänna frågor"],
    formTitle: "Skicka ett meddelande",
    nameLabel: "Fullständigt namn",
    namePlaceholder: "Ange ditt fullständiga namn",
    emailFormLabel: "E-postadress",
    subjectLabel: "Ämne",
    subjectPlaceholder: "t.ex. Föreslå en ny nyhetskälla",
    messageLabel: "Meddelande",
    messagePlaceholder: "Skriv ditt meddelande här...",
    privacyNote: "Genom att skicka detta formulär godkänner du vår integritetspolicy.",
    sending: "Skickar...",
    send: "Skicka meddelande",
    successTitle: "Ditt meddelande skickades!",
    successMsg: "Tack för att du kontaktade oss. Vi svarar inom 24-48 timmar.",
    sendAnother: "Skicka ett annat meddelande",
    required: "Vänligen fyll i alla obligatoriska fält",
    successToast: "Ditt meddelande skickades! Vi svarar inom 24-48 timmar.",
  },
};

export default function Contact() {
  const { t, lang } = useLanguage();
  const c = contactTexts[lang];
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(c.required);
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success(c.successToast);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={t.dir}>
      <SEOHead title={c.title} description={c.subtitle} url="/contact" />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Globe className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ArabiSmart News</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t.home}</span></Link>
            <Link href="/about"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t.about}</span></Link>
            <Link href="/privacy"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t.privacy}</span></Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 bg-gradient-to-b from-primary/10 to-background">
        <div className="container text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="outline">{c.badge}</Badge>
          <h1 className="text-3xl font-bold">{c.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{c.subtitle}</p>
        </div>
      </section>

      <section className="py-12 container max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold">{c.infoTitle}</h2>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{c.emailLabel}</p>
                  <a href="mailto:info@arabismart.vip" className="text-sm text-primary hover:underline">info@arabismart.vip</a>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{c.websiteLabel}</p>
                  <a href="https://arabismart.vip" className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">arabismart.vip</a>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{c.responseLabel}</p>
                  <p className="text-sm text-muted-foreground">{c.responseTime}</p>
                </div>
              </div>
            </Card>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">{c.commonTitle}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {c.commonReasons.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{c.formTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h3 className="text-xl font-bold">{c.successTitle}</h3>
                    <p className="text-muted-foreground">{c.successMsg}</p>
                    <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                      {c.sendAnother}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{c.nameLabel} <span className="text-destructive">*</span></Label>
                        <Input id="name" placeholder={c.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} dir={t.dir} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{c.emailFormLabel} <span className="text-destructive">*</span></Label>
                        <Input id="email" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{c.subjectLabel}</Label>
                      <Input id="subject" placeholder={c.subjectPlaceholder} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} dir={t.dir} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{c.messageLabel} <span className="text-destructive">*</span></Label>
                      <Textarea id="message" placeholder={c.messagePlaceholder} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="min-h-[140px] resize-none" dir={t.dir} />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">{c.privacyNote}</p>
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? c.sending : (<><Send className="h-4 w-4" />{c.send}</>)}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">ArabiSmart News - {t.siteSlogan}</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy"><span className="hover:text-foreground cursor-pointer transition-colors">{t.privacy}</span></Link>
            <span>•</span>
            <Link href="/contact"><span className="hover:text-foreground cursor-pointer transition-colors">{t.contact}</span></Link>
            <span>•</span>
            <Link href="/about"><span className="hover:text-foreground cursor-pointer transition-colors">{t.about}</span></Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 ArabiSmart News. {t.allRightsReserved}.</p>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}

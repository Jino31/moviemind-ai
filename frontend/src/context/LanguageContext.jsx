// src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

// 🌐 TRANSLATION DICTIONARY MATRIX
const translations = {
  English: {
    settings: "Settings",
    subtitle: "Calibrate and protect your MovieMind streaming metrics workspace.",
    backHome: "Back Home",
    security: "Security Credentials",
    securityDesc: "Audit active logging parameters, sessions, and connected identity nodes.",
    manageSecurity: "Manage Security Profile",
    notifications: "System Push Notifications",
    notificationsDesc: "Toggle active pings regarding fresh releases, system data drops, and trending trailers.",
    currentConfig: "CURRENT CONFIG",
    live: "LIVE",
    muted: "MUTED",
    activeAlerts: "Active Alerts",
    muteAlerts: "Mute Alerts",
    sysPrefs: "System Preferences",
    langLabel: "Application Interface Dialect",
    langDesc: "Adjust the global localization string files structure.",
    displayStyle: "Display Layout Style",
    displayDesc: "Toggle immersive workspace color themes and deep lighting contrast profiles.",
    darkCore: "Dark Core",
    lightAura: "Light Aura",
    aiLabel: "AI Recommendation Quality",
    aiDesc: "Unlock customized, hyper-focused algorithm filters matching profile history trends.",
    aiActive: "Deep AI Active",
    aiStandard: "Standard",
    dangerZone: "Danger Zone Boundary Node",
    dangerDesc: "Permanently wipe your MovieMind profile registry, telemetry, tracking metrics, and historical logs. This action is terminal and cannot be reversed by system technicians.",
    deleteAccount: "Scrub Account From Cloud",
    toastLang: "Primary App dialect updated to [ English ].",
    toastToast: "System updated successfully."
  },
  Tamil: {
    settings: "அமைப்புகள்",
    subtitle: "உங்கள் மூவிமைண்ட் கணக்கின் விவரங்களையும் அமைப்புகளையும் நிர்வகிக்கவும்.",
    backHome: "முகப்பு பக்கம்",
    security: "பாதுகாப்பு விவரங்கள்",
    securityDesc: "செயலில் உள்ள உள்நுழைவு அளவுருக்கள் மற்றும் கணக்கு பாதுகாப்பை கண்காணிக்கவும்.",
    manageSecurity: "பாதுகாப்பை நிர்வகி",
    notifications: "அறிவிப்புகள் (Notifications)",
    notificationsDesc: "புதிய திரைப்பட வெளியீடுகள் மற்றும் கணினி தரவு அறிவிப்புகளை மாற்றவும்.",
    currentConfig: "தற்போதைய நிலை",
    live: "செயலில் உள்ளது",
    muted: "நிறுத்தப்பட்டது",
    activeAlerts: "செயலில் வை",
    muteAlerts: "அமைதிப்படுத்து",
    sysPrefs: "கணினி விருப்பத்தேர்வுகள்",
    langLabel: "பயன்பாட்டு இடைமுக மொழி",
    langDesc: "பயன்பாட்டின் ஒட்டுமொத்த மொழியை மாற்றியமைக்கவும்.",
    displayStyle: "திரை தளவமைப்பு பாணி",
    displayDesc: "இருண்ட மற்றும் ஒளி வண்ண பின்னணி பாணிகளை மாற்றவும்.",
    darkCore: "டார்க் கோர்",
    lightAura: "லைட் ஆரா",
    aiLabel: "AI பரிந்துரை தரம்",
    aiDesc: "உங்கள் சுயவிவர வரலாற்றுடன் பொருந்தக்கூடிய தனிப்பயனாக்கப்பட்ட AI பரிந்துரைகளை திறக்கவும்.",
    aiActive: "AI செயலில் உள்ளது",
    aiStandard: "வழக்கமான",
    dangerZone: "ஆபத்தான பகுதி (Danger Zone)",
    dangerDesc: "உங்கள் கணக்குத் தரவு மற்றும் வரலாற்றுப் பதிவுகளை நிரந்தரமாக நீக்கவும். இந்தச் செயலைத் திரும்பப் பெற முடியாது.",
    deleteAccount: "கணக்கை நிரந்தரமாக நீக்கு",
    toastLang: "பயன்பாட்டின் முதன்மை மொழி மாற்றப்பட்டது [ தமிழ் ].",
    toastToast: "அமைப்புகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன."
  }
};

export function LanguageProvider({ children }) {
  // Persistence Layer: Remember language selection even after page reloads
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("movieMindLang") || "English";
  });

  useEffect(() => {
    localStorage.setItem("movieMindLang", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "English" ? "Tamil" : "English"));
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
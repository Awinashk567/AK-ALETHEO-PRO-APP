import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Shield, 
  Sparkles, 
  FileText, 
  Globe, 
  Cpu, 
  Zap, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  X,
  Lock,
  Terminal,
  Activity
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LanguageId = 'en' | 'hi' | 'hinglish' | 'kn' | 'ta' | 'mr' | 'bn';

interface LanguageContent {
  title: string;
  subtitle: string;
  badge: string;
  capabilitiesTitle: string;
  commandManualTitle: string;
  commandManualSub: string;
  btnMinimize: string;
  btnExpand: string;
  btnSkip: string;
  copied: string;
  capabilities: {
    vault: { title: string; desc: string };
    ingestion: { title: string; desc: string };
    dualmode: { title: string; desc: string };
    export: { title: string; desc: string };
  };
  commands: {
    chat: { label: string; query: string; out: string };
    stats: { label: string; query: string; out: string };
    code: { label: string; query: string; out: string };
  };
}

const LANGUAGES_LIST = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'हिंदी' },
  { id: 'hinglish', name: 'Hinglish' },
  { id: 'kn', name: 'ಕನ್ನಡ' },
  { id: 'ta', name: 'தமிழ்' },
  { id: 'mr', name: 'मराठी' },
  { id: 'bn', name: 'বাংলা' }
];

const LANG_CONTENT: Record<LanguageId, LanguageContent> = {
  en: {
    title: "AK ALETHEO PRO",
    subtitle: "Clinical Analytical Workspace & Decentralized Multi-Source Data Node",
    badge: "Zero-Trust Protocol V4.20",
    capabilitiesTitle: "Capability Blueprint",
    commandManualTitle: "Interactive Command Manual",
    commandManualSub: "Click snippets to instantly copy them and inspect their execution matrix outputs below.",
    btnMinimize: "Minimize Feature Guide",
    btnExpand: "Review Comprehensive Guide",
    btnSkip: "Skip to Workspace",
    copied: "Copied!",
    capabilities: {
      vault: {
        title: "Clinical Project Vault",
        desc: "Strict state encapsulation inside offline IndexedDB. Your patient records, diagnostics, and clinical templates never traverse external relays or unverified storage states."
      },
      ingestion: {
        title: "Asynchronous Zero-PII Ingestion",
        desc: "Dedicated CPU Web Workers decompose files and redact secure HIPAA-sensitive identifiers directly in client-side runtime before synthesizing data vectors."
      },
      dualmode: {
        title: "Dual-Engine Translation Node",
        desc: "Toggle conceptual natural-language analysis for semantic evaluation, or execution compilers for precise, deterministic mathematical expressions."
      },
      export: {
        title: "Multi-Format Export Matrix",
        desc: "Instant high-fidelity compilation of modified clinical data points into standardized XLS sheets, fully structured CSVs, custom relational SQL tables, or clinical reports."
      }
    },
    commands: {
      chat: {
        label: "AI Diagnostic Analysis Query",
        query: "Generate a scatter plot aggregating YoY_Lag_Value relative to Patient_Density and segment groups",
        out: "[MATRIX] Rendered scatter coordinates in memory. Standard Deviation: ±12.4%. Target cluster density matches threshold."
      },
      stats: {
        label: "Clinical Statistical Inquiry",
        query: "What is the standard deviation of clinical trials grouping by Department and filter outliers?",
        out: "[STATS] Standard Error: 1.25% | Computed Group σ = 14.82 | Grouped Units: 12 clinical branches. Status: COMPLETED"
      },
      code: {
        label: "Direct Compiler Syntactical Memory filter",
        query: "filter Trial_Age > 40 & Success_Metrics == 'High' | sort Patient_Index desc",
        out: "[KERNEL] Parsed statement cleanly. Sliced matching rows: 104 / 500 records. Execution completed in 3.1ms."
      }
    }
  },
  hi: {
    title: "एके अलेथियो प्रो (AK ALETHEO PRO)",
    subtitle: "क्लिनिकल विश्लेषणात्मक वर्कस्पेस और विकेंद्रीकृत बहु-स्रोत डेटा नोड",
    badge: "शून्य-विश्वास प्रोटोकॉल V4.20",
    capabilitiesTitle: "सिस्टम क्षमता ब्लूप्रिंट",
    commandManualTitle: "इंटरैक्टिव कमांड मैनुअल",
    commandManualSub: "स्निपेट्स को तुरंत कॉपी करने और उनके निष्पादन मैट्रिक्स आउटपुट को देखने के लिए क्लिक करें।",
    btnMinimize: "सुविधा गाइड को छोटा करें",
    btnExpand: "विस्तृत गाइड की समीक्षा करें",
    btnSkip: "वर्कस्पेस पर जाएं",
    copied: "कॉपी किया गया!",
    capabilities: {
      vault: {
        title: "क्लिनिकल प्रोजेक्ट वॉल्ट",
        desc: "ऑफ़लाइन IndexedDB के भीतर सख्त स्थिति एनकैप्सुलेशन। आपके मरीज के रिकॉर्ड, नैदानिक डेटा और क्लिनिकल टेम्पलेट कभी भी बाहरी सर्वर या असत्यापित स्टोरेज में नहीं जाते हैं।"
      },
      ingestion: {
        title: "एसिंक्रोनस ज़ीरो-पीआईआई अंतर्ग्रहण",
        desc: "समर्पित सीपीयू वेब वर्कर्स डेटा वेक्टर वेब विश्लेषण से पहले क्लाइंट-साइड रनटाइम में सीधे हिप्पा-संवेदनशील पहचानकर्ताओं को साफ और संशोधित करते हैं।"
      },
      dualmode: {
        title: "डुअल-इंजन अनुवाद नोड",
        desc: "वैचारिक प्राकृतिक-भाषा विश्लेषण या सटीक, नियतात्मक गणितीय अभिव्यक्तियों के लिए निष्पादन कंपाइलर्स के बीच टॉगल करें।"
      },
      export: {
        title: "बहु-प्रारूप निर्यात मैट्रिक्स",
        desc: "संशोधित क्लिनिकल डेटा बिंदुओं का मानकीकृत XLS फाइलों, संरचित CSV, कस्टम रिलेशनल SQL तालिकाओं या क्लिनिकल रिपोर्ट में तत्काल उच्च-सटीकता संकलन।"
      }
    },
    commands: {
      chat: {
        label: "एआई नैदानिक विश्लेषण क्वेरी",
        query: "Generate a scatter plot aggregating YoY_Lag_Value relative to Patient_Density and segment groups",
        out: "[डेटा] मेमोरी में स्कैटर निर्देशांक प्रस्तुत किए गए। मानक विचलन: ±12.4%। लक्षित क्लस्टर घनत्व थ्रेशोल्ड से मेल खाता है।"
      },
      stats: {
        label: "क्लिनिकल सांख्यिकीय पूछताछ",
        query: "What is the standard deviation of clinical trials grouping by Department and filter outliers?",
        out: "[सांख्यिकी] मानक त्रुटि: 1.25% | परिकलित समूह σ = 14.82 | वर्गीकृत इकाइयाँ: 12 चिकित्सा शाखाएँ। स्थिति: पूर्ण"
      },
      code: {
        label: "प्रत्यक्ष कंपाइलर सिंटैक्स मेमोरी फ़िल्टर",
        query: "filter Trial_Age > 40 & Success_Metrics == 'High' | sort Patient_Index desc",
        out: "[कर्नेल] अभिव्यक्तियों को सफलतापूर्वक पार्स किया गया। मिलान पंक्तियाँ: 104 / 500 रिकॉर्ड। 3.1ms में निष्पादित।"
      }
    }
  },
  hinglish: {
    title: "AK ALETHEO PRO",
    subtitle: "Clinical Analytical Workspace aur Decentralized Multi-Source Data Node",
    badge: "Zero-Trust Protocol V4.20",
    capabilitiesTitle: "System Capability Blueprint",
    commandManualTitle: "Interactive Command Manual",
    commandManualSub: "Snippets pe click karein instant copy karne aur unke actual execution matrix ko dekhne ke liye.",
    btnMinimize: "Feature Guide ko chota karein",
    btnExpand: "Comprehensive Guide review karein",
    btnSkip: "Workspace par chalein",
    copied: "Copied!",
    capabilities: {
      vault: {
        title: "Clinical Project Vault",
        desc: "Aapka data offline IndexedDB ke andar completely isolated rehta hai. Isliye clinical records aur diagnostic sheets kabhi kisi unverified third-party server par nahi jaate."
      },
      ingestion: {
        title: "Asynchronous Zero-PII Ingestion",
        desc: "Asynchronous local web workers processing se pehle hi clinical fields se PII (sensible data) ko redact aur encrypt kar dete hain."
      },
      dualmode: {
        title: "Dual-Engine Translation Node",
        desc: "Smart semantic AI chat aur rigid, deterministic custom mathematical operators ke beech switch karein taaki data accurate rahe."
      },
      export: {
        title: "Multi-Format Export Matrix",
        desc: "Apne filters aur mathematical analysis ke baad direct high-fidelity Excel sheets, standardized CSV, ya clinical reports download karein."
      }
    },
    commands: {
      chat: {
        label: "AI Diagnostic Analysis Query",
        query: "Generate a scatter plot aggregating YoY_Lag_Value relative to Patient_Density and segment groups",
        out: "[MATRIX] Scatter plots calculated in main memory. Standard Deviation: ±12.4%. Target density checks passed."
      },
      stats: {
        label: "Clinical Statistical Inquiry",
        query: "What is the standard deviation of clinical trials grouping by Department and filter outliers?",
        out: "[STATS] Standard Error: 1.25% | Computed Group σ = 14.82 | Grouped Clinical Units: 12 units. Status: OK"
      },
      code: {
        label: "Direct Compiler Syntactical Memory filter",
        query: "filter Trial_Age > 40 & Success_Metrics == 'High' | sort Patient_Index desc",
        out: "[KERNEL] Command parsed. Sliced corresponding rows: 104 / 500 rows. Executed successfully in 3.1ms."
      }
    }
  },
  kn: {
    title: "ಎಕೆ ಅಲೆಥಿಯೊ ಪ್ರೊ (AK ALETHEO PRO)",
    subtitle: "ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣಾತ್ಮಕ ವರ್ಕ್‌ಸ್ಪೇಸ್ ಮತ್ತು ವಿಕೇಂದ್ರೀಕೃತ ಮಲ್ಟಿ-ಸೋರ್ಸ್ ಡೇಟಾ ನೋಡ್",
    badge: "ಶೂನ್ಯ-ನಂಬಿಕೆ ಪ್ರೋಟೋಕಾಲ್ V4.20",
    capabilitiesTitle: "ವ್ಯವಸ್ಥೆಯ ಸಾಮರ್ಥ್ಯದ ರೋಡ್‌ಮ್ಯಾಪ್",
    commandManualTitle: "ಸಂವಾದಾತ್ಮಕ ಕಮಾಂಡ್ ಮಾರ್ಗದರ್ಶನ",
    commandManualSub: "ಸ್ನಿಪ್ಪೆಟ್‌ಗಳನ್ನು ನಕಲಿಸಲು ಮತ್ತು ಸಿಸ್ಟಮ್‌ನ ಔಟ್‌ಪುಟ್ ಅನ್ನು ಮುನ್ನೋಟ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ.",
    btnMinimize: "ವೈಶಿಷ್ಟ್ಯ ಮಾರ್ಗದರ್ಶನ ಸಾಂದ್ರಗೊಳಿಸಿ",
    btnExpand: "ಸಂಪೂರ್ಣ ಮಾರ್ಗದರ್ಶನ ವಿಮರ್ಶಿಸಿ",
    btnSkip: "ವರ್ಕ್‌ಸ್ಪೇಸ್‌ಗೆ ಹೋಗಿ",
    copied: "ಕಾಪಿ ಮಾಡಲಾಗಿದೆ!",
    capabilities: {
      vault: {
        title: "ಕ್ಲಿನಿಕಲ್ ಪ್ರಾಜೆಕ್ಟ್ ವಾಲ್ಟ್",
        desc: "ಆಫ್‌ಲೈನ್ IndexedDB ಯಲ್ಲಿ ಡೇಟಾ ಸಂಪೂರ್ಣವಾಗಿ ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ. ನಿಮ್ಮ ರೋಗಿಗಳ ದಾಖಲೆಗಳು ಮತ್ತು ರೋಗನಿರ್ಣಯದ ಶೀಟ್‌ಗಳು ಎಂದಿಗೂ ಅಸುರಕ್ಷಿತ ಸ್ಟೋರೇಜ್‌ಗೆ ರವಾನೆಯಾಗುವುದಿಲ್ಲ."
      },
      ingestion: {
        title: "ಅಸಿಂಕ್ರೋನಸ್ ಜೀರೋ-ಪಿಐಐ ಸ್ವೀಕಾರ",
        desc: "ಸ್ಥಳೀಯ ವೆಬ್ ನೌಕರರು (Web Workers) ದತ್ತಾಂಶ ವಿಶ್ಲೇಷಣೆಗೆ ಮುಂಚಿತವಾಗಿ ವೈಯಕ್ತಿಕ ಗುರುತಿಸಬಹುದಾದ ಮಾಹಿತಿಯನ್ನು (PII) ಸುರಕ್ಷಿತವಾಗಿ ಸ್ವಚ್ಛಗೊಳಿಸುತ್ತಾರೆ."
      },
      dualmode: {
        title: "ದ್ವಿ-ಎಂಜಿನ್ ಅನುವಾದ ವ್ಯವಸ್ಥೆ",
        desc: "ವೈಚಾರಿಕ ದತ್ತಾಂಶದ ಶಬ್ದಾರ್ಥದ ಹುಡುಕಾಟಕ್ಕಾಗಿ 'ಎಐ ಏಜೆಂಟ್ ಮೋಡ್' ಮತ್ತು ಕಟ್ಟುನಿಟ್ಟಾದ ಗಣಿತದ ಲೆಕ್ಕಾಚಾರಕ್ಕಾಗಿ 'ಮ್ಯಾನುಯಲ್ ಕಂಪೈಲರ್ ಮೋಡ್' ನಡುವೆ ಬದಲಿಸಿ."
      },
      export: {
        title: "ಮಲ್ಟಿ-ಫಾರ್ಮ್ಯಾಟ್ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ವ್ಯವಸ್ಥೆ",
        desc: "ಸಂಸ್ಕರಿಸಿದ ದತ್ತಾಂಶವನ್ನು ತ್ವರಿತವಾಗಿ ಪ್ರಮಾಣೀಕೃತ Excel, CSV, SQL ಪ್ರಾವಿಧಾನ ಅಥವಾ ವೈದ್ಯಕೀಯ ವರದಿಗಳಾಗಿ ರಫ್ತು ಮಾಡಿ."
      }
    },
    commands: {
      chat: {
        label: "ಎಐ ರೋಗನಿರ್ಣಯ ವಿಶ್ಲೇಷಣೆ ಪ್ರಶ್ನೆ",
        query: "Generate a scatter plot aggregating YoY_Lag_Value relative to Patient_Density and segment groups",
        out: "[MATRIX] ಸ್ಕ್ಯಾಟರ್ ಕೋ-ಆರ್ಡಿನೇಟ್‌ಗಳು ಮೆಮೊರಿಯಲ್ಲಿ ಸಿದ್ಧವಾಗಿವೆ. ಪ್ರಮಾಣಿತ ವಿಚಲನ: ±12.4%. ಸಾಂದ್ರತೆ ಸೂಕ್ತವಾಗಿದೆ."
      },
      stats: {
        label: "ಕ್ಲಿನಿಕಲ್ ಸಾಂಖ್ಯಿಕ ವಿಚಾರಣೆ",
        query: "What is the standard deviation of clinical trials grouping by Department and filter outliers?",
        out: "[STATS] ಪ್ರಮಾಣಿತ ದೋಷ: 1.25% | ಸಮೂಹದ σ = 14.82 | ಒಟ್ಟು 12 ಕ್ಲಿನಿಕಲ್ ವಿಭಾಗಗಳಿಗೆ ಲೆಕ್ಕಾಚಾರ ಮುಗಿದಿದೆ."
      },
      code: {
        label: "ಮೆಮೊರಿ ಆಧಾರಿತ ಸೂತ್ರ ಸಂಸ್ಕರಣೆ",
        query: "filter Trial_Age > 40 & Success_Metrics == 'High' | sort Patient_Index desc",
        out: "[KERNEL] ನಿಯಮಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಒಟ್ಟು 104 / 500 ಹೊಂದಿಕೆಯಾಗುವ ಸಾಲುಗಳು ಪತ್ತೆಯಾಗಿವೆ. ಸಮಯ: 3.1ms."
      }
    }
  },
  ta: {
    title: "ஏகே அலேதியோ ப்ரோ (AK ALETHEO PRO)",
    subtitle: "மருத்துவ பகுப்பாய்வு பணிமனை & பரவலாக்கப்பட்ட பல ஆதார தரவு முனையம்",
    badge: "ஜீரோ-ட்ரஸ்ட் நெறிமுறை V4.20",
    capabilitiesTitle: "கணினி திறன் வரைபடம்",
    commandManualTitle: "ஊடாடும் கட்டளை கையேடு",
    commandManualSub: "கட்டளைகளை நகலெடுக்க மற்றும் அவற்றின் வெளியீட்டை முன்னோட்டமிட ஏதேனும் ஒரு ஸ்னிப்பெட்டை கிளிக் செய்க.",
    btnMinimize: "வழிகாட்டியைச் சுருக்குக",
    btnExpand: "விரிவான வழிகாட்டியைப் பார்க்கவும்",
    btnSkip: "பணிமனைக்குச் செல்க",
    copied: "நகலெடுக்கப்பட்டது!",
    capabilities: {
      vault: {
        title: "மருத்துவ திட்ட பெட்டகம்",
        desc: "ஆஃப்லைன் IndexedDB-க்குள் முழுமையான பாதுகாப்பு. உங்கள் நோயாளிகளின் தரவுகள் மற்றும் மருத்துவ மாதிரிகள் வெளிப்புற சேவையகங்களுக்கு அனுப்பப்படுவதில்லை."
      },
      ingestion: {
        title: "பாதுகாப்பான தரவு உட்செலுத்துதல்",
        desc: "தனிப்பயன் வெப் ஒர்க்கர்கள் (Web Workers) தரவு பகுப்பாய்விற்கு முன் நோயாளியின் தனிப்பட்ட அடையாள விவரங்களை (PII) பாதுகாப்பாக அழிக்கின்றன."
      },
      dualmode: {
        title: "இருமுனை பகுப்பாய்வு இயந்திரம்",
        desc: "இயற்கை மொழி அடிப்படையிலான தேடலுக்கும், கணித ரீதியான நேரடி மெமரி வடிகட்டுதலுக்கும் இடையே எளிதாக மாறலாம்."
      },
      export: {
        title: "பல வடிவ ஏற்றுமதி மேட்ரிக்ஸ்",
        desc: "வடிகட்டப்பட்ட மருத்துவத் தரவுகளை எக்செல், சிஎஸ்வி, எச்கியூஎல் அல்லது மருத்துவ அறிக்கை வடிவங்களுக்கு உடனடியாகப் பதிவிறக்கலாம்."
      }
    },
    commands: {
      chat: {
        label: "ஏஐ மருத்துவ பகுப்பாய்வு வினவல்",
        query: "Generate a scatter plot aggregating YoY_Lag_Value relative to Patient_Density and segment groups",
        out: "[MATRIX] வரைபட ஒருங்கிணைப்புகள் கணக்கிடப்பட்டன. நிலையான விலகல்: ±12.4%."
      },
      stats: {
        label: "மருத்துவ புள்ளிவிவர வினவல்",
        query: "What is the standard deviation of clinical trials grouping by Department and filter outliers?",
        out: "[STATS] நிலையான பிழை: 1.25% | கணக்கிடப்பட்ட σ = 14.82 | 12 மருத்துவ அலகுகள் பகுப்பாய்வு செய்யப்பட்டன."
      },
      code: {
        label: "நேரடி வடிகட்டி குறியீட்டு முறை",
        query: "filter Trial_Age > 40 & Success_Metrics == 'High' | sort Patient_Index desc",
        out: "[KERNEL] கட்டளை பகுப்பாய்வு செய்யப்பட்டது. வடிகட்டப்பட்ட வரிசைகளின் எண்ணிக்கை: 104 / 500. நேரம்: 3.1ms."
      }
    }
  },
  mr: {
    title: "एके अलेथिओ प्रो (AK ALETHEO PRO)",
    subtitle: "क्लिनिकल विश्लेषणात्मक वर्कस्पेस आणि विकेंद्रीकृत बहु-स्रोत डेटा नोड",
    badge: "शून्य-विश्वास प्रोटोकॉल V4.20",
    capabilitiesTitle: "सिस्टम क्षमता आराखडा",
    commandManualTitle: "इंटरएक्टिव्ह कमांड मॅन्युअल",
    commandManualSub: "कमांड कॉपी करण्यासाठी आणि खालील आउटपुट प्रिव्ह्यू पाहण्यासाठी कोणत्याही स्निपेटवर क्लिक करा.",
    btnMinimize: "माहिती पुस्तिका लहान करा",
    btnExpand: "तपशीलवार माहिती पुस्तिका पुनरावलोकन करा",
    btnSkip: "वर्कस्पेस उघडा",
    copied: "कॉपी केले!",
    capabilities: {
      vault: {
        title: "क्लिनिकल प्रोजेक्ट वॉल्ट",
        desc: "ऑफलाइन IndexedDB द्वारे संपूर्ण डेटा सुरक्षितता. तुमचे रुग्ण रेकॉर्ड्स आणि क्लिनिकल मॉडेल्स कधीही अनधिकृत क्लाउड स्टोरेजवर जात नाहीत."
      },
      ingestion: {
        title: "असिंक्रोनस झीरो-पीआईआई अंतर्ग्रहण",
        desc: "वेब वर्कर्स स्थानिक पातळीवर प्रक्रिया करण्यापूर्वी संवेदनशील वैयक्तिक रुग्ण माहिती (PII) सुरक्षितपणे काढून टाकतात."
      },
      dualmode: {
        title: "दुहेरी-मोड शोध इंजिन",
        desc: "संकल्पनात्मक शोध विश्लेषणासाठी 'एआय एजंट मोड' आणि थेट गणितीय गणनेसाठी 'मॅन्युअल कंपायलर मोड' निवडा."
      },
      export: {
        title: "मल्टी-फॉर्मेट निर्यात मॅट्रिक्स",
        desc: "प्रक्रिया केलेल्या डेटाचे मानक Excel, CSV, SQL स्कीमा किंवा क्लिनिकल अहवाल स्वरूपात झटपट आणि अचूक डाऊनलोड."
      }
    },
    commands: {
      chat: {
        label: "एआय क्लिनिकल विश्लेषणात्मक प्रश्न",
        query: "Generate a scatter plot aggregating YoY_Lag_Value relative to Patient_Density and segment groups",
        out: "[MATRIX] आलेख निर्देशक मेमरीमध्ये लोड झाले. मानक विचलन: ±१२.४%. डेन्सिटी योग्य आहे."
      },
      stats: {
        label: "सांख्यिकीय मॅट्रिक्स चौकशी",
        query: "What is the standard deviation of clinical trials grouping by Department and filter outliers?",
        out: "[STATS] एरर रेट: 1.25% | गणितीय σ = 14.82 | १२ क्लिनिकल विभागांमध्ये प्रक्रियेचे काम यशस्वीरित्या पूर्ण झाले."
      },
      code: {
        label: "थेट मेमरी कमांड सिंटॅक्स",
        query: "filter Trial_Age > 40 & Success_Metrics == 'High' | sort Patient_Index desc",
        out: "[KERNEL] सिंटॅक्स सुरक्षितपणे पार्स केला. जुळणाऱ्या ओळी: 104 / 500 रेकॉर्ड्स. प्रक्रिया वेळ: 3.1ms."
      }
    }
  },
  bn: {
    title: "একে আলেথিও প্রো (AK ALETHEO PRO)",
    subtitle: "ক্লিনিক্যাল বিশ্লেষণাত্নক ওয়ার্কস্পেস এবং বিকেন্দ্রীভূত বহু-উৎস ডেটা নোড",
    badge: "জিরো-ট্রাস্ট প্রোটোকল V4.20",
    capabilitiesTitle: "সিস্টেম সামর্থ্যের রূপরেখা",
    commandManualTitle: "ইন্টারেক্টিভ কমান্ড ম্যানুয়াল",
    commandManualSub: "কপি এবং তাদের এক্সিকিউশন আউটপুট প্রিভিউ দেখার জন্য যেকোনো কমান্ডের ওপর ক্লিক করুন।",
    btnMinimize: "গাইড ছোট করুন",
    btnExpand: "অনবোর্ডিং গাইড পর্যালোচনা করুন",
    btnSkip: "ওয়ার্কস্পেস শুরু করুন",
    copied: "কপি হয়েছে!",
    capabilities: {
      vault: {
        title: "ক্লিনিক্যাল প্রজেক্ট ভল্ট",
        desc: "অফলাইন IndexedDB-এর মধ্যে ডেটা সম্পূর্ণ সুরক্ষিত। আপনার রোগীদের রেকর্ড ও পরীক্ষার ফাইল কখনোই কোনো অননুমোদিত বহিরাগত সার্ভারে আপলোড করা হয় না।"
      },
      ingestion: {
        title: "অসিঙ্ক্রোনাস জিরো-পিআইআই তথ্য গ্রহণ",
        desc: "বিশেষ ওয়েব ওয়ার্কার্স ডেটা বিশ্লেষণের পূর্বে রোগীদের সংবেদনশীল ও ব্যক্তিগত তথ্য (PII) ক্লায়েন্ট সাইডেই নিষ্ক্রিয় করে।"
      },
      dualmode: {
        title: "দ্বৈত-ইঞ্জিন বিশ্লেষণ ব্যবস্থা",
        desc: "এআই চালিত সহজ সার্চিং এবং গাণিতিক ফিল্টারিং করার জন্য 'ম্যানুয়াল কম্পাইলার মোড'-এর মধ্যে অতি দ্রুত পরিবর্তন করতে পারবেন।"
      },
      export: {
        title: "মাল্টি-ফরম্যাট এক্সপোর্ট ম্যাট্রিক্স",
        desc: "ফিল্টার করা ডেটা শীটগুলোকে সরাসরি Excel ফাইল, স্ট্যান্ডার্ড CSV, রিলেশনাল SQL বা ক্লিনিক্যাল রিপোর্টে পরিণত করুন।"
      }
    },
    commands: {
      chat: {
        label: "এআই রাউন্ড ডায়াগনস্টিক কুয়েরি",
        query: "Generate a scatter plot aggregating YoY_Lag_Value relative to Patient_Density and segment groups",
        out: "[MATRIX] চার্ট কোঅর্ডিনেট মেমরিতে প্রস্তুত। স্ট্যান্ডার্ড ডেভিয়েশন: ±১২.৪%। ডেনসিটি থ্রেশোল্ড মিলেছে।"
      },
      stats: {
        label: "ক্লিনিক্যাল পরিসংখ্যানগত গবেষণা",
        query: "What is the standard deviation of clinical trials grouping by Department and filter outliers?",
        out: "[STATS] স্ট্যান্ডার্ড ত্রুটি: ১.২৫% | হিসাবকৃত σ = ১৪.৮২ | ১২টি ক্লিনিক্যাল ডিভিশন। স্ট্যাটাস: সম্পন্ন"
      },
      code: {
        label: "কম্পাইলার সিনট্যাক্স মেমরি ফিল্টার",
        query: "filter Trial_Age > 40 & Success_Metrics == 'High' | sort Patient_Index desc",
        out: "[KERNEL] সিনট্যাক্স সঠিকভাবে পার্স করা হয়েছে। উপযুক্ত সারি: ১০৪ / ৫০০টি রেকর্ড। সময়: ৩.১ মিলি-সেকেন্ড।"
      }
    }
  }
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<LanguageId>('en');
  const [expandedCapabilities, setExpandedCapabilities] = useState<Record<string, boolean>>({
    vault: true,
    ingestion: true,
    dualmode: false,
    export: false
  });
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeConsoleIndex, setActiveConsoleIndex] = useState<'chat' | 'stats' | 'code'>('chat');

  if (!isOpen) return null;

  const content = LANG_CONTENT[lang];

  const toggleCapability = (key: string) => {
    setExpandedCapabilities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const anyExpanded = Object.values(expandedCapabilities).some(v => v);

  const handleToggleAllCapabilities = () => {
    if (anyExpanded) {
      setExpandedCapabilities({
        vault: false,
        ingestion: false,
        dualmode: false,
        export: false
      });
    } else {
      setExpandedCapabilities({
        vault: true,
        ingestion: true,
        dualmode: true,
        export: true
      });
    }
  };

  const handleCopy = (text: string, indexKey: 'chat' | 'stats' | 'code') => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(indexKey);
    setActiveConsoleIndex(indexKey);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md selection:bg-cyan-500/30 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.8, bounce: 0.1 }}
        className="relative w-full max-w-[96vw] xl:max-w-7xl h-[94vh] md:h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(30,27,75,0.4)]"
      >
        {/* Laser Border Header Accent */}
        <div className="h-[3px] w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500 shrink-0" />

        {/* Global Connection / Trust Metrics Ribbon */}
        <div className="bg-slate-900/60 border-b border-slate-900 px-6 py-2 flex items-center justify-between shrink-0 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-extrabold">{content.badge}</span>
              <span className="text-[10px] text-slate-600">|</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Lock size={10} className="text-indigo-400" /> LOCAL DECRYPTION: VERIFIED
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-500">
            <Activity size={10} className="text-emerald-500 animate-pulse" /> ENGINE BUFFER: ACTIVE
          </div>
        </div>

        {/* Header Section */}
        <header className="px-6 md:px-10 pt-6 pb-4 border-b border-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0 bg-slate-950">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <Terminal size={22} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2 uppercase">
                  {content.title}
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono border border-indigo-500/30 tracking-widest uppercase">PRO</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">{content.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Multilingual Control Station */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 font-mono">
              <Globe size={10} className="text-cyan-400" /> Analytical Channel Language Selection
            </span>
            <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/60 max-w-full">
              {LANGUAGES_LIST.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id as LanguageId)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    lang === l.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/40 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/80 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* Two Column Bento-Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full max-w-7xl mx-auto items-start">
            
            {/* Left Column (Capability Roadmap) */}
            <section className="lg:col-span-6 flex flex-col gap-6" aria-label="System Capabilities">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-[#22c55e] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  {content.capabilitiesTitle}
                </h2>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Client Isolation Mode</span>
              </div>

              {/* Accordion List */}
              <div className="space-y-3">
                {/* Project Vault */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700">
                  <button
                    onClick={() => toggleCapability('vault')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Database size={15} className="text-cyan-400" />
                      </div>
                      <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">{content.capabilities.vault.title}</h3>
                    </div>
                    {expandedCapabilities.vault ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedCapabilities.vault && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                          {content.capabilities.vault.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Secure Data Ingestion */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700">
                  <button
                    onClick={() => toggleCapability('ingestion')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Shield size={14} className="text-indigo-400" />
                      </div>
                      <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">{content.capabilities.ingestion.title}</h3>
                    </div>
                    {expandedCapabilities.ingestion ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedCapabilities.ingestion && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                          {content.capabilities.ingestion.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Dual Mode AI Search */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700">
                  <button
                    onClick={() => toggleCapability('dualmode')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Sparkles size={14} className="text-purple-400" />
                      </div>
                      <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">{content.capabilities.dualmode.title}</h3>
                    </div>
                    {expandedCapabilities.dualmode ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedCapabilities.dualmode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                          {content.capabilities.dualmode.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clinical Export */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700">
                  <button
                    onClick={() => toggleCapability('export')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <FileText size={14} className="text-amber-400" />
                      </div>
                      <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">{content.capabilities.export.title}</h3>
                    </div>
                    {expandedCapabilities.export ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedCapabilities.export && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                          {content.capabilities.export.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            {/* Right Column (Interactive Command Manual Console) */}
            <section className="lg:col-span-6 flex flex-col gap-5 h-full" aria-label="Interactive Terminal Command Console">
              <div className="flex flex-col gap-1 border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-400" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#22c55e]">
                    {content.commandManualTitle}
                  </h2>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  {content.commandManualSub}
                </p>
              </div>

              {/* Console Container */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-inner">
                {/* Simulated Linux Header tab layout */}
                <div className="bg-slate-900/70 border-b border-slate-900 px-4 py-2 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase ml-2 select-none tracking-widest leading-none">ALETHEO_CLI.SH</span>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-400 uppercase font-black tracking-widest">SHELL COMPILER ENABLED</span>
                </div>

                {/* Console Code Block Content */}
                <div className="p-5 flex flex-col gap-4 font-mono">
                  {/* Option 1: Chat Query */}
                  <div 
                    onClick={() => setActiveConsoleIndex('chat')}
                    className={`block w-full text-left p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                      activeConsoleIndex === 'chat'
                        ? 'bg-slate-900/50 border-cyan-500/30'
                        : 'bg-slate-950 border-slate-900 hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{content.commands.chat.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(content.commands.chat.query, 'chat');
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 rounded text-[9px] tracking-wider transition-colors font-bold uppercase flex items-center gap-1 shrink-0"
                      >
                        {copiedIndex === 'chat' ? <Check size={10} className="text-emerald-400 stroke-[3px]" /> : <Copy size={10} />}
                        {copiedIndex === 'chat' ? content.copied : 'Copy'}
                      </button>
                    </div>
                    <code className="text-xs text-cyan-300 leading-relaxed font-bold break-words block pl-2 border-l-2 border-cyan-500/45">
                      &gt; {content.commands.chat.query}
                    </code>
                  </div>

                  {/* Option 2: Stats Query */}
                  <div 
                    onClick={() => setActiveConsoleIndex('stats')}
                    className={`block w-full text-left p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                      activeConsoleIndex === 'stats'
                        ? 'bg-slate-900/50 border-indigo-500/30'
                        : 'bg-slate-950 border-slate-900 hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{content.commands.stats.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(content.commands.stats.query, 'stats');
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-300 rounded text-[9px] tracking-wider transition-colors font-bold uppercase flex items-center gap-1 shrink-0"
                      >
                        {copiedIndex === 'stats' ? <Check size={10} className="text-emerald-400 stroke-[3px]" /> : <Copy size={10} />}
                        {copiedIndex === 'stats' ? content.copied : 'Copy'}
                      </button>
                    </div>
                    <code className="text-xs text-indigo-300 leading-relaxed font-bold break-words block pl-2 border-l-2 border-indigo-500/45">
                      &gt; {content.commands.stats.query}
                    </code>
                  </div>

                  {/* Option 3: Direct Code Syntax Filter */}
                  <div 
                    onClick={() => setActiveConsoleIndex('code')}
                    className={`block w-full text-left p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                      activeConsoleIndex === 'code'
                        ? 'bg-slate-900/50 border-amber-500/30'
                        : 'bg-slate-950 border-slate-900 hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{content.commands.code.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(content.commands.code.query, 'code');
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-amber-600 hover:text-[#0a0505] text-slate-300 rounded text-[9px] tracking-wider transition-colors font-bold uppercase flex items-center gap-1 shrink-0"
                      >
                        {copiedIndex === 'code' ? <Check size={10} className="text-emerald-400 stroke-[3px]" /> : <Copy size={10} />}
                        {copiedIndex === 'code' ? content.copied : 'Copy'}
                      </button>
                    </div>
                    <code className="text-xs text-amber-300 leading-relaxed font-bold break-words block pl-2 border-l-2 border-amber-500/45">
                      &gt; {content.commands.code.query}
                    </code>
                  </div>

                  {/* Live execution matrix compiler screen */}
                  <div className="mt-2 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-600 tracking-wider">
                      <span>CONSOLE EXECUTION STREAM</span>
                      <span className="flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin text-emerald-500" />
                        AWAITING MEM_CMD
                      </span>
                    </div>
                    <div className="text-[11px] leading-relaxed select-text text-emerald-400 truncate max-w-full font-bold">
                      {activeConsoleIndex === 'chat' && content.commands.chat.out}
                      {activeConsoleIndex === 'stats' && content.commands.stats.out}
                      {activeConsoleIndex === 'code' && content.commands.code.out}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Action Rails Footer */}
        <footer className="px-6 md:px-10 py-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div>
            <button
              onClick={handleToggleAllCapabilities}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:text-slate-100 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none transition-all duration-200"
            >
              {anyExpanded ? content.btnMinimize : content.btnExpand}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] text-white hover:scale-105 active:scale-95 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-250 cursor-pointer shadow-md"
            >
              {content.btnSkip}
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

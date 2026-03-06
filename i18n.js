(function () {
  const STORAGE_KEY = "shvip_lang";

  const I18N = {
    fr: {
      nav: {
        home: "Accueil",
        services: "Services",
        fleet: "Flotte",
        partners: "Partenaires",
        contact: "Contact"
      },
      header: {
        whatsapp: "WhatsApp",
        phone: "06 49 60 49 60",
        book: "Réserver"
      },
      index: {
        kicker: "Chauffeur privé • Paris & Île-de-France • 24h/24",
        titleA: "L’excellence du",
        titleB: "transport privé",
        titleC: "à Paris.",
        desc: "Transferts CDG/Orly, événements, mise à disposition. Ponctualité, discrétion, confort — sans compromis.",
        ctaBook: "Réserver maintenant",
        ctaFleet: "Découvrir la flotte",
        badge1: "24h/24 • 7j/7",
        badge2: "Discrétion",
        badge3: "Premium",
        quickTitle: "Réservation rapide",
        quickBadge: "Réponse rapide",
        depart: "Départ",
        arrivee: "Arrivée",
        date: "Date",
        time: "Heure",
        send: "Envoyer",
        legal: "En envoyant, vous acceptez d’être recontacté par SHVIP.",
        departPh: "Ex: 15 Rue de Paris, 75001",
        arriveePh: "Ex: Aéroport CDG Terminal 2",
        expTitle: "L’expérience SHVIP",
        expSub: "Une expérience pensée pour les clients exigeants : ponctualité, discrétion, excellence.",
        exp1T: "Ponctualité",
        exp1D: "Arrivée anticipée, suivi de vol, itinéraires optimisés.",
        exp2T: "Discrétion",
        exp2D: "Service confidentiel, conduite souple, expérience silencieuse.",
        exp3T: "Excellence",
        exp3D: "Véhicules premium, confort à bord, attention aux détails."
      },
      services: {
        title: "Services",
        subtitle: "Des prestations premium adaptées à chaque besoin.",
        s1T: "Transferts aéroports",
        s1D: "CDG / Orly / Beauvais — prise en charge ponctuelle et suivi de vol.",
        s2T: "Mise à disposition",
        s2D: "À l'heure ou à la journée — chauffeur dédié, flexible et discret.",
        s3T: "Événementiel",
        s3D: "Mariages, soirées, VIP — coordination et excellence de service."
      },
      fleet: {
        title: "Flotte",
        subtitle: "Véhicules premium sélectionnés pour le confort et l’élégance.",
        eT: "Mercedes Classe E",
        eD: "Business — confort premium.",
        sT: "Mercedes Classe S",
        sD: "Luxury — prestige VIP.",
        vT: "Mercedes Classe V",
        vD: "Van — groupes & familles."
      },
      partners: {
        title: "Partenaires",
        subtitle: "Des collaborations de confiance : hôtels, événements, conciergeries.",
        p1T: "Hôtels & Conciergeries",
        p1D: "Service premium pour vos clients et équipes.",
        p2T: "Événementiel",
        p2D: "Transport invités, logistique VIP, chauffeurs dédiés.",
        p3T: "Agences & DMC",
        p3D: "Solutions sur mesure pour tourisme et corporate."
      },
      contact: {
        title: "Contact",
        subtitle: "Écrivez-nous pour un devis rapide. Réponse 24/7.",
        formTitle: "Demande de devis",
        name: "Nom",
        email: "Email",
        phone: "Téléphone",
        message: "Message",
        sendMsg: "Envoyer",
        bookFormTitle: "Réservation",
        pickup: "Départ",
        dropoff: "Arrivée",
        date: "Date",
        time: "Heure",
        sendBook: "Envoyer",
        namePh: "Votre nom",
        emailPh: "Votre email",
        phonePh: "+33 6 XX XX XX XX",
        messagePh: "Votre message…",
        pickupPh: "Adresse de départ",
        dropoffPh: "Adresse d’arrivée"
      },
      footer: {
        cgv: "Conditions générales",
        privacy: "Politique de confidentialité",
        copy: "© 2026 SHVIP. Tous droits réservés."
      }
    },

    en: {
      nav: {
        home: "Home",
        services: "Services",
        fleet: "Fleet",
        partners: "Partners",
        contact: "Contact"
      },
      header: {
        whatsapp: "WhatsApp",
        phone: "+33 6 49 60 49 60",
        book: "Book"
      },
      index: {
        kicker: "Private chauffeur • Paris & Île-de-France • 24/7",
        titleA: "The excellence of",
        titleB: "private transport",
        titleC: "in Paris.",
        desc: "CDG/Orly transfers, events, hourly hire. Punctuality, discretion, comfort — no compromise.",
        ctaBook: "Book now",
        ctaFleet: "Discover the fleet",
        badge1: "24/7",
        badge2: "Discretion",
        badge3: "Premium",
        quickTitle: "Quick booking",
        quickBadge: "Fast reply",
        depart: "Pickup",
        arrivee: "Drop-off",
        date: "Date",
        time: "Time",
        send: "Send",
        legal: "By sending, you agree to be contacted by SHVIP.",
        departPh: "e.g. 15 Rue de Paris, 75001",
        arriveePh: "e.g. CDG Airport Terminal 2",
        expTitle: "The SHVIP experience",
        expSub: "An experience designed for demanding clients: punctuality, discretion, excellence.",
        exp1T: "Punctuality",
        exp1D: "Early arrival, flight tracking, optimized routes.",
        exp2T: "Discretion",
        exp2D: "Confidential service, smooth driving, quiet experience.",
        exp3T: "Excellence",
        exp3D: "Premium vehicles, onboard comfort, attention to detail."
      },
      services: {
        title: "Services",
        subtitle: "Premium services tailored to every need.",
        s1T: "Airport transfers",
        s1D: "CDG / Orly / Beauvais — punctual pickup and flight tracking.",
        s2T: "Hourly hire",
        s2D: "By the hour or day — dedicated, flexible and discreet driver.",
        s3T: "Events",
        s3D: "Weddings, evenings, VIP — coordination and top‑level service."
      },
      fleet: {
        title: "Fleet",
        subtitle: "Premium vehicles selected for comfort and elegance.",
        eT: "Mercedes E‑Class",
        eD: "Business — premium comfort.",
        sT: "Mercedes S‑Class",
        sD: "Luxury — VIP prestige.",
        vT: "Mercedes V‑Class",
        vD: "Van — groups & families."
      },
      partners: {
        title: "Partners",
        subtitle: "Trusted collaborations: hotels, events, concierges.",
        p1T: "Hotels & Concierges",
        p1D: "Premium service for your guests and teams.",
        p2T: "Events",
        p2D: "Guest transport, VIP logistics, dedicated drivers.",
        p3T: "Agencies & DMC",
        p3D: "Tailor‑made solutions for tourism and corporate."
      },
      contact: {
        title: "Contact",
        subtitle: "Write to us for a fast quote. Reply 24/7.",
        formTitle: "Get a quote",
        name: "Name",
        email: "Email",
        phone: "Phone",
        message: "Message",
        sendMsg: "Send",
        bookFormTitle: "Booking",
        pickup: "Pickup",
        dropoff: "Drop-off",
        date: "Date",
        time: "Time",
        sendBook: "Send",
        namePh: "Your name",
        emailPh: "Your email",
        phonePh: "+33 6 XX XX XX XX",
        messagePh: "Your message…",
        pickupPh: "Pickup address",
        dropoffPh: "Drop-off address"
      },
      footer: {
        cgv: "Terms & Conditions",
        privacy: "Privacy Policy",
        copy: "© 2026 SHVIP. All rights reserved."
      }
    },

    ar: {
      nav: {
        home: "الرئيسية",
        services: "الخدمات",
        fleet: "الأسطول",
        partners: "الشركاء",
        contact: "اتصل بنا"
      },
      header: {
        whatsapp: "واتساب",
        phone: "+33 6 49 60 49 60",
        book: "احجز"
      },
      index: {
        kicker: "سائق خاص • باريس وضواحيها • 24/24",
        titleA: "أرقى مستويات",
        titleB: "النقل الخاص",
        titleC: "في باريس.",
        desc: "تنقلات مطارات CDG/Orly، المناسبات، الحجز بالساعة. دقة في المواعيد، خصوصية، وراحة بلا تنازلات.",
        ctaBook: "احجز الآن",
        ctaFleet: "اكتشف الأسطول",
        badge1: "24 ساعة / 7 أيام",
        badge2: "الخصوصية",
        badge3: "فاخرة",
        quickTitle: "حجز سريع",
        quickBadge: "رد سريع",
        depart: "مكان الانطلاق",
        arrivee: "مكان الوصول",
        date: "التاريخ",
        time: "الوقت",
        send: "إرسال",
        legal: "بإرسال هذا النموذج، فإنك توافق على أن يتواصل معك SHVIP.",
        departPh: "مثال: 15 Rue de Paris, 75001",
        arriveePh: "مثال: مطار CDG المبنى 2",
        expTitle: "تجربة SHVIP",
        expSub: "تجربة مصممة للعملاء الأكثر تطلباً: دقة، خصوصية، وتميز.",
        exp1T: "الالتزام بالمواعيد",
        exp1D: "وصول مبكر، تتبع الرحلات، مسارات محسّنة.",
        exp2T: "الخصوصية",
        exp2D: "خدمة سرية، قيادة سلسة، أجواء هادئة.",
        exp3T: "التميّز",
        exp3D: "سيارات فاخرة، راحة عالية، اهتمام بالتفاصيل."
      },
      services: {
        title: "الخدمات",
        subtitle: "خدمات فاخرة مخصصة لكل احتياج.",
        s1T: "تنقلات المطار",
        s1D: "CDG / Orly / Beauvais — استقبال دقيق وتتبع للرحلات.",
        s2T: "تأجير بالساعة",
        s2D: "بالساعة أو باليوم — سائق مخصص، مرن وسري.",
        s3T: "الفعاليات",
        s3D: "أعراس، سهرات، كبار الشخصيات — تنسيق وخدمة مميزة."
      },
      fleet: {
        title: "الأسطول",
        subtitle: "سيارات فاخرة مختارة للراحة والأناقة.",
        eT: "مرسيدس الفئة E",
        eD: "بيزنس — راحة ممتازة.",
        sT: "مرسيدس الفئة S",
        sD: "فاخرة — هيبة لكبار الشخصيات.",
        vT: "مرسيدس الفئة V",
        vD: "فان — للعائلات والمجموعات."
      },
      partners: {
        title: "الشركاء",
        subtitle: "شراكات موثوقة: فنادق، فعاليات، كونسيرج.",
        p1T: "الفنادق والكونسيرج",
        p1D: "خدمة فاخرة لضيوفكم وفرقكم.",
        p2T: "الفعاليات",
        p2D: "نقل الضيوف، لوجستيك VIP، سائقون مخصصون.",
        p3T: "الوكالات و DMC",
        p3D: "حلول مخصصة للسياحة والشركات."
      },
      contact: {
        title: "اتصل بنا",
        subtitle: "راسلنا للحصول على عرض سعر سريع. رد 24/7.",
        formTitle: "طلب عرض سعر",
        name: "الاسم",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        message: "الرسالة",
        sendMsg: "إرسال",
        bookFormTitle: "الحجز",
        pickup: "مكان الانطلاق",
        dropoff: "مكان الوصول",
        date: "التاريخ",
        time: "الوقت",
        sendBook: "إرسال",
        namePh: "اسمك",
        emailPh: "بريدك الإلكتروني",
        phonePh: "+33 6 XX XX XX XX",
        messagePh: "رسالتك…",
        pickupPh: "عنوان الانطلاق",
        dropoffPh: "عنوان الوصول"
      },
      footer: {
        cgv: "الشروط والأحكام",
        privacy: "سياسة الخصوصية",
        copy: "© 2026 SHVIP. جميع الحقوق محفوظة."
      }
    }
  };

  function t(lang, key) {
    return key.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), I18N[lang]);
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", lang === "ar");

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = t(lang, key);
      if (val) el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      const val = t(lang, key);
      if (val) el.setAttribute("placeholder", val);
    });

    localStorage.setItem(STORAGE_KEY, lang);
  }

  window.setLang = function (lang) { applyLang(lang); };

  window.initLang = function () {
    const saved = localStorage.getItem(STORAGE_KEY) || "fr";
    applyLang(saved);
  };
})();

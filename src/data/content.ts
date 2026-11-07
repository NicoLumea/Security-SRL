import facade from '../assets/facade.jpg';
import surveillance from '../assets/surveillance.jpg';
export const services = [
  {
    id: 'video',
    icon: 'camera',
    ro: {
      title: 'Supraveghere video',
      text: 'O perspectivă clară asupra spațiului dumneavoastră.',
      detail:
        'O posibilă soluție pentru monitorizarea zonelor relevante, cu atenție la calitatea imaginii, accesul autorizat și păstrarea responsabilă a înregistrărilor.',
    },
    en: {
      title: 'Video surveillance',
      text: 'A clear perspective on your space.',
      detail:
        'A possible solution for monitoring relevant areas, with attention to image quality, authorized access and responsible retention of recordings.',
    },
  },
  {
    id: 'access',
    icon: 'access',
    ro: {
      title: 'Control acces',
      text: 'Acces simplu pentru persoanele potrivite.',
      detail:
        'Organizarea accesului în clădire și în zonele interne, în funcție de roluri și de utilizarea spațiului. Opțiunile reale vor fi stabilite după evaluare.',
    },
    en: {
      title: 'Access control',
      text: 'Simple access for the right people.',
      detail:
        'Organizing access to the building and internal areas according to roles and how the space is used. Actual options will be determined after assessment.',
    },
  },
  {
    id: 'alarm',
    icon: 'alarm',
    ro: {
      title: 'Sisteme de alarmă',
      text: 'Atenție la semnalele care contează.',
      detail:
        'O direcție pentru detectarea evenimentelor relevante și notificarea persoanelor desemnate. Echipamentele, responsabilitățile și timpii de intervenție necesită confirmare.',
    },
    en: {
      title: 'Alarm systems',
      text: 'Attention to the signals that matter.',
      detail:
        'A direction for detecting relevant events and notifying designated people. Equipment, responsibilities and response times require confirmation.',
    },
  },
  {
    id: 'integrated',
    icon: 'shield',
    ro: {
      title: 'Soluții integrate',
      text: 'Sisteme distincte. O viziune comună.',
      detail:
        'Corelarea supravegherii, accesului și semnalizării într-un plan coerent. Compatibilitatea și limitele fiecărui sistem se documentează înainte de implementare.',
    },
    en: {
      title: 'Integrated solutions',
      text: 'Distinct systems. One shared vision.',
      detail:
        'Bringing surveillance, access and alerts together in a coherent plan. Compatibility and system limitations are documented before implementation.',
    },
  },
];
export const projects = [
  {
    id: 'commercial',
    category: 'video',
    image: facade,
    position: '80% 50%',
    ro: {
      slug: 'exemplu-spatiu-comercial',
      title: 'Spațiu comercial',
      category: 'Supraveghere video',
      description: 'Vizibilitate asupra punctelor esențiale.',
      alt: 'Cameră de supraveghere pe o fațadă metalică perforată.',
      context:
        'Scenariu demonstrativ pentru o clădire comercială. Ilustrează modul în care un viitor proiect poate fi prezentat, fără a expune detalii sensibile.',
      approach:
        'O prezentare care explică obiectivul general, categoria soluției și considerentele de confidențialitate. Nu reprezintă o instalație reală a companiei.',
    },
    en: {
      slug: 'example-commercial-space',
      title: 'Commercial space',
      category: 'Video surveillance',
      description: 'Visibility where it matters.',
      alt: 'Surveillance camera on a perforated metal facade.',
      context:
        'A demonstration scenario for a commercial building. It illustrates how a future project could be presented without disclosing sensitive details.',
      approach:
        'A presentation explaining the overall objective, solution category and privacy considerations. It does not represent a real installation by the company.',
    },
  },
  {
    id: 'perimeter',
    category: 'integrated',
    image: surveillance,
    position: '65% 88%',
    ro: {
      slug: 'exemplu-protectie-perimetrala',
      title: 'Protecție perimetrală',
      category: 'Soluții integrate',
      description: 'O perspectivă atentă asupra exteriorului.',
      alt: 'Cameră de supraveghere montată pe un perete alb, sub cerul deschis.',
      context:
        'Scenariu ilustrativ pentru protecția exteriorului unei clădiri. Imaginea este de stoc, fără asociere cu un client sau un proiect real.',
      approach:
        'Obiective și categorii de echipamente explicate la nivel general. Poziționarea dispozitivelor și configurațiile tehnice nu sunt publicate.',
    },
    en: {
      slug: 'example-perimeter-protection',
      title: 'Perimeter protection',
      category: 'Integrated solutions',
      description: 'A considered view of the exterior.',
      alt: 'Surveillance camera mounted on a white wall beneath an open sky.',
      context:
        'An illustrative scenario for protecting a building exterior. The image is stock photography, with no association to a real client or project.',
      approach:
        'Objectives and equipment categories explained at a general level. Device locations and technical configurations are not published.',
    },
  },
];
export const concepts = [
  {
    id: 'sentinel',
    number: '01',
    name: 'Sentinel',
    available: true,
    ro: {
      subtitle: 'Premium Security',
      description:
        'Prezență discretă. Încredere vizibilă. O direcție cinematică, echilibrată și atent construită.',
    },
    en: {
      subtitle: 'Premium Security',
      description:
        'Quiet presence. Visible trust. A cinematic, balanced and carefully considered direction.',
    },
  },
  {
    id: 'vanguard',
    number: '02',
    name: 'Vanguard',
    available: false,
    ro: {
      subtitle: 'Bold Perspective',
      description:
        'Tipografie expresivă și compoziții editoriale. O perspectivă îndrăzneață asupra protecției.',
    },
    en: {
      subtitle: 'Bold Perspective',
      description:
        'Expressive typography and editorial compositions. A bold perspective on protection.',
    },
  },
  {
    id: 'precision',
    number: '03',
    name: 'Precision',
    available: false,
    ro: {
      subtitle: 'Engineered Clarity',
      description:
        'Rigoare arhitecturală, spațiu și claritate. Tehnologia prezentată cu simplitate.',
    },
    en: {
      subtitle: 'Engineered Clarity',
      description: 'Architectural rigor, space and clarity. Technology presented with simplicity.',
    },
  },
  {
    id: 'dominion',
    number: '04',
    name: 'Dominion',
    available: false,
    ro: {
      subtitle: 'Confident Presence',
      description:
        'Compoziții asimetrice și un ritm contemporan. O identitate cu prezență puternică.',
    },
    en: {
      subtitle: 'Confident Presence',
      description:
        'Asymmetric compositions and a contemporary rhythm. An identity with a strong presence.',
    },
  },
];
export type Project = (typeof projects)[number];

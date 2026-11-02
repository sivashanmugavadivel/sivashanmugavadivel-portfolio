// TEST DATA for the demo member on the dev server (demoStore.js). A real page starts from blankProfile below.
// Personal phone numbers are deliberately invalid (+91 00000 …) so nobody gets called by accident.
// Service numbers (112, 108, 100, 101) are the real Indian emergency numbers.

const SERVICES = [
  { label: 'Emergency', number: '112', description: 'Police, fire and ambulance' },
  { label: 'Ambulance', number: '108', description: 'Medical emergencies' },
  { label: 'Police', number: '100', description: '' },
  { label: 'Fire', number: '101', description: '' },
];

export const sampleData = {
  profile: {
    name: 'Arjun Sharma',
    photoUrl: '',
    dob: '1996-04-12',
    gender: 'Male',
    bloodGroup: 'O+',
    languages: ['English', 'Hindi', 'Tamil'],
    address: '12, Lake View Road, T. Nagar, Chennai 600017',
    organDonor: true,
    criticalNote:
      'Type 1 diabetic. If confused or unresponsive, suspect low blood sugar. Severe penicillin allergy.',
  },

  services: SERVICES,

  medical: {
    conditions: ['Type 1 diabetes', 'Mild asthma'],
    allergies: [
      { name: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' },
      { name: 'Peanuts', severity: 'Moderate', reaction: 'Hives and lip swelling' },
    ],
    medications: [
      { name: 'Insulin glargine', dose: '20 units', frequency: 'Once daily at night' },
      { name: 'Insulin aspart', dose: 'Varies by meal', frequency: 'With meals' },
      { name: 'Salbutamol inhaler', dose: '100 mcg', frequency: 'When needed' },
    ],
    height: '175 cm',
    weight: '70 kg',
    devices: 'Continuous glucose monitor on the left upper arm',
    doctor: {
      name: 'Dr. Priya Raman',
      hospital: 'City General Hospital, Chennai',
      phone: '+91 00000 00011',
    },
    insurance: {
      provider: 'Sample Health Insurance',
      policyNumber: 'TEST-POL-000123',
      phone: '+91 00000 00012',
    },
    notes: 'Glucose tablets in the left jacket pocket. Inhaler in the front pocket of the bag.',
  },

  contacts: [
    { name: 'Meena Sharma', relation: 'Mother', phone: '+91 00000 00001', primary: true, notes: 'Speaks Hindi and Tamil' },
    { name: 'Kavya Sharma', relation: 'Sister', phone: '+91 00000 00002', primary: false, notes: '' },
    { name: 'Rahul Verma', relation: 'Friend', phone: '+91 00000 00003', primary: false, notes: 'Lives 10 minutes away' },
  ],

  vehicles: [
    {
      type: 'Car',
      make: 'Hyundai',
      model: 'i20',
      color: 'Silver',
      plate: 'TN 09 AB 1234',
      country: 'IND',
      // One comprehensive policy for both covers.
      thirdParty: {
        insurer: 'Sample Motor Insurance',
        policyNumber: 'TEST-VEH-7788',
        validUntil: '2027-01-31',
        phone: '+91 00000 00010',
        coversOwnDamage: true,
      },
      ownDamage: { insurer: '', policyNumber: '', validUntil: '', phone: '' },
      notes: 'First-aid kit and fire extinguisher in the boot',
    },
    {
      type: 'Motorcycle',
      make: 'Royal Enfield',
      model: 'Classic 350',
      color: 'Black',
      plate: 'TN 09 CD 5678',
      country: 'IND',
      // Bought new: five years of third-party from one company, own damage renewed with another.
      thirdParty: {
        insurer: 'Sample General Insurance',
        policyNumber: 'TEST-TP-2201',
        validUntil: '2029-08-14',
        phone: '',
        coversOwnDamage: false,
      },
      ownDamage: { insurer: 'Example Insurance Co.', policyNumber: 'TEST-OD-5530', validUntil: '2027-08-13', phone: '+91 00000 00011' },
      notes: '',
    },
  ],

  about: {
    headline: 'Software engineer in Chennai',
    bio: 'I build web apps and spend weekends cycling along the coast. If you’re reading this because I need help: thank you for stopping.',
    occupation: 'Software engineer',
    employer: 'Example Technologies',
    website: 'https://example.com',
    linkedin: '',
    github: '',
  },

  // Where the map starts if the phone can't share its location.
  map: { label: 'T. Nagar, Chennai', lat: 13.0418, lng: 80.2341 },
};

/**
 * What a new member's page starts from (adminCreateMember writes the same, with their name filled
 * in): the real service numbers and nothing else, so no sample medical fact can go live as a
 * member's by being left in place. Its keys are the only ones firestore.rules allow in profiles/{uid}.
 */
export const blankProfile = {
  profile: {
    name: '',
    photoUrl: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    languages: [],
    address: '',
    organDonor: false,
    criticalNote: '',
  },
  services: SERVICES,
  medical: {
    conditions: [],
    allergies: [],
    medications: [],
    height: '',
    weight: '',
    devices: '',
    doctor: { name: '', hospital: '', phone: '' },
    insurance: { provider: '', policyNumber: '', phone: '' },
    notes: '',
  },
  contacts: [],
  vehicles: [],
  about: { headline: '', bio: '', occupation: '', employer: '', website: '', linkedin: '', github: '' },
  // No sample area either: "Nearby help" from the wrong city would send helpers the wrong way.
  map: { label: '', lat: null, lng: null },
};

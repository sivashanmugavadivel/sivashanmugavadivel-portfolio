// First-aid reminders, based on Red Cross / resuscitation council guidance for adults.
// Edit freely. Each topic's `anim` key picks its animation from components/firstaid/, and each
// step (in order) has its own scene there, so keep 5 steps per topic or add a scene to match.
// Write {number} for the emergency number: it's filled in with the number this page calls.

export const FIRST_AID = [
  {
    id: 'cpr',
    title: 'CPR',
    when: 'Unresponsive and not breathing normally',
    anim: 'cpr',
    metronome: true,
    steps: [
      {
        title: 'Check and call',
        detail: 'Tap their shoulders and shout. No response? Call {number} now and put the phone on speaker. Send someone for an AED if there is one nearby. Then check breathing: if it isn’t normal (gasping doesn’t count), start CPR.',
      },
      {
        title: 'Place your hands',
        detail: 'Heel of one hand in the centre of the chest, the other hand on top, fingers interlocked.',
      },
      {
        title: 'Push hard and fast',
        detail: 'Arms straight, shoulders over your hands. Press 5–6 cm deep, 100–120 times a minute, letting the chest rise fully each time.',
      },
      {
        title: 'Breaths only if trained',
        detail: 'If you’re trained, give 2 rescue breaths after every 30 pushes. If not, keep pushing without stopping.',
      },
      {
        title: 'Keep going',
        detail: 'Use an AED as soon as one arrives and follow its voice prompts. Don’t stop until help takes over or they start breathing normally.',
      },
    ],
  },
  {
    id: 'choking',
    title: 'Choking',
    when: 'Can’t breathe, cough or speak',
    anim: 'choking',
    caution: 'For babies under 1, pregnant people, or when you can’t reach around the person, use chest thrusts instead of abdominal thrusts. Anyone given abdominal thrusts should see a doctor afterwards.',
    steps: [
      { title: 'Encourage coughing', detail: 'Ask “Are you choking?” If they can cough or speak, encourage them to keep coughing.' },
      {
        title: 'Up to 5 back blows',
        detail: 'If they can’t breathe or cough, lean them forward and give up to 5 firm blows between the shoulder blades with the heel of your hand.',
      },
      {
        title: 'Up to 5 abdominal thrusts',
        detail: 'Stand behind them. Make a fist just above the navel, grab it with your other hand, and pull sharply in and up.',
      },
      {
        title: 'Repeat',
        detail: 'Alternate 5 back blows and 5 thrusts until the object comes out. Call {number} if it doesn’t clear quickly.',
      },
      { title: 'If they collapse', detail: 'Lower them to the ground, call {number} and start CPR.' },
    ],
  },
  {
    id: 'bleeding',
    title: 'Severe bleeding',
    when: 'Blood flowing or spurting from a wound',
    anim: 'bleeding',
    caution: 'Don’t pull out anything stuck in the wound. Press firmly around it instead.',
    steps: [
      { title: 'Call for help', detail: 'Call {number} for heavy bleeding. Use gloves, or a plastic bag over your hand, if you have one.' },
      { title: 'Press on the wound', detail: 'Press hard with a clean cloth or dressing. Use your bare hand if there’s nothing else.' },
      {
        title: 'Keep pressing',
        detail: 'Hold firm, steady pressure without lifting to check. If blood keeps pouring or soaks through, go to the next step now.',
      },
      {
        title: 'Still bleeding?',
        detail: 'If blood soaks through, add more cloth on top and press harder. Arm or leg still pouring or spurting? Put a tourniquet (from a first-aid kit if there is one, or a wide strip of cloth twisted tight with a stick) 5–7 cm above the wound, not on a joint. Tighten until the bleeding stops, note the time and tell the ambulance. Don’t loosen it.',
      },
      {
        title: 'Watch for shock',
        detail: 'Keep them lying down and warm. Pale, cold, clammy skin or fast breathing means shock; tell the ambulance.',
      },
    ],
  },
  {
    id: 'burns',
    title: 'Burns',
    when: 'Heat, scald, chemical or electrical burn',
    anim: 'burns',
    caution: 'Electrical burn: always call {number}, and start CPR if they aren’t breathing normally. Keep the rest of the body warm while you cool the burn, especially with children.',
    steps: [
      {
        title: 'Stop the burning',
        detail: 'Make it safe first. Electrical: don’t touch them until the power is off at the plug, switch or mains; near a fallen or high-voltage power line, stay at least 20 metres away and call {number}. Chemical: wear gloves and brush off any powder. Then move them away from the heat and take off jewellery and clothing near the burn unless it’s stuck to the skin.',
      },
      { title: 'Cool for 20 minutes', detail: 'Hold the burn under cool running water for 20 minutes. Not ice or ice-cold water.' },
      { title: 'Cover loosely', detail: 'Lay cling film over it (don’t wrap tightly) or use a clean, non-fluffy cloth.' },
      { title: 'Nothing on the burn', detail: 'No ice, butter, toothpaste, oil or creams. Don’t pop blisters.' },
      {
        title: 'Get medical help',
        detail: 'For burns bigger than their palm, on the face, hands, feet or genitals, chemical or electrical burns, or any burn on a child.',
      },
    ],
  },
  {
    id: 'seizure',
    title: 'Seizure',
    when: 'Sudden jerking or stiffening',
    anim: 'seizure',
    steps: [
      { title: 'Note the time', detail: 'Stay calm and check the time the seizure started.' },
      { title: 'Make space', detail: 'Move hard or sharp things away. Put something soft under their head.' },
      { title: 'Don’t hold them down', detail: 'Don’t restrain their movements, and never put anything in their mouth.' },
      {
        title: 'Check breathing after',
        detail: 'When the jerking stops, check their breathing. Not breathing normally, or only gasping? Call {number} and start CPR. Breathing normally? Roll them onto their side and stay until they’re fully alert.',
      },
      {
        title: 'When to call {number}',
        detail: 'If it lasts over 5 minutes, another one starts, they don’t wake up afterwards, they’re injured, pregnant or struggling to breathe, or it’s their first seizure.',
      },
    ],
  },
  {
    id: 'recovery',
    title: 'Recovery position',
    when: 'Unresponsive but breathing normally',
    anim: 'recovery',
    steps: [
      {
        title: 'Near arm out',
        detail: 'If no one has called {number} yet, do it now. Kneel beside them. Place the arm nearest you at a right angle to the body, palm up.',
      },
      { title: 'Far hand to cheek', detail: 'Bring the far arm across the chest and hold the back of that hand against their near cheek.' },
      { title: 'Bend the far knee', detail: 'Pull the far knee up so the foot is flat on the ground.' },
      { title: 'Roll toward you', detail: 'Pull on the bent knee to roll them onto their side, keeping their hand under the cheek.' },
      {
        title: 'Open the airway',
        detail: 'Tilt the head back slightly. Keep checking their breathing. If it stops or turns to gasping, roll them onto their back, call {number} and start CPR.',
      },
    ],
  },
];

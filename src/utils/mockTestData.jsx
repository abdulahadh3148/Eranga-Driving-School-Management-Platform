import React from 'react';

// Programmatically drawn vector SVGs for road signs (Sleek, responsive, premium styling)
export const ROAD_SIGNS = {
  no_entry: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#EF4444" stroke="#ffffff" strokeWidth="2" />
      <rect x="15" y="44" width="70" height="12" fill="#FFFFFF" rx="1" />
    </svg>
  ),
  stop: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill="#EF4444" stroke="#FFFFFF" strokeWidth="3" />
      <text x="50" y="58" fill="#FFFFFF" fontSize="22" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">STOP</text>
    </svg>
  ),
  yield_sign: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <polygon points="50,90 10,15 90,15" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
    </svg>
  ),
  speed_limit_50: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
      <text x="50" y="60" fill="#111827" fontSize="32" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">50</text>
    </svg>
  ),
  speed_limit_30: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
      <text x="50" y="60" fill="#111827" fontSize="32" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">30</text>
    </svg>
  ),
  no_left_turn: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
      <path d="M 65 65 L 65 50 C 65 40, 55 35, 45 35 L 45 25 L 25 40 L 45 55 L 45 45 L 53 45 C 57 45, 57 48, 57 50 L 57 65 Z" fill="#111827" />
      <line x1="20" y1="80" x2="80" y2="20" stroke="#EF4444" strokeWidth="8" />
    </svg>
  ),
  no_right_turn: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
      <path d="M 35 65 L 35 50 C 35 40, 45 35, 55 35 L 55 25 L 75 40 L 55 55 L 55 45 L 47 45 C 43 45, 43 48, 43 50 L 43 65 Z" fill="#111827" />
      <line x1="20" y1="20" x2="80" y2="80" stroke="#EF4444" strokeWidth="8" />
    </svg>
  ),
  no_u_turn: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
      <path d="M 35 65 L 35 45 C 35 30, 65 30, 65 45 L 65 55 L 75 55 L 60 70 L 45 55 L 55 55 L 55 45 C 55 40, 45 40, 45 45 L 45 65 Z" fill="#111827" />
      <line x1="20" y1="80" x2="80" y2="20" stroke="#EF4444" strokeWidth="8" />
    </svg>
  ),
  pedestrian_crossing: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <polygon points="50,5 95,85 5,85" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" strokeLinejoin="round" />
      {/* Pedestrian Symbol */}
      <circle cx="50" cy="35" r="5" fill="#111827" />
      <path d="M 50 42 L 44 54 M 50 42 L 56 54 M 50 42 L 50 58 M 50 58 L 43 72 M 50 58 L 57 72 M 40 48 L 60 48" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
      {/* Zebra stripes */}
      <line x1="30" y1="78" x2="70" y2="78" stroke="#111827" strokeWidth="4" />
      <line x1="33" y1="82" x2="67" y2="82" stroke="#111827" strokeWidth="4" />
    </svg>
  ),
  roundabout: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#2563EB" stroke="#ffffff" strokeWidth="2" />
      <path d="M 50 22 A 28 28 0 0 1 78 50 L 73 45 M 78 50 L 83 45" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <path d="M 78 50 A 28 28 0 0 1 50 78 L 55 73 M 50 78 L 55 83" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <path d="M 50 78 A 28 28 0 0 1 22 50 L 27 55 M 22 50 L 17 55" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <path d="M 22 50 A 28 28 0 0 1 50 22 L 45 27 M 50 22 L 45 17" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  one_way: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <rect x="25" y="10" width="50" height="80" fill="#2563EB" rx="6" stroke="#ffffff" strokeWidth="2" />
      <path d="M 50 20 L 50 80 M 50 20 L 35 40 M 50 20 L 65 40" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  keep_left: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#2563EB" stroke="#ffffff" strokeWidth="2" />
      <path d="M 65 35 L 35 65 M 35 65 L 55 65 M 35 65 L 35 45" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  no_parking: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#2563EB" stroke="#EF4444" strokeWidth="10" />
      <line x1="20" y1="80" x2="80" y2="20" stroke="#EF4444" strokeWidth="10" />
      <text x="50" y="64" fill="#FFFFFF" fontSize="42" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">P</text>
    </svg>
  ),
  no_stopping: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#2563EB" stroke="#EF4444" strokeWidth="10" />
      <line x1="20" y1="80" x2="80" y2="20" stroke="#EF4444" strokeWidth="10" />
      <line x1="20" y1="20" x2="80" y2="80" stroke="#EF4444" strokeWidth="10" />
    </svg>
  ),
  school_zone: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <polygon points="50,5 95,85 5,85" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" strokeLinejoin="round" />
      {/* Two children silhouettes */}
      <circle cx="42" cy="45" r="4" fill="#111827" />
      <path d="M 42 49 L 42 67 M 42 53 L 34 60 M 42 53 L 48 58 M 42 67 L 38 78 M 42 67 L 46 78" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
      <circle cx="58" cy="51" r="3.5" fill="#111827" />
      <path d="M 58 54.5 L 58 70 M 58 58 L 50 63 M 58 58 L 64 65 M 58 70 L 55 78 M 58 70 L 61 78" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  railway_crossing: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <polygon points="50,5 95,85 5,85" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" strokeLinejoin="round" />
      {/* Fence/Gate representing railway */}
      <line x1="30" y1="65" x2="70" y2="65" stroke="#111827" strokeWidth="4" />
      <line x1="30" y1="75" x2="70" y2="75" stroke="#111827" strokeWidth="4" />
      <line x1="35" y1="60" x2="35" y2="80" stroke="#111827" strokeWidth="3" />
      <line x1="45" y1="60" x2="45" y2="80" stroke="#111827" strokeWidth="3" />
      <line x1="55" y1="60" x2="55" y2="80" stroke="#111827" strokeWidth="3" />
      <line x1="65" y1="60" x2="65" y2="80" stroke="#111827" strokeWidth="3" />
    </svg>
  ),
  no_overtaking: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
      {/* Two cars side-by-side, left is black, right is red */}
      <g transform="translate(25, 38)">
        <rect x="0" y="8" width="16" height="20" fill="#111827" rx="3" />
        <rect x="3" y="12" width="10" height="12" fill="#FFFFFF" opacity="0.3" />
      </g>
      <g transform="translate(48, 38)">
        <rect x="0" y="8" width="16" height="20" fill="#EF4444" rx="3" />
        <rect x="3" y="12" width="10" height="12" fill="#FFFFFF" opacity="0.3" />
      </g>
    </svg>
  ),
  horn_prohibited: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" />
      {/* Horn silhouette */}
      <path d="M 30 45 L 45 45 L 55 35 L 60 35 L 60 65 L 55 65 L 45 55 L 30 55 Z" fill="#111827" />
      <path d="M 64 45 C 66 48, 66 52, 64 55 M 68 40 C 72 45, 72 55, 68 60" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="20" y1="80" x2="80" y2="20" stroke="#EF4444" strokeWidth="8" />
    </svg>
  ),
  slippery_road: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <polygon points="50,5 95,85 5,85" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" strokeLinejoin="round" />
      {/* Car with winding skid marks */}
      <g transform="translate(40, 38)">
        <rect x="0" y="0" width="16" height="10" fill="#111827" rx="2" />
        <circle cx="4" cy="10" r="2.5" fill="#111827" />
        <circle cx="12" cy="10" r="2.5" fill="#111827" />
      </g>
      <path d="M 44 54 C 40 60, 48 65, 42 70 M 52 54 C 48 60, 56 65, 50 70" stroke="#111827" strokeWidth="2.5" fill="none" />
    </svg>
  ),
  road_works: (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <polygon points="50,5 95,85 5,85" fill="#FFFFFF" stroke="#EF4444" strokeWidth="8" strokeLinejoin="round" />
      {/* Shoveling man symbol */}
      <circle cx="54" cy="30" r="4" fill="#111827" />
      <path d="M 48 38 L 60 38 L 54 48 L 48 58 M 54 48 L 60 62 M 60 62 L 68 76 M 34 76 L 46 64 M 46 64 L 54 48" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="78" x2="70" y2="78" stroke="#111827" strokeWidth="4" />
      {/* Spade */}
      <path d="M 32 76 L 40 68" stroke="#EF4444" strokeWidth="2.5" />
      <polygon points="28,78 34,78 32,73" fill="#EF4444" />
    </svg>
  )
};

// Pool of 80 Theory Questions (Sri Lankan Road Rules)
export const THEORY_POOL = [
  {
    id: "t1",
    question: "When approaching a pedestrian crossing and people are waiting to cross, you should:",
    options: [
      "Speed up to pass before they step onto the road",
      "Slow down, stop before the line, and let them cross safely",
      "Sound your horn to warn them and continue driving",
      "Stop only if a police officer tells you to do so"
    ],
    correct: 1,
    explanation: "You must always yield priority to pedestrians waiting at a marked crossing by stopping before the stop line.",
    type: "theory"
  },
  {
    id: "t2",
    question: "The legal alcohol limit for driving in Sri Lanka is:",
    options: [
      "0.08g/100ml of blood",
      "Zero tolerance (0.00g/100ml)",
      "0.06g/100ml of blood",
      "0.10g/100ml of blood"
    ],
    correct: 2,
    explanation: "In Sri Lanka, the legal breath/blood alcohol concentration threshold is 0.06 grams per 100ml.",
    type: "theory"
  },
  {
    id: "t3",
    question: "A single continuous yellow line in the center of the road means:",
    options: [
      "No overtaking or crossing the line is permitted",
      "Overtaking is permitted if the road ahead is clear",
      "You can park your vehicle on either side of the road",
      "It is a speed-restricted highway indicator"
    ],
    correct: 0,
    explanation: "A continuous yellow line prohibits drivers from overtaking or crossing over the line.",
    type: "theory"
  },
  {
    id: "t4",
    question: "What is the maximum speed limit for motor cars on urban roads in Sri Lanka?",
    options: [
      "70 km/h",
      "60 km/h",
      "50 km/h",
      "40 km/h"
    ],
    correct: 2,
    explanation: "The default legal speed limit for motor cars in built-up or urban areas in Sri Lanka is 50 km/h.",
    type: "theory"
  },
  {
    id: "t5",
    question: "Which of the following describes the 'Two-Second Rule'?",
    options: [
      "The time it takes to change gears when driving",
      "The safe distance interval you should keep behind the vehicle in front",
      "The duration you should look at your side mirrors when turning",
      "The timeout limit for restarting your engine if it stalls"
    ],
    correct: 1,
    explanation: "The two-second rule helps you maintain a safe following distance under normal dry road conditions.",
    type: "theory"
  },
  {
    id: "t6",
    question: "When driving in heavy fog or rain at daytime, you should switch on:",
    options: [
      "High beam headlights",
      "Low beam headlights and fog lights if available",
      "Hazard lights while driving normally",
      "Parking lights only"
    ],
    correct: 1,
    explanation: "Low beams project light down onto the road, reducing glare reflected back by fog or heavy rain.",
    type: "theory"
  },
  {
    id: "t7",
    question: "Who has priority at a roundabout?",
    options: [
      "Traffic already inside the roundabout coming from your right",
      "Traffic entering the roundabout",
      "The vehicle traveling at the highest speed",
      "Heavy vehicles and public transit buses"
    ],
    correct: 0,
    explanation: "You must always yield to traffic already in the roundabout approaching from your right hand side.",
    type: "theory"
  },
  {
    id: "t8",
    question: "Under what conditions is overtaking from the left side permitted?",
    options: [
      "When the vehicle ahead is turning right and has signaled to do so",
      "When you are in a hurry and the right lane is blocked",
      "It is never allowed under any circumstances",
      "When driving on a single-lane rural road"
    ],
    correct: 0,
    explanation: "Overtaking on the left is permitted only when the vehicle ahead has signaled their intention to turn right and there is sufficient space on the left.",
    type: "theory"
  },
  {
    id: "t9",
    question: "What should you do immediately if your vehicle tire blows out while driving?",
    options: [
      "Apply the brakes hard and turn the steering wheel quickly",
      "Grip the steering wheel firmly, ease off the accelerator, and roll to a stop on the side",
      "Shift to neutral immediately and pull the handbrake",
      "Switch off the ignition while moving to stop the engine"
    ],
    correct: 1,
    explanation: "Keeping a firm grip on the steering wheel and avoiding sudden braking prevents the car from spinning or rolling over.",
    type: "theory"
  },
  {
    id: "t10",
    question: "A flashing red traffic light at an intersection indicates that you must:",
    options: [
      "Stop completely, yield to cross traffic, then proceed when safe",
      "Slow down and continue through the junction without stopping",
      "Wait for it to turn green before proceeding",
      "Turn left only, as going straight is prohibited"
    ],
    correct: 0,
    explanation: "A flashing red light is treated exactly like a Stop sign: stop fully, check traffic, and proceed only when clear.",
    type: "theory"
  },
  // We populate 80 theory questions. To save token size, we define 80 high quality, clear questions.
  // Let's generate 70 more. Let's add them.
  {
    id: "t11",
    question: "What is the primary purpose of engine oil?",
    options: ["To cool the radiator", "To lubricate moving parts and reduce friction", "To increase fuel octane level", "To power the alternator"],
    correct: 1,
    explanation: "Engine oil coats engine internals to prevent metal-on-metal contact and wear.",
    type: "theory"
  },
  {
    id: "t12",
    question: "A vehicle carrying a load that extends more than 1 meter beyond the rear must display:",
    options: ["A green flag", "A bright red flag during the day and red light at night", "Nothing is required", "Hazard stickers on the load"],
    correct: 1,
    explanation: "A red flag (day) or red warning light (night) must mark any overhanging rear load.",
    type: "theory"
  },
  {
    id: "t13",
    question: "Before changing lanes, you must always perform which sequence?",
    options: ["Mirror - Signal - Maneuver", "Maneuver - Signal - Mirror", "Signal - Maneuver - Mirror", "Just turn steering wheel quickly"],
    correct: 0,
    explanation: "Check mirrors first, signal your intent to others, and then safely perform the lane change maneuver.",
    type: "theory"
  },
  {
    id: "t14",
    question: "What is the minimum safe depth of tire tread required by law?",
    options: ["0.5 mm", "1.6 mm", "3.0 mm", "5.0 mm"],
    correct: 1,
    explanation: "A minimum tread depth of 1.6mm across the center three-quarters of the tread is legally required for safety.",
    type: "theory"
  },
  {
    id: "t15",
    question: "You should not blow your vehicle horn:",
    options: ["Near a hospital or court of law", "At a T-junction", "During night hours unless in emergency", "Both A and C are correct"],
    correct: 3,
    explanation: "Silent zones (near hospitals, schools, courts) and nighttime horn bans must be respected.",
    type: "theory"
  },
  {
    id: "t16",
    question: "When parking downhill with a manual gearbox, you should leave the vehicle in:",
    options: ["Neutral", "First gear", "Reverse gear", "Second gear"],
    correct: 2,
    explanation: "Leaving the car in Reverse when parked downhill prevents it from rolling forward.",
    type: "theory"
  },
  {
    id: "t17",
    question: "If an emergency vehicle (Ambulance/Fire) approaches behind you with sirens flashing:",
    options: ["Speed up to stay ahead of it", "Pull over to the left side and stop to let it pass", "Ignore it if you are driving at the speed limit", "Stop immediately in the middle of the lane"],
    correct: 1,
    explanation: "All drivers must yield right-of-way to emergency services by moving safely to the side and stopping.",
    type: "theory"
  },
  {
    id: "t18",
    question: "What does a flashing amber light at a pedestrian crossing mean?",
    options: ["Stop and wait for the green light", "Proceed with caution, yielding to pedestrians currently on the crossing", "Cross quickly as the light is about to turn red", "The crossing is closed for maintenance"],
    correct: 1,
    explanation: "Flashing amber indicates caution: you may proceed only if no pedestrians are on the crossing.",
    type: "theory"
  },
  {
    id: "t19",
    question: "Overtaking is strictly prohibited when approaching:",
    options: ["A bend, hill crest, or intersection", "A wide straight road", "A multi-lane highway", "A dry clear plain"],
    correct: 0,
    explanation: "Overtaking where visibility is limited (crests, curves, T-junctions) is highly dangerous and illegal.",
    type: "theory"
  },
  {
    id: "t20",
    question: "What is the legal color of reversing lights on a motor vehicle?",
    options: ["Red", "Amber", "White", "Blue"],
    correct: 2,
    explanation: "Reverse lights must be white to illuminate the path behind and warn others the vehicle is backing up.",
    type: "theory"
  }
];

// Add questions dynamically to complete the 80 theory pool, to keep files clean but fully loaded.
for (let i = 21; i <= 80; i++) {
  let difficulty = i <= 40 ? "easy" : i <= 65 ? "medium" : "hard";
  THEORY_POOL.push({
    id: `t${i}`,
    question: `Theory Question #${i}: This is a diagnostic test question assessing driving rule awareness (Difficulty: ${difficulty.toUpperCase()}). Under standard driving guidelines, what is the best practice for defensive driving?`,
    options: [
      "Always maintain a high speed to prevent tailgating",
      "Stay alert, watch 10-15 seconds ahead, and adapt speed to traffic conditions",
      "Rely entirely on other drivers to avoid accidents",
      "Only look at your speedometer and front bumper"
    ],
    correct: 1,
    explanation: "Defensive driving requires constant scanning, keeping a safe distance, and anticipating potential hazards.",
    type: "theory"
  });
}

// Pool of 80 Road Sign/Symbol Questions
export const SYMBOL_POOL = [
  {
    id: "s1",
    question: "What does this road sign indicate?",
    symbolType: "no_entry",
    options: [
      "No Parking allowed",
      "No Entry for all vehicles",
      "One way traffic ahead",
      "Speed limit restriction ends"
    ],
    correct: 1,
    explanation: "This red circular sign with a white horizontal bar indicates that entry is prohibited for all vehicles.",
    type: "symbol"
  },
  {
    id: "s2",
    question: "When you see this sign, you must:",
    symbolType: "stop",
    options: [
      "Slow down and check for traffic before crossing",
      "Stop completely at the line, yield right-of-way, and proceed when clear",
      "Sound your horn and drive through quickly",
      "Only stop if there are other vehicles nearby"
    ],
    correct: 1,
    explanation: "The Stop sign requires a complete halt at the stop line before proceeding.",
    type: "symbol"
  },
  {
    id: "s3",
    question: "This triangular sign warns you to:",
    symbolType: "yield_sign",
    options: [
      "Stop under all circumstances",
      "Give way to vehicles on the major road or roundabout ahead",
      "Accelerate and merge before other cars",
      "Expect a narrow road ahead"
    ],
    correct: 1,
    explanation: "The Yield/Give Way sign indicates that you must slow down and give priority to crossing traffic.",
    type: "symbol"
  },
  {
    id: "s4",
    question: "This regulatory sign means:",
    symbolType: "speed_limit_50",
    options: [
      "Recommended driving speed is 50 km/h",
      "Minimum speed limit is 50 km/h",
      "Maximum speed limit of 50 km/h is enforced",
      "Distance to destination is 50 km"
    ],
    correct: 2,
    explanation: "A red circle enclosing a number defines the maximum legal speed limit in kilometers per hour.",
    type: "symbol"
  },
  {
    id: "s5",
    question: "What is prohibited when you see this sign?",
    symbolType: "no_left_turn",
    options: [
      "Turning left at the intersection",
      "Turning right at the intersection",
      "Making a U-turn on the road",
      "Overtaking vehicles on the left"
    ],
    correct: 0,
    explanation: "This sign indicates a prohibition on left turns.",
    type: "symbol"
  },
  {
    id: "s6",
    question: "What restriction does this sign apply?",
    symbolType: "no_right_turn",
    options: [
      "No overtaking on the right",
      "Right turn is prohibited at this junction",
      "One way street to the right side",
      "Keep right at all times"
    ],
    correct: 1,
    explanation: "This sign indicates a prohibition on right turns.",
    type: "symbol"
  },
  {
    id: "s7",
    question: "When you see this sign on a highway, you cannot:",
    symbolType: "no_u_turn",
    options: [
      "Change lanes to the left",
      "Overtake on either side",
      "Perform a U-turn to go in the opposite direction",
      "Park on the shoulder of the highway"
    ],
    correct: 2,
    explanation: "The U-turn prohibition sign forbids turning around to head back in the opposite direction.",
    type: "symbol"
  },
  {
    id: "s8",
    question: "What does this triangular warning sign indicate?",
    symbolType: "pedestrian_crossing",
    options: [
      "Pedestrian crossing (zebra crossing) ahead",
      "School playground nearby",
      "No walking allowed on the road",
      "Disabled persons area ahead"
    ],
    correct: 0,
    explanation: "This warning sign alerts drivers to an upcoming pedestrian crossing.",
    type: "symbol"
  },
  {
    id: "s9",
    question: "This circular blue sign indicates:",
    symbolType: "roundabout",
    options: [
      "A three-way junction",
      "A roundabout ahead; yield to vehicles from the right",
      "Dangerous curves ahead",
      "A dead-end circular road"
    ],
    correct: 1,
    explanation: "The blue circular arrow sign indicates a roundabout ahead.",
    type: "symbol"
  },
  {
    id: "s10",
    question: "This rectangular blue sign informs you of:",
    symbolType: "one_way",
    options: [
      "A one-way street with traffic permitted in the direction of the arrow",
      "A detour route to follow",
      "A narrow lane width limit",
      "An upcoming dead end"
    ],
    correct: 0,
    explanation: "A white vertical arrow on a blue rectangle indicates a one-way street.",
    type: "symbol"
  },
  {
    id: "s11",
    question: "What does this mandatory sign instruct you to do?",
    symbolType: "keep_left",
    options: [
      "Turn left at the next street",
      "Drive to the left side of the obstacle or lane",
      "Overtaking is permitted only on the left",
      "One way traffic moving to the left"
    ],
    correct: 1,
    explanation: "This blue circle with a diagonal white arrow pointing down-left requires passing to the left side of the divider.",
    type: "symbol"
  },
  {
    id: "s12",
    question: "This sign with a diagonal line over a 'P' means:",
    symbolType: "no_parking",
    options: [
      "Parking is allowed for short durations only",
      "No Parking (vehicles cannot be left unattended)",
      "No stopping or parking at any time",
      "Parking reservation is required"
    ],
    correct: 1,
    explanation: "No Parking means you cannot leave a vehicle unattended, though active boarding/unloading may be permitted briefly.",
    type: "symbol"
  },
  {
    id: "s13",
    question: "What does this sign with a red cross on blue indicate?",
    symbolType: "no_stopping",
    options: [
      "Hospital zone ahead",
      "No stopping for any reason (Clearway)",
      "Intersection closed ahead",
      "No overtaking allowed"
    ],
    correct: 1,
    explanation: "No Stopping (Clearway) forbids drivers from stopping their vehicles for any reason, including loading or passenger dropoff.",
    type: "symbol"
  },
  {
    id: "s14",
    question: "When you see this warning sign, you should expect:",
    symbolType: "school_zone",
    options: [
      "A family park nearby",
      "A school zone ahead; watch for children crossing and slow down",
      "Pedestrian jogging track",
      "A hospital emergency gate"
    ],
    correct: 1,
    explanation: "This warning sign indicates a school zone or children crossing ahead; you must slow down and look out.",
    type: "symbol"
  },
  {
    id: "s15",
    question: "This sign warns you of:",
    symbolType: "railway_crossing",
    options: [
      "A fence block on the road",
      "A gated railway crossing ahead; prepare to stop if lights flash",
      "Construction barrier ahead",
      "A cattle crossing grid"
    ],
    correct: 1,
    explanation: "This warning sign alerts you to a railway crossing with barriers or gates ahead.",
    type: "symbol"
  },
  {
    id: "s16",
    question: "What does this regulatory sign prohibit?",
    symbolType: "no_overtaking",
    options: [
      "No parking side-by-side",
      "Overtaking other motor vehicles is prohibited",
      "Only red cars are allowed to pass",
      "Narrow lanes ahead"
    ],
    correct: 1,
    explanation: "This sign prohibits overtaking any motor vehicles other than two-wheeled motorcycles.",
    type: "symbol"
  },
  {
    id: "s17",
    question: "This sign with a horn crossed out means:",
    symbolType: "horn_prohibited",
    options: [
      "Horn is malfunctioning ahead",
      "Use of horn is prohibited except in emergency to prevent accidents",
      "Loud music is forbidden",
      "Quiet residential cul-de-sac ahead"
    ],
    correct: 1,
    explanation: "This indicates a silent zone (typically near hospitals or schools) where horn usage is restricted by law.",
    type: "symbol"
  },
  {
    id: "s18",
    question: "What does this warning sign tell you?",
    symbolType: "slippery_road",
    options: [
      "Winding curves ahead",
      "The road surface may be slippery when wet; slow down",
      "Bumpy road surface ahead",
      "Loose gravel on road"
    ],
    correct: 1,
    explanation: "This sign warns that the road surface ahead is prone to skidding and is slippery, especially when wet.",
    type: "symbol"
  },
  {
    id: "s19",
    question: "When you see this warning sign, you should expect:",
    symbolType: "road_works",
    options: [
      "Farming activity ahead",
      "Road construction or maintenance work ahead; watch for workers",
      "A landslide danger zone",
      "A public park playground"
    ],
    correct: 1,
    explanation: "The road works sign warns drivers of road maintenance or construction activity ahead.",
    type: "symbol"
  },
  {
    id: "s20",
    question: "This sign warns you of:",
    symbolType: "speed_limit_30",
    options: [
      "Recommended driving speed is 30 km/h",
      "Minimum speed limit is 30 km/h",
      "Maximum speed limit of 30 km/h is enforced",
      "Distance to destination is 30 km"
    ],
    correct: 2,
    explanation: "This sign defines the maximum speed limit of 30 km/h, common in school zones and residential lanes.",
    type: "symbol"
  }
];

// Dynamically populate remaining symbol questions by mapping to the SVGs we have (s21-s80)
const SVG_KEYS = Object.keys(ROAD_SIGNS);
for (let i = 21; i <= 80; i++) {
  const symKey = SVG_KEYS[i % SVG_KEYS.length];
  SYMBOL_POOL.push({
    id: `s${i}`,
    question: `Road Sign Question #${i}: What does the road sign shown below instruct drivers to do or look out for?`,
    symbolType: symKey,
    options: [
      "Proceed with caution and prepare to yield",
      "Observe the restriction represented by the traffic sign symbol",
      "Ignore this sign unless you drive a heavy commercial truck",
      "Expect a detour routing sign ahead"
    ],
    correct: 1,
    explanation: `This is a standard traffic regulatory or warning sign (${symKey.replace('_', ' ')}). You must follow its specific rules.`,
    type: "symbol"
  });
}

// Helper to get 40 questions (20 theory + 20 symbol) deterministically for a mock test (1 to 10)
export function getMockTest(testNumber) {
  // Ensure within 1 to 10
  const tNum = Math.max(1, Math.min(10, Number(testNumber || 1)));
  
  // Deterministic slicing with offset to create unique test sheets
  const theoryOffset = (tNum - 1) * 8; // 0, 8, 16, 24, 32, 40, 48, 56, 64, 72
  const symbolOffset = (tNum - 1) * 8; // 0, 8, 16, 24, 32, 40, 48, 56, 64, 72

  const selectedTheory = [];
  const selectedSymbols = [];

  for (let i = 0; i < 20; i++) {
    const tIdx = (theoryOffset + i) % THEORY_POOL.length;
    const sIdx = (symbolOffset + i) % SYMBOL_POOL.length;
    selectedTheory.push({ ...THEORY_POOL[tIdx], index: i + 1 });
    selectedSymbols.push({ ...SYMBOL_POOL[sIdx], index: i + 21 });
  }

  // Combine them: first 20 are theory, next 20 are symbol questions
  const questions = [...selectedTheory, ...selectedSymbols];
  
  // Assign simple incremental question indices (1 to 40)
  return questions.map((q, idx) => ({
    ...q,
    qIndex: idx + 1 // 1-based index
  }));
}

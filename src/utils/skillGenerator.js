export function generateSkills(selectedPackageIds, totalClasses = 0) {
  const skillSet = new Set();
  
  // Base skills for everyone
  skillSet.add("Pre-check & Safety Rules");
  skillSet.add("Road Signs & Signals");

  const packageSkills = [];

  selectedPackageIds.forEach(id => {
    if (id.includes('car-manual')) {
      skillSet.add("Clutch Control");
      skillSet.add("Manual Gear Shifting");
      skillSet.add("Hill Start (Manual)");
      skillSet.add("Reverse Parking");
      skillSet.add("Traffic Driving (Car)");
      packageSkills.push("Clutch Control", "Manual Gear Shifting", "Hill Start (Manual)", "Reverse Parking", "Traffic Driving (Car)");
    }
    if (id.includes('car-auto')) {
      skillSet.add("Auto Gear Shifting");
      skillSet.add("Hill Start (Auto)");
      skillSet.add("Reverse Parking");
      skillSet.add("Traffic Driving (Car)");
      packageSkills.push("Auto Gear Shifting", "Hill Start (Auto)", "Reverse Parking", "Traffic Driving (Car)");
    }
    if (id.includes('bike')) {
      skillSet.add("Motorcycle Balancing");
      skillSet.add("Figure 8 (Bike 8)");
      skillSet.add("Motorcycle Braking & Cornering");
      packageSkills.push("Motorcycle Balancing", "Figure 8 (Bike 8)", "Motorcycle Braking & Cornering");
    }
    if (id.includes('3w')) {
      skillSet.add("Three-Wheeler Balancing");
      skillSet.add("Three-Wheeler Reversing");
      skillSet.add("Traffic Driving (3W)");
      packageSkills.push("Three-Wheeler Balancing", "Three-Wheeler Reversing", "Traffic Driving (3W)");
    }
    if (id.includes('bus') || id.includes('lorry')) {
      skillSet.add("Heavy Vehicle Pre-check");
      skillSet.add("Air Brakes Control");
      skillSet.add("Wide Cornering");
      skillSet.add("Reversing with Side Mirrors");
      packageSkills.push("Heavy Vehicle Pre-check", "Air Brakes Control", "Wide Cornering", "Reversing with Side Mirrors");
    }
    if (id.includes('prime-mover')) {
      skillSet.add("Trailer Coupling / Uncoupling");
      skillSet.add("Prime Mover Reversing");
      skillSet.add("Air Brakes Control");
      packageSkills.push("Trailer Coupling / Uncoupling", "Prime Mover Reversing", "Air Brakes Control");
    }
  });

  let uniqueSkills = Array.from(skillSet);

  // If totalClasses is provided and greater than uniqueSkills length, pad with "Practice"
  if (totalClasses > uniqueSkills.length) {
    const practiceSkills = [];
    const practiceTopics = packageSkills.length > 0 ? packageSkills : ["General Driving"];
    let i = 0;
    while (uniqueSkills.length + practiceSkills.length < totalClasses) {
      practiceSkills.push(practiceTopics[i % practiceTopics.length] + " (Practice)");
      i++;
    }
    uniqueSkills = [...uniqueSkills, ...practiceSkills];
  } else if (totalClasses > 0 && totalClasses < uniqueSkills.length) {
    uniqueSkills = uniqueSkills.slice(0, totalClasses);
  }

  // Convert to array of objects with level = 0 (not started)
  return uniqueSkills.map(skillName => ({
    name: skillName,
    level: 0 // 0 = Not Started, 1 = Started, 2 = Mastered
  }));
}

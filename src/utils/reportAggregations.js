// Aggregation logic for Admin Reports Dashboard

/**
 * Filter data by common parameters (date range, instructor, vehicle)
 */
export const filterData = (data, filters, dateField = 'createdAt') => {
  return data.filter(item => {
    // Date Range Filter
    if (filters.startDate && item[dateField]) {
      const itemDate = item[dateField].split('T')[0];
      if (itemDate < filters.startDate) return false;
    }
    if (filters.endDate && item[dateField]) {
      const itemDate = item[dateField].split('T')[0];
      if (itemDate > filters.endDate) return false;
    }
    
    // Instructor Filter (for schedules or vehicles)
    if (filters.instructorId && item.instructorId && item.instructorId !== filters.instructorId) {
      return false;
    }
    
    // Vehicle Filter (for schedules)
    if (filters.vehicleId && item.vehicleId && item.vehicleId !== filters.vehicleId) {
      return false;
    }

    return true;
  });
};

/**
 * Students Aggregation
 */
export const getStudentMetrics = (studentsList, schedules, filters) => {
  const students = filterData(studentsList, filters);
  
  const total = students.length;
  const active = students.filter(s => s.status === 'approved' || s.status === 'active').length;
  const completed = students.filter(s => s.status === 'completed').length;
  
  // Growth over last 6 months
  const monthlyGrowth = {};
  students.forEach(s => {
    if (!s.createdAt) return;
    const month = s.createdAt.substring(0, 7); // YYYY-MM
    monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
  });

  const growthChartData = Object.keys(monthlyGrowth)
    .sort()
    .slice(-6)
    .map(m => ({
      name: new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      students: monthlyGrowth[m]
    }));

  return { total, active, completed, growthChartData, raw: students };
};

/**
 * Instructors Aggregation
 */
export const getInstructorMetrics = (instructorsList, schedules, filters) => {
  const instructors = instructorsList;
  const filteredSchedules = filterData(schedules, filters, 'date');

  const total = instructors.length;
  
  // Workload (sessions per instructor)
  const workload = {};
  instructors.forEach(i => workload[i.name || i.id] = 0);
  
  filteredSchedules.forEach(s => {
    if (s.instructorName && workload[s.instructorName] !== undefined) {
      workload[s.instructorName] += 1;
    }
  });

  const workloadChartData = Object.keys(workload).map(name => ({
    name,
    sessions: workload[name]
  })).sort((a, b) => b.sessions - a.sessions).slice(0, 5); // Top 5

  return { total, workloadChartData, raw: instructors };
};

/**
 * Vehicles Aggregation
 */
export const getVehicleMetrics = (vehicles, schedules, filters) => {
  const filteredVehicles = filterData(vehicles, filters);
  const filteredSchedules = filterData(schedules, filters, 'date');

  const total = filteredVehicles.length;
  const active = filteredVehicles.filter(v => v.status === 'active').length;

  // Usage by vehicle type
  const usage = {};
  filteredSchedules.forEach(s => {
    if (s.vehicleType) {
      usage[s.vehicleType] = (usage[s.vehicleType] || 0) + 1;
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];
  const usageChartData = Object.keys(usage).map((type, index) => ({
    name: type,
    value: usage[type],
    fill: COLORS[index % COLORS.length]
  }));

  return { total, active, usageChartData, raw: filteredVehicles };
};

/**
 * Payments Aggregation (Assuming payments collection exists, else mocking for now)
 */
export const getPaymentMetrics = (payments, filters) => {
  const filteredPayments = filterData(payments || [], filters);
  
  let totalIncome = 0;
  let pendingAmount = 0;

  const monthlyRevenue = {};

  filteredPayments.forEach(p => {
    const amount = parseFloat(p.amount || 0);
    if (p.status === 'completed' || p.status === 'paid') {
      totalIncome += amount;
      
      const month = p.createdAt ? p.createdAt.substring(0, 7) : new Date().toISOString().substring(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
    } else if (p.status === 'pending') {
      pendingAmount += amount;
    }
  });

  const revenueChartData = Object.keys(monthlyRevenue)
    .sort()
    .slice(-6)
    .map(m => ({
      name: new Date(m + '-01').toLocaleString('default', { month: 'short' }),
      revenue: monthlyRevenue[m]
    }));

  return { totalIncome, pendingAmount, revenueChartData, raw: filteredPayments };
};

/**
 * Schedules Aggregation
 */
export const getScheduleMetrics = (schedules, filters) => {
  const filteredSchedules = filterData(schedules, filters, 'date');

  const total = filteredSchedules.length;
  const completed = filteredSchedules.filter(s => s.status === 'completed').length;
  const cancelled = filteredSchedules.filter(s => s.status === 'cancelled').length;
  
  const now = new Date().toISOString().split('T')[0];
  const upcoming = filteredSchedules.filter(s => s.date >= now && s.status === 'scheduled').length;

  return { total, completed, cancelled, upcoming, raw: filteredSchedules };
};

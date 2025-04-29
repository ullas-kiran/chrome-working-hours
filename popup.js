// Populate minute dropdowns (0 to 59)
function populateMinutes(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.error(`Element with ID ${selectId} not found`);
    return;
  }
  for (let i = 0; i < 60; i++) {
    const option = document.createElement('option');
    option.value = i < 10 ? `0${i}` : i;
    option.text = i < 10 ? `0${i}` : i;
    select.appendChild(option);
  }
}

// Initialize minute dropdowns immediately
try {
  populateMinutes('effectiveMinutes');
  populateMinutes('loginMinutes');
  console.log('Minute dropdowns populated successfully');
} catch (error) {
  console.error('Error populating minute dropdowns:', error);
}

document.addEventListener('DOMContentLoaded', () => {
  let intervalId = null;

  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }

  function startCalculation() {
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Get input values
    const effectiveHours = document.getElementById('effectiveHours').value;
    const effectiveMinutes = document.getElementById('effectiveMinutes').value;
    const loginHours = document.getElementById('loginHours').value;
    const loginMinutes = document.getElementById('loginMinutes').value;
    const loginAmPm = document.getElementById('loginAmPm').value;

    // Reset invalid styles
    const selects = [document.getElementById('effectiveHours'), document.getElementById('effectiveMinutes'),
                    document.getElementById('loginHours'), document.getElementById('loginMinutes'),
                    document.getElementById('loginAmPm')];
    selects.forEach(select => select.classList.remove('invalid'));

    // Validate inputs
    const missingFields = [];
    if (effectiveHours === '') missingFields.push('Effective Hours');
    if (effectiveMinutes === '') missingFields.push('Effective Minutes');
    if (loginHours === '') missingFields.push('Last Login Hours');
    if (loginMinutes === '') missingFields.push('Last Login Minutes');
    if (loginAmPm === '') missingFields.push('Last Login AM/PM');

    if (missingFields.length > 0) {
      const errorMessage = `Please select: ${missingFields.join(', ')}`;
      alert(errorMessage);
      missingFields.forEach(field => {
        if (field.includes('Effective Hours')) document.getElementById('effectiveHours').classList.add('invalid');
        if (field.includes('Effective Minutes')) document.getElementById('effectiveMinutes').classList.add('invalid');
        if (field.includes('Last Login Hours')) document.getElementById('loginHours').classList.add('invalid');
        if (field.includes('Last Login Minutes')) document.getElementById('loginMinutes').classList.add('invalid');
        if (field.includes('Last Login AM/PM')) document.getElementById('loginAmPm').classList.add('invalid');
      });
      return;
    }

    // Convert inputs to numbers
    const effectiveHoursNum = parseInt(effectiveHours);
    const effectiveMinutesNum = parseInt(effectiveMinutes);
    const loginHoursNum = parseInt(loginHours);
    const loginMinutesNum = parseInt(loginMinutes);

    // Additional numeric validation
    if (isNaN(effectiveHoursNum) || isNaN(effectiveMinutesNum) || isNaN(loginHoursNum) || isNaN(loginMinutesNum)) {
      alert('Please ensure all time fields are valid numbers.');
      return;
    }

    // Convert effective time to seconds
    const effectiveTotalSeconds = effectiveHoursNum * 3600 + effectiveMinutesNum * 60;

    // Convert 12-hour login time to 24-hour
    let loginHours24 = loginHoursNum;
    if (loginAmPm === 'PM' && loginHoursNum !== 12) {
      loginHours24 += 12;
    } else if (loginAmPm === 'AM' && loginHoursNum === 12) {
      loginHours24 = 0;
    }

    // Set last login time (from input, e.g., 1:43 PM)
    const lastLoginDate = new Date(2025, 3, 29); // Month is 0-based (3 = April)
    lastLoginDate.setHours(loginHours24, loginMinutesNum, 0, 0);

    // Set first login time (from dashboard: 9:40 AM)
    const firstLoginDate = new Date(2025, 3, 29);
    firstLoginDate.setHours(9, 40, 0, 0);

    // Calculate Punchout Time (first login + 9 hours 25 minutes = 7:05 PM)
    const punchoutDate = new Date(firstLoginDate.getTime() + (9 * 60 * 60 + 25 * 60) * 1000);
    const punchoutHours = punchoutDate.getHours();
    const punchoutMinutes = punchoutDate.getMinutes();
    const punchoutAmPm = punchoutHours >= 12 ? 'PM' : 'AM';
    const punchoutHours12 = punchoutHours % 12 || 12;
    const punchoutTime = `29/04/2025, ${punchoutHours12.toString().padStart(2, '0')}:${punchoutMinutes < 10 ? '0' + punchoutMinutes : punchoutMinutes} ${punchoutAmPm}`;

    // Constants
    const mandatoryEffectiveSeconds = 8 * 3600; // 8 hours in seconds

    // Calculate historical gross hours from dashboard punches (up to 1:42 PM)
    const punchTimes = [
      { in: new Date(2025, 3, 29, 9, 40), out: new Date(2025, 3, 29, 9, 48) }, // 8m
      { in: new Date(2025, 3, 29, 10, 7), out: new Date(2025, 3, 29, 11, 20) }, // 1h 13m
      { in: new Date(2025, 3, 29, 11, 25), out: new Date(2025, 3, 29, 13, 42) }, // 2h 17m
    ];
    let historicalGrossSeconds = 0;
    punchTimes.forEach(punch => {
      historicalGrossSeconds += (punch.out - punch.in) / 1000;
    }); // 8m + 1h 13m + 2h 17m = 3h 38m = 13080 seconds

    // Update live clock every second
    function updateClock() {
      const now = new Date();
      const elapsedSecondsSinceLastLogin = Math.floor((now - lastLoginDate) / 1000);
      const totalEffectiveSeconds = effectiveTotalSeconds + elapsedSecondsSinceLastLogin;

      // Calculate Total Gross Hours Worked (historical + time since last login)
      const elapsedSecondsSinceLastPunch = Math.floor((now - new Date(2025, 3, 29, 13, 43)) / 1000);
      let totalGrossSeconds = historicalGrossSeconds + elapsedSecondsSinceLastPunch;

      // Cap gross hours at punchout time (7:05 PM)
      const maxGrossSeconds = (punchoutDate - firstLoginDate) / 1000; // 9h 25m = 33900 seconds
      if (totalGrossSeconds > maxGrossSeconds) {
        totalGrossSeconds = maxGrossSeconds;
      }

      // Calculate Remaining Time
      const remainingSeconds = mandatoryEffectiveSeconds - totalEffectiveSeconds;
      const remainingTimeText = remainingSeconds >= 0 ? formatTime(remainingSeconds) : `0h 00m 00s (exceeded by ${formatTime(Math.abs(remainingSeconds))})`;

      // Display Results
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = `
        <p>Remaining Time: <span>${remainingTimeText}</span></p>
        <p>Total Effective Hours Worked: <span>${formatTime(totalEffectiveSeconds)}</span></p>
        <p>Total Gross Hours Worked (First Login to Now): <span>${formatTime(totalGrossSeconds)}</span></p>
        <p>Punchout Time: <span>${punchoutTime}</span></p>
      `;
    }

    // Initial update
    updateClock();

    // Start live clock
    intervalId = setInterval(updateClock, 1000);
  }

  // Attach event listener to the Calculate button
  const calculateButton = document.getElementById('calculateButton');
  if (calculateButton) {
    calculateButton.addEventListener('click', startCalculation);
  } else {
    console.error('Calculate button not found');
  }
});
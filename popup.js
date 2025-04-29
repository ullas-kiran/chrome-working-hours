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

    // Set login time on current date (29/04/2025)
    const loginDate = new Date(2025, 3, 29); // Month is 0-based (3 = April)
    loginDate.setHours(loginHours24, loginMinutesNum, 0, 0);

    // Calculate Punchout Time (login + 4 hours 22 minutes)
    const punchoutDate = new Date(loginDate.getTime() + (4 * 60 * 60 + 22 * 60) * 1000);
    const punchoutHours = punchoutDate.getHours();
    const punchoutMinutes = punchoutDate.getMinutes();
    const punchoutAmPm = punchoutHours >= 12 ? 'PM' : 'AM';
    const punchoutHours12 = punchoutHours % 12 || 12;
    const punchoutTime = `29/04/2025, ${punchoutHours12.toString().padStart(2, '0')}:${punchoutMinutes < 10 ? '0' + punchoutMinutes : punchoutMinutes} ${punchoutAmPm}`;

    // Constants
    const mandatoryEffectiveSeconds = 8 * 3600; // 8 hours in seconds

    // Update live clock every second
    function updateClock() {
      const now = new Date();
      const elapsedSeconds = Math.floor((now - loginDate) / 1000);
      const totalEffectiveSeconds = effectiveTotalSeconds + elapsedSeconds;

      // Calculate Remaining Time
      const remainingSeconds = mandatoryEffectiveSeconds - totalEffectiveSeconds;
      const remainingTimeText = remainingSeconds >= 0 ? formatTime(remainingSeconds) : `0h 00m 00s (exceeded by ${formatTime(Math.abs(remainingSeconds))})`;

      // Display Results
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = `
        <p>Remaining Time: <span>${remainingTimeText}</span></p>
        <p>Total Effective Hours Worked: <span>${formatTime(totalEffectiveSeconds)}</span></p>
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
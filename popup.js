document.getElementById("calculateBtn").addEventListener("click", () => {
    const loginTime = document.getElementById("loginTime").value;
    const grossHours = document.getElementById("grossHours").value;
    const effectiveHours = document.getElementById("effectiveHours").value;
  
    if (!loginTime || !grossHours || !effectiveHours) {
      alert("Please enter all fields.");
      return;
    }
  
    const [loginHours, loginMinutes] = loginTime.split(":").map(Number);
    const loginDate = new Date();
    loginDate.setHours(loginHours, loginMinutes, 0, 0);
  
    // Convert gross and effective hours to minutes
    const [grossHoursValue, grossMinutesValue] = grossHours.split(":").map(Number);
    const grossTotalMinutes = grossHoursValue * 60 + grossMinutesValue;
  
    const [effectiveHoursValue, effectiveMinutesValue] = effectiveHours.split(":").map(Number);
    const effectiveTotalMinutes = effectiveHoursValue * 60 + effectiveMinutesValue;
  
    const grossTarget = 9 * 60; // 9 hours in minutes
    const effectiveTarget = 8 * 60; // 8 hours in minutes
  
    const grossRemaining = grossTarget - grossTotalMinutes;
    const effectiveRemaining = effectiveTarget - effectiveTotalMinutes;
  
    const grossEnd = new Date(loginDate.getTime() + grossRemaining * 60 * 1000);
    const effectiveEnd = new Date(loginDate.getTime() + effectiveRemaining * 60 * 1000);
  
    // Convert times to 12-hour format (Only for effective hours)
    function to12HourFormat(date) {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 12:00 instead of 0:00
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    }
  
    document.getElementById("results").innerHTML = `
      <strong>Gross Target (9h):</strong> ${Math.floor(grossRemaining / 60)}:${grossRemaining % 60} hours<br/>
      <strong>Effective Target (8h):</strong> ${to12HourFormat(effectiveEnd)}
    `;
  });
  
export function BirthdayCalendar() {
  const year = new Date().getFullYear();
  const month = 7;
  const birthdayDay = 25;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => `blank-${i}`);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div
      className="inline-block rounded-lg p-1.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(232,131,106,0.2)",
        backdropFilter: "blur(6px)",
        width: 92,
        fontFamily: "var(--font-outfit)",
      }}
    >
      <p
        className="mb-1 text-center"
        style={{ fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b09290", lineHeight: 1 }}
      >
        Aug {year}
      </p>

      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div
            key={index}
            className="text-center"
            style={{ fontSize: 6, color: "#6e6268", lineHeight: 1, paddingTop: 1 }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((blank) => (
          <div key={blank} style={{ height: 12 }} />
        ))}

        {days.map((day) => {
          const isBirthday = day === birthdayDay;
          return (
            <div
              key={day}
              className="relative flex items-center justify-center rounded-sm"
              style={{
                height: 12,
                fontSize: 7,
                background: isBirthday
                  ? "linear-gradient(135deg, rgba(232,131,106,0.4), rgba(196,96,74,0.3))"
                  : "transparent",
                border: isBirthday ? "1px solid rgba(232,131,106,0.5)" : "none",
                color: isBirthday ? "#f5f0eb" : "#6e6268",
                fontWeight: isBirthday ? 600 : 400,
                lineHeight: 1,
              }}
            >
              {day}
              {isBirthday && (
                <span className="absolute -right-1 -top-1.5" style={{ fontSize: 8, lineHeight: 1 }} title="Samatha's Birthday">
                  🎂
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

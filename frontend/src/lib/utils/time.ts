export function formatQuizDuration(milliseconds: number, formatType: 'colon' | 'text' = 'colon'): string {
  const safeMs = Math.abs(milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (formatType === 'text') {
    if (minutes === 0) return `${seconds} seconds`;
    return `${minutes} minutes ${seconds} seconds`;
  }

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

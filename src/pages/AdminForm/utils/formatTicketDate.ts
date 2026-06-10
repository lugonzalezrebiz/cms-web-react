const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatTicketDate = (iso: string): string => {
  const date = new Date(iso);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

export const formatTicketDateWithTime = (iso: string): string => {
  const date = new Date(iso);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${year} (${hours}:${minutes})`;
};

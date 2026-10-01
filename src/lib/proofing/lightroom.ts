/** File names without extensions, comma separated, for Lightroom's filename filter */
export const lightroomList = (names: string[]) => names.map((n) => n.replace(/\.[^.]+$/, '')).join(', ');

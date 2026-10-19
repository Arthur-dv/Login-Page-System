export type IconName = 'leaf' | 'email' | 'lock' | 'person' | 'eye' | 'eye-off' | 'arrow' | 'check' | 'exit';

export function Icon({ name }: { name: IconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'leaf' && <><path d="M12 22V10L4 5v9l8 5M12 14l8-5v9l-8 4M12 10V2" /></>}
    {name === 'email' && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>}
    {name === 'lock' && <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></>}
    {name === 'person' && <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}
    {(name === 'eye' || name === 'eye-off') && <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{name === 'eye-off' && <path d="m3 3 18 18" />}</>}
    {name === 'arrow' && <path d="M4 12h16m-6-6 6 6-6 6" />}
    {name === 'check' && <path d="m5 12 4 4L19 6" />}
    {name === 'exit' && <><path d="M9 4H4v16h5m6-12 4 4-4 4M9 12h10" /></>}
  </svg>;
}

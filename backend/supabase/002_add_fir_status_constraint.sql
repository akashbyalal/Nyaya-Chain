alter table public.firs drop constraint if exists firs_status_check;

alter table public.firs add constraint firs_status_check
  check (status in ('Registered', 'Under Review', 'Investigation Open', 'Evidence Pending', 'Charge Sheet Filed', 'Closed'));

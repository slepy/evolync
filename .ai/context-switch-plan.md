# Plan: Multi-School Membership + Owner/User Context

Wprowadzamy wieloszkolne członkostwo dla jednego konta. Start aplikacji: priorytet owner dashboard, a jeśli brak organizacji to user dashboard. Zmiana aktywnego kontekstu szkoły tylko przez HeaderSelector na dashboardach organization i user.

**Steps**

1. Przebudować store na `schoolMemberships[]` + `activeMembershipId` i selektor aktywnego membership.
2. W auth sync pobierać wszystkie aktywne memberships (usunąć single record assumptions).
3. Dodać cache lokalny dla listy memberships i aktywnego membership, z migracją ze starego klucza.
4. Dodać HeaderSelector na user dashboard i organization dashboard do zmiany kontekstu.
5. Usunąć istniejący context switch z SchoolDashboardComponent dla ownera (HeaderSelector nie może być dostępny na school dashboard).
6. Uporządkować school dashboard: usunąć fallback do pierwszej szkoły i walidować schoolId.
7. Zrefaktorować user screens (payments, attendance, events, orders) na aktywny membership.
8. Zachować granicę domenową: owner nie jest automatycznie memberem swoich szkół; może być memberem innej szkoły.
9. Przetestować offline-first, przełączanie kontekstu oraz role matrix owner/user.

**Relevant files**

- /Users/andrzejziemba/projects/evolync/src/store/index.ts
- /Users/andrzejziemba/projects/evolync/src/modules/auth/hooks/useAuth.ts
- /Users/andrzejziemba/projects/evolync/app/index.tsx
- /Users/andrzejziemba/projects/evolync/app/user/dashboard.tsx
- /Users/andrzejziemba/projects/evolync/src/modules/organization/components/Dashboard.tsx
- /Users/andrzejziemba/projects/evolync/src/modules/core/components/HeaderCenterContent.tsx
- /Users/andrzejziemba/projects/evolync/src/modules/dashboard/components/SchoolDashboard.tsx
- /Users/andrzejziemba/projects/evolync/app/user/payments.tsx
- /Users/andrzejziemba/projects/evolync/app/user/attendance.tsx
- /Users/andrzejziemba/projects/evolync/app/user/events.tsx
- /Users/andrzejziemba/projects/evolync/app/user/orders/index.tsx
- /Users/andrzejziemba/projects/evolync/app/user/orders/create.tsx
- /Users/andrzejziemba/projects/evolync/app/user/orders/[orderId].tsx
- /Users/andrzejziemba/projects/evolync/src/modules/school/services/joinSchoolService.ts

**Verification**

1. Brak błędów TypeScript po zmianie store/auth/HeaderSelector.
2. Routing startowy: owner -> organization dashboard, user without org -> user dashboard.
3. HeaderSelector jest dostępny tylko na dashboardach organization i user.
4. SchoolDashboardComponent dla ownera nie zawiera context switcha.
5. Zmiana kontekstu przez HeaderSelector odświeża dane user screens.
6. Zmiana kontekstu offline i po restarcie jest zachowana.
7. Join/approve flow dodaje nowe membership bez utraty poprzednich.

**Decisions**

- Priorytet startu: organization dashboard dla ownera.
- Gdy brak organizacji: user dashboard.
- Kontekst zmieniany wyłącznie przez HeaderSelector na dwóch dashboardach.
- Owner i member to osobne role domenowe.

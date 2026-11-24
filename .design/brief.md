# Design brief

Mode: product (an internal tool). Same brand system as the school attendance register.

- Audience: students on a phone during the registration window, course advisers at a desk, the HOD checking progress.
- Primary actions: student "Submit to adviser"; adviser "Approve".
- Concept: the paper course registration form. The printable form is the end product, so it is designed as a document: crest, school name, dotted fill-in fields, S/N table, three signature lines and a rubber stamp once approved.
- Defended decision: carryover and compulsory courses are ticked and locked before the student arrives. The only choices left are electives, and an elective that would break the 24 unit cap can't be ticked, with the reason shown under it.
- Voice: the words on a Nigerian polytechnic form. Matric number, level, carryover, credit units, course adviser, HOD.

## Tokens

Inherited from the attendance register (measured from bestpotech.edu.ng): green #2a7d2e, deep green #0f3d16, bright rule #16cb00, gold text #b45309, Montserrat and Roboto, 4px radius.
Status colours: approved green, awaiting amber, returned red, draft and not started slate. Every status also carries its word.

## Do not

- No gradients, glows or decorative shapes.
- No inline styles or scripts (the CSP meta tag blocks them).
- Keep the project note on every page while the crest is used.
- The printed form must fit one A4 page.

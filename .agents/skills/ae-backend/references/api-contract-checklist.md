# API Contract Checklist

Before finishing a backend change, verify:

1. Request fields and required values are accurate.
2. Response fields and error shapes still match the intended contract.
3. Auth or permission behavior is explicit.
4. Validation and edge cases are covered by tests or documented as unverified.
5. Data writes, migrations, or deletes have verification and rollback notes.
